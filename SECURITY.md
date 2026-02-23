# Security

## Authentication

- **JWT Tokens**: HS256-signed access tokens with configurable expiration
- **Password Hashing**: bcrypt via passlib
- **SSO Support**: SAML 2.0, OAuth 2.0/OIDC, LDAP (stub implementations, configure via .env)

## Authorization

- **RBAC**: Role-based access control with granular permissions per module
- **Permission Decorators**: `@require_permissions("assets:read")` for route-level checks
- **Superadmin Override**: Superadmin users bypass all permission checks

## Data Protection

- **Audit Logging**: All entity changes are logged with user attribution and IP address
- **CORS**: Configurable allowed origins via `BACKEND_CORS_ORIGINS`
- **Input Validation**: Pydantic schemas validate all API inputs

## Production Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Change default admin password
- [ ] Enable HTTPS via nginx SSL configuration
- [ ] Set `DEBUG=false` in production
- [ ] Configure CORS origins to your domain only
- [ ] Use managed PostgreSQL with encrypted connections
- [ ] Enable database backups
