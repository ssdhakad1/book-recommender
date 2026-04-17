const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

// ─── Mood → Open Library subjects mapping ────────────────────────────────────
// Each entry has regex patterns to match against the user's mood text,
// and a list of Open Library subjects to search.
const MOOD_MAP = [
  { patterns: [/happy|joy|cheerful|uplifting|feel.good|lighthearted|optimistic/i], subjects: ['humor', 'comedy', 'feel-good fiction', 'uplifting'] },
  { patterns: [/sad|melancholy|emotional|heartbreak|cry|grief|longing|bittersweet/i], subjects: ['drama', 'literary fiction', 'grief', 'loss'] },
  { patterns: [/thrilling|suspense|tense|edge of my seat|gripping|page.turn/i], subjects: ['suspense', 'thriller', 'psychological thriller'] },
  { patterns: [/inspired|motivat|empower|self.help|improve|better myself|personal growth/i], subjects: ['self-help', 'biography', 'motivation', 'success'] },
  { patterns: [/romantic|romance|love|relationship|dating|heartfelt|swoon/i], subjects: ['romance', 'love stories', 'romantic fiction'] },
  { patterns: [/adventur|action|quest|journey|explore|travel|exciting/i], subjects: ['adventure', 'action and adventure', 'quest'] },
  { patterns: [/scary|horror|dark|creepy|frightening|terror|eerie|unsettling/i], subjects: ['horror', 'supernatural fiction', 'gothic fiction'] },
  { patterns: [/funny|laugh|humor|comic|hilarious|witty|silly|absurd|satire/i], subjects: ['humor', 'comedy', 'satire', 'wit and humor'] },
  { patterns: [/thoughtful|philosophical|deep|meaning|existential|intellectual|literary/i], subjects: ['philosophy', 'literary fiction', 'classics'] },
  { patterns: [/mysterious|mystery|puzzle|detective|crime|whodunit|investigation/i], subjects: ['mystery', 'detective and mystery stories', 'crime fiction'] },
  { patterns: [/magic|fantasy|dragon|wizard|elf|epic fantasy|sword|sorcery/i], subjects: ['fantasy fiction', 'epic fantasy', 'magic', 'dragons'] },
  { patterns: [/cozy|relaxing|comfortable|warm|gentle|calm|quiet|slow.burn/i], subjects: ['cozy mystery', 'domestic fiction', 'slice of life'] },
  { patterns: [/sci.fi|science fiction|space|future|robot|alien|dystopia|tech/i], subjects: ['science fiction', 'space opera', 'dystopian fiction'] },
  { patterns: [/histor|past|period|ancient|medieval|war|battle|wwii|civil war/i], subjects: ['historical fiction', 'war stories', 'history'] },
  { patterns: [/coming.of.age|grow|teen|young adult|school|identity|adolescen/i], subjects: ['coming of age', 'young adult fiction'] },
  { patterns: [/family|parent|sibling|home|domestic|motherhood|fatherhood/i], subjects: ['family', 'domestic fiction', 'family life'] },
  { patterns: [/apocalyp|survival|end of world|post.apocal|dystop/i], subjects: ['dystopian fiction', 'apocalyptic fiction', 'survival'] },
  { patterns: [/mythology|myth|gods|legend|folklore|fairy tale/i], subjects: ['mythology', 'folklore', 'fairy tales', 'gods and goddesses'] },
  { patterns: [/spiritual|mindful|meditat|buddhis|zen|inner peace/i], subjects: ['spirituality', 'mindfulness', 'meditation', 'religion'] },
  { patterns: [/business|entrepreneur|startup|leadership|finance|money/i], subjects: ['business', 'entrepreneurship', 'leadership', 'economics'] },
];

function getMoodSubjects(moodText) {
  const matched = new Set();
  for (const { patterns, subjects } of MOOD_MAP) {
    if (patterns.some(p => p.test(moodText))) {
      subjects.forEach(s => matched.add(s));
    }
  }
  // Nothing matched — extract nouns/keywords from the input and use them directly
  if (matched.size === 0) {
    const words = moodText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    words.slice(0, 2).forEach(w => matched.add(w));
    matched.add('popular fiction');
  }
  return [...matched].slice(0, 3);
}

