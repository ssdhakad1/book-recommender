'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  User, Mail, Calendar, BookOpen, CheckCircle, Bookmark,
  Star, KeyRound, ChevronDown, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { library as libraryApi, auth as authApi } from '../../../lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats]             = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Change password state
  const [pwOpen,    setPwOpen]    = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew,     setPwNew]     = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data     = await libraryApi.getStats();
      const entries  = data.entries || [];
      const reviews  = data.reviews || [];
      const finished = entries.filter((e) => e.status === 'FINISHED').length;
      const reading  = entries.filter((e) => e.status === 'READING').length;
      const wishlist = entries.filter((e) => e.status === 'WISHLIST').length;
      const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;
      setStats({ finished, reading, wishlist, reviews: reviews.length, avgRating });
    } catch { /* non-critical */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleChangePw = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwNew !== pwConfirm) { setPwError('New passwords do not match.'); return; }
    if (pwNew.length < 6)    { setPwError('New password must be at least 6 characters.'); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword(pwCurrent, pwNew);
      setPwSuccess(true);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setTimeout(() => { setPwSuccess(false); setPwOpen(false); }, 2500);
    } catch (err) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen pb-16" style={{backgroundColor:'#0f1117'}}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <User className="w-6 h-6" style={{color:'#818cf8'}} />
          <h1 className="text-2xl font-bold tracking-tight" style={{color:'#f0f0f5'}}>Profile</h1>
        </div>

        {/* Avatar + Identity */}
        <div className="rounded-2xl border p-6 mb-6" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold"
              style={{backgroundColor:'rgba(99,102,241,0.2)', border:'2px solid rgba(99,102,241,0.35)', color:'#818cf8'}}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate" style={{color:'#f0f0f5'}}>{user?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{color:'#4a4d62'}} />
                <span className="text-sm truncate" style={{color:'#8b8fa8'}}>{user?.email}</span>
              </div>
              {joinDate && (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{color:'#4a4d62'}} />
                  <span className="text-sm" style={{color:'#6b7280'}}>Member since {joinDate}</span>
                </div>
              )}
              {user?.id && (
                <Link
                  href={`/readers/${user.id}`}
                  className="inline-block mt-2 text-xs font-medium hover:text-indigo-300 transition-colors"
                  style={{color:'#818cf8'}}
                >
                  View public profile →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Reading stats */}
        <div className="rounded-2xl border p-6 mb-6" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color:'#4a4d62'}}>Reading at a Glance</h3>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="animate-pulse rounded-xl p-3" style={{backgroundColor:'#0f1117'}}>
                  <div className="h-6 w-8 rounded mb-1" style={{backgroundColor:'#2a2d3e'}} />
                  <div className="h-3 w-16 rounded" style={{backgroundColor:'#2a2d3e'}} />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: CheckCircle, color:'#4ade80', bg:'rgba(34,197,94,0.1)',   value: stats.finished,         label: 'Finished' },
                { icon: BookOpen,    color:'#818cf8', bg:'rgba(99,102,241,0.1)',  value: stats.reading,          label: 'Reading'  },
                { icon: Bookmark,    color:'#f59e0b', bg:'rgba(245,158,11,0.1)', value: stats.wishlist,         label: 'Wishlist' },
                { icon: Star,        color:'#fbbf24', bg:'rgba(245,158,11,0.1)', value: stats.avgRating || '—', label: 'Avg Rating' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label} className="rounded-xl p-3 flex flex-col gap-1" style={{backgroundColor:'#0f1117'}}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{color}} />
                    <span className="text-lg font-bold" style={{color:'#f0f0f5'}}>{value}</span>
                  </div>
                  <span className="text-xs" style={{color:'#6b7280'}}>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{color:'#4a4d62'}}>Couldn&apos;t load stats.</p>
          )}
          <div className="mt-4 pt-4 border-t" style={{borderColor:'#2a2d3e'}}>
            <Link href="/stats" className="text-xs font-medium transition-colors hover:text-indigo-300" style={{color:'#818cf8'}}>
              View full reading stats →
            </Link>
          </div>
        </div>

        {/* Account actions */}
        <div className="rounded-2xl border p-6" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color:'#4a4d62'}}>Account</h3>

          {/* Change password toggle */}
          <button
            onClick={() => { setPwOpen((v) => !v); setPwError(''); setPwSuccess(false); }}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all hover:bg-[#0f1117]"
            style={{borderColor:'#2a2d3e', color:'#8b8fa8', backgroundColor:'transparent'}}
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 flex-shrink-0" style={{color:'#818cf8'}} />
              Change Password
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${pwOpen ? 'rotate-180' : ''}`} />
          </button>

          {pwOpen && (
            <form onSubmit={handleChangePw} className="mt-3 space-y-3 px-1">
              {/* Current password */}
              <div className="relative">
                <input
                  type={showCur ? 'text' : 'password'}
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  placeholder="Current password"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 pr-10"
                  style={{backgroundColor:'#0f1117', borderColor:'#2a2d3e', color:'#f0f0f5'}}
                  required
                />
                <button type="button" onClick={() => setShowCur((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#4a4d62'}}>
                  {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* New password */}
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 pr-10"
                  style={{backgroundColor:'#0f1117', borderColor:'#2a2d3e', color:'#f0f0f5'}}
                  required
                />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#4a4d62'}}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Confirm new */}
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-500"
                style={{backgroundColor:'#0f1117', borderColor:'#2a2d3e', color:'#f0f0f5'}}
                required
              />

              {pwError && (
                <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl" style={{backgroundColor:'rgba(239,68,68,0.08)', color:'#f87171'}}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl" style={{backgroundColor:'rgba(74,222,128,0.08)', color:'#4ade80'}}>
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Password changed successfully!
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPwOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-[#0f1117]"
                  style={{borderColor:'#2a2d3e', color:'#8b8fa8', backgroundColor:'transparent'}}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{backgroundColor:'#6366f1'}}
                >
                  {pwLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
