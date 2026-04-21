'use client';

import { useState, useEffect } from 'react';
import { Star, X, Loader2, AlertCircle } from 'lucide-react';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewModal({ isOpen, onClose, onSave, existingReview }) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(existingReview?.content || '');
      setRating(existingReview?.rating || 0);
      setHoverRating(0);
      setError('');
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please write a review before saving.');
      return;
    }
    if (!rating) {
      setError('Please select a star rating before saving.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(content.trim(), rating);
    } catch (err) {
      setError(err.message || 'Failed to save review.');
    } finally {
      setSaving(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1d27] rounded-2xl border border-[#2a2d3e] shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#f0f0f5] tracking-tight">
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#4a4d62] hover:text-[#f0f0f5] transition-colors p-1.5 rounded-lg hover:bg-[#2a2d3e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Star rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#8b8fa8] mb-3">Your Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="star p-0.5 transition-transform"
              >
                <Star
                  className={`w-10 h-10 transition-all ${
                    star <= activeRating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-[#2a2d3e] hover:text-amber-400/50'
                  }`}
                />
              </button>
            ))}
          </div>
          {activeRating > 0 && (
            <p className="text-sm text-[#8b8fa8] mt-2">
              <span className="text-amber-400 font-medium">{activeRating}/5</span>
              {' — '}
              {RATING_LABELS[activeRating]}
            </p>
          )}
        </div>

        {/* Review textarea */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#8b8fa8] mb-2">Your Review</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={5}
            className="w-full bg-[#0f1117] border border-[#2a2d3e] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-[#f0f0f5] placeholder-[#4a4d62] outline-none transition-all text-sm resize-none"
          />
          <p className="text-xs text-[#4a4d62] mt-1.5">{content.length} characters</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-xl mb-4 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#2a2d3e] hover:bg-[#353849] text-[#f0f0f5] rounded-xl font-medium transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              existingReview ? 'Update Review' : 'Save Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
