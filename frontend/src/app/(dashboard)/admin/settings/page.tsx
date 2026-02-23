'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

export default function SettingsAdminPage() {
    const { settings, updateSettings } = useSettings();
    const [form, setForm] = useState({ app_name: '', app_icon: '' });
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (settings) {
            setForm({ app_name: settings.app_name, app_icon: settings.app_icon });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('saving');
        try {
            await updateSettings(form);
            setStatus('success');
            setMessage('Settings updated successfully!');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to update settings');
        }
    };

    return (
        <div>
            <TopBar title="Application Settings" subtitle="Branding & Configuration" />

            <div className="p-6 max-w-2xl animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Global Branding</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'success' && (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">✓</div>
                                <p className="text-sm font-medium text-emerald-800">{message}</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">!</div>
                                <p className="text-sm font-medium text-red-800">{message}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Application Name</label>
                            <input
                                type="text"
                                required
                                value={form.app_name}
                                onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="e.g. OneIT, MyCompanyIT"
                            />
                            <p className="text-xs text-slate-500">This name will appear on the sidebar and login screen.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Application Icon Text</label>
                            <input
                                type="text"
                                required
                                maxLength={2}
                                value={form.app_icon}
                                onChange={(e) => setForm({ ...form, app_icon: e.target.value })}
                                className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center uppercase"
                                placeholder="O"
                            />
                            <p className="text-xs text-slate-500">A short 1-2 character identifier to represent the logo.</p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={status === 'saving'}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg transition-all ${status === 'saving'
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20'
                                    }`}
                            >
                                {status === 'saving' ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
