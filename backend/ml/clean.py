import re
from pathlib import Path

import pandas as pd

RAW = Path("data/raw")
PROCESSED = Path("data/processed")

# Corrections found during exploration: wrong name -> right name
SYMPTOM_FIXES = {"foul_smell_ofurine": "foul_smell_of_urine"}
DISEASE_FIXES = {"dimorphic_hemmorhoids(piles)": "dimorphic_hemorrhoids(piles)"}


def clean_name(s):
    s = str(s).strip().lower()
    s = s.replace(" ", "_")
    s = re.sub(r"_+", "_", s)
    return s


def clean_symptom(s):
    s = clean_name(s)
    return SYMPTOM_FIXES.get(s, s)


def clean_disease(d):
    d = clean_name(d)
    return DISEASE_FIXES.get(d, d)


# ---------- Load ----------
dataset = pd.read_csv(RAW / "dataset.csv")
severity = pd.read_csv(RAW / "Symptom-severity.csv")
description = pd.read_csv(RAW / "symptom_Description.csv")
precaution = pd.read_csv(RAW / "symptom_precaution.csv")

# ---------- Clean the main dataset ----------
dataset["Disease"] = dataset["Disease"].map(clean_disease)
symptom_cols = dataset.columns[1:]
for col in symptom_cols:
    dataset[col] = dataset[col].map(lambda v: clean_symptom(v) if pd.notna(v) else None)

# ---------- Clean the severity table ----------
severity.columns = ["symptom", "weight"]
severity["symptom"] = severity["symptom"].map(clean_symptom)
severity = severity[severity["symptom"] != "prognosis"]
severity = severity.groupby("symptom", as_index=False)["weight"].max()

# ---------- Clean description and precaution tables ----------
description.columns = ["disease", "description"]
description["disease"] = description["disease"].map(clean_disease)

precaution.columns = ["disease", "precaution_1", "precaution_2", "precaution_3", "precaution_4"]
precaution["disease"] = precaution["disease"].map(clean_disease)

# ---------- Verify: do the files agree now? ----------
dataset_symptoms = {s for s in pd.unique(dataset[symptom_cols].values.ravel()) if pd.notna(s)}
diseases = set(dataset["Disease"])

print("Symptoms:", len(dataset_symptoms), "| with weights:", len(severity))
print("Missing severity weight:", sorted(dataset_symptoms - set(severity["symptom"])))
print("Unused severity entries:", sorted(set(severity["symptom"]) - dataset_symptoms))
print("Missing description:", sorted(diseases - set(description["disease"])))
print("Missing precautions:", sorted(diseases - set(precaution["disease"])))
print("fluid_overload weight:", severity.loc[severity["symptom"] == "fluid_overload", "weight"].item())

# ---------- Build the 0/1 checklist table ----------
all_symptoms = sorted(dataset_symptoms)

rows = []
for _, r in dataset.iterrows():
    present = {v for v in r[symptom_cols] if pd.notna(v)}
    row = {s: int(s in present) for s in all_symptoms}
    row["disease"] = r["Disease"]
    rows.append(row)

table = pd.DataFrame(rows)
print("\nChecklist table:", table.shape)

# ---------- Remove duplicates ----------
table = table.drop_duplicates().reset_index(drop=True)
print("After removing duplicates:", table.shape)

# ---------- Safety check: same symptoms, different disease? ----------
conflicts = table.duplicated(subset=all_symptoms, keep=False).sum()
print("Conflicting rows:", conflicts)

counts = table["disease"].value_counts()
print("Unique cases per disease: min", counts.min(), "| max", counts.max())


# ---------- Save clean files ----------
PROCESSED.mkdir(parents=True, exist_ok=True)

table.to_csv(PROCESSED / "training_table.csv", index=False)
severity.to_csv(PROCESSED / "severity.csv", index=False)
description.to_csv(PROCESSED / "description.csv", index=False)
precaution.to_csv(PROCESSED / "precaution.csv", index=False)

print("\nSaved clean files to", PROCESSED)