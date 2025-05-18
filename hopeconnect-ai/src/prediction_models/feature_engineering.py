import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import numpy as np
import joblib
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
VIABILITY_PREPROCESSOR_PATH = os.path.join(MODEL_DIR, 'viability_preprocessor.joblib')

# Features for viability model (based on historical_transplants.csv)
VIAB_NUM_FEATURES = ['donor_age', 'recipient_age', 'donor_comorbidities', 'recipient_comorbidities',
                     'cold_ischemia_time_hours', 'distance_km', 'hla_mismatches_count'] # hla_mismatches_count will be engineered
VIAB_CAT_FEATURES = ['organ_type', 'donor_blood_type', 'recipient_blood_type']

# Define HLA columns for easier iteration
DONOR_HLA_COLS = ['donor_hla_a1', 'donor_hla_a2', 'donor_hla_b1', 'donor_hla_b2'] # Add DR if you have them
RECIPIENT_HLA_COLS = ['recipient_hla_a1', 'recipient_hla_a2', 'recipient_hla_b1', 'recipient_hla_b2'] # Add DR if you have them


def calculate_simple_hla_mismatches(row):
    """
    Calculates a simple count of HLA mismatches between donor and recipient.
    Assumes paired loci (e.g., A1/A2 for locus A).
    This is a simplified approach. Real HLA matching is more complex.
    It compares allele by allele for the defined loci.
    """
    mismatches = 0
    # Ensure we have the same number of donor and recipient HLA columns defined
    if len(DONOR_HLA_COLS) != len(RECIPIENT_HLA_COLS):
        # This indicates a configuration error in the column lists
        print("Warning: Donor and Recipient HLA column list lengths differ. Cannot accurately calculate mismatches.")
        return len(DONOR_HLA_COLS) # Return max possible mismatches as a penalty

    for i in range(len(DONOR_HLA_COLS)):
        donor_allele = row.get(DONOR_HLA_COLS[i])
        recipient_allele = row.get(RECIPIENT_HLA_COLS[i])

        # Handle potential NaN or missing values gracefully if necessary,
        # though ideally, data cleaning would handle this before.
        if pd.isna(donor_allele) or pd.isna(recipient_allele):
            mismatches += 1 # Count missing as a mismatch, or handle as per domain expertise
            continue

        if str(donor_allele).strip().upper() != str(recipient_allele).strip().upper():
            mismatches += 1
    return mismatches


def preprocess_for_viability_training(df):
    """
    Preprocesses the raw DataFrame for training the viability model.
    Handles feature engineering, encoding, and scaling.
    Returns the preprocessed DataFrame and the fitted preprocessor.
    """
    df_processed = df.copy()

    # 1. HLA Mismatch Calculation
    # Check if all required HLA columns are present
    required_hla_cols = DONOR_HLA_COLS + RECIPIENT_HLA_COLS
    missing_hla_cols = [col for col in required_hla_cols if col not in df_processed.columns]

    if not missing_hla_cols:
        print("Calculating HLA mismatches...")
        df_processed['hla_mismatches_count'] = df_processed.apply(calculate_simple_hla_mismatches, axis=1)
    else:
        print(f"Warning: Missing HLA columns for mismatch calculation: {missing_hla_cols}.")
        print("hla_mismatches_count will be filled with a default or random value.")
        # Fallback if HLA columns are missing (as in your previous warning)
        df_processed['hla_mismatches_count'] = df_processed.apply(
            lambda row: np.random.randint(0, len(DONOR_HLA_COLS) + 1), axis=1 # Random value up to max possible mismatches
        )
        print("Warning: 'hla_mismatches_count' created with random values due to missing HLA source columns. Implement proper calculation or ensure data has HLA columns.")


    # Drop rows with NaNs in key features after attempting to engineer them
    all_features_for_model = VIAB_NUM_FEATURES + VIAB_CAT_FEATURES # VIAB_NUM_FEATURES now includes 'hla_mismatches_count'
    
    # Ensure hla_mismatches_count is actually in VIAB_NUM_FEATURES if engineered here.
    # It is, as per the global definition.

    df_processed.dropna(subset=all_features_for_model, inplace=True)
    if df_processed.empty:
        raise ValueError("DataFrame became empty after dropping NaNs. Check your data and feature list for viability model.")

    # Define transformers
    numerical_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse_output=False)

    # Create preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, VIAB_NUM_FEATURES),
            ('cat', categorical_transformer, VIAB_CAT_FEATURES)
        ],
        remainder='passthrough'
    )

    X = df_processed[all_features_for_model]
    y = df_processed['graft_survival_1_year'] if 'graft_survival_1_year' in df_processed.columns else None

    if X.empty:
        raise ValueError("Feature set X is empty before fitting preprocessor. Check data and feature selection.")

    X_processed = preprocessor.fit_transform(X)
    feature_names = preprocessor.get_feature_names_out()
    X_processed_df = pd.DataFrame(X_processed, columns=feature_names, index=X.index)

    if y is not None:
        final_df = pd.concat([X_processed_df, y.reindex(X_processed_df.index)], axis=1) # Ensure y aligns with X_processed_df
    else:
        final_df = X_processed_df

    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
    joblib.dump(preprocessor, VIABILITY_PREPROCESSOR_PATH)
    print(f"Viability preprocessor saved to {VIABILITY_PREPROCESSOR_PATH}")

    return final_df, preprocessor


