const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

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

// GET /api/books/search?q=query
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20${keyParam}`;

    const response = await axios.get(url, { timeout: 10000 });
    const items = response.data.items || [];
    const books = items.map(mapGoogleBook);

    res.json({ books, total: response.data.totalItems || 0 });
  } catch (err) {
    console.error('Book search error:', err.message);
    res.status(500).json({ error: 'Failed to search books. Please try again.' });
  }
});

// GET /api/books/:googleBooksId
router.get('/:googleBooksId', async (req, res) => {
  const { googleBooksId } = req.params;

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `?key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes/${googleBooksId}${keyParam}`;

    const response = await axios.get(url, { timeout: 10000 });
    const bookData = mapGoogleBook(response.data);

    // Upsert in local DB
    try {
      await prisma.book.upsert({
        where: { googleBooksId: bookData.googleBooksId },
        update: {
          title: bookData.title,
          author: bookData.author,
          coverUrl: bookData.coverUrl,
          description: bookData.description,
          genres: bookData.genres,
          publishedDate: bookData.publishedDate,
          averageRating: bookData.averageRating,
          pageCount: bookData.pageCount,
          isbn: bookData.isbn,
          buyLink: bookData.buyLink,
        },
        create: {
          googleBooksId: bookData.googleBooksId,
          title: bookData.title,
          author: bookData.author,
          coverUrl: bookData.coverUrl,
          description: bookData.description,
          genres: bookData.genres,
          publishedDate: bookData.publishedDate,
          averageRating: bookData.averageRating,
          pageCount: bookData.pageCount,
          isbn: bookData.isbn,
          buyLink: bookData.buyLink,
        },
      });
    } catch (dbErr) {
      // Non-fatal: log and continue
      console.error('DB upsert error for book:', dbErr.message);
    }

    res.json({ book: bookData });
  } catch (err) {
    console.error('Get book error:', err.message);
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    res.status(500).json({ error: 'Failed to fetch book details.' });
  }
});

module.exports = router;
