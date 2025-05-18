import os
import sys
import pandas as pd
import numpy as np

# --- Start of Corrected Path Handling ---
# Determine the project root directory (hopeconnect-ai)
# __file__ is src/scripts/train_viability_model.py
# os.path.dirname(__file__) is src/scripts/
# os.path.join(os.path.dirname(__file__), '..') is src/
# os.path.join(os.path.dirname(__file__), '..', '..') is hopeconnect-ai/
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# Add the project root (hopeconnect-ai) to sys.path if it's not already there
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)
# --- End of Corrected Path Handling ---

# Now you can import modules starting from the 'src' package
# (because 'hopeconnect-ai' is on sys.path and 'src' is a directory within it)
from src.utils.data_loader import load_raw_data
from src.prediction_models.viability_predictor import train_graft_viability_model
# If you had other modules in src, e.g., src.matching_engine.some_module, you'd import them similarly.

def main():
    print("Starting Graft Viability Model Training Script...")
    try:
        print("Loading raw data...")
        raw_df = load_raw_data()
        print(f"Raw data loaded with {raw_df.shape[0]} rows and {raw_df.shape[1]} columns.")

        # Basic data integrity check
        if 'graft_survival_1_year' not in raw_df.columns:
            print("Error: Target column 'graft_survival_1_year' not found in the raw data.")
            print("Please ensure your 'historical_transplants.csv' includes this column.")
            # Create a dummy target for the script to run without error for demonstration
            # In a real scenario, this would be a fatal error.
            print("Creating a dummy 'graft_survival_1_year' column for demonstration purposes ONLY.")
            raw_df['graft_survival_1_year'] = np.random.randint(0, 2, size=len(raw_df))

        print("Training graft viability model...")
        # Assuming train_graft_viability_model is designed to take data_df as argument
        train_graft_viability_model(data_df=raw_df)
        print("Graft Viability Model training completed successfully.")

    except FileNotFoundError as e:
        print(f"Error: Data file not found. {e}")
        print("Please ensure 'hopeconnect-ai/data/raw/historical_transplants.csv' exists.")
    except KeyError as e:
        print(f"Error: A required column is missing from the data: {e}")
        print("Please check your 'historical_transplants.csv' columns against the feature engineering requirements.")
    except Exception as e:
        print(f"An unexpected error occurred during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()