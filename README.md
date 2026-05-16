# Folio

A full-stack book tracking and recommendation platform. Discover your next read, track your library, get personalised recommendations, and connect with a reading community.

**Live:** Frontend on Vercel · Backend on Railway

---

## Features

### Dashboard
- Personalised greeting (time-aware: morning / afternoon / evening)
- Reading stats bar — Finished, Reading, Wishlist, DNF counts
- **Currently Reading** strip — books actively in progress
- **Recommended For You** — personalised picks based on your finished reading history
- **Browse by Mood** — 6 session-shuffled mood chips from a pool of 30+
- **Reading Streak** — consecutive months with at least one book finished
- **Book Trivia** — rotating Q&A card (50-question pool, new each session)
- **Quote of the Session** — literary quote from a pool of 50
- **Word of the Session** — vocabulary word with definition and example, from a pool of 50
- **Did You Know?** — rotating book fact from a pool of 50
- **Reading Goal** — set a yearly target, track progress visually (persisted in localStorage)
- **Up Next** — top wishlist books as a reading queue
- **Quick Actions** — shortcuts to Discover, Library, Trending, Search
- **Recently Viewed** — last 10 books you've opened
- **Onboarding Wizard** — genre preference setup + reading goal (shown on first login)
- **Getting Started Checklist** — milestone tracker (add book, start reading, write review, set goal)

### Discover (`/recommendations`)
Four recommendation modes powered by Open Library:
- **By Author** — a few of the author's top works + books with similar subjects
- **By Genre** — top picks across 44 genre options; quick-select chips for your saved genre preferences
- **By Mood** — natural language mood input ("something cozy and uplifting")
- **Reading History** — analyses your finished books (weighted by rating) and suggests what to read next
- Taste Match badges on results that align with your saved genre preferences

### Personal Library (`/library`)
- Add books with status: Wishlist / Currently Reading / Finished / Did Not Finish
- Write reviews and star ratings (1–5) on finished books
- Add private notes to any book
- Track reading progress (current page + visual progress bar)
- Sort and filter by status, title, author, or date added
- Full-text search within your library
- Import from Goodreads CSV
- Export full library as CSV (15 columns: title, author, status, rating, review, notes, dates, current page, pages, published year, ISBN, OL rating, genres)

### Book Detail (`/book/[id]`)
- Full cover, title, author, average rating, genres
- Description and metadata (published date, page count, ISBN)
- Library status badge and reading progress
- Add to library / update status directly from this page
- Write or view your review (star rating + text)
- "Find & Buy" link
- "More by [Author]" — 5 related books from Open Library

### Stats (`/stats`)
- Summary cards: books finished, currently reading, wishlist count, pages read, average rating, total library size, top author, finished this year
- Monthly reading bar chart (year selector)
- Top genres bar chart
- Rating distribution chart
- Top 5 authors
- Recently finished books list

### Trending (`/trending`)
- Top 50 trending books, updated daily (seeded daily shuffle)
- Gold / silver / bronze rank badges for top 3; numbered badges for the rest
- Cover, genres, rating, page count
- Add any book directly to your library

### Search (`/search`)
- Debounced real-time search by title, author, or ISBN
- Powered by Open Library (primary) + Google Books API (fallback)
- Add to library directly from results; shows "In Library" state

### Community (`/community`)
- Recent reviews feed (40 newest reviews from all readers)
- Active readers leaderboard (top 25 by books finished, with review count and average rating)

### Public Profiles (`/readers/[userId]`)
- View any reader's finished books, written reviews, and reading stats
- Finished books grid + full review cards with dates

### User Profile (`/profile`)
- Edit display name, view email and join date
- Genre preferences grid — select and save favourites (synced to localStorage)
- Link to your public profile page
- Change password (expandable inline form)
- Reading at-a-glance stats

### Auth
- Register / Login / Forgot password / Reset password / Change password / Delete account
- JWT-based auth, persistent sessions via HTTP-only cookie (7-day expiry)
- Protected routes — unauthenticated users redirected to landing page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL |
| Book Data | Open Library API (primary) + Google Books API (fallback) |
| Auth | JWT — `jsonwebtoken` + `js-cookie` |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## Project Structure

```
folio/
├── frontend/                              # Next.js 14 app
│   ├── app/
│   │   ├── page.js                        # Public landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.js
│   │   │   ├── register/page.js
│   │   │   ├── forgot-password/page.js
│   │   │   └── reset-password/page.js
│   │   └── (app)/                         # Authenticated route group
│   │       ├── layout.js                  # Shared layout with Navbar
│   │       ├── dashboard/
│   │       │   ├── page.js
│   │       │   └── dailyContent.js        # Static data pools (quotes, words, facts, trivia)
│   │       ├── recommendations/page.js
│   │       ├── library/page.js
│   │       ├── book/[googleBooksId]/page.js
│   │       ├── stats/page.js
│   │       ├── trending/page.js
│   │       ├── search/page.js
│   │       ├── community/page.js
│   │       ├── profile/page.js
│   │       └── readers/[userId]/page.js
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── NavbarWrapper.jsx
│   │   ├── BookCard.jsx
│   │   ├── HorizontalBookScroll.jsx
│   │   ├── OnboardingWizard.jsx
│   │   ├── GettingStartedChecklist.jsx
│   │   ├── PageHint.jsx
│   │   ├── ReviewModal.jsx
│   │   ├── ReviewViewModal.jsx
│   │   ├── BookSourcesModal.jsx
│   │   └── LoadingSpinner.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   └── lib/
│       ├── api.js
│       ├── auth.js
│       └── recentlyViewed.js
│
└── backend/                               # Express API
    ├── prisma/schema.prisma
    └── src/
        ├── index.js
        ├── middleware/auth.js
        └── routes/
            ├── auth.js
            ├── books.js
            ├── library.js
            ├── recommendations.js
            ├── trending.js
            └── community.js
```

---

## Local Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npx prisma db push
npm run dev            # http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
# create .env.local with: NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev            # http://localhost:3000
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `PORT` | No | Server port (default: `8080`) |
| `FRONTEND_URL` | Yes (prod) | Frontend origin for CORS |
| `GOOGLE_BOOKS_API_KEY` | No | Optional enrichment fallback |

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL |

---

## Deployment

### Railway (backend)
1. New Railway project → add PostgreSQL plugin
2. Connect GitHub repo, set root directory to `backend/`
3. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
4. Auto-deploys on push to `main`

### Vercel (frontend)
1. Import repo on Vercel, set root directory to `frontend/`
2. Add `NEXT_PUBLIC_API_URL` pointing to the Railway backend URL
3. Auto-deploys on push to `main`
