# CLAUDE.md — Folio Codebase Guide

This file is the authoritative reference for working on this codebase. Read it fully before making changes. It covers architecture, conventions, gotchas, and everything needed to work without asking follow-up questions.

---

## Project Overview

A full-stack, AI-powered book recommendation platform. Users can:
- Track reading history (Want to Read / Currently Reading / Finished)
- Get AI-powered book recommendations (by author, genre, mood, or history)
- Browse a curated Top 50 trending list (updated daily)
- Search for books by title, author, or ISBN
- Write star-rated reviews on finished books
- Explore a dashboard with rotating session content (quotes, words, facts, trivia, moods)

**Deployed:** Frontend on Vercel, backend on Railway.

---

## Repository Layout

```
folio/
├── frontend/                         # Next.js 14 (App Router)
│   ├── app/
│   │   ├── page.js                   # Public landing page
│   │   ├── login/page.js             # Login form
│   │   ├── register/page.js          # Register form
│   │   └── (app)/                    # Authenticated route group
│   │       ├── layout.js             # Shared layout — renders <Navbar>
│   │       ├── dashboard/
│   │       │   ├── page.js           # Main dashboard (most complex page)
│   │       │   └── dailyContent.js   # Static data pools: QUOTES, WORDS, DID_YOU_KNOW, TRIVIA
│   │       ├── recommendations/page.js
│   │       ├── library/page.js
│   │       ├── trending/page.js
│   │       └── search/page.js
│   ├── components/
│   │   ├── Navbar.jsx                # Top nav bar (fixed, z-40)
│   │   ├── BookCard.jsx              # Reusable book card
│   │   └── HorizontalBookScroll.jsx  # Horizontal scroll strip for book covers
│   ├── context/
│   │   └── AuthContext.jsx           # React context: user, login, logout, register
│   └── lib/
│       ├── api.js                    # All API calls via axios (auth, books, library, recs, trending)
│       └── auth.js                   # JWT token helpers (cookie-based, 7-day expiry)
│
└── backend/                          # Node.js + Express
    ├── prisma/
    │   └── schema.prisma             # Prisma schema: User, Book, LibraryEntry, Review
    └── src/
        ├── index.js                  # Express app entry — CORS, rate-limiter, routes
        ├── middleware/
        │   └── auth.js               # JWT verification middleware
        └── routes/
            ├── auth.js               # POST /register, POST /login, GET /me
            ├── books.js              # GET /search, GET /:id (Open Library + Google Books)
            ├── library.js            # Full CRUD for library entries + reviews
            ├── recommendations.js    # AI-style recommendations via Open Library APIs
            └── trending.js           # Curated top-50 list, enriched from OL, cached 24h
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL (hosted on Railway) |
| Book Data | Open Library API (primary) + Google Books API (fallback/enrichment) |
| Auth | JWT — `jsonwebtoken` on backend, `js-cookie` on frontend (7-day token) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

> **Note:** The README says "Anthropic Claude API" for recommendations, but the actual implementation in `backend/src/routes/recommendations.js` uses **only Open Library APIs** with regex-based mood mapping — there is no Anthropic API call in the current codebase. Do not add `ANTHROPIC_API_KEY` to code unless explicitly implementing it.

---

## Design System

All visual styling follows a consistent dark theme. Never break these rules.

### Colours (always use inline `style={{}}`, never Tailwind dynamic classes for these)

| Token | Hex | Usage |
|---|---|---|
| Background | `#0f1117` | Page background (`min-h-screen` containers) |
| Card surface | `#1a1d27` | All cards, panels, input backgrounds |
| Border | `#2a2d3e` | Default card/section borders |
| Primary text | `#f0f0f5` | Headings, important labels |
| Secondary text | `#8b8fa8` | Subtitles, nav links (inactive) |
| Muted text | `#4a4d62` | Placeholders, footer, timestamps |
| Mid text | `#6b7280` | Author names, secondary metadata |
| Indigo primary | `#6366f1` | Logo bg, CTA buttons, active indicators |
| Indigo text | `#818cf8` | Active nav links, icon colours, accent text |
| Indigo border | `rgba(99,102,241,0.3)` | Quote card borders, accented borders |
| Indigo hover bg | `#1a1d27` | Nav link hover |
| Indigo button shadow | `rgba(99,102,241,0.35)` | Primary button box-shadow |
| Green accent | `#4ade80` | Library icon on landing |
| Amber accent | `#fbbf24` / `#f59e0b` | Trending icon, rank badges |
| Card hover | `hover:border-indigo-500/40` | Tailwind utility for card hover border |

