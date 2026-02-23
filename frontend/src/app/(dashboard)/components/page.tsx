'use client';

import React, { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import api, { Component } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function ComponentsPage() {
    const { user } = useAuth();
    const [componentsList, setComponentsList] = useState<Component[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const canManage = user?.is_superadmin ?? false;

    // Form state
    const [form, setForm] = useState<Partial<Component>>({
        name: '',
        category: '',
        serial_number: '',
        total_qty: 1,
        cost: '',
    });

    const fetchComponents = async () => {
        setLoading(true);
        try {
            const data = await api.getComponents({ search });
            setComponentsList(data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { fetchComponents(); }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this component?')) return;
        await api.deleteComponent(id);
        fetchComponents();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (form.id) {
                await api.updateComponent(form.id, form);
            } else {
                await api.createComponent(form);
            }
            setShowModal(false);
            setForm({ name: '', category: '', serial_number: '', total_qty: 1, cost: '' });
            fetchComponents();
        } catch (err) {
            alert('Failed to save component');
        }
    };

    return (
        <div>
            <TopBar title="Components" subtitle="Manage internal trackable upgrades (RAM, SSDs, etc.)" />

            <div className="p-6 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search components..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        {canManage && (
                            <button
                                onClick={() => {
                                    setForm({ name: '', category: '', serial_number: '', total_qty: 1, cost: '' });
                                    setShowModal(true);
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                            >
                                + Add Component
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
                                ) : componentsList.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">No components found.</td></tr>
                                ) : (
                                    componentsList.map((comp) => (
                                        <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-800">{comp.name}</div>
                                                {comp.serial_number && <div className="text-xs text-slate-400 mt-0.5">S/N: {comp.serial_number}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{comp.category || '—'}</td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <span className="text-blue-600">{comp.available_qty}</span> <span className="text-slate-400">/ {comp.total_qty}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {canManage && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => {
                                                            setForm(comp);
                                                            setShowModal(true);
                                                        }} className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg">Edit</button>
                                                        <button onClick={() => handleDelete(comp.id)} className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
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
                            <h3 className="text-lg font-bold text-slate-800">{form.id ? 'Edit Component' : 'Add Component'}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Component Name</label>
                                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                                <input type="text" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. RAM, SSD" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Serial Number</label>
                                <input type="text" value={form.serial_number || ''} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
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
