'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Sparkles, Library, TrendingUp } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [previewBooks, setPreviewBooks] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || user) return;
    async function fetchPreview() {
      try {
        const res = await fetch(`${API_URL}/api/trending`);
        const data = await res.json();
        setPreviewBooks((data.books || []).slice(0, 8));
      } catch { /* non-critical */ } finally {
        setPreviewLoading(false);
      }
    }
    fetchPreview();
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f1117' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f1117' }}>

      {/* Navbar */}
      <header className="border-b h-14 flex items-center justify-between px-6 flex-shrink-0" style={{ borderColor: '#2a2d3e' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6366f1' }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: '#f0f0f5' }}>BookRecommender</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[#1a1d27]" style={{ color: '#8b8fa8' }}>
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: '#6366f1' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center text-center px-6 pt-14 pb-12">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6"
          style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}
        >
          <Sparkles className="w-4 h-4" />
          AI-powered book recommendations
        </div>

        {/* Headline */}
        <h1 className="font-bold tracking-tight leading-tight max-w-2xl mb-5" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.75rem)' }}>
          <span style={{ color: '#f0f0f5' }}>Discover Your Next</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Favourite Book
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base md:text-lg max-w-lg leading-relaxed mb-8" style={{ color: '#8b8fa8' }}>
          Personalised recommendations from your reading history. Track every book, discover new reads, and never run out of great stories.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 mb-14">
          <Link
            href="/register"
            className="px-7 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          >
            Start Reading Free
          </Link>
          <Link
            href="/login"
            className="px-7 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-[#1a1d27]"
            style={{ color: '#8b8fa8', borderColor: '#2a2d3e' }}
          >
            Sign In
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mb-14">
          <div className="rounded-2xl p-5 text-left border transition-all hover:border-indigo-500/40" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
            <Sparkles className="w-6 h-6 mb-4" style={{ color: '#818cf8' }} />
            <h3 className="font-bold text-base mb-1.5 tracking-tight" style={{ color: '#f0f0f5' }}>Smart Recommendations</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#8b8fa8' }}>
              Personalised picks by author, genre, mood, or reading history — powered by AI.
            </p>
          </div>
          <div className="rounded-2xl p-5 text-left border transition-all hover:border-green-500/40" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
            <Library className="w-6 h-6 mb-4" style={{ color: '#4ade80' }} />
            <h3 className="font-bold text-base mb-1.5 tracking-tight" style={{ color: '#f0f0f5' }}>Personal Library</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#8b8fa8' }}>
              Track every book you want to read, are reading, or have finished. Write reviews and rate your reads.
            </p>
          </div>
          <div className="rounded-2xl p-5 text-left border transition-all hover:border-amber-500/40" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
            <TrendingUp className="w-6 h-6 mb-4" style={{ color: '#fbbf24' }} />
            <h3 className="font-bold text-base mb-1.5 tracking-tight" style={{ color: '#f0f0f5' }}>Top 50 Trending</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#8b8fa8' }}>
              Discover what readers are engaging with right now. Browse today&apos;s top 50 trending books.
            </p>
          </div>
        </div>

        {/* Live trending preview — always shown (skeletons while loading) */}
        {!user && (
          <div className="w-full max-w-4xl">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#f59e0b' }}
              >
                <TrendingUp className="w-3 h-3" />
                Trending
              </div>
              <h2 className="text-sm font-bold tracking-tight" style={{ color: '#f0f0f5' }}>
                What readers are loving right now
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {previewLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-24 rounded-xl border overflow-hidden animate-pulse"
                      style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}
                    >
                      <div className="aspect-[2/3] w-full" style={{ backgroundColor: '#2a2d3e' }} />
                      <div className="p-1.5 space-y-1.5">
                        <div className="h-2.5 rounded" style={{ backgroundColor: '#2a2d3e', width: '80%' }} />
                        <div className="h-2 rounded" style={{ backgroundColor: '#2a2d3e', width: '55%' }} />
                      </div>
                    </div>
                  ))
                : previewBooks.map((book, idx) => (
                    <div
                      key={`${book.googleBooksId || book.title}-${idx}`}
                      className="flex-shrink-0 w-24 rounded-xl border overflow-hidden transition-all hover:border-indigo-500/30"
                      style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}
                    >
                      <div className="relative aspect-[2/3] w-full" style={{ backgroundColor: '#2a2d3e' }}>
                        {book.coverUrl ? (
                          <Image src={book.coverUrl} alt={book.title || 'Book'} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="w-6 h-6" style={{ color: '#4a4d62' }} />
                          </div>
                        )}
                        {book.rank && book.rank <= 3 && (
                          <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#f59e0b', color: '#0f1117' }}>
                            {book.rank}
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="text-xs font-medium line-clamp-2 leading-tight" style={{ color: '#f0f0f5' }}>{book.title}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#6b7280' }}>{book.author}</p>
                      </div>
                    </div>
                  ))
              }
            </div>

            <p className="text-center text-xs mt-4" style={{ color: '#4a4d62' }}>
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Create a free account</Link>
              {' '}to track these, write reviews, and get personalised recommendations
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs border-t flex-shrink-0" style={{ color: '#4a4d62', borderColor: '#2a2d3e' }}>
        BookRecommender · Powered by Open Library
      </footer>
    </div>
  );
}
