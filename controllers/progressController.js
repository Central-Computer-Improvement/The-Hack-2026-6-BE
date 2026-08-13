const pool = require("../config/db");

// ============================================================
// CREATE - POST /api/progress
// ============================================================
exports.createProgress = async (req, res) => {
  try {
    const { user_id, course_id, module_id, status, score } = req.body;

    if (!user_id || !course_id || !module_id) {
      return res.status(400).json({
        success: false,
        message: "user_id, course_id, dan module_id wajib diisi",
      });
    }

    // Validasi referensi ada di tabel masing-masing
    const [user] = await pool.query(`SELECT id FROM users WHERE id = ?`, [
      user_id,
    ]);
    if (user.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "user_id tidak ditemukan" });
    }

    const [course] = await pool.query(`SELECT id FROM courses WHERE id = ?`, [
      course_id,
    ]);
    if (course.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "course_id tidak ditemukan" });
    }

    const [module] = await pool.query(`SELECT id FROM modules WHERE id = ?`, [
      module_id,
    ]);
    if (module.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "module_id tidak ditemukan" });
    }

    const [result] = await pool.query(
      `INSERT INTO user_course_progress
        (user_id, course_id, module_id, status, score)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, course_id, module_id, status || "not_started", score ?? null]
    );

    const [rows] = await pool.query(
      `SELECT * FROM user_course_progress WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ALL - GET /api/progress
// Bisa difilter: ?user_id=xxx / ?course_id=xxx / ?module_id=xxx (bisa gabung)
// ============================================================
exports.getProgress = async (req, res) => {
  try {
    const { user_id, course_id, module_id } = req.query;

    const conditions = [];
    const params = [];

    if (user_id) {
      conditions.push("user_id = ?");
      params.push(user_id);
    }
    if (course_id) {
      conditions.push("course_id = ?");
      params.push(course_id);
    }
    if (module_id) {
      conditions.push("module_id = ?");
      params.push(module_id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT * FROM user_course_progress ${where} ORDER BY created_at DESC`,
      params
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ONE - GET /api/progress/:id
// ============================================================
exports.getProgressById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM user_course_progress WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Progress tidak ditemukan" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// UPDATE - PUT /api/progress/:id
// ============================================================
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, score, completed_at } = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM user_course_progress WHERE id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Progress tidak ditemukan" });
    }

    await pool.query(
      `UPDATE user_course_progress
       SET status = ?, score = ?, completed_at = ?
       WHERE id = ?`,
      [
        status ?? existing[0].status,
        score ?? existing[0].score,
        completed_at ?? existing[0].completed_at,
        id,
      ]
    );

    const [rows] = await pool.query(
      `SELECT * FROM user_course_progress WHERE id = ?`,
      [id]
    );

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// DELETE - DELETE /api/progress/:id
// ============================================================
exports.deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      `DELETE FROM user_course_progress WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Progress tidak ditemukan" });
    }

    return res.json({ success: true, message: "Progress berhasil dihapus" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};