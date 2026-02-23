'use client';

import React, { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import api, { User, Role } from '@/services/api';

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '', role_id: '' });
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        const res = await api.getUsers({ search, limit: 50 });
        setUsers(res.users);
        setTotal(res.total);
        setLoading(false);
    };

    const fetchRoles = async () => {
        try {
            const data = await api.getRoles();
            setRoles(data.roles);
        } catch (e) { }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const payload = { ...form };
            if (!payload.role_id) delete (payload as any).role_id;
            if (editingUserId && !payload.password) delete (payload as any).password;

            if (editingUserId) {
                await api.updateUser(editingUserId, payload as any);
            } else {
                await api.createUser(payload);
            }
            setShowForm(false);
            setEditingUserId(null);
            setForm({ email: '', username: '', full_name: '', password: '', role_id: '' });
            fetchUsers();
        } catch (err: any) {
            let msg = err.message || 'Failed to create user';
            // Parse Pydantic validation array string if present
            try {
                const parsed = JSON.parse(msg);
                if (Array.isArray(parsed)) {
                    msg = parsed.map(p => `${p.loc.join('.')}: ${p.msg}`).join(', ');
                }
            } catch (e) { }
            setError(msg);
        }
    };

    const toggleActive = async (user: User) => {
        await api.updateUser(user.id, { is_active: !user.is_active } as any);
        fetchUsers();
    };

    return (
        <div>
            <TopBar title="User Management" subtitle={`${total} users`} />

            <div className="p-6 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <input type="text" placeholder="Search users..." value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        <button onClick={() => {
                            setEditingUserId(null);
                            setForm({ email: '', username: '', full_name: '', password: '', role_id: '' });
                            setShowForm(!showForm);
                        }}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 whitespace-nowrap">
                            + Add User
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3 animate-fadeIn">
                            <h3 className="text-sm font-semibold text-slate-800">{editingUserId ? 'Edit User' : 'Add New User'}</h3>
                            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" required placeholder="Full Name" value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                <input type="email" required placeholder="Email" value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                <input type="text" required placeholder="Username" value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                <input type="password" required={!editingUserId} placeholder={editingUserId ? "Leave blank to keep current password" : "Password"} value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                <select
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={form.role_id}
                                    onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                                >
                                    <option value="">No Role / Standard User</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">{editingUserId ? 'Save Changes' : 'Create'}</button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingUserId(null); }} className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg">Cancel</button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Last Login</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                {user.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
                                                <p className="text-xs text-slate-400">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {user.is_superadmin ? (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Superadmin</span>
                                        ) : (
                                            user.role_name || '—'
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => toggleActive(user)}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg ${user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => {
                                            setEditingUserId(user.id);
                                            setForm({
                                                email: user.email,
                                                username: user.username,
                                                full_name: user.full_name,
                                                password: '',
                                                role_id: user.role_id || ''
                                            });
                                            setShowForm(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }} className="px-3 py-1 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100">
                                            Edit
                                        </button>
                                        <button onClick={async () => {
                                            if (confirm(`Are you sure you want to delete ${user.full_name}?`)) {
                                                try {
                                                    await api.deleteUser(user.id);
                                                    fetchUsers();
                                                } catch (err: any) { alert(err.message); }
                                            }
                                        }} className="px-3 py-1 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
