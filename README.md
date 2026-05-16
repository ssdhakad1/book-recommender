# Folio

A full-stack book tracking and recommendation platform. Discover your next read, track your library, and get personalised recommendations based on your taste and reading history.

**Live:** Frontend on Vercel · Backend on Railway

---

## Features

### Dashboard
- Personalised greeting (time-aware: morning / afternoon / evening)
- Reading stats bar — Finished, Reading, Wishlist, DNF counts
- **Recommended For You** — picks based on your finished reading history
- **Currently Reading** strip — books you have in progress
- **Browse by Mood** — 6 session-shuffled mood chips from a pool of 30+
- **Book Trivia** — rotating Q&A card (50-question pool, new each session)
- **Quote of the Session** — literary quote from a pool of 50
- **Word of the Session** — vocabulary word with definition, from a pool of 50
- **Did You Know?** — rotating book fact from a pool of 50
- **Reading Goal** — set a yearly target, track progress visually (persisted in localStorage)
- **Up Next** — your top wishlist books as a reading queue
- **Quick Actions** — links to Discover, Library, Trending, Search

### Discover (`/recommendations`)
Four recommendation modes powered by Open Library:
- **By Author** — books similar to a given author's style and themes
- **By Genre** — top picks across 44 genre options
- **By Mood** — natural language mood input ("something cozy and uplifting")
- **Reading History** — analyses your finished books and suggests what to read next

### Personal Library (`/library`)
- Add books with status: Wishlist / Currently Reading / Finished / Did Not Finish
- Write reviews and star ratings (1–5) on finished books
- Add private notes to any book
- Track reading progress (current page)
- Sort and filter by status, title, author, or date
- Import from Goodreads CSV
- Export full library as CSV (15 columns including notes, progress, dates, ISBN)

### Stats (`/stats`)
- Reading pace, streaks, and monthly breakdown
- Genre distribution and rating distribution charts
- Top authors and personal bests

### Trending (`/trending`)
- Top 50 trending books, updated daily
- Rank badges, covers, genres, ratings
- Add any book directly to your library

### Search (`/search`)
- Search by title, author, or ISBN via Open Library + Google Books
- Add to library directly from results

### Community (`/community`)
- Recent reviews feed from all readers
- Active readers leaderboard

### Public Profiles (`/readers/[userId]`)
- View any reader's finished books, reviews, and stats

### Auth
- JWT-based register / login / forgot password / reset password
- Persistent sessions via HTTP cookie (7-day expiry)
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
├── frontend/                         # Next.js 14 app
│   ├── app/
│   │   ├── page.js                   # Public landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.js
│   │   │   ├── register/page.js
│   │   │   ├── forgot-password/page.js
│   │   │   └── reset-password/page.js
│   │   └── (app)/                    # Authenticated route group
│   │       ├── layout.js             # Shared layout with Navbar
│   │       ├── dashboard/page.js
│   │       ├── recommendations/page.js
│   │       ├── library/page.js
│   │       ├── stats/page.js
│   │       ├── trending/page.js
│   │       ├── search/page.js
│   │       ├── community/page.js
│   │       ├── profile/page.js
│   │       └── readers/[userId]/page.js
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── BookCard.jsx
│   │   ├── OnboardingWizard.jsx
│   │   ├── GettingStartedChecklist.jsx
│   │   ├── PageHint.jsx
│   │   └── HorizontalBookScroll.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   └── lib/
│       ├── api.js
│       ├── auth.js
│       └── recentlyViewed.js
│
└── backend/                          # Express API
    ├── prisma/schema.prisma
    └── src/
        ├── index.js
        ├── middleware/auth.js
        └── routes/
            ├── auth.js
            ├── books.js
            ├── library.js
            ├── recommendations.js
            └── trending.js
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
