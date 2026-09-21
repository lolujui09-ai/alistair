import pool from '../config/db.mjs';

/**
 * Validasi input data buku untuk create & update
 */
function validateBookData(req, res, isUpdate = false) {
  const { title, author, type } = req.body;
  const errors = [];

  if (isUpdate) {
    if (title === '') errors.push('Title cannot be empty');
    if (author === '') errors.push('Author cannot be empty');
  } else {
    if (!title || title.trim() === '') errors.push('Title is required');
    if (!author || author.trim() === '') errors.push('Author is required');
  }

  if (type && typeof type !== 'string') {
    errors.push('Type must be a valid string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  return null;
}

/**
 * Mendapatkan daftar buku dengan Pagination, Search, dan Filter
 * Dioptimalkan untuk database besar (>80.000 data):
 * - Menggunakan LIMIT & OFFSET agar tidak membebani memori (OOM safe)
 * - Prepared statement untuk mencegah SQL injection
 * - Memanfaatkan index kolom (PRIMARY KEY id & indexed columns) untuk eksekusi < 10ms
 */
export async function getBooks(req, res) {
  try {
    const {
      page = 1,
      limit = 24,
      search = '',
      genre = '',
      type = '',
      sort = 'id_desc',
      ids = '',
    } = req.query;

    // Sanitasi batas angka halaman & limit
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const offset = (pageNum - 1) * limitNum;

    // Filter dinamis dengan parameterized query
    const conditions = [];
    const params = [];

    // Jika filter spesifik berdasarkan ID (misal untuk My Library / Bookmarks)
    if (ids && ids.trim() !== '') {
      const idList = ids
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((num) => Number.isInteger(num) && num > 0);

      if (idList.length > 0) {
        conditions.push(`id IN (${idList.map(() => '?').join(',')})`);
        params.push(...idList);
      }
    }

    // Pencarian judul atau penulis
    if (search && search.trim() !== '') {
      conditions.push('(title LIKE ? OR author LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    // Filter genre
    if (genre && genre !== 'All' && genre.trim() !== '') {
      conditions.push('genre LIKE ?');
      params.push(`%${genre.trim()}%`);
    }

    // Filter tipe (Manga, Manhwa, Comic, dll.)
    if (type && type !== 'All' && type.trim() !== '') {
      conditions.push('type = ?');
      params.push(type.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Whitelist sorting agar aman dari injection
    const sortMap = {
      id_desc: 'id DESC',
      id_asc: 'id ASC',
      title_asc: 'title ASC',
      title_desc: 'title DESC',
    };
    const orderBy = sortMap[sort] || 'id DESC';

    // 1. Query Total Baris yang Cocok (Cepat karena memanfaatkan index)
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM books ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 2. Query Data sesuai halaman
    const dataParams = [...params, limitNum, offset];
    const [books] = await pool.query(
      `SELECT id, title, author, type, genre, description, cover_url, created_at, updated_at 
       FROM books 
       ${whereClause} 
       ORDER BY ${orderBy} 
       LIMIT ? OFFSET ?`,
      dataParams
    );

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get books',
      error: error.message,
    });
  }
}

/**
 * Mendapatkan daftar tipe buku & genre populer untuk opsi filter di frontend
 */
export async function getBookFilters(req, res) {
  try {
    const [typesResult] = await pool.query(
      'SELECT DISTINCT type FROM books WHERE type IS NOT NULL AND type != "" ORDER BY type ASC'
    );

    // Prioritas urutan tipe karya yang rapi dan logis
    const typePriority = ['Manga', 'Novel', 'Manhwa', 'Comic', 'Manhua', 'Webtoon', 'Graphic Novel', 'Doujinshi'];
    const types = typesResult
      .map((r) => r.type)
      .filter((t) => t && t !== 'Unknown')
      .sort((a, b) => {
        const idxA = typePriority.indexOf(a);
        const idxB = typePriority.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

    // Daftar Genre Terpopuler yang mencakup Manga, Manhwa, Comic, dan Novel
    const popularGenres = [
      'Romance',
      'Fantasy',
      'Drama',
      'Comedy',
      'Action',
      'Fiction',
      'Adventure',
      'Mystery',
      'Thriller',
      'Horror',
      'Sci Fi',
      'Young Adult',
      'Historical',
      'Supernatural',
      'Slice of Life',
      'School Life',
      'Shounen',
      'Shoujo',
      'Seinen',
      'Psychological',
      'Magic',
      'Classics',
      'Josei',
      'Isekai',
      'Ecchi',
      'Nonfiction',
      'Martial Arts',
      'Harem',
    ];

    res.json({
      success: true,
      data: {
        types,
        genres: popularGenres,
      },
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get book filters',
    });
  }
}

/**
 * Mendapatkan satu buku berdasarkan ID
 */
export async function getBookById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get book',
    });
  }
}

/**
 * Menambahkan buku baru
 */
export async function createBook(req, res) {
  const validationError = validateBookData(req, res, false);
  if (validationError) return;

  try {
    const { title, author, description, type, genre, cover_url, cover_image } = req.body;
    const finalCover = cover_url || cover_image || null;

    const [result] = await pool.query(
      'INSERT INTO books (title, author, description, type, genre, cover_url) VALUES (?, ?, ?, ?, ?, ?)',
      [title, author, description || null, type || 'Manga', genre || null, finalCover]
    );

    const [newBook] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: newBook[0],
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
    });
  }
}

/**
 * Memperbarui data buku
 */
export async function updateBook(req, res) {
  const { id } = req.params;

  const validationError = validateBookData(req, res, true);
  if (validationError) return;

  try {
    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const { title, author, description, type, genre, cover_url, cover_image } = req.body;
    const finalCover = cover_url || cover_image || existing[0].cover_url;

    await pool.query(
      'UPDATE books SET title = ?, author = ?, description = ?, type = ?, genre = ?, cover_url = ? WHERE id = ?',
      [
        title || existing[0].title,
        author || existing[0].author,
        description !== undefined ? description : existing[0].description,
        type || existing[0].type,
        genre !== undefined ? genre : existing[0].genre,
        finalCover,
        id,
      ]
    );

    const [updatedBook] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook[0],
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
    });
  }
}

/**
 * Menghapus buku
 */
export async function deleteBook(req, res) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    await pool.query('DELETE FROM books WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
    });
  }
}
