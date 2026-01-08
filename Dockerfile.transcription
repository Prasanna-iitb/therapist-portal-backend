FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements-transcription.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-transcription.txt

# Copy the transcription service
COPY transcription-service.py .

# Run the service
CMD ["python", "transcription-service.py"]
