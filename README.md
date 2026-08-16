# AuraLearn Backend API & AI Gateway

Backend API untuk platform pembelajaran cerdas **AuraLearn**. Dibangun menggunakan **Node.js**, **Express.js**, **MySQL**, serta terintegrasi langsung dengan **DeepTutor AI Microservice** melalui REST API dan real-time **WebSocket Chat Proxy**.

---

## 📌 Fitur Utama

- 🔐 **Autentikasi & Manajemen Pengguna**:
  - CRUD Users (Student & Admin) dengan hashing password (Bcrypt).
  - Google Sign-In / OAuth 2.0 Integration (`google-auth-library`).
  - Sistem gamifikasi (Coins & Streak Counter).
- 📚 **Manajemen Kurikulum & Konten Belajar**:
  - Kursus (*Courses*), Modul (*Modules*), Video (*Videos*), dan Kuis (*Quizzes*).
  - Relasi database relasional yang rapi dengan `ON DELETE CASCADE`.
- 📊 **Tracking Pembelajaran & Progres Siswa**:
  - Pencatatan progres belajar per modul dan kursus (*user course progress*).
  - Pelacakan tontonan video dan konsep materi (*Video watch tracking*).
- 🤖 **Integrasi DeepTutor AI Microservice**:
  - **WebSocket Chat Proxy** (`ws://localhost:5000/api/chat/ws`) untuk Socratic tutoring interaktif real-time.
  - **Adaptive STEM Roadmap Generator** (`/api/roadmap/generate`).
  - **AI Quiz Evaluator** (penilaian otomatis jawaban MCQ & Esai + analisis *misconceptions*).
  - **Knowledge Base (RAG)**: Manajemen dokumen (PDF, DOCX, TXT) dan integrasi basis pengetahuan.
  - **3-Layer Memory System (L1, L2, L3)**: Inspeksi dan reset memori belajar pengguna.

---

