const bcrypt = require("bcryptjs");
const pool = require("../config/db");

// Kolom yang aman ditampilkan ke client (password TIDAK pernah dikirim balik)
const SAFE_COLUMNS =
  "id, name, email, photo_url, role, coins, streak_count, created_at, updated_at";

// ============================================================
// CREATE - POST /api/users
// ============================================================
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, photo_url, coins, streak_count } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, dan password wajib diisi",
      });
    }

    if (role && !["student", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role hanya boleh 'student' atau 'admin'",
      });
    }

    // Hash password sebelum disimpan (jangan pernah simpan plain text)
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, photo_url, coins, streak_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        role || "student",
        photo_url || null,
        coins || 0,
        streak_count || 0,
      ]
    );

    const [rows] = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Email sudah terdaftar" });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ALL - GET /api/users
// ============================================================
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users ORDER BY id DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ONE - GET /api/users/:id
// ============================================================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// UPDATE - PUT /api/users/:id
// ============================================================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, photo_url, coins, streak_count } =
      req.body;

    const [existing] = await pool.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    if (role && !["student", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role hanya boleh 'student' atau 'admin'",
      });
    }

    // Kalau password dikirim, hash ulang. Kalau tidak, pakai password lama.
    const newPassword = password
      ? await bcrypt.hash(password, 10)
      : existing[0].password;

    await pool.query(
      `UPDATE users
       SET name = ?, email = ?, password = ?, role = ?,
           photo_url = ?, coins = ?, streak_count = ?
       WHERE id = ?`,
      [
        name ?? existing[0].name,
        email ?? existing[0].email,
        newPassword,
        role ?? existing[0].role,
        photo_url ?? existing[0].photo_url,
        coins ?? existing[0].coins,
        streak_count ?? existing[0].streak_count,
        id,
      ]
    );

    const [rows] = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`,
      [id]
    );

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Email sudah dipakai user lain" });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// DELETE - DELETE /api/users/:id
// ============================================================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    return res.json({ success: true, message: "User berhasil dihapus" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
