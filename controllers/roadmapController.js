const crypto = require("crypto");
const pool = require("../config/db");
const deepTutorService = require("../services/deepTutorService");

function parseJsonField(val) {
  if (val === null || val === undefined) return val;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

// ============================================================
// GENERATE & SAVE ROADMAP - POST /api/roadmap/generate
// ============================================================
exports.generateRoadmap = async (req, res) => {
  try {
    const { topic, user_id } = req.body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "topic wajib diisi (string tidak boleh kosong)",
      });
    }

    const roadmapData = await deepTutorService.generateRoadmap(topic.trim());

    let savedRecord = null;
    if (user_id) {
      // Check user exists
      const [userRows] = await pool.query(
        `SELECT id FROM users WHERE id = ?`,
        [user_id]
      );

      if (userRows.length > 0) {
        const id = crypto.randomUUID();
        const steps = roadmapData.roadmap || [];
        const title = roadmapData.title || topic;
        const summary = roadmapData.summary || "";

        await pool.query(
          `INSERT INTO user_roadmaps (id, user_id, topic, title, summary, steps_json)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, user_id, topic.trim(), title, summary, JSON.stringify(steps)]
        );

        const [rows] = await pool.query(
          `SELECT * FROM user_roadmaps WHERE id = ?`,
          [id]
        );
        if (rows.length > 0) {
          savedRecord = {
            ...rows[0],
            steps_json: parseJsonField(rows[0].steps_json),
          };
        }
      }
    }

    return res.json({
      success: true,
      data: {
        ...roadmapData,
        saved_roadmap: savedRecord,
      },
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

// ============================================================
// GET USER ROADMAPS - GET /api/roadmap/user/:userId
// ============================================================
exports.getUserRoadmaps = async (req, res) => {
  try {
    const { userId } = req.params;

    const [userRows] = await pool.query(`SELECT id FROM users WHERE id = ?`, [
      userId,
    ]);
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const [rows] = await pool.query(
      `SELECT * FROM user_roadmaps WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    const roadmaps = rows.map((r) => ({
      ...r,
      steps_json: parseJsonField(r.steps_json),
    }));

    return res.json({
      success: true,
      data: roadmaps,
    });
  } catch (err) {
    console.error("getUserRoadmaps error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
