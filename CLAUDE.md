# CLAUDE.md — Folio Codebase Guide

This file is the authoritative reference for working on this codebase. Read it fully before making changes. It covers architecture, conventions, gotchas, and everything needed to work without asking follow-up questions.

---

## Project Overview

Folio is a full-stack book tracking and recommendation platform. Users can:
- Track a personal library with statuses: Wishlist / Currently Reading / Finished / Did Not Finish
- Get recommendations by author, genre, mood, or reading history
- Browse a curated Top 50 trending list (updated daily via seeded shuffle)
- Search for books by title, author, or ISBN
- Write star-rated reviews and private notes
- Explore community reviews and reader leaderboards
- View public reader profiles
- Track reading stats, goals, and streaks

**Deployed:** Frontend on Vercel, backend on Railway.

---

## Repository Layout

```
folio/
├── frontend/                              # Next.js 14 (App Router)
│   ├── app/
│   │   ├── page.js                        # Public landing page
│   │   ├── (auth)/                        # Public auth pages (no Navbar)
│   │   │   ├── login/page.js
│   │   │   ├── register/page.js
│   │   │   ├── forgot-password/page.js
│   │   │   └── reset-password/page.js
│   │   └── (app)/                         # Authenticated route group
│   │       ├── layout.js                  # Shared layout — renders <Navbar>
│   │       ├── dashboard/
│   │       │   ├── page.js                # Main dashboard (most complex page)
│   │       │   └── dailyContent.js        # Static data pools: QUOTES, WORDS, DID_YOU_KNOW, TRIVIA
│   │       ├── recommendations/page.js    # 4-mode recommendation engine
│   │       ├── library/page.js            # Full library management
│   │       ├── book/[googleBooksId]/      # Book detail page
│   │       │   └── page.js
│   │       ├── stats/page.js              # Reading statistics + charts
│   │       ├── trending/page.js           # Top 50 trending books
│   │       ├── search/page.js             # Book search
│   │       ├── community/page.js          # Reviews feed + leaderboard
│   │       ├── profile/page.js            # User profile + genre preferences
│   │       └── readers/[userId]/page.js   # Public reader profile
│   ├── components/
│   │   ├── Navbar.jsx                     # Top nav bar (fixed, z-40, h-16)
│   │   ├── NavbarWrapper.jsx              # Client wrapper for Navbar in root layout
│   │   ├── BookCard.jsx                   # Reusable book card (cover, title, author, add button)
│   │   ├── HorizontalBookScroll.jsx       # Horizontal scroll strip for book covers
│   │   ├── OnboardingWizard.jsx           # 3-step wizard: genres → book → reading goal
│   │   ├── GettingStartedChecklist.jsx    # Milestone checklist (collapsible)
│   │   ├── PageHint.jsx                   # Dismissible contextual tip (lightbulb icon)
│   │   ├── ReviewModal.jsx                # Write/edit review with star rating
│   │   ├── ReviewViewModal.jsx            # Read-only review display
│   │   ├── BookSourcesModal.jsx           # "Where to buy" links
│   │   └── LoadingSpinner.jsx             # Full-page loading spinner
│   ├── context/
│   │   ├── AuthContext.jsx                # React context: user, login, logout, register
│   │   └── ToastContext.jsx               # Toast notification context
│   └── lib/
│       ├── api.js                         # All API calls via axios
│       ├── auth.js                        # JWT token helpers (localStorage-based)
│       └── recentlyViewed.js              # Recently viewed books helper (localStorage)
│
└── backend/                               # Node.js + Express
    ├── prisma/
    │   └── schema.prisma                  # Prisma schema
    └── src/
        ├── index.js                       # Express app entry — CORS, rate-limiter, routes
        ├── middleware/
        │   └── auth.js                    # JWT verification middleware
        └── routes/
            ├── auth.js                    # Auth endpoints (register, login, password, account)
            ├── books.js                   # Book search + detail (OL + Google Books)
            ├── library.js                 # Library CRUD + reviews
            ├── recommendations.js         # Recommendation engine (4 modes via Open Library)
            ├── trending.js                # Curated top-50, enriched from OL, cached 24h
            └── community.js              # Community reviews + leaderboard + public profiles
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

> **Important:** Recommendations use **only Open Library APIs** — there is no Anthropic/Claude API call anywhere in the codebase. Do not add `ANTHROPIC_API_KEY` unless explicitly implementing it.

---

## Design System

All visual styling follows a consistent dark theme. Never break these rules.

### Colours (always use inline `style={{}}`, never Tailwind dynamic classes for these)

| Token | Hex | Usage |
|---|---|---|
| Background | `#0f1117` | Page background (`min-h-screen` containers) |
| Card surface | `#1a1d27` | All cards, panels, modal backgrounds |
| Border | `#2a2d3e` | Default card/section borders |
| Primary text | `#f0f0f5` | Headings, important labels |
| Secondary text | `#8b8fa8` | Subtitles, nav links (inactive) |
| Muted text | `#4a4d62` | Placeholders, footer, timestamps |
| Mid text | `#6b7280` | Author names, secondary metadata |
| Indigo primary | `#6366f1` | Logo bg, CTA buttons, active indicators |
| Indigo text | `#818cf8` | Active nav links, icon colours, accent text |
| Indigo border | `rgba(99,102,241,0.3)` | Quote card borders, accented borders |
| Indigo button shadow | `rgba(99,102,241,0.35)` | Primary button box-shadow |
| Green accent | `#4ade80` | Success states, library icon on landing |
| Amber accent | `#fbbf24` / `#f59e0b` | Trending icon, rank badges |
| Card hover | `hover:border-indigo-500/40` | Tailwind utility for card hover border |

