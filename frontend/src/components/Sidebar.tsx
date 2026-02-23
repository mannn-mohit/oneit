'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon, UsersIcon, ShieldCheckIcon, CubeIcon, QueueListIcon,
    TicketIcon, TagIcon, SwatchIcon, ChevronLeftIcon, ChevronRightIcon,
    ArrowRightOnRectangleIcon, Cog6ToothIcon, PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';
import { hasAnyPermission } from '@/utils/permissions';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const navSections: NavSection[] = [
    {
        title: 'Main',
        items: [
            {
                label: 'Dashboard',
                href: '/dashboard',
                icon: HomeIcon,
            },
            {
                label: 'Assets',
                href: '/assets',
                icon: CubeIcon,
            },
            {
                label: 'Components',
                href: '/components',
                icon: PuzzlePieceIcon,
            },
            {
                label: 'Accessories',
                href: '/accessories',
                icon: QueueListIcon,
            },
            {
                label: 'Tickets',
                href: '/tickets',
                icon: TicketIcon,
            },
        ],
    },
    {
        title: 'Administration',
        items: [
            {
                label: 'Users',
                href: '/admin/users',
                icon: UsersIcon,
            },
            {
                label: 'Roles',
                href: '/admin/roles',
                icon: ShieldCheckIcon,
            },
            {
                label: 'Asset Types',
                href: '/admin/asset-types',
                icon: TagIcon,
            },
            {
                label: 'Imports',
                href: '/admin/imports',
                icon: ArrowRightOnRectangleIcon,
            },
            {
                label: 'App Marketplace',
                href: '/admin/apps',
                icon: SwatchIcon,
            },
            {
                label: 'Settings',
                href: '/admin/settings',
                icon: Cog6ToothIcon,
            },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { settings } = useSettings();
    const [collapsed, setCollapsed] = useState(false);

    const canSeeAdmin = hasAnyPermission(user, ['users:read', 'roles:read', 'asset_types:read', 'roles:manage', 'asset_types:manage']);

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Logo */}
            <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'gap-3'} border-b border-indigo-700/50 min-h-[80px]`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                    <span className="text-white font-extrabold text-xl tracking-tighter">
                        {settings?.app_icon || 'O'}
                    </span>
                </div>
                {!collapsed && (
                    <div className="flex-1 animate-fadeIn">
                        <h1 className="text-xl font-bold text-white tracking-tight">{settings?.app_name || 'OneIT'}</h1>
                        <p className="text-xs text-indigo-300 font-medium">Enterprise Portal</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navSections
                    .filter((section) => section.title !== 'Administration' || canSeeAdmin)
                    .map((section, sectionIndex) => (
                    <React.Fragment key={section.title}>
                        {!collapsed && (
                            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">
                                {section.title}
                            </p>
                        )}
                        {collapsed && sectionIndex > 0 && <div className="border-t border-slate-700/50 my-3" />}
                        {section.items
                            .filter((item) => {
                                if (section.title !== 'Administration') return true;
                                if (item.href === '/admin/users') return hasAnyPermission(user, ['users:read', 'users:create', 'users:update', 'users:delete']);
                                if (item.href === '/admin/roles') return hasAnyPermission(user, ['roles:read', 'roles:manage']);
                                if (item.href === '/admin/asset-types') return hasAnyPermission(user, ['asset_types:read', 'asset_types:manage', 'assets:read']);
                                if (item.href === '/admin/imports') return user?.is_superadmin ?? false;
                                if (item.href === '/admin/settings') return user?.is_superadmin ?? false;
                                if (item.href === '/admin/apps') return user?.is_superadmin ?? false;
                                return true;
                            })
                            .map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const IconComponent = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                        }`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <IconComponent className="w-5 h-5" />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </React.Fragment>
                ))}
            </nav>

            {/* User section */}
            <div className="border-t border-slate-700/50 p-3">
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.role_name || 'Admin'}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={logout}
                            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </aside >
    );
}
