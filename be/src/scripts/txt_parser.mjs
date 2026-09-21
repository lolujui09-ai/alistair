import fs from 'fs';
import readline from 'readline';

/**
 * Format representasi teks buku yang optimal untuk embedding model
 * @param {Object} book
 * @returns {string}
 */
export function formatBookForEmbedding(book) {
  const parts = [];
  if (book.title) parts.push(`Title: ${book.title}`);
  if (book.type) parts.push(`Type: ${book.type}`);
  if (book.genre) parts.push(`Genre: ${book.genre}`);
  if (book.author && book.author !== 'Unknown') parts.push(`Author: ${book.author}`);
  if (book.description && !book.description.includes("doesn't have a synopsis")) {
    parts.push(`Synopsis: ${book.description}`);
  }
  return parts.join('. ');
}

/**
 * Membaca file .txt secara streaming dan mem-parse blok buku
 * Sangat hemat RAM karena memproses per baris menggunakan readline stream
 *
 * @param {string} filePath - Path ke file .txt (misal books_embed.txt)
 * @param {Function} onBookParsed - Callback yang dipanggil setiap kali 1 buku selesai di-parse: (book) => void
 * @param {Object} [options]
 * @param {number} [options.startFromId=1] - Lewati buku dengan ID sebelum nilai ini (untuk fitur resume checkpoint)
 * @returns {Promise<number>} - Mengembalikan total buku yang berhasil di-parse
 */
export async function parseBooksFromTxtStream(filePath, onBookParsed, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File sumber data tidak ditemukan di: ${filePath}`);
  }

  const { startFromId = 1, idOffset = 0 } = options;

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentBlockLines = [];
  let bookCounter = idOffset;
  let processedCounter = 0;

  function processBlock(lines) {
    if (lines.length === 0) return null;

    bookCounter++;

    // Jika sedang resume, lewati buku yang sudah diproses sebelumnya
    if (bookCounter < startFromId) {
      return null;
    }

    const book = {
      id: bookCounter,
      title: '',
      author: 'Unknown',
      type: 'Manga',
      genre: '',
      description: '',
      cover_url: '',
    };

    let readingDescription = false;
    let descLines = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const lower = trimmed.toLowerCase();

      if (lower.startsWith('author:') || lower.startsWith('penulis:')) {
        readingDescription = false;
        book.author = trimmed.replace(/^(author|penulis):\s*/i, '').trim() || 'Unknown';
      } else if (lower.startsWith('type:') || lower.startsWith('tipe:') || lower.startsWith('format:')) {
        readingDescription = false;
        book.type = trimmed.replace(/^(type|tipe|format):\s*/i, '').trim() || 'Manga';
      } else if (lower.startsWith('genre:')) {
        readingDescription = false;
        book.genre = trimmed.replace(/^genre:\s*/i, '').trim();
      } else if (lower.startsWith('description:') || lower.startsWith('deskripsi:') || lower.startsWith('synopsis:') || lower.startsWith('sinopsis:')) {
        readingDescription = true;
        const initialDesc = trimmed.replace(/^(description|deskripsi|synopsis|sinopsis):\s*/i, '').trim();
        descLines = initialDesc ? [initialDesc] : [];
      } else if (lower.startsWith('cover:') || lower.startsWith('image:') || lower.startsWith('gambar:')) {
        readingDescription = false;
        book.cover_url = trimmed.replace(/^(cover|image|gambar):\s*/i, '').trim();
      } else if (lower.startsWith('id:')) {
        readingDescription = false;
        const parsedId = parseInt(trimmed.replace(/^id:\s*/i, ''), 10);
        if (!isNaN(parsedId)) book.id = parsedId;
      } else if (readingDescription) {
        // Baris lanjutan dari deskripsi multi-line
        descLines.push(trimmed);
      } else if (!book.title) {
        // Baris pertama yang bukan metadata adalah judul
        book.title = trimmed.replace(/^(title|judul):\s*/i, '').trim();
      }
    }

    if (descLines.length > 0) {
      book.description = descLines.join(' ');
    }

    // Jika judul masih kosong, gunakan fallback
    if (!book.title && lines[0]) {
      book.title = lines[0].trim();
    }

    return book;
  }

  for await (const line of rl) {
    if (line.trim() === '') {
      if (currentBlockLines.length > 0) {
        const parsedBook = processBlock(currentBlockLines);
        currentBlockLines = [];
        if (parsedBook) {
          processedCounter++;
          await onBookParsed(parsedBook);
        }
      }
    } else {
      currentBlockLines.push(line);
    }
  }

  // Proses blok terakhir jika file tidak diakhiri baris kosong
  if (currentBlockLines.length > 0) {
    const parsedBook = processBlock(currentBlockLines);
    if (parsedBook) {
      processedCounter++;
      await onBookParsed(parsedBook);
    }
  }

  return processedCounter;
}

