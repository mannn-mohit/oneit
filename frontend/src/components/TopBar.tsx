'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
    title: string;
    subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
    const { user } = useAuth();
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
            <div>
                <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-4">
                {/* Global Search */}
                <div className={`relative transition-all duration-300 ${searchOpen ? 'w-80' : 'w-10'}`}>
                    {searchOpen ? (
                        <div className="flex items-center">
                            <input
                                type="text"
                                placeholder="Search assets, tickets, users..."
                                className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10"
                                autoFocus
                                onBlur={() => setSearchOpen(false)}
                            />
                            <button
                                onClick={() => setSearchOpen(false)}
                                className="absolute right-2 text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Notifications */}
                <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors relative text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </div>
        </header>
    );
}
