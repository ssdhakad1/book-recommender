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

function mapOpenLibraryDoc(doc) {
  const title = doc.title || 'Unknown Title';
  const author = Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name || 'Unknown Author');
  return {
    googleBooksId: doc.key ? doc.key.replace('/works/', 'OL_') : null,
    title,
    author,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    description: null,
    genres: (doc.subject || []).filter(s => !s.includes(':') && !s.includes('=') && s.length <= 40).slice(0, 4),
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
    averageRating: doc.ratings_average || null,
    pageCount: doc.number_of_pages_median || null,
    isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : null,
    buyLink: `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + author + ' buy')}`,
  };
}

async function mapOpenLibraryWork(workId) {
  const workUrl = `https://openlibrary.org/works/${workId}.json`;
  const workRes = await axios.get(workUrl, { timeout: 10000 });
  const work = workRes.data;

  // Fetch author name
  let author = 'Unknown Author';
  if (work.authors && work.authors.length > 0) {
    const authorKey = work.authors[0].author?.key || work.authors[0].key;
    if (authorKey) {
      try {
        const authorRes = await axios.get(`https://openlibrary.org${authorKey}.json`, { timeout: 8000 });
        author = authorRes.data.name || authorRes.data.personal_name || 'Unknown Author';
      } catch {
        // use default
      }
    }
  }

  let coverUrl = null;
  if (work.covers && work.covers.length > 0) {
    coverUrl = `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`;
  }

  let description = null;
  if (work.description) {
    description = typeof work.description === 'string' ? work.description : work.description.value || null;
  }

  const genres = (work.subjects || []).filter(s => !s.includes(':') && !s.includes('=') && s.length <= 40).slice(0, 5);
  const title = work.title || 'Unknown Title';
  const buyLink = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + author + ' buy')}`;

  return {
    googleBooksId: `OL_${workId}`,
    title,
    author,
    coverUrl,
    description,
    genres,
    publishedDate: work.first_publish_date || null,
    averageRating: null,
    pageCount: null,
    isbn: null,
    buyLink,
  };
}

// GET /api/books/search?q=query
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20&fields=title,author_name,cover_i,subject,first_publish_year,isbn,key,number_of_pages_median,ratings_average`;

    const response = await axios.get(url, { timeout: 10000 });
    const docs = response.data.docs || [];

    const books = docs
      .filter((doc) => doc.title && doc.author_name)
      .map(mapOpenLibraryDoc);

    res.json({ books, total: response.data.numFound || books.length });
  } catch (err) {
    console.error('Book search error:', err.message);
    res.status(500).json({ error: 'Failed to search books. Please try again.' });
  }
});

// GET /api/books/:googleBooksId
router.get('/:googleBooksId', async (req, res) => {
  const { googleBooksId } = req.params;

  try {
    let bookData;

    if (googleBooksId.startsWith('OL_')) {
      // Open Library book
      const workId = googleBooksId.replace('OL_', '');
      bookData = await mapOpenLibraryWork(workId);
    } else {
      // Google Books fallback
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const keyParam = apiKey ? `?key=${apiKey}` : '';
      const url = `https://www.googleapis.com/books/v1/volumes/${googleBooksId}${keyParam}`;

      const response = await axios.get(url, { timeout: 10000 });
      bookData = mapGoogleBook(response.data);
    }

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
