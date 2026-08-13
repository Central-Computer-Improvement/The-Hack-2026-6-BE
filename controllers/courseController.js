const crypto = require("crypto");
const pool = require("../config/db");

// ============================================================
// CREATE - POST /api/courses
// ============================================================
exports.createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "title wajib diisi" });
    }

    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO courses (id, title, description) VALUES (?, ?, ?)`,
      [id, title, description || null]
    );

    const [rows] = await pool.query(`SELECT * FROM courses WHERE id = ?`, [
      id,
    ]);

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ALL - GET /api/courses
// ============================================================
exports.getCourses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM courses ORDER BY created_at DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ONE - GET /api/courses/:id
// ============================================================
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM courses WHERE id = ?`, [
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Course tidak ditemukan" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// UPDATE - PUT /api/courses/:id
// ============================================================
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM courses WHERE id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Course tidak ditemukan" });
    }

    await pool.query(
      `UPDATE courses SET title = ?, description = ? WHERE id = ?`,
      [
        title ?? existing[0].title,
        description ?? existing[0].description,
        id,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM courses WHERE id = ?`, [
      id,
    ]);
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// DELETE - DELETE /api/courses/:id
// (module, video, quiz di dalamnya ikut kehapus otomatis - ON DELETE CASCADE)
// ============================================================
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM courses WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Course tidak ditemukan" });
    }

    return res.json({ success: true, message: "Course berhasil dihapus" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};