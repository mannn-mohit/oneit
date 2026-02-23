# Architecture

## System Overview

OneIT follows a layered architecture with clear separation of concerns.

```
┌─────────────────────────────────────────┐
│              Nginx (Reverse Proxy)       │
│         Port 80 / 443 (SSL ready)       │
├────────────────┬────────────────────────┤
│   Frontend     │      Backend           │
│   Next.js      │      FastAPI           │
│   Port 3000    │      Port 8000         │
├────────────────┴────────────────────────┤
│              PostgreSQL + Redis          │
└─────────────────────────────────────────┘
```

## Backend Architecture

```
API Layer (FastAPI Routes)
    ↓
Service Layer (Business Logic)
    ↓
Model Layer (SQLAlchemy ORM)
    ↓
PostgreSQL Database
```

### Key Design Decisions

- **JSONB Metadata**: Assets use PostgreSQL JSONB for dynamic fields, enabling configurable asset types without schema changes
- **UUID Primary Keys**: All entities use UUIDs for distributed-friendly IDs
- **Immutable Audit Log**: AuditLog table is append-only for compliance
- **Plugin System**: Extensible via lifecycle hooks (on_asset_create, on_ticket_create, etc.)
- **SLA Engine**: Automatic SLA calculation based on ticket priority with breach monitoring via Celery

## Frontend Architecture

- **App Router**: Next.js App Router with route groups for auth-guarded and public pages
- **Auth Context**: React Context + localStorage for JWT token management
- **Dynamic Forms**: JSON-driven form renderer that adapts to asset type field definitions
- **API Client**: Centralized typed API client with automatic auth header injection

## Database Schema

Core entities: User, Role, Permission (M2M), AssetType, FieldDefinition, Asset (JSONB metadata), Ticket, TicketAsset (M2M), AuditLog