**Critical gotcha:** Tailwind's JIT purger removes dynamically-constructed class names at build time. Always use `style={{ backgroundColor: '#1a1d27' }}` for hex values. Static Tailwind utilities (`rounded-xl`, `flex`, `gap-4`, etc.) are fine.

### Typography

- Font: system default (no custom font configured)
- Headings: `font-bold tracking-tight` + `style={{ color: '#f0f0f5' }}`
- Body: `text-sm leading-relaxed` + `style={{ color: '#8b8fa8' }}`
- Labels/caps: `text-xs font-semibold uppercase tracking-wider`
- Clamp text: `line-clamp-2` (Tailwind) or `-webkit-box` + `WebkitLineClamp` (inline) for overflow

### Spacing

- Page padding: `px-6 py-8` or `px-4 py-6` depending on context
- Section gaps: `space-y-8` in both sidebar and main content
- Card padding: `p-5` (default) or `px-4 py-3` (compact)
- Gap between header area and main grid: `mb-12`

### Icons (lucide-react)

Always imported from `lucide-react`. Standard sizes: `w-4 h-4` (inline) or `w-5 h-5` (section headers). Icon containers:
```jsx
<div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
  style={{ backgroundColor: '#6366f1' }}>
  <BookOpen className="w-4 h-4 text-white" />
</div>
```
For bare sidebar/widget icons: `w-4 h-4` with `style={{ color: '#818cf8' }}`.

### Sidebar Border Chain

For the sidebar `border-l` to reach the page bottom, a flex chain is required:
- Page container: `min-h-screen flex flex-col`
- Inner wrapper: `flex-1 flex flex-col`
- Content grid: `flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8`

Do NOT use `min-h-screen` on the grid alone — the border will stop short.

---

## Frontend Architecture

### Next.js App Router

- `app/page.js` — public landing page (unauthenticated)
- `app/(auth)/` — login/register/password reset pages, no Navbar
- `app/(app)/` — authenticated route group; `layout.js` wraps everything in `<NavbarWrapper>`
- Auth guard in every `(app)/` page: `useAuth()` → if not authenticated → `router.replace('/')`
- All pages use `'use client'` directive (no server components)

