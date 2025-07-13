# Full correct version of train_model.py
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
import pickle
import os

# Sample data
data = pd.DataFrame({
    "distance": [10, 20, 30, 40],
    "base_speed": [40, 40, 40, 40],
    "traffic_factor": [1.0, 1.1, 0.9, 1.2],
    "vehicle": ["Truck", "Car", "Bike", "Car"],
    "weather": ["Clear", "Rainy", "Foggy", "Clear"],
    "route": ["A", "B", "A", "C"]
})

# ETA formula: time = distance / (speed * traffic)
data["eta"] = data["distance"] / (data["base_speed"] * data["traffic_factor"])

# Encode categorical features
le_vehicle = LabelEncoder()
le_weather = LabelEncoder()
le_route = LabelEncoder()

data["vehicle_enc"] = le_vehicle.fit_transform(data["vehicle"])
data["weather_enc"] = le_weather.fit_transform(data["weather"])
data["route_enc"] = le_route.fit_transform(data["route"])

X = data[["distance", "base_speed", "traffic_factor", "vehicle_enc", "weather_enc", "route_enc"]]
y = data["eta"]

model = LinearRegression()
model.fit(X, y)

# Compute residual std for confidence intervals
residuals = y - model.predict(X)
residual_std = np.std(residuals)

# Save everything
os.makedirs("model", exist_ok=True)
with open("model/eta_model.pkl", "wb") as f:
    pickle.dump({
        "model": model,
        "le_vehicle": le_vehicle,
        "le_weather": le_weather,
        "le_route": le_route,
        "residual_std": residual_std
    }, f)

print("✅ Model and encoders saved with residual_std.")
