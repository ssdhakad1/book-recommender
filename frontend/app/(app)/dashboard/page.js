'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles, User, Tag, Heart, BookOpen, Loader2, AlertCircle,
  CheckCircle, Bookmark, BookMarked, Target, ChevronRight, X, RotateCcw,
} from 'lucide-react';
import { recommendations as recApi, library as libraryApi } from '../../../lib/api';
import BookCard from '../../../components/BookCard';
import HorizontalBookScroll from '../../../components/HorizontalBookScroll';
import { useAuth } from '../../../context/AuthContext';

// ── Constants ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'author', label: 'By Author', icon: User },
  { id: 'genre', label: 'By Genre', icon: Tag },
  { id: 'mood', label: 'By Mood', icon: Heart },
  { id: 'history', label: 'Reading History', icon: BookOpen },
];

const GENRE_OPTIONS = [
  'Fiction', 'Non-Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
  'Romance', 'Historical Fiction', 'Horror', 'Self-Help', 'Biography', 'Philosophy',
  'Psychology', 'Business', 'Poetry', 'Graphic Novel', 'Young Adult', "Children's",
];

const QUICK_MOODS = [
  { label: '✨ Uplifting', query: 'something uplifting and feel-good' },
  { label: '🔥 Gripping Thriller', query: 'gripping page-turner thriller suspense' },
  { label: '🏰 Epic Fantasy', query: 'epic fantasy magic adventure dragons' },
  { label: '☕ Cozy & Relaxing', query: 'cozy relaxing warm comfortable read' },
  { label: '🚀 Mind-Bending Sci-Fi', query: 'mind-bending science fiction space future' },
  { label: '💡 Mind-Expanding', query: 'thought-provoking philosophical deep intellectual' },
];

