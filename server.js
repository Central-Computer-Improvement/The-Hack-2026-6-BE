const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const videoRoutes = require("./routes/videoRoutes");
const quizRoutes = require("./routes/quizRoutes");
const progressRoutes = require("./routes/progressRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const knowledgeRoutes = require("./routes/knowledgeRoutes");
const aiSettingsRoutes = require("./routes/aiSettingsRoutes");
const { attachChatProxy } = require("./services/chatProxy");
const authRoutes = require("./routes/authRoutes");
const userRoadMapRoutes = require('./routes/userRoadMapRoutes');

const app = express();

// Middleware supaya Express bisa baca JSON di request body
app.use(cors({
  origin: "http://localhost:3000", // alamat frontend kamu
  credentials: true,
}));
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
app.use("/api/progress", progressRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/ai", aiSettingsRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/roadmaps', userRoadMapRoutes);

// Middleware sederhana untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

const PORT = process.env.PORT || 5000;
const httpServer = app.listen(PORT, () => {
  console.log(`✅ Server jalan di http://localhost:${PORT}`);
});

// Attach WebSocket chat proxy on ws://localhost:<PORT>/api/chat/ws
// Proxies transparently to DeepTutor at DEEPTUTOR_WS_URL
attachChatProxy(httpServer);

