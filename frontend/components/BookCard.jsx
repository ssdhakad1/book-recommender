'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Plus, Check, Loader2, Star } from 'lucide-react';
import { useState } from 'react';

export default function BookCard({ book, onAddToLibrary, isInLibrary = false }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(isInLibrary);

  const handleAddToLibrary = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (added || adding) return;

    setAdding(true);
    try {
      await onAddToLibrary(book);
      setAdded(true);
    } catch (err) {
      if (err?.message?.includes('already')) {
        setAdded(true);
      }
    } finally {
      setAdding(false);
    }
  };

  // Update added state if isInLibrary prop changes
  if (isInLibrary && !added) {
    setAdded(true);
  }

  const cardContent = (
    <div className="bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all overflow-hidden flex flex-col h-full group">
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-slate-700 overflow-hidden">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
            <BookOpen className="w-10 h-10 text-slate-500 mb-2" />
            <p className="text-slate-400 text-xs text-center leading-snug line-clamp-3">
              {book.title}
            </p>
          </div>
        )}

        {/* Rating badge */}
        {book.averageRating && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 text-yellow-400 text-xs px-1.5 py-0.5 rounded-md">
            <Star className="w-3 h-3 fill-yellow-400" />
            {book.averageRating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-sm line-clamp-2 leading-snug mb-0.5">
          {book.title}
        </h3>
        <p className="text-slate-400 text-xs mb-2 line-clamp-1">{book.author}</p>

        {/* Reason (for recommendations) */}
        {book.reason && (
          <p className="text-slate-400 text-xs mb-2 line-clamp-2 italic border-l-2 border-blue-700 pl-2">
            {book.reason}
          </p>
        )}

        {/* Genres */}
        {book.genres && book.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {book.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Add to Library button */}
        <div className="mt-auto">
          <button
            onClick={handleAddToLibrary}
            disabled={added || adding}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              added
                ? 'bg-green-900/30 text-green-400 border border-green-800/60 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60'
            }`}
          >
            {adding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : added ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {added ? 'In Library' : 'Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );

  if (book.googleBooksId) {
    return (
      <Link href={`/book/${book.googleBooksId}`} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return <div className="h-full">{cardContent}</div>;
}
