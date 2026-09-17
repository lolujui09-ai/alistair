const API_BASE_URL = '/api';

/**
 * Mengambil daftar buku dari backend dengan paginasi, pencarian, dan filter
 * @param {Object} options
 * @param {number} [options.page=1] - Nomor halaman
 * @param {number} [options.limit=24] - Jumlah buku per halaman (maks 100)
 * @param {string} [options.search=''] - Kata kunci pencarian judul / penulis
 * @param {string} [options.genre='All'] - Filter genre
 * @param {string} [options.type='All'] - Filter tipe (Manga, Manhwa, Comic, dll.)
 * @param {string} [options.sort='id_desc'] - Urutan sorting
 * @param {Array<number>|string} [options.ids=null] - Daftar ID spesifik (untuk My Library)
 * @returns {Promise<{ success: boolean, data: Array, pagination: Object }>}
 */
export async function fetchBooks({
  page = 1,
  limit = 24,
  search = '',
  genre = 'All',
  type = 'All',
  sort = 'id_desc',
  ids = null,
} = {}) {
  const params = new URLSearchParams();

  params.set('page', page.toString());
  params.set('limit', limit.toString());

  if (search && search.trim()) {
    params.set('search', search.trim());
  }

  if (genre && genre !== 'All') {
    params.set('genre', genre);
  }

  if (type && type !== 'All') {
    params.set('type', type);
  }

  if (sort) {
    params.set('sort', sort);
  }

  if (ids) {
    const idString = Array.isArray(ids) ? ids.join(',') : ids.toString();
    if (idString.trim()) {
      params.set('ids', idString);
    }
  }

  const response = await fetch(`${API_BASE_URL}/books?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch books: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mengambil detail satu buku berdasarkan ID
 * @param {number|string} id
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export async function fetchBookById(id) {
  const response = await fetch(`${API_BASE_URL}/books/${id}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch book #${id}`);
  }

  return response.json();
}

/**
 * Mengambil metadata filter (tipe dan genre) yang tersedia di database
 * @returns {Promise<{ success: boolean, data: { types: string[], genres: string[] } }>}
 */
export async function fetchBookFilters() {
  const response = await fetch(`${API_BASE_URL}/books/filters`);

  if (!response.ok) {
    throw new Error('Failed to fetch book filters');
  }

  return response.json();
}

