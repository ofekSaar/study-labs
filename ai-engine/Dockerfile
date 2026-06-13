# ── AI Engine Dockerfile ─────────────────────
FROM python:3.12.3-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for PyMuPDF, pytesseract, etc.)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-heb \
    tesseract-ocr-eng \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root system user and group
RUN groupadd -r app && useradd -r -m -g app app

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code with ownership
COPY --chown=app:app . .

# Create uploads directory (used for shared volumes) with open permissions
RUN mkdir -p uploads && chmod 777 uploads

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Run FastAPI app with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
