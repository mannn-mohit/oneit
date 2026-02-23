'use client';

import React, { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import api, { Accessory } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function AccessoriesPage() {
    const { user } = useAuth();
    const [accessoriesList, setAccessoriesList] = useState<Accessory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const canManage = user?.is_superadmin ?? false;

    // Form state
    const [form, setForm] = useState<Partial<Accessory>>({
        name: '',
        category: '',
        total_qty: 1,
        cost: '',
    });

    const fetchAccessories = async () => {
        setLoading(true);
        try {
            const data = await api.getAccessories({ search });
            setAccessoriesList(data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { fetchAccessories(); }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this accessory?')) return;
        await api.deleteAccessory(id);
        fetchAccessories();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (form.id) {
                await api.updateAccessory(form.id, form);
            } else {
                await api.createAccessory(form);
            }
            setShowModal(false);
            setForm({ name: '', category: '', total_qty: 1, cost: '' });
            fetchAccessories();
        } catch (err) {
            alert('Failed to save accessory');
        }
    };

    return (
        <div>
            <TopBar title="Accessories" subtitle="Manage non-unique items like keyboards and mice" />

            <div className="p-6 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search accessories..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        {canManage && (
                            <button
                                onClick={() => {
                                    setForm({ name: '', category: '', total_qty: 1, cost: '' });
                                    setShowModal(true);
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                            >
                                + Add Accessory
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total / Avail</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                                ) : accessoriesList.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">No accessories found.</td></tr>
                                ) : (
                                    accessoriesList.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-800">{acc.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{acc.category || '—'}</td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <span className="text-emerald-600">{acc.available_qty}</span> <span className="text-slate-400">/ {acc.total_qty}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {canManage && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => {
                                                            setForm(acc);
                                                            setShowModal(true);
                                                        }} className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">Edit</button>
                                                        <button onClick={() => handleDelete(acc.id)} className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && canManage && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">{form.id ? 'Edit Accessory' : 'Add Accessory'}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Accessory Name</label>
                                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                                <input type="text" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Keyboard, Mouse" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Quantity</label>
                                <input required type="number" min="1" value={form.total_qty} onChange={(e) => setForm({ ...form, total_qty: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700">Save</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