**Critical gotcha:** Tailwind's JIT purger removes dynamically-constructed class names at build time (e.g. `bg-[#1a1d27]` used inside a template literal). Always use `style={{ backgroundColor: '#1a1d27' }}` for hex values. Static Tailwind utilities (`rounded-xl`, `flex`, `gap-4`, etc.) are fine.

### Typography

- Font: system default (no custom font configured)
- Headings: `font-bold tracking-tight` + `style={{ color: '#f0f0f5' }}`
- Body: `text-sm leading-relaxed` + `style={{ color: '#8b8fa8' }}`
- Labels/caps: `text-xs font-semibold uppercase tracking-wider`
- Clamp text: `line-clamp-2` (Tailwind) or `-webkit-box` + `WebkitLineClamp` (inline) for overflow

### Spacing

- Page padding: `px-6 py-8` or `px-4 py-6` depending on context
- Section gaps in sidebar: `space-y-8` (was `space-y-4`/`space-y-6` — don't reduce)
- Section gaps in main content: `space-y-8`
- Card padding: `p-5` (default) or `px-4 py-3` (compact)
- Gap between header area and main grid: `mb-12`

### Icons (lucide-react)

Always imported from `lucide-react`. Standard icon size is `w-4 h-4` (inline) or `w-5 h-5` (section headers). Icon containers use:
```jsx
<div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
  style={{ backgroundColor: '#6366f1' }}>
  <BookOpen className="w-4 h-4 text-white" />
</div>
```
For sidebar widget headers, icons are bare (no container) at `w-4 h-4` with a colour via `style={{ color: '#818cf8' }}`.

### Borders and Dividers

- Sidebar divider: `lg:border-l lg:pl-6` on the sidebar column wrapper
- The sidebar `border-l` MUST extend to the bottom of the page. This requires:
  - Page container: `min-h-screen flex flex-col`
  - Inner content wrapper: `flex-1 flex flex-col`
  - The grid: `flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8`
  - This flex chain forces the grid (and thus the sidebar border) to fill the viewport height.

---

## Frontend Architecture

### Next.js App Router

- `app/page.js` = public landing page
- `app/(app)/` = authenticated route group; `layout.js` wraps everything in `<Navbar>` and the `<AuthProvider>`
- Auth guard: dashboard + all `(app)` routes check `useAuth()` → if not authenticated, redirect to `/`
- All pages use `'use client'` directive (no server components in this project)

### Auth Flow

1. On app load, `AuthContext.jsx` checks `isLoggedIn()` (from `lib/auth.js`) — validates JWT cookie, checks `exp` claim
2. If valid, calls `GET /api/auth/me` to hydrate `user` state
3. `login()` / `register()` call the backend, then `setToken()` (stores in a `js-cookie` cookie named `token`, 7-day expiry)
4. `logout()` calls `removeToken()` + resets `user` state + `router.push('/')`
5. All authenticated API calls get `Authorization: Bearer <token>` injected by the axios interceptor in `lib/api.js`

**Token storage:** `js-cookie` (NOT localStorage). The cookie is named `token`, 7-day expiry, `sameSite: 'lax'`.

### API Layer (`frontend/lib/api.js`)

Single axios instance pointing at `NEXT_PUBLIC_API_URL`. Exports:
- `auth` — `login`, `register`, `getMe`
- `books` — `searchBooks(query)`, `getBook(googleBooksId)`
- `library` — `getLibrary`, `addToLibrary`, `updateLibraryEntry`, `removeFromLibrary`, `saveReview`, `getReview`
- `recommendations` — `getRecommendations(mode, input, limit)`
- `trending` — `getTrending()`

All functions return the `.data` from the response. Error handling in the interceptor extracts `error.response.data.error` → throws a new `Error(message)`.

---

## Dashboard Page (`app/(app)/dashboard/page.js`)

The most complex page. Key structure:

### Session-Rotating Content

Every piece of rotating content uses `sessionStorage`. Once picked per session, it stays fixed until the tab/browser is closed. Keys:

| sessionStorage key | Content | Pool size |
|---|---|---|
| `folio_mood_indices` | 6 mood indices (JSON array) | 30 moods |
| `folio_quote` | Index into QUOTES | 50 |
| `folio_word` | Index into WORDS | 50 |
| `folio_dyk` | Index into DID_YOU_KNOW | 50 |
| `folio_trivia` | Index into TRIVIA | 50 |

Picker helper:
```js
function pickOne(pool, key) {
  try {
    const idx = sessionStorage.getItem(key);
    if (idx !== null) return pool[parseInt(idx, 10)] ?? pool[0];
  } catch {}
  const picked = Math.floor(Math.random() * pool.length);
  try { sessionStorage.setItem(key, String(picked)); } catch {}
  return pool[picked];
}
```

Mood picker uses Fisher-Yates on the 30-item MOOD_POOL and stores a JSON array of 6 indices.

### Layout Structure

```
Page (min-h-screen flex flex-col, pt-16 for navbar)
└── Main container (flex-1 flex flex-col, max-w-7xl, px-6 py-8)
    ├── Header row (flex flex-col lg:flex-row gap-6 mb-12)
    │   ├── Left: greeting, date, reading stats bar
    │   └── Right: Quote + Word cards side-by-side (hidden lg:flex, width:520px, height:130px)
    └── Main grid (flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8)
        ├── Left col (lg:col-span-2 space-y-8)
        │   ├── Currently Reading strip
        │   ├── Recommended For You
        │   └── Browse by Mood (6 chips)
        └── Right sidebar (lg:border-l lg:pl-6)
            └── Inner div (space-y-8)
                ├── Reading Goal (persisted in localStorage)
                ├── Up Next (top wishlist books)
                ├── Book Trivia (compact card)
                ├── Did You Know
                └── Quick Actions (2×2 icon grid)
```

### Quote / Word Card Height

These are fixed at `height: '130px'` (hardcoded px) on their container. The cards inside use `h-full overflow-hidden flex flex-col`. Text uses `-webkit-box` line-clamp to prevent overflow. **Do not change this to CSS-only approaches** — previous attempts with `self-stretch`, `min-h`, and percentage heights all failed. The only reliable solution was hardcoded px + explicit overflow clamp.

### Reading Goal

Persisted in `localStorage` under key `folio_reading_goal` (year target) and `folio_reading_goal_year`. It counts FINISHED books from the current calendar year.

### Data Loading

On mount, the dashboard fetches:
1. `GET /api/library` → parses into `reading` (READING status), `finished` (FINISHED), `wishlist` (WISHLIST)
2. `POST /api/recommendations` with `mode: 'history'` → "Recommended For You" (fails gracefully if no finished books)

---

## `dailyContent.js` Data Pools

Location: `frontend/app/(app)/dashboard/dailyContent.js`

Exports four arrays:
- **`QUOTES`** — 50 items: `{ text: string, author: string }`
- **`WORDS`** — 50 items: `{ word, type, definition, example }` (type = POS like "noun", "verb")
- **`DID_YOU_KNOW`** — 50 items: `{ fact: string }`
- **`TRIVIA`** — 50 items: `{ q: string, a: string, detail: string }`

To add more items to any pool: just append to the array. The picker uses `Math.random() * pool.length` so new entries will be reachable immediately.

---

## Backend Architecture

### Express Server (`backend/src/index.js`)

- `trust proxy 1` — required for Railway's reverse proxy
- CORS allows: `process.env.FRONTEND_URL`, `http://localhost:3000`, `http://localhost:3001`
- Rate limit: 100 requests per 15 minutes per IP (`express-rate-limit`)
- Body parser: `express.json()` + `express.urlencoded({ extended: true })`
- Health check: `GET /health` → `{ status: 'ok', timestamp }`
- Default port: `8080`

### Auth Middleware (`backend/src/middleware/auth.js`)

Verifies `Authorization: Bearer <token>` header using `jsonwebtoken`. Attaches decoded user to `req.user`. All routes in `library.js` and `recommendations.js` use this middleware globally via `router.use(authMiddleware)`.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/register` | `{ email, password, name }` | `{ token, user }` |
| POST | `/login` | `{ email, password }` | `{ token, user }` |
| GET | `/me` | — (auth header) | `{ user }` |

- JWT tokens expire in 7 days
- Passwords hashed with `bcryptjs` (10 rounds)
- Validation via `express-validator`

### Books — `/api/books`

| Method | Path | Query/Params | Response |
|---|---|---|---|
| GET | `/search` | `?q=query` | `{ books[], total }` |
| GET | `/:googleBooksId` | path param | `{ book }` |

- Search uses Open Library `/search.json` (no auth required)
- Detail: if ID starts with `OL_`, fetches from Open Library works API; otherwise falls back to Google Books API
- Book detail is upserted to the local DB (non-fatal if this fails)
- Google Books API key is optional (`GOOGLE_BOOKS_API_KEY` env var); falls back gracefully

### Library — `/api/library` (all routes require auth)

| Method | Path | Body/Params | Response |
|---|---|---|---|
| GET | `/` | — | `{ entries[] }` (includes `book`) |
| POST | `/` | book data object + `status` | `{ entry }` |
| PATCH | `/:entryId` | `{ status }` | `{ entry }` |
| DELETE | `/:entryId` | — | `{ message }` |
| POST | `/:entryId/review` | `{ content, rating }` | `{ review }` |
| GET | `/:entryId/review` | — | `{ review }` |

- Statuses (enum): `WISHLIST`, `READING`, `FINISHED`
- `startedAt` is set when status first changes to `READING`; `finishedAt` when first changed to `FINISHED`
- Review upsert — one review per user per book (unique constraint `[userId, bookId]`)
- `409` returned if book already in library

### Recommendations — `/api/recommendations` (requires auth)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/` | `{ mode, input, limit }` | `{ recommendations[], mode, input }` |

Modes: `author`, `genre`, `mood`, `history`

- `limit` is capped at 20
- `history` mode: reads user's FINISHED library entries from DB; requires at least one finished book
- Recommendations come from Open Library, NOT Anthropic (despite README and naming)

### Trending — `/api/trending` (public, no auth)

| Method | Path | Response |
|---|---|---|
| GET | `/` | `{ books[], cached: bool }` |

- 80+ curated books in `TRENDING_BOOKS` array in the route file
- Daily selection: top 10 always shown + 40 randomly chosen from the rest (seeded by day)
- Each book enriched with Open Library metadata (cover, rating, genres) on first load
- Cached in memory for 24 hours; stale cache served on OL errors
- This is the only unauthenticated route (used by the landing page preview)

---

## Database Schema (Prisma)

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  name          String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  libraryEntries LibraryEntry[]
  reviews       Review[]
}

