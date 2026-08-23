from flask import Flask, render_template, request
import joblib
import pandas as pd
import json
import os  # <-- Added os import

app = Flask(__name__)

# =========================================================
# LOAD TRAINED MODEL
# =========================================================

model = joblib.load("model/customer_churn_model.pkl")

print("Model loaded successfully!")


# =========================================================
# LOAD MODEL METRICS REPORT (produced by train_model.py)
# =========================================================

METRICS_PATH = "model/metrics_report.json"

if os.path.exists(METRICS_PATH):
    with open(METRICS_PATH, "r") as f:
        model_metrics = json.load(f)
    print("Model metrics report loaded successfully!")
else:
    model_metrics = None
    print("No metrics report found — run train_model.py to generate one.")


# =========================================================
# LOAD ANALYTICS DATASET
# =========================================================

DATASET_PATH = "dataset/customer_churn_cleaned.csv"

df = pd.read_csv(DATASET_PATH)
print("Analytics dataset loaded successfully!")
print("Dataset shape:", df.shape)
print("Dataset columns:")
print(df.columns.tolist())


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/predict-page")
def predict_page():
    return render_template("index.html")


# =========================================================
# CUSTOMER CHURN PREDICTION
# =========================================================

@app.route("/predict", methods=["POST"])
def predict():

    # Get data from form
    data = {
        "gender": request.form["gender"],
        "senior_citizen": request.form["senior_citizen"],
        "partner": request.form["partner"],
        "dependents": request.form["dependents"],
        "tenure_months": int(request.form["tenure_months"]),
        "phone_service": request.form["phone_service"],
        "multiple_lines": request.form["multiple_lines"],
        "internet_service": request.form["internet_service"],
        "online_security": request.form["online_security"],
        "online_backup": request.form["online_backup"],
        "device_protection": request.form["device_protection"],
        "tech_support": request.form["tech_support"],
        "streaming_tv": request.form["streaming_tv"],
        "streaming_movies": request.form["streaming_movies"],
        "contract": request.form["contract"],
        "paperless_billing": request.form["paperless_billing"],
        "payment_method": request.form["payment_method"],
        "monthly_charges": float(request.form["monthly_charges"]),
        "total_charges": float(request.form["total_charges"])
    }

    # Convert input into DataFrame
    input_df = pd.DataFrame([data])

    # Make prediction
    prediction = model.predict(input_df)[0]

    # Get churn probability
    probability = model.predict_proba(input_df)[0][1]

    if prediction == 1:
        result = "Customer is likely to Churn"
    else:
        result = "Customer is likely to Stay"

    return render_template(
        "index.html",
        prediction_result=result,
        probability=round(probability * 100, 2)
    )


# =========================================================
# ANALYTICS DASHBOARD
# =========================================================

@app.route("/dashboard")
def dashboard():

    # --------------------------------
    # KPI calculations
    # --------------------------------

    total_customers = len(df)

    churned_customers = int(df["churn"].sum())

    stayed_customers = total_customers - churned_customers

    churn_rate = round(
        (churned_customers / total_customers) * 100,
        2
    )

    # --------------------------------
    # Filter values
    # --------------------------------

    contracts = sorted(
        df["Contract"].dropna().unique().tolist()
    )

    internet_services = sorted(
        df["Internet Service"].dropna().unique().tolist()
    )

    genders = sorted(
        df["Gender"].dropna().unique().tolist()
    )

    senior_citizens = sorted(
        df["Senior Citizen"].dropna().unique().tolist()
    )

    # --------------------------------
    # Prepare raw customer data
    # for interactive filtering
    # --------------------------------

    dashboard_data = (
        df.fillna("")
          .to_dict(orient="records")
    )

    # --------------------------------
    # Render dashboard
    # --------------------------------

    return render_template(
        "dashboard.html",

        total_customers=total_customers,
        churned_customers=churned_customers,
        stayed_customers=stayed_customers,
        churn_rate=churn_rate,

        contracts=contracts,
        internet_services=internet_services,
        genders=genders,
        senior_citizens=senior_citizens,

        dashboard_data=dashboard_data,

        model_metrics=model_metrics
    )


# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)