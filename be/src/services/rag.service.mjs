import pool from '../config/db.mjs';
import { getEmbedding } from './embedding.service.mjs';
import { searchSimilarBooks } from './qdrant.service.mjs';
import { generateChatResponse } from './llm.service.mjs';

const ALISTAIR_SYSTEM_PROMPT = `Kamu adalah Alistair, kurator bacaan dan penjaga perpustakaan virtual yang berwawasan luas, ramah, hangat, dan bersahabat. Koleksi perpustakaanmu mencakup beragam karya: Manga, Manhwa, Manhua, Webtoon, Comic (Komik), Graphic Novel, dan Novel.

PEDOMAN UTAMA:
1. PENYEBUTAN TIPE KARYA (SANGAT PENTING):
   - JANGAN selalu menyebut setiap karya sebagai "buku". Hindari penggunaan kata "buku" kecuali karya tersebut memang bertipe buku umum atau pengunjung sendiri yang menyebutnya demikian.
   - Gunakan tipe spesifik dari karya yang sedang dibahas:
     * Jika tipenya Manga -> gunakan kata "manga" (misal: "manga Dandadan").
     * Jika tipenya Manhwa -> gunakan kata "manhwa" (misal: "manhwa Solo Leveling").
     * Jika tipenya Webtoon -> gunakan kata "webtoon".
     * Jika tipenya Manhua -> gunakan kata "manhua".
     * Jika tipenya Comic -> gunakan kata "komik".
     * Jika tipenya Novel -> gunakan kata "novel".
   - Jika pengunjung menanyakan tipe tertentu (contoh: "apa ada manhwa tentang..."), fokuslah menjawab dengan kata "manhwa" dan prioritaskan merekomendasikan karya bertipe Manhwa/Webtoon.

2. GAYA BICARA NATURAL & INDEPENDEN:
   - JANGAN PERNAH gunakan frasa kaku seperti "Berdasarkan katalog yang Anda berikan", "Saya melihat di katalog", atau "Dari data yang ada".
   - Berbicaralah layaknya kurator profesional yang memang mengenal dan hafal koleksi perpustakaannya sendiri (misal: "Tentu! Untuk manga Dandadan karya Yukinobu Tatsu, ceritanya sangat unik...", "Ada beberapa manhwa menarik di perpustakaan yang mengusung tema tersebut...").

3. KEDALAMAN DAN FOKUS JUDUL:
   - Jika pengunjung menanyakan judul spesifik yang ada di katalog, fokuslah membahas karya tersebut secara mendalam (sinopsis, keunikan, daya tarik cerita, karakter).
   - Jangan menyarankan judul-judul lain secara acak jika judul utama yang ditanyakan sudah ditemukan dan relevan.
   - Tetap spoiler-safe: jangan membocorkan ending atau plot twist fatal yang merusak pengalaman membaca.

4. GAYA BAHASA:
   - Gunakan Bahasa Indonesia yang santun, luwes, ekspresif, dan bersahabat.
   - Jaga jawaban agar informatif, terstruktur rapi, dan nyaman dibaca.`;

/**
 * Mendeteksi preferensi tipe karya dari pesan user (manga, manhwa, webtoon, dll.)
 */
function detectTargetType(text) {
  const lower = text.toLowerCase();
  if (/\b(manhwa)\b/i.test(lower)) return ['Manhwa', 'Webtoon'];
  if (/\b(webtoon)\b/i.test(lower)) return ['Webtoon', 'Manhwa'];
  if (/\b(manhua)\b/i.test(lower)) return ['Manhua'];
  if (/\b(manga)\b/i.test(lower)) return ['Manga', 'Comic'];
  if (/\b(komik|comic)\b/i.test(lower)) return ['Comic', 'Manga', 'Manhwa', 'Webtoon'];
  if (/\b(novel|light novel)\b/i.test(lower)) return ['Graphic Novel', 'Manga'];
  return null;
}

/**
 * Mengekstrak kandidat kata kunci / judul spesifik dari pertanyaan pengguna
 */
