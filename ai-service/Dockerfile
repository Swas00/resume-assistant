FROM python:3.11-slim

WORKDIR /opt/app

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/opt/app

# Copy requirements
COPY ai-service/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire ai-service structure
COPY ai-service/ .

# Expose port
EXPOSE 5001

# Run from app folder
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"]