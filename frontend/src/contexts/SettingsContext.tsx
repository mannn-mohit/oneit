'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

interface AppSettings {
    app_name: string;
    app_icon: string;
}

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
    loading: boolean;
}

const defaultSettings = { app_name: 'OneIT', app_icon: 'O' };

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    updateSettings: async () => { },
    loading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getSettings().then((data) => {
            setSettings(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const updateSettings = async (newSettings: AppSettings) => {
        const updated = await api.updateSettings(newSettings);
        setSettings(updated);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
