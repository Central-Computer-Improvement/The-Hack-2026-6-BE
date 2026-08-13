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