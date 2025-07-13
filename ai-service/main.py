from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np

app = FastAPI()

# ✅ CORS MIDDLEWARE - Let frontend access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:3000"] for stricter
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load model and encoders
with open("model/eta_model.pkl", "rb") as f:
    model_data = pickle.load(f)

model = model_data["model"]
le_vehicle = model_data["le_vehicle"]
le_weather = model_data["le_weather"]
le_route = model_data["le_route"]
residual_std = model_data["residual_std"]

# ✅ Define request body schema
class ETAInput(BaseModel):
    distance: float
    base_speed: float
    traffic_factor: float
    vehicle: str
    weather: str
    route: str

# ✅ Predict endpoint
@app.post("/predict")
def predict_eta(input: ETAInput):
    try:
        # Encode categorical inputs
        input_data = [[
            input.distance,
            input.base_speed,
            input.traffic_factor,
            le_vehicle.transform([input.vehicle])[0],
            le_weather.transform([input.weather])[0],
            le_route.transform([input.route])[0],
        ]]

        # Predict ETA (in hours)
        eta = model.predict(input_data)[0]

        # Confidence interval using standard deviation
        lower = max(0, eta - 1.96 * residual_std)
        upper = eta + 1.96 * residual_std

        return {
            "estimated_eta_minutes": round(eta * 60, 2),
            "eta_range": {
                "lower": round(lower * 60, 2),
                "upper": round(upper * 60, 2)
            }
        }

    except Exception as e:
        return {"error": str(e)}
