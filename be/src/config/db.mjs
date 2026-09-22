import 'dotenv/config';
import mysql from 'mysql2/promise';

/**
 * Konfigurasi koneksi database MySQL / TiDB Cloud
 * Mendukung connection link/URL (TIDB_DATABASE_URL / DATABASE_URL / TIDB_URL)
 * maupun parameter individual (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
 */
function createDbPool() {
  let dbUrl = process.env.TIDB_DATABASE_URL || process.env.DATABASE_URL || process.env.TIDB_URL;

  // Cek apakah koneksi mengarah ke TiDB Cloud Serverless (memerlukan enkripsi SSL/TLS)
  const isTiDB = Boolean(
    dbUrl?.includes('tidbcloud.com') ||
    process.env.DB_HOST?.includes('tidbcloud.com') ||
    process.env.DB_PORT === '4000' ||
    process.env.DB_SSL === 'true'
  );

  const sslConfig = isTiDB
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined;

  if (dbUrl) {
    dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');
    try {
      const parsed = new URL(dbUrl);
      let db = parsed.pathname.replace(/^\//, '');
      if (!db || db === 'sys' || db === 'mysql' || db === 'test') {
        db = process.env.DB_NAME || 'alistair';
      }
      return mysql.createPool({
        host: parsed.hostname,
        port: parseInt(parsed.port || '4000', 10),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: db,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } catch {
      return mysql.createPool({
        uri: dbUrl,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
  }

  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alistair',
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

const pool = createDbPool();

export async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT VERSION() as v, DATABASE() as db');
    const version = rows[0]?.v || '';
    const db = rows[0]?.db || '';
    const isTiDB = version.toLowerCase().includes('tidb');

    console.log(`Database connected successfully: ${isTiDB ? 'TiDB Cloud Serverless' : 'MySQL'} (${version}) [DB: ${db}]`);

    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

export default pool;