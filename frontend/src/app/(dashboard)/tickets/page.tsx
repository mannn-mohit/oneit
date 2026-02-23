'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import api, { Ticket } from '@/services/api';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.getTickets({ search, status: statusFilter, priority: priorityFilter, limit: 50 });
            setTickets(res.tickets);
            setTotal(res.total);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { fetchTickets(); }, [search, statusFilter, priorityFilter]);

    return (
        <div>
            <TopBar title="Tickets" subtitle={`${total} total tickets`} />

            <div className="p-6 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text" placeholder="Search tickets..."
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                            <option value="">All Priorities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <Link href="/tickets/new"
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 whitespace-nowrap">
                            + New Ticket
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                            ) : tickets.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No tickets found</td></tr>
                            ) : (
                                tickets.map((ticket) => {
                                    const isOverdue = ticket.sla_due_at && new Date(ticket.sla_due_at) < new Date() && !['resolved', 'closed'].includes(ticket.status);
                                    return (
                                        <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link href={`/tickets/${ticket.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">{ticket.title}</Link>
                                                <p className="text-xs text-slate-400 mt-0.5">{ticket.ticket_number}</p>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge status={ticket.priority} /></td>
                                            <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{ticket.created_by_name || '—'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{ticket.assigned_to_name || 'Unassigned'}</td>
                                            <td className="px-6 py-4 text-sm">
                                                {ticket.sla_due_at ? (
                                                    <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                                        {isOverdue && '⚠ '}{new Date(ticket.sla_due_at).toLocaleString()}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
