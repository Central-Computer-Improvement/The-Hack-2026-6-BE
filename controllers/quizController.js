const crypto = require("crypto");
const pool = require("../config/db");

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
  return {
    ...row,
    options: parseJsonField(row.options),
    misconceptions: parseJsonField(row.misconceptions),
  };
}

// ============================================================
// CREATE - POST /api/quizzes
// ============================================================
exports.createQuiz = async (req, res) => {
  try {
    const {
      module_id,
      question,
      question_type,
      options,
      expected_answer,
      rubric,
      misconceptions,
    } = req.body;

    if (!module_id || !question || !question_type || !expected_answer) {
      return res.status(400).json({
        success: false,
        message:
          "module_id, question, question_type, expected_answer wajib diisi",
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
      `INSERT INTO quizzes
        (id, module_id, question, question_type, options, expected_answer, rubric, misconceptions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        module_id,
        question,
        question_type,
        options ? JSON.stringify(options) : null,
        expected_answer,
        rubric || null,
        misconceptions ? JSON.stringify(misconceptions) : null,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM quizzes WHERE id = ?`, [
      id,
    ]);
    return res
      .status(201)
      .json({ success: true, data: withParsedJson(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ALL - GET /api/quizzes
// Bisa difilter: GET /api/quizzes?module_id=xxx
// ============================================================
exports.getQuizzes = async (req, res) => {
  try {
    const { module_id } = req.query;

    const sql = module_id
      ? `SELECT * FROM quizzes WHERE module_id = ?`
      : `SELECT * FROM quizzes`;
    const params = module_id ? [module_id] : [];

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows.map(withParsedJson) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// READ ONE - GET /api/quizzes/:id
// ============================================================
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM quizzes WHERE id = ?`, [
      id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz tidak ditemukan" });
    }

    return res.json({ success: true, data: withParsedJson(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// UPDATE - PUT /api/quizzes/:id
// ============================================================
exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      question,
      question_type,
      options,
      expected_answer,
      rubric,
      misconceptions,
      module_id,
    } = req.body;

    const [existing] = await pool.query(
      `SELECT * FROM quizzes WHERE id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz tidak ditemukan" });
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
      `UPDATE quizzes
       SET question = ?, question_type = ?, options = ?, expected_answer = ?,
           rubric = ?, misconceptions = ?, module_id = ?
       WHERE id = ?`,
      [
        question ?? existing[0].question,
        question_type ?? existing[0].question_type,
        options ? JSON.stringify(options) : existing[0].options,
        expected_answer ?? existing[0].expected_answer,
        rubric ?? existing[0].rubric,
        misconceptions
          ? JSON.stringify(misconceptions)
          : existing[0].misconceptions,
        module_id ?? existing[0].module_id,
        id,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM quizzes WHERE id = ?`, [
      id,
    ]);
    return res.json({ success: true, data: withParsedJson(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================
// DELETE - DELETE /api/quizzes/:id
// ============================================================
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM quizzes WHERE id = ?`, [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz tidak ditemukan" });
    }

    return res.json({ success: true, message: "Quiz berhasil dihapus" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};