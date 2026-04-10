FROM python:3.11-slim

# Set working directory
WORKDIR /app

# System dependencies (ML libs ke liye important)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY backend/ .

# Upgrade pip + install dependencies
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 10000

# Run app
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000"]