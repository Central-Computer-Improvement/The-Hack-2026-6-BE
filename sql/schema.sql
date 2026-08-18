-- =========================================================
-- AuraLearn - Database Schema (lengkap)
-- Jalankan file ini SEKALI di phpMyAdmin (tab SQL) sebelum start server
-- =========================================================

CREATE DATABASE IF NOT EXISTS auralearn_db;
USE auralearn_db;

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(64)         PRIMARY KEY,
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

-- Contoh data awal (opsional, boleh dihapus).
-- Password di bawah masih plain text hanya untuk contoh; lewat endpoint API
-- password otomatis di-hash. id pakai UUID() bawaan MySQL.
INSERT INTO users (id, name, email, password, role, coins, streak_count)
VALUES
  (UUID(), 'Admin AuraLearn', 'admin@auralearn.com', 'akan_diganti_hash', 'admin', 0, 0),
  (UUID(), 'Budi Explorer', 'budi@auralearn.com', 'akan_diganti_hash', 'student', 120, 5);

-- =========================================================
-- Tabel Course & konten belajar
-- id pakai VARCHAR(64) (UUID string), di-generate dari sisi Node.js
-- saat POST, bukan dari database.
-- =========================================================

CREATE TABLE IF NOT EXISTS courses (
  id          VARCHAR(64)  PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS modules (
  id          VARCHAR(64)  PRIMARY KEY,
  course_id   VARCHAR(64)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  order_index INT          NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS videos (
  id          VARCHAR(64)  PRIMARY KEY,
  module_id   VARCHAR(64)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  video_url   TEXT         NOT NULL,
  order_index INT          NOT NULL,
  kb_concepts JSON         NULL,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quizzes (
  id              VARCHAR(64)  PRIMARY KEY,
  module_id       VARCHAR(64)  NOT NULL,
  question        TEXT         NOT NULL,
  question_type   VARCHAR(32)  NOT NULL,
  options         JSON         NULL,
  expected_answer TEXT         NOT NULL,
  rubric          TEXT         NULL,
  misconceptions  JSON         NULL,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- user_id VARCHAR(64), konsisten dengan users.id (UUID string).
CREATE TABLE IF NOT EXISTS user_course_progress (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(64) NOT NULL,
  course_id    VARCHAR(64) NOT NULL,
  module_id    VARCHAR(64) NOT NULL,
  status       VARCHAR(32) NOT NULL DEFAULT 'not_started',
  score        FLOAT       NULL,
  completed_at TIMESTAMP   NULL,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roadmaps (
  id           VARCHAR(64)  PRIMARY KEY,
  user_id      VARCHAR(64)  NOT NULL,
  topic        VARCHAR(255) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  summary      TEXT         NULL,
  steps_json   JSON         NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

--untuk auth akun google
ALTER TABLE users
  MODIFY password VARCHAR(255) NULL,              -- boleh kosong buat akun Google
  ADD COLUMN google_id VARCHAR(255) NULL UNIQUE,   -- ID unik dari Google (field "sub")
  ADD COLUMN auth_provider ENUM('local','google') NOT NULL DEFAULT 'local';

--untuk pembatasan 1 sesi login
ALTER TABLE users
  ADD COLUMN active_session_id VARCHAR(64) NULL;