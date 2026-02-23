# Deployment Guide

## Docker Compose (Recommended)

```bash
# Production deployment
cp .env.example .env
# Edit .env with production values (strong SECRET_KEY, real DB password, etc.)

docker-compose up -d --build
docker-compose exec backend python -m app.seed_data
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| REDIS_URL | Yes | Redis connection string |
| SECRET_KEY | Yes | JWT signing key (use strong random value) |
| SMTP_HOST | No | Email server for notifications |
| SAML_METADATA_URL | No | SAML IdP metadata URL for SSO |

## SSL/TLS

Uncomment the SSL server block in `nginx/default.conf` and provide certificate files:
```
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

## Database Migrations

```bash
# Generate a new migration after model changes
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head
```

## Scaling

- **Backend**: Scale horizontally behind load balancer
- **Workers**: Scale Celery workers independently: `docker-compose up -d --scale worker=3`
- **Database**: Use managed PostgreSQL (AWS RDS, Cloud SQL) for production
