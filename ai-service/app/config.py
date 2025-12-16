"""
Configuration management for AI Service
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # API Settings
    APP_NAME: str = "Supply Tracker AI Service"
    APP_VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"]
    
    # Model Settings
    MODEL_PATH: str = "model"
    DEFAULT_MODEL: str = "xgboost"  # xgboost, lightgbm, neural, ensemble
    MODEL_VERSION: str = "v1"
    AUTO_RELOAD_MODEL: bool = True
    MODEL_CACHE_TTL: int = 3600  # 1 hour
    
    # Redis Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    CACHE_ENABLED: bool = True
    CACHE_TTL: int = 300  # 5 minutes
    
    # Geocoding API (OpenCage, Mapbox, Google)
    GEOCODING_PROVIDER: str = "mapbox"
    MAPBOX_TOKEN: str = os.getenv("MAPBOX_TOKEN", "")
    OPENCAGE_KEY: str = os.getenv("OPENCAGE_KEY", "")
    GOOGLE_MAPS_KEY: str = os.getenv("GOOGLE_MAPS_KEY", "")
    
    # Traffic API
    TOMTOM_API_KEY: str = os.getenv("TOMTOM_API_KEY", "")
    HERE_API_KEY: str = os.getenv("HERE_API_KEY", "")
    
    # ML Settings
    BATCH_SIZE: int = 32
    MAX_PREDICTIONS_PER_REQUEST: int = 100
    CONFIDENCE_THRESHOLD: float = 0.8
    
    # Feature Flags
    ENABLE_NEURAL_NETWORK: bool = True
    ENABLE_ENSEMBLE: bool = True
    ENABLE_REAL_TIME_TRAINING: bool = False
    ENABLE_TRAFFIC_INTEGRATION: bool = True
    ENABLE_WEATHER_INTEGRATION: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/ai_service.log"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Performance
    MAX_WORKERS: int = 4
    REQUEST_TIMEOUT: int = 30
    
    # Metrics
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Global settings instance
settings = get_settings()