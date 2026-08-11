-- =========================================================
-- AuraLearn - Database Schema (USERS table)
-- Jalankan file ini di phpMyAdmin (tab SQL) atau MySQL client
-- =========================================================

CREATE DATABASE IF NOT EXISTS auralearn_db;
USE auralearn_db;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(150)        NOT NULL UNIQUE,
  password      VARCHAR(255)        NOT NULL,
  photo_url     VARCHAR(255)        NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  coins         INT                 NOT NULL DEFAULT 0,
  streak_count  INT                 NOT NULL DEFAULT 0,
  created_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contoh data awal (opsional, boleh dihapus)
-- Password di bawah ini masih plain text hanya untuk contoh SELECT,
-- begitu dibuat lewat endpoint API, password akan otomatis di-hash.
INSERT INTO users (name, email, password, role, coins, streak_count)
VALUES
  ('Admin AuraLearn', 'admin@auralearn.com', 'akan_diganti_hash', 'admin', 0, 0),
  ('Budi Explorer', 'budi@auralearn.com', 'akan_diganti_hash', 'student', 120, 5);
