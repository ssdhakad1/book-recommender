'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Sparkles, Library, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#f0f0f5] tracking-tight">BookRecommender</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight max-w-3xl mb-6">
          <span className="text-[#f0f0f5]">Discover Your Next</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Favourite Book
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#8b8fa8] mb-12 max-w-xl leading-relaxed">
          Intelligent recommendations powered by your reading history. Track, discover, and never run out of great books.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/register"
            className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50"
          >
            Start Reading Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 text-[#8b8fa8] hover:text-[#f0f0f5] hover:bg-[#2a2d3e] rounded-xl font-semibold text-base transition-all border border-[#2a2d3e]"
          >
            Sign In
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full">
          <div className="bg-[#1a1d27] rounded-2xl p-6 text-left border border-[#2a2d3e] hover:border-indigo-500/30 transition-all">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-[#f0f0f5] font-bold text-lg mb-2 tracking-tight">Smart Recommendations</h3>
            <p className="text-[#8b8fa8] text-sm leading-relaxed">
              Personalised suggestions by author, genre, mood, or reading history — powered by AI.
            </p>
          </div>

          <div className="bg-[#1a1d27] rounded-2xl p-6 text-left border border-[#2a2d3e] hover:border-indigo-500/30 transition-all">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-5">
              <Library className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-[#f0f0f5] font-bold text-lg mb-2 tracking-tight">Personal Library</h3>
            <p className="text-[#8b8fa8] text-sm leading-relaxed">
              Track every book you want to read, are reading, or have finished. Write reviews and rate your reads.
            </p>
          </div>

          <div className="bg-[#1a1d27] rounded-2xl p-6 text-left border border-[#2a2d3e] hover:border-indigo-500/30 transition-all">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-[#f0f0f5] font-bold text-lg mb-2 tracking-tight">Top 50 Trending</h3>
            <p className="text-[#8b8fa8] text-sm leading-relaxed">
              Discover what&apos;s popular right now. Browse the top 50 trending books across all genres.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-[#4a4d62] text-xs border-t border-[#2a2d3e]">
        <p>BookRecommender · Powered by Open Library</p>
      </footer>
    </div>
  );
}
