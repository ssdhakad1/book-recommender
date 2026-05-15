'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { auth as authApi } from '../../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border shadow-2xl p-8" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>

      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-900/40">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{color:'#f0f0f5'}}>BookRecommender</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight" style={{color:'#f0f0f5'}}>Set New Password</h1>
        <p className="text-sm mt-1" style={{color:'#8b8fa8'}}>Choose a strong password for your account.</p>
      </div>

      {success ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{backgroundColor:'rgba(34,197,94,0.1)'}}>
            <CheckCircle className="w-7 h-7" style={{color:'#4ade80'}} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{color:'#f0f0f5'}}>Password Reset!</h2>
          <p className="text-sm leading-relaxed mb-2" style={{color:'#8b8fa8'}}>
            Your password has been updated. Redirecting you to sign in…
          </p>
          <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mt-4" style={{borderColor:'rgba(99,102,241,0.2)', borderTopColor:'#6366f1'}} />
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-6 text-sm" style={{backgroundColor:'rgba(239,68,68,0.08)', borderColor:'rgba(239,68,68,0.3)', color:'#ef4444'}}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{color:'#8b8fa8'}}>
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#4a4d62'}} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!token}
                  autoFocus
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full border rounded-xl pl-11 pr-12 py-3 outline-none transition-all focus:border-indigo-500 text-sm disabled:opacity-50"
                  style={{backgroundColor:'#0f1117', borderColor:'#2a2d3e', color:'#f0f0f5'}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-colors hover:text-[#8b8fa8]"
                  style={{color:'#4a4d62'}}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium mb-1.5" style={{color:'#8b8fa8'}}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'#4a4d62'}} />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={!token}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="w-full border rounded-xl pl-11 pr-12 py-3 outline-none transition-all focus:border-indigo-500 text-sm disabled:opacity-50"
                  style={{backgroundColor:'#0f1117', borderColor:'#2a2d3e', color:'#f0f0f5'}}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-colors hover:text-[#8b8fa8]"
                  style={{color:'#4a4d62'}}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token || !password || !confirm}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{backgroundColor:'#6366f1'}}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{backgroundColor:'#0f1117'}}>
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="rounded-2xl border p-8 text-center" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
            <div className="w-8 h-8 border-2 border-t-indigo-500 rounded-full animate-spin mx-auto" style={{borderColor:'rgba(99,102,241,0.2)', borderTopColor:'#6366f1'}} />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-sm mt-6" style={{color:'#8b8fa8'}}>
          Remember your password?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
