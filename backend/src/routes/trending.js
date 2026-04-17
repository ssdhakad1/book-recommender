const express = require('express');
const axios = require('axios');

const router = express.Router();

// In-memory cache (1 hour)
const cache = { data: null, timestamp: null };
const CACHE_TTL = 60 * 60 * 1000;

// Curated trending books list — enriched with Google Books data on first load
const TRENDING_BOOKS = [
  { title: 'Fourth Wing', author: 'Rebecca Yarros', genres: ['Fantasy', 'Romance'], rank: 1 },
  { title: 'Iron Flame', author: 'Rebecca Yarros', genres: ['Fantasy', 'Romance'], rank: 2 },
  { title: 'Intermezzo', author: 'Sally Rooney', genres: ['Literary Fiction'], rank: 3 },
  { title: 'James', author: 'Percival Everett', genres: ['Historical Fiction'], rank: 4 },
  { title: 'The Women', author: 'Kristin Hannah', genres: ['Historical Fiction'], rank: 5 },
  { title: 'Onyx Storm', author: 'Rebecca Yarros', genres: ['Fantasy', 'Romance'], rank: 6 },
  { title: 'The God of the Woods', author: 'Liz Moore', genres: ['Mystery', 'Thriller'], rank: 7 },
  { title: 'All Fours', author: 'Miranda July', genres: ['Literary Fiction'], rank: 8 },
  { title: 'The Life Impossible', author: 'Matt Haig', genres: ['Fiction', 'Fantasy'], rank: 9 },
  { title: 'Eruption', author: 'Michael Crichton', genres: ['Thriller', 'Science Fiction'], rank: 10 },
  { title: 'Atomic Habits', author: 'James Clear', genres: ['Self-Help', 'Non-fiction'], rank: 11 },
  { title: 'The Midnight Library', author: 'Matt Haig', genres: ['Fiction', 'Fantasy'], rank: 12 },
  { title: 'Project Hail Mary', author: 'Andy Weir', genres: ['Science Fiction'], rank: 13 },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', genres: ['Fiction'], rank: 14 },
  { title: 'Lessons in Chemistry', author: 'Bonnie Garmus', genres: ['Historical Fiction', 'Humor'], rank: 15 },
  { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genres: ['Historical Fiction'], rank: 16 },
  { title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', genres: ['Fantasy', 'Romance'], rank: 17 },
  { title: 'It Ends with Us', author: 'Colleen Hoover', genres: ['Romance', 'Fiction'], rank: 18 },
  { title: 'Dune', author: 'Frank Herbert', genres: ['Science Fiction'], rank: 19 },
  { title: 'The Alchemist', author: 'Paulo Coelho', genres: ['Fiction', 'Philosophical'], rank: 20 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genres: ['Non-fiction', 'History'], rank: 21 },
  { title: 'Educated', author: 'Tara Westover', genres: ['Memoir', 'Non-fiction'], rank: 22 },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genres: ['Fantasy'], rank: 23 },
  { title: 'Normal People', author: 'Sally Rooney', genres: ['Contemporary Fiction', 'Romance'], rank: 24 },
  { title: '1984', author: 'George Orwell', genres: ['Dystopian', 'Classic'], rank: 25 },
  { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', genres: ['Science Fiction', 'Humor'], rank: 26 },
  { title: 'The Thursday Murder Club', author: 'Richard Osman', genres: ['Mystery', 'Crime'], rank: 27 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', genres: ['Science', 'Non-fiction'], rank: 28 },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genres: ['Classic', 'Fiction'], rank: 29 },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', genres: ['Classic', 'Fiction'], rank: 30 },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', genres: ['Fantasy'], rank: 31 },
  { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', genres: ['Fantasy', 'Young Adult'], rank: 32 },
  { title: 'The Hunger Games', author: 'Suzanne Collins', genres: ['Dystopian', 'Young Adult'], rank: 33 },
  { title: 'The Da Vinci Code', author: 'Dan Brown', genres: ['Thriller', 'Mystery'], rank: 34 },
  { title: 'Gone Girl', author: 'Gillian Flynn', genres: ['Thriller', 'Mystery'], rank: 35 },
  { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', genres: ['Mystery', 'Thriller'], rank: 36 },
  { title: 'Becoming', author: 'Michelle Obama', genres: ['Memoir', 'Biography'], rank: 37 },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genres: ['Psychology', 'Non-fiction'], rank: 38 },
  { title: 'The Power of Now', author: 'Eckhart Tolle', genres: ['Self-Help', 'Spirituality'], rank: 39 },
  { title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', genres: ['Finance', 'Self-Help'], rank: 40 },
  { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', genres: ['Self-Help'], rank: 41 },
  { title: 'Brave New World', author: 'Aldous Huxley', genres: ['Dystopian', 'Classic'], rank: 42 },
  { title: 'The Road', author: 'Cormac McCarthy', genres: ['Post-Apocalyptic', 'Fiction'], rank: 43 },
  { title: 'Circe', author: 'Madeline Miller', genres: ['Fantasy', 'Mythology'], rank: 44 },
  { title: 'The Song of Achilles', author: 'Madeline Miller', genres: ['Fantasy', 'Historical Fiction'], rank: 45 },
  { title: 'Beach Read', author: 'Emily Henry', genres: ['Romance', 'Fiction'], rank: 46 },
  { title: 'People We Meet on Vacation', author: 'Emily Henry', genres: ['Romance', 'Fiction'], rank: 47 },
  { title: 'The Silent Patient', author: 'Alex Michaelides', genres: ['Thriller', 'Mystery'], rank: 48 },
  { title: 'Where the Crawdads Sing', author: 'Delia Owens', genres: ['Mystery', 'Fiction'], rank: 49 },
  { title: 'The Kite Runner', author: 'Khaled Hosseini', genres: ['Historical Fiction', 'Drama'], rank: 50 },
];

async function enrichBook(title, author) {
  try {
    const fields = 'title,author_name,cover_i,subject,first_publish_year,number_of_pages_median,ratings_average,key';
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(title + ' ' + author)}&limit=1&fields=${fields}`;
    const response = await axios.get(url, { timeout: 10000 });
    const doc = (response.data.docs || [])[0];
    if (!doc) return null;
    const coverId = doc.cover_i;
    return {
      title: doc.title || title,
      author: (doc.author_name || [author])[0],
      coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
      genres: (doc.subject || []).slice(0, 4),
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
      averageRating: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : null,
      pageCount: doc.number_of_pages_median || null,
      googleBooksId: doc.key ? doc.key.replace('/works/', 'OL_') : null,
    };
  } catch (err) {
    console.error(`Enrich error for "${title}":`, err.message);
  }
  return null;
}

async function buildTrendingList() {
  const enriched = [];
  for (let i = 0; i < TRENDING_BOOKS.length; i++) {
    const book = TRENDING_BOOKS[i];
    const data = await enrichBook(book.title, book.author);
    enriched.push({
      rank: book.rank,
      title: data?.title || book.title,
      author: data?.author || book.author,
      genres: data?.genres?.length ? data.genres : book.genres,
      description: '',
      coverUrl: data?.coverUrl || null,
      googleBooksId: data?.googleBooksId || null,
      publishedDate: data?.publishedDate || null,
      averageRating: data?.averageRating || null,
      pageCount: data?.pageCount || null,
      buyLink: `https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' buy')}`,
    });
    if (i % 10 === 9) await new Promise((r) => setTimeout(r, 200));
  }
  return enriched;
}

// GET /api/trending
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && cache.timestamp && now - cache.timestamp < CACHE_TTL) {
      return res.json({ books: cache.data, cached: true });
    }
    console.log('Building trending list from Open Library...');
    const books = await buildTrendingList();
    cache.data = books;
    cache.timestamp = now;
    res.json({ books, cached: false });
  } catch (err) {
    console.error('Trending error:', err);
    if (cache.data) return res.json({ books: cache.data, cached: true, stale: true });
    const bare = TRENDING_BOOKS.map((b) => ({ ...b, coverUrl: null, googleBooksId: null, description: '', buyLink: `https://www.google.com/search?q=${encodeURIComponent(b.title + ' ' + b.author + ' buy')}` }));
    res.json({ books: bare, cached: false });
  }
});

module.exports = router;
