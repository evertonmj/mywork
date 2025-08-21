# Backend Dockerfile (FastAPI + Uvicorn)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps (optional but good practice)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (better layer caching)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . /app

# Expose FastAPI port
EXPOSE 8001

# Environment defaults (can be overridden by docker-compose)
ENV USE_LOCALSTACK=true \
    LOCALSTACK_ENDPOINT_URL=http://localstack:4566 \
    AWS_ACCESS_KEY_ID=test \
    AWS_SECRET_ACCESS_KEY=test \
    AWS_REGION=us-east-1

# Run the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
