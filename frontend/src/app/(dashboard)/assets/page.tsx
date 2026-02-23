'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import api, { Asset, AssetType } from '@/services/api';

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const [res, typesRes] = await Promise.all([
                api.getAssets({ search, status: statusFilter, asset_type_id: typeFilter, limit: 50 }),
                api.getAssetTypes(),
            ]);
            setAssets(res.assets);
            setTotal(res.total);
            setAssetTypes(typesRes.asset_types);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { fetchAssets(); }, [search, statusFilter, typeFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        await api.deleteAsset(id);
        fetchAssets();
    };

    return (
        <div>
            <TopBar title="Assets" subtitle={`${total} total assets`} />

            <div className="p-6 animate-fadeIn">
                {/* Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search assets by name, tag, or serial..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                        >
                            <option value="">All Types</option>
                            {assetTypes.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <Link
                            href="/assets/new"
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                        >
                            + Add Asset
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tag</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                                ) : assets.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No assets found. Create your first asset to get started.</td></tr>
                                ) : (
                                    assets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link href={`/assets/${asset.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">{asset.name}</Link>
                                                {asset.serial_number && <p className="text-xs text-slate-400 mt-0.5">S/N: {asset.serial_number}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">{asset.asset_tag}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{asset.asset_type_name}</td>
                                            <td className="px-6 py-4"><StatusBadge status={asset.status} /></td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{asset.assigned_to_name || '—'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/assets/${asset.id}`} className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">Edit</Link>
                                                    <button onClick={() => handleDelete(asset.id)} className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
