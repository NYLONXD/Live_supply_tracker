"""
API v1 Routes - Future endpoints for geocoding, route optimization, etc.
"""

from fastapi import APIRouter

router = APIRouter()

# Placeholder for future endpoints
# These will be implemented as needed:
# - Geocoding
# - Route optimization
# - Traffic analysis
# - Address validation

@router.get("/")
async def api_root():
    """API v1 root"""
    return {
        "version": "v1",
        "status": "active",
        "available_endpoints": {
            "prediction": "/predict",
            "batch": "/predict/batch",
            "health": "/health",
            "models": "/models/info"
        },
        "coming_soon": {
            "geocoding": "/v1/geocode",
            "route_optimization": "/v1/optimize",
            "traffic_analysis": "/v1/traffic"
        }
    }