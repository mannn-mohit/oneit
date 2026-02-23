'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import Sidebar from '@/components/Sidebar';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { loading: authLoading, isAuthenticated } = useAuth();
    const { loading: settingsLoading, settings } = useSettings();
    const router = useRouter();
    const loading = authLoading || settingsLoading;

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="animate-pulse-subtle flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{settings?.app_icon || 'O'}</span>
                    </div>
                    <p className="text-sm text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <main className="ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SettingsProvider>
                <DashboardContent>{children}</DashboardContent>
            </SettingsProvider>
        </AuthProvider>
    );
}