## 🏗 Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────┐
│                   AuraLearn Frontend                     │
└──────────────┬─────────────────────────────┬─────────────┘
               │ HTTP REST Requests          │ WebSocket (ws://.../api/chat/ws)
               ▼                             ▼
┌──────────────────────────────────────────────────────────┐
│               AuraLearn Express Server                   │
│                    (Port: 5000)                          │
├────────────────────────────┬─────────────────────────────┤
│  MySQL Database Pool       │  DeepTutor Service / Proxy  │
│  (auralearn_db: 3306)      │  (Forwarder & Transformer)  │
└──────────────┬─────────────┴───────────────┬─────────────┘
               ▼                             ▼
      ┌─────────────────┐        ┌───────────────────────┐
      │  MySQL (XAMPP)  │        │  DeepTutor Microservice│
      │  Users, Courses,│        │  (FastAPI / Python)   │
      │  Modules, Quiz  │        │  Port: 8001           │
      └─────────────────┘        └───────────────────────┘
```

---

## 📁 Struktur Direktori

```
The-Hack-2026-6-BE/
├── config/
│   └── db.js                  # Koneksi connection pool ke MySQL (mysql2/promise)
├── controllers/
│   ├── aiSettingsController.js# Controller model catalog & 3-layer memory AI
│   ├── authController.js      # Controller autentikasi Google OAuth
│   ├── courseController.js    # CRUD Courses & Reset session
│   ├── knowledgeController.js # Manajemen Knowledge Base & upload file RAG
│   ├── moduleController.js    # CRUD Modules & milestone completion
│   ├── progressController.js  # CRUD User course progress
│   ├── quizController.js      # CRUD Quizzes & evaluasi jawaban AI
│   ├── roadmapController.js   # Generator AI STEM learning roadmap
│   ├── userController.js      # CRUD Users & hashing password
│   └── videoController.js     # CRUD Videos & AI tracking
├── routes/
│   ├── aiSettingsRoutes.js    # Endpoint /api/ai
│   ├── authRoutes.js          # Endpoint /api/auth
│   ├── courseRoutes.js        # Endpoint /api/courses
│   ├── knowledgeRoutes.js     # Endpoint /api/knowledge
│   ├── moduleRoutes.js        # Endpoint /api/modules
│   ├── progressRoutes.js      # Endpoint /api/progress
│   ├── quizRoutes.js          # Endpoint /api/quizzes
│   ├── roadmapRoutes.js       # Endpoint /api/roadmap
│   ├── userRoutes.js          # Endpoint /api/users
│   └── videoRoutes.js         # Endpoint /api/videos
├── services/
│   ├── chatProxy.js           # WebSocket Proxy ke DeepTutor AI WS endpoint
│   └── deepTutorService.js    # HTTP Client komunikasi ke REST DeepTutor AI
├── sql/
│   └── schema.sql             # Skema DDL tabel MySQL lengkap
├── DeepTutor-main/            # Submodul AI Engine DeepTutor (Python FastAPI)
├── .env.example               # Template variabel environment
├── package.json               # Daftar dependency & skrip Node.js
└── server.js                  # Entry point Express.js server & WebSocket proxy
```

---

## ⚙️ Persyaratan Sistem & Instalasi

### 1. Software yang Dibutuhkan

| Software | Keterangan | Download Link |
|---|---|---|
| **Node.js (v18+)** | Runtime JavaScript backend | [nodejs.org](https://nodejs.org) |
| **MySQL / XAMPP** | Database server lokal | [apachefriends.org](https://www.apachefriends.org) |
| **Python (v3.10+)** | *(Opsional)* Jika menjalankan DeepTutor AI lokal | [python.org](https://www.python.org) |

---

### 2. Setup Database MySQL

1. Jalankan **MySQL** dari **XAMPP Control Panel** (atau MySQL Service lokal).
2. Buka **phpMyAdmin** (`http://localhost/phpmyadmin`) atau MySQL GUI client favorit Anda (DBeaver/HeidiSQL).
3. Buat database atau langsung jalankan seluruh isi file **`sql/schema.sql`** di tab **SQL**.

Skema akan membuat database `auralearn_db` dan tabel-tabel berikut:
- `users` (UUID primary key, role: student/admin, google_id, coins, streak)
- `courses` (UUID primary key, title, description)
- `modules` (UUID primary key, course_id foreign key, order_index)
- `videos` (UUID primary key, module_id foreign key, video_url, kb_concepts JSON)
- `quizzes` (UUID primary key, module_id foreign key, question_type, options, expected_answer, misconceptions JSON)
- `user_course_progress` (user_id, course_id, module_id, status, score)

---

### 3. Konfigurasi Environment (`.env`)

Duplikat file `.env.example` menjadi `.env`, kemudian sesuaikan konfigurasinya:

```env
# Database configuration (MySQL XAMPP default)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=auralearn_db

# Express Server configuration
PORT=5000

# Google OAuth (Opsional - untuk verifikasi Google Sign-In)
GOOGLE_CLIENT_ID=

# DeepTutor AI Microservice configuration
DEEPTUTOR_API_URL=http://127.0.0.1:8001/api/v1
DEEPTUTOR_WS_URL=ws://127.0.0.1:8001/api/v1/ws
DEEPTUTOR_AUTH_TOKEN=
```

---

### 4. Install Dependency & Menjalankan Server

```bash
# Masuk ke direktori backend
cd The-Hack-2026-6-BE

# Install dependencies
npm install

# Mode Development (auto-reload dengan nodemon)
npm run dev

# Mode Production
npm start
```

Jika server berhasil berjalan, Anda akan melihat output:
```
✅ Server jalan di http://localhost:5000
🔌 WebSocket chat proxy mounted on /api/chat/ws
✅ Berhasil konek ke MySQL database: auralearn_db
```

---

## 📖 Dokumentasi Endpoint API (REST & WebSocket)

Base URL: `http://localhost:5000`

### 1. Autentikasi (`/api/auth`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/google` | Login / Register dengan Google ID Token (`id_token`). |

#### Contoh Request Google Login:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

---

### 2. Users (`/api/users`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/users` | Buat user baru (Password otomatis di-hash bcrypt). |
| `GET` | `/api/users` | Ambil seluruh daftar pengguna. |
| `GET` | `/api/users/:id` | Ambil detail satu pengguna berdasarkan UUID. |
| `PUT` | `/api/users/:id` | Update data pengguna (nama, coins, streak, password, photo_url). |
| `DELETE` | `/api/users/:id` | Hapus pengguna. |

#### Contoh Payload Create User (`POST /api/users`):
```json
{
  "name": "Budi Belajar",
  "email": "budi@auralearn.com",
  "password": "passwordAman123",
  "role": "student"
}
```

---

### 3. Kursus / Courses (`/api/courses`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/courses` | Buat kursus baru. |
| `GET` | `/api/courses` | Ambil semua daftar kursus. |
| `GET` | `/api/courses/:id` | Ambil detail kursus berdasarkan ID. |
| `PUT` | `/api/courses/:id` | Update data kursus. |
| `DELETE` | `/api/courses/:id` | Hapus kursus (cascade modul, video, quiz di dalamnya). |
| `POST` | `/api/courses/:id/reset` | Reset sesi memori AI kursus & progress siswa (DeepTutor reset). |

---

### 4. Modul / Modules (`/api/modules`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/modules` | Buat modul di bawah kursus (`course_id`, `title`, `order_index`). |
| `GET` | `/api/modules` | Ambil semua modul (opsional filter `?course_id=UUID`). |
| `GET` | `/api/modules/:id` | Ambil detail satu modul. |
| `PUT` | `/api/modules/:id` | Update informasi modul. |
| `DELETE` | `/api/modules/:id` | Hapus modul. |
| `POST` | `/api/modules/:id/complete` | Selesaikan milestone modul & sinkronisasi AI capstone trace. |

---

### 5. Video Materi (`/api/videos`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/videos` | Tambah video materi di bawah modul (dengan `kb_concepts` JSON). |
| `GET` | `/api/videos` | Ambil semua video (opsional filter `?module_id=UUID`). |
| `GET` | `/api/videos/:id` | Ambil detail satu video. |
| `PUT` | `/api/videos/:id` | Update informasi video. |
| `DELETE` | `/api/videos/:id` | Hapus video. |
| `POST` | `/api/videos/:id/track` | Track tontonan video siswa, catat konsep materi ke AI L1 memory trace. |

#### Contoh Payload Video Tracking (`POST /api/videos/:id/track`):
```json
{
  "user_id": "user-uuid-1234",
  "course_id": "course-uuid-5678"
}
```

---

### 6. Kuis & Evaluasi AI (`/api/quizzes`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/quizzes` | Buat kuis (`question`, `question_type`, `options`, `expected_answer`, `misconceptions`). |
| `GET` | `/api/quizzes` | Ambil semua kuis (opsional filter `?module_id=UUID`). |
| `GET` | `/api/quizzes/:id` | Ambil detail kuis. |
| `PUT` | `/api/quizzes/:id` | Update data kuis. |
| `DELETE` | `/api/quizzes/:id` | Hapus kuis. |
| `POST` | `/api/quizzes/:id/evaluate` | Evaluasi jawaban kuis via AI (scoring, feedback, reward koin, update progress). |

#### Contoh Payload Evaluasi Kuis (`POST /api/quizzes/:id/evaluate`):
```json
{
  "user_id": "user-uuid-1234",
  "student_answer": "B) O(log n)"
}
```

---

### 7. Progres Belajar (`/api/progress`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/progress` | Catat progress belajar manual. |
| `GET` | `/api/progress` | Query progress (filter `?user_id=...&course_id=...&module_id=...`). |
| `GET` | `/api/progress/:id` | Ambil satu record progress. |
| `PUT` | `/api/progress/:id` | Update status (`not_started`, `in_progress`, `completed`) atau skor. |
| `DELETE` | `/api/progress/:id` | Hapus data progress. |

---

### 8. AI Roadmap Generator (`/api/roadmap`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/roadmap/generate` | Generate kurikulum timeline pembelajaran STEM adaptif (6-10 langkah) menggunakan LLM. |

#### Contoh Request:
```json
{
  "topic": "Machine Learning and Neural Networks for Beginners"
}
```

---

### 9. Knowledge Base & RAG (`/api/knowledge`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/knowledge` | Ambil daftar Knowledge Base yang aktif di DeepTutor. |
| `POST` | `/api/knowledge` | Buat Knowledge Base baru (mendukung file upload awal). |
| `DELETE` | `/api/knowledge/:kb_name` | Hapus Knowledge Base dari vector store. |
| `POST` | `/api/knowledge/:kb_name/upload` | Upload dokumen teks/buku (PDF, DOCX, TXT - max 10MB) ke Knowledge Base. |

---

### 10. Pengaturan Model & 3-Layer Memory (`/api/ai`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/ai/catalog` | Ambil katalog konfigurasi model LLM, Embedding, & Search. |
| `PUT` | `/api/ai/catalog` | Update konfigurasi model profile catalog. |
| `GET` | `/api/ai/memory/:layer/:key` | Inspeksi dokumen memori AI (`L1`, `L2`, `L3`). |
| `POST` | `/api/ai/memory/:layer/:key/reset` | Reset memori tertentu pada DeepTutor. |

---

### 11. WebSocket Real-Time Chat Proxy

- **URL**: `ws://localhost:5000/api/chat/ws`
- Berfungsi menjembatani komunikasi WebSocket dua arah antara frontend client dan DeepTutor AI Microservice secara transparan.

#### Tipe Pesan yang Didukung:
- `start_turn` / `message`: Memulai percakapan/turn baru dengan AI tutor.
- `subscribe_turn` / `subscribe_session`: Berlangganan event stream yang sedang berjalan.
- `submit_user_reply`: Mengirim jawaban saat AI sedang meminta konfirmasi (`ask_user`).
- `cancel_turn`: Membatalkan turn yang sedang aktif.
- `ping`: Heartbeat check (akan dibalas `pong`).

---

## 🤖 Menjalankan DeepTutor AI Microservice (Opsional / AI Engine)

Jika Anda ingin menjalankan layanan DeepTutor AI lokal di port `8001`:

```bash
cd DeepTutor-main

# Buat virtual environment python
python -m venv .venv

# Aktifkan virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install package DeepTutor
pip install -e .[server]

# Jalankan API server DeepTutor pada port 8001
deeptutor serve --port 8001
```

---

## 🛠️ Troubleshooting

1. **`❌ Gagal konek ke MySQL: connect ECONNREFUSED`**
   - Pastikan MySQL di XAMPP / server lokal dalam status **Running**.
   - Cek `DB_HOST` dan `DB_PORT` di `.env` (default: `127.0.0.1:3306`).

2. **`ER_BAD_DB_ERROR: Unknown database 'auralearn_db'`**
   - Database belum dibuat. Import file `sql/schema.sql` di phpMyAdmin.

3. **`DeepTutor AI microservice is not reachable` (Status 503 / Fallback Warning)**
   - Backend tetap dapat berjalan untuk CRUD dasar, evaluasi kuis akan menggunakan fallback evaluator lokal jika server DeepTutor belum dinyalakan di `http://127.0.0.1:8001`.

4. **Port 5000 conflict (`EADDRINUSE`)**
   - Ganti nilai `PORT=5001` pada file `.env`.

---

## 📄 Lisensi

Hak Cipta © 2026 Tim Pengembang **AuraLearn**.
Dilindungi di bawah ketentuan lisensi proyek.
