const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

// Subjects too generic / noisy to be useful for finding similar authors
const SUBJECT_NOISE = /^(short stories|american|english|fiction|large type|large print|accessible book|protected daisy|lending library|internet archive|nonfiction|open library staff picks|overdrive|in library|ebook|audiobook|juvenile|juvenile fiction|children|picture books|illustrated|hardcover|paperback|spanish language|french language|translated|american fiction|english fiction|bestseller)$/i;

// ─── Genre → Open Library subject slugs ──────────────────────────────────────
// Maps common genre names to 2-3 reliable OL subject slugs, searched in parallel.
// This ensures "Children's" → juvenile_fiction + childrens_literature instead of
// just "childrens" which has poor OL coverage.
const GENRE_MAP = {
  "children's":         ['juvenile fiction', 'childrens literature', 'children'],
  "children":           ['juvenile fiction', 'childrens literature'],
  "young adult":        ['young adult fiction', 'young adult literature'],
  "ya":                 ['young adult fiction', 'young adult literature'],
  "romance":            ['romance', 'love stories', 'romantic fiction'],
  "thriller":           ['thriller', 'suspense', 'psychological thriller'],
  "mystery":            ['mystery', 'detective and mystery stories', 'crime fiction'],
  "crime":              ['crime fiction', 'mystery', 'detective stories'],
  "horror":             ['horror', 'supernatural fiction', 'gothic fiction'],
  "fantasy":            ['fantasy fiction', 'epic fantasy', 'magic'],
  "epic fantasy":       ['epic fantasy', 'fantasy fiction', 'sword and sorcery'],
  "science fiction":    ['science fiction', 'space opera', 'hard science fiction'],
  "sci-fi":             ['science fiction', 'space opera'],
  "scifi":              ['science fiction', 'space opera'],
  "historical fiction": ['historical fiction', 'historical novels'],
  "history":            ['history', 'world history'],
  "biography":          ['biography', 'autobiography', 'memoir'],
  "autobiography":      ['autobiography', 'biography', 'memoir'],
  "memoir":             ['memoir', 'autobiography', 'biography'],
  "self-help":          ['self help', 'personal development', 'motivation'],
  "self help":          ['self help', 'personal development', 'motivation'],
  "business":           ['business', 'entrepreneurship', 'management'],
  "literary fiction":   ['literary fiction', 'classics'],
  "classics":           ['classics', 'literary fiction', 'world literature'],
  "graphic novel":      ['graphic novels', 'comics'],
  "manga":              ['manga', 'graphic novels'],
  "adventure":          ['adventure', 'action and adventure'],
  "dystopia":           ['dystopian fiction', 'post apocalyptic fiction'],
  "dystopian":          ['dystopian fiction', 'post apocalyptic fiction'],
  "humor":              ['humor', 'comedy', 'wit and humor'],
  "comedy":             ['humor', 'comedy', 'satire'],
  "satire":             ['satire', 'humor'],
  "philosophy":         ['philosophy', 'ethics', 'philosophical fiction'],
  "poetry":             ['poetry', 'american poetry'],
  "western":            ['western stories', 'frontier and pioneer life'],
  "paranormal":         ['paranormal fiction', 'supernatural fiction'],
  "urban fantasy":      ['urban fantasy', 'fantasy fiction'],
  "cozy mystery":       ['cozy mystery', 'mystery'],
  "spy":                ['spy stories', 'espionage'],
  "political":          ['political fiction', 'political science'],
  "true crime":         ['true crime', 'crime'],
  "spirituality":       ['spirituality', 'religion', 'mindfulness'],
  "science":            ['science', 'popular science', 'natural history'],
  "cooking":            ['cooking', 'cookbooks'],
  "travel":             ['travel', 'travel writing'],
  "art":                ['art', 'art history'],
  "sports":             ['sports', 'athletics'],
  "psychology":         ['psychology', 'mental health', 'cognitive science'],
  "economics":          ['economics', 'finance', 'business'],
};

