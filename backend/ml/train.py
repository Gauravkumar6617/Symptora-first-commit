from pathlib import Path
import pandas as pd
from sklearn.ensemble import RandomForestClassifier #ensembele 
from sklearn.metrics import accuracy_score,top_k_accuracy_score
from sklearn.model_selection import train_test_split


PROCESSED =Path("data/processed")
table= pd.read_csv(PROCESSED / "training_table.csv")

x= table.drop(columns=["disease"])
y= table["disease"]

X_train, X_test, y_train, y_test=train_test_split(
    x,y,test_size=0.2,stratify=y,random_state=42
)


#for log 
print("\nTraining cases:", len(X_train))
print("Test cases:", len(X_test))
print("Diseases in training set:", y_train.nunique())
print("Diseases in test set:", y_test.nunique())

model = RandomForestClassifier(n_estimators=200,random_state=42)
model.fit(X_train,y_train)
#to get what it train
print("\nModel trained with", len(model.estimators_), "trees")


predictions=model.predict(X_test)
accuracy=accuracy_score(y_test,predictions)
print("Test accuracy:", round(accuracy * 100, 1), "%")#to know accuracy

#to test possibilty
probabilities=model.predict_proba(X_test)
top3 = top_k_accuracy_score(y_test, probabilities, k=3, labels=model.classes_)
print("Top 3 accuracy:", round(top3 * 100, 1), "%")

# Which ones did it get wrong?
mistakes = [(true, pred) for true, pred in zip(y_test, predictions) if true != pred]
print("Mistakes:", len(mistakes), "out of", len(y_test))
for true, pred in mistakes:
    print(f"  actual: {true}  |  predicted: {pred}")