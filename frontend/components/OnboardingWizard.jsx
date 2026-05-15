'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Search, BookOpen, Sparkles } from 'lucide-react';
import { books as booksApi, library as libraryApi } from '../lib/api';

const GENRES = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Thriller', 'Romance',
  'Historical Fiction', 'Literary Fiction', 'Horror', 'Biography',
  'Self-Help', 'Business', 'Psychology', 'Philosophy', 'Poetry',
  'Young Adult', 'Classic Literature', 'Adventure', 'Non-Fiction',
  'Graphic Novel', 'True Crime',
];

const GOAL_PRESETS = [6, 12, 24, 52];

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);

  // Step 0 – genres
  const [selectedGenres, setSelectedGenres] = useState([]);

  // Step 1 – book search
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addedBook, setAddedBook]         = useState(null);
  const [addingBook, setAddingBook]       = useState(null);
  const debounceRef = useRef(null);

  // Step 2 – reading goal
  const [goalPreset, setGoalPreset] = useState('12');
  const [customGoal, setCustomGoal] = useState('');
  const [useCustom, setUseCustom]   = useState(false);

  // Debounced book search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await booksApi.searchBooks(searchQuery);
        setSearchResults((data.books || []).slice(0, 5));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const toggleGenre = (g) =>
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleGenreNext = () => {
    try { localStorage.setItem('br_genre_prefs', JSON.stringify(selectedGenres)); } catch {}
    setStep(1);
  };

  const handleAddBook = async (book) => {
    const key = book.googleBooksId || book.title;
    if (addingBook) return;
    setAddingBook(key);
    try {
      await libraryApi.addToLibrary({ ...book, status: 'FINISHED' });
      setAddedBook(book);
    } catch (err) {
      if (err.message?.includes('already')) setAddedBook(book);
    } finally {
      setAddingBook(null);
    }
  };

  const handleGoalSave = () => {
    const raw = useCustom ? customGoal : goalPreset;
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0) {
      try {
        localStorage.setItem('br_reading_goal', JSON.stringify({ year: new Date().getFullYear(), target: val }));
      } catch {}
    }
    setStep(3);
  };

  const finish = () => {
    try { localStorage.removeItem('br_show_wizard'); } catch {}
    if (onComplete) onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}
      >
        {/* Progress bar */}
        {step < 3 && (
          <div className="h-1 w-full" style={{ backgroundColor: '#2a2d3e' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${((step + 1) / 3) * 100}%`, backgroundColor: '#6366f1' }}
            />
          </div>
        )}

        {/* Step dots */}
        {step < 3 && (
          <div className="flex items-center justify-between px-6 pt-5">
            <span className="text-xs" style={{ color: '#4a4d62' }}>Step {step + 1} of 3</span>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ backgroundColor: i <= step ? '#6366f1' : '#2a2d3e' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Step 0: Choose genres ─────────────────────────────── */}
        {step === 0 && (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#f0f0f5' }}>
              Welcome to BookRecommender
            </h2>
            <p className="text-sm mb-5" style={{ color: '#8b8fa8' }}>
              Pick at least 3 genres you enjoy — we&apos;ll personalise your recommendations.
            </p>
            <div className="flex flex-wrap gap-2 mb-6 max-h-52 overflow-y-auto pr-1">
              {GENRES.map(g => {
                const sel = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                    style={{
                      backgroundColor: sel ? 'rgba(99,102,241,0.18)' : 'transparent',
                      borderColor:     sel ? '#6366f1' : '#2a2d3e',
                      color:           sel ? '#818cf8' : '#8b8fa8',
                    }}
                  >
                    {sel && '✓ '}{g}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleGenreNext}
              disabled={selectedGenres.length < 3}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: '#6366f1' }}
            >
              {selectedGenres.length < 3
                ? `Select ${3 - selectedGenres.length} more genre${3 - selectedGenres.length !== 1 ? 's' : ''}`
                : 'Continue →'}
            </button>
          </div>
        )}

        {/* ── Step 1: Add a book ────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#f0f0f5' }}>
              Add a book you&apos;ve read
            </h2>
            <p className="text-sm mb-4" style={{ color: '#8b8fa8' }}>
              We&apos;ll use your reading history to make better recommendations.
            </p>

            {addedBook ? (
              <div
                className="flex items-center gap-3 p-4 rounded-xl border mb-5"
                style={{ backgroundColor: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' }}
              >
                <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#4ade80' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#f0f0f5' }}>{addedBook.title}</p>
                  <p className="text-xs" style={{ color: '#8b8fa8' }}>Added to your library as Finished</p>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4a4d62' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by title or author…"
                    className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                    style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e', color: '#f0f0f5' }}
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                    {searchResults.map(book => {
                      const key = book.googleBooksId || book.title;
                      return (
                        <button
                          key={key}
                          onClick={() => handleAddBook(book)}
                          disabled={!!addingBook}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-[#0f1117] disabled:opacity-50 group"
                        >
                          <div
                            className="w-8 h-12 rounded flex-shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: '#2a2d3e' }}
                          >
                            {book.coverUrl
                              ? <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                              : <BookOpen className="w-3.5 h-3.5" style={{ color: '#4a4d62' }} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: '#f0f0f5' }}>{book.title}</p>
                            <p className="text-xs truncate" style={{ color: '#8b8fa8' }}>{book.author}</p>
                          </div>
                          <span
                            className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0 transition-colors group-hover:bg-indigo-500 group-hover:text-white"
                            style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                          >
                            {addingBook === key ? '…' : '+ Read'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!addedBook}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#6366f1' }}
              >
                Continue →
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-[#0f1117]"
                style={{ backgroundColor: '#2a2d3e', color: '#8b8fa8' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Reading goal ──────────────────────────────── */}
        {step === 2 && (
          <div className="p-6">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#f0f0f5' }}>
              Set a reading goal
            </h2>
            <p className="text-sm mb-5" style={{ color: '#8b8fa8' }}>
              How many books do you want to read in {new Date().getFullYear()}?
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {GOAL_PRESETS.map(n => {
                const active = !useCustom && goalPreset === String(n);
                return (
                  <button
                    key={n}
                    onClick={() => { setGoalPreset(String(n)); setUseCustom(false); }}
                    className="py-3 rounded-xl text-sm font-bold transition-all border"
                    style={{
                      backgroundColor: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                      borderColor:     active ? '#6366f1' : '#2a2d3e',
                      color:           active ? '#818cf8' : '#8b8fa8',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            <p className="text-xs mb-2" style={{ color: '#4a4d62' }}>Or enter a custom number:</p>
            <input
              type="number"
              min="1"
              max="365"
              value={customGoal}
              onChange={e => { setCustomGoal(e.target.value); setUseCustom(true); }}
              onFocus={() => setUseCustom(true)}
              placeholder="e.g. 30"
              className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors mb-5"
              style={{
                backgroundColor: '#0f1117',
                borderColor: useCustom ? '#6366f1' : '#2a2d3e',
                color: '#f0f0f5',
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={handleGoalSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#6366f1' }}
              >
                Continue →
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-[#0f1117]"
                style={{ backgroundColor: '#2a2d3e', color: '#8b8fa8' }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}
            >
              <Sparkles className="w-8 h-8" style={{ color: '#818cf8' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f0f0f5' }}>You&apos;re all set! 🎉</h2>
            <p className="text-sm mb-6" style={{ color: '#8b8fa8' }}>
              Your library is ready. Start discovering books tailored just for you.
            </p>
            <div className="space-y-2">
              <a
                href="/recommendations"
                onClick={finish}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#6366f1' }}
              >
                <Sparkles className="w-4 h-4" />
                Discover Books
              </a>
              <button
                onClick={finish}
                className="w-full py-2.5 rounded-xl text-sm transition-all hover:bg-[#2a2d3e]"
                style={{ color: '#8b8fa8', backgroundColor: 'transparent' }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
