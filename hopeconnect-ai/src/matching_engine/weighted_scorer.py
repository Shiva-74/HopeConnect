# hopeconnect-ai/src/matching_engine/weighted_scorer.py

import numpy as np
# import os # Not strictly needed for this file's logic, but good for path below
# import sys # Needed for sys.path

# --- Start of Path Handling ---
import sys
import os
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')) # Goes up to hopeconnect-ai
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)
# --- End of Path Handling ---

# Corrected absolute imports from src
from src.matching_engine.preprocessor import check_blood_compatibility, calculate_hla_mismatch
from src.matching_engine.risk_scorer import get_donor_risk_profile, get_recipient_risk_profile
from src.matching_engine.distance_calculator import calculate_distance_km, distance_factor

# Define weights for different factors
WEIGHTS = {
    "blood_compatibility": 1.0,
    "hla_mismatch": 0.30,
    "donor_risk": 0.15,
    "recipient_risk": 0.10,
    "distance": 0.15,
    "graft_viability": 0.20,
    "recipient_urgency": 0.10,
}

def normalize_hla_score(mismatches, max_mismatches=4):
    return max(0, 1 - (mismatches / max_mismatches))

def normalize_risk_score(risk_val):
    return 1 - risk_val

def calculate_match_score(organ_data, recipient_data, graft_survival_prob, estimated_cold_ischemia_hours, max_allowable_cold_ischemia):
    # ... (rest of your calculate_match_score function - no changes needed inside it)

    # 1. Blood Type Compatibility (Prerequisite)
    blood_compatible = check_blood_compatibility(organ_data['donor_blood_type'], recipient_data['recipient_blood_type'])
    if not blood_compatible:
        return 0.0

    # 2. Cold Ischemia Time Check (Prerequisite)
    if estimated_cold_ischemia_hours > max_allowable_cold_ischemia:
        return 0.0

    # 3. HLA Mismatch Score
    # Ensure HLA keys are like 'donor_hla_a1', 'donor_hla_a2', etc.
    # or 'donor_hla_A1', 'donor_hla_A2' - be consistent with your data
    donor_hlas = [organ_data.get(f'donor_hla_a1', ''), organ_data.get(f'donor_hla_a2', ''),
                  organ_data.get(f'donor_hla_b1', ''), organ_data.get(f'donor_hla_b2', '')]
    recipient_hlas = [recipient_data.get(f'recipient_hla_a1', ''), recipient_data.get(f'recipient_hla_a2', ''),
                      recipient_data.get(f'recipient_hla_b1', ''), recipient_data.get(f'recipient_hla_b2', '')]
    
    # Filter out empty strings if HLAs might be missing, to prevent them from being counted as mismatches against non-empty strings
    donor_hlas = [h for h in donor_hlas if h]
    recipient_hlas = [h for h in recipient_hlas if h]
    # For a fair comparison if one list is now shorter, the calculate_hla_mismatch might need adjustment
    # or ensure all HLA fields are always present or have a consistent placeholder that calculate_hla_mismatch handles.
    # The current calculate_hla_mismatch expects lists of the same length.
    # If lists could be different lengths after filtering, this needs more robust logic
    # For now, we assume matching_engine.preprocessor.calculate_hla_mismatch handles it or that data is clean.


    hla_mismatches = calculate_hla_mismatch(donor_hlas, recipient_hlas)
    hla_score = normalize_hla_score(hla_mismatches)

    # 4. Donor Risk Score
    donor_risk = get_donor_risk_profile(organ_data['donor_age'], organ_data.get('donor_comorbidities', 0))
    donor_risk_factor = normalize_risk_score(donor_risk)

    # 5. Recipient Risk Score
    recipient_risk = get_recipient_risk_profile(recipient_data['recipient_age'], recipient_data.get('recipient_comorbidities', 0))
    recipient_risk_factor = normalize_risk_score(recipient_risk)

    # 6. Distance Score
    dist_km = calculate_distance_km(
        organ_data.get('donor_location_lat'), organ_data.get('donor_location_lon'), # Use .get for safety
        recipient_data.get('recipient_location_lat'), recipient_data.get('recipient_location_lon')
    )
    dist_score = distance_factor(dist_km, max_effective_distance=1000)

    # 7. Graft Viability Score
    viability_score = graft_survival_prob

    # 8. Recipient Urgency Score
    urgency_score = recipient_data.get('urgency_score', 0.5)

    score = (
        WEIGHTS["hla_mismatch"] * hla_score +
        WEIGHTS["donor_risk"] * donor_risk_factor +
        WEIGHTS["recipient_risk"] * recipient_risk_factor +
        WEIGHTS["distance"] * dist_score +
        WEIGHTS["graft_viability"] * viability_score +
        WEIGHTS["recipient_urgency"] * urgency_score
    )
    
    active_weights_sum = sum(WEIGHTS[k] for k in ["hla_mismatch", "donor_risk", "recipient_risk", "distance", "graft_viability", "recipient_urgency"])
    if active_weights_sum != 0 and active_weights_sum != 1.0 : # Normalize if weights don't sum to 1
         score = score / active_weights_sum


    return max(0.0, min(score, 1.0))


