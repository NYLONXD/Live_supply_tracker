#!/bin/bash

# Supply Tracker AI Service - Quick Setup Script
# This script automates the initial setup process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    echo -e "${2}${1}${NC}"
}

# Print section header
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup process
main() {
    print_header "Supply Tracker AI - Automated Setup"
    
    # Step 1: Check Prerequisites
    print_message "📋 Checking prerequisites..." "$YELLOW"
    
    if ! command_exists python3; then
        print_message "❌ Python 3 is not installed!" "$RED"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_message "✅ Python $PYTHON_VERSION found" "$GREEN"
    
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        print_message "✅ Docker $DOCKER_VERSION found" "$GREEN"
    else
        print_message "⚠️  Docker not found (optional)" "$YELLOW"
    fi
    
    # Step 2: Create Directory Structure
    print_header "📁 Creating Directory Structure"
    
    mkdir -p app/{models,services,api/v1/endpoints,utils}
    mkdir -p ml tests
    mkdir -p model/{xgboost,lightgbm,neural,ensemble,metadata}
    mkdir -p logs data/{training,validation,cache}
    
    # Create __init__.py files
    touch app/__init__.py
    touch app/models/__init__.py
    touch app/services/__init__.py
    touch app/api/__init__.py
    touch app/api/v1/__init__.py
    touch app/api/v1/endpoints/__init__.py
    touch app/utils/__init__.py
    touch ml/__init__.py
    touch tests/__init__.py
    
    print_message "✅ Directory structure created" "$GREEN"
    
    # Step 3: Setup Python Environment
    print_header "🐍 Setting Up Python Environment"
    
    if [ ! -d "venv" ]; then
        print_message "Creating virtual environment..." "$YELLOW"
        python3 -m venv venv
        print_message "✅ Virtual environment created" "$GREEN"
    else
        print_message "✅ Virtual environment already exists" "$GREEN"
    fi
    
    # Activate virtual environment
    print_message "Activating virtual environment..." "$YELLOW"
    source venv/bin/activate || . venv/Scripts/activate
    
    # Upgrade pip
    print_message "Upgrading pip..." "$YELLOW"
    pip install --upgrade pip --quiet
    
    # Install dependencies
    print_header "📦 Installing Dependencies"
    
    if [ -f "requirements.txt" ]; then
        print_message "Installing Python packages (this may take a few minutes)..." "$YELLOW"
        pip install -r requirements.txt --quiet
        print_message "✅ Dependencies installed" "$GREEN"
    else
        print_message "⚠️  requirements.txt not found" "$YELLOW"
    fi
    
    # Step 4: Setup Environment Variables
    print_header "⚙️  Setting Up Environment Variables"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_message "✅ .env file created from .env.example" "$GREEN"
        else
            cat > .env << 'EOF'
# API Settings
DEBUG=true
LOG_LEVEL=DEBUG
HOST=0.0.0.0
PORT=8000

# Models
DEFAULT_MODEL=ensemble
ENABLE_NEURAL_NETWORK=true
ENABLE_ENSEMBLE=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_ENABLED=false

# External APIs (optional)
MAPBOX_TOKEN=
OPENCAGE_KEY=
EOF
            print_message "✅ .env file created with defaults" "$GREEN"
        fi
    else
        print_message "✅ .env file already exists" "$GREEN"
    fi
    
    # Step 5: Train Models
    print_header "🤖 Training ML Models"
    
    if [ ! -d "model/xgboost" ] || [ ! -f "model/metadata.json" ]; then
        print_message "Training models (this will take 2-5 minutes)..." "$YELLOW"
        
        if [ -f "ml/train_advanced.py" ]; then
            python ml/train_advanced.py
            print_message "✅ Models trained successfully" "$GREEN"
        else
            print_message "⚠️  Training script not found" "$YELLOW"
        fi
    else
        print_message "✅ Models already trained" "$GREEN"
    fi
    
    # Step 6: Verify Setup
    print_header "✅ Verifying Setup"
    
    ERRORS=0
    
    # Check models
    if [ -f "model/xgboost/model.pkl" ]; then
        print_message "✅ XGBoost model found" "$GREEN"
    else
        print_message "❌ XGBoost model missing" "$RED"
        ERRORS=$((ERRORS+1))
    fi
    
    if [ -f "model/lightgbm/model.pkl" ]; then
        print_message "✅ LightGBM model found" "$GREEN"
    else
        print_message "❌ LightGBM model missing" "$RED"
        ERRORS=$((ERRORS+1))
    fi
    
    if [ -f "model/neural/model.keras" ]; then
        print_message "✅ Neural Network model found" "$GREEN"
    else
        print_message "❌ Neural Network model missing" "$RED"
        ERRORS=$((ERRORS+1))
    fi
    
    if [ -f "model/metadata.json" ]; then
        print_message "✅ Model metadata found" "$GREEN"
    else
        print_message "❌ Model metadata missing" "$RED"
        ERRORS=$((ERRORS+1))
    fi
    
    # Final Summary
    print_header "🎉 Setup Complete!"
    
    if [ $ERRORS -eq 0 ]; then
        print_message "All components are ready!" "$GREEN"
        echo ""
        print_message "🚀 To start the service, run:" "$BLUE"
        echo ""
        echo "   # Activate virtual environment:"
        echo "   source venv/bin/activate"
        echo ""
        echo "   # Start the service:"
        echo "   python app/main.py"
        echo ""
        echo "   # Or with Docker:"
        echo "   docker-compose up -d"
        echo ""
        print_message "📚 Documentation:" "$BLUE"
        echo "   http://localhost:8000/docs (after starting)"
        echo ""
        print_message "🔍 Health Check:" "$BLUE"
        echo "   curl http://localhost:8000/health"
        echo ""
    else
        print_message "⚠️  Setup completed with $ERRORS error(s)" "$YELLOW"
        print_message "Please check the error messages above" "$YELLOW"
    fi
}

# Run main function
main "$@"