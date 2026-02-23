# Contributing to OneIT

## Development Setup

1. Fork and clone the repository
2. Copy `.env.example` to `.env`
3. Start with `docker-compose up -d`
4. Seed the database: `docker-compose exec backend python -m app.seed_data`

## Code Structure

- **Backend**: Follow the existing layered pattern (API → Service → Model)
- **Frontend**: Use the App Router, create components in `src/components/`
- **Models**: Add new models in `backend/app/models/`, register in `__init__.py`
- **Routes**: Add new routes in `backend/app/api/`, register in `main.py`

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes with clear commit messages
3. Ensure backend imports cleanly and frontend builds
4. Submit PR with description of changes

## Adding a New Module

1. Create model(s) in `backend/app/models/`
2. Create Pydantic schemas in `backend/app/schemas/`
3. Create service in `backend/app/services/`
4. Create API routes in `backend/app/api/`
5. Register router in `backend/app/main.py`
6. Create frontend pages in `frontend/src/app/(dashboard)/`
7. Add navigation link in `frontend/src/components/Sidebar.tsx`
