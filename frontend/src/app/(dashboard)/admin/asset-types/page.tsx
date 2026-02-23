'use client';

import React, { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import api, { AssetType, FieldDefinition } from '@/services/api';

export default function AssetTypesAdminPage() {
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '' });
    const [expandedType, setExpandedType] = useState<string | null>(null);

    const fetchData = async () => {
        const res = await api.getAssetTypes();
        setAssetTypes(res.asset_types);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.createAssetType(form);
            setShowForm(false);
            setForm({ name: '', slug: '', description: '', icon: '' });
            fetchData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed');
        }
    };

    const autoSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    };

    return (
        <div>
            <TopBar title="Asset Types" subtitle="Configure asset categories and their fields" />

            <div className="p-6 animate-fadeIn">
                <div className="mb-6 flex justify-end">
                    <button onClick={() => setShowForm(!showForm)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20">
                        + Add Asset Type
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 animate-fadeIn">
                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                                    <input type="text" required value={form.name}
                                        onChange={(e) => {
                                            setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) });
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="e.g., Server" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label>
                                    <input type="text" value={form.slug}
                                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                <input type="text" value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Brief description of this asset type" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl">Create</button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-xl">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading...</div>
                    ) : assetTypes.map((at) => (
                        <div key={at.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <button
                                onClick={() => setExpandedType(expandedType === at.id ? null : at.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {at.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-slate-800">{at.name}</h3>
                                        <p className="text-xs text-slate-500">{at.description || at.slug} · {at.field_definitions.length} fields</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${at.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {at.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedType === at.id ? 'rotate-180' : ''}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {expandedType === at.id && (
                                <div className="px-6 pb-4 animate-fadeIn">
                                    <div className="border-t border-slate-100 pt-4">
                                        <h4 className="text-sm font-semibold text-slate-600 mb-3">Field Definitions</h4>
                                        {at.field_definitions.length === 0 ? (
                                            <p className="text-sm text-slate-400">No fields defined yet</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {at.field_definitions.map((fd) => (
                                                    <div key={fd.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                                        <span className="text-sm font-medium text-slate-800 w-40">{fd.name}</span>
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md">{fd.field_type}</span>
                                                        {fd.is_required && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-md">Required</span>}
                                                        {fd.placeholder && <span className="text-xs text-slate-400">{fd.placeholder}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
