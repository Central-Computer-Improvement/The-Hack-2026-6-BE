const crypto = require("crypto");
const pool = require("../config/db");

// ============================================================
// CREATE - POST /api/modules
// ============================================================
exports.createModule = async (req, res) => {
  try {
    const { course_id, title, order_index } = req.body;

    if (!course_id || !title || order_index === undefined) {
      return res.status(400).json({
        success: false,
        message: "course_id, title, dan order_index wajib diisi",
      });
    }

    const [course] = await pool.query(`SELECT id FROM courses WHERE id = ?`, [
      course_id,
    ]);
    if (course.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "course_id tidak ditemukan" });
    }

    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO modules (id, course_id, title, order_index) VALUES (?, ?, ?, ?)`,
      [id, course_id, title, order_index]
    );

    const [rows] = await pool.query(`SELECT * FROM modules WHERE id = ?`, [
      id,
    ]);
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ALL - GET /api/modules
// Bisa difilter by course: GET /api/modules?course_id=xxx
// ============================================================
exports.getModules = async (req, res) => {
  try {
    const { course_id } = req.query;

    const sql = course_id
      ? `SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC`
      : `SELECT * FROM modules ORDER BY order_index ASC`;
    const params = course_id ? [course_id] : [];

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ONE - GET /api/modules/:id
// ============================================================
exports.getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM modules WHERE id = ?`, [
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Module tidak ditemukan" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// UPDATE - PUT /api/modules/:id
// ============================================================
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order_index, course_id } = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM modules WHERE id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Module tidak ditemukan" });
    }

    if (course_id) {
      const [course] = await pool.query(
        `SELECT id FROM courses WHERE id = ?`,
        [course_id]
      );
      if (course.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "course_id tidak ditemukan" });
      }
    }

    await pool.query(
      `UPDATE modules SET title = ?, order_index = ?, course_id = ? WHERE id = ?`,
      [
        title ?? existing[0].title,
        order_index ?? existing[0].order_index,
        course_id ?? existing[0].course_id,
        id,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM modules WHERE id = ?`, [
      id,
    ]);
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// DELETE - DELETE /api/modules/:id
// ============================================================
exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM modules WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Module tidak ditemukan" });
    }

    return res.json({ success: true, message: "Module berhasil dihapus" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// COMPLETE MODULE MILESTONE - POST /api/modules/:id/complete or POST /api/modules/complete
// ============================================================
exports.completeModuleMilestone = async (req, res) => {
  try {
    const moduleId = req.params.id || req.body.module_id;
    const {
      user_id,
      course_id: explicitCourseId,
      learned_concepts,
      misconceptions,
      essay_feedback,
    } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "module_id wajib diisi",
      });
    }

    const [moduleRows] = await pool.query(
      `SELECT * FROM modules WHERE id = ?`,
      [moduleId]
    );

    if (moduleRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Module tidak ditemukan" });
    }

    const moduleData = moduleRows[0];
    const courseId = explicitCourseId || moduleData.course_id;

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

    // Kumpulkan concepts dari video jika tidak dikirim
    let conceptsList = learned_concepts || [];
    if (!learned_concepts || !learned_concepts.length) {
      const [videos] = await pool.query(
        `SELECT kb_concepts FROM videos WHERE module_id = ?`,
        [moduleId]
      );
      for (const v of videos) {
        if (v.kb_concepts) {
          try {
            const parsed = typeof v.kb_concepts === "string" ? JSON.parse(v.kb_concepts) : v.kb_concepts;
            if (Array.isArray(parsed)) {
              conceptsList.push(...parsed);
            }
          } catch {}
        }
      }
    }

    // Panggil DeepTutor Microservice
    let aiTraceResult = null;
    try {
      const deepTutorService = require("../services/deepTutorService");
      aiTraceResult = await deepTutorService.completeModule(courseId, moduleId, {
        module_title: moduleData.title,
        course_title: courseTitle || courseId,
        learned_concepts: conceptsList,
        misconceptions: misconceptions || [],
        essay_feedback: essay_feedback || "Module completion milestone recorded.",
      });
    } catch (aiErr) {
      console.warn("DeepTutor complete_module call failed (fallback ignored):", aiErr.message);
      aiTraceResult = { status: "local_only", message: aiErr.message };
    }

    // Update / insert user_course_progress di database
    let progressData = null;
    if (user_id) {
      const [existingProgress] = await pool.query(
        `SELECT * FROM user_course_progress 
         WHERE user_id = ? AND course_id = ? AND module_id = ? 
         ORDER BY id DESC LIMIT 1`,
        [user_id, courseId, moduleId]
      );

      const completedAt = new Date();
      if (existingProgress.length > 0) {
        await pool.query(
          `UPDATE user_course_progress 
           SET status = 'completed', completed_at = ? 
           WHERE id = ?`,
          [completedAt, existingProgress[0].id]
        );
        progressData = {
          id: existingProgress[0].id,
          status: "completed",
          completed_at: completedAt,
        };
      } else {
        const [insertRes] = await pool.query(
          `INSERT INTO user_course_progress (user_id, course_id, module_id, status, completed_at)
           VALUES (?, ?, ?, 'completed', ?)`,
          [user_id, courseId, moduleId, completedAt]
        );
        progressData = {
          id: insertRes.insertId,
          status: "completed",
          completed_at: completedAt,
        };
      }
    }

    return res.json({
      success: true,
      message: `Module "${moduleData.title}" marked as completed`,
      data: {
        module_id: moduleId,
        course_id: courseId,
        ai_trace: aiTraceResult,
        progress: progressData,
      },
    });
  } catch (err) {
    console.error("completeModuleMilestone error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};