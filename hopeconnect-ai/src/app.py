# hopeconnect-ai/src/app.py

import sys
import os
import joblib # Ensure this is at the top with other standard imports

# --- Start of Path Handling for app.py ---
# Add the project root (hopeconnect-ai) to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)
# --- End of Path Handling for app.py ---

from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
import pandas as pd
import numpy as np

# Corrected imports to be absolute from 'src'
from src.matching_engine.weighted_scorer import calculate_match_score
from src.matching_engine.risk_scorer import assess_donor_health_for_incentives
from src.prediction_models.viability_predictor import (
    predict_graft_survival,
    predict_organ_cold_survival_duration,
    GRAFT_VIABILITY_MODEL_PATH,
    get_max_cold_ischemia_time
)
from src.prediction_models.feature_engineering import VIABILITY_PREPROCESSOR_PATH
from src.matching_engine.distance_calculator import calculate_distance_km
# Import calculate_hla_mismatch from preprocessor at the top level if it's a core part of matching logic
from src.matching_engine.preprocessor import calculate_hla_mismatch as global_calculate_hla_mismatch


app = Flask(__name__)
CORS(app) # Enable CORS for all routes from all origins.
          # For production, restrict origins:
          # CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Initialize model variables
graft_viability_model = None
viability_preprocessor = None

# Load models and preprocessors once at startup
try:
    # Ensure these constants are imported and valid before trying to load
    if 'GRAFT_VIABILITY_MODEL_PATH' in globals() and GRAFT_VIABILITY_MODEL_PATH and \
       'VIABILITY_PREPROCESSOR_PATH' in globals() and VIABILITY_PREPROCESSOR_PATH:
        
        graft_viability_model = joblib.load(GRAFT_VIABILITY_MODEL_PATH)
        viability_preprocessor = joblib.load(VIABILITY_PREPROCESSOR_PATH)
        print(f"AI Models (graft_viability_model from {GRAFT_VIABILITY_MODEL_PATH}, viability_preprocessor from {VIABILITY_PREPROCESSOR_PATH}) loaded successfully.")
    else:
        raise FileNotFoundError("Model path constants are not correctly defined or imported.")

except FileNotFoundError as fnf_error:
    print(f"Warning: AI Model file not found: {fnf_error}")
    print("Endpoints relying on these models will use defaults or may fail.")
    # These path variables might not be defined if the import itself failed or they were None
    expected_model_path = globals().get('GRAFT_VIABILITY_MODEL_PATH', "GRAFT_VIABILITY_MODEL_PATH not defined/imported")
    expected_preprocessor_path = globals().get('VIABILITY_PREPROCESSOR_PATH', "VIABILITY_PREPROCESSOR_PATH not defined/imported")
    print(f"Expected model at: {expected_model_path}")
    print(f"Expected preprocessor at: {expected_preprocessor_path}")
except Exception as e:
    print(f"Critical Error loading AI models: {e}")
    print("Ensure models are trained and paths are correctly defined in their respective modules.")
    print("AI service may not function correctly.")


@app.route('/api/health', methods=['GET']) # Standardized prefix
def health_check():
    model_status = "loaded" if graft_viability_model and viability_preprocessor else "not loaded or error during load"
    return jsonify({"status": "AI service is healthy", "model_status": model_status}), 200

