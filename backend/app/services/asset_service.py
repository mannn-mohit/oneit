from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.asset import Asset
from app.models.asset_type import AssetType
from app.models.field_definition import FieldDefinition
from app.models.user import User


class AssetService:
    @staticmethod
    def get_assets(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        asset_type_id: Optional[UUID] = None,
        search: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
    ) -> tuple:
        """Get paginated list of assets with filters."""
        query = db.query(Asset).options(
            joinedload(Asset.asset_type),
            joinedload(Asset.assigned_to_user),
        )

        if status:
            query = query.filter(Asset.status == status)
        if asset_type_id:
            query = query.filter(Asset.asset_type_id == asset_type_id)
        if assigned_to:
            query = query.filter(Asset.assigned_to == assigned_to)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Asset.name.ilike(search_term))
                | (Asset.asset_tag.ilike(search_term))
                | (Asset.serial_number.ilike(search_term))
            )

        total = query.count()
        assets = query.offset(skip).limit(limit).all()
        return assets, total

    @staticmethod
    def get_asset(db: Session, asset_id: UUID) -> Optional[Asset]:
        """Get a single asset by ID."""
        return (
            db.query(Asset)
            .options(
                joinedload(Asset.asset_type),
                joinedload(Asset.assigned_to_user),
            )
            .filter(Asset.id == asset_id)
            .first()
        )

    @staticmethod
    def create_asset(db: Session, asset_data: dict) -> Asset:
        """Create a new asset."""
        asset = Asset(**asset_data)
        if asset.assigned_to:
            asset.assigned_at = datetime.now(timezone.utc)
            asset.status = "assigned"
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def update_asset(db: Session, asset_id: UUID, update_data: dict) -> Optional[Asset]:
        """Update an existing asset."""
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            return None
        for key, value in update_data.items():
            if value is not None:
                setattr(asset, key, value)
        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def delete_asset(db: Session, asset_id: UUID) -> bool:
        """Delete an asset."""
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            return False
        db.delete(asset)
        db.commit()
        return True

    @staticmethod
    def assign_asset(db: Session, asset_id: UUID, user_id: Optional[UUID]) -> Optional[Asset]:
        """Assign or unassign an asset to/from a user."""
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            return None

        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            asset.assigned_to = user_id
            asset.assigned_at = datetime.now(timezone.utc)
            asset.status = "assigned"
        else:
            asset.assigned_to = None
            asset.assigned_at = None
            asset.status = "available"

        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def bulk_create_assets(db: Session, assets_data: List[dict]) -> List[Asset]:
        """Bulk create assets."""
        assets = []
        for data in assets_data:
            asset = Asset(**data)
            if asset.assigned_to:
                asset.assigned_at = datetime.now(timezone.utc)
                asset.status = "assigned"
            db.add(asset)
            assets.append(asset)
        db.commit()
        for asset in assets:
            db.refresh(asset)
        return assets

    @staticmethod
    def get_asset_stats(db: Session, viewer_id: Optional[UUID] = None) -> dict:
        """Get asset statistics for the dashboard."""
        base_query = db.query(Asset)
        if viewer_id:
            base_query = base_query.filter(Asset.assigned_to == viewer_id)

        total = base_query.with_entities(func.count(Asset.id)).scalar()
        available = base_query.with_entities(func.count(Asset.id)).filter(Asset.status == "available").scalar()
        assigned = base_query.with_entities(func.count(Asset.id)).filter(Asset.status == "assigned").scalar()
        maintenance = base_query.with_entities(func.count(Asset.id)).filter(Asset.status == "maintenance").scalar()
        retired = base_query.with_entities(func.count(Asset.id)).filter(Asset.status == "retired").scalar()

        return {
            "total": total,
            "available": available,
            "assigned": assigned,
            "maintenance": maintenance,
            "retired": retired,
        }
