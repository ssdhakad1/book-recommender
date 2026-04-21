'use client';

import { Star, X, Pencil, BookOpen } from 'lucide-react';
import Image from 'next/image';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewViewModal({ isOpen, onClose, onEdit, review, book }) {
  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1a1d27] rounded-2xl border border-[#2a2d3e] shadow-2xl w-full max-w-lg p-6">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#4a4d62] hover:text-[#f0f0f5] transition-colors p-1.5 rounded-lg hover:bg-[#2a2d3e]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Book info */}
        {book && (
          <div className="flex gap-4 mb-5 pr-8">
            <div className="w-14 h-20 bg-[#0f1117] rounded-xl overflow-hidden flex-shrink-0 border border-[#2a2d3e]">
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
                  <BookOpen className="w-6 h-6 text-[#4a4d62]" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-[#f0f0f5] font-bold text-lg leading-tight line-clamp-2 tracking-tight">
                {book.title}
              </h2>
              <p className="text-[#8b8fa8] text-sm mt-1">{book.author}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[#2a2d3e] mb-5" />

        {/* Rating */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#4a4d62] uppercase tracking-wider mb-2">Your Rating</p>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${
                    s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-[#2a2d3e]'
                  }`}
                />
              ))}
            </div>
            <span className="text-amber-400 font-semibold text-sm">{review.rating}/5</span>
            <span className="text-[#8b8fa8] text-sm">— {RATING_LABELS[review.rating]}</span>
          </div>
        </div>

        {/* Review text — quote style box */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#4a4d62] uppercase tracking-wider mb-2">Your Review</p>
          <div className="relative bg-[#0f1117] rounded-xl border border-[#2a2d3e] px-5 py-4">
            {/* Quote decoration */}
            <span className="absolute top-2 left-3 text-4xl text-indigo-500/20 font-serif leading-none select-none">
              &ldquo;
            </span>
            <p className="text-[#f0f0f5] text-sm leading-relaxed whitespace-pre-wrap pl-4">
              {review.content}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#2a2d3e] hover:bg-[#353849] text-[#f0f0f5] rounded-xl font-medium transition-all text-sm"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Pencil className="w-4 h-4" />
            Edit Review
          </button>
        </div>
      </div>
    </div>
  );
}
