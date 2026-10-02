#!/bin/bash

# Resume Assistant - Environment Setup Script
# This script creates .env files for all services

set -e

echo "🚀 Resume Assistant - Environment Setup"
echo "========================================"
echo ""

# Create backend .env
echo "📝 Setting up Backend Environment..."
read -p "Enter MongoDB URI (mongodb+srv://...): " MONGODB_URI
read -p "Enter JWT Secret (random string): " JWT_SECRET
read -p "Enter Anthropic API Key (sk-ant-...): " ANTHROPIC_API_KEY
read -p "Enter AI Service URL (http://localhost:5001 for dev): " AI_SERVICE_URL

cat > backend/.env << EOF
# Database
MONGODB_URI=$MONGODB_URI

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d

# API Keys
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Services
AI_SERVICE_URL=$AI_SERVICE_URL

# Server
PORT=5000
NODE_ENV=development

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

echo "✅ Backend .env created"
echo ""

# Create ai-service .env
echo "📝 Setting up AI Service Environment..."
cat > ai-service/.env << EOF
# FastAPI
FASTAPI_ENV=development
PORT=5001
EOF

echo "✅ AI Service .env created"
echo ""

# Create frontend .env
echo "📝 Setting up Frontend Environment..."
read -p "Enter Backend API URL (http://localhost:5000 for dev): " VITE_API_URL

cat > frontend/.env << EOF
# API Configuration
VITE_API_URL=$VITE_API_URL
VITE_APP_NAME=Resume Assistant
EOF

echo "✅ Frontend .env created"
echo ""

echo "✨ Environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Backend:    cd backend && npm install && npm run dev"
echo "2. AI Service: cd ai-service && source venv/bin/activate && python main.py"
echo "3. Frontend:   cd frontend && npm install && npm run dev"
echo ""
echo "🔗 Local URLs:"
echo "   Frontend:   http://localhost:5173"
echo "   Backend:    http://localhost:5000"
echo "   AI Service: http://localhost:5001"
