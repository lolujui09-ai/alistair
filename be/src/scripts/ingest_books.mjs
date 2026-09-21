import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseBooksFromTxtStream, formatBookForEmbedding } from './txt_parser.mjs';
import { getBatchEmbeddings } from '../services/embedding.service.mjs';
import {
  checkQdrantConnection,
  initBooksCollection,
  upsertBooks,
} from '../services/qdrant.service.mjs';

const CHECKPOINT_FILE = path.resolve(process.cwd(), 'ingest_checkpoint.json');
const BATCH_SIZE = 50; // Jumlah buku per batch embedding & upsert

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      return data;
    } catch {
      return null;
    }
  }
  return null;
}

function saveCheckpoint(lastBookId, totalCount) {
  const data = {
    lastBookId,
    totalCount,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  console.log('='.repeat(65));
  console.log('       INGESTION DATA BUKU DARI TXT KE QDRANT (RAG)          ');
  console.log('='.repeat(65));

  // 1. Tentukan path file .txt sumber data
  let targetTxtPath = null;
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      if (arg === '--offset') i++; // lewati argumen nilai offset
      continue;
    }
    if (!targetTxtPath) {
      targetTxtPath = arg;
    }
  }

  if (!targetTxtPath) {
    const scriptDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
    const candidates = [
      // Di dalam folder scripts itu sendiri
      path.resolve(scriptDir, 'novels_embed.txt'),
      path.resolve(scriptDir, 'books_embed.txt'),
      path.resolve(scriptDir, 'books.txt'),
      // Di folder be/data atau be/
      path.resolve(process.cwd(), 'data/novels_embed.txt'),
      path.resolve(process.cwd(), 'data/books_embed.txt'),
      path.resolve(process.cwd(), 'data/books.txt'),
      path.resolve(process.cwd(), 'novels_embed.txt'),
      path.resolve(process.cwd(), 'books_embed.txt'),
      path.resolve(process.cwd(), 'books.txt'),
      // Di root project palistair/
      path.resolve(process.cwd(), '../novels_embed.txt'),
      path.resolve(process.cwd(), '../books_embed.txt'),
      path.resolve(process.cwd(), '../books.txt'),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        targetTxtPath = c;
        break;
      }
    }

    // Jika belum ketemu juga, cari file .txt apa saja yang ada di folder scripts
    if (!targetTxtPath && fs.existsSync(scriptDir)) {
      const files = fs.readdirSync(scriptDir);
      const txtFile = files.find((f) => f.endsWith('.txt'));
      if (txtFile) {
        targetTxtPath = path.resolve(scriptDir, txtFile);
      }
    }
  }

  if (!targetTxtPath || !fs.existsSync(targetTxtPath)) {
    console.error('\n[ERROR] File .txt sumber data tidak ditemukan!');
    console.log('Gunakan perintah: node src/scripts/ingest_books.mjs <path_ke_file_txt>');
    console.log('Contoh: node src/scripts/ingest_books.mjs src/scripts/novels_embed.txt');
    process.exit(1);
  }

  console.log(`\nSumber File : ${targetTxtPath}`);
  const stats = fs.statSync(targetTxtPath);
  console.log(`Ukuran File : ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  // 2. Periksa koneksi Qdrant
  console.log('\nMemeriksa koneksi ke Qdrant...');
  const connStatus = await checkQdrantConnection();
  if (!connStatus.ok) {
    console.error(`\n[ERROR] Tidak dapat terhubung ke Qdrant: ${connStatus.error}`);
    console.log('Pastikan QDRANT_URL dan QDRANT_API_KEY sudah benar di file .env');
    process.exit(1);
  }
  console.log(`[Qdrant] Terhubung. Koleksi yang ada: ${connStatus.collections.join(', ') || '(belum ada)'}`);

  // 3. Cek flag --reset dan --offset
  const shouldReset = process.argv.includes('--reset') || process.argv.includes('--recreate');
  if (shouldReset) {
    console.log('\n[RESET] Flag --reset terdeteksi. Menghapus koleksi Qdrant dan checkpoint lama...');
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
      console.log('[RESET] Checkpoint lama dihapus.');
    }
  }

  // Inisialisasi koleksi 'books'
  await initBooksCollection('books', shouldReset);

  // 4. Periksa Checkpoint & Hitung ID Offset
  const checkpoint = shouldReset ? null : loadCheckpoint();
  let idOffset = 0;

  const offsetArgIdx = process.argv.indexOf('--offset');
  if (offsetArgIdx !== -1 && process.argv[offsetArgIdx + 1]) {
    idOffset = parseInt(process.argv[offsetArgIdx + 1], 10) || 0;
    console.log(`[INFO] ID Offset manual disetel: +${idOffset}`);
  } else if (!shouldReset && checkpoint && checkpoint.lastBookId) {
    // Jika ada checkpoint dari proses batch buku sebelumnya, jadikan sebagai offset dasar
    idOffset = checkpoint.lastBookId;
    console.log(`[INFO] Menyambungkan ID dari file sebelumnya: ID Offset +${idOffset}`);
  }

  let startFromId = idOffset + 1;
  let totalProcessed = idOffset;

  if (checkpoint && checkpoint.lastBookId) {
    console.log(`\n[INFO] Ditemukan checkpoint sebelumnya:`);
    console.log(`Terakhir diproses : Buku ID #${checkpoint.lastBookId} (Total: ${checkpoint.totalCount || checkpoint.lastBookId})`);
    console.log(`Melanjutkan proses ingestion dari ID #${checkpoint.lastBookId + 1}...\n`);
    startFromId = checkpoint.lastBookId + 1;
    totalProcessed = checkpoint.totalCount || checkpoint.lastBookId;
  }

  // 5. Ingestion Loop
  let batchBuffer = [];
  let batchNumber = 0;
  const startTime = Date.now();

  async function processBatch(books) {
    if (books.length === 0) return;

    batchNumber++;
    const texts = books.map((b) => formatBookForEmbedding(b));

    // Generate embeddings
    const embeddings = await getBatchEmbeddings(texts);

    // Siapkan points untuk Qdrant
    const points = books.map((book, idx) => ({
      id: book.id,
      vector: embeddings[idx],
      payload: {
        book_id: book.id,
        title: book.title,
        author: book.author,
        type: book.type,
        genre: book.genre,
        cover_url: book.cover_url,
        description: (book.description || '').slice(0, 600),
      },
    }));

    // Upsert ke Qdrant
    await upsertBooks(points, 'books');

    totalProcessed += books.length;
    const lastId = books[books.length - 1].id;
    saveCheckpoint(lastId, totalProcessed);

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const speed = (totalProcessed / Math.max(1, elapsedSec)).toFixed(1);
    console.log(
      `[Batch ${batchNumber}] Berhasil embed & upsert ${books.length} buku. Total: ${totalProcessed} buku (ID #${lastId}) | ${speed} buku/detik`
    );
  }

  console.log('Mulai membaca dan memproses buku dari file .txt...\n');

  await parseBooksFromTxtStream(
    targetTxtPath,
    async (book) => {
      batchBuffer.push(book);
      if (batchBuffer.length >= BATCH_SIZE) {
        const toProcess = [...batchBuffer];
        batchBuffer = [];
        await processBatch(toProcess);
      }
    },
    { startFromId, idOffset }
  );

  // Proses sisa buffer
  if (batchBuffer.length > 0) {
    await processBatch(batchBuffer);
  }

  console.log('\n' + '='.repeat(65));
  console.log(`[SELESAI] Seluruh buku dari file .txt berhasil dimasukkan ke Qdrant!`);
  console.log(`Total buku tersimpan: ${totalProcessed}`);
  console.log('='.repeat(65));
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]:', err);
  process.exit(1);
});

