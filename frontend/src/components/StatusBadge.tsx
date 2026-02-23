'use client';

import React from 'react';

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    assigned: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-amber-100 text-amber-700',
    retired: 'bg-slate-100 text-slate-600',
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-100 text-slate-600',
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const colorClass = statusColors[status] || 'bg-slate-100 text-slate-600';
    const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${colorClass} ${sizeClass}`}>
            {label}
        </span>
    );
}
