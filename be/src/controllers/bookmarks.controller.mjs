import pool from '../config/db.mjs';

/**
 * Mengambil daftar ID buku yang di-bookmark oleh user yang sedang login
 */
export async function getBookmarks(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT book_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const bookIds = rows.map((r) => Number(r.book_id));

    res.json({
      success: true,
      data: bookIds,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookmarks',
    });
  }
}

/**
 * Toggle bookmark: Menambahkan jika belum ada, atau menghapus jika sudah ada
 */
export async function toggleBookmark(req, res) {
  try {
    const userId = req.user.id;
    const bookId = parseInt(req.params.bookId, 10);

    if (isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookId',
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing.length > 0) {
      await pool.query(
        'DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?',
        [userId, bookId]
      );

      return res.json({
        success: true,
        bookmarked: false,
        bookId,
        message: 'Bookmark removed',
      });
    } else {
      await pool.query(
        'INSERT INTO bookmarks (user_id, book_id) VALUES (?, ?)',
        [userId, bookId]
      );

      return res.json({
        success: true,
        bookmarked: true,
        bookId,
        message: 'Bookmark added',
      });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
    });
  }
}

