const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes protected
router.use(authMiddleware);

function mapGoogleBook(item) {
  const info = item.volumeInfo || {};
  return {
    googleBooksId: item.id,
    title: info.title || 'Unknown Title',
    author: (info.authors || ['Unknown Author']).join(', '),
    coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    description: info.description || null,
    genres: info.categories || [],
    publishedDate: info.publishedDate || null,
    averageRating: info.averageRating || null,
    pageCount: info.pageCount || null,
    isbn: info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier || null,
    buyLink:
      item.saleInfo?.buyLink ||
      `https://www.google.com/search?q=${encodeURIComponent(
        (info.title || '') + ' ' + (info.authors?.[0] || '') + ' buy'
      )}`,
  };
}

async function enrichBookWithGoogleData(title, author) {
  try {
    const query = `${title} ${author}`;
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1${keyParam}`;
    const response = await axios.get(url, { timeout: 8000 });
    const items = response.data.items || [];
    if (items.length > 0) {
      return mapGoogleBook(items[0]);
    }
  } catch (err) {
    console.error(`Failed to enrich book "${title}":`, err.message);
  }
  return null;
}

// POST /api/recommendations
router.post('/', async (req, res) => {
  const { mode, input, limit = 10 } = req.body;

  const validModes = ['author', 'genre', 'mood', 'history'];
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be: author, genre, mood, or history.' });
  }

  if (mode !== 'history' && (!input || input.trim().length === 0)) {
    return res.status(400).json({ error: 'Input is required for this recommendation mode.' });
  }

  const numLimit = Math.min(parseInt(limit, 10) || 10, 20);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let prompt = '';

    if (mode === 'author') {
      prompt = `You are a book recommendation expert. Recommend exactly ${numLimit} books similar to works by the author "${input.trim()}".

Return a JSON array of exactly ${numLimit} book recommendations. Each object must have:
- title: string
- author: string
- description: string (2-3 sentences about the book)
- reason: string (why this is recommended based on the author's style/themes)
- genres: array of strings

Return ONLY valid JSON, no extra text. Format:
[{"title":"...","author":"...","description":"...","reason":"...","genres":["..."]}]`;
    } else if (mode === 'genre') {
      prompt = `You are a book recommendation expert. Recommend exactly ${numLimit} excellent books in the "${input.trim()}" genre.

Return a JSON array of exactly ${numLimit} book recommendations. Each object must have:
- title: string
- author: string
- description: string (2-3 sentences about the book)
- reason: string (why this is a standout book in the genre)
- genres: array of strings

Return ONLY valid JSON, no extra text. Format:
[{"title":"...","author":"...","description":"...","reason":"...","genres":["..."]}]`;
    } else if (mode === 'mood') {
      prompt = `You are a book recommendation expert. A reader is looking for books with this mood or theme: "${input.trim()}"

Recommend exactly ${numLimit} books that perfectly match this mood or what they're looking for.

Return a JSON array of exactly ${numLimit} book recommendations. Each object must have:
- title: string
- author: string
- description: string (2-3 sentences about the book)
- reason: string (why this book matches the requested mood/theme)
- genres: array of strings

Return ONLY valid JSON, no extra text. Format:
[{"title":"...","author":"...","description":"...","reason":"...","genres":["..."]}]`;
    } else if (mode === 'history') {
      // Fetch user's finished books
      const finishedEntries = await prisma.libraryEntry.findMany({
        where: { userId: req.user.id, status: 'FINISHED' },
        include: { book: true },
        orderBy: { finishedAt: 'desc' },
        take: 20,
      });

      if (finishedEntries.length === 0) {
        return res.status(400).json({
          error: 'No finished books in your library. Mark some books as "Finished" to get history-based recommendations.',
        });
      }

      const bookList = finishedEntries
        .map((e) => `- "${e.book.title}" by ${e.book.author}${e.book.genres.length > 0 ? ` (${e.book.genres.join(', ')})` : ''}`)
        .join('\n');

      prompt = `You are a book recommendation expert. Based on the following books a reader has finished:

${bookList}

Recommend exactly ${numLimit} new books they would love, based on their reading taste and patterns.

Return a JSON array of exactly ${numLimit} book recommendations. Each object must have:
- title: string
- author: string
- description: string (2-3 sentences about the book)
- reason: string (why this matches their reading history/taste)
- genres: array of strings

Return ONLY valid JSON, no extra text. Format:
[{"title":"...","author":"...","description":"...","reason":"...","genres":["..."]}]`;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let recommendations;

    try {
      recommendations = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response:', text);
      return res.status(500).json({ error: 'Failed to parse AI recommendations. Please try again.' });
    }

    if (!Array.isArray(recommendations)) {
      return res.status(500).json({ error: 'Unexpected AI response format. Please try again.' });
    }

    // Enrich with Google Books data
    const enriched = await Promise.all(
      recommendations.map(async (rec) => {
        const googleData = await enrichBookWithGoogleData(rec.title, rec.author);
        return {
          title: rec.title,
          author: rec.author,
          description: rec.description,
          reason: rec.reason,
          genres: rec.genres || [],
          coverUrl: googleData?.coverUrl || null,
          googleBooksId: googleData?.googleBooksId || null,
          publishedDate: googleData?.publishedDate || null,
          averageRating: googleData?.averageRating || null,
          pageCount: googleData?.pageCount || null,
          isbn: googleData?.isbn || null,
          buyLink: googleData?.buyLink || `https://www.google.com/search?q=${encodeURIComponent(rec.title + ' ' + rec.author + ' buy')}`,
        };
      })
    );

    res.json({ recommendations: enriched, mode, input: mode !== 'history' ? input : undefined });
  } catch (err) {
    console.error('Recommendations error:', err);
    if (err.status === 401) {
      return res.status(500).json({ error: 'AI service authentication failed.' });
    }
    res.status(500).json({ error: 'Failed to generate recommendations. Please try again.' });
  }
});

module.exports = router;
