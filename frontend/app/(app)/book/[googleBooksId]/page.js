'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Star, Calendar, Hash, ExternalLink, Plus, Check, Loader2, ChevronLeft } from 'lucide-react';
import { books as booksApi, library as libraryApi } from '../../../../lib/api';

async function fetchOpenLibraryBook(rawId) {
  // rawId is like "OL_OL123456W" — strip the "OL_" prefix
  const workId = rawId.replace(/^OL_/, '');
  const workUrl = `https://openlibrary.org/works/${workId}.json`;

  const workRes = await fetch(workUrl);
  if (!workRes.ok) throw new Error('Open Library book not found.');
  const work = await workRes.json();

  // Fetch author name
  let author = 'Unknown Author';
  if (work.authors && work.authors.length > 0) {
    const authorKey = work.authors[0].author?.key || work.authors[0].key;
    if (authorKey) {
      try {
        const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
        if (authorRes.ok) {
          const authorData = await authorRes.json();
          author = authorData.name || authorData.personal_name || 'Unknown Author';
        }
      } catch {
        // use default
      }
    }
  }

  // Cover URL
  let coverUrl = null;
  if (work.covers && work.covers.length > 0) {
    coverUrl = `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`;
  }

  // Description
  let description = null;
  if (work.description) {
    description = typeof work.description === 'string' ? work.description : work.description.value || null;
  }

  // Genres from subjects
  const genres = work.subjects ? work.subjects.slice(0, 5) : [];

  const title = work.title || 'Unknown Title';
  const buyLink = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + author + ' buy')}`;

  return {
    googleBooksId: rawId,
    title,
    author,
    coverUrl,
    description,
    genres,
    publishedDate: work.first_publish_date || null,
    averageRating: null,
    pageCount: null,
    isbn: null,
    buyLink,
  };
}

export default function BookDetailPage() {
  const params = useParams();
  const googleBooksId = params.googleBooksId;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState(false);

  useEffect(() => {
    async function fetchBook() {
      try {
        let bookData;
        if (googleBooksId && googleBooksId.startsWith('OL_')) {
          bookData = await fetchOpenLibraryBook(googleBooksId);
        } else {
          const data = await booksApi.getBook(googleBooksId);
          bookData = data.book;
        }
        setBook(bookData);
      } catch (err) {
        setError(err.message || 'Failed to load book details.');
      } finally {
        setLoading(false);
      }
    }
    if (googleBooksId) fetchBook();
  }, [googleBooksId]);

  const handleAddToLibrary = async () => {
    if (!book || isInLibrary) return;
    setAddingToLibrary(true);
    try {
      await libraryApi.addToLibrary(book);
      setIsInLibrary(true);
    } catch (err) {
      if (err.message?.includes('already')) {
        setIsInLibrary(true);
      }
    } finally {
      setAddingToLibrary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Book not found.'}</p>
          <Link href="/search" className="text-blue-400 hover:underline">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const stars = book.averageRating ? Math.round(book.averageRating) : 0;

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Search
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="w-48 h-72 bg-slate-800 rounded-xl overflow-hidden shadow-2xl mx-auto md:mx-0 border border-slate-700">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  width={192}
                  height={288}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-slate-500" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">{book.title}</h1>
            <p className="text-xl text-slate-300 mb-4">{book.author}</p>

            {/* Rating */}
            {book.averageRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                    />
                  ))}
                </div>
                <span className="text-slate-400 text-sm">{book.averageRating.toFixed(1)}/5</span>
              </div>
            )}

            {/* Genres */}
            {book.genres && book.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {book.genres.map((genre) => (
                  <span key={genre} className="text-sm px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full border border-blue-800/50">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {book.publishedDate && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{book.publishedDate}</span>
                </div>
              )}
              {book.pageCount && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{book.pageCount} pages</span>
                </div>
              )}
              {book.isbn && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Hash className="w-4 h-4" />
                  <span>ISBN: {book.isbn}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAddToLibrary}
                disabled={isInLibrary || addingToLibrary}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
                  isInLibrary
                    ? 'bg-green-900/30 text-green-400 border border-green-800 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60'
                }`}
              >
                {addingToLibrary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isInLibrary ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isInLibrary ? 'In Library' : 'Add to Library'}
              </button>

              {book.buyLink && (
                <a
                  href={book.buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors border border-slate-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buy / Find
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-3">About this book</h2>
            <p className="text-slate-300 leading-relaxed">{book.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