const RECENT_KEY = 'br_recent_searches';
const GOAL_KEY = 'br_reading_goal';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getGreeting(name) {
  const h = new Date().getHours();
  const first = name?.split(' ')[0] || 'there';
  if (h < 12) return `Good morning, ${first}`;
  if (h < 17) return `Good afternoon, ${first}`;
  return `Good evening, ${first}`;
}

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function pushRecent(type, query) {
  try {
    const prev = loadRecent();
    const next = [
      { type, query, ts: Date.now() },
      ...prev.filter(s => !(s.type === type && s.query.toLowerCase() === query.toLowerCase())),
    ].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

function loadGoal() {
  try { return JSON.parse(localStorage.getItem(GOAL_KEY) || 'null'); } catch { return null; }
}

function saveGoal(g) {
  try { localStorage.setItem(GOAL_KEY, JSON.stringify(g)); } catch {}
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border overflow-hidden animate-pulse flex-shrink-0 w-40" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
      <div className="aspect-[2/3] w-full" style={{ backgroundColor: '#2a2d3e' }} />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded" style={{ backgroundColor: '#2a2d3e', width: '80%' }} />
        <div className="h-2.5 rounded" style={{ backgroundColor: '#2a2d3e', width: '55%' }} />
        <div className="h-7 rounded-xl mt-2" style={{ backgroundColor: '#2a2d3e' }} />
      </div>
    </div>
  );
}

// ── Reading Goal widget ────────────────────────────────────────────────────────

function ReadingGoalWidget({ finishedCount }) {
  const year = new Date().getFullYear();
  const [goal, setGoal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const g = loadGoal();
    if (g?.year === year) setGoal(g);
  }, [year]);

  const handleSave = () => {
    const n = parseInt(inputVal, 10);
    if (!n || n < 1) return;
    const g = { year, target: n };
    saveGoal(g);
    setGoal(g);
    setEditing(false);
    setInputVal('');
  };

  const pct = goal ? Math.min(100, Math.round((finishedCount / goal.target) * 100)) : 0;
  const remaining = goal ? Math.max(0, goal.target - finishedCount) : 0;

  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-semibold text-sm" style={{ color: '#f0f0f5' }}>{year} Reading Goal</span>
        </div>
        {goal && !editing && (
          <button
            onClick={() => { setInputVal(String(goal.target)); setEditing(true); }}
            className="text-xs hover:text-indigo-400 transition-colors"
            style={{ color: '#8b8fa8' }}
          >
            Edit
          </button>
        )}
      </div>

      {!goal && !editing ? (
        <div className="text-center py-1">
          <p className="text-xs mb-3" style={{ color: '#8b8fa8' }}>How many books will you read in {year}?</p>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            Set a Goal
          </button>
        </div>
      ) : editing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. 24"
            min="1"
            autoFocus
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none border transition-all focus:border-amber-500"
            style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}
          />
          <button
            onClick={handleSave}
            className="px-3 py-2 text-white rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: '#f59e0b' }}
          >
            Save
          </button>
          {goal && (
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-2 rounded-xl text-sm transition-all"
              style={{ backgroundColor: '#2a2d3e', color: '#8b8fa8' }}
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold" style={{ color: '#f0f0f5' }}>
              {finishedCount}
              <span className="text-sm font-normal ml-1" style={{ color: '#8b8fa8' }}>/ {goal.target} books</span>
            </span>
            <span className="text-sm font-bold text-amber-400">{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#2a2d3e' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: '#f59e0b' }}
            />
          </div>
          <p className="text-xs" style={{ color: '#8b8fa8' }}>
            {remaining === 0
              ? '🎉 Goal achieved! Incredible reading!'
              : `${remaining} more book${remaining !== 1 ? 's' : ''} to go`}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryBookIds, setLibraryBookIds] = useState(new Set());

  const [forYou, setForYou] = useState({ books: [], loading: true, empty: false });

  const [moodResult, setMoodResult] = useState({ books: [], loading: false, activeChip: null });

  const [activeTab, setActiveTab] = useState('author');
  const [authorInput, setAuthorInput] = useState('');
  const [genreInput, setGenreInput] = useState('Fiction');
  const [moodInput, setMoodInput] = useState('');
  const [exploreResults, setExploreResults] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState('');

  const [recentSearches, setRecentSearches] = useState([]);

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setRecentSearches(loadRecent());

    async function init() {
      try {
        const data = await libraryApi.getLibrary();
        const all = data.entries || [];
        setEntries(all);
        setLibraryBookIds(new Set(all.map(e => e.book?.googleBooksId).filter(Boolean)));
      } catch { /* non-critical */ } finally {
        setLibraryLoading(false);
      }

      try {
        const data = await recApi.getRecommendations('history', '', 10);
        const books = data.recommendations || [];
        setForYou({ books, loading: false, empty: books.length === 0 });
      } catch {
        setForYou({ books: [], loading: false, empty: true });
      }
    }
    init();
  }, []);

  const handleAddToLibrary = useCallback(async (book) => {
    try {
      await libraryApi.addToLibrary(book);
      if (book.googleBooksId) setLibraryBookIds(prev => new Set([...prev, book.googleBooksId]));
    } catch (err) {
      if (err?.message?.includes('already') && book.googleBooksId) {
        setLibraryBookIds(prev => new Set([...prev, book.googleBooksId]));
      }
    }
  }, []);

  const handleMoodChip = async (chip) => {
    setMoodResult({ books: [], loading: true, activeChip: chip.label });
    try {
      const data = await recApi.getRecommendations('mood', chip.query, 10);
      setMoodResult({ books: data.recommendations || [], loading: false, activeChip: chip.label });
    } catch {
      setMoodResult({ books: [], loading: false, activeChip: chip.label });
    }
  };

  const handleExplore = useCallback(async (overrideType, overrideInput) => {
    const type = overrideType || activeTab;
    const input = overrideInput !== undefined ? overrideInput : (
      type === 'author' ? authorInput :
      type === 'genre' ? genreInput :
      type === 'mood' ? moodInput : ''
    );

    setExploreError('');
    setExploreResults([]);
    setExploreLoading(true);

    if (input.trim() && (type === 'author' || type === 'mood')) {
      pushRecent(type, input.trim());
      setRecentSearches(loadRecent());
    }

    try {
      const data = await recApi.getRecommendations(type, input, 10);
      setExploreResults(data.recommendations || []);
    } catch (err) {
      setExploreError(err.message || 'Failed to get recommendations.');
    } finally {
      setExploreLoading(false);
    }
  }, [activeTab, authorInput, genreInput, moodInput]);

  const handleRecentClick = (s) => {
    if (s.type === 'author') setAuthorInput(s.query);
    if (s.type === 'mood') setMoodInput(s.query);
    setActiveTab(s.type);
    handleExplore(s.type, s.query);
  };

  const removeRecent = (i) => {
    try {
      const next = recentSearches.filter((_, idx) => idx !== i);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecentSearches(next);
    } catch {}
  };

  const stats = {
    finished: entries.filter(e => e.status === 'FINISHED').length,
    reading: entries.filter(e => e.status === 'READING').length,
    wishlist: entries.filter(e => e.status === 'WISHLIST').length,
  };
  const currentlyReading = entries.filter(e => e.status === 'READING').map(e => e.book);

  const canSubmit =
    activeTab === 'author' ? authorInput.trim().length > 0 :
    activeTab === 'genre' ? genreInput.trim().length > 0 :
    activeTab === 'mood' ? moodInput.trim().length > 0 : true;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#0f1117' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Greeting + Stats */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: '#f0f0f5' }}>
            {getGreeting(user?.name)} 👋
          </h1>
          <p className="text-sm mb-6" style={{ color: '#8b8fa8' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          {!libraryLoading && (
            <div className="flex gap-3 flex-wrap">
              {[
                { icon: CheckCircle, cls: 'text-green-400', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', count: stats.finished, label: 'Finished' },
                { icon: BookOpen, cls: 'text-indigo-400', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', count: stats.reading, label: 'Reading' },
                { icon: Bookmark, cls: 'text-amber-400', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', count: stats.wishlist, label: 'Wishlist' },
              ].map(({ icon: Icon, cls, bg, border, count, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl px-4 py-3 border" style={{ backgroundColor: bg, borderColor: border }}>
                  <Icon className={`w-4 h-4 ${cls}`} />
                  <span className="text-sm font-medium" style={{ color: '#f0f0f5' }}>
                    <span className="font-bold">{count}</span>
                    <span className="ml-1.5" style={{ color: '#8b8fa8' }}>{label}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-10">

            {/* Currently Reading */}
            {currentlyReading.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold tracking-tight" style={{ color: '#f0f0f5' }}>
                    📖 Currently Reading
                  </h2>
                  <Link href="/library" className="flex items-center gap-1 text-xs hover:text-indigo-300 transition-colors" style={{ color: '#8b8fa8' }}>
                    View library <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <HorizontalBookScroll books={currentlyReading} onAddToLibrary={handleAddToLibrary} libraryBookIds={libraryBookIds} />
              </section>
            )}

            {/* Recommended For You */}
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="text-base font-bold tracking-tight" style={{ color: '#f0f0f5' }}>Recommended For You</h2>
              </div>

              {forYou.loading ? (
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : forYou.empty ? (
                <div className="rounded-2xl border px-6 py-8 text-center" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
                  <BookMarked className="w-8 h-8 mx-auto mb-3" style={{ color: '#4a4d62' }} />
                  <p className="text-sm font-medium mb-1" style={{ color: '#8b8fa8' }}>No personalised picks yet</p>
                  <p className="text-xs" style={{ color: '#4a4d62' }}>
                    Mark books as Finished in your{' '}
                    <Link href="/library" className="text-indigo-400 hover:text-indigo-300">library</Link>{' '}
                    and we&apos;ll recommend what to read next.
                  </p>
                </div>
              ) : (
                <HorizontalBookScroll books={forYou.books} onAddToLibrary={handleAddToLibrary} libraryBookIds={libraryBookIds} />
              )}
            </section>

            {/* Browse by Mood */}
            <section>
              <h2 className="text-base font-bold tracking-tight mb-4" style={{ color: '#f0f0f5' }}>
                🎭 Browse by Mood
              </h2>
              <div className="flex flex-wrap gap-2 mb-5">
                {QUICK_MOODS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleMoodChip(chip)}
                    disabled={moodResult.loading}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-60"
                    style={
                      moodResult.activeChip === chip.label
                        ? { backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' }
                        : { backgroundColor: '#1a1d27', borderColor: '#2a2d3e', color: '#8b8fa8' }
                    }
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              {moodResult.loading && (
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}
              {!moodResult.loading && moodResult.books.length > 0 && (
                <HorizontalBookScroll books={moodResult.books} onAddToLibrary={handleAddToLibrary} libraryBookIds={libraryBookIds} />
              )}
            </section>

            {/* Explore More */}
            <section>
              <h2 className="text-base font-bold tracking-tight mb-4" style={{ color: '#f0f0f5' }}>
                🔍 Explore More
              </h2>

              {recentSearches.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {recentSearches.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e', color: '#8b8fa8' }}>
                      <RotateCcw className="w-3 h-3 flex-shrink-0" />
                      <button onClick={() => handleRecentClick(s)} className="hover:text-indigo-400 transition-colors max-w-[140px] truncate">
                        {s.type === 'author' ? '👤' : '😊'} {s.query}
                      </button>
                      <button onClick={() => removeRecent(i)} className="ml-0.5 hover:text-red-400 transition-colors flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab bar */}
              <div className="flex gap-1.5 p-1.5 rounded-2xl mb-4 w-fit border flex-wrap" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setExploreResults([]); setExploreError(''); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${isActive ? 'text-white' : 'hover:bg-[#2a2d3e]'}`}
                      style={isActive ? { backgroundColor: '#6366f1' } : { color: '#8b8fa8' }}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Input card */}
              <div className="rounded-2xl border p-5 mb-4" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
                {activeTab === 'author' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && canSubmit && !exploreLoading && handleExplore()}
                      placeholder="e.g. Stephen King, Agatha Christie, Brandon Sanderson..."
                      className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500"
                      style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}
                    />
                    <button onClick={() => handleExplore()} disabled={exploreLoading || !canSubmit} className="px-5 py-3 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90" style={{ backgroundColor: '#6366f1' }}>
                      {exploreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Get Recs
                    </button>
                  </div>
                )}
                {activeTab === 'genre' && (
                  <div className="flex gap-3">
                    <select value={genreInput} onChange={(e) => setGenreInput(e.target.value)} className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all" style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}>
                      {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button onClick={() => handleExplore()} disabled={exploreLoading} className="px-5 py-3 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: '#6366f1' }}>
                      {exploreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Get Recs
                    </button>
                  </div>
                )}
                {activeTab === 'mood' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={moodInput}
                      onChange={(e) => setMoodInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && canSubmit && !exploreLoading && handleExplore()}
                      placeholder="e.g. something uplifting, a gripping page-turner, cozy mystery..."
                      className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500"
                      style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}
                    />
                    <button onClick={() => handleExplore()} disabled={exploreLoading || !canSubmit} className="px-5 py-3 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90" style={{ backgroundColor: '#6366f1' }}>
                      {exploreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Get Recs
                    </button>
                  </div>
                )}
                {activeTab === 'history' && (
                  <div className="text-center py-2">
                    <p className="text-sm mb-4" style={{ color: '#8b8fa8' }}>Analyse your finished books and suggest similar reads</p>
                    <button onClick={() => handleExplore()} disabled={exploreLoading} className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90" style={{ backgroundColor: '#6366f1' }}>
                      {exploreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Analyse History
                    </button>
                  </div>
                )}
              </div>

              {exploreError && (
                <div className="flex items-start gap-3 border text-red-400 px-4 py-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {exploreError}
                </div>
              )}
              {exploreLoading && (
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}
              {!exploreLoading && exploreResults.length > 0 && (
                <HorizontalBookScroll books={exploreResults} onAddToLibrary={handleAddToLibrary} libraryBookIds={libraryBookIds} />
              )}
            </section>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">
            <ReadingGoalWidget finishedCount={stats.finished} />

            <div className="rounded-2xl border p-5" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#f0f0f5' }}>Quick Links</h3>
              <div className="space-y-1.5">
                {[
                  { href: '/library', label: 'My Library', sub: `${entries.length} book${entries.length !== 1 ? 's' : ''}`, cls: 'text-indigo-400', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)' },
                  { href: '/trending', label: 'Trending Now', sub: 'Top 50 books today', cls: 'text-amber-400', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
                  { href: '/search', label: 'Search Books', sub: 'Find any book', cls: 'text-green-400', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.2)' },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#2a2d3e] transition-all">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: link.bg, border: `1px solid ${link.border}` }}>
                      <ChevronRight className={`w-4 h-4 ${link.cls}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#f0f0f5' }}>{link.label}</p>
                      <p className="text-xs" style={{ color: '#8b8fa8' }}>{link.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a4d62' }}>Tip</p>
              <p className="text-sm leading-relaxed" style={{ color: '#8b8fa8' }}>
                Rate your finished books ⭐ so we can tailor your &ldquo;Recommended For You&rdquo; picks more accurately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
