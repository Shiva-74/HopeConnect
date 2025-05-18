import pandas as pd
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
RAW_DATA_PATH = os.path.join(DATA_DIR, 'raw', 'historical_transplants.csv')
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, 'processed')

def load_raw_data():
    """Loads the raw historical transplant data."""
    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw data file not found at {RAW_DATA_PATH}. Please ensure it exists.")
    return pd.read_csv(RAW_DATA_PATH)

def save_processed_data(df, filename="processed_training_data.pkl"):
    """Saves processed data to the processed data directory."""
    if not os.path.exists(PROCESSED_DATA_DIR):
        os.makedirs(PROCESSED_DATA_DIR)
    df.to_pickle(os.path.join(PROCESSED_DATA_DIR, filename))
    print(f"Saved processed data to {os.path.join(PROCESSED_DATA_DIR, filename)}")

def load_processed_data(filename="processed_training_data.pkl"):
    """Loads processed data."""
    file_path = os.path.join(PROCESSED_DATA_DIR, filename)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Processed data file not found at {file_path}. Run preprocessing script first.")
    return pd.read_pickle(file_path)

if __name__ == '__main__':
    # Example usage:
    try:
        raw_df = load_raw_data()
        print("Raw data loaded successfully:")
        print(raw_df.head())
        # save_processed_data(raw_df, "sample_processed.pkl") # Example save
        # loaded_df = load_processed_data("sample_processed.pkl") # Example load
        # print("\nProcessed data loaded successfully:")
        # print(loaded_df.head())
    except FileNotFoundError as e:
        print(e)
    except Exception as e:
        print(f"An error occurred: {e}")