function extractTitleCandidates(text) {
  const candidates = [];

  // 1. Teks dalam tanda kutip (misal: "Solo Leveling", 'Dandadan', “Seijo-sama”)
  const quotes = text.match(/["'“‘”’]([^"'“‘”’]+)["'“‘”’]/g);
  if (quotes) {
    for (const q of quotes) {
      const clean = q.replace(/["'“‘”’]/g, '').trim();
      if (clean.length >= 2) candidates.push(clean);
    }
  }

  // 2. Pembersihan kata-kata pengantar/basa-basi
  const stopWords = /\b(apa|apakah|kamu|tau|tahu|tentang|ada|tolong|rekomendasi|rekomendasikan|carikan|cari|bisa|kah|dong|ya|ceritakan|info|sinopsis|review|analisis|mengenai|karya|oleh|buatan|buku|komik|manga|manhwa|manhua|webtoon|novel|bagaimanakah|bagaimana|siapa|pengarang|penulis)\b/gi;
  const cleaned = text
    .replace(stopWords, ' ')
    .replace(/[?!.,;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned && cleaned.length >= 2 && !candidates.includes(cleaned)) {
    candidates.push(cleaned);
  }

  // 3. Fallback: jika teks pendek (misal "dandadan" atau "one piece"), gunakan teks aslinya
  const rawClean = text.trim();
  if (rawClean.length <= 40 && !candidates.includes(rawClean)) {
    candidates.push(rawClean);
  }

  return candidates;
}

/**
 * Mencari karya di MySQL secara leksikal berdasarkan kemiripan judul
 */
async function searchMySQLBooks(candidates, preferredTypes = null) {
  if (!candidates || candidates.length === 0) return [];

  const foundMap = new Map();

  for (const cand of candidates) {
    if (!cand || cand.length < 2) continue;

    // Prioritas 1: Exact match title
    const [exactRows] = await pool.query(
      `SELECT id, title, author, type, genre, description, cover_url
       FROM books
       WHERE LOWER(title) = LOWER(?)
       LIMIT 3`,
      [cand]
    );
    for (const row of exactRows) {
      if (!foundMap.has(row.id)) foundMap.set(row.id, { ...row, matchType: 'exact' });
    }

    // Prioritas 2: Prefix atau Contains match
    const [likeRows] = await pool.query(
      `SELECT id, title, author, type, genre, description, cover_url
       FROM books
       WHERE title LIKE ? OR title LIKE ?
       ORDER BY 
         CASE 
           WHEN LOWER(title) = LOWER(?) THEN 1
           WHEN title LIKE ? THEN 2
           ELSE 3
         END
       LIMIT 5`,
      [`${cand}%`, `%${cand}%`, cand, `${cand}%`]
    );
    for (const row of likeRows) {
      if (!foundMap.has(row.id)) foundMap.set(row.id, { ...row, matchType: 'keyword' });
    }
  }

  const results = Array.from(foundMap.values());

  // Jika user meminta tipe tertentu, urutkan tipe yang cocok di posisi atas
  if (preferredTypes && preferredTypes.length > 0) {
    results.sort((a, b) => {
      const aMatches = preferredTypes.includes(a.type) ? 1 : 0;
      const bMatches = preferredTypes.includes(b.type) ? 1 : 0;
      return bMatches - aMatches;
    });
  }

  return results;
}

/**
 * Menyusun konteks karya yang relevan untuk LLM dengan tipe dinamis
 */
function buildWorksContext(works) {
  if (!works || works.length === 0) {
    return 'Saat ini tidak ada data karya spesifik yang ditemukan di katalog untuk pencarian ini.';
  }

  return works
    .map((work, index) => {
      const typeLabel = work.type || 'Karya';
      const parts = [
        `${index + 1}. [${typeLabel}] "${work.title}" (ID: #${work.id})`,
        `   Tipe: ${typeLabel} | Genre: ${work.genre || '-'} | Kreator/Penulis: ${work.author || 'Unknown'}`,
      ];
      if (work.description) {
        parts.push(`   Sinopsis: ${work.description.slice(0, 500)}`);
      }
      return parts.join('\n');
    })
    .join('\n\n');
}

/**
 * Memproses pertanyaan pengguna melalui Hybrid RAG (MySQL Lexical + Qdrant Vector)
 * @param {Object} params
 * @param {string} params.message - Pesan / pertanyaan dari user
 * @param {Array<{ role: string, content: string }>} [params.history=[]] - Riwayat percakapan sebelumnya
 * @param {Object} [params.attachedBook=null] - Karya spesifik yang dilampirkan user (misal dari tombol BookDetail)
 * @returns {Promise<{ reply: string, books: Array<Object> }>}
 */
export async function askAlistair({ message, history = [], attachedBook = null }) {
  if (!message || !message.trim()) {
    throw new Error('Pesan pertanyaan tidak boleh kosong');
  }

  const queryText = message.trim();

  // 1. Ekstraksi tipe karya yang diinginkan dan kandidat judul dari teks
  const preferredTypes = detectTargetType(queryText);
  const titleCandidates = extractTitleCandidates(queryText);

  // 2. Pencarian leksikal (keyword) di MySQL
  let mysqlBooks = [];
  try {
    mysqlBooks = await searchMySQLBooks(titleCandidates, preferredTypes);
  } catch (err) {
    console.warn('[RAG] Pencarian keyword MySQL gagal:', err.message);
  }

  // 3. Pencarian semantik (vektor) di Qdrant
  let vectorBooks = [];
  try {
    const queryVector = await getEmbedding(queryText);
    vectorBooks = await searchSimilarBooks(queryVector, 5, 'books', preferredTypes);
  } catch (err) {
    console.warn('[RAG] Pencarian vektor Qdrant tidak tersedia/gagal:', err.message);
  }

  // 4. Hybrid Merge & Re-ranking
  const finalMap = new Map();

  // A. Karya yang dilampirkan user secara eksplisit menjadi prioritas nomor 1
  if (attachedBook) {
    finalMap.set(attachedBook.id, attachedBook);
  }

  // B. Judul yang cocok persis (exact match) dari MySQL
  const exactMatches = mysqlBooks.filter((b) => b.matchType === 'exact');
  for (const b of exactMatches) {
    if (!finalMap.has(b.id)) finalMap.set(b.id, b);
  }
  const hasExactMatch = exactMatches.length > 0;

  // C. Sisa hasil pencarian keyword MySQL
  for (const b of mysqlBooks) {
    if (!finalMap.has(b.id)) finalMap.set(b.id, b);
    if (finalMap.size >= 5) break;
  }

  // D. Hasil pencarian vektor semantik Qdrant
  // Jika sudah ada exact match yang kuat, hanya sertakan hasil vektor jika skornya cukup tinggi
  for (const vb of vectorBooks) {
    if (!finalMap.has(vb.id)) {
      if (hasExactMatch && vb.score < 0.52) {
        continue; // abaikan judul luar jika judul spesifik sudah ditemukan
      }
      finalMap.set(vb.id, vb);
    }
    if (finalMap.size >= 5) break;
  }

  const finalWorks = Array.from(finalMap.values()).slice(0, 5);

  // 5. Susun Konteks Karya Relevan
  const contextString = buildWorksContext(finalWorks);

  // 6. Susun pesan untuk LLM
  const messages = [
    { role: 'system', content: ALISTAIR_SYSTEM_PROMPT },
  ];

  // Tambahkan riwayat obrolan jika ada (maksimal 6 percakapan terakhir)
  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-6);
    for (const h of recentHistory) {
      const role = h.role || (h.sender === 'user' ? 'user' : 'assistant');
      const content = h.content || h.text || '';
      if (content && (role === 'user' || role === 'assistant')) {
        messages.push({ role, content });
      }
    }
  }

  // Prompt terkini pengunjung beserta katalog relevan
  const augmentedPrompt = `[KATALOG KOLEKSI RELEVAN]\n${contextString}\n\n[PERTANYAAN PENGUNJUNG]\n${queryText}`;
  messages.push({ role: 'user', content: augmentedPrompt });

  // 7. Panggil Cloudflare Workers AI
  const reply = await generateChatResponse(messages);

  return {
    reply,
    books: finalWorks,
  };
}
