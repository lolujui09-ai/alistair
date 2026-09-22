import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function getLocalConfig() {
  return {
    host: process.env.LOCAL_DB_HOST || 'localhost',
    port: parseInt(process.env.LOCAL_DB_PORT || '3306', 10),
    user: process.env.LOCAL_DB_USER || 'root',
    password: process.env.LOCAL_DB_PASSWORD !== undefined ? process.env.LOCAL_DB_PASSWORD : 'root',
    database: process.env.LOCAL_DB_NAME || 'alistair',
    waitForConnections: true,
    connectionLimit: 5,
  };
}

function getTiDBConfig() {
  let tidbUrl = process.env.TIDB_DATABASE_URL || process.env.DATABASE_URL || process.env.TIDB_URL;

  if (tidbUrl) {
    tidbUrl = tidbUrl.trim().replace(/^["']|["']$/g, '');
    const parsed = new URL(tidbUrl);
    let db = parsed.pathname.replace(/^\//, '');
    if (!db || db === 'sys' || db === 'mysql' || db === 'test') {
      db = process.env.DB_NAME || 'alistair';
    }
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '4000', 10),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: db,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
    };
  }

  // Jika diisi via parameter individual (DB_HOST dsb)
  if (process.env.DB_HOST && (process.env.DB_HOST.includes('tidbcloud.com') || process.env.DB_PORT === '4000')) {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '4000', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'alistair',
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
    };
  }

  throw new Error('TiDB connection link tidak ditemukan di file .env. Harap isi TIDB_DATABASE_URL="mysql://..." di be/.env!');
}

