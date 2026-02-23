'use client';

import React, { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import api, { Role, Permission } from '@/services/api';

export default function RolesAdminPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', permission_ids: [] as string[] });
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        const [rolesRes, permsRes] = await Promise.all([api.getRoles(), api.getPermissions()]);
        setRoles(rolesRes.roles);
        setPermissions(permsRes);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.createRole(form);
            setShowForm(false);
            setForm({ name: '', description: '', permission_ids: [] });
            fetchData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create role');
        }
    };

    const togglePerm = (permId: string) => {
        setForm({
            ...form,
            permission_ids: form.permission_ids.includes(permId)
                ? form.permission_ids.filter((id) => id !== permId)
                : [...form.permission_ids, permId],
        });
    };

    const grouped = permissions.reduce((acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div>
            <TopBar title="Role Management" subtitle={`${roles.length} roles configured`} />

            <div className="p-6 animate-fadeIn">
                <div className="mb-6 flex justify-end">
                    <button onClick={() => setShowForm(!showForm)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20">
                        + Add Role
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 animate-fadeIn">
                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Name *</label>
                                    <input type="text" required value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                    <input type="text" value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
                                <div className="space-y-3">
                                    {Object.entries(grouped).map(([module, perms]) => (
                                        <div key={module} className="p-3 bg-slate-50 rounded-xl">
                                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{module}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {perms.map((p) => (
                                                    <button key={p.id} type="button" onClick={() => togglePerm(p.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.permission_ids.includes(p.id)
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-white text-slate-600 hover:bg-slate-100'
                                                            }`}>
                                                        {p.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl">Create Role</button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-xl">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-2 text-center py-12 text-slate-400">Loading...</div>
                    ) : roles.map((role) => (
                        <div key={role.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{role.name}</h3>
                                    <p className="text-sm text-slate-500">{role.description || 'No description'}</p>
                                </div>
                                {role.is_system && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">System</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {role.permissions.slice(0, 6).map((p) => (
                                    <span key={p.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md">{p.name}</span>
                                ))}
                                {role.permissions.length > 6 && (
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded-md">+{role.permissions.length - 6} more</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
