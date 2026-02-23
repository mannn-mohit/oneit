'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import api, { Ticket } from '@/services/api';

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getTicket(params.id as string).then((t) => { setTicket(t); setLoading(false); });
    }, [params.id]);

    const updateStatus = async (status: string) => {
        await api.updateTicket(params.id as string, { status });
        const updated = await api.getTicket(params.id as string);
        setTicket(updated);
    };

    if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;
    if (!ticket) return <div className="p-6 text-center text-slate-400">Ticket not found</div>;

    const isOverdue = ticket.sla_due_at && new Date(ticket.sla_due_at) < new Date() && !['resolved', 'closed'].includes(ticket.status);

    return (
        <div>
            <TopBar title={ticket.ticket_number} subtitle={ticket.title} />

            <div className="p-6 max-w-4xl animate-fadeIn space-y-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={ticket.status} size="md" />
                    <StatusBadge status={ticket.priority} size="md" />
                    {isOverdue && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">⚠ SLA Breached</span>
                    )}
                    <div className="flex-1" />
                    <button onClick={() => router.back()} className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700">← Back</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="font-semibold text-slate-800 mb-3">{ticket.title}</h3>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
                        </div>

                        {/* Status Actions */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h4 className="font-semibold text-slate-800 mb-3">Update Status</h4>
                            <div className="flex flex-wrap gap-2">
                                {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                                    <button key={s} onClick={() => updateStatus(s)}
                                        disabled={ticket.status === s}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${ticket.status === s
                                                ? 'bg-blue-100 text-blue-700 cursor-default'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}>
                                        {s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
                            <h4 className="font-semibold text-slate-800">Details</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Created By</span>
                                    <span className="text-slate-800 font-medium">{ticket.created_by_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Assigned To</span>
                                    <span className="text-slate-800 font-medium">{ticket.assigned_to_name || 'Unassigned'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Category</span>
                                    <span className="text-slate-800">{ticket.category || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Created</span>
                                    <span className="text-slate-800">{new Date(ticket.created_at).toLocaleString()}</span>
                                </div>
                                {ticket.sla_due_at && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">SLA Due</span>
                                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-800'}>
                                            {new Date(ticket.sla_due_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {ticket.resolved_at && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Resolved</span>
                                        <span className="text-emerald-600 font-medium">{new Date(ticket.resolved_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {ticket.asset_ids.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h4 className="font-semibold text-slate-800 mb-2">Linked Assets</h4>
                                <p className="text-sm text-slate-500">{ticket.asset_ids.length} asset(s) linked</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
