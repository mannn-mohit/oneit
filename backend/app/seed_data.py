"""
Seed Data Script

Run this script to populate the database with initial data:
  python -m app.seed_data

This creates:
- Default permissions for all modules
- Default roles (Admin, IT Manager, IT Support, Employee)
- Default superadmin user (admin/admin123)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Role, Permission, AssetType, FieldDefinition

# Import all models so tables are created
from app.models import *  # noqa


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).first():
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # --- Permissions ---
        permissions_data = [
            # Assets
            ("assets:read", "View Assets", "View all assets", "assets"),
            ("assets:create", "Create Assets", "Create new assets", "assets"),
            ("assets:update", "Update Assets", "Update existing assets", "assets"),
            ("assets:delete", "Delete Assets", "Delete assets", "assets"),
            ("assets:assign", "Assign Assets", "Assign assets to users", "assets"),
            ("assets:import", "Import Assets", "Bulk import assets", "assets"),
            # Components
            ("components:read", "View Components", "View all components", "inventory"),
            ("components:manage", "Manage Components", "Create, update, delete components", "inventory"),
            # Accessories
            ("accessories:read", "View Accessories", "View all accessories", "inventory"),
            ("accessories:manage", "Manage Accessories", "Create, update, delete accessories", "inventory"),
            # Tickets
            ("tickets:read", "View Tickets", "View all tickets", "tickets"),
            ("tickets:create", "Create Tickets", "Create new tickets", "tickets"),
            ("tickets:update", "Update Tickets", "Update tickets", "tickets"),
            ("tickets:delete", "Delete Tickets", "Delete tickets", "tickets"),
            ("tickets:assign", "Assign Tickets", "Assign tickets to agents", "tickets"),
            # Teams
            ("teams:read", "View Teams", "View teams and members", "admin"),
            ("teams:manage", "Manage Teams", "Create, update, delete teams and members", "admin"),
            # Users
            ("users:read", "View Users", "View all users", "admin"),
            ("users:create", "Create Users", "Create new users", "admin"),
            ("users:update", "Update Users", "Update existing users", "admin"),
            ("users:delete", "Delete Users", "Delete users", "admin"),
            # Roles
            ("roles:read", "View Roles", "View all roles", "admin"),
            ("roles:manage", "Manage Roles", "Create, update, delete roles", "admin"),
            # Asset Types
            ("asset_types:read", "View Asset Types", "View asset types", "admin"),
            ("asset_types:manage", "Manage Asset Types", "Create, update, delete asset types", "admin"),
            # Reports
            ("reports:view", "View Reports", "Access reports and analytics", "reports"),
        ]

        permissions = {}
        for codename, name, description, module in permissions_data:
            perm = Permission(codename=codename, name=name, description=description, module=module)
            db.add(perm)
            permissions[codename] = perm

        db.flush()

        # --- Roles ---
        admin_role = Role(
            name="Admin",
            description="Full system administrator",
            is_system=True,
        )
        admin_role.permissions = list(permissions.values())
        db.add(admin_role)

        it_manager_role = Role(
            name="IT Manager",
            description="IT department manager with asset and ticket management",
            is_system=True,
        )
        it_manager_role.permissions = [
            permissions[p] for p in [
                "assets:read", "assets:create", "assets:update", "assets:assign",
                "assets:import", "tickets:read", "tickets:create", "tickets:update",
                "tickets:assign", "users:read", "asset_types:read",
                "asset_types:manage", "reports:view",
                "components:read", "components:manage",
                "accessories:read", "accessories:manage",
                "teams:read",
            ]
        ]
        db.add(it_manager_role)

        support_role = Role(
            name="IT Support",
            description="IT support agent with ticket handling",
            is_system=True,
        )
        support_role.permissions = [
            permissions[p] for p in [
                "assets:read", "assets:update", "tickets:read", "tickets:create",
                "tickets:update", "users:read",
                "components:read",
                "accessories:read",
            ]
        ]
        db.add(support_role)

        employee_role = Role(
            name="Employee",
            description="Regular employee with basic access",
            is_system=True,
        )
        employee_role.permissions = [
            permissions[p] for p in [
                "assets:read", "tickets:read", "tickets:create",
            ]
        ]
        db.add(employee_role)

        db.flush()

        # --- Default Admin User ---
        admin_user = User(
            email="admin@oneit.com",
            username="admin",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            is_superadmin=True,
            role_id=admin_role.id,
        )
        db.add(admin_user)

        # --- Default Asset Types ---
        laptop_type = AssetType(name="Laptop", slug="laptop", description="Laptop computers", icon="laptop")
        db.add(laptop_type)
        db.flush()

        laptop_fields = [
            FieldDefinition(asset_type_id=laptop_type.id, name="Manufacturer", slug="manufacturer", field_type="text", is_required=True, order=1, placeholder="e.g., Dell, Lenovo, HP"),
            FieldDefinition(asset_type_id=laptop_type.id, name="Model", slug="model", field_type="text", is_required=True, order=2),
            FieldDefinition(asset_type_id=laptop_type.id, name="RAM (GB)", slug="ram_gb", field_type="number", order=3),
            FieldDefinition(asset_type_id=laptop_type.id, name="Storage (GB)", slug="storage_gb", field_type="number", order=4),
            FieldDefinition(asset_type_id=laptop_type.id, name="Operating System", slug="os", field_type="select", order=5, options={"choices": ["Windows 11", "Windows 10", "macOS", "Linux"]}),
        ]
        db.add_all(laptop_fields)

        monitor_type = AssetType(name="Monitor", slug="monitor", description="Display monitors", icon="monitor")
        db.add(monitor_type)
        db.flush()

        monitor_fields = [
            FieldDefinition(asset_type_id=monitor_type.id, name="Manufacturer", slug="manufacturer", field_type="text", is_required=True, order=1),
            FieldDefinition(asset_type_id=monitor_type.id, name="Size (inches)", slug="size_inches", field_type="number", order=2),
            FieldDefinition(asset_type_id=monitor_type.id, name="Resolution", slug="resolution", field_type="select", order=3, options={"choices": ["1920x1080", "2560x1440", "3840x2160"]}),
        ]
        db.add_all(monitor_fields)

        phone_type = AssetType(name="Mobile Phone", slug="mobile-phone", description="Mobile phones and smartphones", icon="smartphone")
        db.add(phone_type)

        printer_type = AssetType(name="Printer", slug="printer", description="Printers and MFPs", icon="printer")
        db.add(printer_type)

        network_type = AssetType(name="Network Equipment", slug="network-equipment", description="Switches, routers, access points", icon="wifi")
        db.add(network_type)

        db.commit()
        print("✅ Database seeded successfully!")
        print("   Admin login: admin / admin123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
