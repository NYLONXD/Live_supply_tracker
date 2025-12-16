"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class VehicleType(str, Enum):
    CAR = "Car"
    BIKE = "Bike"
    TRUCK = "Truck"
    VAN = "Van"

class WeatherCondition(str, Enum):
    CLEAR = "Clear"
    RAINY = "Rainy"
    FOGGY = "Foggy"
    SNOWY = "Snowy"

class RouteType(str, Enum):
    A = "A"  # Highway
    B = "B"  # Urban
    C = "C"  # Mixed

class ModelType(str, Enum):
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    NEURAL = "neural"
    ENSEMBLE = "ensemble"

# Request Models
class ETAPredictionRequest(BaseModel):
    distance: float = Field(..., gt=0, le=1000, description="Distance in kilometers")
    base_speed: float = Field(..., gt=0, le=200, description="Base speed in km/h")
    traffic_factor: float = Field(1.0, ge=0.5, le=3.0, description="Traffic multiplier")
    vehicle: VehicleType = Field(VehicleType.CAR, description="Vehicle type")
    weather: WeatherCondition = Field(WeatherCondition.CLEAR, description="Weather condition")
    route: RouteType = Field(RouteType.A, description="Route type")
    time_of_day: Optional[int] = Field(None, ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "distance": 25.5,
                "base_speed": 60,
                "traffic_factor": 1.2,
                "vehicle": "Car",
                "weather": "Clear",
                "route": "A",
                "time_of_day": 14,
                "day_of_week": 2
            }
        }

class GeocodingRequest(BaseModel):
    address: str = Field(..., min_length=3, max_length=500, description="Address to geocode")
    country: Optional[str] = Field(None, description="Country code (e.g., 'US', 'IN')")
    
class RouteOptimizationRequest(BaseModel):
    pickup: Dict[str, float] = Field(..., description="Pickup coordinates {lat, lng}")
    delivery: Dict[str, float] = Field(..., description="Delivery coordinates {lat, lng}")
    waypoints: Optional[List[Dict[str, float]]] = Field(None, description="Optional waypoints")
    optimize_for: str = Field("time", description="'time' or 'distance'")
    
    @validator('pickup', 'delivery')
    def validate_coordinates(cls, v):
        if 'lat' not in v or 'lng' not in v:
            raise ValueError("Coordinates must have 'lat' and 'lng' keys")
        if not (-90 <= v['lat'] <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= v['lng'] <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v

class TrafficAnalysisRequest(BaseModel):
    coordinates: Dict[str, float] = Field(..., description="Location {lat, lng}")
    radius: float = Field(5.0, ge=1, le=50, description="Analysis radius in km")

# Response Models
class ETARange(BaseModel):
    lower: float = Field(..., description="Lower bound in minutes")
    upper: float = Field(..., description="Upper bound in minutes")

class ETAPredictionResponse(BaseModel):
    estimated_eta_minutes: float = Field(..., description="Estimated time in minutes")
    estimated_eta_hours: float = Field(..., description="Estimated time in hours")
    eta_range: ETARange = Field(..., description="Confidence interval (95%)")
    distance_km: float = Field(..., description="Distance in kilometers")
    confidence: str = Field(..., description="Confidence level: high/medium/low")
    model_used: str = Field(..., description="Model type used for prediction")
    factors: Dict[str, Any] = Field(..., description="Contributing factors")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class GeocodingResult(BaseModel):
    address: str = Field(..., description="Formatted address")
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    confidence: float = Field(..., ge=0, le=1, description="Geocoding confidence")
    place_type: Optional[str] = Field(None, description="Type of place")
    components: Optional[Dict[str, str]] = Field(None, description="Address components")

class RouteSegment(BaseModel):
    distance: float = Field(..., description="Segment distance in km")
    duration: float = Field(..., description="Segment duration in minutes")
    traffic_level: str = Field(..., description="Traffic level: low/medium/high")

class RouteOptimizationResponse(BaseModel):
    total_distance: float = Field(..., description="Total distance in km")
    total_duration: float = Field(..., description="Total duration in minutes")
    segments: List[RouteSegment] = Field(..., description="Route segments")
    polyline: str = Field(..., description="Encoded polyline")
    optimized_waypoints: Optional[List[Dict[str, float]]] = Field(None)

class TrafficData(BaseModel):
    level: str = Field(..., description="Traffic level: low/medium/high/severe")
    flow_speed: float = Field(..., description="Current flow speed in km/h")
    congestion_factor: float = Field(..., ge=0, le=3, description="Congestion multiplier")
    incidents: int = Field(0, description="Number of traffic incidents")

class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Service version")
    uptime: float = Field(..., description="Uptime in seconds")
    models_loaded: Dict[str, bool] = Field(..., description="Model loading status")
    cache_connected: bool = Field(..., description="Cache connection status")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ModelInfo(BaseModel):
    model_type: str
    version: str
    trained_at: Optional[str]
    features: List[str]
    metrics: Optional[Dict[str, float]]
    parameters: Optional[Dict[str, Any]]

class BatchPredictionRequest(BaseModel):
    predictions: List[ETAPredictionRequest] = Field(..., max_length=100)
    model_preference: Optional[ModelType] = None

class BatchPredictionResponse(BaseModel):
    results: List[ETAPredictionResponse]
    total: int
    successful: int
    failed: int
    processing_time: float

class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None