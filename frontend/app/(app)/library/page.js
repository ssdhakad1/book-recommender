'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Library, Trash2, BookOpen, Loader2, Star, Eye, Pencil, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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

const STATUS_ORDER = { WISHLIST: 0, READING: 1, FINISHED: 2 };

function StarDisplay({ rating, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#2a2d3e]'}`}
        />
      ))}
    </div>
  );
}

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40 inline" />;
  }
  return sortConfig.dir === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline" />
    : <ArrowDown className="w-3.5 h-3.5 ml-1 inline" />;
}

export default function LibraryPage() {
  const [entries, setEntries] = useState([]);
  const [reviews, setReviews] = useState({}); // { [entryId]: { content, rating } | null }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [updatingEntryId, setUpdatingEntryId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });

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

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const baseFiltered = filter === 'ALL' ? entries : entries.filter((e) => e.status === filter);

  const filteredEntries = [...baseFiltered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal, bVal;
    if (sortConfig.key === 'title') {
      aVal = (a.book.title || '').toLowerCase();
      bVal = (b.book.title || '').toLowerCase();
    } else if (sortConfig.key === 'author') {
      aVal = (a.book.author || '').toLowerCase();
      bVal = (b.book.author || '').toLowerCase();
    } else if (sortConfig.key === 'status') {
      aVal = STATUS_ORDER[a.status] ?? 0;
      bVal = STATUS_ORDER[b.status] ?? 0;
    } else if (sortConfig.key === 'addedAt') {
      aVal = new Date(a.addedAt).getTime();
      bVal = new Date(b.addedAt).getTime();
    } else {
      return 0;
    }
    if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
    return 0;
  });

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
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#0f1117'}}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p style={{color:'#8b8fa8'}}>Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{backgroundColor:'#0f1117'}}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.2)'}}>
              <Library className="w-5 h-5 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{color:'#f0f0f5'}}>My Library</h1>
          </div>
          <p className="text-sm ml-12" style={{color:'#8b8fa8'}}>{entries.length} books in your collection</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border p-4" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
            <p className="text-xs font-medium mb-1" style={{color:'#4a4d62'}}>WISHLIST</p>
            <p className="text-2xl font-bold" style={{color:'#f0f0f5'}}>{counts.WISHLIST}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
            <p className="text-xs font-medium mb-1" style={{color:'#4a4d62'}}>READING</p>
            <p className="text-2xl font-bold text-indigo-400">{counts.READING}</p>
          </div>
          <div className="rounded-2xl border p-4" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
            <p className="text-xs font-medium mb-1" style={{color:'#4a4d62'}}>FINISHED</p>
            <p className="text-2xl font-bold text-green-400">{counts.FINISHED}</p>
          </div>
        </div>

        {error && (
          <div className="border text-red-400 px-4 py-3 rounded-xl mb-6 text-sm" style={{backgroundColor:'rgba(239,68,68,0.1)', borderColor:'rgba(239,68,68,0.3)'}}>
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 p-1.5 rounded-2xl mb-6 w-fit border flex-wrap" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                filter === f.id
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'hover:bg-[#2a2d3e]'
              }`}
              style={filter === f.id ? {} : {color:'#8b8fa8'}}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-indigo-400/30' : ''}`}
                style={filter === f.id ? {} : {backgroundColor:'#2a2d3e', color:'#8b8fa8'}}>
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20" style={{color:'#4a4d62'}}>
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg" style={{color:'#8b8fa8'}}>
              {filter === 'ALL' ? 'Your library is empty' : `No books in ${STATUS_LABELS[filter] || filter}`}
            </p>
            <p className="text-sm mt-2" style={{color:'#4a4d62'}}>
              <Link href="/search" className="text-indigo-400 hover:text-indigo-300">Search for books</Link> or browse{' '}
              <Link href="/trending" className="text-indigo-400 hover:text-indigo-300">trending titles</Link> to add some.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{backgroundColor:'#1a1d27', borderColor:'#2a2d3e'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{borderColor:'#2a2d3e', backgroundColor:'rgba(42,45,62,0.4)'}}>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 w-16" style={{color:'#4a4d62'}}>Cover</th>
                    <th
                      className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 cursor-pointer transition-colors select-none hover:text-[#f0f0f5]"
                      style={{color:'#4a4d62'}}
                      onClick={() => handleSort('title')}
                    >
                      Book <SortIcon column="title" sortConfig={sortConfig} />
                    </th>
                    <th
                      className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 w-36 cursor-pointer transition-colors select-none hover:text-[#f0f0f5]"
                      style={{color:'#4a4d62'}}
                      onClick={() => handleSort('author')}
                    >
                      Author <SortIcon column="author" sortConfig={sortConfig} />
                    </th>
                    <th
                      className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 w-52 cursor-pointer transition-colors select-none hover:text-[#f0f0f5]"
                      style={{color:'#4a4d62'}}
                      onClick={() => handleSort('status')}
                    >
                      Status <SortIcon column="status" sortConfig={sortConfig} />
                    </th>
                    <th
                      className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 w-32 cursor-pointer transition-colors select-none hover:text-[#f0f0f5]"
                      style={{color:'#4a4d62'}}
                      onClick={() => handleSort('addedAt')}
                    >
                      Added <SortIcon column="addedAt" sortConfig={sortConfig} />
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 w-48" style={{color:'#4a4d62'}}>Review</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3 w-24" style={{color:'#4a4d62'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const review = reviews[entry.id];
                    const hasReview = !!review;

                    return (
                      <tr key={entry.id} className="border-b transition-colors hover:bg-[#2a2d3e]/20" style={{borderColor:'rgba(42,45,62,0.5)'}}>

                        {/* Cover */}
                        <td className="px-4 py-3">
                          <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0" style={{backgroundColor:'#2a2d3e'}}>
                            {entry.book.coverUrl ? (
                              <Image src={entry.book.coverUrl} alt={entry.book.title} width={40} height={56} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-5 h-5" style={{color:'#4a4d62'}} />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3">
                          {entry.book.googleBooksId ? (
                            <Link href={`/book/${entry.book.googleBooksId}`} className="font-medium hover:text-indigo-400 transition-colors line-clamp-2" style={{color:'#f0f0f5'}}>
                              {entry.book.title}
                            </Link>
                          ) : (
                            <span className="font-medium line-clamp-2" style={{color:'#f0f0f5'}}>{entry.book.title}</span>
                          )}
                        </td>

                        {/* Author */}
                        <td className="px-4 py-3">
                          <p className="text-sm" style={{color:'#8b8fa8'}}>{entry.book.author}</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={entry.status}
                              disabled={updatingEntryId === entry.id}
                              onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                              className="border text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              style={{backgroundColor:'#0f1117', borderColor:'#2a2d3e', color:'#f0f0f5'}}
                            >
                              <option value="WISHLIST">&#9679; Wishlist</option>
                              <option value="READING">&#9679; Currently Reading</option>
                              <option value="FINISHED">&#9679; Finished Reading</option>
                            </select>
                            {updatingEntryId === entry.id && (
                              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-sm" style={{color:'#8b8fa8'}}>
                          {new Date(entry.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Review column */}
                        <td className="px-4 py-3">
                          {entry.status === 'FINISHED' ? (
                            hasReview ? (
                              <div className="space-y-1.5">
                                <StarDisplay rating={review.rating} />
                                <p className="text-xs line-clamp-1 max-w-[160px]" style={{color:'#8b8fa8'}}>
                                  {review.content}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => setViewModal({ open: true, entryId: entry.id })}
                                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => setEditModal({ open: true, entryId: entry.id })}
                                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditModal({ open: true, entryId: entry.id })}
                                className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                <Star className="w-4 h-4" />
                                Write Review
                              </button>
                            )
                          ) : (
                            <span className="text-xs" style={{color:'#4a4d62'}}>Mark as finished to review</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemove(entry.id)}
                            className="p-1 rounded transition-colors hover:text-red-400"
                            style={{color:'#4a4d62'}}
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
