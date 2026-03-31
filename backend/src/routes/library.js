const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes are protected
router.use(authMiddleware);

// GET /api/library — get all library entries for current user
router.get('/', async (req, res) => {
  try {
    const entries = await prisma.libraryEntry.findMany({
      where: { userId: req.user.id },
      include: { book: true },
      orderBy: { addedAt: 'desc' },
    });

    res.json({ entries });
  } catch (err) {
    console.error('Get library error:', err);
    res.status(500).json({ error: 'Failed to fetch library.' });
  }
});

// POST /api/library — add book to library
router.post('/', async (req, res) => {
  const {
    googleBooksId,
    title,
    author,
    coverUrl,
    description,
    genres,
    publishedDate,
    averageRating,
    pageCount,
    isbn,
    buyLink,
    status,
  } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required.' });
  }

  try {
    // Upsert book
    let book;
    if (googleBooksId) {
      book = await prisma.book.upsert({
        where: { googleBooksId },
        update: {
          title,
          author,
          coverUrl: coverUrl || null,
          description: description || null,
          genres: genres || [],
          publishedDate: publishedDate || null,
          averageRating: averageRating || null,
          pageCount: pageCount || null,
          isbn: isbn || null,
          buyLink: buyLink || null,
        },
        create: {
          googleBooksId,
          title,
          author,
          coverUrl: coverUrl || null,
          description: description || null,
          genres: genres || [],
          publishedDate: publishedDate || null,
          averageRating: averageRating || null,
          pageCount: pageCount || null,
          isbn: isbn || null,
          buyLink: buyLink || null,
        },
      });
    } else {
      book = await prisma.book.create({
        data: {
          title,
          author,
          coverUrl: coverUrl || null,
          description: description || null,
          genres: genres || [],
          publishedDate: publishedDate || null,
          averageRating: averageRating || null,
          pageCount: pageCount || null,
          isbn: isbn || null,
          buyLink: buyLink || null,
        },
      });
    }

    // Check if already in library
    const existing = await prisma.libraryEntry.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: book.id } },
    });

    if (existing) {
      return res.status(409).json({ error: 'Book is already in your library.', entry: existing });
    }

    const validStatus = ['WISHLIST', 'READING', 'FINISHED'];
    const entryStatus = validStatus.includes(status) ? status : 'WISHLIST';

    const entry = await prisma.libraryEntry.create({
      data: {
        userId: req.user.id,
        bookId: book.id,
        status: entryStatus,
        startedAt: entryStatus === 'READING' ? new Date() : null,
        finishedAt: entryStatus === 'FINISHED' ? new Date() : null,
      },
      include: { book: true },
    });

    res.status(201).json({ entry });
  } catch (err) {
    console.error('Add to library error:', err);
    res.status(500).json({ error: 'Failed to add book to library.' });
  }
});

// PATCH /api/library/:entryId — update status
router.patch('/:entryId', async (req, res) => {
  const { entryId } = req.params;
  const { status } = req.body;

  const validStatus = ['WISHLIST', 'READING', 'FINISHED'];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be WISHLIST, READING, or FINISHED.' });
  }

  try {
    const entry = await prisma.libraryEntry.findUnique({ where: { id: entryId } });

    if (!entry) {
      return res.status(404).json({ error: 'Library entry not found.' });
    }

    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this entry.' });
    }

    const updateData = { status };
    if (status === 'READING' && !entry.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'FINISHED' && !entry.finishedAt) {
      updateData.finishedAt = new Date();
    }

    const updated = await prisma.libraryEntry.update({
      where: { id: entryId },
      data: updateData,
      include: { book: true },
    });

    res.json({ entry: updated });
  } catch (err) {
    console.error('Update library entry error:', err);
    res.status(500).json({ error: 'Failed to update library entry.' });
  }
});

// DELETE /api/library/:entryId — remove from library
router.delete('/:entryId', async (req, res) => {
  const { entryId } = req.params;

  try {
    const entry = await prisma.libraryEntry.findUnique({ where: { id: entryId } });

    if (!entry) {
      return res.status(404).json({ error: 'Library entry not found.' });
    }

    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this entry.' });
    }

    await prisma.libraryEntry.delete({ where: { id: entryId } });

    res.json({ message: 'Book removed from library.' });
  } catch (err) {
    console.error('Delete library entry error:', err);
    res.status(500).json({ error: 'Failed to remove book from library.' });
  }
});

// POST /api/library/:entryId/review — create or update review
router.post('/:entryId/review', async (req, res) => {
  const { entryId } = req.params;
  const { content, rating } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Review content is required.' });
  }

  const ratingNum = parseInt(rating, 10);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  try {
    const entry = await prisma.libraryEntry.findUnique({
      where: { id: entryId },
      include: { book: true },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Library entry not found.' });
    }

    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to review this entry.' });
    }

    const review = await prisma.review.upsert({
      where: { userId_bookId: { userId: req.user.id, bookId: entry.bookId } },
      update: { content: content.trim(), rating: ratingNum },
      create: {
        userId: req.user.id,
        bookId: entry.bookId,
        content: content.trim(),
        rating: ratingNum,
      },
    });

    res.json({ review });
  } catch (err) {
    console.error('Save review error:', err);
    res.status(500).json({ error: 'Failed to save review.' });
  }
});

// GET /api/library/:entryId/review — get review for entry
router.get('/:entryId/review', async (req, res) => {
  const { entryId } = req.params;

  try {
    const entry = await prisma.libraryEntry.findUnique({ where: { id: entryId } });

    if (!entry) {
      return res.status(404).json({ error: 'Library entry not found.' });
    }

    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const review = await prisma.review.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: entry.bookId } },
    });

    res.json({ review: review || null });
  } catch (err) {
    console.error('Get review error:', err);
    res.status(500).json({ error: 'Failed to fetch review.' });
  }
});

module.exports = router;
