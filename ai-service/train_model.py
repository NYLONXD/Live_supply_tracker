"""
Enhanced ETA Model Training Script
Trains a machine learning model to predict delivery ETAs
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle
import os
import json
from datetime import datetime

def create_sample_data(n_samples=1000):
    """
    Generate realistic training data
    """
    np.random.seed(42)
    
    # Base patterns
    distances = np.random.uniform(5, 100, n_samples)  # 5-100 km
    base_speeds = np.random.choice([40, 50, 60, 70], n_samples)  # km/h
    traffic_factors = np.random.uniform(0.7, 1.3, n_samples)
    
    # Categorical features
    vehicles = np.random.choice(['Car', 'Bike', 'Truck'], n_samples, p=[0.5, 0.3, 0.2])
    weather = np.random.choice(['Clear', 'Rainy', 'Foggy'], n_samples, p=[0.6, 0.25, 0.15])
    routes = np.random.choice(['A', 'B', 'C'], n_samples, p=[0.4, 0.35, 0.25])
    
    # Calculate realistic ETAs with some noise
    eta = distances / (base_speeds * traffic_factors)
    
    # Add vehicle-specific adjustments
    vehicle_adjustment = np.where(vehicles == 'Truck', 1.2, 
                         np.where(vehicles == 'Bike', 0.9, 1.0))
    
    # Add weather-specific adjustments
    weather_adjustment = np.where(weather == 'Rainy', 1.15,
                         np.where(weather == 'Foggy', 1.25, 1.0))
    
    # Add route complexity
    route_adjustment = np.where(routes == 'A', 1.0,
                       np.where(routes == 'B', 1.1, 1.15))
    
    # Final ETA with all adjustments + noise
    eta = eta * vehicle_adjustment * weather_adjustment * route_adjustment
    eta = eta + np.random.normal(0, 0.05, n_samples)  # Add noise
    eta = np.maximum(eta, 0.1)  # Ensure positive
    
    # Create DataFrame
    data = pd.DataFrame({
        'distance': distances,
        'base_speed': base_speeds,
        'traffic_factor': traffic_factors,
        'vehicle': vehicles,
        'weather': weather,
        'route': routes,
        'eta': eta
    })
    
    return data

def train_model(data, model_type='linear'):
    """
    Train the ETA prediction model
    """
    print(f"\n{'='*60}")
    print(f"Training {model_type.upper()} model...")
    print(f"{'='*60}\n")
    
    # Encode categorical features
    le_vehicle = LabelEncoder()
    le_weather = LabelEncoder()
    le_route = LabelEncoder()
    
    data['vehicle_enc'] = le_vehicle.fit_transform(data['vehicle'])
    data['weather_enc'] = le_weather.fit_transform(data['weather'])
    data['route_enc'] = le_route.fit_transform(data['route'])
    
    # Prepare features and target
    X = data[['distance', 'base_speed', 'traffic_factor', 
              'vehicle_enc', 'weather_enc', 'route_enc']]
    y = data['eta']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Select model
    if model_type == 'linear':
        model = LinearRegression()
    elif model_type == 'random_forest':
        model = RandomForestRegressor(n_estimators=100, random_state=42)
    elif model_type == 'gradient_boost':
        model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    # Train model
    print("Training model...")
    model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate residuals
    residuals = y_test - y_pred
    residual_std = np.std(residuals)
    
    # Evaluate
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, 
                                 scoring='neg_mean_absolute_error')
    cv_mae = -cv_scores.mean()
    
    # Print results
    print("\n📊 Model Performance Metrics:")
    print(f"{'─'*50}")
    print(f"Mean Absolute Error (MAE):    {mae:.4f} hours ({mae*60:.2f} min)")
    print(f"Root Mean Squared Error:      {rmse:.4f} hours ({rmse*60:.2f} min)")
    print(f"R² Score:                     {r2:.4f}")
    print(f"Residual Std Dev:            {residual_std:.4f} hours")
    print(f"Cross-Val MAE (5-fold):      {cv_mae:.4f} hours")
    print(f"{'─'*50}\n")
    
    # Feature importance (if available)
    if hasattr(model, 'feature_importances_'):
        feature_names = ['distance', 'base_speed', 'traffic_factor', 
                        'vehicle', 'weather', 'route']
        importances = model.feature_importances_
        
        print("📈 Feature Importances:")
        print(f"{'─'*50}")
        for name, importance in sorted(zip(feature_names, importances), 
                                      key=lambda x: x[1], reverse=True):
            print(f"{name:20} {importance:.4f} {'█' * int(importance * 50)}")
        print()
    
    return model, le_vehicle, le_weather, le_route, residual_std, {
        'mae': mae,
        'rmse': rmse,
        'r2': r2,
        'cv_mae': cv_mae
    }

def save_model(model, le_vehicle, le_weather, le_route, residual_std, metrics, model_type):
    """
    Save the trained model and metadata
    """
    os.makedirs("model", exist_ok=True)
    
    # Save model
    model_path = "model/eta_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump({
            "model": model,
            "le_vehicle": le_vehicle,
            "le_weather": le_weather,
            "le_route": le_route,
            "residual_std": residual_std
        }, f)
    
    print(f"✅ Model saved to {model_path}")
    
    # Save metadata
    metadata = {
        "model_type": model_type,
        "trained_at": datetime.now().isoformat(),
        "metrics": {
            "mae_hours": metrics['mae'],
            "mae_minutes": metrics['mae'] * 60,
            "rmse_hours": metrics['rmse'],
            "r2_score": metrics['r2'],
            "cv_mae": metrics['cv_mae']
        },
        "features": {
            "vehicles": le_vehicle.classes_.tolist(),
            "weather": le_weather.classes_.tolist(),
            "routes": le_route.classes_.tolist()
        },
        "residual_std": residual_std
    }
    
    metadata_path = "model/model_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Metadata saved to {metadata_path}")
    
    return model_path, metadata_path

def main():
    print("""
    ╔════════════════════════════════════════════════════════╗
    ║     Supply Tracker - ETA Model Training Script        ║
    ╚════════════════════════════════════════════════════════╝
    """)
    
    # Generate training data
    print("📦 Generating training data...")
    data = create_sample_data(n_samples=2000)
    print(f"✅ Generated {len(data)} training samples\n")
    
    print("📊 Data Statistics:")
    print(data.describe())
    print()
    
    # Train different models and compare
    model_types = ['linear', 'random_forest', 'gradient_boost']
    results = {}
    
    for model_type in model_types:
        model, le_vehicle, le_weather, le_route, residual_std, metrics = train_model(
            data.copy(), model_type
        )
        results[model_type] = {
            'model': model,
            'encoders': (le_vehicle, le_weather, le_route),
            'residual_std': residual_std,
            'metrics': metrics
        }
    
    # Choose best model
    best_model_type = min(results.keys(), key=lambda k: results[k]['metrics']['mae'])
    print(f"\n🏆 Best Model: {best_model_type.upper()}")
    print(f"   MAE: {results[best_model_type]['metrics']['mae']*60:.2f} minutes\n")
    
    # Save best model
    best = results[best_model_type]
    save_model(
        best['model'],
        *best['encoders'],
        best['residual_std'],
        best['metrics'],
        best_model_type
    )
    
    print("\n✨ Training complete! Model ready for production.\n")

if __name__ == "__main__":
    main()