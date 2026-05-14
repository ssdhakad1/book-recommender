'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { books as booksApi, library as libraryApi } from '../../../lib/api';
import BookCard from '../../../components/BookCard';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border overflow-hidden animate-pulse" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
      <div className="aspect-[2/3] w-full" style={{backgroundColor:'#2a2d3e'}} />
      <div className="p-3.5 space-y-2">
        <div className="h-3 rounded" style={{backgroundColor:'#2a2d3e', width:'80%'}} />
        <div className="h-2.5 rounded" style={{backgroundColor:'#2a2d3e', width:'60%'}} />
        <div className="h-8 rounded-xl mt-3" style={{backgroundColor:'#2a2d3e'}} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
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
        // Non-critical
      }
    }
    loadLibrary();
  }, []);

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
    <div className="min-h-screen pb-16" style={{backgroundColor:'#0f1117'}}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Search className="w-6 h-6" style={{color:'#818cf8'}} />
            <h1 className="text-2xl font-bold tracking-tight" style={{color:'#f0f0f5'}}>Search Books</h1>
          </div>
          <p className="text-sm ml-12" style={{color:'#8b8fa8'}}>Find any book and add it to your library</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{color:'#4a4d62'}} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, ISBN..."
                className="w-full border rounded-xl pl-12 pr-4 py-3.5 text-base outline-none transition-all focus:border-indigo-500"
                style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e', color:'#f0f0f5'}}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center gap-2"
              style={loading || !query.trim() ? {backgroundColor:'#2a2d3e', color:'#4a4d62'} : {}}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="border text-red-400 px-4 py-3 rounded-xl mb-6 text-sm" style={{backgroundColor:'rgba(239,68,68,0.1)', borderColor:'rgba(239,68,68,0.3)'}}>
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <p className="text-sm mb-5" style={{color:'#8b8fa8'}}>
              Found {results.length} results for &quot;{query}&quot;
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" style={{color:'#4a4d62'}} />
            <p className="text-lg" style={{color:'#8b8fa8'}}>No results found for &quot;{query}&quot;</p>
            <p className="text-sm mt-1" style={{color:'#4a4d62'}}>Try a different search term</p>
          </div>
        )}

        {/* Initial idle state */}
        {!loading && !searched && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{backgroundColor:'rgba(99,102,241,0.1)'}}>
              <Search className="w-8 h-8" style={{color:'rgba(99,102,241,0.5)'}} />
            </div>
            <p className="text-base" style={{color:'#8b8fa8'}}>Search for books by title, author, or ISBN</p>
            <p className="text-sm mt-1" style={{color:'#4a4d62'}}>Your results will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