// Returns 1–3 reliable OL subject strings for a given genre name
function getGenreSubjects(genre) {
  const normalized = genre.toLowerCase().trim().replace(/['']/g, "'");
  if (GENRE_MAP[normalized]) return GENRE_MAP[normalized];
  // Partial match (e.g. "romantic comedy" → matches "comedy")
  for (const [key, subjects] of Object.entries(GENRE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return subjects;
  }
  // Fall back: use the genre name itself as an OL subject
  return [normalized];
}

// ─── Mood → Open Library subjects mapping ────────────────────────────────────
const MOOD_MAP = [
  { patterns: [/happy|joy|cheerful|uplifting|feel.good|lighthearted|optimistic/i],          subjects: ['humor', 'comedy', 'feel-good fiction', 'uplifting'] },
  { patterns: [/sad|melancholy|emotional|heartbreak|cry|grief|longing|bittersweet/i],        subjects: ['drama', 'literary fiction', 'grief', 'loss'] },
  { patterns: [/thrilling|suspense|tense|edge of my seat|gripping|page.turn/i],              subjects: ['suspense', 'thriller', 'psychological thriller'] },
  { patterns: [/inspired|motivat|empower|self.help|improve|better myself|personal growth/i], subjects: ['self-help', 'biography', 'motivation', 'success'] },
  { patterns: [/romantic|romance|love|relationship|dating|heartfelt|swoon/i],                subjects: ['romance', 'love stories', 'romantic fiction'] },
  { patterns: [/adventur|action|quest|journey|explore|travel|exciting/i],                    subjects: ['adventure', 'action and adventure', 'quest'] },
  { patterns: [/scary|horror|dark|creepy|frightening|terror|eerie|unsettling/i],             subjects: ['horror', 'supernatural fiction', 'gothic fiction'] },
  { patterns: [/funny|laugh|humor|comic|hilarious|witty|silly|absurd|satire/i],              subjects: ['humor', 'comedy', 'satire', 'wit and humor'] },
  { patterns: [/thoughtful|philosophical|deep|meaning|existential|intellectual|literary/i],  subjects: ['philosophy', 'literary fiction', 'classics'] },
  { patterns: [/mysterious|mystery|puzzle|detective|crime|whodunit|investigation/i],         subjects: ['mystery', 'detective and mystery stories', 'crime fiction'] },
  { patterns: [/magic|fantasy|dragon|wizard|elf|epic fantasy|sword|sorcery/i],               subjects: ['fantasy fiction', 'epic fantasy', 'magic', 'dragons'] },
  { patterns: [/cozy|relaxing|comfortable|warm|gentle|calm|quiet|slow.burn/i],               subjects: ['cozy mystery', 'domestic fiction', 'slice of life'] },
  { patterns: [/sci.fi|science fiction|space|future|robot|alien|dystopia|tech/i],            subjects: ['science fiction', 'space opera', 'dystopian fiction'] },
  { patterns: [/histor|past|period|ancient|medieval|war|battle|wwii|civil war/i],            subjects: ['historical fiction', 'war stories', 'history'] },
  { patterns: [/coming.of.age|grow|teen|young adult|school|identity|adolescen/i],            subjects: ['coming of age', 'young adult fiction'] },
  { patterns: [/family|parent|sibling|home|domestic|motherhood|fatherhood/i],                subjects: ['family', 'domestic fiction', 'family life'] },
  { patterns: [/apocalyp|survival|end of world|post.apocal|dystop/i],                        subjects: ['dystopian fiction', 'apocalyptic fiction', 'survival'] },
  { patterns: [/mythology|myth|gods|legend|folklore|fairy tale/i],                           subjects: ['mythology', 'folklore', 'fairy tales', 'gods and goddesses'] },
  { patterns: [/spiritual|mindful|meditat|buddhis|zen|inner peace/i],                        subjects: ['spirituality', 'mindfulness', 'meditation', 'religion'] },
  { patterns: [/business|entrepreneur|startup|leadership|finance|money/i],                   subjects: ['business', 'entrepreneurship', 'leadership', 'economics'] },
];

function getMoodSubjects(moodText) {
  const matched = new Set();
  for (const { patterns, subjects } of MOOD_MAP) {
    if (patterns.some(p => p.test(moodText))) {
      subjects.forEach(s => matched.add(s));
    }
  }
  // Nothing matched — try treating it as a genre first, then fall back
  if (matched.size === 0) {
    const genreSubjects = getGenreSubjects(moodText);
    // Only use genre subjects if they're actually different from the raw input
    const rawNormalized = moodText.toLowerCase().trim();
    genreSubjects.forEach(s => {
      if (s !== rawNormalized) matched.add(s);
    });
    // Always ensure we have at least some reliable fallback subjects
    if (matched.size === 0) {
      matched.add('literary fiction');
      matched.add('popular fiction');
    }
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
    genres: (work.subject || work.subjects?.map(s => s.name || s) || []).filter(s => !s.includes(':') && !s.includes('=') && s.length <= 40).slice(0, 4),
    publishedDate: work.first_publish_year ? String(work.first_publish_year) : null,
    averageRating: work.ratings_average ? Math.round(work.ratings_average * 10) / 10 : null,
    pageCount: work.number_of_pages_median || null,
    isbn: Array.isArray(work.isbn) ? work.isbn[0] : null,
    buyLink: `https://www.google.com/search?q=${encodeURIComponent((work.title || '') + ' ' + author + ' buy')}`,
    reason: reason || 'Recommended based on your preferences',
  };
}

// Free-text search — includes quality filter (skip if rated by fewer than 5 users)
async function olSearch(query, limit = 15, sort = 'rating') {
  try {
    const fields = 'title,author_name,cover_i,subject,first_publish_year,isbn,key,number_of_pages_median,ratings_average,ratings_count';
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=${sort}&fields=${fields}`;
    const res = await axios.get(url, { timeout: 12000 });
    return (res.data.docs || [])
      .filter(d =>
        d.title &&
        d.author_name &&
        d.cover_i &&
        // Quality gate: only include books with at least 5 ratings, OR no rating data at all
        // (no rating data usually means a newer/less-indexed book, not a bad one)
        (d.ratings_count == null || d.ratings_count >= 5)
      )
      .map(d => ({ ...d, authors: [{ name: Array.isArray(d.author_name) ? d.author_name[0] : d.author_name }] }));
  } catch (err) {
    console.error('OL search error:', err.message);
    return [];
  }
}

// Subject endpoint search — more curated results, higher quality coverage per genre
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
    const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=25&fields=${fields}`;
    const res = await axios.get(url, { timeout: 10000 });
    const allSubjects = (res.data.docs || []).flatMap(d => d.subject || []);
    const freq = {};
    allSubjects.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s)
      .filter(s => {
        if (s.length < 5 || s.length > 45) return false;
        if (SUBJECT_NOISE.test(s)) return false;
        if (/^[A-Z][a-z]+$/.test(s) && s.length < 10) return false;
        return true;
      })
      .slice(0, 6);
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

    // Fetch all library entries for this user upfront so we can exclude them
    const allLibraryEntries = await prisma.libraryEntry.findMany({
      where: { userId: req.user.id },
      include: { book: true },
    });
    const libraryTitles = new Set(allLibraryEntries.map(e => e.book.title.toLowerCase()));

    // ── By Author ──────────────────────────────────────────────────────────────
    if (mode === 'author') {
      const authorName = input.trim();
      const authorLast = authorName.split(' ').pop().toLowerCase();

      const ownBooks = await olSearch(`author:${authorName}`, 5, 'rating');
      const ownMapped = ownBooks.slice(0, 3).map(d =>
        mapWorkToBook(d, `Top-rated work by ${authorName}`)
      );
      const ownTitles = new Set(ownMapped.map(b => (b.title || '').toLowerCase()));

      const topSubjects = await getAuthorTopSubjects(authorName);

      const wantSimilar = numLimit - ownMapped.length;
      const similarBatches = await Promise.all(
        topSubjects.slice(0, 4).map(subject => olSubjectSearch(subject, wantSimilar + 3))
      );

      const similarBooks = similarBatches
        .flat()
        .filter(w => {
          const bookAuthor = (w.authors?.[0]?.name || '').toLowerCase();
          return (
            !bookAuthor.includes(authorName.toLowerCase()) &&
            !(authorLast.length > 3 && bookAuthor.includes(authorLast))
          );
        });

      const similarMapped = dedupeBooks(
        similarBooks.map(w =>
          mapWorkToBook(w, `Readers of ${authorName} also enjoy — ${topSubjects[0] || 'same themes'}`)
        ),
        new Set([...ownTitles, ...libraryTitles])
      ).slice(0, wantSimilar);

      const filteredOwn = ownMapped.filter(b => !libraryTitles.has((b.title || '').toLowerCase()));
      items = dedupeBooks([...filteredOwn, ...similarMapped]).slice(0, numLimit);
    }

    // ── By Genre ───────────────────────────────────────────────────────────────
    // Strategy:
    //  1. Resolve the genre name to 1–3 reliable OL subject slugs via GENRE_MAP
    //  2. Search all those subjects in parallel (parallel subject endpoint calls)
    //  3. Also do a quality-rated free-text search as backup to fill gaps
    //  4. Merge, dedupe, exclude library books
    else if (mode === 'genre') {
      const genre = input.trim();
      const reason = `A highly-regarded book in the ${genre} genre`;

      const subjects = getGenreSubjects(genre);

      const [subjectBatches, textResults] = await Promise.all([
        Promise.all(subjects.map(s => olSubjectSearch(s, numLimit + 5))),
        olSearch(`subject:${genre}`, numLimit, 'rating'),
      ]);

      const allBooks = [
        ...subjectBatches.flat().map(w => mapWorkToBook(w, reason)),
        ...textResults.map(d => mapWorkToBook(d, reason)),
      ];
      items = dedupeBooks(allBooks, libraryTitles).slice(0, numLimit);
    }

    // ── By Mood ────────────────────────────────────────────────────────────────
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
      items = dedupeBooks(allBooks, libraryTitles).slice(0, numLimit);
    }

    // ── By History ─────────────────────────────────────────────────────────────
    // Strategy:
    //  1. Pull user's finished books from DB
    //  2. Weight authors by review rating:
    //     - Rating 4–5 → weight 3 (loved it)
    //     - Rating 3   → weight 2 (liked it)
    //     - Rating 1–2 → weight 0 (skip — don't recommend similar)
    //     - No review  → weight 1 (neutral — still contributes, not ignored)
    //  3. For each favourite author, find their top subjects
    //  4. Search those subjects, excluding already-read books
    else if (mode === 'history') {
      const finishedEntries = allLibraryEntries
        .filter(e => e.status === 'FINISHED')
        .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))
        .slice(0, 20);

      if (finishedEntries.length === 0) {
        return res.status(400).json({
          error: 'No finished books yet. Mark some books as "Finished" to get personalised recommendations.',
        });
      }

      const reviews = await prisma.review.findMany({
        where: { userId: req.user.id, bookId: { in: finishedEntries.map(e => e.bookId) } },
      });
      const reviewMap = {};
      reviews.forEach(r => { reviewMap[r.bookId] = r.rating; });

      const weightedAuthors = [];
      const weightedGenres = [];

      for (const entry of finishedEntries) {
        const rating = reviewMap[entry.bookId]; // may be undefined if no review
        let weight;
        if (rating >= 4)                    weight = 3; // loved it
        else if (rating === 3)              weight = 2; // liked it
        else if (rating === 1 || rating === 2) weight = 0; // skip — bad experience
        else                               weight = 1; // no review — include at low weight

        if (weight > 0) {
          const author = entry.book.author.split(',')[0].trim();
          for (let i = 0; i < weight; i++) {
            weightedAuthors.push(author);
            entry.book.genres.forEach(g => weightedGenres.push(g));
          }
        }
      }

      // If still no weighted authors (all books were rated 1–2), fall back to top authors
      let topAuthors;
      if (weightedAuthors.length === 0) {
        topAuthors = [...new Set(finishedEntries.map(e => e.book.author.split(',')[0].trim()))].slice(0, 3);
      } else {
        const authorFreq = {};
        weightedAuthors.forEach(a => { authorFreq[a] = (authorFreq[a] || 0) + 1; });
        topAuthors = Object.entries(authorFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([a]) => a);
      }

      let storedGenres;
      if (weightedGenres.length === 0) {
        storedGenres = [...new Set(finishedEntries.flatMap(e => e.book.genres))].slice(0, 4);
      } else {
        const genreFreq = {};
        weightedGenres.forEach(g => { genreFreq[g] = (genreFreq[g] || 0) + 1; });
        storedGenres = Object.entries(genreFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([g]) => g);
      }

      const authorSubjectBatches = await Promise.all(topAuthors.map(a => getAuthorTopSubjects(a)));
      const allSubjects = [...new Set([...storedGenres, ...authorSubjectBatches.flat()])].slice(0, 5);

      const reason = `Based on your reading history (${allSubjects.slice(0, 2).join(', ')})`;
      const batches = await Promise.all(allSubjects.map(s => olSubjectSearch(s, numLimit)));
      const combined = batches.flat().filter(w => !libraryTitles.has(w.title?.toLowerCase()));
      items = dedupeBooks(combined.map(w => mapWorkToBook(w, reason)), libraryTitles).slice(0, numLimit);
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
