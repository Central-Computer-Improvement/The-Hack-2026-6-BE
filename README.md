# Tutorial: CRUD Users dengan Node.js + Express + MySQL (XAMPP) + VSCode

Tutorial ini dari nol banget: install tools → bikin database → bikin server →
sampai tes semua endpoint CRUD untuk tabel `users` (student & admin).

---

## 0. Software yang perlu di-install

| Tools | Fungsi | Link |
|---|---|---|
| **Node.js** (LTS) | Menjalankan JavaScript di luar browser (backend) | https://nodejs.org |
| **VSCode** | Code editor | https://code.visualstudio.com |
| **XAMPP** | Paket MySQL + phpMyAdmin lokal | https://www.apachefriends.org |
| **Postman** atau extension **Thunder Client** di VSCode | Tes API | https://www.postman.com atau cari "Thunder Client" di Extensions VSCode |

Cek instalasi Node.js sudah benar dengan buka **Command Prompt / Terminal**, lalu ketik:

```bash
node -v
npm -v
```

Kalau muncul versi (misal `v20.11.0`), berarti sudah siap.

---

## 1. Nyalakan MySQL dari XAMPP

1. Buka **XAMPP Control Panel**.
2. Klik **Start** di baris **MySQL** (tidak perlu Apache kalau cuma butuh database).
3. Pastikan status jadi hijau / tertulis "Running".

---

## 2. Bikin Database & Tabel lewat phpMyAdmin

1. Buka browser → `http://localhost/phpmyadmin`
2. Klik tab **SQL** di bagian atas.
3. Copy-paste isi file **`sql/schema.sql`** (ada di project ini), lalu klik **Go**.

Isinya kurang lebih:

```sql
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
```

Setelah dijalankan, cek di sidebar kiri phpMyAdmin → harus muncul database
`auralearn_db` dengan tabel `users` di dalamnya.

> **Kenapa `password VARCHAR(255)`?** Karena kita tidak akan simpan password
> asli, tapi hasil hash (bcrypt) yang panjang karakternya sekitar 60, jadi 255
> kasih ruang aman.

---

## 3. Buka Project di VSCode

1. Extract / taruh folder `auralearn-backend` di tempat yang gampang diakses,
   misal `D:\project\auralearn-backend`.
