from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import pandas as pd
import numpy as np
import os

# -----------------------------------
# FLASK SETUP
# -----------------------------------

app = Flask(__name__, static_folder="static", template_folder="templates")

# -----------------------------------
# LOAD MODEL
# -----------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "saved_models", "click_model.keras")

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print("✅ Model loaded")

# -----------------------------------
# GLOBAL STORAGE
# -----------------------------------

LAST_RESULTS = None

# -----------------------------------
# MODEL FEATURES (TRAINING FORMAT)
# -----------------------------------

FEATURE_COLUMNS = [
    'Event_click_ad',
    'Event_click_carrousel',
    'Event_phone_call',
    'Event_send_email',
    'Event_send_sms',
    'Category_Holidays',
    'Category_Jobs',
    'Category_Leisure',
    'Category_Motor',
    'Category_Phone',
    'Category_Real_State'
]

SEQUENCE_LENGTH = 5

# -----------------------------------
# ROUTES
# -----------------------------------

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/<page>.html')
def serve_pages(page):
    return render_template(f'{page}.html')

# -----------------------------------
# CREATE LSTM SEQUENCES
# -----------------------------------

def create_sequences(df):
    data = df[FEATURE_COLUMNS].values
    seq = []
    for i in range(len(data) - SEQUENCE_LENGTH + 1):
        seq.append(data[i:i+SEQUENCE_LENGTH])
    return np.array(seq)

# -----------------------------------
# 🔥 ULTRA AUTO DATASET ADAPTER
# -----------------------------------

def auto_adapter(df):

    # ---------- USER ID ----------
    if "UserId" in df.columns:
        df["user_id"] = df["UserId"]
    elif "ip" in df.columns:
        df["user_id"] = df["ip"]
    elif "device_id" in df.columns:
        df["user_id"] = df["device_id"]
    else:
        df["user_id"] = "Unknown"

    # ---------- EVENT ----------
    if "Event" not in df.columns:

        if "app" in df.columns:
            df["Event"] = "click_ad"

        elif "action_type" in df.columns:
            df["Event"] = df["action_type"]

        else:
            df["Event"] = "click_ad"

    # ---------- CATEGORY ----------
    if "Category" not in df.columns:

        if "app" in df.columns:
            df["Category"] = "Phone"

        elif "channel" in df.columns:
            df["Category"] = "Motor"

        else:
            df["Category"] = "Leisure"

    return df

# -----------------------------------
# API UPLOAD
# -----------------------------------

@app.route('/api/upload', methods=['POST'])
def api_upload():

    global LAST_RESULTS

    if 'dataset' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files['dataset']
    df = pd.read_csv(file)

    # 🔥 AUTO ADAPT DATASET
    df = auto_adapter(df)

    # One-hot encode
    df_encoded = pd.get_dummies(df, columns=["Event", "Category"])

    # Ensure all model columns exist
    for col in FEATURE_COLUMNS:
        if col not in df_encoded.columns:
            df_encoded[col] = 0

    df_encoded = df_encoded[FEATURE_COLUMNS]
    df_encoded = df_encoded.astype(np.float32)


    # Safety check (avoid all zero input)
    if df_encoded.sum().sum() == 0:
        return jsonify({
            "success": False,
            "message": "Dataset incompatible with trained model structure."
        })

    # Create sequences
    X_seq = create_sequences(df_encoded)

    predictions = model.predict(X_seq)
    preds_binary = (predictions.flatten() > 0.5).astype(int)

    result_df = df.iloc[SEQUENCE_LENGTH-1:].copy()
    result_df["Fake_Prediction"] = preds_binary
    result_df["Fraud_Confidence"] = predictions.flatten()

    LAST_RESULTS = result_df

    return jsonify({
        "success": True,
        "total_records": len(result_df),
        "fraud_detected": int(result_df["Fake_Prediction"].sum())
    })

# -----------------------------------
# DASHBOARD API
# -----------------------------------

@app.route('/api/dashboard')
def api_dashboard():

    global LAST_RESULTS

    if LAST_RESULTS is None:
        return jsonify({"total_clicks":0,"fraud_count":0,"risk_level":"UNKNOWN"})

    total = len(LAST_RESULTS)
    fraud = int(LAST_RESULTS["Fake_Prediction"].sum())

    ratio = fraud/total if total else 0

    risk="LOW"
    if ratio>0.3:
        risk="HIGH"
    elif ratio>0.1:
        risk="MEDIUM"

    return jsonify({
        "total_clicks": total,
        "fraud_count": fraud,
        "risk_level": risk
    })

# -----------------------------------
# ANALYSIS API
# -----------------------------------

@app.route('/api/analysis')
def api_analysis():

    global LAST_RESULTS

    if LAST_RESULTS is None:
        return jsonify({
            "campaigns":{"labels":[],"values":[]},
            "timeseries":{"timestamps":[],"fraud_counts":[]}
        })

    df = LAST_RESULTS.copy()

    fraud_df = df[df["Fake_Prediction"]==1]

    campaign_counts = fraud_df["Category"].value_counts()

    return jsonify({
        "campaigns":{
            "labels":campaign_counts.index.tolist(),
            "values":campaign_counts.values.tolist()
        },
        "timeseries":{
            "timestamps":list(range(len(df))),
            "fraud_counts":df["Fake_Prediction"].rolling(50).sum().fillna(0).tolist()
        }
    })

# -----------------------------------
# RESULTS API
# -----------------------------------

@app.route('/api/results')
def api_results():

    global LAST_RESULTS

    if LAST_RESULTS is None:
        return jsonify({"fraud_records":[]})

    fraud_rows = LAST_RESULTS[LAST_RESULTS["Fake_Prediction"]==1]

    records=[]

    for _,row in fraud_rows.iterrows():

        records.append({
            "user_id": row.get("user_id","Unknown"),
            "timestamp": str(row.get("Timestamp","")),
            "campaign": row.get("Category","Unknown"),
            "pattern":"LSTM Flagged",
            "confidence": float(row.get("Fraud_Confidence",0))
        })

    return jsonify({"fraud_records":records})

# -----------------------------------
# RUN
# -----------------------------------

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=10000)
