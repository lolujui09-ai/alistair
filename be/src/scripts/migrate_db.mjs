import pool from '../config/db.mjs';

export async function runMigrations() {
  console.log('[Migration] Memeriksa skema database MySQL...');

  try {
    // 1. Cek kolom chat_sessions
    const [csCols] = await pool.query('SHOW COLUMNS FROM chat_sessions');
    const csColNames = csCols.map((c) => c.Field);

    if (!csColNames.includes('is_pinned')) {
      console.log('[Migration] Menambahkan kolom is_pinned pada tabel chat_sessions...');
      await pool.query('ALTER TABLE chat_sessions ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0 AFTER title');
    }

    if (!csColNames.includes('is_archived')) {
      console.log('[Migration] Menambahkan kolom is_archived pada tabel chat_sessions...');
      await pool.query('ALTER TABLE chat_sessions ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER is_pinned');
    }

    // 2. Cek kolom chat_messages
    const [cmCols] = await pool.query('SHOW COLUMNS FROM chat_messages');
    const cmColNames = cmCols.map((c) => c.Field);

    if (!cmColNames.includes('metadata')) {
      console.log('[Migration] Menambahkan kolom metadata pada tabel chat_messages...');
      await pool.query('ALTER TABLE chat_messages ADD COLUMN metadata JSON NULL AFTER content');
    }

    console.log('[Migration] Skema database berhasil dimigrasikan & diverifikasi.');
    return true;
  } catch (error) {
    console.error('[Migration] Gagal menjalankan migrasi:', error.message);
    throw error;
  }
}

// Jika dijalankan langsung via CLI
if (process.argv[1]?.endsWith('migrate_db.mjs')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

