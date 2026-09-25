import re
from pathlib import Path

import pandas as pd

RAW = Path("data/raw")

# ---------- Piece 1: load the CSVs ----------
dataset = pd.read_csv(RAW / "dataset.csv")
severity = pd.read_csv(RAW / "Symptom-severity.csv")
description = pd.read_csv(RAW / "symptom_Description.csv")
precaution = pd.read_csv(RAW / "symptom_precaution.csv")

print("dataset:", dataset.shape)
print("severity:", severity.shape)
print("description:", description.shape)
print("precaution:", precaution.shape)

# ---------- Piece 2: diseases and duplicates ----------
print("\n--- Diseases ---")
print("Unique diseases:", dataset["Disease"].nunique())
counts = dataset["Disease"].value_counts()
print("Fewest rows for a disease:", counts.min())
print("Most rows for a disease:", counts.max())

print("\n--- Duplicates ---")
dup = dataset.duplicated().sum()
print("Duplicate rows:", dup)
print("Truly unique rows:", len(dataset) - dup)

# ---------- Piece 3: symptom names ----------
print("\n--- Symptoms ---")
symptom_cols = dataset.columns[1:]
all_symptoms = pd.unique(dataset[symptom_cols].values.ravel())
all_symptoms = [s for s in all_symptoms if pd.notna(s)]
print("Unique symptom names:", len(all_symptoms))

messy = [s for s in all_symptoms if s != s.strip() or " " in s.strip()]
print("Names with extra spaces:", len(messy))
print("Examples:", [repr(s) for s in messy[:8]])


# ---------- Piece 4: do the files agree? ----------
def clean_name(s):
    s = str(s).strip().lower()
    s = s.replace(" ", "_")
    s = re.sub(r"_+", "_", s)
    return s


print("\n--- Do the files agree? ---")
dataset_set = {clean_name(s) for s in all_symptoms}
severity_set = {clean_name(s) for s in severity[severity.columns[0]]}
print("Dataset symptoms after cleaning:", len(dataset_set))
print("Severity symptoms after cleaning:", len(severity_set))
print("Used in dataset but no severity weight:", sorted(dataset_set - severity_set))
print("In severity file but never used:", sorted(severity_set - dataset_set))

disease_set = {clean_name(d) for d in dataset["Disease"]}
desc_set = {clean_name(d) for d in description[description.columns[0]]}
prec_set = {clean_name(d) for d in precaution[precaution.columns[0]]}
print("Diseases missing a description:", sorted(disease_set - desc_set))
print("Diseases missing precautions:", sorted(disease_set - prec_set))