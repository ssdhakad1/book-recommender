'use client';

import { useState } from 'react';
import { Sparkles, User, Tag, Heart, BookOpen, Loader2 } from 'lucide-react';
import { recommendations as recApi } from '../../../lib/api';
import BookCard from '../../../components/BookCard';
import { library } from '../../../lib/api';

const TABS = [
  { id: 'author', label: 'By Author', icon: User },
  { id: 'genre', label: 'By Genre', icon: Tag },
  { id: 'mood', label: 'By Mood', icon: Heart },
  { id: 'history', label: 'Reading History', icon: BookOpen },
];

const GENRE_OPTIONS = [
  'Fiction', 'Non-Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
  'Romance', 'Historical Fiction', 'Horror', 'Self-Help', 'Biography', 'Philosophy',
  'Psychology', 'Business', 'Poetry', 'Graphic Novel', 'Young Adult', 'Children\'s',
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('author');
  const [authorInput, setAuthorInput] = useState('');
  const [genreInput, setGenreInput] = useState('Fiction');
  const [moodInput, setMoodInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [libraryBookIds, setLibraryBookIds] = useState(new Set());

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
      setError(err.message || 'Failed to get recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async (book) => {
    try {
      await library.addToLibrary(book);
      if (book.googleBooksId) {
        setLibraryBookIds((prev) => new Set([...prev, book.googleBooksId]));
      }
    } catch (err) {
      // Book might already be in library
      console.error('Add to library error:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-400" />
            Book Recommendations
          </h1>
          <p className="text-slate-400 mt-1">Get personalized AI-powered book suggestions</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-800 p-1 rounded-xl mb-8 w-fit border border-slate-700">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults([]);
                  setError('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Input area */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
          {activeTab === 'author' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Enter an author name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && authorInput.trim() && handleGetRecommendations()}
                  placeholder="e.g. Stephen King, Agatha Christie, Brandon Sanderson..."
                  className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                />
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !authorInput.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Recommend
                </button>
              </div>
            </div>
          )}

          {activeTab === 'genre' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select or enter a genre
              </label>
              <div className="flex gap-3">
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !genreInput.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Recommend
                </button>
              </div>
            </div>
          )}

          {activeTab === 'mood' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Describe your current mood or what you&apos;re looking for
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && moodInput.trim() && handleGetRecommendations()}
                  placeholder="e.g. something uplifting, a gripping page-turner, a cozy mystery..."
                  className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500"
                />
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading || !moodInput.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Recommend
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Reading History Recommendations</h3>
                  <p className="text-slate-400 text-sm">
                    We&apos;ll analyze the books you&apos;ve marked as &quot;Finished&quot; in your library and suggest similar books you&apos;d enjoy.
                  </p>
                </div>
                <button
                  onClick={handleGetRecommendations}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Recommendations
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Finding your perfect reads...</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-5">
              {results.length} Recommendations For You
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
          <div className="text-center py-16 text-slate-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Fill in the form above and click Recommend</p>
            <p className="text-sm mt-1">Your personalized book picks will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
