'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { User, Mail, Calendar, BookOpen, CheckCircle, Bookmark, Star, KeyRound } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { library as libraryApi } from '../../../lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await libraryApi.getStats();
      const entries = data.entries || [];
      const reviews = data.reviews || [];
      const finished = entries.filter((e) => e.status === 'FINISHED').length;
      const reading  = entries.filter((e) => e.status === 'READING').length;
      const wishlist = entries.filter((e) => e.status === 'WISHLIST').length;
      const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;
      setStats({ finished, reading, wishlist, reviews: reviews.length, avgRating });
    } catch {
      // Non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

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
                { icon: CheckCircle, color:'#4ade80', bg:'rgba(34,197,94,0.1)',   value: stats.finished,          label: 'Finished'     },
                { icon: BookOpen,    color:'#818cf8', bg:'rgba(99,102,241,0.1)',  value: stats.reading,           label: 'Reading'      },
                { icon: Bookmark,    color:'#f59e0b', bg:'rgba(245,158,11,0.1)', value: stats.wishlist,          label: 'Wishlist'     },
                { icon: Star,        color:'#fbbf24', bg:'rgba(245,158,11,0.1)', value: stats.avgRating || '—',  label: `Avg Rating`   },
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
            <p className="text-xs" style={{color:'#4a4d62'}}>Couldn't load stats.</p>
          )}

          <div className="mt-4 pt-4 border-t" style={{borderColor:'#2a2d3e'}}>
            <Link
              href="/stats"
              className="text-xs font-medium transition-colors hover:text-indigo-300"
              style={{color:'#818cf8'}}
            >
              View full reading stats →
            </Link>
          </div>
        </div>

        {/* Account actions */}
        <div className="rounded-2xl border p-6" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{color:'#4a4d62'}}>Account</h3>
          <div className="space-y-2">
            <Link
              href="/forgot-password"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border transition-all hover:bg-[#0f1117] w-full"
              style={{borderColor:'#2a2d3e', color:'#8b8fa8', backgroundColor:'transparent'}}
            >
              <KeyRound className="w-4 h-4 flex-shrink-0" style={{color:'#818cf8'}} />
              Change Password
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
