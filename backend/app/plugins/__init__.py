"""
OneIT Plugin System

Plugins can extend the platform's functionality by:
- Adding custom asset types with specialized fields
- Implementing custom workflow actions
- Adding integrations with external systems (e.g., MDM, monitoring)
- Custom report generators

To create a plugin:
1. Create a new module in this package
2. Define a class that inherits from PluginBase
3. Register the plugin in the INSTALLED_PLUGINS list
"""

from typing import Dict, Any, Optional


class PluginBase:
    """Base class for all OneIT plugins."""

    name: str = "base_plugin"
    version: str = "1.0.0"
    description: str = ""

    def on_install(self):
        """Called when the plugin is installed."""
        pass

    def on_uninstall(self):
        """Called when the plugin is uninstalled."""
        pass

    def on_asset_create(self, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        """Hook called when an asset is created. Can modify asset data."""
        return asset_data

    def on_asset_update(self, asset_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        """Hook called when an asset is updated."""
        return changes

    def on_ticket_create(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """Hook called when a ticket is created."""
        return ticket_data


# Registry of installed plugins
INSTALLED_PLUGINS: list[PluginBase] = []


def register_plugin(plugin: PluginBase):
    """Register a plugin with the system."""
    INSTALLED_PLUGINS.append(plugin)
    plugin.on_install()


def get_installed_plugins() -> list[PluginBase]:
    """Get all installed plugins."""
    return INSTALLED_PLUGINS
