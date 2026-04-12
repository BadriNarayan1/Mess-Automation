'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const getFilteredMonths = (sessionId: string, sessions: any[]) => {
    const session = sessions.find(s => String(s.id) === sessionId);
    const allMonths = MONTH_NAMES.map((name, i) => ({ value: String(i + 1), name }));
    if (!session) return allMonths;
    if (session.semester === 'I') return allMonths.filter(m => Number(m.value) >= 7);
    if (session.semester === 'II') return allMonths.filter(m => Number(m.value) <= 6);
    return allMonths;
};

export default function MessRatesPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [messes, setMesses] = useState<any[]>([]);
    const [rates, setRates] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [form, setForm] = useState({ messId: '', sessionId: '', month: '', monthlyRate: '', gstPercentage: '0' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        fetch('/api/sessions').then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : []));
        fetch('/api/messes').then(r => r.json()).then(d => setMesses(Array.isArray(d) ? d : []));
    }, []);

    useEffect(() => {
        const session = sessions.find(s => String(s.id) === form.sessionId);
        if (session) {
            const validMonths = getFilteredMonths(form.sessionId, sessions);
            let mStr = form.month;
            if (!validMonths.find(val => val.value === mStr)) {
                mStr = validMonths[0]?.value || '';
                setForm(p => ({ ...p, month: mStr }));
            }
        }
    }, [form.sessionId, form.month, sessions]);

    const fetchRates = async (sessionId: string) => {
        setFetching(true);
        const res = await fetch(`/api/mess-rates?sessionId=${sessionId}`);
        const data = await res.json();
        setRates(Array.isArray(data) ? data : []);
        setFetching(false);
    };

    useEffect(() => { if (selectedSession) fetchRates(selectedSession); }, [selectedSession]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage('');
        try {
            const res = await fetch('/api/mess-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    month: Number(form.month),
                    monthlyRate: Number(form.monthlyRate),
                    gstPercentage: Number(form.gstPercentage)
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Rate saved!');
                if (selectedSession) fetchRates(selectedSession);
            } else setMessage(data.error || 'Failed');
        } catch { setMessage('Error'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this rate?')) return;
        await fetch('/api/mess-rates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (selectedSession) fetchRates(selectedSession);
    };

    const handleEdit = (r: any) => {
        setForm({
            messId: String(r.messId),
            sessionId: String(r.sessionId),
            month: String(r.month),
            monthlyRate: String(r.monthlyRate),
            gstPercentage: String(r.gstPercentage || 0)
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bill Generation</h1>
                <p className="text-slate-500 mt-2 font-medium">Set monthly mess rates per mess, session and month.</p>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>Set / Update Rate
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Session</label>
                            <select value={form.sessionId} onChange={e => setForm(p => ({ ...p, sessionId: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value="">Select session</option>
                                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Month</label>
                            <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value="">Select month</option>
                                {getFilteredMonths(form.sessionId, sessions).map(m => (
                                    <option key={m.value} value={m.value}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Mess</label>
                            <select value={form.messId} onChange={e => setForm(p => ({ ...p, messId: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value="">Select mess</option>
                                {messes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Monthly Rate (₹)</label>
                            <input type="number" value={form.monthlyRate} onChange={e => setForm(p => ({ ...p, monthlyRate: e.target.value }))} required min="0" step="0.01"
                                placeholder="e.g. 4500"
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">GST (%)</label>
                            <input type="number" value={form.gstPercentage} onChange={e => setForm(p => ({ ...p, gstPercentage: e.target.value }))} min="0" max="100" step="0.01"
                                placeholder="e.g. 5"
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {loading ? 'Saving…' : 'Save Rate'}
                    </button>
                </form>
                {message && <p className={`mt-3 text-sm font-semibold ${message.includes('!') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
            </Card>

            <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">View Rates by Session</h2>
                    <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
                        className="border border-slate-200 bg-white px-3 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                        <option value="">-- Select session --</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                {fetching ? (
                    <div className="p-8 text-center text-slate-400">Loading…</div>
                ) : !selectedSession ? (
                    <div className="p-8 text-center text-slate-400 font-medium">Select a session to view rates.</div>
                ) : rates.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium">No rates set for this session.</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4 text-left">Mess</th>
                                <th className="p-4 text-left">Session</th>
                                <th className="p-4 text-left">Month</th>
                                <th className="p-4 text-right">Monthly Rate</th>
                                <th className="p-4 text-right">GST %</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rates.map((r: any) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{r.mess.name}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">{r.session.name}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">{MONTH_NAMES[r.month - 1]}</span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-800">₹{r.monthlyRate.toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">{r.gstPercentage ?? 0}%</span>
                                    </td>
                                    <td className="p-4 text-right pr-6 flex justify-end gap-2">
                                        <button onClick={() => handleEdit(r)}
                                            className="text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(r.id)}
                                            className="text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors">Delete</button>
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