@app.route('/api/predict_viability', methods=['POST'])
def handle_predict_viability():
    if not graft_viability_model or not viability_preprocessor:
        return jsonify({"error": "Viability model or preprocessor not loaded. Service may be impaired."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input: No JSON data provided."}), 400

    try:
        required_features = [
            'donor_age', 'organ_type', 'donor_comorbidities', 'cold_ischemia_time_hours',
            'distance_km', 'donor_blood_type', 'recipient_blood_type', 'hla_mismatches_count',
            'recipient_age', 'recipient_comorbidities'
        ]
        for feature in required_features:
            if feature not in data:
                return jsonify({"error": f"Missing feature: {feature}"}), 400
            # Consider adding type checks for numeric fields here if they cause downstream issues
            # For example, ensuring 'donor_age' is a number before passing to the model.

        # predict_graft_survival expects a DataFrame. Create it from the single data dict.
        input_df = pd.DataFrame([data])
        prob = predict_graft_survival(input_df, model=graft_viability_model, preprocessor=viability_preprocessor)

        organ_info_for_cold_survival = {
            'organ_type': data['organ_type'],
            'donor_age': data.get('donor_age'), # .get is safer if a previous check missed it
            'donor_comorbidities': data.get('donor_comorbidities', 0)
        }
        max_survival_duration = predict_organ_cold_survival_duration(organ_info_for_cold_survival)

        return jsonify({
            "graft_survival_probability": float(prob),
            "estimated_max_cold_survival_duration_hours": float(max_survival_duration),
            "input_cold_ischemia_time_hours": float(data.get('cold_ischemia_time_hours', 0)) # Use .get for safety
        }), 200
    except ValueError as e: # Catches errors from pd.DataFrame or model prediction due to bad data
        app.logger.error(f"ValueError in predict_viability: {e}")
        return jsonify({"error": f"Invalid input data or model error: {str(e)}"}), 400
    except Exception as e:
        app.logger.error(f"Exception in predict_viability: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred during viability prediction."}), 500


@app.route('/api/match_organs', methods=['POST'])
def handle_match_organs():
    if not graft_viability_model or not viability_preprocessor:
        app.logger.warning("Match organs called but viability model/preprocessor not loaded. Viability scores will be default.")
        # Allow to proceed but with default viability, or return 503 like above.
        # For now, proceeding with default.

    data = request.get_json()
    if not data or "organ" not in data or "recipients" not in data:
        return jsonify({"error": "Invalid input: 'organ' and 'recipients' keys are required."}), 400

    organ_info = data["organ"]
    recipients_list = data["recipients"]
    logistics_info = data.get("logistics", {})

    required_organ_fields = ['organ_type', 'donor_age', 'donor_blood_type',
                             'donor_hla_a1', 'donor_hla_a2', 'donor_hla_b1', 'donor_hla_b2',
                             'donor_location_lat', 'donor_location_lon']
    for field in required_organ_fields:
        if field not in organ_info:
            return jsonify({"error": f"Missing field in organ data: {field}"}), 400
    organ_info.setdefault('donor_comorbidities', 0)

    match_results = []

    for recipient_info in recipients_list:
        recipient_id = recipient_info.get("recipient_id", f"Recipient_{np.random.randint(1000, 9999)}")

        required_recipient_fields = ['recipient_age', 'recipient_blood_type',
                                     'recipient_hla_a1', 'recipient_hla_a2', 'recipient_hla_b1', 'recipient_hla_b2',
                                     'recipient_location_lat', 'recipient_location_lon', 'urgency_score']
        missing_fields = [field for field in required_recipient_fields if field not in recipient_info]
        if missing_fields:
            match_results.append({
                "recipient_id": recipient_id, "score": 0.0,
                "error": f"Missing fields for recipient: {', '.join(missing_fields)}"
            })
            continue
        recipient_info.setdefault('recipient_comorbidities', 0)

        estimated_cit_str = logistics_info.get(recipient_id, {}).get("estimated_cold_ischemia_hours")
        estimated_cit = None
        if estimated_cit_str is not None:
            try:
                estimated_cit = float(estimated_cit_str)
            except ValueError:
                app.logger.warning(f"Invalid CIT format '{estimated_cit_str}' for recipient {recipient_id}. Treating as unknown.")


        graft_survival_prob = 0.5 # Default viability if not calculated

        # Attempt to calculate viability only if models are loaded and CIT is known
        can_predict_viability = graft_viability_model and viability_preprocessor and estimated_cit is not None

        if can_predict_viability:
            donor_hlas_list = [organ_info.get(f'donor_hla_{la}{n}', '') for la in ['a','b'] for n in ['1','2']]
            rec_hlas_list = [recipient_info.get(f'recipient_hla_{la}{n}', '') for la in ['a','b'] for n in ['1','2']]
            hla_mismatches_count = global_calculate_hla_mismatch(donor_hlas_list, rec_hlas_list)

            try: # Wrap float conversions in try-except
                dist_km = calculate_distance_km(
                    float(organ_info['donor_location_lat']), float(organ_info['donor_location_lon']),
                    float(recipient_info['recipient_location_lat']), float(recipient_info['recipient_location_lon'])
                )
                dist_km = 9999.0 if dist_km == np.inf else float(dist_km)

                viability_input_data = {
                    'donor_age': float(organ_info['donor_age']), 'organ_type': organ_info['organ_type'],
                    'donor_comorbidities': int(organ_info['donor_comorbidities']),
                    'cold_ischemia_time_hours': float(estimated_cit), 'distance_km': dist_km,
                    'donor_blood_type': organ_info['donor_blood_type'],
                    'recipient_blood_type': recipient_info['recipient_blood_type'],
                    'hla_mismatches_count': int(hla_mismatches_count),
                    'recipient_age': float(recipient_info['recipient_age']),
                    'recipient_comorbidities': int(recipient_info['recipient_comorbidities'])
                }
                viability_input_df = pd.DataFrame([viability_input_data])
                graft_survival_prob = predict_graft_survival(viability_input_df, graft_viability_model, viability_preprocessor)
            except ValueError as ve:
                app.logger.error(f"ValueError preparing data or predicting viability for {recipient_id}: {ve}")
                graft_survival_prob = 0.0 # Penalize if data is bad for prediction
            except Exception as e:
                app.logger.error(f"Error predicting viability for recipient {recipient_id}: {e}")
                graft_survival_prob = 0.0 # Penalize on generic error
        elif estimated_cit is None:
             app.logger.warning(f"Estimated CIT not available for recipient {recipient_id}. Using default viability (0.5).")
        else: # Models not loaded
            app.logger.warning(f"Viability model/preprocessor not available. Using default viability (0.5) for {recipient_id}.")


        max_cit = get_max_cold_ischemia_time(organ_info['organ_type'])
        effective_cit_for_score = (max_cit + 1.0) if estimated_cit is None else float(estimated_cit)

        score = calculate_match_score(
            organ_data=organ_info, recipient_data=recipient_info,
            graft_survival_prob=float(graft_survival_prob),
            estimated_cold_ischemia_hours=effective_cit_for_score,
            max_allowable_cold_ischemia=float(max_cit)
        )

        match_results.append({
            "recipient_id": recipient_id, "score": float(score),
            "details": {
                "predicted_graft_survival_prob": float(graft_survival_prob),
                "estimated_cold_ischemia_hours": float(estimated_cit) if estimated_cit is not None else "N/A",
                "max_allowable_cold_ischemia_hours": float(max_cit)
            }
        })

    sorted_matches = sorted(match_results, key=lambda x: x.get("score", 0.0), reverse=True)
    return jsonify(sorted_matches), 200


@app.route('/api/assess_donor_health', methods=['POST'])
def handle_assess_donor_health():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input: No JSON data provided."}), 400

    try:
        # Explicitly get and convert expected types
        donor_age_str = data.get('donor_age')
        organ_type = data.get('organ_type') # String
        comorbidities_count_str = data.get('comorbidities_count') # Could be number or string
        lifestyle_factors = data.get('lifestyle_factors', {}) # Dict
        lab_results = data.get('lab_results', {}) # Dict

        if donor_age_str is None or organ_type is None: # comorbidities_count can default
            return jsonify({"error": "Missing required fields: 'donor_age' and 'organ_type'."}), 400

        try:
            donor_age = float(donor_age_str)
            comorbidities_count = int(comorbidities_count_str if comorbidities_count_str is not None else 0)
        except (ValueError, TypeError):
            return jsonify({"error": "'donor_age' must be a number and 'comorbidities_count' must be an integer."}), 400

        health_score = assess_donor_health_for_incentives(
            donor_age, organ_type, comorbidities_count, lifestyle_factors, lab_results
        )
        return jsonify({"donor_health_score": float(health_score)}), 200
    except Exception as e:
        app.logger.error(f"Exception in assess_donor_health: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred during donor health assessment."}), 500

