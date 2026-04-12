'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';

function UploadCard({
    title,
    accent,
    onUpload,
    templateUrl,
}: {
    title: string;
    accent: string;
    onUpload: (file: File) => Promise<{ message?: string; errors?: string[]; error?: string }>;
    templateUrl?: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ message?: string; errors?: string[]; error?: string } | null>(null);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await onUpload(file);
            setResult(res);
            setFile(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6">
            <h2 className={`text-lg font-bold text-slate-800 mb-4 flex items-center gap-2`}>
                <span className={`w-2 h-6 ${accent} rounded-full`}></span>{title}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="block text-sm text-slate-500 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="shrink-0 bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                >
                    {loading ? 'Uploading…' : 'Upload Excel'}
                </button>
                {templateUrl && (
                    <button
                        onClick={() => window.open(templateUrl, '_blank')}
                        className="shrink-0 flex items-center gap-2 bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Get Template
                    </button>
                )}
            </div>
            {result && (
                <div className={`mt-4 p-3 rounded-xl border text-sm ${result.error || (result.errors && result.errors.length > 0) ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    {result.message && <p className="font-semibold text-slate-800">{result.message}</p>}
                    {result.error && <p className="font-semibold text-rose-700">{result.error}</p>}
                    {result.errors && result.errors.length > 0 && (
                        <ul className="mt-2 space-y-1">
                            {result.errors.map((e, i) => <li key={i} className="text-amber-700 text-xs font-medium">⚠ {e}</li>)}
                        </ul>
                    )}
                </div>
            )}
            <p className="mt-3 text-xs text-slate-400 font-medium">
                Required columns: <span className="font-mono font-semibold text-slate-500">EntryNo, MessName, SessionName</span>
            </p>
        </Card>
    );
}

export default function MessAssignmentsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [messes, setMesses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [form, setForm] = useState({ entryNo: '', messId: '', sessionId: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        fetch('/api/sessions').then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : []));
        fetch('/api/messes').then(r => r.json()).then(d => setMesses(Array.isArray(d) ? d : []));
    }, []);

    const fetchAssignments = async (sessionId: string) => {
        if (!sessionId) return;
        setFetching(true);
        const res = await fetch(`/api/mess-assignments?sessionId=${sessionId}`);
        const data = await res.json();
        setAssignments(Array.isArray(data) ? data : []);
        setFetching(false);
    };

    useEffect(() => { if (selectedSession) fetchAssignments(selectedSession); }, [selectedSession]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage('');
        try {
            const res = await fetch('/api/mess-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Assignment saved!');
                setForm(p => ({ ...p, entryNo: '' }));
                if (selectedSession) fetchAssignments(selectedSession);
            } else setMessage(data.error || 'Failed');
        } catch { setMessage('Error'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this assignment?')) return;
        await fetch('/api/mess-assignments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (selectedSession) fetchAssignments(selectedSession);
    };

    const handleBulkUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload-mess-assignments', { method: 'POST', body: formData });
        const data = await res.json();
        if (selectedSession) fetchAssignments(selectedSession);
        return data;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mess Assignments</h1>
                <p className="text-slate-500 mt-2 font-medium">Assign students to a mess for a specific session.</p>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>New Assignment
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Entry Number</label>
                            <input value={form.entryNo} onChange={e => setForm(p => ({ ...p, entryNo: e.target.value }))}
                                placeholder="e.g. 2023CSB1100" required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Session</label>
                            <select value={form.sessionId} onChange={e => setForm(p => ({ ...p, sessionId: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium">
                                <option value="">Select session</option>
                                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Mess</label>
                            <select value={form.messId} onChange={e => setForm(p => ({ ...p, messId: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium">
                                <option value="">Select mess</option>
                                {messes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                        {loading ? 'Saving…' : 'Save Assignment'}
                    </button>
                </form>
                {message && <p className={`mt-3 text-sm font-semibold ${message.includes('!') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
            </Card>

            <UploadCard
                title="Bulk Upload via Excel"
                accent="bg-indigo-500"
                onUpload={handleBulkUpload}
                templateUrl="/api/template?type=mess-assignments"
            />

            <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">View by Session</h2>
                    <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
                        className="border border-slate-200 bg-white px-3 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                        <option value="">-- Select session --</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                {fetching ? (
                    <div className="p-8 text-center text-slate-400">Loading…</div>
                ) : !selectedSession ? (
                    <div className="p-8 text-center text-slate-400 font-medium">Select a session to view assignments.</div>
                ) : assignments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium">No assignments for this session.</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4 text-left">Entry No</th>
                                <th className="p-4 text-left">Student</th>
                                <th className="p-4 text-left">Mess</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assignments.map((a: any) => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{a.student.entryNo}</td>
                                    <td className="p-4 text-slate-700 font-medium">{a.student.name}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">{a.mess.name}</span>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <button onClick={() => handleDelete(a.id)}
                                            className="text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}
