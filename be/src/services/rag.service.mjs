import pool from '../config/db.mjs';
import { getEmbedding } from './embedding.service.mjs';
import { searchSimilarBooks } from './qdrant.service.mjs';
import { generateChatResponse, generateChatStream } from './llm.service.mjs';

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
   - JANGAN PERNAH gunakan frasa kaku seperti "Berdasarkan katalog yang Anda berikan", "Saya melihat di katalog yang Anda berikan", atau "Dari data yang Anda berikan". Pengunjung adalah tamu perpustakaan yang sedang bertanya kepadamu, BUKAN pihak yang memberikan katalog data!
   - Jika suatu judul yang ditanyakan pengunjung belum ada di koleksi Alistair, gunakan ungkapan santun dan ramah:
     "Di daftar koleksi Explore-ku saat ini belum tersimpan judul itu..." atau "Di perpustakaan Alistair saat ini belum tersimpan judul tersebut...".
   - Setelah itu, jelaskan gambaran karya tersebut secara umum menggunakan wawasan literaturmu yang luas tanpa bertele-tele.

3. KEDALAMAN DAN FOKUS JUDUL:
   - Jika pengunjung menanyakan judul spesifik yang ada di katalog, fokuslah membahas karya tersebut secara mendalam (sinopsis, keunikan, daya tarik cerita, karakter).
   - Jangan menyarankan judul-judul lain secara acak jika judul utama yang ditanyakan sudah ditemukan dan relevan.
   - Tetap spoiler-safe: jangan membocorkan ending atau plot twist fatal yang merusak pengalaman membaca.

4. GAYA BAHASA:
   - Gunakan Bahasa Indonesia yang santun, luwes, ekspresif, dan bersahabat.
   - Jaga jawaban agar informatif, terstruktur rapi, dan nyaman dibaca.

5. KONSISTENSI RIWAYAT & PERTANYAAN LANJUTAN:
   - Jika pengunjung menanyakan rujukan dari karya yang baru saja dibahas (misal: "di mana bacanya", "yang pertama tadi ceritanya gimana", "siapa penulisnya", "rekomendasi kedua", atau komplain inkonsistensi), JANGAN PERNAH menyangkal bahwa karya tersebut ada di perpustakaan. Karya tersebut memang ada dan baru saja dibahas di sesi ini.
   - Jawablah pertanyaan pengunjung secara langsung dan spesifik mengenai karya yang sedang dibahas tersebut.

6. PANDUAN PERTANYAAN "DI MANA BISA BACA":
   - Jika pengunjung menanyakan di mana bisa membaca karya tertentu, arahkan secara ramah ke platform resmi/legal yang lazim sesuai tipe medianya:
     * Manhwa/Webtoon: sarankan platform resmi seperti LINE Webtoon, Tappytoon, KakaoPage, atau platform resmi penerbit.
     * Manga/Komik: sarankan platform resmi seperti MangaPlus by Shueisha, Shonen Jump, atau toko buku komik berlisensi resmi.
     * Novel: sarankan toko buku resmi (Gramedia, Kinokuniya), Google Play Books, atau situs web resmi penerbit/penulis.
   - Jelaskan dengan santun bahwa Alistair berfungsi sebagai kurator informasi/sinopsis dan katalog rekomendasi bacaan, sehingga pengunjung dapat membaca sinopsis, detail, dan genre lengkapnya langsung di halaman Explore Alistair.

7. PENGETAHUAN LITERATUR UMUM & URUTAN BACAAN:
   - Jika pengunjung menanyakan urutan novel/bacaan (contoh: urutan novel Harry Potter, Percy Jackson, Narnia), sejarah pengarang, fakta cerita, alur, istilah sastra, atau penjelasan karakter:
     * JAWABLAH SECARA LANGSUNG, TUNTAS, DAN LENGKAP menggunakan pengetahuan literaturmu yang luas!
     * JANGAN PERNAH menolak menjawab atau meminta maaf dengan alasan "tidak ada dalam katalog". Katalog perpustakaan adalah inventaris koleksi, BUKAN batasan wawasanmu. Pengunjung sedang meminta penjelasan pengetahuan, bukan sedang mencari stok inventaris!

