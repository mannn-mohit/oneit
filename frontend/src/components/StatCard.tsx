'use client';

import React, { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

const colorClasses = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-700' },
    green: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-700' },
    yellow: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-700' },
    red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-700' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', text: 'text-indigo-700' },
};

export default function StatCard({ title, value, icon, trend, trendUp, color }: StatCardProps) {
    const colors = colorClasses[color];

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
                    {trend && (
                        <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colors.icon} text-white shadow-lg`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
