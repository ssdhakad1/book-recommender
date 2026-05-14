'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookCard from './BookCard';

export default function HorizontalBookScroll({
  books = [],
  onAddToLibrary,
  libraryBookIds = new Set(),
}) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  if (!books.length) return null;

  return (
    <div className="relative group/scroll">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-all shadow-lg"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e', color: '#f0f0f5' }}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {books.map((book, idx) => (
          <div
            key={`${book.googleBooksId || book.title}-${idx}`}
            className="flex-shrink-0 w-40"
          >
            <BookCard
              book={book}
              onAddToLibrary={onAddToLibrary}
              isInLibrary={book.googleBooksId ? libraryBookIds.has(book.googleBooksId) : false}
            />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-all shadow-lg"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e', color: '#f0f0f5' }}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
