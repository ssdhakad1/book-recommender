'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Star, Calendar, Hash, ShoppingBag, Plus, Check, ChevronLeft, FileText } from 'lucide-react';
import { books as booksApi, library as libraryApi } from '../../../../lib/api';
import BookSourcesModal from '../../../../components/BookSourcesModal';

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
  const router = useRouter();
  const googleBooksId = params.googleBooksId;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const [showSources, setShowSources] = useState(false);

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

        // Check if already in library
        try {
          const libData = await libraryApi.getLibrary();
          const entries = libData.entries || [];
          const found = entries.some((e) => e.book?.googleBooksId === bookData.googleBooksId);
          setIsInLibrary(found);
        } catch {
          // Non-critical
        }
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
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#0f1117'}}>
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#0f1117'}}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Book not found.'}</p>
          <Link href="/search" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const stars = book.averageRating ? Math.round(book.averageRating) : 0;

  return (
    <div className="min-h-screen pb-16" style={{backgroundColor:'#0f1117'}}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors hover:text-indigo-400"
          style={{color:'#8b8fa8'}}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Two column layout */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* Left column: cover + metadata */}
          <div className="flex-shrink-0 md:w-64">
            {/* Cover */}
            <div className="w-full max-w-[200px] mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border mb-6" style={{borderColor:'#2a2d3e', aspectRatio:'2/3', position:'relative'}}>
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{backgroundColor:'#1a1d27'}}>
                  <BookOpen className="w-16 h-16" style={{color:'#2a2d3e'}} />
                </div>
              )}
            </div>

            {/* Metadata boxes */}
            <div className="space-y-2">
              {book.publishedDate && (
                <div className="rounded-xl border p-3 flex items-center gap-2.5" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{color:'#4a4d62'}} />
                  <div>
                    <p className="text-xs" style={{color:'#4a4d62'}}>Published</p>
                    <p className="text-sm font-medium" style={{color:'#f0f0f5'}}>{book.publishedDate}</p>
                  </div>
                </div>
              )}
              {book.pageCount && (
                <div className="rounded-xl border p-3 flex items-center gap-2.5" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
                  <FileText className="w-4 h-4 flex-shrink-0" style={{color:'#4a4d62'}} />
                  <div>
                    <p className="text-xs" style={{color:'#4a4d62'}}>Pages</p>
                    <p className="text-sm font-medium" style={{color:'#f0f0f5'}}>{book.pageCount}</p>
                  </div>
                </div>
              )}
              {book.isbn && (
                <div className="rounded-xl border p-3 flex items-center gap-2.5" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
                  <Hash className="w-4 h-4 flex-shrink-0" style={{color:'#4a4d62'}} />
                  <div>
                    <p className="text-xs" style={{color:'#4a4d62'}}>ISBN</p>
                    <p className="text-sm font-medium" style={{color:'#f0f0f5'}}>{book.isbn}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column: details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold leading-tight mb-2" style={{color:'#f0f0f5'}}>{book.title}</h1>
            <p className="text-xl mb-4" style={{color:'#8b8fa8'}}>{book.author}</p>

            {/* Star rating */}
            {book.averageRating && (
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${s <= stars ? 'text-amber-400 fill-amber-400' : ''}`}
                      style={s > stars ? {color:'#2a2d3e'} : {}}
                    />
                  ))}
                </div>
                <span className="text-sm" style={{color:'#8b8fa8'}}>{book.averageRating.toFixed(1)}/5</span>
              </div>
            )}

            {/* Genre pills */}
            {book.genres && book.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {book.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-sm px-3 py-1 rounded-full border"
                    style={{backgroundColor:'rgba(99,102,241,0.1)', color:'#818cf8', borderColor:'rgba(99,102,241,0.3)'}}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{color:'#4a4d62'}}>About this book</h2>
                <p className="leading-relaxed text-sm" style={{color:'#8b8fa8'}}>{book.description}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAddToLibrary}
                disabled={isInLibrary || addingToLibrary}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  isInLibrary ? 'border cursor-default' : 'bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-60'
                }`}
                style={isInLibrary ? {backgroundColor:'rgba(34,197,94,0.1)', borderColor:'rgba(34,197,94,0.3)', color:'#22c55e'} : {}}
              >
                {addingToLibrary ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isInLibrary ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isInLibrary ? 'In Library' : 'Add to Library'}
              </button>

              <button
                onClick={() => setShowSources(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all border hover:bg-[#1a1d27]"
                style={{backgroundColor:'transparent', borderColor:'#2a2d3e', color:'#8b8fa8'}}
              >
                <ShoppingBag className="w-4 h-4" />
                Find &amp; Buy
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSources && book && (
        <BookSourcesModal book={book} onClose={() => setShowSources(false)} />
      )}
    </div>
  );
}
