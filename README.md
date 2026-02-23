# OneIT - IT Asset Management Platform

Full-stack IT Asset Management platform built with FastAPI, Next.js, PostgreSQL, Redis, and Celery.

## Features

- **Asset Management** — Track hardware with configurable asset types, dynamic fields, assignment, and lifecycle management
- **Ticketing System** — IT support tickets with SLA tracking, priority levels, and asset linking
- **RBAC** — Role-based access control with granular permissions
- **Dynamic Forms** — JSON-driven field definitions per asset type
- **Audit Logging** — Immutable change tracking for all entities
- **Background Tasks** — Celery workers for SLA monitoring, email notifications, and scheduled reports
- **SSO Ready** — SAML 2.0, OAuth 2.0, and LDAP integration hooks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic |
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7, Celery |
| Proxy | Nginx |
| Container | Docker, Docker Compose |

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Wait for services to start, then seed the database
docker-compose exec backend python -m app.seed_data

# 4. Open the app
# Frontend: http://localhost
# API docs: http://localhost/docs
# Login: admin / admin123
```

## Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL and Redis locally first
python -m app.seed_data  # Seed default data
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

## Default Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Superadmin |

## Project Structure

```
oneit/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── core/      # Config, security, RBAC
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   ├── workers/   # Celery tasks
│   │   └── plugins/   # Plugin system
│   └── alembic/       # Database migrations
├── frontend/          # Next.js application
│   └── src/
│       ├── app/       # Pages (App Router)
│       ├── components/# Shared UI components
│       ├── hooks/     # React hooks
│       └── services/  # API client
├── nginx/             # Reverse proxy config
├── docker-compose.yml
└── .env.example
```

## API Documentation

When running, visit `/docs` for interactive Swagger UI or `/redoc` for ReDoc documentation.

## License

Proprietary — All rights reserved.
