'use client';

import React, { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import api, { AssetStats, TicketStats, Ticket, Asset } from '@/services/api';

export default function DashboardPage() {
    const [assetStats, setAssetStats] = useState<AssetStats | null>(null);
    const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
    const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
    const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getAssetStats().catch(() => null),
            api.getTicketStats().catch(() => null),
            api.getTickets({ limit: 5 }).catch(() => ({ tickets: [] })),
            api.getAssets({ limit: 5 }).catch(() => ({ assets: [] })),
        ]).then(([assets, tickets, recentTkts, recentAsts]) => {
            setAssetStats(assets);
            setTicketStats(tickets);
            setRecentTickets(recentTkts.tickets);
            setRecentAssets(recentAsts.assets);
            setLoading(false);
        });
    }, []);

    return (
        <div>
            <TopBar title="Dashboard" subtitle="Welcome back! Here's your IT overview." />

            <div className="p-6 space-y-6 animate-fadeIn">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Assets"
                        value={assetStats?.total ?? '—'}
                        color="blue"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}
                    />
                    <StatCard
                        title="Available"
                        value={assetStats?.available ?? '—'}
                        color="green"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatCard
                        title="Open Tickets"
                        value={ticketStats?.open ?? '—'}
                        color="yellow"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
                    />
                    <StatCard
                        title="Overdue"
                        value={ticketStats?.overdue ?? '—'}
                        color="red"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-500 mb-4">Asset Distribution</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Available', value: assetStats?.available ?? 0, total: assetStats?.total ?? 1, color: 'bg-emerald-500' },
                                { label: 'Assigned', value: assetStats?.assigned ?? 0, total: assetStats?.total ?? 1, color: 'bg-blue-500' },
                                { label: 'Maintenance', value: assetStats?.maintenance ?? 0, total: assetStats?.total ?? 1, color: 'bg-amber-500' },
                                { label: 'Retired', value: assetStats?.retired ?? 0, total: assetStats?.total ?? 1, color: 'bg-slate-400' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 w-24">{item.label}</span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 w-8 text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-500 mb-4">Ticket Overview</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Open', value: ticketStats?.open ?? 0, color: 'text-blue-600 bg-blue-50' },
                                { label: 'In Progress', value: ticketStats?.in_progress ?? 0, color: 'text-amber-600 bg-amber-50' },
                                { label: 'Resolved', value: ticketStats?.resolved ?? 0, color: 'text-emerald-600 bg-emerald-50' },
                                { label: 'Overdue', value: ticketStats?.overdue ?? 0, color: 'text-red-600 bg-red-50' },
                            ].map((item) => (
                                <div key={item.label} className={`rounded-xl p-3 ${item.color}`}>
                                    <p className="text-2xl font-bold">{item.value}</p>
                                    <p className="text-xs font-medium opacity-80">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-500 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Add New Asset', href: '/assets/new', icon: '+' },
                                { label: 'Create Ticket', href: '/tickets/new', icon: '+' },
                                { label: 'Manage Users', href: '/admin/users', icon: '→' },
                            ].map((action) => (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors group"
                                >
                                    <span className="text-sm font-medium text-slate-700">{action.label}</span>
                                    <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{action.icon}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Data */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Tickets */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">Recent Tickets</h3>
                            <a href="/tickets" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</a>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentTickets.length > 0 ? recentTickets.map((ticket) => (
                                <a key={ticket.id} href={`/tickets/${ticket.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{ticket.title}</p>
                                        <p className="text-xs text-slate-500">{ticket.ticket_number} · {ticket.created_by_name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={ticket.priority} />
                                        <StatusBadge status={ticket.status} />
                                    </div>
                                </a>
                            )) : (
                                <div className="px-6 py-8 text-center text-sm text-slate-400">No tickets yet</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Assets */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">Recent Assets</h3>
                            <a href="/assets" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</a>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentAssets.length > 0 ? recentAssets.map((asset) => (
                                <a key={asset.id} href={`/assets/${asset.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{asset.name}</p>
                                        <p className="text-xs text-slate-500">{asset.asset_tag} · {asset.asset_type_name}</p>
                                    </div>
                                    <StatusBadge status={asset.status} />
                                </a>
                            )) : (
                                <div className="px-6 py-8 text-center text-sm text-slate-400">No assets yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
