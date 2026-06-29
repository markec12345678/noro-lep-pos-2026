# Deployment Guide

Production deployment instructions for Noro Lep POS.

## Prerequisites

- Docker 20+ and Docker Compose 2+
- Domain name with SSL certificate (for HTTPS)
- FURS TLS certificate (for production fiscal compliance)

## Option 1: Docker Compose (recommended)

### 1. Clone and configure

```bash
git clone https://github.com/markec12345678/noro-lep-pos-2026.git
cd noro-lep-pos-2026
```

### 2. Set up environment

```bash
# Frontend env
cp frontend/.env.example frontend/.env
# Edit .env with your production URLs

# FURS production mode (optional, for real fiscal invoices)
# Set in docker-compose.yml:
#   FURS_MODE=production
#   FURS_CERT_PATH=/certs/your-cert.pem
#   FURS_KEY_PATH=/certs/your-key.pem
```

### 3. Build and start

```bash
docker-compose up -d --build
```

### 4. Initialize Cockpit CMS

```bash
# Visit http://localhost:3030/install
# Create admin account

# Then run the collection setup script:
docker-compose exec backend php setup-collections.php
```

### 5. Verify

- Frontend: http://localhost:8080
- Cockpit CMS: http://localhost:3030
- Health checks:
  - `curl http://localhost:3003` (realtime)
  - `curl http://localhost:3004/api/furs/health` (FURS)
  - `curl http://localhost:3005/api/public/health` (public API)

## Option 2: Manual deployment

### Backend (Cockpit CMS)

```bash
cd backend
# Serve with PHP built-in server (dev) or Apache/Nginx (prod)
php -S localhost:3030
# Run setup script
php setup-collections.php
```

### Mini-services

Each mini-service is a standalone Bun project:

```bash
# Realtime (port 3003)
cd mini-services/pos-realtime && bun install && bun run start

# FURS (port 3004)
cd mini-services/furs-service && bun install && bun run start

# Public API (port 3005)
cd mini-services/pos-public && bun install && bun run start
```

For production, use a process manager (pm2, systemd, or Docker).

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with production API URLs
bun install
bun run build
# Serve dist/ with Nginx or any static file server
```

## Reverse proxy (Caddy)

The Caddyfile should route:
- `/` → frontend (port 8080)
- `/api/content/*` → backend (port 3030)
- `/api/furs/*` with `?XTransformPort=3004` → FURS service
- `/api/public/*` with `?XTransformPort=3005` → public API
- WebSocket with `?XTransformPort=3003` → realtime service

## FURS production setup

1. Register your business premise at https://edavki.durs.si
2. Generate a TLS certificate for electronic device registration
3. Place cert and key files on the server
4. Set environment variables:
   ```
   FURS_MODE=production
   FURS_CERT_PATH=/path/to/cert.pem
   FURS_KEY_PATH=/path/to/key.pem
   ```
5. Configure Fiscal Settings page in the POS admin
6. Test with a small invoice before going live

## Backup strategy

- **Cockpit CMS data**: `backend/storage/data/*.sqlite` — backup daily
- **Uploaded images**: `backend/storage/uploads/` — backup weekly
- **Configuration**: `.env` files, `docker-compose.yml` — version control

```bash
# Daily backup script example
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backup-$DATE.tar.gz backend/storage/data/ backend/storage/uploads/
```

## SSL/HTTPS

Use Caddy (automatic Let's Encrypt) or Nginx with certbot:

```nginx
server {
    listen 443 ssl;
    server_name pos.yourrestaurant.si;

    ssl_certificate /etc/letsencrypt/live/pos.yourrestaurant.si/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.yourrestaurant.si/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
    }

    # Cockpit CMS
    location /api/content/ {
        proxy_pass http://localhost:3030;
    }
}
```