### Auth Flow

1. `AuthContext.jsx` on mount: calls `isLoggedIn()` from `lib/auth.js` — reads JWT from localStorage, validates `exp` claim
2. If valid, calls `GET /api/auth/me` to hydrate `user` state
3. `login()` / `register()` call backend, then `setToken()` — stores JWT in `localStorage` key `token` (7-day expiry handled by the JWT itself)
4. `logout()` calls `removeToken()` + resets `user` state + `router.push('/')`
5. All authenticated API calls get `Authorization: Bearer <token>` from the axios request interceptor in `lib/api.js`

### API Layer (`frontend/lib/api.js`)

Single axios instance pointing at `NEXT_PUBLIC_API_URL`. Request interceptor attaches Bearer token. Response interceptor: handles 429 rate limit with a friendly message; extracts `error.response.data.error` and throws as `new Error(message)`.

**Exported API namespaces:**

```js
auth.{
  login(email, password),
  register(email, password, name),
  getMe(),
  forgotPassword(email),
  resetPassword(token, password),
  changePassword(currentPassword, newPassword),
  deleteAccount()
}

books.{
  searchBooks(query),
  getBook(googleBooksId)
}

library.{
  getLibrary(),
  getStats(),
  addToLibrary(bookData),         // bookData includes status
  updateLibraryEntry(id, data),   // data: { status?, currentPage?, notes? }
  removeFromLibrary(id),
  saveReview(entryId, { content, rating }),
  getReview(entryId)
}

recommendations.{
  getRecommendations(mode, input, limit)
}

trending.{
  getTrending()
}

community.{
  getReviews(),
  getProfiles(),
  getUserProfile(userId)
}
```

---

## Storage Keys

All keys use the `folio_` prefix. Wrap every access in `try/catch` — SSR and private browsing can throw.

### localStorage (persists across sessions)

| Key | Type | Description |
|---|---|---|
| `folio_reading_goal` | `{year, target}` | Annual reading goal set by user |
| `folio_genre_prefs` | `string[]` | Saved genre preferences from onboarding/profile |
| `folio_show_wizard` | `"1"` | If present, show onboarding wizard on next dashboard load |
| `folio_checklist_dismissed` | `"1"` | If present, hide the getting-started checklist |
| `folio_first_finish_seen` | `"1"` | If present, first-finish celebration already shown |
| `folio_first_review_done` | `"1"` | If present, first-review milestone already triggered |
| `folio_got_recommendation` | `"1"` | If present, recommendation milestone already triggered |
| `folio_hints_seen` | `string[]` | Page keys where the PageHint has been dismissed |
| `folio_recently_viewed` | `{googleBooksId, title, author, coverUrl}[]` | Last 10 viewed books (max) |

### sessionStorage (cleared on tab close / new session)

| Key | Type | Description |
|---|---|---|
| `folio_mood_chips` | JSON | Session mood chips (6 picked from 30-item MOOD_POOL) |
| `folio_quote` | `string` | Index into QUOTES pool (0–49) |
| `folio_word` | `string` | Index into WORDS pool (0–49) |
| `folio_dyk` | `string` | Index into DID_YOU_KNOW pool (0–49) |
| `folio_trivia` | `string` | Index into TRIVIA pool (0–49) |

---

## Pages Reference

### Dashboard (`/dashboard`)

Most complex page. Fetches on mount:
1. `GET /api/library` → parses into `reading` (READING), `finished` (FINISHED), `wishlist` (WISHLIST)
2. `POST /api/recommendations { mode: 'history' }` → "Recommended For You" strip (fails silently if no finished books)

