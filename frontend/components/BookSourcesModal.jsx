'use client';

import Image from 'next/image';
import { BookOpen, X, ExternalLink } from 'lucide-react';

function buildLinks(book) {
  const isbn    = book.isbn || '';
  const q       = encodeURIComponent(`${book.title || ''} ${book.author || ''}`);
  const titleQ  = encodeURIComponent(book.title  || '');
  const authorQ = encodeURIComponent(book.author || '');

  return [
    {
      section: '🛒 Buy New',
      platforms: [
        {
          name: 'Amazon',
          desc: 'New, used & digital editions',
          letter: 'A',
          color: '#FF9900',
          url: isbn
            ? `https://www.amazon.com/s?k=${isbn}`
            : `https://www.amazon.com/s?k=${q}`,
        },
        {
          name: 'Barnes & Noble',
          desc: 'New & digital editions',
          letter: 'B&N',
          color: '#1d7340',
          url: isbn
            ? `https://www.barnesandnoble.com/s/${isbn}`
            : `https://www.barnesandnoble.com/s/${q}`,
        },
        {
          name: 'Bookshop.org',
          desc: 'Supports indie bookshops',
          letter: 'Bk',
          color: '#e8b84b',
          url: `https://bookshop.org/search?keywords=${q}`,
        },
        {
          name: 'Waterstones',
          desc: "UK's largest bookseller",
          letter: 'W',
          color: '#00529B',
          url: isbn
            ? `https://www.waterstones.com/index/search/term/${isbn}`
            : `https://www.waterstones.com/index/search/term/${q}`,
        },
      ],
    },
    {
      section: '💰 Buy Used & Save',
      platforms: [
        {
          name: 'ThriftBooks',
          desc: 'Affordable used books',
          letter: 'TB',
          color: '#2ecc71',
          url: `https://www.thriftbooks.com/browse/?b.search=${isbn || q}`,
        },
        {
          name: 'AbeBooks',
          desc: 'New, used & rare books',
          letter: 'Abe',
          color: '#c0392b',
          url: isbn
            ? `https://www.abebooks.com/servlet/SearchResults?isbn=${isbn}`
            : `https://www.abebooks.com/servlet/SearchResults?an=${authorQ}&tn=${titleQ}`,
        },
        {
          name: 'BetterWorldBooks',
          desc: 'Used books & funds literacy',
          letter: 'BWB',
          color: '#3498db',
          url: `https://www.betterworldbooks.com/search/results?q=${isbn || q}`,
        },
        {
          name: 'eBay',
          desc: 'New & used marketplace',
          letter: 'eBay',
          color: '#e43137',
          url: `https://www.ebay.com/sch/i.html?_nkw=${q}+book`,
        },
      ],
    },
    {
      section: '📚 Free & Library',
      platforms: [
        {
          name: 'Open Library',
          desc: 'Borrow books free online',
          letter: 'OL',
          color: '#ef4444',
          url: isbn
            ? `https://openlibrary.org/isbn/${isbn}`
            : `https://openlibrary.org/search?q=${q}`,
        },
        {
          name: 'WorldCat',
          desc: 'Find at a local library',
          letter: 'WC',
          color: '#6366f1',
          url: `https://www.worldcat.org/search?q=${isbn || q}`,
        },
        {
          name: 'Project Gutenberg',
          desc: 'Free public domain titles',
          letter: 'PG',
          color: '#8b5cf6',
          url: `https://www.gutenberg.org/ebooks/search/?query=${titleQ}`,
        },
        {
          name: 'Libby',
          desc: 'Ebooks & audiobooks via library',
          letter: 'Lb',
          color: '#06b6d4',
          url: `https://libbyapp.com/search/nearby/search/query-${q}/page-1`,
        },
      ],
    },
    {
      section: '👀 Preview & Discover',
      platforms: [
        {
          name: 'Google Books',
          desc: 'Preview & full book info',
          letter: 'GB',
          color: '#4285f4',
          url: isbn
            ? `https://books.google.com/books?vid=ISBN${isbn}`
            : `https://books.google.com/books?q=${q}`,
        },
        {
          name: 'Goodreads',
          desc: 'Reviews & reading community',
          letter: 'GR',
          color: '#c9aa71',
          url: `https://www.goodreads.com/search?q=${isbn || q}`,
        },
      ],
    },
  ];
}

export default function BookSourcesModal({ book, onClose }) {
  const sections = buildLinks(book);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl border w-full max-w-lg flex flex-col"
        style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3e', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b flex items-start gap-3.5 flex-shrink-0" style={{ borderColor: '#2a2d3e' }}>
          {/* Cover */}
          <div
            className="w-11 h-16 rounded-lg overflow-hidden flex-shrink-0 relative"
            style={{ backgroundColor: '#2a2d3e' }}
          >
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title || ''} fill className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-4 h-4" style={{ color: '#4a4d62' }} />
              </div>
            )}
          </div>

          {/* Title / author / isbn */}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm leading-snug line-clamp-2 mb-0.5" style={{ color: '#f0f0f5' }}>
              {book.title}
            </h2>
            <p className="text-xs mb-2 truncate" style={{ color: '#8b8fa8' }}>{book.author}</p>
            {book.isbn && (
              <span
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{ backgroundColor: '#2a2d3e', color: '#6b7280' }}
              >
                ISBN: {book.isbn}
              </span>
            )}
            {!book.isbn && (
              <span className="text-xs" style={{ color: '#4a4d62' }}>
                No ISBN — links use title search
              </span>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:bg-[#2a2d3e]"
            style={{ color: '#6b7280' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {sections.map(({ section, platforms }) => (
            <div key={section}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ color: '#4a4d62' }}
              >
                {section}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all hover:border-indigo-500/40 group"
                    style={{ backgroundColor: '#0f1117', borderColor: '#2a2d3e' }}
                  >
                    {/* Letter badge */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ backgroundColor: `${p.color}1a`, color: p.color }}
                    >
                      {p.letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: '#f0f0f5' }}>{p.name}</p>
                      <p className="text-xs truncate" style={{ color: '#6b7280' }}>{p.desc}</p>
                    </div>
                    <ExternalLink
                      className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#818cf8' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-center pb-1" style={{ color: '#4a4d62' }}>
            Links open each platform&apos;s search. Prices and availability vary.
          </p>
        </div>
      </div>
    </div>
  );
}
