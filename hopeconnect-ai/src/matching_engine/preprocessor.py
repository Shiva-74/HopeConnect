import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'matching_model_components')
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, 'matching_preprocessor.joblib')
SCALER_PATH = os.path.join(MODEL_DIR, 'risk_profile_scaler.joblib') # For risk scores if needed separately

# Define features - adjust these based on your final CSV and actual needs
NUMERICAL_FEATURES = ['donor_age', 'recipient_age', 'donor_comorbidities', 'recipient_comorbidities']
CATEGORICAL_FEATURES = ['organ_type', 'donor_blood_type', 'recipient_blood_type'] # HLA needs special handling
HLA_FEATURES_DONOR = ['donor_hla_a1', 'donor_hla_a2', 'donor_hla_b1', 'donor_hla_b2']
HLA_FEATURES_RECIPIENT = ['recipient_hla_a1', 'recipient_hla_a2', 'recipient_hla_b1', 'recipient_hla_b2']


def get_blood_type_compatibility():
    """Returns a dictionary of blood type compatibilities (Donor -> Recipient)."""
    return {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    }

def check_blood_compatibility(donor_bt, recipient_bt):
    """Checks if donor blood type is compatible with recipient blood type."""
    compatibility_map = get_blood_type_compatibility()
    return recipient_bt in compatibility_map.get(donor_bt, [])


def calculate_hla_mismatch(donor_hlas, recipient_hlas):
    """
    Calculates a simple HLA mismatch score.
    A more sophisticated calculation would consider specific allele mismatches and their immunogenicity.
    This is a simplified version: count of non-shared HLAs.
    Assumes hlas are lists/series of strings like ['A1', 'A2', 'B7', 'B8']
    """
    mismatches = 0
    # For simplicity, assume paired HLAs (e.g., A locus: donor_hla_a1, donor_hla_a2)
    # This example counts any difference as a mismatch.
    # A better approach would be to compare loci properly.
    
    # Example: Compare A locus (donor_hla_a1, donor_hla_a2) vs (recipient_hla_a1, recipient_hla_a2)
    # And B locus (donor_hla_b1, donor_hla_b2) vs (recipient_hla_b1, recipient_hla_b2)
    
    # Simplified: count unique HLAs in recipient not present in donor for shared loci
    # For a robust system, consult an immunologist for HLA matching rules.
    
    # For this example, let's assume donor_hlas and recipient_hlas are dicts:
    # donor_hlas = {'A': [donor_hla_a1, donor_hla_a2], 'B': [donor_hla_b1, donor_hla_b2]}
    # recipient_hlas = {'A': [rec_hla_a1, rec_hla_a2], 'B': [rec_hla_b1, rec_hla_b2]}
    
    # Simple direct comparison of provided strings
    if not isinstance(donor_hlas, list) or not isinstance(recipient_hlas, list):
        raise ValueError("HLA inputs must be lists of HLA strings.")
    if len(donor_hlas) != len(recipient_hlas): # e.g. both have 4 hla values
        # This indicates a structural problem or need for more robust logic
        # For now, let's assume they are comparable lists of same length
        return len(recipient_hlas) # Max mismatch if lengths differ

    mismatches = sum(1 for i in range(len(donor_hlas)) if donor_hlas[i] != recipient_hlas[i])
    return mismatches


def create_preprocessor(df_fit=None):
    """
    Creates a ColumnTransformer for preprocessing data.
    If df_fit is provided, it fits the preprocessor.
    """
    # This preprocessor is more for training a model that *uses* risk scores,
    # rather than generating them directly. Let's simplify for now.
    # The risk_scorer.py will handle risk calculations.
    # This preprocessor can be used for features fed into XGBoost for viability.

    # Let's define a preprocessor for features that might be used by a matching *model*
    # if we were to train one (e.g. to predict match quality score directly).
    # For the rule-based weighted scorer, direct feature values are often used.
    
    # This example is more geared towards preparing data for a model like XGBoost.
    numerical_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse_output=False)

    # For simplicity, we will assume HLA features are pre-calculated into a mismatch score
    # before hitting this generic preprocessor.
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, NUMERICAL_FEATURES),
            ('cat', categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder='passthrough' # Keep other columns (like IDs, pre-calculated scores)
    )
    
    if df_fit is not None:
        # df_fit should contain columns listed in NUMERICAL_FEATURES and CATEGORICAL_FEATURES
        # Ensure all columns are present
        required_cols = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
        missing_cols = [col for col in required_cols if col not in df_fit.columns]
        if missing_cols:
            raise ValueError(f"Missing columns in df_fit for preprocessor: {missing_cols}")
            
        preprocessor.fit(df_fit[required_cols])
        if not os.path.exists(MODEL_DIR):
            os.makedirs(MODEL_DIR)
        joblib.dump(preprocessor, PREPROCESSOR_PATH)
        print(f"Matching preprocessor saved to {PREPROCESSOR_PATH}")
    
    return preprocessor

