# Book Recommender

A full-stack book recommendation platform powered by AI. Get personalized book recommendations based on your favorite authors, genres, mood, or reading history.

## Features

- AI-powered recommendations using Claude (Anthropic)
- Personal library with reading status tracking
- Book reviews and ratings
- Trending books discovery
- Google Books integration for book data

## Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS — deployed on Vercel
- **Backend:** Node.js, Express, Prisma ORM — deployed on Railway
- **Database:** PostgreSQL (Railway)
- **AI:** Anthropic Claude API
- **Book Data:** Google Books API

## Project Structure

```
book-recommender/
├── frontend/          # Next.js frontend
└── backend/           # Express backend
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Railway account)
- Anthropic API key

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `PORT` | Server port (default: 8080) |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Deployment

### Backend → Railway

1. Create a new Railway project
2. Add a PostgreSQL database
3. Deploy the `backend/` folder
4. Set environment variables in Railway dashboard

### Frontend → Vercel

1. Import the repository on Vercel
2. Set root directory to `frontend/`
3. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
4. Deploy