**Layout:**
```
Page (min-h-screen flex flex-col, pt-16 for navbar)
└── Main container (flex-1 flex flex-col, max-w-7xl, px-6 py-8)
    ├── Header row (flex flex-col lg:flex-row gap-6 mb-12)
    │   ├── Left: greeting, date, reading stats bar (Finished/Reading/Wishlist/DNF)
    │   └── Right: Quote + Word cards side-by-side (hidden lg:flex, width:520px, height:130px)
    └── Main grid (flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8)
        ├── Left col (lg:col-span-2 space-y-8)
        │   ├── Currently Reading strip (HorizontalBookScroll)
        │   ├── Recommended For You (HorizontalBookScroll)
        │   ├── Browse by Mood (6 chips, session-shuffled)
        │   └── Recently Viewed (horizontal scroll)
        └── Right sidebar (lg:border-l lg:pl-6, space-y-8)
            ├── Reading Goal (progress bar, persisted in localStorage)
            ├── Reading Streak (consecutive months)
            ├── Up Next (top wishlist books)
            ├── Book Trivia (Q&A reveal card)
            ├── Did You Know (fact card)
            └── Quick Actions (2×2 icon grid)
```

**Quote/Word card height:** hardcoded `height: '130px'` on the container. Do NOT change to CSS-only — tested extensively; only reliable fix is the hardcoded px value + `-webkit-box` line clamp inside.

**Session content picker:**
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

### Library (`/library`)

Table view with columns: cover, title, author, status dropdown, reading progress bar (READING only), date added, review badge, actions (notes, remove). Filter bar with status pills + search input. Sort by title/author/status/date.

**Goodreads import:** parses CSV, maps Goodreads shelf names to `WISHLIST`/`READING`/`FINISHED`/`DNF`, calls `addToLibrary` for each row.

**CSV export** (15 columns):
```
Title, Author, Status, Rating, Review, Notes, Date Added, Date Started,
Date Finished, Current Page, Pages, Published Year, ISBN, OL Rating, Genres
```

### Recommendations (`/recommendations`)

4 tabs: Author / Genre / Mood / Reading History. Shows 10 results in a responsive grid. Genre tab shows saved `folio_genre_prefs` as quick-select chips above the dropdown. Results include "Taste Match" badge when the book's genres overlap with saved preferences.

### Book Detail (`/book/[googleBooksId]`)

Fetches `GET /api/books/:googleBooksId`. Shows full cover (2/3 aspect), title, author, rating, genre pills, description, metadata. Library status badge + progress. Add/update library action. Write/view review for finished books. "More by [Author]" section (5 books from OL).

### Stats (`/stats`)

Fetches `GET /api/library/stats`. Summary stat cards + charts:
- Monthly bar chart (year picker)
- Top genres bar chart
- Rating distribution (1–5 stars)
- Top 5 authors list
- Recently finished books list (5)

### Community (`/community`)

Two-column layout:
- **Left:** 40 most recent reviews from all users (book cover, title, author, stars, clamped review text, reviewer name, date)
- **Right:** Active readers leaderboard (top 25 by books finished; shows avatar initial, name, finished count, review count, avg rating)

### Public Profile (`/readers/[userId]`)

Fetches `GET /api/community/users/:userId`. Shows: avatar initial, name, member-since date, stats grid (finished/reading/wishlist/avg rating), finished books grid, full review cards.

### Profile (`/profile`)

Shows user info + reading stats. Genre preferences grid — clicking genres saves to `folio_genre_prefs` in localStorage and syncs to the Recommendations page. Change password form (inline, expandable).

---

## `dailyContent.js` Data Pools

Location: `frontend/app/(app)/dashboard/dailyContent.js`

Four exported arrays — add items to any pool by appending; the picker uses `Math.random() * pool.length` so new entries are reachable immediately:

- **`QUOTES`** — 50 items: `{ text: string, author: string }`
- **`WORDS`** — 50 items: `{ word, type, definition, example }` (`type` = POS: "noun", "verb", etc.)
- **`DID_YOU_KNOW`** — 50 items: `{ fact: string }`
- **`TRIVIA`** — 50 items: `{ q: string, a: string, detail: string }`

---

