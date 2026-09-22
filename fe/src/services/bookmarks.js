const BOOKMARKS_API = '/api/bookmarks';

export async function fetchUserBookmarks(token) {
  if (!token) return [];

  const res = await fetch(BOOKMARKS_API, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch bookmarks');
  }

  return json.data || [];
}

export async function toggleUserBookmark(bookId, token) {
  if (!token) {
    throw new Error('Silakan login terlebih dahulu untuk menyimpan buku.');
  }

  const res = await fetch(`${BOOKMARKS_API}/toggle/${bookId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to toggle bookmark');
  }

  return json; // { success: true, bookmarked: boolean, bookId }
}

