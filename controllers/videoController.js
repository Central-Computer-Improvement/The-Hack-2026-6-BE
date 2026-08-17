const crypto = require("crypto");
const pool = require("../config/db");

// Helper: field JSON di MySQL kadang balik sebagai string, kadang sudah
// object (tergantung driver/versi). Fungsi ini memastikan selalu object/array.
function parseJsonField(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function withParsedJson(row) {
  if (!row) return row;
  return { ...row, kb_concepts: parseJsonField(row.kb_concepts) };
}

// ============================================================
// CREATE - POST /api/videos
// ============================================================
exports.createVideo = async (req, res) => {
  try {
    const { module_id, title, video_url, order_index, kb_concepts } =
      req.body;

    if (!module_id || !title || !video_url || order_index === undefined) {
      return res.status(400).json({
        success: false,
        message: "module_id, title, video_url, order_index wajib diisi",
      });
    }

    const [module] = await pool.query(`SELECT id FROM modules WHERE id = ?`, [
      module_id,
    ]);
    if (module.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "module_id tidak ditemukan" });
    }

    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO videos (id, module_id, title, video_url, order_index, kb_concepts)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        module_id,
        title,
        video_url,
        order_index,
        kb_concepts ? JSON.stringify(kb_concepts) : null,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM videos WHERE id = ?`, [
      id,
    ]);
    return res.status(201).json({ success: true, data: withParsedJson(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ALL - GET /api/videos
// Bisa difilter: GET /api/videos?module_id=xxx
// ============================================================
exports.getVideos = async (req, res) => {
  try {
    const { module_id } = req.query;

    const sql = module_id
      ? `SELECT * FROM videos WHERE module_id = ? ORDER BY order_index ASC`
      : `SELECT * FROM videos ORDER BY order_index ASC`;
    const params = module_id ? [module_id] : [];

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows.map(withParsedJson) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ONE - GET /api/videos/:id
// ============================================================
exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM videos WHERE id = ?`, [
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Video tidak ditemukan" });
    }

    return res.json({ success: true, data: withParsedJson(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// UPDATE - PUT /api/videos/:id
// ============================================================
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, video_url, order_index, kb_concepts, module_id } =
      req.body;

    const [existing] = await pool.query(`SELECT * FROM videos WHERE id = ?`, [
      id,
    ]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Video tidak ditemukan" });
    }

    if (module_id) {
      const [module] = await pool.query(
        `SELECT id FROM modules WHERE id = ?`,
        [module_id]
      );
      if (module.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "module_id tidak ditemukan" });
      }
    }

    await pool.query(
      `UPDATE videos
       SET title = ?, video_url = ?, order_index = ?, kb_concepts = ?, module_id = ?
       WHERE id = ?`,
      [
        title ?? existing[0].title,
        video_url ?? existing[0].video_url,
        order_index ?? existing[0].order_index,
        kb_concepts ? JSON.stringify(kb_concepts) : existing[0].kb_concepts,
        module_id ?? existing[0].module_id,
        id,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM videos WHERE id = ?`, [
      id,
    ]);
    return res.json({ success: true, data: withParsedJson(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// DELETE - DELETE /api/videos/:id
// ============================================================
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM videos WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Video tidak ditemukan" });
    }

    return res.json({ success: true, message: "Video berhasil dihapus" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// TRACK VIDEO WATCH - POST /api/videos/:id/track or POST /api/videos/track
// ============================================================
exports.trackVideoWatch = async (req, res) => {
  try {
    const videoId = req.params.id || req.body.video_id;
    const { user_id, course_id: explicitCourseId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "video_id wajib diisi",
      });
    }

    const [videoRows] = await pool.query(
      `SELECT v.*, m.course_id 
       FROM videos v 
       JOIN modules m ON v.module_id = m.id 
       WHERE v.id = ?`,
      [videoId]
    );

    if (videoRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Video tidak ditemukan" });
    }

    const video = videoRows[0];
    const courseId = explicitCourseId || video.course_id;
    const kbConcepts = parseJsonField(video.kb_concepts) || [];

    // Ambil course title dari database untuk ditampilkan di trace DeepTutor
    let courseTitle = null;
    try {
      const [courseRows] = await pool.query(
        `SELECT title FROM courses WHERE id = ?`,
        [courseId]
      );
      if (courseRows.length > 0) {
        courseTitle = courseRows[0].title;
      }
    } catch {}

    let aiTraceResult = null;
    try {
      const deepTutorService = require("../services/deepTutorService");
      aiTraceResult = await deepTutorService.trackVideo(courseId, {
        video_id: video.id,
        title: video.title,
        course_title: courseTitle || courseId,
        kb_concepts: Array.isArray(kbConcepts) ? kbConcepts : [],
      });
    } catch (aiErr) {
      console.warn("DeepTutor track_video call failed (fallback ignored):", aiErr.message);
      aiTraceResult = { status: "local_only", message: aiErr.message };
    }

    // Update / insert user progress
    let progressData = null;
    if (user_id) {
      const [existingProgress] = await pool.query(
        `SELECT * FROM user_course_progress 
         WHERE user_id = ? AND course_id = ? AND module_id = ? 
         ORDER BY id DESC LIMIT 1`,
        [user_id, courseId, video.module_id]
      );

      if (existingProgress.length > 0) {
        if (existingProgress[0].status === "not_started") {
          await pool.query(
            `UPDATE user_course_progress SET status = 'in_progress' WHERE id = ?`,
            [existingProgress[0].id]
          );
        }
        progressData = { id: existingProgress[0].id, status: existingProgress[0].status || "in_progress" };
      } else {
        const [insertRes] = await pool.query(
          `INSERT INTO user_course_progress (user_id, course_id, module_id, status, score)
           VALUES (?, ?, ?, 'in_progress', 0)`,
          [user_id, courseId, video.module_id]
        );
        progressData = { id: insertRes.insertId, status: "in_progress" };
      }
    }

    return res.json({
      success: true,
      data: {
        video_id: video.id,
        course_id: courseId,
        module_id: video.module_id,
        ai_trace: aiTraceResult,
        progress: progressData,
      },
    });
  } catch (err) {
    console.error("trackVideoWatch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};