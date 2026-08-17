const deepTutorService = require("../services/deepTutorService");

// ============================================================
// GENERATE ROADMAP - POST /api/roadmap/generate
// ============================================================
exports.generateRoadmap = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "topic wajib diisi (string tidak boleh kosong)",
      });
    }

    const roadmapData = await deepTutorService.generateRoadmap(topic.trim());
    return res.json({
      success: true,
      data: roadmapData,
    });
  } catch (err) {
    console.error("Roadmap generation error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to generate roadmap",
      error: err.data || null,
    });
  }
};
