'use client';

import React, { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import api, { AppIntegration } from '@/services/api';

export default function MarketplacePage() {
    const [apps, setApps] = useState<AppIntegration[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [configuringApp, setConfiguringApp] = useState<AppIntegration | null>(null);

    const fetchApps = async () => {
        setLoading(true);
        try {
            const data = await api.getApps();
            setApps(data);
        } catch (error) {
            console.error('Failed to fetch apps', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchApps();
    }, []);

    const handleInstall = async (id: string) => {
        setActionLoading(id);
        try {
            await api.installApp(id);
            await fetchApps();
        } catch (err) {
            alert('Failed to install app');
        }
        setActionLoading(null);
    };

    const handleUninstall = async (id: string) => {
        if (!confirm('Are you sure you want to uninstall this integration?')) return;
        setActionLoading(id);
        try {
            await api.uninstallApp(id);
            await fetchApps();
        } catch (err) {
            alert('Failed to uninstall app');
        }
        setActionLoading(null);
    };

    const handleConfigureSubmit = async (appId: string, webhookUrl: string, apiKey: string) => {
        setActionLoading(appId);
        try {
            await api.configureApp(appId, { webhook_url: webhookUrl, api_key: apiKey });
            await fetchApps();
            setConfiguringApp(null);
        } catch (err) {
            alert('Failed to configure app');
        }
        setActionLoading(null);
    };

    return (
        <div>
            <TopBar title="App Marketplace" subtitle="Extend OneIT with external integrations" />

            <div className="p-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-slate-400">Loading Integrations...</div>
                    ) : (
                        apps.map((app) => (
                            <div key={app.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                        <span className="text-slate-500 font-bold text-xl">{app.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800">{app.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{app.description}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        {app.is_installed ? (
                                            <span className="text-emerald-600 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Installed
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">Not Installed</span>
                                        )}
                                    </div>
                                    <div>
                                        {app.is_installed ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setConfiguringApp(app)}
                                                    className="px-4 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                >
                                                    Configure
                                                </button>
                                                <button
                                                    onClick={() => handleUninstall(app.id)}
                                                    disabled={actionLoading === app.id}
                                                    className="px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === app.id ? 'Loading...' : 'Uninstall'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleInstall(app.id)}
                                                disabled={actionLoading === app.id}
                                                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === app.id ? 'Installing...' : 'Install'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {configuringApp && (
                <ConfigModal
                    app={configuringApp}
                    onClose={() => setConfiguringApp(null)}
                    onSubmit={(webhookUrl, apiKey) => handleConfigureSubmit(configuringApp.id, webhookUrl, apiKey)}
                />
            )}
        </div>
    );
}

function ConfigModal({
    app,
    onClose,
    onSubmit
}: {
    app: AppIntegration;
    onClose: () => void;
    onSubmit: (webhookUrl: string, apiKey: string) => void;
}) {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [apiKey, setApiKey] = useState('');

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Configure {app.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">Enter your API credentials to connect.</p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Webhook URL</label>
                        <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="https://api.example.com/webhook"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key / Token</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="Leave blank if not required"
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(webhookUrl, apiKey)}
                        className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
