'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';
import api, { AssetType } from '@/services/api';

export default function NewAssetPage() {
    const router = useRouter();
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [selectedType, setSelectedType] = useState<AssetType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        asset_tag: '',
        asset_type_id: '',
        serial_number: '',
        notes: '',
        purchase_cost: '',
    });
    const [metadataFields, setMetadataFields] = useState<Record<string, unknown>>({});

    useEffect(() => {
        api.getAssetTypes().then((res) => setAssetTypes(res.asset_types));
    }, []);

    useEffect(() => {
        const type = assetTypes.find((t) => t.id === form.asset_type_id);
        setSelectedType(type || null);
        setMetadataFields({});
    }, [form.asset_type_id, assetTypes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.createAsset({
                ...form,
                metadata_fields: metadataFields,
            });
            router.push('/assets');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create asset');
        }
        setLoading(false);
    };

    return (
        <div>
            <TopBar title="Add New Asset" subtitle="Create a new IT asset" />

            <div className="p-6 max-w-3xl animate-fadeIn">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-slate-800">Basic Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Asset Name *</label>
                                <input
                                    type="text" required value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="e.g., Dell Latitude 5540"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Asset Tag *</label>
                                <input
                                    type="text" required value={form.asset_tag}
                                    onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="e.g., ASSET-001"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Asset Type *</label>
                                <select
                                    required value={form.asset_type_id}
                                    onChange={(e) => setForm({ ...form, asset_type_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                >
                                    <option value="">Select type...</option>
                                    {assetTypes.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Serial Number</label>
                                <input
                                    type="text" value={form.serial_number}
                                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Serial number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Purchase Cost</label>
                            <input
                                type="text" value={form.purchase_cost}
                                onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="e.g., $1,200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    {selectedType && selectedType.field_definitions.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="font-semibold text-slate-800 mb-4">{selectedType.name} Details</h3>
                            <DynamicFormRenderer
                                fields={selectedType.field_definitions}
                                values={metadataFields}
                                onChange={(slug, value) => setMetadataFields({ ...metadataFields, [slug]: value })}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="submit" disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Asset'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
