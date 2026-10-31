# STAGE 1: BUILD REACT FRONTEND

# Start with Node.js 20 on Alpine Linux
# Name this stage "frontend"
FROM node:20-alpine AS frontend

# Set the working directory inside the image
WORKDIR /app

# Copy dependency manifests first for caching
COPY package*.json ./

# Install exact frontend dependencies
RUN npm ci

# Copy frontend configuration files
COPY index.html vite.config.ts tsconfig*.json ./

# Copy React/TypeScript source code
COPY src ./src

# Copy static public assets
COPY public ./public

# Copy additional configuration files
COPY *.config.* ./

# Compile React into production static files
# Default Vite output: /app/dist
RUN npm run build


# STAGE 2: RUN FASTAPI BACKEND

# Start a new stage with Python 3.12
FROM python:3.12-slim

# Set the backend working directory
WORKDIR /app/backend

# Configure Python and the default port
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Copy dependency list separately for caching
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy FastAPI application files
COPY backend/ ./

# Copy compiled React files from Stage 1
COPY --from=frontend /app/dist ./dist

# Create a non-root user and give it ownership
RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid 1000 --create-home --shell /usr/sbin/nologin app \
    && chown -R app:app /app

# Run the application as the non-root user
USER 1000:1000

# Document the container's default listening port
EXPOSE 8000

# Start FastAPI using Gunicorn and 2 Uvicorn workers
CMD ["sh", "-c", "exec gunicorn main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:${PORT:-8000}"]