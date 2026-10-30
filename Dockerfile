# Stage 1: build the Vite frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public
COPY *.config.* ./
RUN npm run build

# Stage 2: run the FastAPI application
FROM python:3.12-slim
WORKDIR /app/backend
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ ./
COPY --from=frontend /app/backend/dist ./dist

RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid 1000 --create-home --shell /usr/sbin/nologin app \
    && chown -R app:app /app
USER 1000:1000
EXPOSE 8000
CMD ["sh", "-c", "exec gunicorn main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:${PORT:-8000}"]
