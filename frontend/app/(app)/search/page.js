'use client';

import { useState } from 'react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { books as booksApi, library as libraryApi } from '../../../lib/api';
import BookCard from '../../../components/BookCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [libraryBookIds, setLibraryBookIds] = useState(new Set());

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const data = await booksApi.searchBooks(query);
      setResults(data.books || []);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
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
      if (err.message?.includes('already')) {
        if (book.googleBooksId) {
          setLibraryBookIds((prev) => new Set([...prev, book.googleBooksId]));
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Search className="w-8 h-8 text-blue-400" />
            Search Books
          </h1>
          <p className="text-slate-400 mt-1">Find any book and add it to your library</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, ISBN..."
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Searching books...</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <p className="text-slate-400 text-sm mb-5">
              Found {results.length} results for &quot;{query}&quot;
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((book) => (
                <BookCard
                  key={book.googleBooksId || book.title}
                  book={book}
                  onAddToLibrary={handleAddToLibrary}
                  isInLibrary={book.googleBooksId ? libraryBookIds.has(book.googleBooksId) : false}
                />
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-16 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No results found for &quot;{query}&quot;</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {/* Initial state */}
        {!loading && !searched && (
          <div className="text-center py-16 text-slate-600">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Start typing to search for books</p>
          </div>
        )}
      </div>
    </div>
  );
}