// ─── Open Library helpers ─────────────────────────────────────────────────────
function mapWorkToBook(work, reason) {
  const coverId = work.cover_id || work.cover_i;
  const author = work.authors?.[0]?.name || (Array.isArray(work.author_name) ? work.author_name[0] : work.author_name) || 'Unknown Author';
  return {
    googleBooksId: work.key ? work.key.replace('/works/', 'OL_') : null,
    title: work.title || 'Unknown Title',
    author,
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    description: work.description ? (typeof work.description === 'string' ? work.description : work.description.value || '').substring(0, 300) : null,
    genres: work.subject ? work.subject.slice(0, 4) : (work.subjects ? work.subjects.slice(0, 4).map(s => s.name || s) : []),
    publishedDate: work.first_publish_year ? String(work.first_publish_year) : null,
    averageRating: work.ratings_average ? Math.round(work.ratings_average * 10) / 10 : null,
    pageCount: work.number_of_pages_median || null,
    isbn: Array.isArray(work.isbn) ? work.isbn[0] : null,
    buyLink: `https://www.google.com/search?q=${encodeURIComponent((work.title || '') + ' ' + author + ' buy')}`,
    reason: reason || 'Recommended based on your preferences',
  };
}

// Search Open Library by free text
async function olSearch(query, limit = 15, sort = 'rating') {
  try {
    const fields = 'title,author_name,cover_i,subject,first_publish_year,isbn,key,number_of_pages_median,ratings_average,ratings_count';
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=${sort}&fields=${fields}`;
    const res = await axios.get(url, { timeout: 12000 });
    return (res.data.docs || [])
      .filter(d => d.title && d.author_name && d.cover_i) // only books with covers
      .map(d => ({ ...d, authors: [{ name: Array.isArray(d.author_name) ? d.author_name[0] : d.author_name }] }));
  } catch (err) {
    console.error('OL search error:', err.message);
    return [];
  }
}

// Search Open Library by subject using dedicated subject endpoint (higher quality results)
async function olSubjectSearch(subject, limit = 12) {
  try {
    const slug = subject.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
    const url = `https://openlibrary.org/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`;
    const res = await axios.get(url, { timeout: 12000 });
    return (res.data.works || []).filter(w => w.title && w.authors?.length && w.cover_id);
  } catch (err) {
    console.error(`OL subject "${subject}" error:`, err.message);
    return [];
  }
}