model Book {
  id            String         @id @default(cuid())
  googleBooksId String?        @unique   // "OL_<workId>" for OL books
  title         String
  author        String
  coverUrl      String?
  description   String?
  genres        String[]       // PostgreSQL array
  publishedDate String?
  averageRating Float?
  pageCount     Int?
  isbn          String?
  buyLink       String?
  createdAt     DateTime       @default(now())
}

enum LibraryStatus { WISHLIST  READING  FINISHED }

model LibraryEntry {
  id         String        @id @default(cuid())
  userId     String
  bookId     String
  status     LibraryStatus @default(WISHLIST)
  addedAt    DateTime      @default(now())
  startedAt  DateTime?
  finishedAt DateTime?
  @@unique([userId, bookId])
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  bookId    String
  content   String
  rating    Int      // 1–5
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([userId, bookId])
}
```

To push schema changes: `npx prisma db push` from the `backend/` directory.
To regenerate the client: `npx prisma generate`.

---

## Recommendation Engine Details

Source: `backend/src/routes/recommendations.js`

### Mode: Author

1. Fetch up to 5 of the author's own top-rated books from OL; keep 3 max
2. Call `getAuthorTopSubjects()` — fetches all subjects from 25 of the author's books, frequency-ranks them, filters with `SUBJECT_NOISE` regex (removes noise like "large print", "internet archive"), also skips single-word proper nouns
3. Search 4 of those subjects via `olSubjectSearch()`, filtering out books by the same author (by full name + last name)
4. Return ~3 own books + ~7 similar-author books

### Mode: Genre

Runs `olSubjectSearch()` (dedicated subject endpoint) and `olSearch()` with `subject:` prefix in parallel, merges, dedupes.

### Mode: Mood

Maps free-text mood to Open Library subjects using `MOOD_MAP` (20 regex patterns → subject arrays). Falls back to extracting nouns from the mood text + "popular fiction" if nothing matches. Fetches from those subjects.

### Mode: History

1. Fetches user's FINISHED entries (last 20) from DB including reviews
2. Weights authors by review rating: ≥4 stars → 3x, 3 stars → 1x, ≤2 or no review → excluded
3. Picks top 3 weighted authors, top 4 genres
4. Gets subjects for each author via `getAuthorTopSubjects()`
5. Fetches books from those subjects, excludes already-read titles

### Deduplication

`dedupeBooks()` deduplicates by lowercased title. It also accepts an `excludeTitles` set.

### OL Helpers

- `olSearch(query, limit, sort)` — free-text search, filters to books with covers
- `olSubjectSearch(subject, limit)` — uses `/subjects/<slug>.json` (higher quality, curated)
- `mapWorkToBook(work, reason)` — normalises an OL work object to the app's book format
  - `googleBooksId` field is set to `OL_<workKey>` for Open Library books

---

## Trending System Details

Source: `backend/src/routes/trending.js`

- `TRENDING_BOOKS` array has 80 books with `{ title, author, genres[], rank }`
- `getDailySelection()`: always includes ranks 1–10; from the rest, picks 40 using a seeded LCG shuffle keyed to the current UTC day (so the list changes daily but is consistent within a day)
- `enrichBook()`: calls OL search for each book to add coverUrl, ratings, pageCount, genres
- Enrichment loops with 200ms pause every 10 books to avoid hitting OL rate limits
- Result is cached in a module-level `{ data, timestamp }` object (24h TTL)
- Stale cache is served if OL is down; bare metadata (no covers) served if no cache exists

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (use a long random string) |
| `PORT` | No | Server port (default: `8080`) |
| `FRONTEND_URL` | Yes (prod) | Frontend origin for CORS (e.g. `https://your-app.vercel.app`) |
| `GOOGLE_BOOKS_API_KEY` | No | Optional; OL is used as primary source anyway |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (e.g. `https://your-app.railway.app`) |

