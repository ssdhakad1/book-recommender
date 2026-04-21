'use client';

import { useState, useEffect } from 'react';
import { Sparkles, User, Tag, Heart, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { recommendations as recApi, library as libraryApi } from '../../../lib/api';
import BookCard from '../../../components/BookCard';

const TABS = [
  { id: 'author', label: 'By Author', icon: User },
  { id: 'genre', label: 'By Genre', icon: Tag },
  { id: 'mood', label: 'By Mood', icon: Heart },
  { id: 'history', label: 'Reading History', icon: BookOpen },
];

const GENRE_OPTIONS = [
  'Fiction', 'Non-Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
  'Romance', 'Historical Fiction', 'Horror', 'Self-Help', 'Biography', 'Philosophy',
  'Psychology', 'Business', 'Poetry', 'Graphic Novel', 'Young Adult', "Children's",
];

function SkeletonCard() {
  return (
    <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3e] overflow-hidden animate-pulse">
      <div className="aspect-[2/3] skeleton rounded-t-2xl" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-8 w-full rounded-xl mt-3" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('author');
  const [authorInput, setAuthorInput] = useState('');
  const [genreInput, setGenreInput] = useState('Fiction');
  const [moodInput, setMoodInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [libraryBookIds, setLibraryBookIds] = useState(new Set());

  // Fetch library on mount so we can show "In Library" state
  useEffect(() => {
    async function loadLibrary() {
      try {
        const data = await libraryApi.getLibrary();
        const ids = new Set(
          (data.entries || [])
            .map((e) => e.book?.googleBooksId)
            .filter(Boolean)
        );
        setLibraryBookIds(ids);
      } catch {
        // Non-critical — just means we won't show "In Library" state
      }
    }
    loadLibrary();
  }, []);

  const handleGetRecommendations = async () => {
    setError('');
    setResults([]);
    setLoading(true);

    try {
      let input = '';
      if (activeTab === 'author') input = authorInput;
      else if (activeTab === 'genre') input = genreInput;
      else if (activeTab === 'mood') input = moodInput;

      const data = await recApi.getRecommendations(activeTab, input, 10);
      setResults(data.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (book) => {
    try {
      await libraryApi.addToLibrary(book);
      if (book.googleBooksId) {
        setLibraryBookIds((prev) => new Set([...prev, book.googleBooksId]));
      }
    } catch (err) {
      // Book might already be in library — mark it so
      if (err?.message?.includes('already') && book.googleBooksId) {
        setLibraryBookIds((prev) => new Set([...prev, book.googleBooksId]));
      }
      console.error('Add to library error:', err.message);
    }
  };

  const canSubmit = (() => {
    if (activeTab === 'author') return authorInput.trim().length > 0;
    if (activeTab === 'genre') return genreInput.trim().length > 0;
    if (activeTab === 'mood') return moodInput.trim().length > 0;
    return true; // history tab
  })();

  return (
    <div className="min-h-screen bg-[#0f1117] pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#f0f0f5] tracking-tight">Book Recommendations</h1>
          </div>
          <p className="text-[#8b8fa8] text-sm ml-12">Get personalised AI-powered book suggestions</p>
        </div>

        {/* Pill-style tab bar */}
        <div className="flex gap-1.5 bg-[#1a1d27] p-1.5 rounded-2xl mb-8 w-fit border border-[#2a2d3e] flex-wrap">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults([]);
                  setError('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-900/40'
                    : 'text-[#8b8fa8] hover:text-[#f0f0f5] hover:bg-[#2a2d3e]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Input area card */}
        <div className="bg-[#1a1d27] rounded-2xl p-6 mb-8 border border-[#2a2d3e]">
          {activeTab === 'author' && (
            <div>
              <label className="block text-sm font-medium text-[#8b8fa8] mb-2">
                Enter an author name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && !loading && handleGetRecommendations()}
                  placeholder="e.g. Stephen King, Agatha Christie, Brandon Sanderson..."
                  className="flex-1 bg-[#0f1117] border border-[#2a2d3e] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[#f0f0f5] placeholder-[#4a4d62] outline-none transition-all text-sm"
                />
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !canSubmit}
                  className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#2a2d3e] disabled:text-[#4a4d62] disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Recommendations
                </button>
              </div>
            </div>
          )}

          {activeTab === 'genre' && (
            <div>
              <label className="block text-sm font-medium text-[#8b8fa8] mb-2">
                Select a genre
              </label>
              <div className="flex gap-3">
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="flex-1 bg-[#0f1117] border border-[#2a2d3e] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[#f0f0f5] outline-none transition-all text-sm"
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !canSubmit}
                  className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#2a2d3e] disabled:text-[#4a4d62] disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Recommendations
                </button>
              </div>
            </div>
          )}

          {activeTab === 'mood' && (
            <div>
              <label className="block text-sm font-medium text-[#8b8fa8] mb-2">
                Describe your current mood or what you&apos;re looking for
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && !loading && handleGetRecommendations()}
                  placeholder="e.g. something uplifting, a gripping page-turner, a cozy mystery..."
                  className="flex-1 bg-[#0f1117] border border-[#2a2d3e] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[#f0f0f5] placeholder-[#4a4d62] outline-none transition-all text-sm"
                />
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !canSubmit}
                  className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#2a2d3e] disabled:text-[#4a4d62] disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Recommendations
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-4">
              <div className="mb-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-[#f0f0f5] font-semibold mb-1">Reading History Recommendations</h3>
                <p className="text-[#8b8fa8] text-sm max-w-sm mx-auto">
                  We&apos;ll analyse the books you&apos;ve marked as &quot;Finished&quot; in your library and suggest similar books you&apos;d enjoy.
                </p>
              </div>
              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Get Recommendations from History
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div>
            <div className="h-6 skeleton w-48 rounded mb-5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#f0f0f5] tracking-tight">
                {results.length} Recommendations For You
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map((book, idx) => (
                <BookCard
                  key={`${book.googleBooksId || book.title}-${idx}`}
                  book={book}
                  onAddToLibrary={handleAddToLibrary}
                  isInLibrary={book.googleBooksId ? libraryBookIds.has(book.googleBooksId) : false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-indigo-500/60" />
            </div>
            <p className="text-[#8b8fa8] text-base font-medium">
              {activeTab === 'history'
                ? 'Click the button above to get personalised picks'
                : 'Fill in the form above and click Get Recommendations'}
            </p>
            <p className="text-[#4a4d62] text-sm mt-1.5">Your personalised book picks will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
