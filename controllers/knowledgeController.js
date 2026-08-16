const multer = require("multer");
const deepTutorService = require("../services/deepTutorService");

// ── Multer: memory storage, 10 MB limit, PDF / DOCX / TXT only ─────────────
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed"), false);
    }
  },
});

/** multer middleware for a single field called "file" */
exports.uploadMiddleware = upload.single("file");

// ============================================================
// LIST KNOWLEDGE BASES - GET /api/knowledge
// ============================================================
exports.listKnowledgeBases = async (req, res) => {
  try {
    const data = await deepTutorService.listKnowledgeBases();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("listKnowledgeBases error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to list knowledge bases",
    });
  }
};

// ============================================================
// CREATE KNOWLEDGE BASE - POST /api/knowledge
// ============================================================
exports.createKnowledgeBase = async (req, res) => {
  try {
    const { kb_name } = req.body;
    if (!kb_name || typeof kb_name !== "string" || !kb_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "kb_name wajib diisi",
      });
    }

    const data = await deepTutorService.createKnowledgeBase(kb_name.trim());
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("createKnowledgeBase error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create knowledge base",
    });
  }
};

// ============================================================
// DELETE KNOWLEDGE BASE - DELETE /api/knowledge/:kb_name
// ============================================================
exports.deleteKnowledgeBase = async (req, res) => {
  try {
    const { kb_name } = req.params;
    if (!kb_name) {
      return res.status(400).json({
        success: false,
        message: "kb_name param is required",
      });
    }

    const data = await deepTutorService.deleteKnowledgeBase(kb_name);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("deleteKnowledgeBase error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to delete knowledge base",
    });
  }
};

// ============================================================
// UPLOAD DOCUMENT - POST /api/knowledge/:kb_name/documents/upload
// ============================================================
exports.uploadDocument = async (req, res) => {
  try {
    const { kb_name } = req.params;
    if (!kb_name) {
      return res.status(400).json({ success: false, message: "kb_name is required" });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Use multipart/form-data with field name 'file'.",
      });
    }

    const data = await deepTutorService.uploadDocument(kb_name, req.file);
    return res.json({ success: true, data });
  } catch (err) {
    // Multer file-type/size errors arrive here too
    if (err.message && err.message.includes("Only PDF")) {
      return res.status(415).json({ success: false, message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ success: false, message: "File too large. Max 10 MB." });
    }
    console.error("uploadDocument error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to upload document",
    });
  }
};