---

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env  # fill in DATABASE_URL and JWT_SECRET
npx prisma db push
npm run dev           # runs on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
# create .env.local with: NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev           # runs on http://localhost:3000
```

---

## Deployment

### Railway (backend)

1. New Railway project → add PostgreSQL plugin
2. Connect GitHub repo, set root directory to `backend/`
3. Add env vars: `DATABASE_URL` (Railway provides this automatically via the plugin), `JWT_SECRET`, `FRONTEND_URL`
4. Auto-deploys on push to `main`
5. `trust proxy 1` is already set in `index.js` — required for correct IP detection behind Railway's proxy

### Vercel (frontend)

1. Import repo on Vercel, set root directory to `frontend/`
2. Add env var: `NEXT_PUBLIC_API_URL` pointing to the Railway backend URL
3. Auto-deploys on push to `main`

---

## Key Gotchas and Pitfalls

### 1. Tailwind Dynamic Class Purging
Never construct Tailwind class names with template literals or dynamic values at runtime. The JIT compiler only includes classes it can statically detect. Use `style={{}}` for all dynamic hex colours.

```jsx
// BAD — purged at build time
<div className={`bg-[${color}] text-[${textColor}]`}>

// GOOD
<div style={{ backgroundColor: color, color: textColor }}>
```

### 2. Icon Container Opacity
Lucide icon containers that use `rgba()` backgrounds must be set via `style={{}}`, not via Tailwind's `bg-indigo-500/20` (which can produce slightly different rendering in some builds).

### 3. `border-l` Not Reaching Page Bottom
If the sidebar vertical divider line stops before the page bottom, it means the parent grid isn't filling the viewport. The fix is the flex chain: `flex flex-col` on page → `flex-1 flex flex-col` on main wrapper → `flex-1 grid` on the content grid. Do NOT use `min-h-screen` on the grid alone.

### 4. `next/image` with External URLs
All book cover images come from Open Library (`covers.openlibrary.org`). The `<Image>` component needs `unoptimized` prop or the domain must be in `next.config.js`. Current usage: `<Image ... unoptimized />`.

### 5. OL Books Use `OL_` Prefix
Book IDs from Open Library are stored as `OL_<workKey>` (e.g. `OL_OL82537W`). The `/api/books/:googleBooksId` route checks `googleBooksId.startsWith('OL_')` to route to the correct data source. Don't strip this prefix.

### 6. Review Unique Constraint
Reviews have a `@@unique([userId, bookId])` constraint — one review per user per book. The route uses `upsert` so updating a review overwrites the old one silently.

### 7. Recommendation Errors When No Finished Books
`history` mode returns a `400` with a human-readable error message when the user has no finished books. The dashboard handles this gracefully (shows empty state, not an error). Don't change this to a 404.

### 8. `sessionStorage` vs `localStorage`
- **`sessionStorage`**: rotating per-session content (moods, quote, word, did-you-know, trivia) — cleared on tab close/new session
- **`localStorage`**: reading goal and year (persists across sessions)
Both are wrapped in try/catch because SSR environments and private browsing can throw on access.

### 9. Prisma on Railway
`DATABASE_URL` is provided by Railway's PostgreSQL plugin as an environment variable. Always run `npx prisma db push` after schema changes (not `migrate` — this project uses `db push` for simplicity).

### 10. CORS on Railway
`FRONTEND_URL` env var must be set on Railway to the exact Vercel origin (including `https://`, no trailing slash). Railway's proxy means `trust proxy 1` must be set — it already is in `index.js`.

