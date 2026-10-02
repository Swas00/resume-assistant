FROM python:3.11-slim

WORKDIR /app

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy requirements
COPY ai-service/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ai-service/main.py .
COPY ai-service/models ./models
COPY ai-service/services ./services

# Expose port (FastAPI runs on 5001)
EXPOSE 5001

# Run with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]