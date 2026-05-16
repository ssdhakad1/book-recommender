'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const TASKS = [
  { id: 'add_book',     label: 'Add a book to your library',  hint: 'Search or browse Trending',         href: '/search'          },
  { id: 'finish_book',  label: 'Finish your first book',      hint: 'Mark a book as Finished',           href: '/library'         },
  { id: 'write_review', label: 'Write your first review',     hint: 'Available once a book is Finished', href: '/library'         },
  { id: 'get_rec',      label: 'Get a recommendation',        hint: 'Try the Discover page',             href: '/recommendations' },
  { id: 'set_goal',     label: 'Set a reading goal',          hint: 'Head to Dashboard and set a goal',  href: '/dashboard'       },
];

export default function GettingStartedChecklist({ entries = [], loading = false }) {
  const [dismissed, setDismissed] = useState(true); // hidden until localStorage check
  const [done, setDone] = useState({});

  useEffect(() => {
    // Wait for library to finish loading before evaluating —
    // otherwise entries=[] makes add_book/finish_book appear unchecked
    if (loading) return;

    try {
      if (localStorage.getItem('folio_checklist_dismissed') === '1') return;
    } catch {}

    const hasBook     = entries.length > 0;
    const hasFinished = entries.some(e => e.status === 'FINISHED');

    let goalSet = false, gotRec = false, reviewDone = false;
    try {
      goalSet    = !!localStorage.getItem('folio_reading_goal');
      gotRec     = !!localStorage.getItem('folio_got_recommendation');
      reviewDone = !!localStorage.getItem('folio_first_review_done');
    } catch {}

    const newDone = {
      add_book:     hasBook,
      finish_book:  hasFinished,
      write_review: reviewDone,
      get_rec:      gotRec,
      set_goal:     goalSet,
    };

    // Auto-dismiss when all complete
    if (Object.values(newDone).every(Boolean)) {
      try { localStorage.setItem('folio_checklist_dismissed', '1'); } catch {}
      setDismissed(true); // actually hide the component, not just set localStorage
      return;
    }

    setDone(newDone);
    setDismissed(false);
  }, [entries, loading]);

  const dismiss = () => {
    try { localStorage.setItem('folio_checklist_dismissed', '1'); } catch {}
    setDismissed(true);
  };

  if (dismissed) return null;

  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = Math.round((doneCount / TASKS.length) * 100);

  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#f0f0f5' }}>Getting Started</h3>
          <p className="text-xs mt-0.5" style={{ color: '#4a4d62' }}>{doneCount} of {TASKS.length} complete</p>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-lg transition-colors hover:bg-[#2a2d3e]"
          style={{ color: '#4a4d62' }}
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: '#2a2d3e' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#6366f1' }}
        />
      </div>

      {/* Tasks */}
      <div className="space-y-1">
        {TASKS.map(task => {
          const isDone = done[task.id];
          return (
            <Link
              key={task.id}
              href={isDone ? '#' : task.href}
              onClick={isDone ? (e) => e.preventDefault() : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isDone ? 'cursor-default' : 'hover:bg-[#0f1117]'
              }`}
            >
              {isDone
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                : <Circle      className="w-4 h-4 flex-shrink-0" style={{ color: '#4a4d62' }} />
              }
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium"
                  style={{
                    color: isDone ? '#4a4d62' : '#f0f0f5',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}
                >
                  {task.label}
                </p>
                {!isDone && <p className="text-xs" style={{ color: '#4a4d62' }}>{task.hint}</p>}
              </div>
              {!isDone && (
                <ChevronRight
                  className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#818cf8' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