### 11. Trending Cache Is In-Memory
The trending cache lives in module scope in `trending.js`. On Railway, if the server restarts, the cache is cleared and OL is queried again. This is intentional — no Redis needed.

### 12. Quote/Word Card Height
The header Quote + Word cards are hardcoded at `height: '130px'` on their container. Do not attempt to make this dynamic via CSS alone — it was tested extensively and CSS-only approaches (flex stretch, percentage heights, auto) all resulted in the cards being taller than the left column. The `130px` value was manually tuned to match the typical height of the greeting + stats section on the left.

---

## Component Patterns

### BookCard (`components/BookCard.jsx`)
Used on recommendations, search, trending pages. Props: `book`, `onAddToLibrary`, `libraryStatus`. Shows cover, title, author, genres, rating.

### HorizontalBookScroll (`components/HorizontalBookScroll.jsx`)
Used on dashboard's "Currently Reading" and "Recommended For You" strips. Horizontal scroll with `scrollbarWidth: 'none'` to hide the scrollbar.

### Navbar (`components/Navbar.jsx`)
Fixed top bar (`h-16`, `z-40`). 5 nav links with active indicator (bottom border + colour change). Shows user initial avatar + "Sign Out" button. Uses `usePathname()` for active state.

Nav links order: Dashboard → Discover → Library → Trending → Search

### Auth-gated Pages
All `(app)/` pages follow this pattern:
```jsx
const { user, loading } = useAuth();
useEffect(() => {
  if (!loading && !user) router.replace('/');
}, [user, loading]);
if (loading || !user) return <spinner>;
```

---

## Styling Conventions Summary

1. **Static layout classes** (flex, grid, gap, padding, rounded, etc.) → Tailwind utilities
2. **Colours, opacity-based colours, dynamic values** → `style={{ ... }}` inline
3. **Hover states** → Tailwind `hover:` utilities only for safe static values (e.g. `hover:bg-[#1a1d27]` — note: this specific literal is safe since it's not dynamic)
4. **Text overflow** → `line-clamp-2` (Tailwind) for simple cases; `-webkit-box` + `WebkitLineClamp` inline for cases where you also need `overflow-hidden` with flex
5. **Transitions** → `transition-all` Tailwind utility
6. **Borders** → `border` + `style={{ borderColor: '...' }}` — never `border-[#hex]` with dynamic values