if __name__ == '__main__':
    print("Starting Flask AI service...")

    # Check if path constants are defined and not None before using them
    graft_model_path_is_defined = 'GRAFT_VIABILITY_MODEL_PATH' in globals() and GRAFT_VIABILITY_MODEL_PATH is not None
    preprocessor_path_is_defined = 'VIABILITY_PREPROCESSOR_PATH' in globals() and VIABILITY_PREPROCESSOR_PATH is not None

    graft_model_path_actual = GRAFT_VIABILITY_MODEL_PATH if graft_model_path_is_defined else "Path Constant GRAFT_VIABILITY_MODEL_PATH Not Defined/Imported"
    preprocessor_path_actual = VIABILITY_PREPROCESSOR_PATH if preprocessor_path_is_defined else "Path Constant VIABILITY_PREPROCESSOR_PATH Not Defined/Imported"

    print(f"Attempting to use Graft viability model from: {graft_model_path_actual}")
    print(f"Attempting to use Viability preprocessor from: {preprocessor_path_actual}")

    models_startup_ok = True
    if graft_model_path_is_defined:
        if not os.path.exists(GRAFT_VIABILITY_MODEL_PATH): # Use the constant directly
            print(f"!! URGENT WARNING: Graft viability model file NOT FOUND at: {GRAFT_VIABILITY_MODEL_PATH}")
            models_startup_ok = False
    else:
        print("!! URGENT WARNING: GRAFT_VIABILITY_MODEL_PATH constant is not properly defined or imported.")
        models_startup_ok = False

    if preprocessor_path_is_defined:
        if not os.path.exists(VIABILITY_PREPROCESSOR_PATH): # Use the constant directly
            print(f"!! URGENT WARNING: Viability preprocessor file NOT FOUND at: {VIABILITY_PREPROCESSOR_PATH}")
            models_startup_ok = False
    else:
        print("!! URGENT WARNING: VIABILITY_PREPROCESSOR_PATH constant is not properly defined or imported.")
        models_startup_ok = False

    if not models_startup_ok:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!! AI SERVICE STARTING WITH MISSING MODELS/PREPROCESSORS OR PATH ISSUES. !!")
        print("!! Endpoints relying on these WILL FAIL or produce default/error values. !!")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    elif not (graft_viability_model and viability_preprocessor): # Check if loading actually succeeded
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!! AI Model loading failed despite paths being defined. Check previous errors. !!")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    else:
        print("Model and preprocessor paths are defined, files exist, and models loaded. Startup nominal.")

    app.run(host='0.0.0.0', port=5050, debug=True)