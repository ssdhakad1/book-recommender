'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, BookOpen, Loader2, Plus, Check } from 'lucide-react';
import { trending as trendingApi, library as libraryApi } from '../../../lib/api';

export default function TrendingPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedBooks, setAddedBooks] = useState(new Set());
  const [addingBook, setAddingBook] = useState(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const data = await trendingApi.getTrending();
        setBooks(data.books || []);
      } catch (err) {
        setError(err.message || 'Failed to load trending books.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  const handleAddToLibrary = async (book) => {
    const key = book.googleBooksId || book.title;
    setAddingBook(key);
    try {
      await libraryApi.addToLibrary(book);
      setAddedBooks((prev) => new Set([...prev, key]));
    } catch (err) {
      if (err.message?.includes('already')) {
        setAddedBooks((prev) => new Set([...prev, key]));
      }
    } finally {
      setAddingBook(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-16">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              Trending Books
            </h1>
            <p className="text-slate-400 mt-1">Top 50 most popular books right now</p>
          </div>

          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex gap-4 animate-pulse">
                <div className="skeleton w-8 h-6 rounded" />
                <div className="skeleton w-14 h-20 rounded" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="skeleton h-5 w-48 rounded" />
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-4 w-64 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            Trending Books
          </h1>
          <p className="text-slate-400 mt-1">Top 50 most popular books right now</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {books.map((book, index) => {
            const key = book.googleBooksId || book.title;
            const isAdded = addedBooks.has(key);
            const isAdding = addingBook === key;

            return (
              <div
                key={`${key}-${index}`}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex gap-4 hover:border-slate-600 transition-colors"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 pt-1">
                  <span className={`text-lg font-bold ${index < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                    {book.rank || index + 1}
                  </span>
                </div>

                {/* Cover */}
                <div className="flex-shrink-0 w-14 h-20 bg-slate-700 rounded overflow-hidden">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      width={56}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {book.googleBooksId ? (
                        <Link
                          href={`/book/${book.googleBooksId}`}
                          className="text-white font-semibold hover:text-blue-400 transition-colors"
                        >
                          {book.title}
                        </Link>
                      ) : (
                        <span className="text-white font-semibold">{book.title}</span>
                      )}
                      <p className="text-slate-400 text-sm mt-0.5">{book.author}</p>

                      {/* Genres */}
                      {book.genres && book.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {book.genres.slice(0, 3).map((genre) => (
                            <span
                              key={genre}
                              className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {book.description && (
                        <p className="text-slate-400 text-sm mt-2 line-clamp-2">{book.description}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToLibrary(book)}
                      disabled={isAdded || isAdding}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isAdded
                          ? 'bg-green-900/30 text-green-400 border border-green-800 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                      }`}
                    >
                      {isAdding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isAdded ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {isAdded ? 'Added' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
