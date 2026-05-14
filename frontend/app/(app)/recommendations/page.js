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
    <div className="rounded-2xl border overflow-hidden animate-pulse" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
      <div className="aspect-[2/3] w-full" style={{ backgroundColor: '#2a2d3e' }} />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded" style={{ backgroundColor: '#2a2d3e' }} />
        <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#2a2d3e' }} />
        <div className="h-8 w-full rounded-xl mt-3" style={{ backgroundColor: '#2a2d3e' }} />
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('author');
  const [authorInput, setAuthorInput] = useState('');
  const [genreInput, setGenreInput] = useState('Fiction');
  const [moodInput, setMoodInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [libraryBookIds, setLibraryBookIds] = useState(new Set());

  useEffect(() => {
    async function loadLibrary() {
      try {
        const data = await libraryApi.getLibrary();
        const ids = new Set(
          (data.entries || []).map(e => e.book?.googleBooksId).filter(Boolean)
        );
        setLibraryBookIds(ids);
      } catch { /* non-critical */ }
    }
    loadLibrary();
  }, []);

  const handleGetRecommendations = async () => {
    setError('');
    setResults([]);
    setLoading(true);
    try {
      const input =
        activeTab === 'author' ? authorInput :
        activeTab === 'genre' ? genreInput :
        activeTab === 'mood' ? moodInput : '';
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
      if (book.googleBooksId) setLibraryBookIds(prev => new Set([...prev, book.googleBooksId]));
    } catch (err) {
      if (err?.message?.includes('already') && book.googleBooksId) {
        setLibraryBookIds(prev => new Set([...prev, book.googleBooksId]));
      }
    }
  };

  const canSubmit =
    activeTab === 'author' ? authorInput.trim().length > 0 :
    activeTab === 'genre' ? genreInput.trim().length > 0 :
    activeTab === 'mood' ? moodInput.trim().length > 0 : true;

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#0f1117' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f0f0f5' }}>Book Recommendations</h1>
          </div>
          <p className="text-sm ml-12" style={{ color: '#8b8fa8' }}>Get personalised AI-powered book suggestions</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 p-1.5 rounded-2xl mb-8 w-fit border flex-wrap" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setResults([]); setError(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive ? 'text-white shadow-sm' : 'hover:bg-[#2a2d3e]'}`}
                style={isActive ? { backgroundColor: '#6366f1' } : { color: '#8b8fa8' }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Input card */}
        <div className="rounded-2xl border p-6 mb-8" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
          {activeTab === 'author' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#8b8fa8' }}>Enter an author name</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && !loading && handleGetRecommendations()}
                  placeholder="e.g. Stephen King, Agatha Christie, Brandon Sanderson..."
                  className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500"
                  style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}
                />
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !canSubmit}
                  className="px-5 py-3 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Recommendations
                </button>
              </div>
            </div>
          )}

          {activeTab === 'genre' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#8b8fa8' }}>Select a genre</label>
              <div className="flex gap-3">
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all"
                  style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}
                >
                  {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading}
                  className="px-5 py-3 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Recommendations
                </button>
              </div>
            </div>
          )}

          {activeTab === 'mood' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#8b8fa8' }}>
                Describe your current mood or what you&apos;re looking for
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && !loading && handleGetRecommendations()}
                  placeholder="e.g. something uplifting, a gripping page-turner, a cozy mystery..."
                  className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500"
                  style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}
                />
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !canSubmit}
                  className="px-5 py-3 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Recommendations
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#f0f0f5' }}>Reading History Recommendations</h3>
              <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: '#8b8fa8' }}>
                We&apos;ll analyse the books you&apos;ve marked as &quot;Finished&quot; in your library and suggest similar books you&apos;d enjoy.
              </p>
              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 text-white rounded-xl font-medium transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#6366f1' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Get Recommendations from History
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 border text-red-400 px-4 py-3 rounded-xl mb-6 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div>
            <div className="h-5 rounded w-48 mb-5" style={{ backgroundColor: '#2a2d3e' }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <h2 className="text-lg font-bold tracking-tight mb-5" style={{ color: '#f0f0f5' }}>
              {results.length} Recommendations For You
            </h2>
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>
              <Sparkles className="w-8 h-8" style={{ color: 'rgba(99,102,241,0.5)' }} />
            </div>
            <p className="text-base font-medium" style={{ color: '#8b8fa8' }}>
              {activeTab === 'history'
                ? 'Click the button above to get personalised picks'
                : 'Fill in the form above and click Get Recommendations'}
            </p>
            <p className="text-sm mt-1.5" style={{ color: '#4a4d62' }}>Your personalised book picks will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
