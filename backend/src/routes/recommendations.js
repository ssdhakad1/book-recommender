const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const MOOD_TO_QUERY = {
  happy: 'uplifting feel-good',
  sad: 'emotional heartfelt',
  adventurous: 'adventure exploration quest',
  romantic: 'romance love relationship',
  thrilling: 'thriller suspense gripping',
  scary: 'horror dark supernatural',
  funny: 'humor comedy witty',
  inspiring: 'inspirational motivation self-improvement',
  mysterious: 'mystery detective crime',
  thoughtful: 'philosophy literary fiction',
  relaxing: 'cozy slice-of-life gentle',
  dark: 'dark psychological noir',
  epic: 'epic fantasy saga',
  scientific: 'science popular science discovery',
  historical: 'historical fiction history',
};

function mapGoogleBook(item, reason) {
  const info = item.volumeInfo || {};
  return {
    googleBooksId: item.id,
    title: info.title || 'Unknown Title',
    author: (info.authors || ['Unknown Author']).join(', '),
    coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    description: info.description ? info.description.substring(0, 300) + (info.description.length > 300 ? '...' : '') : null,
    genres: info.categories || [],
    publishedDate: info.publishedDate || null,
    averageRating: info.averageRating || null,
    pageCount: info.pageCount || null,
    isbn: info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier || null,
    buyLink:
      item.saleInfo?.buyLink ||
      `https://www.google.com/search?q=${encodeURIComponent((info.title || '') + ' ' + (info.authors?.[0] || '') + ' buy')}`,
    reason: reason || 'Recommended based on your preferences',
  };
}

async function searchGoogleBooks(query, maxResults = 12) {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&orderBy=relevance&langRestrict=en${keyParam}`;
    const response = await axios.get(url, { timeout: 10000 });
    return (response.data.items || []).filter(
      (item) => item.volumeInfo?.title && item.volumeInfo?.authors?.length > 0
    );
  } catch (err) {
    console.error('Google Books search error:', err.message);
    return [];
  }
}

function dedupeBooks(books) {
  const seen = new Set();
  return books.filter((b) => {
    const key = b.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// POST /api/recommendations
router.post('/', async (req, res) => {
  const { mode, input, limit = 10 } = req.body;
  const numLimit = Math.min(parseInt(limit, 10) || 10, 20);

  const validModes = ['author', 'genre', 'mood', 'history'];
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Must be: author, genre, mood, or history.' });
  }
  if (mode !== 'history' && (!input || input.trim().length === 0)) {
    return res.status(400).json({ error: 'Input is required for this recommendation mode.' });
  }

  try {
    let items = [];

    if (mode === 'author') {
      const authorName = input.trim();
      // First get their own popular books
      const ownBooks = await searchGoogleBooks(`inauthor:"${authorName}"`, numLimit);
      // Then find similar authors' books
      const similarBooks = await searchGoogleBooks(`${authorName} similar authors fiction`, numLimit);
      const combined = [...ownBooks, ...similarBooks];
      const reason = `Popular and highly-rated work by or similar to ${authorName}`;
      items = dedupeBooks(combined)
        .slice(0, numLimit)
        .map((item) => mapGoogleBook(item, reason));
    }

    else if (mode === 'genre') {
      const genre = input.trim();
      const [batch1, batch2] = await Promise.all([
        searchGoogleBooks(`subject:"${genre}" bestseller`, numLimit),
        searchGoogleBooks(`${genre} highly rated popular books`, numLimit),
      ]);
      const combined = [...batch1, ...batch2];
      const reason = `A top-rated book in the ${genre} genre`;
      items = dedupeBooks(combined)
        .slice(0, numLimit)
        .map((item) => mapGoogleBook(item, reason));
    }

    else if (mode === 'mood') {
      const mood = input.trim().toLowerCase();
      // Find best matching mood query or fall back to the raw input
      const matchedKey = Object.keys(MOOD_TO_QUERY).find((k) => mood.includes(k));
      const query = matchedKey ? MOOD_TO_QUERY[matchedKey] : mood;
      const [batch1, batch2] = await Promise.all([
        searchGoogleBooks(`${query} books`, numLimit),
        searchGoogleBooks(`${query} popular fiction`, numLimit),
      ]);
      const combined = [...batch1, ...batch2];
      const reason = `Matches the mood: "${input.trim()}"`;
      items = dedupeBooks(combined)
        .slice(0, numLimit)
        .map((item) => mapGoogleBook(item, reason));
    }

    else if (mode === 'history') {
      const finishedEntries = await prisma.libraryEntry.findMany({
        where: { userId: req.user.id, status: 'FINISHED' },
        include: { book: true },
        orderBy: { finishedAt: 'desc' },
        take: 10,
      });

      if (finishedEntries.length === 0) {
        return res.status(400).json({
          error: 'No finished books in your library. Mark some books as "Finished" to get history-based recommendations.',
        });
      }

      // Extract favourite authors and genres
      const authors = [...new Set(finishedEntries.map((e) => e.book.author.split(',')[0].trim()))].slice(0, 3);
      const genres = [...new Set(finishedEntries.flatMap((e) => e.book.genres))].slice(0, 3);
      const finishedTitles = new Set(finishedEntries.map((e) => e.book.title.toLowerCase()));

      // Build search queries from history
      const queries = [];
      if (genres.length > 0) queries.push(`subject:"${genres[0]}" popular`);
      if (authors.length > 0) queries.push(`inauthor:"${authors[0]}" OR inauthor:"${authors[1] || authors[0]}"`);
      if (genres.length > 1) queries.push(`${genres.join(' OR ')} bestseller`);

      const batches = await Promise.all(queries.map((q) => searchGoogleBooks(q, numLimit)));
      const combined = batches.flat().filter((item) => !finishedTitles.has(item.volumeInfo?.title?.toLowerCase()));
      const reason = `Recommended based on your reading history (${genres.slice(0, 2).join(', ') || 'your taste'})`;
      items = dedupeBooks(combined)
        .slice(0, numLimit)
        .map((item) => mapGoogleBook(item, reason));
    }

    if (items.length === 0) {
      return res.status(404).json({ error: 'No recommendations found. Try a different search.' });
    }

    res.json({ recommendations: items, mode, input: mode !== 'history' ? input : undefined });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations. Please try again.' });
  }
});

module.exports = router;
