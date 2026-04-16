const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const router = express.Router();

// In-memory cache
const cache = { data: null, timestamp: null };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK_BOOKS = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genres: ['Classic', 'Fiction'], description: 'A story of wealth, love, and the American Dream in the 1920s.', rank: 1 },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', genres: ['Classic', 'Fiction'], description: 'A powerful story about racial injustice and moral growth in the American South.', rank: 2 },
  { title: 'Dune', author: 'Frank Herbert', genres: ['Science Fiction'], description: 'An epic space opera set in the distant future on the desert planet Arrakis.', rank: 3 },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', genres: ['Fantasy'], description: 'Bilbo Baggins goes on an unexpected journey with a group of dwarves.', rank: 4 },
  { title: '1984', author: 'George Orwell', genres: ['Dystopian', 'Classic'], description: 'A chilling vision of a totalitarian future society under constant surveillance.', rank: 5 },
  { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', genres: ['Science Fiction', 'Humor'], description: 'A comedic journey through the universe following an ordinary man.', rank: 6 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genres: ['Non-fiction', 'History'], description: 'A brief history of humankind from ancient times to the present.', rank: 7 },
  { title: 'Atomic Habits', author: 'James Clear', genres: ['Self-Help', 'Non-fiction'], description: 'Proven strategies for building good habits and breaking bad ones.', rank: 8 },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genres: ['Fantasy'], description: 'The legend of Kvothe, a musician, arcanist, and adventure in the making.', rank: 9 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', genres: ['Science', 'Non-fiction'], description: 'An exploration of the cosmos, from the Big Bang to black holes.', rank: 10 },
  { title: 'The Alchemist', author: 'Paulo Coelho', genres: ['Fiction', 'Philosophical'], description: 'A young shepherd\'s journey to find his personal legend.', rank: 11 },
  { title: 'Project Hail Mary', author: 'Andy Weir', genres: ['Science Fiction'], description: 'An astronaut wakes alone in space with no memory and the fate of Earth at stake.', rank: 12 },
  { title: 'Normal People', author: 'Sally Rooney', genres: ['Contemporary Fiction', 'Romance'], description: 'The complex relationship between two young people from the west of Ireland.', rank: 13 },
  { title: 'The Midnight Library', author: 'Matt Haig', genres: ['Fiction', 'Fantasy'], description: 'A library between life and death where you can explore lives you could have lived.', rank: 14 },
  { title: 'Educated', author: 'Tara Westover', genres: ['Memoir', 'Non-fiction'], description: 'A memoir about a woman who grows up in a survivalist family and escapes through education.', rank: 15 },
  { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genres: ['Historical Fiction'], description: 'A reclusive Hollywood legend finally tells her story to an unknown journalist.', rank: 16 },
  { title: 'Fourth Wing', author: 'Rebecca Yarros', genres: ['Fantasy', 'Romance'], description: 'A young woman attends a war college for dragon riders against all odds.', rank: 17 },
  { title: 'Lessons in Chemistry', author: 'Bonnie Garmus', genres: ['Historical Fiction', 'Humor'], description: 'A female chemist in the 1960s becomes a cooking show host, inspiring women nationwide.', rank: 18 },
  { title: 'The Thursday Murder Club', author: 'Richard Osman', genres: ['Mystery', 'Crime'], description: 'Four unlikely detectives in a retirement village investigate a cold case that turns hot.', rank: 19 },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genres: ['Fiction'], description: 'A story about love, creativity, and video games spanning three decades.', rank: 20 },
];

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

async function enrichBook(title, author) {
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
    console.error(`Enrich trending book error for "${title}":`, err.message);
  }
  return null;
}

async function fetchTrendingBooks() {
  let claudeBooks = null;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a book expert. List exactly 50 currently popular and trending books across different genres (fiction, non-fiction, fantasy, science fiction, mystery, romance, self-help, etc.).

Include a mix of recent bestsellers, timeless classics that are trending, and books that are widely discussed right now.

Return a JSON array of exactly 50 books. Each object must have:
- title: string
- author: string
- genres: array of strings
- description: string (1-2 sentences)
- rank: number (1-50)

Return ONLY valid JSON, no extra text. Format:
[{"title":"...","author":"...","genres":["..."],"description":"...","rank":1}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    claudeBooks = JSON.parse(jsonStr);

    if (!Array.isArray(claudeBooks) || claudeBooks.length === 0) {
      throw new Error('Invalid response from Gemini');
    }
  } catch (err) {
    console.error('Claude trending error, using fallback:', err.message);
    claudeBooks = FALLBACK_BOOKS;
  }

  // Enrich top 50 with Google Books data (batch to avoid rate limiting)
  const enriched = [];
  for (let i = 0; i < Math.min(claudeBooks.length, 50); i++) {
    const book = claudeBooks[i];
    const googleData = await enrichBook(book.title, book.author);
    enriched.push({
      rank: book.rank || i + 1,
      title: book.title,
      author: book.author,
      genres: book.genres || [],
      description: book.description || '',
      coverUrl: googleData?.coverUrl || null,
      googleBooksId: googleData?.googleBooksId || null,
      publishedDate: googleData?.publishedDate || null,
      averageRating: googleData?.averageRating || null,
      pageCount: googleData?.pageCount || null,
      buyLink: googleData?.buyLink || `https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' buy')}`,
    });

    // Small delay to avoid hammering Google Books API
    if (i % 10 === 9) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return enriched;
}

// GET /api/trending
router.get('/', async (req, res) => {
  try {
    const now = Date.now();

    // Check cache
    if (cache.data && cache.timestamp && now - cache.timestamp < CACHE_TTL) {
      return res.json({ books: cache.data, cached: true });
    }

    console.log('Fetching fresh trending books...');
    const books = await fetchTrendingBooks();

    // Store in cache
    cache.data = books;
    cache.timestamp = now;

    res.json({ books, cached: false });
  } catch (err) {
    console.error('Trending error:', err);

    // If cache exists but expired, return it as fallback
    if (cache.data) {
      return res.json({ books: cache.data, cached: true, stale: true });
    }

    res.status(500).json({ error: 'Failed to fetch trending books. Please try again.' });
  }
});

module.exports = router;
