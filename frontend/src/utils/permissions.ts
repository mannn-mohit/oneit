import type { User } from '@/services/api';

export function hasPermission(user: User | null | undefined, permission: string): boolean {
    if (!user) return false;
    if (user.is_superadmin) return true;
    const perms = user.permissions || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
    return permissions.some((p) => hasPermission(user, p));
}

