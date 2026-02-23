'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';
import api, { Asset, AssetType, User } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/utils/permissions';

export default function AssetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [assetType, setAssetType] = useState<AssetType | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Partial<Asset>>({});

    const canEdit = hasPermission(user, 'assets:update');
    const canDelete = hasPermission(user, 'assets:delete');
    const canAssign = hasPermission(user, 'assets:assign') && hasPermission(user, 'users:read');

    useEffect(() => {
        const id = params.id as string;
        api.getAsset(id).then((a) => {
            setAsset(a);
            setForm(a);
            if (a.asset_type_id) {
                api.getAssetTypes().then((res) => {
                    const type = res.asset_types.find((t) => t.id === a.asset_type_id);
                    setAssetType(type || null);
                });
            }
            if (canAssign) {
                api.getUsers().then(res => setUsers(res.users)).catch(() => { });
            }
            setLoading(false);
        });
    }, [params.id, canAssign]);

    const handleSave = async () => {
        const id = params.id as string;
        await api.updateAsset(id, {
            name: form.name || undefined,
            serial_number: form.serial_number || undefined,
            notes: form.notes || undefined,
            status: form.status || undefined,
            metadata_fields: form.metadata_fields as Record<string, unknown> | undefined,
            assigned_to: form.assigned_to || undefined,
            purchase_cost: form.purchase_cost || undefined,
            purchase_date: form.purchase_date || undefined,
            warranty_expiry: form.warranty_expiry || undefined,
        });
        const updated = await api.getAsset(id);
        setAsset(updated);
        setEditing(false);
    };

    if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;
    if (!asset) return <div className="p-6 text-center text-slate-400">Asset not found</div>;

    return (
        <div>
            <TopBar title={asset.name} subtitle={`Asset Tag: ${asset.asset_tag}`} />

            <div className="p-6 max-w-4xl animate-fadeIn space-y-6">
                {/* Header Actions */}
                <div className="flex items-center gap-3">
                    <StatusBadge status={asset.status} size="md" />
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            disabled={!canEdit}
                            className="px-5 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-xl hover:bg-blue-100"
                        >
                            Edit
                        </button>
                    ) : (
                        <>
                            <button onClick={handleSave} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl">
                                Save Changes
                            </button>
                            <button onClick={() => { setEditing(false); setForm(asset); }} className="px-5 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl">
                                Cancel
                            </button>
                        </>
                    )}
                    <button onClick={() => router.back()} className="px-5 py-2 text-slate-500 text-sm hover:text-slate-700">← Back</button>
                    {!editing && canDelete && (
                        <button
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this asset?')) {
                                    await api.deleteAsset(asset.id);
                                    router.push('/assets');
                                }
                            }}
                            className="px-5 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 ml-auto"
                        >
                            Delete Asset
                        </button>
                    )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-slate-800">Basic Information</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                                {editing ? (
                                    <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                ) : (
                                    <p className="text-sm text-slate-800">{asset.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Serial Number</label>
                                {editing ? (
                                    <input type="text" value={form.serial_number || ''} onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                ) : (
                                    <p className="text-sm text-slate-800">{asset.serial_number || '—'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                {editing ? (
                                    <select value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                                        <option value="available">Available</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="retired">Retired</option>
                                    </select>
                                ) : (
                                    <StatusBadge status={asset.status} />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                                {editing ? (
                                    <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
                                ) : (
                                    <p className="text-sm text-slate-800">{asset.notes || '—'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
                            <h3 className="font-semibold text-slate-800">Assignment & Purchase</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                                    <p className="text-sm text-slate-800">{asset.asset_type_name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Assigned To</label>
                                    {editing && canAssign ? (
                                        <select value={form.assigned_to || ''} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                            <option value="">Unassigned</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-slate-800">{asset.assigned_to_name || 'Unassigned'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Purchase Cost</label>
                                    {editing ? (
                                        <input type="text" value={form.purchase_cost || ''} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    ) : (
                                        <p className="text-sm text-slate-800">{asset.purchase_cost || '—'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Purchase Date</label>
                                    {editing ? (
                                        <input type="date" value={form.purchase_date || ''} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    ) : (
                                        <p className="text-sm text-slate-800">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Warranty Expiry</label>
                                    {editing ? (
                                        <input type="date" value={form.warranty_expiry || ''} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    ) : (
                                        <p className="text-sm text-slate-800">{asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : '—'}</p>
                                    )}
                                </div>
                                {!editing && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Created</label>
                                        <p className="text-sm text-slate-800">{new Date(asset.created_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {assetType && assetType.field_definitions.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="font-semibold text-slate-800 mb-4">{assetType.name} Details</h3>
                                <DynamicFormRenderer
                                    fields={assetType.field_definitions}
                                    values={(form.metadata_fields as Record<string, unknown>) || {}}
                                    onChange={(slug, value) => setForm({ ...form, metadata_fields: { ...(form.metadata_fields as Record<string, unknown>), [slug]: value } })}
                                    disabled={!editing}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