## Backend Architecture

### Express Server (`backend/src/index.js`)

- `trust proxy 1` — required for Railway's reverse proxy
- CORS allows: `process.env.FRONTEND_URL`, `http://localhost:3000`, `http://localhost:3001`
- Rate limit: 100 requests per 15 minutes per IP (`express-rate-limit`)
- Body parser: `express.json()` + `express.urlencoded({ extended: true })`
- Health check: `GET /health` → `{ status: 'ok', timestamp }`
- Default port: `8080`

Routes mounted:
```
/api/auth          → auth.js
/api/books         → books.js
/api/library       → library.js
/api/recommendations → recommendations.js
/api/trending      → trending.js
/api/community     → community.js
```

### Auth Middleware (`backend/src/middleware/auth.js`)

Verifies `Authorization: Bearer <token>` using `jsonwebtoken`. Attaches decoded payload to `req.user` (`{ id, email, name }`). Returns `401` on missing/invalid/expired tokens. Applied globally in `library.js`, `recommendations.js`, and selected auth endpoints.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/register` | No | `{ email, password, name }` | `{ token, user }` |
| POST | `/login` | No | `{ email, password }` | `{ token, user }` |
| GET | `/me` | Yes | — | `{ user }` |
| POST | `/forgot-password` | No | `{ email }` | `{ message }` + `devResetUrl` (dev only) |
| POST | `/reset-password` | No | `{ token, password }` | `{ message }` |
| PATCH | `/change-password` | Yes | `{ currentPassword, newPassword }` | `{ message }` |
| DELETE | `/account` | Yes | — | `{ message }` |

- Passwords hashed with `bcryptjs` (10 rounds)
- Validation via `express-validator`
- JWT tokens expire in 7 days
- Password reset tokens stored on User model (`resetToken`, `resetTokenExpiry`)

### Books — `/api/books`

| Method | Path | Query/Params | Response |
|---|---|---|---|
| GET | `/search` | `?q=query` | `{ books[], total }` |
| GET | `/:googleBooksId` | path param | `{ book }` |

- Search uses Open Library `/search.json`
- Detail: ID starting with `OL_` → Open Library works API; otherwise → Google Books API
- Book detail is upserted to the local DB (non-fatal if it fails)
- `GOOGLE_BOOKS_API_KEY` is optional; OL is primary

### Library — `/api/library` (all require auth)

| Method | Path | Body/Params | Response |
|---|---|---|---|
| GET | `/` | — | `{ entries[] }` (each entry includes `book`) |
| GET | `/stats` | — | `{ entries[], reviews[] }` |
| POST | `/` | book object + `status` | `{ entry }` |
| PATCH | `/:entryId` | `{ status?, currentPage?, notes? }` | `{ entry }` |
| DELETE | `/:entryId` | — | `{ message }` |
| POST | `/:entryId/review` | `{ content, rating }` | `{ review }` |
| GET | `/:entryId/review` | — | `{ review }` |

- Statuses: `WISHLIST`, `READING`, `FINISHED`, `DNF`
- `startedAt` is set automatically when status first becomes `READING`
- `finishedAt` is set automatically when status first becomes `FINISHED`
- `409` if book already in library
- Reviews use `upsert` — one review per user per book

### Recommendations — `/api/recommendations` (requires auth)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/` | `{ mode, input, limit }` | `{ recommendations[], mode, input? }` |

- Modes: `author`, `genre`, `mood`, `history`
- `limit` capped at 20; default 10
- `history` mode returns `400` when user has no finished books (dashboard handles gracefully)
- All data from Open Library — no Anthropic API

### Trending — `/api/trending` (public)

| Method | Path | Response |
|---|---|---|
| GET | `/` | `{ books[], cached: bool, stale?: bool }` |

- 80-book curated list in the route file
- Top 10 always shown; 40 more selected by seeded daily LCG shuffle
- OL-enriched on first load (200ms throttle every 10 books)
- In-memory 24h cache

