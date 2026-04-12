'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';

export default function HostelAssignmentsPage() {
    const [hostels, setHostels] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [form, setForm] = useState({ entryNo: '', hostelId: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [fetching, setFetching] = useState(false);
    const [selectedHostel, setSelectedHostel] = useState('');

    // Bulk upload state
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ message?: string; errors?: string[]; error?: string } | null>(null);

    useEffect(() => {
        fetch('/api/hostels').then(r => r.json()).then(d => setHostels(Array.isArray(d) ? d : []));
    }, []);

    const fetchStudents = async (hostelId: string) => {
        if (!hostelId) { setStudents([]); return; }
        setFetching(true);
        const res = await fetch(`/api/students?hostelId=${hostelId}`);
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
        setFetching(false);
    };

    useEffect(() => { fetchStudents(selectedHostel); }, [selectedHostel]);

    const refreshAll = () => {
        fetch('/api/hostels').then(r => r.json()).then(d => setHostels(Array.isArray(d) ? d : []));
        if (selectedHostel) fetchStudents(selectedHostel);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMessage('');
        try {
            const hostel = hostels.find(h => String(h.id) === form.hostelId);
            if (!hostel) { setMessage('Please select a hostel'); setLoading(false); return; }

            const res = await fetch('/api/hostel-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entryNo: form.entryNo, hostelName: hostel.name }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Hostel assigned!');
                setForm(p => ({ ...p, entryNo: '' }));
                refreshAll();
            } else setMessage(data.error || 'Failed');
        } catch { setMessage('Error'); }
        finally { setLoading(false); }
    };

    const handleRemove = async (studentId: number) => {
        if (!confirm('Remove hostel assignment for this student?')) return;
        await fetch('/api/hostel-assignments', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId }),
        });
        refreshAll();
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;
        setBulkLoading(true);
        setBulkResult(null);
        try {
            const formData = new FormData();
            formData.append('file', bulkFile);
            const res = await fetch('/api/upload-hostel-assignments', { method: 'POST', body: formData });
            const data = await res.json();
            setBulkResult(data);
            setBulkFile(null);
            refreshAll();
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hostel Assignments</h1>
                <p className="text-slate-500 mt-2 font-medium">Assign students to a hostel.</p>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-violet-500 rounded-full"></span>Assign Hostel
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Entry Number</label>
                            <input value={form.entryNo} onChange={e => setForm(p => ({ ...p, entryNo: e.target.value }))}
                                placeholder="e.g. 2023CSB1100" required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Hostel</label>
                            <select value={form.hostelId} onChange={e => setForm(p => ({ ...p, hostelId: e.target.value }))} required
                                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-medium">
                                <option value="">Select hostel</option>
                                {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50">
                        {loading ? 'Assigning…' : 'Assign Hostel'}
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
                        onClick={() => window.open('/api/template?type=hostel-assignments', '_blank')}
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
                    Required columns: <span className="font-mono font-semibold text-slate-500">EntryNo, HostelName</span>
                </p>
            </Card>

            <Card className="p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Students by Hostel</h2>
                    <select value={selectedHostel} onChange={e => setSelectedHostel(e.target.value)}
                        className="border border-slate-200 bg-white px-3 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                        <option value="">-- Select hostel --</option>
                        {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                {fetching ? (
                    <div className="p-8 text-center text-slate-400">Loading…</div>
                ) : !selectedHostel ? (
                    <div className="p-8 text-center text-slate-400 font-medium">Select a hostel to view students.</div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium">No students assigned to this hostel.</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="p-4 text-left">Entry No</th>
                                <th className="p-4 text-left">Student</th>
                                <th className="p-4 text-left">Course</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((s: any) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{s.entryNo}</td>
                                    <td className="p-4 text-slate-700 font-medium">{s.name}</td>
                                    <td className="p-4 text-slate-600">{s.course?.name ?? '-'}</td>
                                    <td className="p-4 text-right pr-6">
                                        <button onClick={() => handleRemove(s.id)}
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
