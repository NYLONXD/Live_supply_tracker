from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import numpy as np

app = FastAPI()
model = pickle.load(open("model/eta_model.pkl", "rb"))

class InputData(BaseModel):
    distance: float
    speed: float

@app.post("/predict")
def predict_eta(data: InputData):
    pred = model.predict([[data.distance, data.speed]])
    return {"eta_minutes": round(pred[0] * 60, 2)}