### Community — `/api/community` (public)

| Method | Path | Response |
|---|---|---|
| GET | `/reviews` | `{ reviews[] }` — 40 most recent, with user + book info |
| GET | `/profiles` | `{ profiles[] }` — top 50 by books finished, with stats |
| GET | `/users/:userId` | `{ user, stats, finishedEntries[], reviews[] }` |

---

## Database Schema (Prisma)

```prisma
model User {
  id               String         @id @default(cuid())
  email            String         @unique
  passwordHash     String
  name             String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  resetToken       String?
  resetTokenExpiry DateTime?
  libraryEntries   LibraryEntry[]
  reviews          Review[]
}

model Book {
  id            String         @id @default(cuid())
  googleBooksId String?        @unique   // "OL_<workId>" for Open Library books
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
  libraryEntries LibraryEntry[]
  reviews        Review[]
}

enum LibraryStatus { WISHLIST  READING  FINISHED  DNF }

model LibraryEntry {
  id          String        @id @default(cuid())
  userId      String
  bookId      String
  status      LibraryStatus @default(WISHLIST)
  addedAt     DateTime      @default(now())
  startedAt   DateTime?
  finishedAt  DateTime?
  currentPage Int?
  notes       String?
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  book        Book          @relation(fields: [bookId], references: [id], onDelete: Cascade)
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
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  @@unique([userId, bookId])
}
```

Schema changes: `npx prisma db push` from `backend/`. Never use `prisma migrate` — this project uses `db push`.
Regenerate client: `npx prisma generate`.

---

## Recommendation Engine Details

Source: `backend/src/routes/recommendations.js`

### GENRE_MAP

Maps 44 UI genre names (plus ~15 aliases) to 2–3 proven Open Library subject slugs searched in parallel. Examples:
- `"Fantasy"` → `["fantasy", "epic fantasy", "magic"]`
- `"Children's"` → `["juvenile fiction", "childrens literature", "children"]`
- `"Science Fiction"` → `["science fiction", "space opera", "dystopian fiction"]`
- `"Cozy Mystery"` → `["cozy mysteries", "amateur sleuth", "mystery fiction"]`

Lookup order: exact match → partial match → raw slug fallback.

### Mode: Author

1. Fetch up to 5 of the author's own top-rated books from OL; keep 3 max
2. `getAuthorTopSubjects()` — fetches subjects from 25 of the author's books, frequency-ranks them, filters with `SUBJECT_NOISE` regex (removes "large print", "internet archive", etc.) and single-word proper nouns
3. Search 4 of those subjects via `olSubjectSearch()`, filtering out books by the same author
4. Return ~3 own books + ~7 subject-adjacent books

### Mode: Genre

Calls `getGenreSubjects(genre)` to get 2–3 subject slugs. Runs `olSubjectSearch()` for each in parallel + one `olSearch()` with `subject:` prefix for breadth. Merges, dedupes.

### Mode: Mood

Maps free-text input against `MOOD_MAP` (20 regex patterns → OL subject arrays). If no pattern matches, falls back to `getGenreSubjects()` on extracted nouns, then `"literary fiction"` + `"popular fiction"`.

### Mode: History

1. Fetch last 20 FINISHED entries including reviews
2. Weight authors: ≥4★ → weight 3; 3★ → weight 2; ≤2★ → skip; no review → weight 1
3. Pick top 3 authors and top 4 genres from weighted pool
4. Get subjects per author via `getAuthorTopSubjects()`
5. Fetch books from those subjects, exclude already-read titles

### Quality Filter

`olSearch()` includes a filter: `(d.ratings_count == null || d.ratings_count >= 5)` — books with fewer than 5 ratings are excluded unless unrated entirely.

### OL Helpers

