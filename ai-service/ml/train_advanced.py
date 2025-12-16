"""
Advanced Model Training with XGBoost, LightGBM, and Neural Networks
"""

import pandas as pd
import numpy as np
import pickle
import json
import os
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Advanced models
import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow import keras
from keras import layers

class AdvancedETATrainer:
    def __init__(self, data_size=5000):
        self.data_size = data_size
        self.models = {}
        self.encoders = {}
        self.scaler = None
        self.feature_names = []
        
    def generate_realistic_data(self):
        """Generate realistic training data with temporal patterns"""
        print(f"📦 Generating {self.data_size} training samples...")
        
        np.random.seed(42)
        
        # Base features
        distances = np.random.lognormal(3, 0.8, self.data_size)  # Log-normal for realistic distribution
        distances = np.clip(distances, 5, 150)
        
        base_speeds = np.random.choice([40, 50, 60, 70, 80], self.data_size, 
                                      p=[0.1, 0.2, 0.4, 0.2, 0.1])
        
        traffic_factors = np.random.lognormal(0, 0.25, self.data_size)
        traffic_factors = np.clip(traffic_factors, 0.6, 2.5)
        
        # Categorical features
        vehicles = np.random.choice(['Car', 'Bike', 'Truck', 'Van'], 
                                   self.data_size, p=[0.5, 0.2, 0.2, 0.1])
        weather = np.random.choice(['Clear', 'Rainy', 'Foggy', 'Snowy'], 
                                   self.data_size, p=[0.6, 0.2, 0.15, 0.05])
        routes = np.random.choice(['A', 'B', 'C'], 
                                  self.data_size, p=[0.4, 0.35, 0.25])
        
        # Temporal features
        hours = np.random.randint(0, 24, self.data_size)
        days = np.random.randint(0, 7, self.data_size)
        
        # Calculate ETA with complex interactions
        eta = distances / (base_speeds * traffic_factors)
        
        # Vehicle adjustments
        vehicle_map = {'Car': 1.0, 'Bike': 0.85, 'Truck': 1.25, 'Van': 1.1}
        vehicle_factors = np.array([vehicle_map[v] for v in vehicles])
        
        # Weather adjustments
        weather_map = {'Clear': 1.0, 'Rainy': 1.2, 'Foggy': 1.35, 'Snowy': 1.5}
        weather_factors = np.array([weather_map[w] for w in weather])
        
        # Route complexity
        route_map = {'A': 1.0, 'B': 1.12, 'C': 1.18}
        route_factors = np.array([route_map[r] for r in routes])
        
        # Time-based adjustments (rush hour effect)
        rush_hour_effect = np.where(
            ((hours >= 7) & (hours <= 9)) | ((hours >= 17) & (hours <= 19)),
            1.3, 1.0
        )
        
        # Weekend effect (lighter traffic)
        weekend_effect = np.where(days >= 5, 0.9, 1.0)
        
        # Combined ETA
        eta = eta * vehicle_factors * weather_factors * route_factors * rush_hour_effect * weekend_effect
        
        # Add realistic noise
        noise = np.random.normal(0, 0.08, self.data_size)
        eta = eta * (1 + noise)
        eta = np.maximum(eta, 0.05)  # Minimum 3 minutes
        
        # Create DataFrame
        data = pd.DataFrame({
            'distance': distances,
            'base_speed': base_speeds,
            'traffic_factor': traffic_factors,
            'vehicle': vehicles,
            'weather': weather,
            'route': routes,
            'hour': hours,
            'day_of_week': days,
            'eta': eta
        })
        
        print(f"✅ Data generated with shape: {data.shape}")
        print(f"\n📊 ETA Statistics:")
        print(f"   Mean: {data['eta'].mean()*60:.2f} minutes")
        print(f"   Std:  {data['eta'].std()*60:.2f} minutes")
        print(f"   Min:  {data['eta'].min()*60:.2f} minutes")
        print(f"   Max:  {data['eta'].max()*60:.2f} minutes")
        
        return data
    
    def prepare_features(self, data):
        """Encode and scale features"""
        print("\n🔧 Preparing features...")
        
        df = data.copy()
        
        # Encode categorical features
        le_vehicle = LabelEncoder()
        le_weather = LabelEncoder()
        le_route = LabelEncoder()
        
        df['vehicle_enc'] = le_vehicle.fit_transform(df['vehicle'])
        df['weather_enc'] = le_weather.fit_transform(df['weather'])
        df['route_enc'] = le_route.fit_transform(df['route'])
        
        # Feature engineering
        df['speed_distance_ratio'] = df['distance'] / df['base_speed']
        df['traffic_speed_interaction'] = df['traffic_factor'] * df['base_speed']
        df['is_rush_hour'] = ((df['hour'] >= 7) & (df['hour'] <= 9)) | \
                             ((df['hour'] >= 17) & (df['hour'] <= 19))
        df['is_weekend'] = df['day_of_week'] >= 5
        
        # Select features
        feature_cols = ['distance', 'base_speed', 'traffic_factor', 
                       'vehicle_enc', 'weather_enc', 'route_enc',
                       'hour', 'day_of_week', 'speed_distance_ratio',
                       'traffic_speed_interaction', 'is_rush_hour', 'is_weekend']
        
        X = df[feature_cols]
        y = df['eta']
        
        # Scale features for neural network
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Store
        self.encoders = {
            'vehicle': le_vehicle,
            'weather': le_weather,
            'route': le_route
        }
        self.scaler = scaler
        self.feature_names = feature_cols
        
        print(f"✅ Features prepared: {len(feature_cols)} features")
        
        return X, X_scaled, y
    
    def train_xgboost(self, X, y):
        """Train XGBoost model"""
        print("\n🚀 Training XGBoost...")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=7,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train, 
                 eval_set=[(X_test, y_test)],
                 verbose=False)
        
        y_pred = model.predict(X_test)
        metrics = self._calculate_metrics(y_test, y_pred, "XGBoost")
        
        self.models['xgboost'] = {
            'model': model,
            'metrics': metrics
        }
        
        return metrics
    
    def train_lightgbm(self, X, y):
        """Train LightGBM model"""
        print("\n🚀 Training LightGBM...")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        model = lgb.LGBMRegressor(
            n_estimators=200,
            max_depth=7,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            verbose=-1
        )
        
        model.fit(X_train, y_train,
                 eval_set=[(X_test, y_test)])
        
        y_pred = model.predict(X_test)
        metrics = self._calculate_metrics(y_test, y_pred, "LightGBM")
        
        self.models['lightgbm'] = {
            'model': model,
            'metrics': metrics
        }
        
        return metrics
    
    def train_neural_network(self, X_scaled, y):
        """Train Neural Network model"""
        print("\n🚀 Training Neural Network...")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Build model
        model = keras.Sequential([
            layers.Dense(128, activation='relu', input_shape=(X_train.shape[1],)),
            layers.Dropout(0.3),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),
            layers.Dense(1)
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        # Train
        history = model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_split=0.2,
            verbose=0
        )
        
        y_pred = model.predict(X_test, verbose=0).flatten()
        metrics = self._calculate_metrics(y_test, y_pred, "Neural Network")
        
        self.models['neural'] = {
            'model': model,
            'metrics': metrics,
            'history': history.history
        }
        
        return metrics
    
    def create_ensemble(self, X, X_scaled, y):
        """Create ensemble model"""
        print("\n🚀 Creating Ensemble Model...")
        
        # Split both X and X_scaled with same random_state to get matching splits
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        X_train_scaled, X_test_scaled, _, _ = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Get predictions from all models
        pred_xgb = self.models['xgboost']['model'].predict(X_test)
        pred_lgb = self.models['lightgbm']['model'].predict(X_test)
        pred_nn = self.models['neural']['model'].predict(X_test_scaled, verbose=0).flatten()
        
        # Weighted ensemble (based on validation performance)
        weights = self._calculate_ensemble_weights()
        y_pred_ensemble = (
            weights['xgboost'] * pred_xgb +
            weights['lightgbm'] * pred_lgb +
            weights['neural'] * pred_nn
        )
        
        metrics = self._calculate_metrics(y_test, y_pred_ensemble, "Ensemble")
        
        self.models['ensemble'] = {
            'weights': weights,
            'metrics': metrics
        }
        
        return metrics
    
    def _calculate_ensemble_weights(self):
        """Calculate optimal weights for ensemble"""
        mae_xgb = self.models['xgboost']['metrics']['mae']
        mae_lgb = self.models['lightgbm']['metrics']['mae']
        mae_nn = self.models['neural']['metrics']['mae']
        
        # Inverse MAE as weights
        inv_mae_sum = (1/mae_xgb) + (1/mae_lgb) + (1/mae_nn)
        
        return {
            'xgboost': (1/mae_xgb) / inv_mae_sum,
            'lightgbm': (1/mae_lgb) / inv_mae_sum,
            'neural': (1/mae_nn) / inv_mae_sum
        }
    
    def _calculate_metrics(self, y_true, y_pred, model_name):
        """Calculate performance metrics"""
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        r2 = r2_score(y_true, y_pred)
        
        residuals = y_true - y_pred
        residual_std = np.std(residuals)
        
        print(f"\n📊 {model_name} Performance:")
        print(f"   MAE:  {mae*60:.2f} minutes")
        print(f"   RMSE: {rmse*60:.2f} minutes")
        print(f"   R²:   {r2:.4f}")
        print(f"   Std:  {residual_std*60:.2f} minutes")
        
        return {
            'mae': mae,
            'rmse': rmse,
            'r2': r2,
            'residual_std': residual_std,
            'mae_minutes': mae * 60,
            'rmse_minutes': rmse * 60
        }
    
    def save_models(self):
        """Save all models and metadata"""
        print("\n💾 Saving models...")
        
        os.makedirs("model", exist_ok=True)
        
        # Save each model
        for model_name, model_data in self.models.items():
            model_dir = f"model/{model_name}"
            os.makedirs(model_dir, exist_ok=True)

            # Some entries (like the ensemble) may not contain a fitted 'model'
            # — handle both cases gracefully.
            if isinstance(model_data, dict) and 'model' in model_data:
                if model_name == 'neural':
                    model_data['model'].save(f"{model_dir}/model.keras")
                else:
                    with open(f"{model_dir}/model.pkl", "wb") as f:
                        pickle.dump(model_data['model'], f)

                print(f"   ✅ Saved {model_name} model")
            else:
                # Save any additional info (weights/metrics) for entries without a model
                info = {}
                if isinstance(model_data, dict):
                    if 'weights' in model_data:
                        info['weights'] = model_data['weights']
                    if 'metrics' in model_data:
                        # Ensure metrics are JSON-serializable (convert numpy types)
                        serial_metrics = {}
                        for k, v in model_data['metrics'].items():
                            try:
                                serial_metrics[k] = float(v)
                            except Exception:
                                serial_metrics[k] = v
                        info['metrics'] = serial_metrics

                with open(f"{model_dir}/info.json", "w") as f:
                    json.dump(info, f, indent=2)

                print(f"   ℹ️  Saved {model_name} info")
        
        # Save encoders and scaler
        with open("model/encoders.pkl", "wb") as f:
            pickle.dump(self.encoders, f)
        
        with open("model/scaler.pkl", "wb") as f:
            pickle.dump(self.scaler, f)
        
        # Save metadata
        # Build metadata safely (handle missing ensemble or weights)
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'data_size': self.data_size,
            'features': self.feature_names,
            'models': {
                name: (data.get('metrics') if isinstance(data, dict) else None)
                for name, data in self.models.items()
            },
            'ensemble_weights': (self.models.get('ensemble', {}) or {}).get('weights')
        }
        
        with open("model/metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        print("\n✅ All models saved successfully!")
        
        return metadata

def main():
    print("""
    ╔════════════════════════════════════════════════════════╗
    ║   Advanced ETA Model Training - XGBoost + LightGBM    ║
    ║             + Neural Network + Ensemble                ║
    ╚════════════════════════════════════════════════════════╝
    """)
    
    trainer = AdvancedETATrainer(data_size=5000)
    
    # Generate data
    data = trainer.generate_realistic_data()
    
    # Prepare features
    X, X_scaled, y = trainer.prepare_features(data)
    
    # Train all models
    trainer.train_xgboost(X, y)
    trainer.train_lightgbm(X, y)
    trainer.train_neural_network(X_scaled, y)
    trainer.create_ensemble(X, X_scaled, y)
    
    # Save everything
    metadata = trainer.save_models()
    
    # Print summary
    print("\n" + "="*60)
    print("🏆 TRAINING COMPLETE - MODEL COMPARISON")
    print("="*60)
    
    for model_name, metrics in metadata['models'].items():
        print(f"\n{model_name.upper()}:")
        print(f"   MAE:  {metrics['mae_minutes']:.2f} minutes")
        print(f"   RMSE: {metrics['rmse_minutes']:.2f} minutes")
        print(f"   R²:   {metrics['r2']:.4f}")
    
    # Best model
    best_model = min(metadata['models'].items(), 
                    key=lambda x: x[1]['mae'])
    
    print(f"\n🏆 Best Model: {best_model[0].upper()}")
    print(f"   MAE: {best_model[1]['mae_minutes']:.2f} minutes")
    
    print("\n✨ All models ready for production!")

if __name__ == "__main__":
    main()