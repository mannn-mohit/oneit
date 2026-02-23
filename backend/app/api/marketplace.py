from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel

from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

class AppConfigPayload(BaseModel):
    webhook_url: str | None = None
    api_key: str | None = None

class AppIntegration(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    is_installed: bool
    is_configured: bool

# Mock registry of external apps
MOCK_APPS = {
    "slack": {
        "id": "slack",
        "name": "Slack Integration",
        "description": "Send notifications to Slack channels for new tickets and asset assignments.",
        "icon": "slack",
        "is_installed": False,
        "is_configured": False,
    },
    "teams": {
        "id": "teams",
        "name": "Microsoft Teams",
        "description": "Integrate with Microsoft Teams for alerts and workflow approvals.",
        "icon": "message-square",
        "is_installed": True,
        "is_configured": False,
    },
    "jamf": {
        "id": "jamf",
        "name": "Jamf Pro",
        "description": "Sync Apple devices automatically from Jamf MDM.",
        "icon": "smartphone",
        "is_installed": False,
        "is_configured": False,
    },
    "intune": {
        "id": "intune",
        "name": "Microsoft Intune",
        "description": "Sync Windows devices automatically from Microsoft Intune.",
        "icon": "laptop",
        "is_installed": False,
        "is_configured": False,
    }
}

@router.get("/", response_model=List[AppIntegration])
async def list_apps(current_user: User = Depends(get_current_user)):
    """List all available marketplace applications."""
    return list(MOCK_APPS.values())

@router.post("/{app_id}/install", response_model=AppIntegration)
async def install_app(app_id: str, current_user: User = Depends(get_current_user)):
    """Install a marketplace application."""
    if app_id not in MOCK_APPS:
        raise HTTPException(status_code=404, detail="App not found")
    
    MOCK_APPS[app_id]["is_installed"] = True
    return MOCK_APPS[app_id]

@router.post("/{app_id}/uninstall", response_model=AppIntegration)
async def uninstall_app(app_id: str, current_user: User = Depends(get_current_user)):
    """Uninstall a marketplace application."""
    if app_id not in MOCK_APPS:
        raise HTTPException(status_code=404, detail="App not found")
    
    MOCK_APPS[app_id]["is_installed"] = False
    MOCK_APPS[app_id]["is_configured"] = False
    return MOCK_APPS[app_id]

@router.post("/{app_id}/configure", response_model=AppIntegration)
async def configure_app(app_id: str, config: AppConfigPayload, current_user: User = Depends(get_current_user)):
    """Configure a marketplace application."""
    if app_id not in MOCK_APPS:
        raise HTTPException(status_code=404, detail="App not found")
    
    if not MOCK_APPS[app_id]["is_installed"]:
        raise HTTPException(status_code=400, detail="App must be installed before configuring")
        
    MOCK_APPS[app_id]["is_configured"] = True
    return MOCK_APPS[app_id]
