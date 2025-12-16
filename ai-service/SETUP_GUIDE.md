# 🚀 Supply Tracker AI - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development)
3. [Docker Setup](#docker-setup)
4. [Training Models](#training-models)
5. [Testing](#testing)
6. [Integration with Node.js Backend](#integration)
7. [Production Deployment](#production)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Python**: 3.11+ (3.11 recommended)
- **Docker**: 20.10+ (for containerization)
- **Docker Compose**: 2.0+
- **Redis**: 7.0+ (optional, for caching)
- **Git**: Latest version

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **CPU**: Multi-core recommended for training

### Check Installations
```bash
python --version    # Should be 3.11+
docker --version    # Should be 20.10+
docker-compose --version
redis-cli --version
```

---

## 💻 Local Development Setup

### Step 1: Clone Repository
```bash
cd your-project-root
cd ai-service
```

### Step 2: Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 4: Setup Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env
```

**.env file:**
```env
# API Settings
DEBUG=true
LOG_LEVEL=DEBUG
HOST=0.0.0.0
PORT=8000

# Models
DEFAULT_MODEL=ensemble
ENABLE_NEURAL_NETWORK=true
ENABLE_ENSEMBLE=true

# Redis (optional for local dev)
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_ENABLED=false

# External APIs (optional)
MAPBOX_TOKEN=your_token_here
OPENCAGE_KEY=your_key_here
```

### Step 5: Create Directory Structure
```bash
mkdir -p model/{xgboost,lightgbm,neural,ensemble,metadata}
mkdir -p logs data/training data/validation
touch app/__init__.py
touch app/models/__init__.py
touch app/services/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/utils/__init__.py
touch ml/__init__.py
touch tests/__init__.py
```

---

## 🤖 Training Models

### Quick Start Training
```bash
# Train all models (takes 2-5 minutes)
python ml/train_advanced.py
```

This will:
- ✅ Generate 5000 realistic training samples
- ✅ Train XGBoost, LightGBM, and Neural Network
- ✅ Create ensemble model
- ✅ Save all models to `model/` directory
- ✅ Generate metadata and performance metrics

### Expected Output
```
🚀 Training XGBoost...
   MAE:  2.34 minutes
   RMSE: 3.12 minutes
   R²:   0.9678

🚀 Training LightGBM...
   MAE:  2.28 minutes
   RMSE: 3.05 minutes
   R²:   0.9701

🚀 Training Neural Network...
   MAE:  2.45 minutes
   RMSE: 3.24 minutes
   R²:   0.9645

🚀 Creating Ensemble Model...
   MAE:  2.18 minutes
   RMSE: 2.95 minutes
   R²:   0.9725

🏆 Best Model: ENSEMBLE
```

### Verify Models
```bash
# Check saved models
ls -lh model/

# Should show:
# xgboost/model.pkl
# lightgbm/model.pkl
# neural/model.keras
# encoders.pkl
# scaler.pkl
# metadata.json
```

---

## 🚀 Running the Service

### Method 1: Direct Python
```bash
# Start the service
python -m uvicorn app.main:app --reload --port 8000

# Or use the shortcut
python app/main.py
```

### Method 2: With Gunicorn (Production-like)
```bash
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --log-level info
```

### Verify Service
```bash
# Test health endpoint
curl http://localhost:8000/health

# Check API docs
open http://localhost:8000/docs
```

---

## 🐳 Docker Setup

### Build Docker Image
```bash
# Build the image
docker build -t supply-tracker-ai:latest .

# Verify image
docker images | grep supply-tracker-ai
```

### Run with Docker Compose
```bash
# Start all services (AI + Redis)
docker-compose up -d

# Check logs
docker-compose logs -f ai-service

# Check status
docker-compose ps

# Stop services
docker-compose down
```

### With Monitoring (Prometheus + Grafana)
```bash
# Start with monitoring stack
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3030
# Login: admin / admin
```

### Docker Commands
```bash
# Rebuild after changes
docker-compose build

# Restart specific service
docker-compose restart ai-service

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec ai-service python ml/train_advanced.py

# Clean up
docker-compose down -v
```

---

## 🧪 Testing

### Run All Tests
```bash
# Run pytest
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api.py -v
```

### Manual API Testing
```bash
# Test prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "distance": 25,
    "base_speed": 60,
    "traffic_factor": 1.2,
    "vehicle": "Car",
    "weather": "Clear",
    "route": "A"
  }'

# Test batch prediction
curl -X POST http://localhost:8000/predict/batch \
  -H "Content-Type: application/json" \
  -d '{
    "predictions": [
      {"distance": 10, "base_speed": 60, "traffic_factor": 1.0, "vehicle": "Car", "weather": "Clear", "route": "A"},
      {"distance": 30, "base_speed": 50, "traffic_factor": 1.1, "vehicle": "Truck", "weather": "Rainy", "route": "B"}
    ]
  }'
```

### Performance Testing
```bash
# Install testing tools
pip install locust

# Run load test (create locustfile.py first)
locust -f tests/locustfile.py --host=http://localhost:8000
```

---

## 🔌 Integration with Node.js Backend

### Update Node.js Service
```javascript
// server/services/aiIntegration.service.js

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function calculateETA(pickupCoords, deliveryCoords, options = {}) {
  const {
    vehicleType = 'Car',
    weather = 'Clear',
    trafficFactor = 1.0
  } = options;
  
  // Calculate distance
  const distance = calculateDistance(pickupCoords, deliveryCoords);
  const baseSpeed = vehicleType === 'Truck' ? 50 : vehicleType === 'Bike' ? 40 : 60;
  
  // Call AI service
  const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
    distance,
    base_speed: baseSpeed,
    traffic_factor: trafficFactor,
    vehicle: vehicleType,
    weather: weather,
    route: 'A',
    time_of_day: new Date().getHours(),
    day_of_week: new Date().getDay()
  });
  
  return {
    estimatedMinutes: response.data.estimated_eta_minutes,
    distance: distance,
    confidence: response.data.confidence,
    model: response.data.model_used
  };
}
```

### Environment Variables
Add to Node.js `.env`:
```env
AI_SERVICE_URL=http://localhost:8000
# For Docker:
# AI_SERVICE_URL=http://ai-service:8000
```

### Docker Network Integration
Add to `docker-compose.yml`:
```yaml
services:
  backend:
    # ... existing config
    environment:
      - AI_SERVICE_URL=http://ai-service:8000
    networks:
      - supply-tracker-network
```

---

## 🌐 Production Deployment

### Option 1: Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml supply-tracker

# Scale service
docker service scale supply-tracker_ai-service=3
```

### Option 2: Kubernetes
```yaml
# k8s/ai-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: supply-tracker-ai:latest
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

### Option 3: AWS ECS / GCP Cloud Run
```bash
# Build for production
docker build -t supply-tracker-ai:prod --target production .

# Tag for registry
docker tag supply-tracker-ai:prod your-registry/supply-tracker-ai:latest

# Push
docker push your-registry/supply-tracker-ai:latest
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Module Not Found**
```bash
# Ensure PYTHONPATH is set
export PYTHONPATH=/path/to/ai-service:$PYTHONPATH

# Or add to .env
PYTHONPATH=/app
```

#### 2. **Model Not Loading**
```bash
# Verify model files exist
ls -la model/

# Retrain if missing
python ml/train_advanced.py

# Check permissions
chmod 644 model/**/*
```

#### 3. **Redis Connection Failed**
```bash
# Check Redis is running
redis-cli ping

# Or disable cache
echo "CACHE_ENABLED=false" >> .env

# Start Redis with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

#### 4. **TensorFlow Errors**
```bash
# CPU-only TensorFlow
pip uninstall tensorflow
pip install tensorflow-cpu

# Or use XGBoost only
echo "ENABLE_NEURAL_NETWORK=false" >> .env
```

#### 5. **Port Already in Use**
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 8001
```

### Logs and Debugging

```bash
# View logs
tail -f logs/ai_service.log

# Increase log level
export LOG_LEVEL=DEBUG

# Docker logs
docker-compose logs -f ai-service

# Container shell access
docker-compose exec ai-service /bin/bash
```

### Performance Issues

```bash
# Check memory usage
docker stats

# Reduce workers
docker-compose up --scale ai-service=1

# Use lighter model
curl -X POST http://localhost:8000/predict/xgboost
```

---

## 📊 Monitoring

### Health Checks
```bash
# Basic health
curl http://localhost:8000/health

# Detailed model info
curl http://localhost:8000/models/info

# Metrics (if enabled)
curl http://localhost:8000/metrics
```

### Prometheus Metrics
Access at: `http://localhost:9090`

Useful queries:
```promql
# Request rate
rate(http_requests_total[5m])

# Prediction latency
histogram_quantile(0.95, rate(prediction_duration_bucket[5m]))

# Error rate
rate(http_requests_total{status="500"}[5m])
```

### Grafana Dashboards
Access at: `http://localhost:3030`

Import dashboard:
1. Login (admin/admin)
2. Import → Upload JSON
3. Select `grafana-dashboard.json`

---

## 🎯 Next Steps

1. **Custom Training Data**: Replace generated data with real shipment history
2. **Feature Engineering**: Add more features (holidays, special events)
3. **Model Tuning**: Optimize hyperparameters for your use case
4. **A/B Testing**: Compare model performance in production
5. **Real-time Retraining**: Implement continuous learning
6. **Monitoring**: Set up alerts for model degradation

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [XGBoost Guide](https://xgboost.readthedocs.io/)
- [LightGBM Documentation](https://lightgbm.readthedocs.io/)
- [TensorFlow Tutorials](https://www.tensorflow.org/tutorials)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🆘 Support

For issues or questions:
1. Check logs: `logs/ai_service.log`
2. Review [Troubleshooting](#troubleshooting) section
3. Check API docs: http://localhost:8000/docs
4. Open GitHub issue

---

**Built with ❤️ for Supply Tracker**