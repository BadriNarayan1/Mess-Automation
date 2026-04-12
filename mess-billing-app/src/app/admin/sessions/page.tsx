'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';

export default function SessionsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', startYear: new Date().getFullYear(), semester: 'I' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [fetching, setFetching] = useState(true);

    const fetchSessions = async () => {
        setFetching(true);
        const res = await fetch('/api/sessions');
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
        setFetching(false);
    };

    useEffect(() => { fetchSessions(); }, []);

    const getAutoName = (y: number, sem: string) => `${sem === 'II' ? y - 1 : y}-${sem}`;

    // Auto-suggest name when year/semester changes
    useEffect(() => {
        setForm(prev => ({ ...prev, name: getAutoName(prev.startYear, prev.semester) }));
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage('');
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...form, id: editingId } : form;
            const res = await fetch('/api/sessions', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) { 
                setMessage(editingId ? 'Session updated!' : 'Session created!'); 
                fetchSessions(); 
                setEditingId(null);
                setForm({ name: '', startYear: new Date().getFullYear(), semester: 'I' });
            }
            else setMessage(data.error || 'Failed to save session');
        } catch { setMessage('Error saving session'); }
        finally { setLoading(false); }
    };

    const setSemester = (sem: string) => {
        setForm(prev => ({ ...prev, semester: sem, name: getAutoName(prev.startYear, sem) }));
    };

    const setYear = (y: number) => {
        setForm(prev => ({ ...prev, startYear: y, name: getAutoName(y, prev.semester) }));
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this session? This will also remove all associated assignments, rebates and payments.')) return;
        try {
            const res = await fetch('/api/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            if (res.ok) { setMessage('Session deleted'); fetchSessions(); }
            else setMessage('Failed to delete');
        } catch { setMessage('Error deleting'); }
    };

    const handleEdit = (s: any) => {
        setEditingId(s.id);
        setForm({ name: s.name, startYear: s.startYear, semester: s.semester });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ name: '', startYear: new Date().getFullYear(), semester: 'I' });
        setMessage('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sessions</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage academic sessions (e.g. 2026-I, 2026-II)</p>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-violet-500 rounded-full"></span>{editingId ? 'Edit Session' : 'Add New Session'}
                </h2>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Start Year</label>
                            <input type="number" value={form.startYear} onChange={e => setYear(Number(e.target.value))}
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 font-medium"
                                required min="2000" max="2100" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Semester</label>
                            <div className="flex gap-2">
                                {['I', 'II'].map(s => (
                                    <button key={s} type="button" onClick={() => setSemester(s)}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors ${form.semester === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-400'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Session Name (auto-generated)</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-bold"
                            required placeholder="e.g. 2026-I" />
                    </div>
                    <div className="flex gap-4">
                        <button type="submit" disabled={loading}
                            className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50">
                            {loading ? 'Saving…' : (editingId ? 'Update Session' : 'Create Session')}
                        </button>
                        {editingId && (
                            <button type="button" onClick={cancelEdit} disabled={loading}
                                className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-50">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
                {message && (
                    <p className={`mt-3 text-sm font-semibold ${message.includes('!') || message.includes('deleted') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>
                )}
            </Card>

            <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">All Sessions</h2>
                </div>
                {fetching ? (
                    <div className="p-8 text-center text-slate-400">Loading…</div>
                ) : sessions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No sessions yet.</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4 text-left">Name</th>
                                <th className="p-4 text-left">Year</th>
                                <th className="p-4 text-left">Semester</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sessions.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 text-xs font-bold">{s.name}</span>
                                    </td>
                                    <td className="p-4 text-slate-600 font-medium">{s.startYear}</td>
                                    <td className="p-4 text-slate-600 font-medium">{s.semester}</td>
                                    <td className="p-4 text-right pr-6 flex justify-end gap-2">
                                        <button onClick={() => handleEdit(s)}
                                            className="text-violet-600 text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(s.id)}
                                            className="text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors">
                                            Delete
                                        </button>
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
