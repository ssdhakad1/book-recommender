'use client';

import { Star, X, Pencil } from 'lucide-react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewViewModal({ isOpen, onClose, onEdit, review, book }) {
  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg p-6">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Book info */}
        {book && (
          <div className="flex gap-4 mb-6 pr-8">
            <div className="w-14 h-20 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
              {book.coverUrl ? (
                <Image src={book.coverUrl} alt={book.title} width={56} height={80} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-500" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-semibold text-lg leading-tight line-clamp-2">{book.title}</h2>
              <p className="text-slate-400 text-sm mt-1">{book.author}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-700 mb-5" />

        {/* Rating */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Rating</p>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                />
              ))}
            </div>
            <span className="text-yellow-400 font-semibold">{review.rating}/5</span>
            <span className="text-slate-400 text-sm">— {RATING_LABELS[review.rating]}</span>
          </div>
        </div>

        {/* Review text */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Review</p>
          <div className="bg-slate-900/60 rounded-xl border border-slate-700 px-4 py-4">
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{review.content}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Review
          </button>
        </div>
      </div>
    </div>
  );
}
