'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';

function getHintsSeen() {
  try { return JSON.parse(localStorage.getItem('folio_hints_seen') || '[]'); } catch { return []; }
}

function markHintSeen(pageKey) {
  try {
    const seen = getHintsSeen();
    if (!seen.includes(pageKey)) localStorage.setItem('folio_hints_seen', JSON.stringify([...seen, pageKey]));
  } catch {}
}

export default function PageHint({ pageKey, message, linkText, linkHref }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = getHintsSeen();
    if (!seen.includes(pageKey)) setVisible(true);
  }, [pageKey]);

  if (!visible) return null;

  const dismiss = () => {
    markHintSeen(pageKey);
    setVisible(false);
  };

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-2xl border mb-6 text-sm"
      style={{ backgroundColor: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}
    >
      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#818cf8' }} />
      <p className="flex-1 leading-relaxed" style={{ color: '#8b8fa8' }}>
        {message}
        {linkText && linkHref && (
          <>
            {' '}
            <a href={linkHref} className="underline hover:text-indigo-400 transition-colors" style={{ color: '#818cf8' }}>
              {linkText}
            </a>
          </>
        )}
      </p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 transition-colors hover:text-[#8b8fa8] mt-0.5"
        style={{ color: '#4a4d62' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
