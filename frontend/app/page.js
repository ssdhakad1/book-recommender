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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">BookRecommender</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-3xl">
          Your reading life,{' '}
          <span className="text-blue-400">intelligently connected</span>
        </h1>

        <p className="text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Discover books tailored to your taste. Get AI-powered recommendations based on your favorite
          authors, genres, current mood, or reading history — and track everything in your personal library.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/register"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-blue-900/40"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-lg transition-colors border border-slate-700"
          >
            Sign In
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="bg-slate-800 rounded-xl p-6 text-left border border-slate-700">
            <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">AI Recommendations</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Claude AI analyzes your preferences to suggest the perfect next read — by author, genre, mood, or history.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 text-left border border-slate-700">
            <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
              <Library className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Personal Library</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track every book you want to read, are reading, or have finished. Write reviews and rate your reads.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 text-left border border-slate-700">
            <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Trending Books</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Discover what&apos;s popular right now. Browse top 50 trending books across all genres and add them to your list.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-sm border-t border-slate-800">
        <p>BookRecommender — Powered by Claude AI &amp; Google Books</p>
      </footer>
    </div>
  );
}