if __name__ == '__main__':
    sample_organ = {
        "organ_type": "Kidney", "donor_age": 35, "donor_blood_type": "O+",
        "donor_hla_a1": "A1", "donor_hla_a2": "A2", "donor_hla_b1": "B7", "donor_hla_b2": "B8",
        "donor_comorbidities": 0,
        "donor_location_lat": 40.7128, "donor_location_lon": -74.0060
    }
    sample_recipient1 = {
        "recipient_id": "R001", "recipient_age": 40, "recipient_blood_type": "O+",
        "recipient_hla_a1": "A1", "recipient_hla_a2": "A2", "recipient_hla_b1": "B7", "recipient_hla_b2": "B8",
        "recipient_comorbidities": 0,
        "recipient_location_lat": 40.7580, "recipient_location_lon": -73.9855,
        "urgency_score": 0.8
    }
    sample_recipient2 = {
        "recipient_id": "R002", "recipient_age": 55, "recipient_blood_type": "A+",
        "recipient_hla_a1": "A3", "recipient_hla_a2": "A11", "recipient_hla_b1": "B27", "recipient_hla_b2": "B35",
        "recipient_comorbidities": 2,
        "recipient_location_lat": 34.0522, "recipient_location_lon": -118.2437,
        "urgency_score": 0.6
    }
    sample_recipient3 = {
        "recipient_id": "R003", "recipient_age": 45, "recipient_blood_type": "B-",
        "recipient_hla_a1": "A1", "recipient_hla_a2": "A2", "recipient_hla_b1": "B7", "recipient_hla_b2": "B8",
        "recipient_comorbidities": 1,
        "recipient_location_lat": 40.7580, "recipient_location_lon": -73.9855,
        "urgency_score": 0.7
    }

    graft_prob1 = 0.90
    cit1 = 6
    graft_prob2 = 0.75
    cit2 = 15
    max_cit_kidney = 24

    score1 = calculate_match_score(sample_organ, sample_recipient1, graft_prob1, cit1, max_cit_kidney)
    score2 = calculate_match_score(sample_organ, sample_recipient2, graft_prob2, cit2, max_cit_kidney)
    score3 = calculate_match_score(sample_organ, sample_recipient3, 0.80, 8, max_cit_kidney)

    print(f"Match Score (Recipient 1 - Good): {score1:.3f}")
    print(f"Match Score (Recipient 2 - Poor): {score2:.3f}")
    print(f"Match Score (Recipient 3 - Incompatible Blood): {score3:.3f}")

    score_cit_exceeded = calculate_match_score(sample_organ, sample_recipient1, graft_prob1, 25, max_cit_kidney)
    print(f"Match Score (Recipient 1 - CIT Exceeded): {score_cit_exceeded:.3f}")