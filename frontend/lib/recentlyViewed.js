const KEY = 'br_recently_viewed';
const MAX = 6;

export function addRecentlyViewed(book) {
  if (!book?.googleBooksId) return;
  try {
    const current = getRecentlyViewed();
    const deduped = current.filter((b) => b.googleBooksId !== book.googleBooksId);
    const updated = [
      {
        googleBooksId: book.googleBooksId,
        title: book.title || '',
        author: book.author || '',
        coverUrl: book.coverUrl || null,
      },
      ...deduped,
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (SSR / private browsing)
  }
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
