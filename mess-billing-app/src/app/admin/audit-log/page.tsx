'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';

const TABLE_NAMES = [
    { value: '', label: 'All Tables' },
    { value: 'Student', label: 'Student' },
    { value: 'FeesDeposited', label: 'Fees Deposited' },
    { value: 'Refund', label: 'Refund' },
    { value: 'MonthlyRebate', label: 'Monthly Rebate' },
    { value: 'MessRate', label: 'Mess Rate' },
    { value: 'StudentMessAssignment', label: 'Mess Assignment' },
    { value: 'StudentLeft', label: 'Student Left' },
    { value: 'Session', label: 'Session' },
    { value: 'Course', label: 'Course' },
    { value: 'Hostel', label: 'Hostel' },
    { value: 'Mess', label: 'Mess' },
    { value: '_auth', label: 'Login Attempts' },
];

const OPERATIONS = [
    { value: '', label: 'All Operations' },
    { value: 'INSERT', label: 'Insert' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'LOGIN_SUCCESS', label: 'Login Success' },
    { value: 'LOGIN_FAILURE', label: 'Login Failure' },
];

const OP_COLORS: Record<string, string> = {
    INSERT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-amber-100 text-amber-700 border-amber-200',
    DELETE: 'bg-rose-100 text-rose-700 border-rose-200',
    LOGIN_SUCCESS: 'bg-blue-100 text-blue-700 border-blue-200',
    LOGIN_FAILURE: 'bg-red-100 text-red-700 border-red-200',
};

interface AuditLogEntry {
    id: number;
    tableName: string;
    operation: string;
    recordId: number | null;
    oldData: any;
    newData: any;
    changedBy: string | null;
    changedAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function DiffViewer({ oldData, newData, operation }: { oldData: any; newData: any; operation: string }) {
    if (operation === 'INSERT' || operation === 'LOGIN_SUCCESS' || operation === 'LOGIN_FAILURE') {
        if (!newData) return <span className="text-slate-400 text-xs">No data</span>;
        return (
            <div className="space-y-0.5">
                {Object.entries(newData).filter(([k]) => !['createdAt', 'updatedAt', 'password', 'resetToken', 'resetTokenExp'].includes(k)).map(([key, val]) => (
                    <div key={key} className="text-xs">
                        <span className="font-semibold text-slate-600">{key}:</span>{' '}
                        <span className="text-emerald-700 font-medium">{String(val ?? '-')}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (operation === 'DELETE') {
        if (!oldData) return <span className="text-slate-400 text-xs">No data</span>;
        return (
            <div className="space-y-0.5">
                {Object.entries(oldData).filter(([k]) => !['createdAt', 'updatedAt', 'password', 'resetToken', 'resetTokenExp'].includes(k)).map(([key, val]) => (
                    <div key={key} className="text-xs">
                        <span className="font-semibold text-slate-600">{key}:</span>{' '}
                        <span className="text-rose-700 font-medium line-through">{String(val ?? '-')}</span>
                    </div>
                ))}
            </div>
        );
    }

    // UPDATE — show diff
    if (!oldData || !newData) return <span className="text-slate-400 text-xs">No data</span>;
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const changedKeys = Array.from(allKeys).filter(k =>
        !['createdAt', 'updatedAt', 'password', 'resetToken', 'resetTokenExp'].includes(k) &&
        JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])
    );

    if (changedKeys.length === 0) return <span className="text-slate-400 text-xs italic">No visible changes</span>;

    return (
        <div className="space-y-1">
            {changedKeys.map(key => (
                <div key={key} className="text-xs">
                    <span className="font-semibold text-slate-600">{key}:</span>{' '}
                    <span className="text-rose-600 line-through">{String(oldData[key] ?? '-')}</span>
                    {' → '}
                    <span className="text-emerald-700 font-medium">{String(newData[key] ?? '-')}</span>
                </div>
            ))}
        </div>
    );
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [tableFilter, setTableFilter] = useState('');
    const [opFilter, setOpFilter] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchLogs = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '30' });
            if (tableFilter) params.set('table', tableFilter);
            if (opFilter) params.set('operation', opFilter);

            const res = await fetch(`/api/audit-log?${params}`);
            const data = await res.json();
            setLogs(data.logs ?? []);
            setPagination(data.pagination ?? { page: 1, limit: 30, total: 0, totalPages: 0 });
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [tableFilter, opFilter]);

    useEffect(() => { fetchLogs(1); }, [fetchLogs]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Log</h1>
                <p className="text-slate-500 mt-2 font-medium">Database-level change history for all sensitive tables.</p>
            </div>

            {/* Filters */}
            <Card className="p-5" hoverEffect={false}>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Table</label>
                        <select
                            value={tableFilter}
                            onChange={e => setTableFilter(e.target.value)}
                            className="border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                            {TABLE_NAMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Operation</label>
                        <select
                            value={opFilter}
                            onChange={e => setOpFilter(e.target.value)}
                            className="border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                            {OPERATIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div className="text-sm text-slate-500 font-medium self-end pb-2">
                        {pagination.total.toLocaleString()} entries found
                    </div>
                </div>
            </Card>

            {/* Log Table */}
            <Card className="p-0 overflow-hidden" hoverEffect={false}>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="mt-3 text-slate-400 font-medium">Loading audit log…</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium">
                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        No audit log entries found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <th className="p-4 text-left w-12">#</th>
                                    <th className="p-4 text-left">Timestamp</th>
                                    <th className="p-4 text-left">Table</th>
                                    <th className="p-4 text-center">Operation</th>
                                    <th className="p-4 text-center">Record ID</th>
                                    <th className="p-4 text-left">Changed By</th>
                                    <th className="p-4 text-left">Changes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                    >
                                        <td className="p-4 text-slate-400 font-mono text-xs">{log.id}</td>
                                        <td className="p-4 text-slate-700 font-medium text-xs whitespace-nowrap">{formatDate(log.changedAt)}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                                {log.tableName}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${OP_COLORS[log.operation] ?? 'bg-slate-100 text-slate-700'}`}>
                                                {log.operation}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-mono text-slate-600 text-xs">{log.recordId ?? '-'}</td>
                                        <td className="p-4 text-slate-700 text-xs font-medium">
                                            {log.changedBy ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                                                    {log.changedBy}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {expandedId === log.id ? (
                                                <div className="max-w-lg animate-in fade-in duration-200">
                                                    <DiffViewer oldData={log.oldData} newData={log.newData} operation={log.operation} />
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Click to expand</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">
                            Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchLogs(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Previous
                            </button>
                            <button
                                onClick={() => fetchLogs(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