- `olSearch(query, limit, sort)` — free-text search on OL `/search.json`
- `olSubjectSearch(subject, limit)` — curated `/subjects/<slug>.json` endpoint (higher quality)
- `mapWorkToBook(work)` — normalises OL work object to app's book format; sets `googleBooksId` to `OL_<workKey>`
- `dedupeBooks(books, excludeTitles?)` — deduplicates by lowercased title

---

## Trending System Details

Source: `backend/src/routes/trending.js`

- `TRENDING_BOOKS` array: 80 curated books with `{ title, author, genres[], rank }`
- `getDailySelection()`: always includes ranks 1–10; remaining 70 shuffled via seeded LCG (key = UTC day), 40 chosen
- `enrichBook()`: calls OL search for each book to add `coverUrl`, `averageRating`, `pageCount`, `genres`
- Enrichment loops with 200ms pause every 10 books (OL rate limit protection)
- Module-level `{ data, timestamp }` cache; 24h TTL
- On OL failure: serves stale cache; if no cache: returns bare metadata (no covers)

---

## Component Patterns

### `BookCard`
Props: `book`, `onAddToLibrary`, `isInLibrary`, `tasteMatch?`, `libraryStatus?`
Used on: recommendations, search, trending, book detail ("More by" section).
Shows: cover (2/3 aspect), title (line-clamp-2), author, genres, rating, add/added button.

### `HorizontalBookScroll`
Props: `books`, `onAddToLibrary`, `libraryBookIds`
Horizontal scroll strip, `scrollbarWidth: 'none'` to hide scrollbar. Used for Currently Reading and Recommended For You on dashboard.

### `Navbar`
Fixed top bar (`h-16`, `z-40`). Logo (indigo square icon only, no text). 5 nav links: Dashboard → Discover → Library → Trending → Search. Active state: indigo text + bottom border. User avatar (initial circle) + Sign Out.

### `NavbarWrapper`
Client component that wraps `<Navbar>` to allow usage in the server-rendered root layout. Required because Navbar uses `usePathname()`.

### `OnboardingWizard`
Props: `onComplete`
3-step modal wizard: (0) pick ≥3 genres → saves to `folio_genre_prefs`; (1) search + add a read book → adds to library as FINISHED; (2) set reading goal → saves to `folio_reading_goal`; (3) done screen. Shown when `folio_show_wizard` is in localStorage.

### `GettingStartedChecklist`
Collapsible checklist with 4 milestones. Milestone completion detected by checking localStorage flags (`folio_first_finish_seen`, `folio_first_review_done`, `folio_got_recommendation`, reading goal). Dismissed via `folio_checklist_dismissed`.

### `PageHint`
Props: `pageKey`, `message`
Dismissible lightbulb tip. Dismissed state tracked in `folio_hints_seen` array in localStorage. Each page has a unique `pageKey`.

### `ReviewModal`
Props: `entryId`, `bookTitle`, `onSave`, `onClose`
Star rating (1–5, click to set) + text area. Calls `library.saveReview()` on submit.

### `ReviewViewModal`
Props: `review`, `bookTitle`, `onClose`
Read-only display of a review — star display + content text.

### `BookSourcesModal`
Props: `book`, `onClose`
Shows "Where to buy" links (Open Library, Google Books, Amazon search).

