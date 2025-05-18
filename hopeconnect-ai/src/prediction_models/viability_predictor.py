# hopeconnect-ai/src/prediction_models/viability_predictor.py

import xgboost as xgb
import pandas as pd
import numpy as np
import joblib
# import os # os is imported below for path handling
# import sys # sys is imported below for path handling
from sklearn.model_selection import train_test_split # Standard library import
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score # Standard library import

# --- Start of Path Handling ---
import sys
import os
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')) # Goes up to hopeconnect-ai
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)
# --- End of Path Handling ---

# Corrected absolute imports from src
# '.feature_engineering' becomes 'src.prediction_models.feature_engineering' because 'prediction_models' is a sub-package of 'src'
from src.prediction_models.feature_engineering import preprocess_for_viability_training, preprocess_for_viability_prediction, VIABILITY_PREPROCESSOR_PATH
from src.utils.data_loader import load_raw_data

# Use PROJECT_ROOT to define MODEL_DIR for robustness
MODEL_DIR = os.path.join(PROJECT_ROOT, 'models')
GRAFT_VIABILITY_MODEL_PATH = os.path.join(MODEL_DIR, 'graft_viability_model.joblib')
COLD_SURVIVAL_MODEL_PATH = os.path.join(MODEL_DIR, 'cold_survival_model.joblib') # Example for future

# Organ-specific max cold ischemia times (hours) - conceptual
ORGAN_MAX_CIT = {
    "Kidney": 24,
    "Liver": 12,
    "Heart": 6,
    "Lung": 6,
    "Pancreas": 18,
    "Intestine": 8
}

def get_max_cold_ischemia_time(organ_type):
    """Returns the maximum allowable cold ischemia time for an organ type."""
    return ORGAN_MAX_CIT.get(str(organ_type).capitalize(), 24) # Default if not found, ensure organ_type is string