2. Buka VSCode → **File → Open Folder** → pilih folder tadi.
3. Buka **Terminal** di VSCode: menu **Terminal → New Terminal** (atau `` Ctrl+` ``).

---

## 4. Install dependency Node.js

Di terminal VSCode (pastikan posisi folder `auralearn-backend`):

```bash
npm install
```

Ini akan mengunduh semua package yang tertulis di `package.json`:
- **express** — framework untuk bikin server & routing
- **mysql2** — driver buat konek ke MySQL dari Node.js
- **dotenv** — baca file `.env` (menyimpan config supaya tidak hardcode)
- **bcryptjs** — hash password (pure JS, tidak perlu compiler tambahan)
- **nodemon** (dev only) — auto-restart server saat file berubah

---

## 5. Bikin file `.env`

Di project sudah ada `.env.example`. Duplikat file itu, ganti nama jadi `.env`,
lalu sesuaikan (default XAMPP: user `root`, password kosong):

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=auralearn_db

PORT=5000
```

> File `.env` sengaja tidak ikut ter-upload / masuk git (lihat `.gitignore`)
> karena isinya kredensial. Yang di-share ke tim cukup `.env.example`.

---

## 6. Struktur Project & Penjelasan Tiap File

```
auralearn-backend/
├── config/
│   └── db.js              → koneksi pool ke MySQL
├── controllers/
│   └── userController.js  → logic CRUD (create, read, update, delete)
├── routes/
│   └── userRoutes.js      → daftar endpoint & method HTTP-nya
├── sql/
│   └── schema.sql         → script bikin database & tabel
├── .env.example
├── package.json
└── server.js               → entry point, nyalain Express server
```

**Alur request:** `server.js` → `routes/userRoutes.js` → `controllers/userController.js` → `config/db.js` → MySQL.

### `config/db.js`
Bikin **connection pool** (bukan 1 koneksi tunggal) supaya banyak request bisa
dilayani sekaligus tanpa harus buka-tutup koneksi berkali-kali.

### `controllers/userController.js`
Isinya 5 fungsi CRUD:
- `createUser` — hash password pakai bcrypt sebelum `INSERT`
- `getUsers` — `SELECT` semua user (password tidak pernah ikut dikirim ke client)
- `getUserById` — `SELECT` satu user berdasar `id`
- `updateUser` — `UPDATE`, password baru di-hash ulang kalau dikirim
- `deleteUser` — `DELETE` berdasar `id`

### `routes/userRoutes.js`
Memetakan method HTTP + path ke fungsi controller di atas.

### `server.js`
Menyalakan Express, pasang middleware `express.json()` (biar bisa baca body
JSON), lalu daftar semua route `/api/users` ke `userRoutes`.

---

## 7. Jalankan Server

Di terminal VSCode:

```bash
npm run dev
```

(`npm run dev` pakai nodemon, jadi server auto-restart tiap kali kamu save file.
Kalau mau cara biasa: `npm start`.)

Kalau berhasil, akan muncul:

```
✅ Server jalan di http://localhost:5000
✅ Berhasil konek ke MySQL database: auralearn_db
```

Kalau muncul `❌ Gagal konek ke MySQL`, cek troubleshooting di bagian paling bawah.

---

## 8. Daftar Endpoint CRUD

Base URL: `http://localhost:5000/api/users`

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/users` | Bikin user baru |
| `GET` | `/api/users` | Ambil semua user |
| `GET` | `/api/users/:id` | Ambil satu user by id |
| `PUT` | `/api/users/:id` | Update user by id |
| `DELETE` | `/api/users/:id` | Hapus user by id |

### Contoh: CREATE (POST)

Body (JSON):
```json
{
  "name": "Siti Pelajar",
  "email": "siti@auralearn.com",
  "password": "rahasia123",
  "role": "student"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Siti Pelajar",
    "email": "siti@auralearn.com",
    "photo_url": null,
    "role": "student",
    "coins": 0,
    "streak_count": 0,
    "created_at": "2026-08-11T09:00:13.000Z",
    "updated_at": "2026-08-11T09:00:13.000Z"
  }
}
```

### Contoh: READ ALL (GET)
`GET http://localhost:5000/api/users` → daftar semua user.

### Contoh: READ ONE (GET)
`GET http://localhost:5000/api/users/3`

### Contoh: UPDATE (PUT)
`PUT http://localhost:5000/api/users/3`
Body (kirim field yang mau diubah saja):
```json
{ "coins": 50, "streak_count": 2 }
```

### Contoh: DELETE
`DELETE http://localhost:5000/api/users/3`

---

## 9. Cara Tes dengan Thunder Client (di VSCode)

1. Install extension **Thunder Client** dari Extensions Marketplace.
2. Klik ikon petir di sidebar kiri → **New Request**.
3. Pilih method (POST/GET/PUT/DELETE), isi URL, kalau POST/PUT isi tab **Body → JSON**.
4. Klik **Send**, lihat response di panel kanan.

Semua endpoint di atas sudah saya coba satu-satu di server contoh dan
hasilnya sesuai (create, get all, get by id, update, delete, dan cek
duplikat email juga sudah ditolak dengan pesan yang jelas).

---

## 10. Troubleshooting

**`❌ Gagal konek ke MySQL: connect ECONNREFUSED`**
→ MySQL di XAMPP belum jalan. Buka XAMPP Control Panel, klik Start di MySQL.

**`❌ Gagal konek ke MySQL: Access denied for user 'root'@'localhost'`**
→ Cek `.env`, biasanya default XAMPP `DB_PASSWORD` kosong. Kalau kamu pernah
set password root sendiri, isi sesuai itu.

**`ER_BAD_DB_ERROR: Unknown database 'auralearn_db'`**
→ Jalankan ulang `sql/schema.sql` di phpMyAdmin — database belum dibuat.

**Port 5000 sudah dipakai (`EADDRINUSE`)**
→ Ganti `PORT` di `.env` misal jadi `5001`, restart server.

**Response `{"success":false,"message":"Email sudah terdaftar"}`**
→ Ini bukan error, memang di-desain begitu karena kolom `email` diset
`UNIQUE` di database.

---

Selesai! Tabel `users` (dengan pembeda `role: student/admin`) sekarang sudah
punya backend CRUD lengkap yang bisa langsung disambungkan ke frontend kamu.
