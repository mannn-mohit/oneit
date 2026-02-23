from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import (
    auth,
    users,
    roles,
    assets,
    asset_types,
    tickets,
    marketplace,
    settings as settings_api,
    components,
    accessories,
    teams,
    imports,
)

app = FastAPI(
    title=settings.APP_NAME,
    description="IT Asset Management Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(roles.router, prefix="/api/roles", tags=["Roles"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(asset_types.router, prefix="/api/asset-types", tags=["Asset Types"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(settings_api.router, prefix="/api/settings", tags=["Settings"])
app.include_router(components.router, prefix="/api/components", tags=["Components"])
app.include_router(accessories.router, prefix="/api/accessories", tags=["Accessories"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(imports.router, prefix="/api/imports", tags=["Imports"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}