// Get an author's top subjects so we can find similar authors
async function getAuthorTopSubjects(authorName) {
  try {
    const fields = 'subject';
    const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=20&fields=${fields}`;
    const res = await axios.get(url, { timeout: 10000 });
    const allSubjects = (res.data.docs || []).flatMap(d => d.subject || []);
    // Count subject frequency and return top 4
    const freq = {};
    allSubjects.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([s]) => s);
  } catch (err) {
    console.error('Author subject lookup error:', err.message);
    return [];
  }
}

function dedupeBooks(books, excludeTitles = new Set()) {
  const seen = new Set([...excludeTitles].map(t => t.toLowerCase()));
  return books.filter(b => {
    const key = (b.title || '').toLowerCase();
    if (seen.has(key) || !b.title) return false;
    seen.add(key);
    return true;
  });
}

// ─── Route ────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { mode, input, limit = 10 } = req.body;
  const numLimit = Math.min(parseInt(limit, 10) || 10, 20);

  if (!['author', 'genre', 'mood', 'history'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode.' });
  }
  if (mode !== 'history' && (!input || !input.trim())) {
    return res.status(400).json({ error: 'Input is required for this mode.' });
  }

  try {
    let items = [];

    // ── By Author ──────────────────────────────────────────────────────────────
    // Strategy:
    //  1. Get the author's own top-rated works
    //  2. Extract their most common subjects (horror, thriller, etc.)
    //  3. Search those subjects — filtering OUT the original author
    //  4. Mix own works + similar-author books for a rich result set
    if (mode === 'author') {
      const authorName = input.trim();

      // Step 1: Author's own popular books
      const ownBooks = await olSearch(`author:${authorName}`, numLimit, 'rating');

      // Step 2: Find this author's top subjects
      const topSubjects = await getAuthorTopSubjects(authorName);

      // Step 3: For each top subject, get books by OTHER authors
      const similarBatches = await Promise.all(
        topSubjects.slice(0, 3).map(subject => olSubjectSearch(subject, numLimit))
      );
      const similarBooks = similarBatches
        .flat()
        .filter(w => {
          const bookAuthor = w.authors?.[0]?.name || '';
          return !bookAuthor.toLowerCase().includes(authorName.toLowerCase());
        });

      const ownMapped = ownBooks.map(d => mapWorkToBook(d, `A popular work by ${authorName}`));
      const similarMapped = similarBooks.map(w =>
        mapWorkToBook(w, `Similar to ${authorName} — both explore ${topSubjects[0] || 'the same themes'}`)
      );

      items = dedupeBooks([...ownMapped, ...similarMapped]).slice(0, numLimit);
    }

    // ── By Genre ───────────────────────────────────────────────────────────────
    // Strategy: Use subject endpoint (more curated) + free-text search as backup
    else if (mode === 'genre') {
      const genre = input.trim();
      const reason = `A highly-regarded book in the ${genre} genre`;

      const [subjectResults, searchResults] = await Promise.all([
        olSubjectSearch(genre, numLimit + 5),
        olSearch(`subject:${genre}`, numLimit, 'rating'),
      ]);

      const fromSubject = subjectResults.map(w => mapWorkToBook(w, reason));
      const fromSearch = searchResults.map(d => mapWorkToBook(d, reason));
      items = dedupeBooks([...fromSubject, ...fromSearch]).slice(0, numLimit);
    }

    // ── By Mood ────────────────────────────────────────────────────────────────
    // Strategy:
    //  1. Map mood text to real Open Library subjects using regex patterns
    //  2. Fetch books from those subjects (not from a raw text search)
    //  3. This avoids returning books titled "something dumb" etc.
    else if (mode === 'mood') {
      const moodText = input.trim();
      const subjects = getMoodSubjects(moodText);
      const reason = `Matches the vibe: "${moodText}"`;

      const batches = await Promise.all(
        subjects.map(subject =>
          olSubjectSearch(subject, numLimit).catch(() => olSearch(subject, numLimit, 'rating'))
        )
      );

      const allBooks = batches.flat().map(w => mapWorkToBook(w, reason));
      items = dedupeBooks(allBooks).slice(0, numLimit);
    }

    // ── By History ─────────────────────────────────────────────────────────────
    // Strategy:
    //  1. Pull user's finished books from DB
    //  2. Extract their favourite authors + subjects
    //  3. For each favourite author, find their top subjects
    //  4. Search those subjects, excluding already-read books
    //  5. Rank by how many of the user's subjects match
    else if (mode === 'history') {
      const finishedEntries = await prisma.libraryEntry.findMany({
        where: { userId: req.user.id, status: 'FINISHED' },
        include: { book: true },
        orderBy: { finishedAt: 'desc' },
        take: 20,
      });

      if (finishedEntries.length === 0) {
        return res.status(400).json({
          error: 'No finished books yet. Mark some books as "Finished" to get personalised recommendations.',
        });
      }

      const finishedTitles = new Set(finishedEntries.map(e => e.book.title.toLowerCase()));
      const topAuthors = [...new Set(finishedEntries.map(e => e.book.author.split(',')[0].trim()))].slice(0, 3);
      const storedGenres = [...new Set(finishedEntries.flatMap(e => e.book.genres))].slice(0, 4);

      // Get subjects for each top author
      const authorSubjectBatches = await Promise.all(topAuthors.map(a => getAuthorTopSubjects(a)));
      const allSubjects = [...new Set([...storedGenres, ...authorSubjectBatches.flat()])].slice(0, 5);

      const reason = `Based on your reading history (${allSubjects.slice(0, 2).join(', ')})`;
      const batches = await Promise.all(allSubjects.map(s => olSubjectSearch(s, numLimit)));
      const combined = batches.flat().filter(w => !finishedTitles.has(w.title?.toLowerCase()));
      items = dedupeBooks(combined.map(w => mapWorkToBook(w, reason))).slice(0, numLimit);
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
