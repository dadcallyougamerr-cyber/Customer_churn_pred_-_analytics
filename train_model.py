"""
train_model.py — v2
Trains and compares multiple models, tunes the best performer,
and saves both the model and a metrics report the dashboard can display.
"""

import json
import time

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, RandomizedSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# ------------------------------------------------------------
# Load dataset
# ------------------------------------------------------------

df = pd.read_csv("dataset/customer_churn_model_ready.csv")
print("Dataset loaded successfully!")
print("Shape:", df.shape)

X = df.drop("churn", axis=1)
y = df["churn"]

categorical_columns = X.select_dtypes(include=["object", "string"]).columns.tolist()
numerical_columns = X.select_dtypes(exclude=["object"]).columns.tolist()

preprocessor = ColumnTransformer(
    transformers=[
        ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical_columns),
        ("numerical", "passthrough", numerical_columns)
    ]
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

print("Training samples:", X_train.shape[0])
print("Testing samples:", X_test.shape[0])

# ------------------------------------------------------------
# STAGE 1 — Compare candidate models with 5-fold CV (ROC-AUC)
# ------------------------------------------------------------

candidates = {
    "Logistic Regression": LogisticRegression(
        max_iter=2000, class_weight="balanced", random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=500, max_depth=12, min_samples_split=5, min_samples_leaf=2,
        max_features="sqrt", class_weight="balanced", random_state=42, n_jobs=-1
    ),
    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=200, learning_rate=0.05, max_depth=3, random_state=42
    ),
    "Hist Gradient Boosting": HistGradientBoostingClassifier(
        max_iter=300, learning_rate=0.05, max_depth=6,
        class_weight="balanced", random_state=42
    ),
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
comparison_results = []

print("\n=== Stage 1: Model comparison (5-fold CV, ROC-AUC) ===")

for name, clf in candidates.items():
    pipe = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", clf)])
    start = time.time()
    scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
    elapsed = time.time() - start
    mean_auc = scores.mean()
    print(f"{name:28s} ROC-AUC = {mean_auc:.4f}  (+/- {scores.std():.4f})  [{elapsed:.1f}s]")
    comparison_results.append({"model": name, "cv_roc_auc": round(float(mean_auc), 4)})

best_name = max(comparison_results, key=lambda r: r["cv_roc_auc"])["model"]
print(f"\nBest candidate by CV ROC-AUC: {best_name}")

# ------------------------------------------------------------
# STAGE 2 — Hyperparameter tuning on the best candidate
# ------------------------------------------------------------

print(f"\n=== Stage 2: Tuning {best_name} ===")

if best_name == "Random Forest":
    base_clf = RandomForestClassifier(class_weight="balanced", random_state=42, n_jobs=-1)
    param_dist = {
        "classifier__n_estimators": [300, 500, 700],
        "classifier__max_depth": [8, 12, 16, None],
        "classifier__min_samples_split": [2, 5, 10],
        "classifier__min_samples_leaf": [1, 2, 4],
        "classifier__max_features": ["sqrt", "log2"],
    }
elif best_name == "Hist Gradient Boosting":
    base_clf = HistGradientBoostingClassifier(class_weight="balanced", random_state=42)
    param_dist = {
        "classifier__max_iter": [200, 300, 400],
        "classifier__learning_rate": [0.03, 0.05, 0.08, 0.1],
        "classifier__max_depth": [4, 6, 8, None],
        "classifier__l2_regularization": [0.0, 0.1, 0.5],
    }
elif best_name == "Gradient Boosting":
    base_clf = GradientBoostingClassifier(random_state=42)
    param_dist = {
        "classifier__n_estimators": [150, 200, 300],
        "classifier__learning_rate": [0.03, 0.05, 0.1],
        "classifier__max_depth": [2, 3, 4],
    }
else:  # Logistic Regression
    base_clf = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)
    param_dist = {
        "classifier__C": [0.01, 0.1, 1, 10],
    }

tuning_pipe = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", base_clf)])

search = RandomizedSearchCV(
    tuning_pipe,
    param_distributions=param_dist,
    n_iter=12,
    scoring="roc_auc",
    cv=cv,
    random_state=42,
    n_jobs=-1,
    verbose=0,
)

search.fit(X_train, y_train)
model = search.best_estimator_

print("Best params:", search.best_params_)
print("Best CV ROC-AUC after tuning:", round(search.best_score_, 4))

# ------------------------------------------------------------
# STAGE 3 — Final evaluation on held-out test set
# ------------------------------------------------------------

y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_proba)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
cm = confusion_matrix(y_test, y_pred).tolist()

print("\n=== Final Test Set Evaluation ===")
print("Model:", best_name)
print("Accuracy:", round(accuracy * 100, 2), "%")
print("ROC-AUC:", round(roc_auc, 4))
print("Precision (churn):", round(precision, 4))
print("Recall (churn):", round(recall, 4))
print("F1 (churn):", round(f1, 4))
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("Confusion Matrix:")
print(cm)

# ------------------------------------------------------------
# Save model + metrics report (dashboard reads this JSON)
# ------------------------------------------------------------

joblib.dump(model, "model/customer_churn_model.pkl")
print("\nModel saved to model/customer_churn_model.pkl")

metrics_report = {
    "best_model": best_name,
    "best_params": {k.replace("classifier__", ""): v for k, v in search.best_params_.items()},
    "comparison": sorted(comparison_results, key=lambda r: -r["cv_roc_auc"]),
    "test_metrics": {
        "accuracy": round(float(accuracy) * 100, 2),
        "roc_auc": round(float(roc_auc), 4),
        "precision_churn": round(float(precision), 4),
        "recall_churn": round(float(recall), 4),
        "f1_churn": round(float(f1), 4),
        "confusion_matrix": cm,
        "train_samples": int(X_train.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "total_samples": int(df.shape[0]),
        "churn_rate_pct": round(float(y.mean()) * 100, 2),
    }
}

with open("model/metrics_report.json", "w") as f:
    json.dump(metrics_report, f, indent=2)

print("Metrics report saved to model/metrics_report.json")
