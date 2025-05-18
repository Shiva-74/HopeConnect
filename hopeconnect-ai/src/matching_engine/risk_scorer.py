import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
import os

# This scaler would be for scaling features IF a model was trained to predict risk.
# For a rule-based score, we might not need a scaler from scikit-learn.
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'matching_model_components', 'risk_profile_scaler.joblib')

def calculate_basic_risk_score(age, comorbidities, max_age=100, max_comorbidities=5):
    """
    Calculates a basic risk score. Higher score means higher risk.
    Score from 0 to 1.
    - age_factor: Risk increases with age.
    - comorbidities_factor: Risk increases with number of comorbidities.
    """
    age_score = (age / max_age) ** 2  # Non-linear increase with age
    comorbidity_score = (comorbidities / max_comorbidities) if max_comorbidities > 0 else 0
    
    # Weights can be adjusted
    age_weight = 0.6
    comorbidity_weight = 0.4
    
    risk_score = (age_weight * age_score) + (comorbidity_weight * comorbidity_score)
    return min(max(risk_score, 0), 1) # Ensure score is between 0 and 1

def get_donor_risk_profile(donor_age, donor_comorbidities):
    """Calculates donor risk profile."""
    # In a real system, this would be more complex, considering specific conditions, lifestyle, etc.
    return calculate_basic_risk_score(donor_age, donor_comorbidities)

def get_recipient_risk_profile(recipient_age, recipient_comorbidities, urgency_score=0.5):
    """
    Calculates recipient risk profile. Urgency can also be factored in.
    A higher urgency might slightly offset a higher intrinsic risk if the need is dire.
    This function primarily calculates intrinsic risk. Urgency is handled in weighted scorer.
    """
    return calculate_basic_risk_score(recipient_age, recipient_comorbidities)


def assess_donor_health_for_incentives(donor_age, organ_type, comorbidities_count, lifestyle_factors=None, lab_results=None):
    """
    Assesses donor health to determine a quality score for incentives.
    Score 0-100 (higher is better).
    This is a simplified example.
    """
    score = 100

    # Age penalty (organ-specific)
    if organ_type == "Kidney":
        if donor_age > 60: score -= (donor_age - 60) * 1.5
        elif donor_age > 50: score -= (donor_age - 50) * 1.0
    elif organ_type == "Liver":
        if donor_age > 55: score -= (donor_age - 55) * 1.5
    elif organ_type == "Heart":
        if donor_age > 50: score -= (donor_age - 50) * 2.0
    
    # General age penalty
    if donor_age > 70: score -= 20
    elif donor_age < 20: score -= 5 # Very young might have developmental considerations

    # Comorbidities penalty
    score -= comorbidities_count * 10

    if lifestyle_factors:
        if lifestyle_factors.get("smoker", False):
            score -= 15
        
        alcohol = lifestyle_factors.get("alcohol_consumption", "low")
        if alcohol == "high": score -= 10
        elif alcohol == "moderate": score -= 5

        bmi = lifestyle_factors.get("bmi", 22)
        if bmi > 30: score -= 10
        elif bmi < 18.5: score -= 5

    if lab_results: # Example for Kidney
        if organ_type == "Kidney":
            creatinine = lab_results.get("creatinine")
            gfr = lab_results.get("gfr")
            if creatinine and creatinine > 1.2: score -= (creatinine - 1.2) * 20
            if gfr and gfr < 60: score -= (60 - gfr) * 0.5
    
    return max(0, min(score, 100))


if __name__ == '__main__':
    donor_age = 45
    donor_comorbidities = 0
    d_risk = get_donor_risk_profile(donor_age, donor_comorbidities)
    print(f"Donor Risk (Age: {donor_age}, Comorb: {donor_comorbidities}): {d_risk:.2f}")

    donor_age = 65
    donor_comorbidities = 2
    d_risk = get_donor_risk_profile(donor_age, donor_comorbidities)
    print(f"Donor Risk (Age: {donor_age}, Comorb: {donor_comorbidities}): {d_risk:.2f}")

    recipient_age = 50
    recipient_comorbidities = 1
    r_risk = get_recipient_risk_profile(recipient_age, recipient_comorbidities)
    print(f"Recipient Risk (Age: {recipient_age}, Comorb: {recipient_comorbidities}): {r_risk:.2f}")

    # Donor health for incentives
    health_score = assess_donor_health_for_incentives(
        donor_age=35,
        organ_type="Kidney",
        comorbidities_count=0,
        lifestyle_factors={"smoker": False, "alcohol_consumption": "low", "bmi": 22},
        lab_results={"creatinine": 0.9, "gfr": 95}
    )
    print(f"Donor Health Score for Incentives: {health_score:.2f}")

    health_score_less_ideal = assess_donor_health_for_incentives(
        donor_age=58,
        organ_type="Kidney",
        comorbidities_count=1,
        lifestyle_factors={"smoker": True, "alcohol_consumption": "high", "bmi": 31},
        lab_results={"creatinine": 1.3, "gfr": 55}
    )
    print(f"Donor Health Score for Incentives (Less Ideal): {health_score_less_ideal:.2f}")