def preprocess_for_viability_prediction(input_data_df, preprocessor=None):
    """
    Preprocesses new input data (DataFrame) for viability prediction using a loaded preprocessor.
    """
    if preprocessor is None:
        if not os.path.exists(VIABILITY_PREPROCESSOR_PATH):
            raise FileNotFoundError(f"Viability preprocessor not found at {VIABILITY_PREPROCESSOR_PATH}. Train first.")
        preprocessor = joblib.load(VIABILITY_PREPROCESSOR_PATH)

    input_df_processed = input_data_df.copy()

    # Calculate hla_mismatches_count for prediction input if individual HLAs are provided
    # and the 'hla_mismatches_count' column itself isn't.
    if 'hla_mismatches_count' not in input_df_processed.columns:
        required_hla_cols = DONOR_HLA_COLS + RECIPIENT_HLA_COLS
        # Check if individual HLA columns are present in the input_data_df
        has_all_individual_hla_cols = all(col in input_df_processed.columns for col in required_hla_cols)

        if has_all_individual_hla_cols:
            print("Calculating HLA mismatches for prediction input...")
            input_df_processed['hla_mismatches_count'] = input_df_processed.apply(calculate_simple_hla_mismatches, axis=1)
        else:
            # If individual HLA columns are also missing for prediction, we have a problem.
            # The model was trained with 'hla_mismatches_count'.
            # We must provide it, e.g., as a direct input or set a default.
            print("Warning: 'hla_mismatches_count' and individual HLA source columns are missing in prediction input.")
            # Setting a default. This should align with how missing data was handled during training or be a specific input.
            input_df_processed['hla_mismatches_count'] = np.random.randint(0, len(DONOR_HLA_COLS) + 1) # Or a mean/median from training
            print(f"Defaulting 'hla_mismatches_count' to a random value for prediction.")


    # Ensure all other required columns are present, fill with defaults if appropriate, or raise error
    for col in VIAB_NUM_FEATURES + VIAB_CAT_FEATURES:
        if col not in input_df_processed.columns:
            if col in VIAB_NUM_FEATURES:
                input_df_processed[col] = 0 # Example: fill numeric with 0
            else: # CAT_FEATURES
                input_df_processed[col] = 'Unknown' # Example: fill categoric with 'Unknown'
            print(f"Warning: Column '{col}' was missing in prediction input and set to a default.")

    # Select only the features the preprocessor expects, in the correct order
    # The preprocessor was fitted on X which had columns VIAB_NUM_FEATURES + VIAB_CAT_FEATURES
    features_for_transform = [col for col in VIAB_NUM_FEATURES + VIAB_CAT_FEATURES if col in input_df_processed.columns]
    missing_for_transform = [col for col in VIAB_NUM_FEATURES + VIAB_CAT_FEATURES if col not in features_for_transform]
    if missing_for_transform:
        # This should ideally not happen if the defaults above are set correctly for all VIAB features
        raise ValueError(f"Still missing columns for preprocessor transform: {missing_for_transform}")

    X_to_transform = input_df_processed[VIAB_NUM_FEATURES + VIAB_CAT_FEATURES] # Ensure order matches preprocessor fitting

    X_processed = preprocessor.transform(X_to_transform)
    feature_names_out = preprocessor.get_feature_names_out()

    return pd.DataFrame(X_processed, columns=feature_names_out, index=input_df_processed.index)


