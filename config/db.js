const mysql = require("mysql2/promise");
require("dotenv").config();

// Pool koneksi ke MySQL (XAMPP)
// Pool dipakai supaya koneksi bisa dipakai ulang (lebih efisien
// daripada buka-tutup koneksi di setiap request).
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Tes koneksi saat server pertama kali jalan
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ Berhasil konek ke MySQL database:", process.env.DB_NAME);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Gagal konek ke MySQL:", err.message);
  });

module.exports = pool;