def train_graft_viability_model(data_df=None):
    """
    Trains an XGBoost model to predict 1-year graft survival.
    """
    if data_df is None:
        data_df = load_raw_data() # load_raw_data is correctly imported

    # preprocess_for_viability_training is correctly imported
    processed_df, preprocessor = preprocess_for_viability_training(data_df)

    if 'graft_survival_1_year' not in processed_df.columns:
        raise ValueError("Target variable 'graft_survival_1_year' not found in processed data.")

    X = processed_df.drop('graft_survival_1_year', axis=1)
    y = processed_df['graft_survival_1_year']

    # Ensure X and y are not empty after processing
    if X.empty or y.empty:
        raise ValueError("Feature set X or target y is empty after preprocessing. Check data and preprocessing steps.")
    if len(X) != len(y):
        raise ValueError(f"Mismatch in lengths of X ({len(X)}) and y ({len(y)}) after preprocessing.")

    # Stratify might fail if there are too few samples of a class in a small dataset for y_test
    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    except ValueError as e:
        print(f"Warning: Stratification failed during train_test_split: {e}. Falling back to non-stratified split.")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if len(X_train) == 0 or len(X_test) == 0:
        # This can happen with very small datasets (e.g. 1 training sample if total is 5 and test_size=0.2 rounds up)
        # or if preprocessing somehow results in very few rows.
        print(f"Warning: Training set size: {len(X_train)}, Test set size: {len(X_test)}")
        if len(X_train) < 1 : # XGBoost typically needs at least 1 sample to train
             raise ValueError("Training set is empty or too small after split. Increase dataset size or adjust test_size.")
        if len(X_test) < 1 and (accuracy_score is not None): # If no test samples, evaluation is impossible
             print("Warning: Test set is empty after split. Evaluation metrics will not be meaningful.")
             # Create a dummy y_test and y_pred_binary if you want the code to run without error for metrics
             # but this is not ideal. Better to ensure test set has data.
             # For now, let the metrics functions handle it or error out if y_test is empty.


    model = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss', # or 'auc'
        use_label_encoder=False, # Suppress warning for newer XGBoost versions
        random_state=42,
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3
    )

    model.fit(X_train, y_train)

    # Evaluate model - only if y_test is not empty
    if len(y_test) > 0:
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        y_pred_binary = model.predict(X_test)

        print("\nGraft Viability Model Evaluation:")
        print(f"  Accuracy: {accuracy_score(y_test, y_pred_binary):.4f}")
        print(f"  ROC AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
        print(f"  F1 Score: {f1_score(y_test, y_pred_binary):.4f}")
    else:
        print("\nWarning: Test set was empty. Skipping model evaluation.")


    # Save model and preprocessor
    if not os.path.exists(MODEL_DIR): # MODEL_DIR is now defined using PROJECT_ROOT
        os.makedirs(MODEL_DIR)
    joblib.dump(model, GRAFT_VIABILITY_MODEL_PATH) # GRAFT_VIABILITY_MODEL_PATH is now defined using MODEL_DIR
    # Preprocessor is saved by preprocess_for_viability_training, its path VIABILITY_PREPROCESSOR_PATH is imported
    print(f"Graft viability model saved to {GRAFT_VIABILITY_MODEL_PATH}")
    print(f"Associated preprocessor is at {VIABILITY_PREPROCESSOR_PATH}")

    return model, preprocessor


def predict_graft_survival(input_data, model=None, preprocessor=None):
    """
    Predicts graft survival probability for new input data.
    input_data: A dictionary or DataFrame row of features.
    """
    if model is None:
        if not os.path.exists(GRAFT_VIABILITY_MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {GRAFT_VIABILITY_MODEL_PATH}. Train first.")
        model = joblib.load(GRAFT_VIABILITY_MODEL_PATH)

    if preprocessor is None:
        if not os.path.exists(VIABILITY_PREPROCESSOR_PATH): # VIABILITY_PREPROCESSOR_PATH is imported
            raise FileNotFoundError(f"Preprocessor not found at {VIABILITY_PREPROCESSOR_PATH}. Train first.")
        preprocessor = joblib.load(VIABILITY_PREPROCESSOR_PATH)

    if isinstance(input_data, dict):
        input_df = pd.DataFrame([input_data])
    elif isinstance(input_data, pd.DataFrame):
        input_df = input_data
    else:
        raise ValueError("input_data must be a dictionary or pandas DataFrame.")

    # preprocess_for_viability_prediction is correctly imported
    processed_input = preprocess_for_viability_prediction(input_df, preprocessor)

    try:
        prediction_proba = model.predict_proba(processed_input)[:, 1]
        return prediction_proba[0] # Probability of class 1 (survival)
    except ValueError as e:
        print(f"Error during prediction: {e}")
        # print("Processed input columns:", processed_input.columns)
        raise


def predict_organ_cold_survival_duration(organ_features):
    """
    Placeholder/Simplified: Predicts how long an organ can survive in cold storage.
    """
    organ_type = organ_features.get('organ_type', 'Unknown')
    base_max_cit = get_max_cold_ischemia_time(organ_type) # Uses the corrected get_max_cold_ischemia_time

    age_penalty = 0
    # Ensure donor_age is numeric before comparison
    donor_age_val = organ_features.get('donor_age')
    if isinstance(donor_age_val, (int, float)):
        if donor_age_val > 50:
            age_penalty = (donor_age_val - 50) * 0.1
    else:
        if donor_age_val is not None: # If present but not numeric, log a warning
            print(f"Warning: donor_age '{donor_age_val}' is not numeric, cannot calculate age_penalty.")


    comorbidity_penalty = 0
    # Ensure donor_comorbidities is numeric
    donor_comorbidities_val = organ_features.get('donor_comorbidities')
    if isinstance(donor_comorbidities_val, (int, float)):
        comorbidity_penalty = donor_comorbidities_val * 0.5
    else:
        if donor_comorbidities_val is not None:
            print(f"Warning: donor_comorbidities '{donor_comorbidities_val}' is not numeric, cannot calculate comorbidity_penalty.")


    estimated_survival_duration = base_max_cit - age_penalty - comorbidity_penalty
    return max(1.0, estimated_survival_duration) # Ensure at least 1 hour, use float for consistency


if __name__ == '__main__':
    # This block will run when the script is executed directly
    print("Running viability_predictor.py directly for training and testing...")
    try:
        # load_raw_data() will use its own path logic, which should be robust if
        # PROJECT_ROOT is on sys.path (as data_loader.py will also have it)
        raw_df_main = load_raw_data() # Use a different variable name to avoid confusion
        print("Raw data loaded successfully for direct script run.")

        trained_model_main, fitted_preprocessor_main = train_graft_viability_model(data_df=raw_df_main)
        print("Training complete for direct script run.")

        sample_input_for_prediction_main = {
            'donor_age': 45,
            'organ_type': 'Kidney',
            'donor_comorbidities': 0,
            'cold_ischemia_time_hours': 12,
            'distance_km': 150,
            'donor_blood_type': 'O+',
            'recipient_blood_type': 'O+',
            'hla_mismatches_count': 2,
            'recipient_age': 50,
            'recipient_comorbidities': 1
        }

        survival_prob_main = predict_graft_survival(
            sample_input_for_prediction_main,
            model=trained_model_main,
            preprocessor=fitted_preprocessor_main
        )
        print(f"\nPredicted graft survival probability for sample (direct script run): {survival_prob_main:.4f}")

        organ_details_main_k = {'organ_type': 'Kidney', 'donor_age': 55, 'donor_comorbidities': 1}
        cold_time_main_k = predict_organ_cold_survival_duration(organ_details_main_k)
        print(f"Predicted cold survival for {organ_details_main_k['organ_type']} (Age {organ_details_main_k['donor_age']}): {cold_time_main_k:.2f} hrs")

        organ_details_main_h = {'organ_type': 'Heart', 'donor_age': 30, 'donor_comorbidities': 0}
        cold_time_main_h = predict_organ_cold_survival_duration(organ_details_main_h)
        print(f"Predicted cold survival for {organ_details_main_h['organ_type']} (Age {organ_details_main_h['donor_age']}): {cold_time_main_h:.2f} hrs")

    except FileNotFoundError as e_main:
        print(f"Error in direct script run (FileNotFoundError): {e_main}.")
        print("Ensure 'historical_transplants.csv' is in 'hopeconnect-ai/data/raw/' and accessible.")
    except ValueError as e_main: # Catch ValueErrors from preprocessing or splitting
        print(f"Error in direct script run (ValueError): {e_main}.")
        import traceback
        traceback.print_exc()
    except Exception as e_main:
        print(f"An unexpected error occurred in direct script run: {e_main}")
        import traceback
        traceback.print_exc()