import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, top_k_accuracy_score
from sklearn.model_selection import train_test_split

BASE = Path(__file__).resolve().parents[1]
PROCESSED = BASE / "data" / "processed"
ARTIFACT = BASE / "ml" / "artifact"

SEED = 42
SUBSETS_PER_ROW = 20  # extra partial-symptom rows made from each real row
PARTIAL_SIZES = [2, 3, 4]  # how many symptoms a real user might type

sample_symptoms = ["fatigue", "high_fever", "chills", "headache", "nausea"]


def make_model():
    # 100 trees with leaves of >= 3 rows: ~7x smaller than 200 full-depth trees, same accuracy
    return RandomForestClassifier(
        n_estimators=100, min_samples_leaf=3, random_state=SEED, n_jobs=-1
    )


def keep_random_symptoms(X, k, rng):
    """Copy of X where each row keeps only k of its symptoms (fewer if it has less)."""
    values = X.to_numpy().copy()
    for i, row in enumerate(values):
        present = np.flatnonzero(row)
        keep = rng.choice(present, size=min(k, len(present)), replace=False)
        row[:] = 0
        row[keep] = 1
    return pd.DataFrame(values, columns=X.columns)


def augment(X, y, rng):
    """Add rows with a random subset of symptoms, so the model learns from partial input."""
    values = X.to_numpy()
    new_rows, new_labels = [], []
    for row, label in zip(values, y):
        present = np.flatnonzero(row)
        for _ in range(SUBSETS_PER_ROW):
            k = rng.integers(1, len(present) + 1)
            keep = rng.choice(present, size=k, replace=False)
            new_row = np.zeros_like(row)
            new_row[keep] = 1
            new_rows.append(new_row)
            new_labels.append(label)
    X_aug = pd.concat([X, pd.DataFrame(new_rows, columns=X.columns)], ignore_index=True)
    y_aug = pd.concat([y, pd.Series(new_labels)], ignore_index=True)
    return X_aug, y_aug


def evaluate(model, X_test, y_test, label):
    """Accuracy on full rows and on rows cut down to a few symptoms."""
    rng = np.random.default_rng(SEED)  # same cut-down rows for every model
    print(f"\n--- {label} ---")
    cases = [("all symptoms", X_test)]
    cases += [(f"only {k} symptoms", keep_random_symptoms(X_test, k, rng)) for k in PARTIAL_SIZES]
    for name, X_case in cases:
        probs = model.predict_proba(X_case)
        top1 = accuracy_score(y_test, model.classes_[probs.argmax(axis=1)])
        top3 = top_k_accuracy_score(y_test, probs, k=3, labels=model.classes_)
        print(f"  {name:<16} top-1 {top1 * 100:5.1f} %   top-3 {top3 * 100:5.1f} %")


# ---------- Load ----------
table = pd.read_csv(PROCESSED / "training_table.csv")
X = table.drop(columns=["disease"])
y = table["disease"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=SEED
)
print("Training cases:", len(X_train), "| Test cases:", len(X_test), "| Diseases:", y.nunique())

# ---------- Baseline: full rows only ----------
baseline = make_model().fit(X_train, y_train)
evaluate(baseline, X_test, y_test, "Baseline (full rows only)")

# ---------- Augmented: full rows + partial subsets (train split only, no leakage) ----------
X_train_aug, y_train_aug = augment(X_train, y_train, np.random.default_rng(SEED))
print("\nAugmented training rows:", len(X_train_aug))
augmented = make_model().fit(X_train_aug, y_train_aug)
evaluate(augmented, X_test, y_test, "Augmented (partial-symptom training)")

mistakes = [(t, p) for t, p in zip(y_test, augmented.predict(X_test)) if t != p]
print("\nMistakes on full test rows:", len(mistakes), "out of", len(y_test))
for t, p in mistakes:
    print(f"  actual: {t}  |  predicted: {p}")

# ---------- Final model: augmented, trained on all data ----------
X_all, y_all = augment(X, y, np.random.default_rng(SEED))
final = make_model().fit(X_all, y_all)

sample = pd.DataFrame([[int(s in sample_symptoms) for s in X.columns]], columns=X.columns)
probs = final.predict_proba(sample)[0]
print("\nSample:", sample_symptoms)
for i in np.argsort(-probs)[:3]:
    print(f"  {final.classes_[i]:<30} {probs[i] * 100:5.1f} %")

# ---------- Save ----------
ARTIFACT.mkdir(parents=True, exist_ok=True)
joblib.dump(final, ARTIFACT / "model.joblib", compress=3)
(ARTIFACT / "symptoms.json").write_text(json.dumps(X.columns.tolist(), indent=2))
(ARTIFACT / "diseases.json").write_text(json.dumps(final.classes_.tolist(), indent=2))
print("\nSaved model and symptom list to", ARTIFACT)