const TABLE_SCHEMAS = [
  {
    name: 'users',
    sql: `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(255) NOT NULL,
      \`password\` VARCHAR(255) NOT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_users_email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    name: 'books',
    sql: `CREATE TABLE IF NOT EXISTS \`books\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`title\` VARCHAR(255) NOT NULL,
      \`author\` VARCHAR(255) NOT NULL,
      \`type\` VARCHAR(50) NOT NULL,
      \`genre\` VARCHAR(100) NOT NULL,
      \`description\` TEXT DEFAULT NULL,
      \`cover_url\` VARCHAR(2048) DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_books_type\` (\`type\`),
      KEY \`idx_books_title\` (\`title\`(100))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    name: 'comic_books',
    sql: `CREATE TABLE IF NOT EXISTS \`comic_books\` (
      \`id\` BIGINT UNSIGNED NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`author\` VARCHAR(255) DEFAULT NULL,
      \`type\` VARCHAR(50) DEFAULT NULL,
      \`genre\` VARCHAR(100) DEFAULT NULL,
      \`description\` TEXT DEFAULT NULL,
      \`cover_url\` VARCHAR(2048) DEFAULT NULL,
      \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    name: 'chat_sessions',
    sql: `CREATE TABLE IF NOT EXISTS \`chat_sessions\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` BIGINT UNSIGNED NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`is_pinned\` TINYINT(1) NOT NULL DEFAULT 0,
      \`is_archived\` TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_chat_sessions_user_id\` (\`user_id\`),
      CONSTRAINT \`fk_chat_sessions_user\` FOREIGN KEY (\`user_id\`)
        REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    name: 'chat_messages',
    sql: `CREATE TABLE IF NOT EXISTS \`chat_messages\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`session_id\` BIGINT UNSIGNED NOT NULL,
      \`role\` ENUM('user', 'assistant') NOT NULL,
      \`content\` TEXT NOT NULL,
      \`metadata\` JSON DEFAULT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_chat_messages_session_id\` (\`session_id\`),
      CONSTRAINT \`fk_chat_messages_session\` FOREIGN KEY (\`session_id\`)
        REFERENCES \`chat_sessions\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    name: 'bookmarks',
    sql: `CREATE TABLE IF NOT EXISTS \`bookmarks\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` BIGINT UNSIGNED NOT NULL,
      \`book_id\` BIGINT UNSIGNED NOT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_bookmarks_user_book\` (\`user_id\`, \`book_id\`),
      KEY \`idx_bookmarks_book_id\` (\`book_id\`),
      CONSTRAINT \`fk_bookmarks_user\` FOREIGN KEY (\`user_id\`)
        REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`fk_bookmarks_book\` FOREIGN KEY (\`book_id\`)
        REFERENCES \`books\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
];

export async function migrateLocalToTiDB() {
  console.log('====================================================');
  console.log('  MIGRASI DATABASE LOKAL MYSQL KE TiDB CLOUD');
  console.log('====================================================\n');

  const localConfig = getLocalConfig();
  const tidbConfig = getTiDBConfig();

  console.log(`[1/5] Menghubungkan ke MySQL Lokal (${localConfig.host}:${localConfig.port}/${localConfig.database})...`);
  const localPool = mysql.createPool(localConfig);
  const [localCheck] = await localPool.query('SELECT DATABASE() as db, COUNT(*) as cnt FROM books');
  console.log(`      MySQL Lokal terhubung! Koleksi buku lokal: ${localCheck[0].cnt.toLocaleString()} data.\n`);

  console.log(`[2/5] Menghubungkan ke TiDB Cloud (${tidbConfig.host}:${tidbConfig.port})...`);
  const targetDb = tidbConfig.database || 'alistair';

  // Pastikan database target sudah dibuat di TiDB Cloud
  try {
    const initPool = mysql.createPool({ ...tidbConfig, database: 'test' });
    await initPool.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\``);
    await initPool.end();
  } catch (err) {
    // Abaikan jika sudah ada atau izin CREATE dibatasi
  }

  const tidbPool = mysql.createPool(tidbConfig);
  const [tidbVer] = await tidbPool.query('SELECT VERSION() as v, DATABASE() as db');
  console.log(`      TiDB Cloud terhubung! Versi: ${tidbVer[0].v} | Database aktif: ${tidbVer[0].db}\n`);

  // Buat tabel di TiDB jika belum ada
  console.log('[3/5] Membuat skema tabel di TiDB Cloud...');
  for (const t of TABLE_SCHEMAS) {
    await tidbPool.query(t.sql);
    console.log(`      - Tabel "${t.name}" siap.`);
  }
  console.log('');

  // Transfer data tabel per tabel
  console.log('[4/5] Memulai transfer data dari lokal ke TiDB Cloud...\n');

  // A. Tabel users
  console.log('--- Mentransfer tabel "users" ---');
  const [users] = await localPool.query('SELECT * FROM users ORDER BY id ASC');
  if (users.length > 0) {
    for (const u of users) {
      await tidbPool.query(
        'INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [u.id, u.name, u.email, u.password, u.created_at, u.updated_at]
      );
    }
    console.log(`    Berhasil mentransfer ${users.length} pengguna.`);
  } else {
    console.log('    Tabel users kosong.');
  }

  // B. Tabel books (Bulk transfer in batches of 1000)
  console.log('\n--- Mentransfer tabel "books" (100.994 data) ---');
  const [bookCountRow] = await localPool.query('SELECT COUNT(*) as total FROM books');
  const totalBooks = bookCountRow[0].total;
  const BATCH_SIZE = 1000;
  let lastId = 0;
  let transferredBooks = 0;

  while (true) {
    const [batch] = await localPool.query(
      'SELECT id, title, author, type, genre, description, cover_url, created_at, updated_at FROM books WHERE id > ? ORDER BY id ASC LIMIT ?',
      [lastId, BATCH_SIZE]
    );

    if (batch.length === 0) break;

    const values = batch.map((b) => [
      b.id,
      b.title,
      b.author || 'Unknown',
      b.type || 'Manga',
      b.genre || '-',
      b.description || null,
      b.cover_url || null,
      b.created_at ? new Date(b.created_at) : new Date(),
      b.updated_at ? new Date(b.updated_at) : new Date(),
    ]);

    await tidbPool.query(
      'INSERT IGNORE INTO books (id, title, author, type, genre, description, cover_url, created_at, updated_at) VALUES ?',
      [values]
    );

    lastId = batch[batch.length - 1].id;
    transferredBooks += batch.length;

    const pct = ((transferredBooks / totalBooks) * 100).toFixed(1);
    process.stdout.write(`\r    Progress books: ${transferredBooks.toLocaleString()} / ${totalBooks.toLocaleString()} (${pct}%) [Last ID: #${lastId}]`);
  }
  console.log('\n    Transfer tabel books selesai!');

  // C. Tabel comic_books
  console.log('\n--- Mentransfer tabel "comic_books" ---');
  try {
    const [comics] = await localPool.query('SELECT * FROM comic_books ORDER BY id ASC');
    if (comics.length > 0) {
      for (let i = 0; i < comics.length; i += 1000) {
        const slice = comics.slice(i, i + 1000);
        const values = slice.map((c) => [c.id, c.title, c.author, c.type, c.genre, c.description, c.cover_url, c.created_at]);
        await tidbPool.query('INSERT IGNORE INTO comic_books (id, title, author, type, genre, description, cover_url, created_at) VALUES ?', [values]);
      }
      console.log(`    Berhasil mentransfer ${comics.length} comic_books.`);
    } else {
      console.log('    Tabel comic_books kosong/dilewati.');
    }
  } catch {
    console.log('    Tabel comic_books tidak ditemukan di lokal, dilewati.');
  }

  // D. Tabel chat_sessions
  console.log('\n--- Mentransfer tabel "chat_sessions" ---');
  const [sessions] = await localPool.query('SELECT * FROM chat_sessions ORDER BY id ASC');
  if (sessions.length > 0) {
    for (const s of sessions) {
      await tidbPool.query(
        'INSERT INTO chat_sessions (id, user_id, title, is_pinned, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)',
        [s.id, s.user_id, s.title, s.is_pinned, s.is_archived, s.created_at, s.updated_at]
      );
    }
    console.log(`    Berhasil mentransfer ${sessions.length} sesi chat.`);
  } else {
    console.log('    Tabel chat_sessions kosong.');
  }

  // E. Tabel chat_messages
  console.log('\n--- Mentransfer tabel "chat_messages" ---');
  const [messages] = await localPool.query('SELECT * FROM chat_messages ORDER BY id ASC');
  if (messages.length > 0) {
    for (const m of messages) {
      const meta = m.metadata ? (typeof m.metadata === 'string' ? m.metadata : JSON.stringify(m.metadata)) : null;
      await tidbPool.query(
        'INSERT INTO chat_messages (id, session_id, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content=VALUES(content)',
        [m.id, m.session_id, m.role, m.content, meta, m.created_at]
      );
    }
    console.log(`    Berhasil mentransfer ${messages.length} pesan chat.`);
  } else {
    console.log('    Tabel chat_messages kosong.');
  }

  // F. Tabel bookmarks
  console.log('\n--- Mentransfer tabel "bookmarks" ---');
  const [bookmarks] = await localPool.query('SELECT * FROM bookmarks ORDER BY id ASC');
  if (bookmarks.length > 0) {
    for (const b of bookmarks) {
      await tidbPool.query(
        'INSERT IGNORE INTO bookmarks (id, user_id, book_id, created_at) VALUES (?, ?, ?, ?)',
        [b.id, b.user_id, b.book_id, b.created_at]
      );
    }
    console.log(`    Berhasil mentransfer ${bookmarks.length} bookmarks.`);
  } else {
    console.log('    Tabel bookmarks kosong.');
  }

  // Verifikasi akhir
  console.log('\n[5/5] Memverifikasi data antara MySQL Lokal vs TiDB Cloud...\n');
  const tables = ['users', 'books', 'chat_sessions', 'chat_messages', 'bookmarks'];
  let allMatched = true;

  console.log('-------------------------------------------------------------');
  console.log(' Nama Tabel        Lokal           TiDB Cloud      Status');
  console.log('-------------------------------------------------------------');

  for (const tbl of tables) {
    const [lRow] = await localPool.query(`SELECT COUNT(*) as c FROM ${tbl}`);
    const [tRow] = await tidbPool.query(`SELECT COUNT(*) as c FROM ${tbl}`);
    const lCnt = lRow[0].c;
    const tCnt = tRow[0].c;
    const match = lCnt === tCnt;
    if (!match) allMatched = false;

    const nameCol = tbl.padEnd(16);
    const lCol = lCnt.toLocaleString().padStart(12);
    const tCol = tCnt.toLocaleString().padStart(16);
    const statusCol = match ? '  [OK COCOK]' : '  [BERBEDA]';

    console.log(`${nameCol}${lCol}${tCol}${statusCol}`);
  }
  console.log('-------------------------------------------------------------');

  await localPool.end();
  await tidbPool.end();

  if (allMatched) {
    console.log('\n SELURUH DATA BERHASIL DIMIGRASIKAN KE TiDB CLOUD DENGAN SEMPURNA!');
  } else {
    console.log('\n  Migrasi selesai dengan beberapa perbedaan jumlah data. Silakan cek tabel di atas.');
  }
}

if (process.argv[1]?.endsWith('migrate_local_to_tidb.mjs')) {
  migrateLocalToTiDB()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n Terjadi kesalahan saat migrasi:', err.message);
      process.exit(1);
    });
}