if __name__ == '__main__':
    # Create dummy data similar to historical_transplants.csv for testing
    data = {
        'donor_id': [f'D{i:03}' for i in range(1, 21)],
        'recipient_id': [f'R{i:03}' for i in range(1, 21)],
        'organ_type': np.random.choice(['Kidney', 'Liver', 'Heart'], 20),
        'donor_age': np.random.randint(20, 70, 20),
        'donor_blood_type': np.random.choice(['O+', 'A-', 'B+', 'AB+'], 20),
        # HLA Columns for the dummy data
        'donor_hla_a1': np.random.choice(['A1', 'A2', 'A3'], 20),
        'donor_hla_a2': np.random.choice(['A11', 'A24', 'A29'], 20),
        'donor_hla_b1': np.random.choice(['B7', 'B8', 'B15'], 20),
        'donor_hla_b2': np.random.choice(['B27', 'B35', 'B44'], 20),
        'recipient_hla_a1': np.random.choice(['A1', 'A2', 'A3'], 20),
        'recipient_hla_a2': np.random.choice(['A11', 'A24', 'A30'], 20),
        'recipient_hla_b1': np.random.choice(['B7', 'B8', 'B50'], 20),
        'recipient_hla_b2': np.random.choice(['B27', 'B35', 'B51'], 20),
        'donor_comorbidities': np.random.randint(0, 3, 20),
        'recipient_age': np.random.randint(20, 70, 20),
        'recipient_blood_type': np.random.choice(['O+', 'A-', 'B+', 'AB+'], 20),
        'recipient_comorbidities': np.random.randint(0, 3, 20),
        'cold_ischemia_time_hours': np.random.uniform(2, 24, 20),
        'distance_km': np.random.uniform(50, 500, 20),
        'graft_survival_1_year': np.random.randint(0, 2, 20)
        # 'hla_mismatches_count' will now be calculated by the preprocessor
    }
    sample_df = pd.DataFrame(data)

    print("Original sample data (with individual HLA columns):")
    print(sample_df.head())

    processed_df_train, fitted_preprocessor = preprocess_for_viability_training(sample_df.copy())
    print("\nProcessed data for training (hla_mismatches_count should be present and calculated):")
    print(processed_df_train[['num__hla_mismatches_count', 'graft_survival_1_year']].head()) # Showing the engineered and target

    # Test prediction preprocessing
    sample_input_dict_pred = {
        'donor_age': 30, 'recipient_age': 40,
        'donor_comorbidities': 0, 'recipient_comorbidities': 1,
        'cold_ischemia_time_hours': 8, 'distance_km': 50,
        'organ_type': 'Kidney', 'donor_blood_type': 'A-', 'recipient_blood_type': 'A-',
        # For prediction, either provide hla_mismatches_count directly,
        # OR provide individual HLA columns for it to be calculated.
        'donor_hla_a1': 'A1', 'donor_hla_a2': 'A11', 'donor_hla_b1': 'B7', 'donor_hla_b2': 'B27',
        'recipient_hla_a1': 'A2', 'recipient_hla_a2': 'A24', 'recipient_hla_b1': 'B8', 'recipient_hla_b2': 'B35',
    }
    sample_input_df_pred = pd.DataFrame([sample_input_dict_pred])

    processed_input_pred = preprocess_for_viability_prediction(sample_input_df_pred.copy(), preprocessor=fitted_preprocessor)
    print("\nProcessed data for prediction (with individual HLAs provided for calculation):")
    print(processed_input_pred.filter(like='num__hla_mismatches_count').head())

    # Test case where hla_mismatches_count is directly provided for prediction
    sample_input_dict_pred_direct_hla_count = {**sample_input_dict_pred} # copy
    del sample_input_dict_pred_direct_hla_count['donor_hla_a1'] # remove individual HLAs
    # ... remove other individual HLAs ...
    sample_input_dict_pred_direct_hla_count['hla_mismatches_count'] = 3 # provide it directly
    sample_input_df_pred_direct_hla_count = pd.DataFrame([sample_input_dict_pred_direct_hla_count])
    
    # Remove the individual HLA columns for this test case, as we are providing the count directly
    for col in DONOR_HLA_COLS + RECIPIENT_HLA_COLS:
        if col in sample_input_df_pred_direct_hla_count.columns:
            del sample_input_df_pred_direct_hla_count[col]

    processed_input_pred_direct = preprocess_for_viability_prediction(sample_input_df_pred_direct_hla_count.copy(), preprocessor=fitted_preprocessor)
    print("\nProcessed data for prediction (hla_mismatches_count provided directly):")
    print(processed_input_pred_direct.filter(like='num__hla_mismatches_count').head())