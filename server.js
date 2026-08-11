const express = require("express");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware supaya Express bisa baca JSON di request body
app.use(express.json());

// Route dasar buat cek server hidup
app.get("/", (req, res) => {
  res.send("🚀 AuraLearn Backend jalan!");
});

// Semua endpoint user diawali /api/users
app.use("/api/users", userRoutes);

// Middleware sederhana untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server jalan di http://localhost:${PORT}`);
});
