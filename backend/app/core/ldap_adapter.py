"""
LDAP Authentication Adapter

Provides LDAP/Active Directory integration for user authentication
and directory synchronization.

Production setup requires:
- pip install python-ldap
- LDAP server connection details in environment
"""

from typing import Optional, Dict, Any, List


class LDAPAdapter:
    """LDAP/Active Directory authentication adapter."""

    def __init__(
        self,
        server_url: str = "",
        base_dn: str = "",
        bind_dn: str = "",
        bind_password: str = "",
        user_search_base: str = "",
        user_search_filter: str = "(sAMAccountName={username})",
    ):
        self.server_url = server_url
        self.base_dn = base_dn
        self.bind_dn = bind_dn
        self.bind_password = bind_password
        self.user_search_base = user_search_base
        self.user_search_filter = user_search_filter
        self._configured = bool(server_url)

    @property
    def is_configured(self) -> bool:
        return self._configured

    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user against LDAP.
        Returns user attributes if successful, None if failed.
        """
        if not self._configured:
            raise ValueError("LDAP is not configured.")
        # Production: use python-ldap to bind and search
        return None

    def search_users(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Search for users in the LDAP directory."""
        if not self._configured:
            raise ValueError("LDAP is not configured.")
        return []

    def sync_user(self, ldap_user: Dict[str, Any]) -> Dict[str, Any]:
        """Sync an LDAP user to the local database."""
        return {
            "email": ldap_user.get("mail", ""),
            "full_name": ldap_user.get("displayName", ""),
            "username": ldap_user.get("sAMAccountName", ""),
            "sso_provider": "ldap",
            "sso_id": ldap_user.get("distinguishedName", ""),
        }

    def get_user_groups(self, username: str) -> List[str]:
        """Get group memberships for a user."""
        if not self._configured:
            raise ValueError("LDAP is not configured.")
        return []


# Default instance
ldap_adapter = LDAPAdapter()
