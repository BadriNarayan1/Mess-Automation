'use client';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'role' | 'student-login' | 'admin-login' | 'forgot-password' | 'reset-password';
const DEFAULT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [entryNo, setEntryNo] = useState('');
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [resetKey, setResetKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        username: entryNo,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid entry number or password. If logging in for the first time, please reset your password first.');
      } else {
        router.push('/student/dashboard');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        username: adminEmail,
        password: adminPassword,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid admin password');
      } else {
        router.push('/admin/dashboard');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryNo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setMaskedEmail(data.email);
        setSuccess(data.message);
        setStep('reset-password');
      }
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryNo, resetKey, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess(data.message);
        setTimeout(() => {
          setStep('student-login');
          setSuccess('');
          setPassword('');
        }, 2000);
      }
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/student/dashboard' });
  };

  const handleAdminGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/admin/dashboard' });
  };

  const goBack = () => {
    setError('');
    setSuccess('');
    if (step === 'reset-password') {
      setStep('forgot-password');
    } else if (step === 'forgot-password') {
      setStep('student-login');
    } else {
      setStep('role');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="bg-white/20 backdrop-blur-2xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 w-full max-w-md relative z-10 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)] hover:bg-white/30">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/30">
          <div className="text-left">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Mess Portal</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {step === 'role' && 'Select your role to continue'}
              {step === 'student-login' && 'Sign in to your student account'}
              {step === 'admin-login' && 'Sign in as administrator'}
              {step === 'forgot-password' && 'Reset your password'}
              {step === 'reset-password' && 'Enter reset key & new password'}
            </p>
          </div>
          <BrandLogo />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50/80 border border-red-200 text-red-700 rounded-xl text-sm font-medium animate-in fade-in duration-300">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-5 p-3.5 bg-emerald-50/80 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium animate-in fade-in duration-300">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <button
              onClick={() => setStep('student-login')}
              className="w-full group p-5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md hover:bg-white/80 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">Student</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Access your mess & billing info</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            <button
              onClick={() => setStep('admin-login')}
              className="w-full group p-5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md hover:bg-white/80 hover:border-amber-200 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">Admin</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Manage mess operations</p>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          </div>
        )}

        {/* Step 2a: Student Login */}
        {step === 'student-login' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/60 bg-white/70 backdrop-blur-md hover:bg-white hover:shadow-md transition-all duration-300 font-semibold text-slate-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/40"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-slate-400 font-medium bg-transparent backdrop-blur-sm rounded-full">or sign in with entry number</span>
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Entry Number</label>
                <input
                  type="text"
                  value={entryNo}
                  onChange={(e) => setEntryNo(e.target.value)}
                  className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400"
                  placeholder="e.g. 2023CSB1107"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition-all active:scale-[0.98] shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => { setError(''); setStep('forgot-password'); }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors"
              >
                Forgot Password? / First time login?
              </button>
            </div>
          </div>
        )}

        {/* Step 2b: Admin Login */}
        {step === 'admin-login' && (
          <form onSubmit={handleAdminLogin} className="space-y-5 animate-in fade-in duration-500">
            <button
              type="button"
              onClick={handleAdminGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/60 bg-white/70 backdrop-blur-md hover:bg-white hover:shadow-md transition-all duration-300 font-semibold text-slate-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google (Admin)
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/40"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-slate-400 font-medium bg-transparent backdrop-blur-sm rounded-full">or sign in with password</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 hover:border-amber-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400"
                placeholder="Enter admin email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 hover:border-amber-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white font-semibold py-3.5 rounded-xl hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transform transition-all active:scale-[0.98] shadow-md shadow-amber-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In as Admin'}
            </button>
          </form>
        )}

        {/* Step 3: Forgot Password */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-5 animate-in fade-in duration-500">
            <p className="text-sm text-slate-500 font-medium">Enter your entry number and we&apos;ll send a reset key to your registered email.</p>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Entry Number</label>
              <input
                type="text"
                value={entryNo}
                onChange={(e) => setEntryNo(e.target.value)}
                className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400"
                placeholder="e.g. 2023CSB1107"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition-all active:scale-[0.98] shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Sending...
                </span>
              ) : 'Send Reset Key'}
            </button>
          </form>
        )}

        {/* Step 4: Enter Reset Key & New Password */}
        {step === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in duration-500">
            {maskedEmail && (
              <p className="text-sm text-slate-500 font-medium">
                A reset key was sent to <span className="font-bold text-slate-700">{maskedEmail}</span>
              </p>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Reset Key</label>
              <input
                type="text"
                value={resetKey}
                onChange={(e) => setResetKey(e.target.value.toUpperCase())}
                className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-mono font-bold text-lg tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                placeholder="e.g. 0JMB54VS"
                maxLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400"
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-white/60 bg-white/60 backdrop-blur-md px-4 py-3 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-300 focus:bg-white shadow-[0_4px_10px_rgb(0,0,0,0.03)] hover:bg-white/90 hover:shadow-md transition-all duration-300 placeholder:text-slate-400"
                placeholder="Re-enter your password"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition-all active:scale-[0.98] shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Resetting...
                </span>
              ) : 'Set New Password'}
            </button>
          </form>
        )}

        {/* Back Button (shown on all steps except role) */}
        {step !== 'role' && (
          <button
            onClick={goBack}
            className="mt-5 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
