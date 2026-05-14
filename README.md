# BookRecommender

A full-stack, AI-powered book recommendation platform. Track your reading history, discover new books, get personalised recommendations, and explore what the reading community is engaging with right now.

**Live:** [Deployed on Vercel (frontend) + Railway (backend)]

---

## Features

### Dashboard
- Personalised greeting (time-aware: morning / afternoon / evening)
- Reading stats bar — Finished, Reading, Wishlist counts
- **Recommended For You** — AI picks based on your finished reading history
- **Currently Reading** strip — books you've marked as in-progress
- **Browse by Mood** — 6 randomly selected mood chips from a pool of 30+ (shuffled every session): tap any to instantly get AI recommendations
- **Book Trivia** — rotating Q&A card in the sidebar (50-question pool, new each session, with reveal + next question)
- **Quote of the Session** — literary quote from a pool of 50, changes every session
- **Word of the Session** — vocabulary word with definition, from a pool of 50
- **Did You Know?** — rotating book fact from a pool of 50
- **Reading Goal** — set a yearly reading target, track progress with a visual bar (persisted in localStorage)
- **Up Next** — your top wishlist books shown as a mini reading queue
- **Quick Actions** — 2×2 icon grid linking to Discover, Library, Trending, Search

### AI Recommendations (`/recommendations`)
Four recommendation modes powered by the Anthropic Claude API:
- **By Author** — books similar to a given author's style and themes (not just more books by that author)
- **By Genre** — top picks across 18 genre options
- **By Mood** — natural language mood input (e.g. "something cozy and uplifting")
- **Reading History** — analyses your finished books and suggests what to read next

### Personal Library (`/library`)
- Add books with status: **Want to Read**, **Currently Reading**, or **Finished**
- Write reviews and star ratings (1–5) on finished books
- Edit or delete reviews inline
- Filter by status tab
- "In Library" state synced across all pages

### Trending (`/trending`)
- Top 50 trending books updated daily
- Rank badges (gold for top 3, indigo for the rest)
- Add any trending book directly to your library

### Search (`/search`)
- Search by title, author, or ISBN via Google Books API
- Results show cover, author, genre tags, and rating
- Add to library directly from results

### Landing Page
- Live trending book preview strip (fetched from public endpoint, no login required)
- Feature cards, CTAs, and responsive layout

### Auth
- JWT-based register / login
- Persistent sessions via localStorage token
- Protected routes — unauthenticated users are redirected to landing page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL |
| AI | Anthropic Claude API (`claude-3-5-haiku`) |
| Book Data | Google Books API + Open Library API |
| Auth | JWT (JSON Web Tokens) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## Project Structure

```
book-recommender/
├── frontend/                        # Next.js 14 app
│   ├── app/
│   │   ├── page.js                  # Landing page
│   │   ├── login/page.js
│   │   ├── register/page.js
│   │   └── (app)/                   # Authenticated route group
│   │       ├── layout.js            # Shared layout with Navbar
│   │       ├── dashboard/
│   │       │   ├── page.js          # Main dashboard
│   │       │   └── dailyContent.js  # Quotes, words, facts, trivia pools
│   │       ├── recommendations/page.js
│   │       ├── library/page.js
│   │       ├── trending/page.js
│   │       └── search/page.js
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── BookCard.jsx
│   │   └── HorizontalBookScroll.jsx
│   ├── context/
│   │   └── AuthContext.js
│   └── lib/
│       └── api.js                   # All API calls (books, library, recs, trending, auth)
│
└── backend/                         # Express API
    └── src/
        ├── index.js
        └── routes/
            ├── auth.js              # Register, login
            ├── books.js             # Google Books search
            ├── library.js           # Library CRUD, reviews, ratings
            ├── recommendations.js   # Claude AI recommendation logic
            └── trending.js          # Trending books (cached, updated daily)
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Railway)
- Anthropic API key
- Google Books API key (optional — falls back gracefully)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (see below)
npx prisma db push
npm run dev
# Runs on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev
# Runs on http://localhost:3000
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `PORT` | Server port (default: `8080`) |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:3000`) |

### Frontend — `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `https://your-app.railway.app`) |

---

## Deployment

### Backend → Railway

1. Create a new Railway project
2. Add a **PostgreSQL** plugin
3. Connect your GitHub repo and set the root directory to `backend/`
4. Add all backend environment variables in the Railway dashboard
5. Railway auto-deploys on push to `main`

### Frontend → Vercel

1. Import the repository on Vercel
2. Set the **root directory** to `frontend/`
3. Add `NEXT_PUBLIC_API_URL` pointing to your Railway backend URL
4. Deploy — Vercel auto-deploys on push to `main`

---

## How Recommendations Work

The `/recommendations` backend route uses the Anthropic Claude API to generate book suggestions:

- **Author mode**: Fetches the author's top works from Open Library, extracts their dominant subjects/themes (filtering noise like "large print", "fiction"), then searches for books in those subject areas by *other* authors. Own-author results are capped at 3 to ensure variety.
- **Genre / Mood modes**: Sends the genre or free-text mood description directly to Claude with a structured prompt requesting real, specific book titles.
- **History mode**: Pulls the user's finished books from the database, extracts titles and authors, and asks Claude to recommend what they should read next based on that reading profile.

All recommendations are cross-referenced against Google Books to enrich metadata (covers, ratings, descriptions).
