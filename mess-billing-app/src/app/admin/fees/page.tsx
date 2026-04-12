'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';

export default function FeesPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [form, setForm] = useState({ entryNo: '', sessionId: '', amount: '', paymentDate: new Date().toISOString().slice(0, 10) });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [fetching, setFetching] = useState(false);

    // Bulk upload state
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ message?: string; errors?: string[]; error?: string } | null>(null);

    useEffect(() => {
        fetch('/api/sessions').then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : []));
    }, []);

    const fetchPayments = async (sessionId: string) => {
        setFetching(true);
        const res = await fetch(`/api/fees-deposited?sessionId=${sessionId}`);
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
        setFetching(false);
    };

    useEffect(() => { if (selectedSession) fetchPayments(selectedSession); }, [selectedSession]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage('');
        try {
            const res = await fetch('/api/fees-deposited', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: Number(form.amount) }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Payment recorded!');
                setForm(p => ({ ...p, entryNo: '', amount: '' }));
                if (selectedSession) fetchPayments(selectedSession);
            } else setMessage(data.error || 'Failed');
        } catch { setMessage('Error'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this payment record?')) return;
        await fetch('/api/fees-deposited', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (selectedSession) fetchPayments(selectedSession);
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;
        setBulkLoading(true);
        setBulkResult(null);
        try {
            const formData = new FormData();
            formData.append('file', bulkFile);
            const res = await fetch('/api/upload-fees', { method: 'POST', body: formData });
            const data = await res.json();
            setBulkResult(data);
            setBulkFile(null);
            if (selectedSession) fetchPayments(selectedSession);
        } finally {
            setBulkLoading(false);
        }
    };

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fees Deposited</h1>
                <p className="text-slate-500 mt-2 font-medium">Record and track student fee payments per session.</p>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-teal-500 rounded-full"></span>Record Payment
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Roll Number</label>
                            <input value={form.entryNo} onChange={e => setForm(p => ({ ...p, entryNo: e.target.value }))}
                                placeholder="e.g. 2023CSB1100" required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Session</label>
                            <select value={form.sessionId} onChange={e => setForm(p => ({ ...p, sessionId: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                                <option value="">Select session</option>
                                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Amount (₹)</label>
                            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="0" step="0.01"
                                placeholder="e.g. 5000"
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Payment Date</label>
                            <input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50">
                        {loading ? 'Recording…' : 'Record Payment'}
                    </button>
                </form>
                {message && <p className={`mt-3 text-sm font-semibold ${message.includes('!') ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>}
            </Card>

            {/* Bulk Upload */}
            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>Bulk Upload via Excel
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={e => setBulkFile(e.target.files?.[0] ?? null)}
                        className="block text-sm text-slate-500 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                    />
                    <button
                        onClick={handleBulkUpload}
                        disabled={!bulkFile || bulkLoading}
                        className="shrink-0 bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                    >
                        {bulkLoading ? 'Uploading…' : 'Upload Excel'}
                    </button>
                    <button
                        onClick={() => window.open('/api/template?type=fees', '_blank')}
                        className="shrink-0 flex items-center gap-2 bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Get Template
                    </button>
                </div>
                {bulkResult && (
                    <div className={`mt-4 p-3 rounded-xl border text-sm ${bulkResult.error || (bulkResult.errors && bulkResult.errors.length > 0) ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        {bulkResult.message && <p className="font-semibold text-slate-800">{bulkResult.message}</p>}
                        {bulkResult.error && <p className="font-semibold text-rose-700">{bulkResult.error}</p>}
                        {bulkResult.errors && bulkResult.errors.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {bulkResult.errors.map((e, i) => <li key={i} className="text-amber-700 text-xs font-medium">⚠ {e}</li>)}
                            </ul>
                        )}
                    </div>
                )}
                <p className="mt-3 text-xs text-slate-400 font-medium">
                    Required columns: <span className="font-mono font-semibold text-slate-500">EntryNo, Amount, PaymentDate (YYYY-MM-DD), SessionName</span>
                </p>
            </Card>

            <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Payments by Session</h2>
                        {payments.length > 0 && (
                            <p className="text-sm text-teal-600 font-bold mt-0.5">Total: ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        )}
                    </div>
                    <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
                        className="border border-slate-200 bg-white px-3 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                        <option value="">-- Select session --</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                {fetching ? (
                    <div className="p-8 text-center text-slate-400">Loading…</div>
                ) : !selectedSession ? (
                    <div className="p-8 text-center text-slate-400 font-medium">Select a session to view payments.</div>
                ) : payments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium">No payments recorded for this session.</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4 text-left">Entry No</th>
                                <th className="p-4 text-left">Student</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Date</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{p.student.entryNo}</td>
                                    <td className="p-4 text-slate-700 font-medium">{p.student.name}</td>
                                    <td className="p-4 text-right font-bold text-teal-700">₹{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-center text-slate-600">{new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td className="p-4 text-right pr-6">
                                        <button onClick={() => handleDelete(p.id)}
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
