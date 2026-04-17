const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const MOOD_TO_QUERY = {
  happy: 'uplifting feel-good comedy',
  sad: 'emotional heartfelt drama',
  adventurous: 'adventure exploration quest',
  romantic: 'romance love relationship',
  thrilling: 'thriller suspense gripping',
  scary: 'horror dark supernatural',
  funny: 'humor comedy witty',
  inspiring: 'inspirational motivation success',
  mysterious: 'mystery detective crime',
  thoughtful: 'philosophy literary fiction',
  relaxing: 'cozy gentle slice-of-life',
  dark: 'dark psychological noir',
  epic: 'epic fantasy saga',
  scientific: 'science popular discovery',
  historical: 'historical fiction history',
};

function mapOpenLibraryBook(doc, reason) {
  const coverId = doc.cover_i;
  const author = Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name || 'Unknown Author');
  const title = doc.title || 'Unknown Title';
  return {
    googleBooksId: doc.key ? doc.key.replace('/works/', 'OL_') : null,
    title,
    author,
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    description: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence) : null,
    genres: Array.isArray(doc.subject) ? doc.subject.slice(0, 4) : [],
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
    averageRating: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : null,
    pageCount: doc.number_of_pages_median || null,
    isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : null,
    buyLink: `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + author + ' buy')}`,
    reason: reason || 'Recommended based on your preferences',
  };
}

async function searchOpenLibrary(query, limit = 12) {
  try {
    const fields = 'title,author_name,cover_i,subject,first_publish_year,isbn,key,number_of_pages_median,ratings_average,first_sentence';
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;
    const response = await axios.get(url, { timeout: 12000 });
    return (response.data.docs || []).filter(d => d.title && d.author_name);
  } catch (err) {
    console.error('Open Library search error:', err.message);
    return [];
  }
}

async function searchByAuthor(author, limit = 12) {
  try {
    const fields = 'title,author_name,cover_i,subject,first_publish_year,isbn,key,number_of_pages_median,ratings_average';
    const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=${limit}&fields=${fields}&sort=rating`;
    const response = await axios.get(url, { timeout: 12000 });
    return (response.data.docs || []).filter(d => d.title && d.author_name);
  } catch (err) {
    console.error('Open Library author search error:', err.message);
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
      const [byAuthor, similar] = await Promise.all([
        searchByAuthor(authorName, numLimit + 5),
        searchOpenLibrary(`${authorName} fiction`, numLimit),
      ]);
      const reason = `Recommended based on works by or similar to ${authorName}`;
      items = dedupeBooks([...byAuthor, ...similar]).slice(0, numLimit).map(d => mapOpenLibraryBook(d, reason));
    }

    else if (mode === 'genre') {
      const genre = input.trim();
      const [batch1, batch2] = await Promise.all([
        searchOpenLibrary(`subject:${genre}`, numLimit + 5),
        searchOpenLibrary(`${genre} popular books`, numLimit),
      ]);
      const reason = `A top-rated book in the ${genre} genre`;
      items = dedupeBooks([...batch1, ...batch2]).slice(0, numLimit).map(d => mapOpenLibraryBook(d, reason));
    }

    else if (mode === 'mood') {
      const mood = input.trim().toLowerCase();
      const matchedKey = Object.keys(MOOD_TO_QUERY).find(k => mood.includes(k));
      const query = matchedKey ? MOOD_TO_QUERY[matchedKey] : mood;
      const [batch1, batch2] = await Promise.all([
        searchOpenLibrary(query, numLimit + 5),
        searchOpenLibrary(`${query} fiction`, numLimit),
      ]);
      const reason = `Matches the mood: "${input.trim()}"`;
      items = dedupeBooks([...batch1, ...batch2]).slice(0, numLimit).map(d => mapOpenLibraryBook(d, reason));
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

      const authors = [...new Set(finishedEntries.map(e => e.book.author.split(',')[0].trim()))].slice(0, 2);
      const genres = [...new Set(finishedEntries.flatMap(e => e.book.genres))].slice(0, 3);
      const finishedTitles = new Set(finishedEntries.map(e => e.book.title.toLowerCase()));

      const queries = [];
      if (genres.length > 0) queries.push(searchOpenLibrary(`subject:${genres[0]}`, numLimit));
      if (authors.length > 0) queries.push(searchByAuthor(authors[0], numLimit));
      if (genres.length > 1) queries.push(searchOpenLibrary(genres.join(' '), numLimit));

      const batches = await Promise.all(queries);
      const combined = batches.flat().filter(d => !finishedTitles.has(d.title?.toLowerCase()));
      const reason = `Recommended based on your reading history (${genres.slice(0, 2).join(', ') || 'your taste'})`;
      items = dedupeBooks(combined).slice(0, numLimit).map(d => mapOpenLibraryBook(d, reason));
    }

    if (items.length === 0) {
      return res.status(404).json({ error: 'No recommendations found. Try a different search term.' });
    }

    res.json({ recommendations: items, mode, input: mode !== 'history' ? input : undefined });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations. Please try again.' });
  }
});

module.exports = router;