8. KARTU REKOMENDASI KATALOG & FITUR BOOKMARK:
   - Kartu katalog disematkan di chat pada situasi:
     * Pengunjung meminta rekomendasi atau mencari karya tertentu yang tersedia di perpustakaan.
     * Pengunjung menanyakan keberadaan suatu karya di Explore / ingin mem-bookmark / menyimpan karya yang sedang dibahas.
   - Saat kartu katalog disematkan di chat, informasikan kepada pengunjung dengan ramah bahwa kartunya sudah kamu sematkan di bawah obrolan ini, dan mereka bisa langsung menekan tombol Bookmark/Simpan pada kartu tersebut untuk menyimpannya ke daftar bacaan favorit atau mengkliknya untuk membaca sinopsis lengkap.
   - JANGAN menyuruh pengunjung mencari manual ke halaman Explore jika kartunya sudah kamu sematkan langsung di chat!`;

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
  const stopWords = /\b(apa|apakah|afa|adakah|ada|ada nggak|ada gak|apakah punya|punya|kamu|tau|tahu|tentang|tolong|rekomendasi|rekomendasikan|carikan|cari|bisa|bias|kah|dong|ya|ceritakan|menceritakan|cerita|alur|info|sinopsis|review|analisis|mengenai|karya|oleh|buatan|buku|komik|manga|manhwa|manhua|webtoon|novel|bagaimanakah|bagaimana|siapa|pengarang|penulis|aku|saya|kita|ingin|mau|baca|tempat|link|di|ke|dari|pada|dalam|explore|koleksi|katalog|bookmark|membookmark|membookmarknya|simpan|favorit|disimpan|dibookmark)\b/gi;
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
    // Jangan jadikan rawClean sebagai kandidat jika isinya murni kata tanya explore/bookmark
    const isPureActionQuery = /^(apa ada di explore|aku ingin membookmarknya|bisa dibookmark|ada di explore)$/i.test(rawClean);
    if (!isPureActionQuery) {
      candidates.push(rawClean);
    }
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
 * Mengekstrak karya/buku yang baru saja dibahas dari riwayat obrolan
 * Memeriksa metadata.books terlebih dahulu, jika kosong mencari judul yang dibahas dari pesan terakhir via MySQL
 */
async function resolveRecentBooksFromHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];

  // 1. Cek metadata.books atau books dari pesan asisten terbaru
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'assistant' && msg.metadata) {
      try {
        const meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
        if (Array.isArray(meta.books) && meta.books.length > 0) {
          return meta.books;
        }
      } catch {
        // Abaikan parse error
      }
    }
    if (Array.isArray(msg.books) && msg.books.length > 0) {
      return msg.books;
    }
  }

  // 2. Jika metadata.books kosong (misal turn sebelumnya adalah KNOWLEDGE_EXPLANATION),
  // telusuri pesan terbaru (terutama pesan user atau assistant terakhir)
  const recentMessages = history.slice(-4);
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const text = recentMessages[i].content || recentMessages[i].text || '';
    if (!text) continue;

    const candidates = extractTitleCandidates(text);
    if (candidates.length > 0) {
      try {
        const mysqlMatches = await searchMySQLBooks(candidates.slice(0, 3));
        if (mysqlMatches.length > 0) {
          const exact = mysqlMatches.filter((b) => b.matchType === 'exact');
          return exact.length > 0 ? exact.slice(0, 3) : mysqlMatches.slice(0, 3);
        }
      } catch {
        // Abaikan jika error query
      }
    }
  }

  return [];
}

/**
 * Mengklasifikasikan intent pesan pengguna:
 * - 'CHIT_CHAT': sapaan, ucapan terima kasih, obrolan santai
 * - 'FOLLOW_UP': pertanyaan lanjutan seputar rekomendasi yang baru diberikan
 * - 'BOOK_DISCOVERY': pencarian / permintaan rekomendasi buku baru
 */
function classifyUserIntent(queryText, previousActiveBooks = []) {
  const rawLower = queryText.toLowerCase().trim();
  // Hilangkan sapaan nama "alistair" atau tanda baca untuk deteksi intent
  const lower = rawLower
    .replace(/\b(alistair|alis|min|admin|bot)\b/gi, ' ')
    .replace(/[!?.,;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Chit-chat / Greetings / Pleasantries / Meta questions
  const chitChatRegex = /^(halo|hai|hi|hello|hey|hei|p|assalamualaikum|selamat (pagi|siang|sore|malam)|kamu siapa|siapa kamu|siapa namamu|terima kasih|makasih|makasi|thanks|thank you|ok|oke|sip|siap|baiklah|keren|mantap|bisa apa|kamu bisa apa|bisa bantu apa|bantu apa saja)$/i;
  if (!lower || chitChatRegex.test(lower) || chitChatRegex.test(rawLower)) {
    return 'CHIT_CHAT';
  }

  // 2. Permintaan Bookmark / Simpan / Akses Explore / Minta Kartu
  const isBookmarkOrExplore = /(bookmark|membookmark|simpan|favorit|disimpan|dibookmark|di\s*explore|ada di explore|tersedia di explore|katalog|kartunya|tampilkan kartunya|mana kartunya)/i.test(rawLower);

  // 3. Pertanyaan di mana membaca
  const whereToReadRegex = /(dimana|di mana|dimanakah|di manakah|bisa baca|baca di mana|link baca|tempat baca|baca manga|baca novel|baca komik|baca manhwa).*(baca|bisa|akses|nemu|beli|cari)/i;
  const isWhereToRead = whereToReadRegex.test(rawLower) || /^(dimana|di mana) (aku|kita|saya)? ?(bisa|bias)? ?(baca|nonton|akses|dapatin|dapetin)/i.test(rawLower);

  // 4. Referensi ke rekomendasi sebelumnya ("rekomendasi pertama", "yang tadi", "nomor 1")
  const ordinalRefRegex = /(rekomendasi|judul|karya|pilihan)?\s*(pertama|ke-?1|ke-?2|ke-?3|kedua|ketiga|tadi|nomor 1|nomor 2|nomor 3|no 1|no 2|no 3)/i;
  const isOrdinalRef = ordinalRefRegex.test(rawLower);

  // 5. Klarifikasi atau komplain ("kenapa kamu bilang", "apa maksudmu")
  const isClarification = /(apa maksud|kenapa bilang|kenapa kamu bilang|tadi kamu bilang|maksudmu apa|kenapa tidak ada|kenapa nggak ada)/i.test(rawLower);

  // 6. Pertanyaan detail tentang karya yang sedang dibahas tanpa menyebut judul baru
  const isDetailQuestion = /(siapa|siapakah) (penulis|pengarang|author|pembuat)nya/i.test(rawLower) ||
                           /(apakah|apa) (sudah|udah) (tamat|selesai)/i.test(rawLower) ||
                           /(berapa|ada berapa) (chapter|bab|volume)/i.test(rawLower);

  if ((isBookmarkOrExplore || isWhereToRead || isOrdinalRef || isClarification || isDetailQuestion) && previousActiveBooks.length > 0) {
    return 'FOLLOW_UP';
  }

  if (isWhereToRead || isClarification) {
    return 'FOLLOW_UP';
  }

  // 7. Pertanyaan penjelasan, urutan novel/bacaan, trivia, lore, ringkasan, atau analisis umum
  const isExplanation = /(urutan|urutan baca|urutan rilis|urutan kronologis|alur cerita|sinopsis|ringkasan|jelaskan|ceritakan tentang|siapa itu|siapakah|maksud dari|arti dari|kenapa|mengapa|bagaimana cara|penjelasan|bedanya|perbedaan|latar belakang|ending|tamatnya|karakter)/i.test(rawLower);
  if (isExplanation) {
    return 'KNOWLEDGE_EXPLANATION';
  }

  return 'BOOK_DISCOVERY';
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
 * Menyiapkan konteks RAG dan struktur pesan untuk LLM
 */
export async function prepareRAGContext({ message, history = [], attachedBook = null }) {
  if (!message || !message.trim()) {
    throw new Error('Pesan pertanyaan tidak boleh kosong');
  }

  const queryText = message.trim();
  const previousActiveBooks = await resolveRecentBooksFromHistory(history);
  const intent = classifyUserIntent(queryText, previousActiveBooks);

  let finalWorks = [];
  let returnCatalogCards = false;
  let contextString = '';

  // KASUS 1: Buku dilampirkan secara eksplisit dari UI (misal tombol di BookDetail)
  if (attachedBook) {
    finalWorks = [attachedBook];
    contextString = `[KARYA YANG SEDANG DITANYAKAN SECARA KHUSUS]:\n${buildWorksContext(finalWorks)}`;
    returnCatalogCards = false; // User sudah berada di halaman detail buku tersebut
  }
  // KASUS 2: Pertanyaan lanjutan / Follow-up dari rekomendasi yang sudah diberikan
  else if (intent === 'FOLLOW_UP' && previousActiveBooks.length > 0) {
    finalWorks = previousActiveBooks.slice(0, 3);

    // Cek apakah pengunjung menanyakan bookmark, simpan, ketersediaan di explore, atau meminta kartu
    const isBookmarkOrExplore = /(bookmark|membookmark|simpan|favorit|disimpan|dibookmark|di\s*explore|ada di explore|tersedia di explore|katalog|kartu|kartunya|tampilkan|munculkan)/i.test(queryText);

    if (isBookmarkOrExplore) {
      returnCatalogCards = true; // WAJIB tampilkan kartu agar user bisa langsung klik bookmark / buka detail!
      contextString = `[KARYA DI EXPLORE YANG INGIN DIBOOKMARK / DILIHAT PENGUNJUNG]:\n${buildWorksContext(finalWorks)}\n\n(Catatan: Pengunjung menanyakan apakah karya yang sedang dibahas ("${finalWorks[0].title}") ada di Explore Alistair dan ingin menyimpannya / mem-bookmark-nya. Konfirmasi dengan ramah dan hangat bahwa karya tersebut memang tersedia di Explore Alistair dan kartu rekomendasinya telah kamu sematkan di chat ini, sehingga pengunjung dapat langsung menekan tombol Bookmark/Simpan di kartu tersebut tanpa perlu mencari manual).`;
    } else {
      returnCatalogCards = false; // Pertanyaan lore/detail/platform tidak perlu spam kartu duplikat
      contextString = `[KARYA YANG SEDANG DIBAHAS BERSAMA PENGUNJUNG]:\n${buildWorksContext(finalWorks)}\n\n(Catatan: Pengunjung sedang menanyakan hal lanjutan seputar karya di atas. Jawablah langsung secara konsisten dan jangan menyangkal keberadaannya).`;
    }
  }
  // KASUS 3: Sapaan umum / Basa-basi santai (Chit-Chat)
  else if (intent === 'CHIT_CHAT') {
    finalWorks = [];
    contextString = `[PENGUNJUNG MENYAPA / MENGOBROL SANTAI]: Jawablah dengan ramah, hangat, dan siap membantu merekomendasikan karya jika pengunjung menginginkannya.`;
    returnCatalogCards = false; // PENTING: Jangan munculkan kartu buku pada sapaan umum!
  }
  // KASUS 4: Pertanyaan Penjelasan / Urutan Bacaan / Lore / Fakta Sastra (KNOWLEDGE_EXPLANATION)
  else if (intent === 'KNOWLEDGE_EXPLANATION') {
    // Periksa apakah ada karya terkait di MySQL untuk memperkaya referensi
    const titleCandidates = extractTitleCandidates(queryText);
    const preferredTypes = detectTargetType(queryText);
    let mysqlBooks = [];
    try {
      mysqlBooks = await searchMySQLBooks(titleCandidates, preferredTypes);
    } catch {
      // Abaikan jika error
    }

    finalWorks = mysqlBooks.slice(0, 3);
    if (finalWorks.length > 0) {
      contextString = `[KARYA TERKAIT DI INVENTARIS PERPUSTAKAAN]:\n${buildWorksContext(finalWorks)}\n\n(Catatan: Pengunjung meminta penjelasan/urutan bacaan/fakta. Jelaskan secara tuntas, runtut, dan lengkap apa yang ditanyakan pengunjung menggunakan wawasan literaturmu. Sebutkan juga secara sekilas jika karya terkait ada di koleksi Alistair).`;
    } else {
      contextString = `(Catatan: Pengunjung meminta penjelasan/urutan bacaan/fakta literatur mengenai topik tersebut. Jelaskan secara langsung, tuntas, runtut, dan informatif menggunakan wawasan literaturmu. JANGAN meminta maaf atau mengatakan "tidak ada di katalog" karena pengunjung meminta penjelasan pengetahuan, bukan pencarian inventaris fisik).`;
    }
    returnCatalogCards = false; // Pertanyaan penjelasan tidak perlu memunculkan kartu rekomendasi
  }
  // KASUS 5: Pencarian / Rekomendasi Buku Baru (BOOK_DISCOVERY)
  else {
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
      // Bersihkan kata tanya pengantar agar embedding fokus ke esensi semantik
      const semanticQueryText = queryText
        .replace(/^(apa ada|apakah ada|tolong carikan|carikan|rekomendasikan|rekomendasi|ada nggak|ada gak)\s+/i, '')
        .trim() || queryText;

      const queryVector = await getEmbedding(semanticQueryText);
      vectorBooks = await searchSimilarBooks(queryVector, 5, 'books', preferredTypes);
    } catch (err) {
      console.warn('[RAG] Pencarian vektor Qdrant tidak tersedia/gagal:', err.message);
    }

    // 4. Hybrid Merge & Re-ranking dengan Ambang Batas Skor (Similarity Threshold)
    const finalMap = new Map();

    // A. Judul yang cocok persis (exact match) dari MySQL
    const exactMatches = mysqlBooks.filter((b) => b.matchType === 'exact');
    for (const b of exactMatches) {
      if (!finalMap.has(b.id)) finalMap.set(b.id, b);
    }
    const hasExactMatch = exactMatches.length > 0;

    // B. Sisa hasil pencarian keyword MySQL
    for (const b of mysqlBooks) {
      if (!finalMap.has(b.id)) finalMap.set(b.id, b);
      if (finalMap.size >= 5) break;
    }

    // C. Hasil pencarian vektor semantik Qdrant (dengan ambang batas skor 0.44)
    for (const vb of vectorBooks) {
      if (!finalMap.has(vb.id)) {
        // Jika tidak ada exact match dan skornya sangat rendah (< 0.44), anggap noise dan abaikan
        if (!hasExactMatch && vb.score && vb.score < 0.44) {
          continue;
        }
        if (hasExactMatch && vb.score && vb.score < 0.52) {
          continue; // Abaikan judul luar jika judul spesifik sudah ditemukan
        }
        finalMap.set(vb.id, vb);
      }
      if (finalMap.size >= 5) break;
    }

    // Cek apakah pengunjung menanyakan keberadaan judul tertentu (misal: "apa ada manga fate", "ada komik naruto nggak")
    const isTitleCheck = /^(apa ada|apakah ada|afa ada|ada nggak|ada gak|apakah punya|punya|ada)\s+(manga|manhwa|manhua|webtoon|novel|komik|buku)?\s+/i.test(queryText.trim());
    const targetTitle = (titleCandidates && titleCandidates.length > 0) ? titleCandidates[0].toLowerCase() : null;

    if (isTitleCheck && targetTitle) {
      // Jika pengguna menanyakan judul tertentu, pastikan karya yang masuk ke finalWorks
      // benar-benar memiliki judul atau sinopsis yang memuat kata targetTitle tersebut.
      // Hal ini mencegah false-positive Qdrant (seperti buku tanpa sinopsis yang skor kosinusnya tinggi secara semu).
      finalWorks = Array.from(finalMap.values()).filter((b) => {
        const titleLower = (b.title || '').toLowerCase();
        const descLower = (b.description || '').toLowerCase();
        return titleLower.includes(targetTitle) || descLower.includes(targetTitle);
      }).slice(0, 5);
    } else {
      finalWorks = Array.from(finalMap.values()).slice(0, 5);
    }

    const isExplicitRequest = /(rekomendasi|rekomendasikan|carikan|cari|saran|daftar|list|pilihan|cocok|tampilkan|kartu|kartunya)/i.test(queryText);
    const isBookmarkOrExplore = /(bookmark|membookmark|simpan|favorit|disimpan|dibookmark|di\s*explore|ada di explore|tersedia di explore|katalog)/i.test(queryText);

    // Fallback: Jika pencarian teks baru tidak menemukan buku tetapi ada karya aktif di riwayat sebelumnya
    // dan user menanyakan bookmark/explore/kartu:
    if (finalWorks.length === 0 && previousActiveBooks.length > 0 && (isBookmarkOrExplore || isExplicitRequest)) {
      finalWorks = previousActiveBooks.slice(0, 3);
    }

    if (finalWorks.length > 0) {
      contextString = `[KATALOG KOLEKSI RELEVAN]\n${buildWorksContext(finalWorks)}`;
      // Tampilkan kartu katalog HANYA jika:
      // 1. Pengguna memang secara eksplisit meminta rekomendasi / bookmark / explore / tampilkan kartu
      // 2. ATAU judul spesifik yang dicari memang ditemukan dan cocok
      returnCatalogCards = isExplicitRequest || isBookmarkOrExplore || hasExactMatch || (isTitleCheck && finalWorks.length > 0);
    } else {
      const missingTitleHint = targetTitle ? `judul "${titleCandidates[0]}"` : 'karya dengan kriteria tersebut';
      contextString = `[INFO KOLEKSI EXPLORE]: Di daftar koleksi Explore Alistair saat ini belum tersimpan ${missingTitleHint}. Sampaikan secara ramah menggunakan ungkapan persis: "Di daftar koleksi Explore-ku saat ini belum tersimpan judul itu...", lalu berikan penjelasan umum mengenai karya tersebut dari wawasan literaturmu. JANGAN menampilkan kartu rekomendasi acak yang tidak sesuai.`;
      returnCatalogCards = false; // Jangan munculkan kartu jika judulnya tidak ada!
    }
  }

  // 5. Susun pesan untuk LLM
  // PENTING: Masukkan konteks inventaris ke dalam SYSTEM prompt, BUKAN ke dalam pesan user!
  // Dengan cara ini, AI tidak akan pernah menganggap konteks sebagai "data yang diberikan oleh user".
  let systemPromptWithContext = ALISTAIR_SYSTEM_PROMPT;
  if (contextString) {
    systemPromptWithContext += `\n\n----------------------------------------\n[KONTEKS INVENTARIS PERPUSTAKAAN]:\n${contextString}`;
  }

  const messages = [
    { role: 'system', content: systemPromptWithContext },
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

  // Pesan user HANYA berisi pertanyaan pengunjung asli tanpa manipulasi teks katalog
  messages.push({ role: 'user', content: queryText });

  return {
    messages,
    finalWorks,
    returnCatalogCards,
  };
}

/**
 * Memproses pertanyaan pengguna melalui Hybrid RAG (Non-streaming response)
 * @param {Object} params
 * @param {string} params.message - Pesan / pertanyaan dari user
 * @param {Array<{ role: string, content: string, metadata?: any }>} [params.history=[]] - Riwayat percakapan sebelumnya
 * @param {Object} [params.attachedBook=null] - Karya spesifik yang dilampirkan user (misal dari tombol BookDetail)
 * @returns {Promise<{ reply: string, books: Array<Object> }>}
 */
export async function askAlistair({ message, history = [], attachedBook = null }) {
  const { messages, finalWorks, returnCatalogCards } = await prepareRAGContext({
    message,
    history,
    attachedBook,
  });

  const reply = await generateChatResponse(messages);

  return {
    reply,
    books: returnCatalogCards ? finalWorks : [],
  };
}

/**
 * Memproses pertanyaan pengguna melalui Hybrid RAG (Streaming response)
 * Mengembalikan generator token stream dan daftar buku rekomendasi yang relevan
 * @param {Object} params
 * @param {string} params.message - Pesan / pertanyaan dari user
 * @param {Array<{ role: string, content: string, metadata?: any }>} [params.history=[]] - Riwayat percakapan sebelumnya
 * @param {Object} [params.attachedBook=null] - Karya spesifik yang dilampirkan user (misal dari tombol BookDetail)
 * @returns {Promise<{ streamGenerator: AsyncGenerator<string>, books: Array<Object> }>}
 */
export async function askAlistairStream({ message, history = [], attachedBook = null }) {
  const { messages, finalWorks, returnCatalogCards } = await prepareRAGContext({
    message,
    history,
    attachedBook,
  });

  const streamGenerator = generateChatStream(messages);

  return {
    streamGenerator,
    books: returnCatalogCards ? finalWorks : [],
  };
}
