# Docker Deployment Guide

## Prerequisites

- Docker Desktop installed
- Docker Compose installed

## Local Development (with local MongoDB)

1. **Start all services**:
   ```bash
   docker-compose --profile local up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f backend
   ```

3. **Stop services**:
   ```bash
   docker-compose down
   ```

## Production Deployment (with MongoDB Atlas)

1. **Create production environment file**:
   ```bash
   cp .env.example .env.production
   ```

2. **Edit `.env.production` with production values**:
   ```bash
   # Node environment
   NODE_ENV=production

   # MongoDB Atlas connection
   DB_USERNAME=your-atlas-username
   DB_PASSWORD=your-atlas-password
   DB_HOST=your-cluster.mongodb.net
   DB_NAME=wdp

   # JWT Secrets (USE STRONG SECRETS IN PRODUCTION)
   JWT_ACCESS_TOKEN_SECRET=your-strong-secret-key
   JWT_REFRESH_TOKEN_SECRET=your-strong-refresh-secret-key
   # ... other variables
   ```

3. **Start backend only** (no local MongoDB):
   ```bash
   docker-compose up -d backend
   ```

## Services

| Service | Container Name | Port | Environment |
|---------|---------------|------|-------------|
| Backend | wdp-backend | 8386 | All |
| MongoDB | wdp-mongodb | 27017 | Local only |

## Environment Variables

### Local Development
```bash
NODE_ENV=development
MONGODB_URI_LOCAL=mongodb://admin:password123@mongodb:27017/wdp?authSource=admin
```

### Production (MongoDB Atlas)
```bash
NODE_ENV=production
DB_USERNAME=your-atlas-username
DB_PASSWORD=your-atlas-password
DB_HOST=your-cluster.mongodb.net
DB_NAME=wdp
```

### Common Variables
```bash
# JWT Secrets (CHANGE IN PRODUCTION)
JWT_ACCESS_TOKEN_SECRET=your-secret-key
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret-key

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@gmail.com

# VNPAY
VNPAY_TMN_CODE=your-tmncode
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_RETURN_URL=http://localhost:5173/checkout/vnpay-return
```

## MongoDB Access (Local Development Only)

- **Root user**: `admin` / `password123`
- **App user**: `wdp_user` / `wdp_password`
- **Database**: `wdp`

Connect using MongoDB Compass:
```
mongodb://admin:password123@localhost:27017/wdp?authSource=admin
```

## Build & Rebuild

```bash
# Rebuild backend after code changes
docker-compose up -d --build backend

# Force rebuild without cache
docker-compose build --no-cache backend
```

## Health Check

Check if services are running:
```bash
# Backend health
curl http://localhost:8386/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

## Troubleshooting

### Backend can't connect to MongoDB
- Ensure MongoDB container is healthy: `docker-compose ps`
- Check logs: `docker-compose logs mongodb`

### Build fails
- Check if `packages/shared` exists and builds correctly
- Try `docker-compose build --no-cache`

### Port already in use
- Change port in `docker-compose.yml` under `ports:` section
