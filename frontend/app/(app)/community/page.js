'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Users, Star, BookOpen, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { community as communityApi } from '../../../lib/api';

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }) {
  return (
    <div
      className="rounded-2xl border p-4 transition-colors hover:border-indigo-500/40"
      style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}
    >
      <div className="flex gap-3">
        {/* Book cover */}
        <Link
          href={`/book/${review.book?.googleBooksId}`}
          className="flex-shrink-0"
        >
          <div
            className="w-12 h-16 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: '#2a2d3e' }}
          >
            {review.book?.coverUrl ? (
              <Image
                src={review.book.coverUrl}
                alt={review.book.title}
                width={48}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <BookOpen className="w-4 h-4" style={{ color: '#4a4d62' }} />
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          {/* Book info */}
          <Link
            href={`/book/${review.book?.googleBooksId}`}
            className="font-semibold text-sm leading-snug hover:text-indigo-400 transition-colors"
            style={{ color: '#f0f0f5' }}
          >
            {review.book?.title}
          </Link>
          <p className="text-xs mb-1.5" style={{ color: '#6b7280' }}>
            {review.book?.author}
          </p>

          {/* Star rating */}
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-3 h-3"
                style={{ color: s <= review.rating ? '#fbbf24' : '#2a2d3e' }}
                fill={s <= review.rating ? '#fbbf24' : 'none'}
              />
            ))}
          </div>

          {/* Review text */}
          <p
            className="text-sm leading-relaxed"
            style={{
              color: '#8b8fa8',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {review.content}
          </p>

          {/* Reviewer + date */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: '#2a2d3e' }}>
            <Link
              href={`/readers/${review.user?.id}`}
              className="text-xs font-medium hover:text-indigo-300 transition-colors"
              style={{ color: '#818cf8' }}
            >
              {review.user?.name}
            </Link>
            <span className="text-xs" style={{ color: '#4a4d62' }}>
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reader row ────────────────────────────────────────────────────────────────

function ReaderRow({ profile, rank }) {
  return (
    <Link
      href={`/readers/${profile.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#0f1117]"
    >
      {/* rank */}
      <span
        className="w-5 text-xs font-medium text-center flex-shrink-0"
        style={{ color: '#4a4d62' }}
      >
        {rank}
      </span>
      {/* avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{
          backgroundColor: 'rgba(99,102,241,0.2)',
          border: '1px solid rgba(99,102,241,0.35)',
          color: '#818cf8',
        }}
      >
        {profile.name[0].toUpperCase()}
      </div>
      {/* name + stats */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: '#f0f0f5' }}>
          {profile.name}
        </p>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          {profile.finished} finished · {profile.reviewCount} reviews
        </p>
      </div>
      {/* avg rating */}
      {profile.avgRating != null && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star className="w-3 h-3" style={{ color: '#fbbf24' }} />
          <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>
            {profile.avgRating}
          </span>
        </div>
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reviews, setReviews]   = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [rData, pData] = await Promise.all([
          communityApi.getReviews(),
          communityApi.getProfiles(),
        ]);
        setReviews(rData.reviews || []);
        setProfiles(pData.profiles || []);
      } catch {
        /* non-critical */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f1117' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#818cf8' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#0f1117' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-6 h-6" style={{ color: '#818cf8' }} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f0f0f5' }}>
              Community
            </h1>
            <p className="text-sm" style={{ color: '#8b8fa8' }}>
              See what readers are finishing and reviewing
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#818cf8' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left: Recent Reviews ── */}
            <div className="lg:col-span-2 space-y-4">
              <h2
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#4a4d62' }}
              >
                Recent Reviews
              </h2>

              {reviews.length === 0 ? (
                <div
                  className="rounded-2xl border p-10 text-center"
                  style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}
                >
                  <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: '#4a4d62' }} />
                  <p className="text-sm" style={{ color: '#8b8fa8' }}>
                    No reviews yet — finish a book and be the first!
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </div>

            {/* ── Right: Active Readers ── */}
            <div className="space-y-4">
              <h2
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#4a4d62' }}
              >
                Active Readers
              </h2>

              <div
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}
              >
                {profiles.length === 0 ? (
                  <div className="p-6 text-center">
                    <Users className="w-7 h-7 mx-auto mb-3" style={{ color: '#4a4d62' }} />
                    <p className="text-sm" style={{ color: '#8b8fa8' }}>No readers yet.</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#2a2d3e' }}>
                    {profiles.slice(0, 25).map((profile, i) => (
                      <ReaderRow key={profile.id} profile={profile} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>

              {/* Link to own profile */}
              <Link
                href={`/readers/${user.id}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-[#0f1117]"
                style={{ borderColor: '#2a2d3e', color: '#818cf8', backgroundColor: 'transparent' }}
              >
                View my public profile →
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
