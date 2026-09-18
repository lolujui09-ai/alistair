import 'dotenv/config';

/**
 * Mengambil secret key JWT dari environment variable dengan fallback aman
 * Menggunakan getter function dinamis agar selalu membaca process.env.JWT_SECRET terkini
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) {
    return secret.trim();
  }
  return 'alistair_jwt_secret_key_2026';
}

export const JWT_EXPIRES_IN = '7d';