def load_preprocessor():
    if not os.path.exists(PREPROCESSOR_PATH):
        raise FileNotFoundError(f"Preprocessor not found at {PREPROCESSOR_PATH}. Train first.")
    return joblib.load(PREPROCESSOR_PATH)

def preprocess_input_for_matching(data_dict):
    """
    Prepares a single organ/recipient pair for matching scoring.
    This is less about sklearn preprocessing and more about structuring.
    The weighted_scorer will use these raw/semi-processed values.
    """
    # Example:
    # data_dict = {
    # 'donor_age': 45, 'recipient_age': 50, ...
    # 'donor_blood_type': 'O+', 'recipient_blood_type': 'O+', ...
    # 'donor_hla_a1': 'A1', ...
    # }
    
    # Extract donor and recipient HLA lists
    donor_hlas = [data_dict.get(f, '') for f in HLA_FEATURES_DONOR]
    recipient_hlas = [data_dict.get(f, '') for f in HLA_FEATURES_RECIPIENT]
    
    processed = {
        'donor_age': data_dict.get('donor_age'),
        'recipient_age': data_dict.get('recipient_age'),
        'donor_comorbidities': data_dict.get('donor_comorbidities', 0),
        'recipient_comorbidities': data_dict.get('recipient_comorbidities', 0),
        'blood_compatible': check_blood_compatibility(
            data_dict.get('donor_blood_type'), 
            data_dict.get('recipient_blood_type')
        ),
        'hla_mismatches': calculate_hla_mismatch(donor_hlas, recipient_hlas),
        # Other features can be added directly
        'organ_type': data_dict.get('organ_type')
    }
    return processed

if __name__ == '__main__':
    # Example usage:
    sample_data_for_fit = pd.DataFrame({
        'donor_age': [45, 30, 55], 'recipient_age': [50, 40, 60],
        'donor_comorbidities': [0, 0, 1], 'recipient_comorbidities': [1, 0, 1],
        'organ_type': ['Kidney', 'Kidney', 'Liver'],
        'donor_blood_type': ['O+', 'A-', 'B+'],
        'recipient_blood_type': ['O+', 'A-', 'B+']
    })
    # create_preprocessor(sample_data_for_fit) # To save a sample preprocessor
    
    # Test blood compatibility
    print(f"O+ donor to A+ recipient: {check_blood_compatibility('O+', 'A+')}") # True
    print(f"A+ donor to O+ recipient: {check_blood_compatibility('A+', 'O+')}") # False

    # Test HLA mismatch
    d_hlas = ['A1', 'A2', 'B7', 'B8']
    r_hlas_match = ['A1', 'A2', 'B7', 'B8']
    r_hlas_mismatch2 = ['A1', 'A3', 'B7', 'B15']
    print(f"HLA Mismatches (0): {calculate_hla_mismatch(d_hlas, r_hlas_match)}")
    print(f"HLA Mismatches (2): {calculate_hla_mismatch(d_hlas, r_hlas_mismatch2)}")

    # Test preprocess_input_for_matching
    test_pair = {
        'donor_age': 45, 'recipient_age': 50, 'donor_comorbidities': 0, 'recipient_comorbidities': 1,
        'donor_blood_type': 'O+', 'recipient_blood_type': 'A+',
        'donor_hla_a1': 'A1', 'donor_hla_a2': 'A2', 'donor_hla_b1': 'B7', 'donor_hla_b2': 'B8',
        'recipient_hla_a1': 'A1', 'recipient_hla_a2': 'A3', 'recipient_hla_b1': 'B7', 'recipient_hla_b2': 'B15',
        'organ_type': 'Kidney'
    }
    processed_pair = preprocess_input_for_matching(test_pair)
    print("Processed pair for matching:")
    print(processed_pair)