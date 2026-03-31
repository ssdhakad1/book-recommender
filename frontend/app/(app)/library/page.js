'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Library, Trash2, BookOpen, Loader2, Star } from 'lucide-react';
import { library as libraryApi } from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import ReviewModal from '../../../components/ReviewModal';

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

export default function LibraryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [reviewModal, setReviewModal] = useState({ open: false, entryId: null, existingReview: null });
  const [updatingEntryId, setUpdatingEntryId] = useState(null);

  useEffect(() => {
    fetchLibrary();
  }, []);

  async function fetchLibrary() {
    setLoading(true);
    try {
      const data = await libraryApi.getLibrary();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message || 'Failed to load library.');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (entryId, newStatus) => {
    setUpdatingEntryId(entryId);
    try {
      const data = await libraryApi.updateLibraryEntry(entryId, newStatus);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? data.entry : e)));
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
    } catch (err) {
      alert(err.message || 'Failed to remove book.');
    }
  };

  const openReviewModal = async (entryId) => {
    try {
      const data = await libraryApi.getReview(entryId);
      setReviewModal({ open: true, entryId, existingReview: data.review });
    } catch {
      setReviewModal({ open: true, entryId, existingReview: null });
    }
  };

  const handleSaveReview = async (content, rating) => {
    try {
      await libraryApi.saveReview(reviewModal.entryId, content, rating);
      setReviewModal({ open: false, entryId: null, existingReview: null });
    } catch (err) {
      throw err;
    }
  };

  const filteredEntries = filter === 'ALL' ? entries : entries.filter((e) => e.status === filter);

  const counts = {
    ALL: entries.length,
    WISHLIST: entries.filter((e) => e.status === 'WISHLIST').length,
    READING: entries.filter((e) => e.status === 'READING').length,
    FINISHED: entries.filter((e) => e.status === 'FINISHED').length,
  };

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
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f.id ? 'bg-blue-500/50' : 'bg-slate-700'
                }`}
              >
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
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-16">
                      Cover
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                      Book
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-52">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-32">
                      Added
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-36">
                      Review
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Cover */}
                      <td className="px-4 py-3">
                        <div className="w-10 h-14 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                          {entry.book.coverUrl ? (
                            <Image
                              src={entry.book.coverUrl}
                              alt={entry.book.title}
                              width={40}
                              height={56}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
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
                          <Link
                            href={`/book/${entry.book.googleBooksId}`}
                            className="text-white font-medium hover:text-blue-400 transition-colors line-clamp-2"
                          >
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
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {new Date(entry.addedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Review */}
                      <td className="px-4 py-3">
                        {entry.status === 'FINISHED' && (
                          <button
                            onClick={() => openReviewModal(entry.id)}
                            className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            <Star className="w-4 h-4" />
                            Write Review
                          </button>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, entryId: null, existingReview: null })}
        onSave={handleSaveReview}
        existingReview={reviewModal.existingReview}
      />
    </div>
  );
}
