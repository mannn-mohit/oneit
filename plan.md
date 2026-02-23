# IT Asset Management Platform

## Required Technical Architecture Files

---

# 1. Repository Structure

```
oneit
│
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── rbac.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── role.py
│   │   │   ├── permission.py
│   │   │   ├── asset.py
│   │   │   ├── asset_type.py
│   │   │   ├── field_definition.py
│   │   │   └── audit_log.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── asset.py
│   │   │   └── asset_type.py
│   │   │
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── roles.py
│   │   │   ├── assets.py
│   │   │   ├── asset_types.py
│   │   │   └── tickets.py
│   │   │
│   │   ├── services/
│   │   │   ├── asset_service.py
│   │   │   ├── workflow_service.py
│   │   │   ├── ticket_service.py
│   │   │   └── audit_service.py
│   │   │
│   │   ├── workers/
│   │   │   └── celery_app.py
│   │   │
│   │   └── plugins/
│   │       └── __init__.py
│   │
│   └── alembic/
│       └── migrations/
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       ├── components/
│       ├── modules/
│       │   ├── assets/
│       │   ├── tickets/
│       │   └── admin/
│       ├── hooks/
│       ├── services/
│       └── utils/
│
└── nginx/
    └── default.conf
```

---

# 2. Infrastructure Files

## docker-compose.yml

* Backend service
* Frontend service
* PostgreSQL service
* Redis service
* Worker service
* Nginx reverse proxy

## .env.example

* DATABASE_URL
* REDIS_URL
* SECRET_KEY
* JWT_ALGORITHM
* SAML_METADATA_URL
* SMTP_CONFIG

---

# 2.1 Tech Stack

* Python 3.12
* FastAPI
* SQLAlchemy
* Alembic
* Celery
* Redis
* PostgreSQL
* Nginx
* ReactJS
* TailwindCSS

---

# 3. Backend Core Files

## main.py

* FastAPI app instance
* Middleware setup
* Router registration
* OpenAPI config

## config.py

* Environment configuration loader
* Centralized settings

## database.py

* SQLAlchemy engine
* SessionLocal
* Base model

## security.py

* JWT generation
* Password hashing
* OAuth2 scheme
* SAML integration hooks

## rbac.py

* Permission decorators
* Role validation middleware

---

# 4. Database Models

## user.py

* User model
* SSO fields
* Role relationships

## role.py

* Role model

## permission.py

* Permission model

## asset_type.py

* Configurable asset type

## field_definition.py

* Dynamic field definitions

## asset.py

* Asset core model
* JSONB metadata

## audit_log.py

* Immutable change tracking

---

# 5. API Layer Files

## auth.py

* Login
* Token refresh
* SAML callback

## users.py

* CRUD users

## roles.py

* Role management

## assets.py

* CRUD assets
* Assignment
* Bulk import

## asset_types.py

* Create asset types
* Define fields

## tickets.py

* Ticket creation
* SLA tracking
* Linking assets

---

# 6. Services Layer

## asset_service.py

* Business logic abstraction

## workflow_service.py

* Approval engine
* Escalation rules

## ticket_service.py

* SLA calculations
* Assignment engine

## audit_service.py

* Change logging

---

# 7. Worker & Queue

## celery_app.py

* Background tasks
* Email notifications
* Scheduled jobs

---

# 8. Frontend Required Structure

## Modules

* Assets module
* Ticketing module
* Admin module

## Core Components

* Dynamic form renderer (JSON driven)
* Global search
* RBAC wrapper
* Dashboard widgets

---

# 9. Security & Auth Integration Files

* saml_provider.py
* oauth_provider.py
* ldap_adapter.py

---

# 10. Deployment Support Files

## Backend Dockerfile

* Multi-stage build
* Uvicorn server

## Nginx Config

* Reverse proxy
* SSL termination ready

---

# 11. Migration & Versioning

* Alembic setup
* Migration scripts
* Seed data script

---

# 12. Documentation Files

* ARCHITECTURE.md
* API_SPEC.yaml
* DEPLOYMENT.md
* SECURITY.md
* CONTRIBUTING.md

---

This is the complete required file structure to start engineering execution.
