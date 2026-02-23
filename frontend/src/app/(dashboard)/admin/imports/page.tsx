'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import api, {
    ImportExecuteRequest,
    ImportPreviewResponse,
    ImportMappingRequest,
    ImportJobResponse,
} from '@/services/api';

const ENTITY_OPTIONS = [
    { id: 'assets', label: 'Assets' },
    { id: 'components', label: 'Components' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'roles', label: 'Roles' },
    { id: 'asset_types', label: 'Asset Types' },
] as const;

export default function ImportsAdminPage() {
    const searchParams = useSearchParams();
    const [entityType, setEntityType] = useState<(typeof ENTITY_OPTIONS)[number]['id']>('assets');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
    const [mappings, setMappings] = useState<ImportMappingRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [job, setJob] = useState<ImportJobResponse | null>(null);

    useEffect(() => {
        const requested = searchParams.get('entity');
        const found = ENTITY_OPTIONS.find((o) => o.id === requested);
        if (found) setEntityType(found.id);
    }, [searchParams]);

    const headerToSuggestion = useMemo(() => {
        const map = new Map<string, string | null>();
        (preview?.suggestions || []).forEach((s) => map.set(s.csv_header, s.suggested_field));
        return map;
    }, [preview]);

    const onPreview = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        setJob(null);
        try {
            const data = await api.previewImport(entityType, file);
            setPreview(data);

            const initial: ImportMappingRequest[] = data.headers.map((h) => {
                const suggested = headerToSuggestion.get(h) ?? null;
                return {
                    csv_header: h,
                    model_field: suggested,
                    create_new_column: !suggested,
                    inferred_db_type: null,
                };
            });
            // headerToSuggestion uses previous preview; recompute based on data
            const byHeader = new Map(data.suggestions.map((s) => [s.csv_header, s.suggested_field]));
            setMappings(
                data.headers.map((h) => {
                    const suggested = byHeader.get(h) ?? null;
                    return {
                        csv_header: h,
                        model_field: suggested,
                        create_new_column: !suggested,
                        inferred_db_type: null,
                    };
                })
            );
        } catch (e: any) {
            setError(e?.message || 'Preview failed');
        } finally {
            setLoading(false);
        }
    };

    const onExecute = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        setJob(null);
        try {
            const req: ImportExecuteRequest = {
                mappings,
                create_missing_columns: true,
                store_row_results: true,
            };
            const result = await api.executeImport(entityType, file, req);
            setJob(result);
        } catch (e: any) {
            setError(e?.message || 'Import failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <TopBar title="Imports" subtitle="Generic CSV import with header mapping and optional new columns" />

            <div className="p-6 animate-fadeIn space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Entity</label>
                            <select
                                value={entityType}
                                onChange={(e) => { setEntityType(e.target.value as any); setPreview(null); setMappings([]); setJob(null); }}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                {ENTITY_OPTIONS.map((o) => (
                                    <option key={o.id} value={o.id}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">CSV file</label>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); setMappings([]); setJob(null); }}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onPreview}
                            disabled={!file || loading}
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 shadow-sm disabled:opacity-50"
                        >
                            Preview
                        </button>
                        <button
                            onClick={onExecute}
                            disabled={!file || !preview || loading}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            Run Import
                        </button>
                        {loading && <span className="text-sm text-slate-500 self-center">Working…</span>}
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {job && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
                            Import status: <b>{job.status}</b> — rows: <b>{job.total_rows}</b>, success: <b>{job.success_count}</b>, errors: <b>{job.error_count}</b>
                        </div>
                    )}
                </div>

                {preview && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-800">Header mapping</h3>
                            <p className="text-sm text-slate-500 mt-1">Map each CSV header to an existing column, or create a new column.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CSV Header</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Column</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Create New Column</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {mappings.map((m, i) => (
                                        <tr key={m.csv_header}>
                                            <td className="px-6 py-4 text-sm text-slate-800 font-medium">{m.csv_header}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={m.model_field || ''}
                                                    disabled={!!m.create_new_column}
                                                    onChange={(e) => {
                                                        const next = [...mappings];
                                                        next[i] = { ...next[i], model_field: e.target.value || null, create_new_column: !e.target.value };
                                                        setMappings(next);
                                                    }}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
                                                >
                                                    <option value="">(Create new column)</option>
                                                    {preview.existing_fields.map((f) => (
                                                        <option key={f} value={f}>{f}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!m.create_new_column}
                                                        onChange={(e) => {
                                                            const next = [...mappings];
                                                            next[i] = {
                                                                ...next[i],
                                                                create_new_column: e.target.checked,
                                                                model_field: e.target.checked ? null : (next[i].model_field || null),
                                                            };
                                                            setMappings(next);
                                                        }}
                                                    />
                                                    Create
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

