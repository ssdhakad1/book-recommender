const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/community/reviews — recent reviews from all users (public)
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      take: 40,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverUrl: true,
            googleBooksId: true,
            genres: true,
          },
        },
      },
    });
    res.json({ reviews });
  } catch (err) {
    console.error('Community reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// GET /api/community/profiles — list of readers with public stats
router.get('/profiles', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        libraryEntries: {
          select: { status: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const profiles = users.map((u) => {
      const finished = u.libraryEntries.filter((e) => e.status === 'FINISHED').length;
      const reading  = u.libraryEntries.filter((e) => e.status === 'READING').length;
      const reviewCount = u.reviews.length;
      const avgRating = reviewCount
        ? (u.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1)
        : null;
      return {
        id: u.id,
        name: u.name,
        createdAt: u.createdAt,
        finished,
        reading,
        reviewCount,
        avgRating: avgRating ? parseFloat(avgRating) : null,
      };
    });

    // Sort by books finished desc
    profiles.sort((a, b) => b.finished - a.finished);

    res.json({ profiles });
  } catch (err) {
    console.error('Community profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch profiles.' });
  }
});

// GET /api/community/users/:userId — specific user's public profile
router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const [entries, reviews] = await Promise.all([
      prisma.libraryEntry.findMany({
        where: { userId },
        include: { book: true },
        orderBy: { addedAt: 'desc' },
      }),
      prisma.review.findMany({
        where: { userId },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverUrl: true,
              googleBooksId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const finished   = entries.filter((e) => e.status === 'FINISHED').length;
    const reading    = entries.filter((e) => e.status === 'READING').length;
    const wishlist   = entries.filter((e) => e.status === 'WISHLIST').length;
    const reviewCount = reviews.length;
    const avgRating = reviewCount
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1)
      : null;

    res.json({
      user,
      stats: {
        finished,
        reading,
        wishlist,
        reviewCount,
        avgRating: avgRating ? parseFloat(avgRating) : null,
      },
      finishedEntries: entries.filter((e) => e.status === 'FINISHED'),
      reviews,
    });
  } catch (err) {
    console.error('User profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

module.exports = router;
