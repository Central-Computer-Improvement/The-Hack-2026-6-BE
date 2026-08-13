const express = require("express");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const videoRoutes = require("./routes/videoRoutes");
const quizRoutes = require("./routes/quizRoutes");

const app = express();

// Middleware supaya Express bisa baca JSON di request body
app.use(express.json());

// Route dasar buat cek server hidup
app.get("/", (req, res) => {
  res.send("🚀 AuraLearn Backend jalan!");
});

// Semua endpoint diawali /api/...
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/quizzes", quizRoutes);

// Middleware sederhana untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server jalan di http://localhost:${PORT}`);
});