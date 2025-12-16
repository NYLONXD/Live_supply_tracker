"""
Model Manager - Handles loading and prediction with all models
"""

import pickle
import numpy as np
import os
import json
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from app.config import settings
from app.models.schemas import ETAPredictionRequest, ETAPredictionResponse, ETARange

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.encoders: Dict[str, Any] = {}
        self.scaler = None
        self.metadata = {}
        
    async def load_models(self):
        """Load all trained models"""
        logger.info("Loading ML models...")
        
        try:
            # Load XGBoost
            if os.path.exists("model/xgboost/model.pkl"):
                with open("model/xgboost/model.pkl", "rb") as f:
                    self.models["xgboost"] = pickle.load(f)
                logger.info("✅ XGBoost model loaded")
            
            # Load LightGBM
            if os.path.exists("model/lightgbm/model.pkl"):
                with open("model/lightgbm/model.pkl", "rb") as f:
                    self.models["lightgbm"] = pickle.load(f)
                logger.info("✅ LightGBM model loaded")
            
            # Load Neural Network
            if settings.ENABLE_NEURAL_NETWORK and os.path.exists("model/neural/model.keras"):
                from tensorflow import keras
                self.models["neural"] = keras.models.load_model("model/neural/model.keras")
                logger.info("✅ Neural Network model loaded")
            
            # Load encoders and scaler
            if os.path.exists("model/encoders.pkl"):
                with open("model/encoders.pkl", "rb") as f:
                    self.encoders = pickle.load(f)
                logger.info("✅ Encoders loaded")
            
            if os.path.exists("model/scaler.pkl"):
                with open("model/scaler.pkl", "rb") as f:
                    self.scaler = pickle.load(f)
                logger.info("✅ Scaler loaded")
            
            # Load metadata
            if os.path.exists("model/metadata.json"):
                with open("model/metadata.json", "r") as f:
                    self.metadata = json.load(f)
                logger.info("✅ Metadata loaded")
            
            # Setup ensemble weights
            if settings.ENABLE_ENSEMBLE and len(self.models) >= 2:
                self.models["ensemble"] = {
                    "weights": self.metadata.get("ensemble_weights", {
                        "xgboost": 0.4,
                        "lightgbm": 0.4,
                        "neural": 0.2
                    })
                }
                logger.info("✅ Ensemble model configured")
            
            logger.info(f"✅ Total models loaded: {len(self.models)}")
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {str(e)}")
            raise
    
    def prepare_features(self, request: ETAPredictionRequest) -> tuple:
        """Prepare features for prediction"""
        try:
            # Encode categorical features
            vehicle_enc = self.encoders['vehicle'].transform([request.vehicle.value])[0]
            weather_enc = self.encoders['weather'].transform([request.weather.value])[0]
            route_enc = self.encoders['route'].transform([request.route.value])[0]
            
            # Use current time if not provided
            hour = request.time_of_day if request.time_of_day is not None else datetime.now().hour
            day = request.day_of_week if request.day_of_week is not None else datetime.now().weekday()
            
            # Calculate additional features
            speed_distance_ratio = request.distance / request.base_speed
            traffic_speed_interaction = request.traffic_factor * request.base_speed
            is_rush_hour = int((7 <= hour <= 9) or (17 <= hour <= 19))
            is_weekend = int(day >= 5)
            
            # Create feature array
            features = np.array([[
                request.distance,
                request.base_speed,
                request.traffic_factor,
                vehicle_enc,
                weather_enc,
                route_enc,
                hour,
                day,
                speed_distance_ratio,
                traffic_speed_interaction,
                is_rush_hour,
                is_weekend
            ]])
            
            # Scale features for neural network
            features_scaled = self.scaler.transform(features) if self.scaler else features
            
            return features, features_scaled
            
        except Exception as e:
            logger.error(f"Feature preparation error: {str(e)}")
            raise ValueError(f"Invalid input features: {str(e)}")
    
    async def predict(
        self, 
        request: ETAPredictionRequest,
        model_type: Optional[str] = None
    ) -> ETAPredictionResponse:
        """Make ETA prediction"""
        
        # Prepare features
        features, features_scaled = self.prepare_features(request)
        
        # Choose model
        if model_type and model_type != "ensemble":
            if model_type not in self.models:
                raise ValueError(f"Model {model_type} not loaded")
            model_to_use = model_type
        else:
            # Use best available model
            model_to_use = settings.DEFAULT_MODEL
            if model_to_use not in self.models:
                # Fallback to first available
                model_to_use = list(self.models.keys())[0]
        
        # Make prediction
        if model_to_use == "ensemble" and settings.ENABLE_ENSEMBLE:
            eta_hours = await self._predict_ensemble(features, features_scaled)
        elif model_to_use == "neural":
            eta_hours = self.models["neural"].predict(features_scaled, verbose=0)[0][0]
        else:
            eta_hours = self.models[model_to_use].predict(features)[0]
        
        # Ensure non-negative
        eta_hours = max(0, eta_hours)
        eta_minutes = eta_hours * 60
        
        # Calculate confidence interval
        residual_std = self.metadata.get('models', {}).get(model_to_use, {}).get('residual_std', 0.1)
        margin = 1.96 * residual_std * 60  # 95% confidence
        
        eta_range = ETARange(
            lower=max(0, eta_minutes - margin),
            upper=eta_minutes + margin
        )
        
        # Determine confidence level
        if residual_std < 0.05:
            confidence = "high"
        elif residual_std < 0.1:
            confidence = "medium"
        else:
            confidence = "low"
        
        # Calculate contributing factors
        factors = self._calculate_factors(request, eta_hours)
        
        return ETAPredictionResponse(
            estimated_eta_minutes=round(eta_minutes, 2),
            estimated_eta_hours=round(eta_hours, 2),
            eta_range=eta_range,
            distance_km=request.distance,
            confidence=confidence,
            model_used=model_to_use,
            factors=factors,
            timestamp=datetime.utcnow()
        )
    
    async def _predict_ensemble(self, features, features_scaled) -> float:
        """Make ensemble prediction"""
        weights = self.models["ensemble"]["weights"]
        predictions = {}
        
        if "xgboost" in self.models and "xgboost" in weights:
            predictions["xgboost"] = self.models["xgboost"].predict(features)[0]
        
        if "lightgbm" in self.models and "lightgbm" in weights:
            predictions["lightgbm"] = self.models["lightgbm"].predict(features)[0]
        
        if "neural" in self.models and "neural" in weights:
            predictions["neural"] = self.models["neural"].predict(features_scaled, verbose=0)[0][0]
        
        # Weighted average
        total_weight = sum(weights.get(k, 0) for k in predictions.keys())
        weighted_sum = sum(predictions[k] * weights.get(k, 0) for k in predictions.keys())
        
        return weighted_sum / total_weight if total_weight > 0 else 0
    
    def _calculate_factors(self, request: ETAPredictionRequest, eta_hours: float) -> Dict[str, Any]:
        """Calculate contributing factors"""
        base_time = request.distance / request.base_speed
        
        return {
            "base_travel_time": round(base_time * 60, 2),
            "traffic_impact": round((eta_hours - base_time) * 60, 2),
            "vehicle_factor": request.vehicle.value,
            "weather_factor": request.weather.value,
            "route_complexity": request.route.value,
            "is_rush_hour": (7 <= (request.time_of_day or datetime.now().hour) <= 9) or 
                           (17 <= (request.time_of_day or datetime.now().hour) <= 19)
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            "loaded_models": list(self.models.keys()),
            "default_model": settings.DEFAULT_MODEL,
            "encoders": list(self.encoders.keys()),
            "scaler_loaded": self.scaler is not None,
            "metadata": self.metadata,
            "features": [
                "distance", "base_speed", "traffic_factor",
                "vehicle", "weather", "route",
                "hour", "day_of_week",
                "speed_distance_ratio", "traffic_speed_interaction",
                "is_rush_hour", "is_weekend"
            ]
        }