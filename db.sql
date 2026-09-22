-- ====================================================================
-- Database: alistair
-- Description: Skema database lengkap untuk platform Alistair
-- (Katalog Buku, Manga, Manhwa, Novel, Auth User, Bookmarks, Chat RAG)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `alistair`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `alistair`;

-- --------------------------------------------------------------------
-- 1. Table: users
-- Deskripsi: Menyimpan data kredensial dan profil pengguna
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: books
-- Deskripsi: Koleksi utama katalog karya (Manga, Manhwa, Manhua, Webtoon, Comic, Novel)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `books` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `genre` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `cover_url` VARCHAR(2048) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_books_type` (`type`),
  KEY `idx_books_title` (`title`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: comic_books
-- Deskripsi: Tabel arsip/referensi data komik awal (opsional/legacy)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `comic_books` (
  `id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `author` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT NULL,
  `genre` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `cover_url` VARCHAR(2048) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table: chat_sessions
-- Deskripsi: Sesi percakapan obrolan pengguna dengan AI Alistair
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_chat_sessions_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table: chat_messages
-- Deskripsi: Riwayat pesan dalam sesi (user dan assistant) beserta metadata buku rekomendasi
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('user', 'assistant') NOT NULL,
  `content` TEXT NOT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_session_id` (`session_id`),
  CONSTRAINT `fk_chat_messages_session` FOREIGN KEY (`session_id`)
    REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Table: bookmarks
-- Deskripsi: Daftar karya yang disimpan/disukai oleh pengguna
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `book_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bookmarks_user_book` (`user_id`, `book_id`),
  KEY `idx_bookmarks_book_id` (`book_id`),
  CONSTRAINT `fk_bookmarks_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookmarks_book` FOREIGN KEY (`book_id`)
    REFERENCES `books` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

