from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import json
import os
from typing import Optional

from app.models.user import User
from app.api.deps import get_current_user, require_superadmin

router = APIRouter()

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "settings.json")

class AppSettings(BaseModel):
    app_name: str
    app_icon: str

def load_settings() -> dict:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                return json.load(f)
        except:
            pass
    return {"app_name": "OneIT", "app_icon": "O"}

def save_settings(settings: dict):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=4)

@router.get("/", response_model=AppSettings)
async def get_settings():
    """Get the current application branding settings (Publicly accessible for login pages)"""
    return load_settings()

@router.put("/", response_model=AppSettings)
async def update_settings(
    settings: AppSettings,
    current_user: User = Depends(require_superadmin),
):
    """Update application branding settings (Superadmin only)"""
    data = {"app_name": settings.app_name, "app_icon": settings.app_icon}
    save_settings(data)
    return data
