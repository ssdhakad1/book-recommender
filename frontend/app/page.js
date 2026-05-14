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

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Fetch trending books for the live preview strip (public endpoint, no auth needed)
  useEffect(() => {
    if (loading || user) return;
    async function fetchPreview() {
      try {
        const res = await fetch(`${API_URL}/api/trending`);
        const data = await res.json();
        setPreviewBooks((data.books || []).slice(0, 8));
      } catch { /* non-critical */ }
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

      {/* Slim landing navbar */}
      <header className="border-b px-6 h-14 flex items-center justify-between" style={{ borderColor: '#2a2d3e' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: '#f0f0f5' }}>BookRecommender</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-[#1a1d27]" style={{ color: '#8b8fa8' }}>
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: '#6366f1' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center px-4 pt-20 pb-16 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-8" style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.25)', color: '#818cf8' }}>
          <Sparkles className="w-3.5 h-3.5" />
          AI-powered book recommendations
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-3xl mb-6">
          <span style={{ color: '#f0f0f5' }}>Discover Your Next</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Favourite Book
          </span>
        </h1>

        <p className="text-lg md:text-xl max-w-xl leading-relaxed mb-12" style={{ color: '#8b8fa8' }}>
          Personalised recommendations from your reading history. Track every book, discover new reads, and never run out of great stories.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl font-semibold text-base text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#6366f1', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}
          >
            Start Reading Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl font-semibold text-base transition-all hover:bg-[#1a1d27] border"
            style={{ color: '#8b8fa8', borderColor: '#2a2d3e' }}
          >
            Sign In
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full mb-20">
          <div className="rounded-2xl p-6 text-left border transition-all hover:border-indigo-500/30" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
            <Sparkles className="w-7 h-7 mb-5" style={{ color: '#818cf8' }} />
            <h3 className="font-bold text-lg mb-2 tracking-tight" style={{ color: '#f0f0f5' }}>Smart Recommendations</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#8b8fa8' }}>
              Personalised suggestions by author, genre, mood, or reading history — powered by AI.
            </p>
          </div>
          <div className="rounded-2xl p-6 text-left border transition-all hover:border-green-500/30" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
            <Library className="w-7 h-7 mb-5" style={{ color: '#4ade80' }} />
            <h3 className="font-bold text-lg mb-2 tracking-tight" style={{ color: '#f0f0f5' }}>Personal Library</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#8b8fa8' }}>
              Track every book you want to read, are reading, or have finished. Write reviews and rate your reads.
            </p>
          </div>
          <div className="rounded-2xl p-6 text-left border transition-all hover:border-amber-500/30" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
            <TrendingUp className="w-7 h-7 mb-5" style={{ color: '#fbbf24' }} />
            <h3 className="font-bold text-lg mb-2 tracking-tight" style={{ color: '#f0f0f5' }}>Top 50 Trending</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#8b8fa8' }}>
              Discover what readers are engaging with right now. Browse today&apos;s top 50 trending books.
            </p>
          </div>
        </div>

        {/* Live trending preview */}
        {previewBooks.length > 0 && (
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold tracking-tight text-left" style={{ color: '#f0f0f5' }}>
                What readers are loving right now
              </h2>
              <Link href="/register" className="text-sm font-medium hover:text-indigo-300 transition-colors flex-shrink-0" style={{ color: '#8b8fa8' }}>
                Sign up to track →
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {previewBooks.map((book, idx) => (
                <div
                  key={`${book.googleBooksId || book.title}-${idx}`}
                  className="flex-shrink-0 w-28 rounded-2xl border overflow-hidden transition-all hover:border-indigo-500/30"
                  style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}
                >
                  <div className="relative aspect-[2/3] w-full" style={{ backgroundColor: '#2a2d3e' }}>
                    {book.coverUrl ? (
                      <Image src={book.coverUrl} alt={book.title || 'Book'} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-7 h-7" style={{ color: '#4a4d62' }} />
                      </div>
                    )}
                    {book.rank && book.rank <= 3 && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#f59e0b', color: '#0f1117' }}>
                        {book.rank}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-2 leading-tight" style={{ color: '#f0f0f5' }}>{book.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#8b8fa8' }}>{book.author}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs mt-5" style={{ color: '#4a4d62' }}>
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Create a free account</Link>
              {' '}to track these books, write reviews, and get personalised recommendations
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs border-t" style={{ color: '#4a4d62', borderColor: '#2a2d3e' }}>
        <p>BookRecommender · Powered by Open Library</p>
      </footer>
    </div>
  );
}