### Auth-gated Page Pattern
All `(app)/` pages follow:
```jsx
const { user, loading } = useAuth();
useEffect(() => {
  if (!loading && !user) router.replace('/');
}, [user, loading]);
if (loading || !user) return <LoadingSpinner />;
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (use a long random string) |
| `PORT` | No | Server port (default: `8080`) |
| `FRONTEND_URL` | Yes (prod) | Frontend origin for CORS (exact Vercel URL, no trailing slash) |
| `GOOGLE_BOOKS_API_KEY` | No | Optional enrichment; OL is primary anyway |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (Railway URL in prod) |

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
3. Add env vars: `DATABASE_URL` (auto-provided by Railway plugin), `JWT_SECRET`, `FRONTEND_URL`
4. `railway.toml` runs `npx prisma db push && node src/index.js` on every deploy
5. `trust proxy 1` is already in `index.js` — required for Railway's reverse proxy

### Vercel (frontend)

1. Import repo on Vercel, set root directory to `frontend/`
2. Add `NEXT_PUBLIC_API_URL` pointing to the Railway backend URL
3. Auto-deploys on push to `main`

---

## Key Gotchas and Pitfalls

### 1. Tailwind Dynamic Class Purging
Never construct class names with template literals at runtime. JIT only includes statically detectable classes.
```jsx
// BAD — purged at build time
<div className={`bg-[${color}]`}>
// GOOD
<div style={{ backgroundColor: color }}>
```

### 2. OL Books Use `OL_` Prefix
Book IDs from Open Library: `OL_<workKey>` (e.g. `OL_OL82537W`). The `GET /api/books/:googleBooksId` route uses `startsWith('OL_')` to decide which source to use. Don't strip this prefix anywhere.

### 3. `border-l` Not Reaching Page Bottom
See "Sidebar Border Chain" in the Design System section. The flex chain is the only reliable fix.

### 4. `next/image` with External URLs
Book covers come from `covers.openlibrary.org`. Use `<img>` tags or `<Image unoptimized />` — otherwise add the OL domain to `next.config.js`.

### 5. Review Unique Constraint
`@@unique([userId, bookId])` — one review per user per book. The route uses `upsert`, so updates silently overwrite the previous review.

### 6. Recommendation 400 for No History
`history` mode returns `400` (not 404) when the user has no finished books. The dashboard catches this and shows an empty state — do not change it to 404.

### 7. sessionStorage vs localStorage
- **`sessionStorage`** — mood chips, quote, word, dyk, trivia indices. Cleared on tab close.
- **`localStorage`** — reading goal, genre prefs, milestones, hints, recently viewed. Persists.
Both wrapped in `try/catch` everywhere.

### 8. Prisma on Railway
Use `npx prisma db push` (not `migrate`). `DATABASE_URL` is provided by Railway's PostgreSQL plugin. Push runs automatically on every deploy via `railway.toml`.

### 9. CORS on Railway
`FRONTEND_URL` must be the exact Vercel origin (including `https://`, no trailing slash). `trust proxy 1` in `index.js` is required for correct IP detection behind Railway's proxy.

### 10. Trending Cache Is In-Memory
The 24h cache lives in module scope in `trending.js`. Server restarts clear it — intentional, no Redis needed.

### 11. Quote/Word Card Height
Hardcoded `height: '130px'` in the dashboard header. CSS-only approaches (flex stretch, min-h, auto) were all tested and caused the cards to overflow the left column. The hardcoded value is correct; don't change it.

### 12. Library PATCH Supports Partial Updates
`PATCH /api/library/:entryId` accepts `status`, `currentPage`, and `notes` independently. Sending only `{ notes: "..." }` updates just the notes without touching status or page.

### 13. DNF Status
`LibraryStatus` enum has four values: `WISHLIST`, `READING`, `FINISHED`, `DNF`. The old CLAUDE.md listed only three — `DNF` is real and must be handled in any status-related UI or logic.

---

## Styling Conventions Summary

1. **Static layout** (flex, grid, gap, padding, rounded, etc.) → Tailwind utilities
2. **Colours and opacity colours** → `style={{ ... }}` inline always
3. **Hover states** → `hover:` Tailwind utilities for static literals only (e.g. `hover:bg-[#1a1d27]` is safe as a literal; don't use it with a variable)
4. **Text overflow** → `line-clamp-2` (Tailwind) for simple; `-webkit-box` + `WebkitLineClamp` inline when combining with flex
5. **Transitions** → `transition-all` Tailwind utility
6. **Borders** → `border` + `style={{ borderColor: '...' }}` — never `border-[#hex]` with dynamic values
7. **Icon sizes** → always `w-N h-N` Tailwind classes, colour via `style={{ color: '...' }}`
