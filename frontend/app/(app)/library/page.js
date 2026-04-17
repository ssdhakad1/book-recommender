'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Library, Trash2, BookOpen, Loader2, Star, Eye, Pencil } from 'lucide-react';
import { library as libraryApi } from '../../../lib/api';
import ReviewModal from '../../../components/ReviewModal';
import ReviewViewModal from '../../../components/ReviewViewModal';

const STATUS_LABELS = {
  WISHLIST: 'Wishlist',
  READING: 'Currently Reading',
  FINISHED: 'Finished Reading',
};

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'WISHLIST', label: 'Wishlist' },
  { id: 'READING', label: 'Reading' },
  { id: 'FINISHED', label: 'Finished' },
];

function StarDisplay({ rating, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const [entries, setEntries] = useState([]);
  const [reviews, setReviews] = useState({}); // { [entryId]: { content, rating } | null }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [updatingEntryId, setUpdatingEntryId] = useState(null);

  // Edit/write modal state
  const [editModal, setEditModal] = useState({ open: false, entryId: null });
  // View modal state
  const [viewModal, setViewModal] = useState({ open: false, entryId: null });

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await libraryApi.getLibrary();
      const fetchedEntries = data.entries || [];
      setEntries(fetchedEntries);

      // Fetch reviews for all FINISHED books in parallel
      const finishedEntries = fetchedEntries.filter((e) => e.status === 'FINISHED');
      const reviewResults = await Promise.allSettled(
        finishedEntries.map((e) => libraryApi.getReview(e.id).then((r) => ({ id: e.id, review: r.review })))
      );
      const reviewMap = {};
      reviewResults.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.review) {
          reviewMap[r.value.id] = r.value.review;
        }
      });
      setReviews(reviewMap);
    } catch (err) {
      setError(err.message || 'Failed to load library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleStatusChange = async (entryId, newStatus) => {
    setUpdatingEntryId(entryId);
    try {
      const data = await libraryApi.updateLibraryEntry(entryId, newStatus);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...data.entry } : e)));

      // If changed TO finished, try fetching a review (might already exist)
      if (newStatus === 'FINISHED') {
        try {
          const r = await libraryApi.getReview(entryId);
          if (r.review) setReviews((prev) => ({ ...prev, [entryId]: r.review }));
        } catch {}
      }
      // If changed AWAY from finished, clear the review display
      if (newStatus !== 'FINISHED') {
        setReviews((prev) => { const next = { ...prev }; delete next[entryId]; return next; });
      }
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdatingEntryId(null);
    }
  };

  const handleRemove = async (entryId) => {
    if (!confirm('Remove this book from your library?')) return;
    try {
      await libraryApi.removeFromLibrary(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      setReviews((prev) => { const next = { ...prev }; delete next[entryId]; return next; });
    } catch (err) {
      alert(err.message || 'Failed to remove book.');
    }
  };

  const handleSaveReview = async (content, rating) => {
    await libraryApi.saveReview(editModal.entryId, content, rating);
    // Update review in state immediately — no refetch needed
    const newReview = { content, rating };
    setReviews((prev) => ({ ...prev, [editModal.entryId]: newReview }));
    setEditModal({ open: false, entryId: null });
  };

  const filteredEntries = filter === 'ALL' ? entries : entries.filter((e) => e.status === filter);

  const counts = {
    ALL: entries.length,
    WISHLIST: entries.filter((e) => e.status === 'WISHLIST').length,
    READING: entries.filter((e) => e.status === 'READING').length,
    FINISHED: entries.filter((e) => e.status === 'FINISHED').length,
  };

  const viewingEntry = entries.find((e) => e.id === viewModal.entryId);
  const viewingReview = reviews[viewModal.entryId];
  const editingReview = reviews[editModal.entryId];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Library className="w-8 h-8 text-blue-400" />
            My Library
          </h1>
          <p className="text-slate-400 mt-1">{entries.length} books in your collection</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-blue-500/50' : 'bg-slate-700'}`}>
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">
              {filter === 'ALL' ? 'Your library is empty' : `No books in ${STATUS_LABELS[filter] || filter}`}
            </p>
            <p className="text-sm mt-2">
              <Link href="/search" className="text-blue-400 hover:underline">Search for books</Link> or browse{' '}
              <Link href="/trending" className="text-blue-400 hover:underline">trending titles</Link> to add some.
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-16">Cover</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Book</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-52">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-32">Added</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-48">Review</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredEntries.map((entry) => {
                    const review = reviews[entry.id];
                    const hasReview = !!review;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-700/30 transition-colors">

                        {/* Cover */}
                        <td className="px-4 py-3">
                          <div className="w-10 h-14 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                            {entry.book.coverUrl ? (
                              <Image src={entry.book.coverUrl} alt={entry.book.title} width={40} height={56} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-slate-500" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Title + Author */}
                        <td className="px-4 py-3">
                          {entry.book.googleBooksId ? (
                            <Link href={`/book/${entry.book.googleBooksId}`} className="text-white font-medium hover:text-blue-400 transition-colors line-clamp-2">
                              {entry.book.title}
                            </Link>
                          ) : (
                            <span className="text-white font-medium line-clamp-2">{entry.book.title}</span>
                          )}
                          <p className="text-slate-400 text-sm mt-0.5">{entry.book.author}</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <select
                            value={entry.status}
                            disabled={updatingEntryId === entry.id}
                            onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                            className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="WISHLIST">Wishlist</option>
                            <option value="READING">Currently Reading</option>
                            <option value="FINISHED">Finished Reading</option>
                          </select>
                          {updatingEntryId === entry.id && (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin inline ml-2" />
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {new Date(entry.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Review column */}
                        <td className="px-4 py-3">
                          {entry.status === 'FINISHED' ? (
                            hasReview ? (
                              // Has a review — show stars + snippet + view/edit buttons
                              <div className="space-y-1.5">
                                <StarDisplay rating={review.rating} />
                                <p className="text-slate-400 text-xs line-clamp-1 max-w-[160px]">
                                  {review.content}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => setViewModal({ open: true, entryId: entry.id })}
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => setEditModal({ open: true, entryId: entry.id })}
                                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // No review yet
                              <button
                                onClick={() => setEditModal({ open: true, entryId: entry.id })}
                                className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                              >
                                <Star className="w-4 h-4" />
                                Write Review
                              </button>
                            )
                          ) : (
                            <span className="text-slate-600 text-xs">Mark as finished to review</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemove(entry.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
                            title="Remove from library"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Write / Edit Review Modal */}
      <ReviewModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, entryId: null })}
        onSave={handleSaveReview}
        existingReview={editingReview || null}
      />

      {/* View Review Modal */}
      <ReviewViewModal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, entryId: null })}
        onEdit={() => {
          setViewModal({ open: false, entryId: null });
          setEditModal({ open: true, entryId: viewModal.entryId });
        }}
        review={viewingReview || null}
        book={viewingEntry?.book || null}
      />
    </div>
  );
}
