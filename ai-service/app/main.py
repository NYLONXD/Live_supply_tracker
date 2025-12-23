"""
Supply Tracker - Advanced AI Service
FastAPI application with XGBoost, LightGBM, Neural Networks, and Ensemble
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging
from datetime import datetime

# Internal imports
from app.config import settings
from app.models.schemas import (
    ETAPredictionRequest,
    ETAPredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    HealthCheckResponse,
    ModelInfo,
    ErrorResponse
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Global variables
start_time = time.time()
model_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for the application"""
    global model_manager
    
    logger.info("🚀 Starting Supply Tracker AI Service...")
    logger.info(f"📍 Version: {settings.APP_VERSION}")
    logger.info(f"📍 Environment: {'Development' if settings.DEBUG else 'Production'}")
    
    try:
        # Import and initialize model manager
        from app.services.model_manager import ModelManager
        
        model_manager = ModelManager()
        await model_manager.load_models()
        
        logger.info("✅ Models loaded successfully")
        
        # Initialize cache if enabled
        if settings.CACHE_ENABLED:
            from app.utils.cache import cache
            await cache.connect()
            logger.info("✅ Cache connected")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down AI Service...")
    if settings.CACHE_ENABLED:
        from app.utils.cache import cache
        await cache.disconnect()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Advanced AI service for ETA prediction, route optimization, and traffic analysis",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Duration: {duration:.3f}s"
    )
    
    return response

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            detail=str(exc),
            timestamp=datetime.utcnow()
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc) if settings.DEBUG else "An unexpected error occurred",
            timestamp=datetime.utcnow()
        ).dict()
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "predict": "/predict",
            "predict_batch": "/predict/batch",
            "models": "/models/info"
        },
        "features": {
            "eta_prediction": True,
            "batch_prediction": True,
            "neural_network": settings.ENABLE_NEURAL_NETWORK,
            "ensemble": settings.ENABLE_ENSEMBLE
        }
    }

# Health check
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - start_time
    
    # Check models
    models_loaded = {}
    if model_manager:
        models_loaded = {
            "xgboost": model_manager.models.get("xgboost") is not None,
            "lightgbm": model_manager.models.get("lightgbm") is not None,
            "neural": model_manager.models.get("neural") is not None,
            "ensemble": model_manager.models.get("ensemble") is not None
        }
    
    # Check cache
    cache_connected = False
    if settings.CACHE_ENABLED:
        try:
            from app.utils.cache import cache
            cache_connected = await cache.ping()
        except:
            pass
    
    return HealthCheckResponse(
        status="healthy",
        version=settings.APP_VERSION,
        uptime=uptime,
        models_loaded=models_loaded,
        cache_connected=cache_connected,
        timestamp=datetime.utcnow()
    )

# Model info
@app.get("/models/info")
async def get_model_info():
    """Get information about loaded models"""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    return model_manager.get_model_info()

# ✅ MAIN PREDICTION ENDPOINT - This is what your backend calls
@app.post("/predict", response_model=ETAPredictionResponse)
async def predict_eta(request: ETAPredictionRequest):
    """
    Predict ETA for a single shipment
    
    Uses ensemble of XGBoost, LightGBM, and Neural Network for best accuracy
    """
    logger.info(f"📨 Received prediction request: distance={request.distance}km, vehicle={request.vehicle}")
    
    if not model_manager:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        # Check cache first
        if settings.CACHE_ENABLED:
            from app.utils.cache import cache
            cache_key = f"predict:{request.model_dump_json()}"
            cached = await cache.get(cache_key)
            if cached:
                logger.debug("✅ Cache hit for prediction")
                return ETAPredictionResponse(**cached)
        
        # Make prediction
        result = await model_manager.predict(request)
        
        logger.info(f"✅ Prediction successful: {result.estimated_eta_minutes:.1f} min ({result.confidence} confidence)")
        
        # Cache result
        if settings.CACHE_ENABLED:
            await cache.set(cache_key, result.dict(), ttl=settings.CACHE_TTL)
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Batch prediction
@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """
    Predict ETA for multiple shipments at once
    
    Maximum 100 predictions per request
    """
    if not model_manager:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    if len(request.predictions) > settings.MAX_PREDICTIONS_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.MAX_PREDICTIONS_PER_REQUEST} predictions per request"
        )
    
    start = time.time()
    results = []
    failed = 0
    
    for pred_request in request.predictions:
        try:
            result = await model_manager.predict(pred_request)
            results.append(result)
        except Exception as e:
            logger.warning(f"Batch prediction failed for item: {str(e)}")
            failed += 1
    
    processing_time = time.time() - start
    
    return BatchPredictionResponse(
        results=results,
        total=len(request.predictions),
        successful=len(results),
        failed=failed,
        processing_time=processing_time
    )

# Model selection endpoint
@app.post("/predict/{model_type}", response_model=ETAPredictionResponse)
async def predict_with_model(
    model_type: str,
    request: ETAPredictionRequest
):
    """
    Predict using a specific model
    
    Available models: xgboost, lightgbm, neural, ensemble
    """
    if not model_manager:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    valid_models = ["xgboost", "lightgbm", "neural", "ensemble"]
    if model_type not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model type. Choose from: {valid_models}"
        )
    
    try:
        result = await model_manager.predict(request, model_type=model_type)
        return result
    except Exception as e:
        logger.error(f"Prediction error with {model_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Metrics endpoint (if enabled)
if settings.ENABLE_METRICS:
    @app.get("/metrics")
    async def metrics():
        """Prometheus metrics endpoint"""
        from app.utils.metrics import get_metrics
        return get_metrics()

if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"🚀 Starting AI Service on {settings.HOST}:{settings.PORT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.MAX_WORKERS,
        log_level=settings.LOG_LEVEL.lower()
    )