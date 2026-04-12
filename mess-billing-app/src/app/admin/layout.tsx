'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BrandLogo } from '../../components/ui/BrandLogo';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const navGroups = [
        {
            label: 'Dashboard',
            links: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            ]
        },
        {
            label: 'Setup',
            links: [
                { name: 'Sessions', path: '/admin/sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { name: 'Messes', path: '/admin/mess', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
                { name: 'Courses', path: '/admin/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                { name: 'Mess Allocation', path: '/admin/mess-assignments', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { name: 'Hostel Allocation', path: '/admin/hostel-assignments', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2' },
            ]
        },
        {
            label: 'Registration',
            links: [
                { name: 'Registration of Student', path: '/admin/upload', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
            ]
        },
        {
            label: 'Fees Deposit',
            links: [
                { name: 'Fees Deposited', path: '/admin/fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            ]
        },
        {
            label: 'Bill Generation',
            links: [
                { name: 'Bill Generation', path: '/admin/mess-rates', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
            ]
        },
        {
            label: 'Student Management',
            links: [
                { name: 'Monthly Rebates', path: '/admin/monthly-rebates', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zm-7-8V7m0 6v.01' },
                { name: 'Refunds', path: '/admin/refunds', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
                { name: 'View Details', path: '/admin/permissions', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
            ]
        },
        {
            label: 'Reports',
            links: [
                { name: 'Reports', path: '/admin/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { name: 'Consolidated Report', path: '/admin/reports/view', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2' },
            ]
        },
        {
            label: 'System',
            links: [
                { name: 'Audit Log', path: '/admin/audit-log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ]
        },
    ];

    return (
        <div className="flex h-screen bg-transparent font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
            <aside className={`bg-white/20 backdrop-blur-2xl border-r border-white/40 flex flex-col z-20 transition-all duration-300 shadow-[4px_0_24px_rgb(0,0,0,0.02)] relative ${isCollapsed ? 'w-20' : 'w-72'}`}>
                <div className="p-4 border-b border-white/30 bg-transparent flex items-center justify-between min-h-[5rem] gap-2">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 flex-1'}`}>
                        <BrandLogo className="!p-1.5 !rounded-xl border-white/40" />
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">Admin Portal</h2>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
                        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isCollapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar bg-transparent overflow-x-hidden">
                    {navGroups.map((group) => (
                        <div key={group.label} className="mb-4">
                            {!isCollapsed && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1.5">{group.label}</p>
                            )}
                            <ul className="space-y-0.5">
                                {group.links.map((link) => {
                                    const isActive = pathname === link.path;
                                    return (
                                        <li key={link.path} title={isCollapsed ? link.name : undefined}>
                                            <Link
                                                href={link.path}
                                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100 font-semibold'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                                    } ${isCollapsed ? 'justify-center border-transparent' : ''}`}
                                            >
                                                <svg className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                                                </svg>
                                                {!isCollapsed && <span className="text-sm whitespace-nowrap">{link.name}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="p-3 border-t border-white/30 bg-transparent">
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        title={isCollapsed ? 'Sign Out' : undefined}
                        className={`w-full flex items-center gap-3 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors group ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Sign Out</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 bg-transparent h-screen overflow-y-auto pb-10">
                <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full transition-all duration-300 relative group/content">
                    {children}
                </div>
            </main>
        </div>
    );
}
