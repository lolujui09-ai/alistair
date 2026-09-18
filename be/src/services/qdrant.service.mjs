import { QdrantClient } from '@qdrant/js-client-rest';

let clientInstance = null;

/**
 * Mengambil singleton Qdrant client

 */
export function getQdrantClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const url = process.env.QDRANT_URL || 'http://localhost:6333';
  const apiKey = process.env.QDRANT_API_KEY || undefined;

  clientInstance = new QdrantClient({
    url,
    apiKey: apiKey && apiKey.trim() !== '' ? apiKey.trim() : undefined,
    checkCompatibility: false,
  });

  return clientInstance;
}

/**
 * Memeriksa apakah Qdrant bisa dihubungi
 */
export async function checkQdrantConnection() {
  const client = getQdrantClient();
  try {
    const res = await client.getCollections();
    return { ok: true, collections: res.collections?.map((c) => c.name) || [] };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Menghapus koleksi dari Qdrant
 * @param {string} [collectionName='books']
 */
export async function deleteCollection(collectionName = 'books') {
  const client = getQdrantClient();
  try {
    const { collections } = await client.getCollections();
    const exists = collections.some((c) => c.name === collectionName);
    if (exists) {
      console.log(`[Qdrant] Menghapus koleksi lama "${collectionName}"...`);
      await client.deleteCollection(collectionName);
      console.log(`[Qdrant] Koleksi "${collectionName}" berhasil dihapus.`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`[Qdrant] Peringatan saat menghapus koleksi "${collectionName}":`, error.message);
    return false;
  }
}

/**
 * Inisialisasi koleksi buku di Qdrant (384 dimensi, Cosine distance)
 * Jika koleksi sudah ada dan recreate false, proses inisialisasi dilewati
 * @param {string} [collectionName='books']
 * @param {boolean} [recreate=false]
 */
export async function initBooksCollection(collectionName = 'books', recreate = false) {
  const client = getQdrantClient();

  try {
    if (recreate) {
      await deleteCollection(collectionName);
    }

    const { collections } = await client.getCollections();
    const exists = collections.some((c) => c.name === collectionName);

    if (exists) {
      console.log(`[Qdrant] Koleksi "${collectionName}" sudah ada.`);
      return true;
    }

    console.log(`[Qdrant] Membuat koleksi baru "${collectionName}" (384 dimensi, Cosine)...`);
    await client.createCollection(collectionName, {
      vectors: {
        size: 384,
        distance: 'Cosine',
      },
    });

    // Buat index payload untuk filtering cepat
    try {
      await client.createPayloadIndex(collectionName, {
        field_name: 'type',
        field_schema: 'keyword',
      });
      await client.createPayloadIndex(collectionName, {
        field_name: 'genre',
        field_schema: 'text',
      });
    } catch {
      // Abaikan jika payload index belum didukung atau sudah ada
    }

    console.log(`[Qdrant] Koleksi "${collectionName}" berhasil dibuat.`);
    return true;
  } catch (error) {
    console.error(`[Qdrant] Gagal inisialisasi koleksi "${collectionName}":`, error.message);
    throw error;
  }
}

/**
 * Upsert points (kumpulan buku dengan vektor) ke Qdrant
 * @param {Array<{ id: number, vector: number[], payload: Object }>} points
 * @param {string} [collectionName='books']
 */
export async function upsertBooks(points, collectionName = 'books') {
  if (!points || points.length === 0) return;

  const client = getQdrantClient();
  return client.upsert(collectionName, {
    wait: true,
    points,
  });
}

/**
 * Melakukan semantic vector search untuk mencari buku paling relevan
 * @param {number[]} queryVector - Vektor embedding query pengguna (384 float)
 * @param {number} [limit=5] - Jumlah buku teratas yang diambil
 * @param {string} [collectionName='books']
 * @param {string|string[]|null} [filterType=null] - Filter tipe karya (misal 'Manhwa', 'Manga', ['Manhwa', 'Webtoon'])
 * @returns {Promise<Array<Object>>} - Daftar buku teratas dengan skor kemiripan
 */
export async function searchSimilarBooks(queryVector, limit = 5, collectionName = 'books', filterType = null) {
  const client = getQdrantClient();

  let filter = undefined;
  if (filterType) {
    if (Array.isArray(filterType) && filterType.length > 0) {
      filter = {
        should: filterType.map((t) => ({ key: 'type', match: { value: t } })),
      };
    } else if (typeof filterType === 'string' && filterType.trim()) {
      filter = {
        must: [{ key: 'type', match: { value: filterType.trim() } }],
      };
    }
  }

  try {
    let hits = [];
    if (typeof client.query === 'function') {
      const queryOptions = {
        query: queryVector,
        limit,
        with_payload: true,
      };
      if (filter) queryOptions.filter = filter;
      const response = await client.query(collectionName, queryOptions);
      hits = response.points || [];
    } else if (typeof client.search === 'function') {
      const searchOptions = {
        vector: queryVector,
        limit,
        with_payload: true,
      };
      if (filter) searchOptions.filter = filter;
      hits = await client.search(collectionName, searchOptions);
    }

    return hits.map((hit) => {
      const payload = hit.payload || {};
      return {
        id: payload.book_id || hit.id,
        title: payload.title || 'Untitled',
        author: payload.author || 'Unknown',
        type: payload.type || 'Manga',
        genre: payload.genre || '',
        cover_url: payload.cover_url || '',
        description: payload.description || '',
        score: hit.score,
      };
    });
  } catch (error) {
    console.error('[Qdrant] Search error:', error.message);
    throw error;
  }
}

