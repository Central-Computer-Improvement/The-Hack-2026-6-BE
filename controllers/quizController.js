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
// EVALUATE QUIZ - POST /api/quizzes/:id/evaluate or POST /api/quizzes/evaluate
// ============================================================
exports.evaluateQuizSubmission = async (req, res) => {
  try {
    const quizId = req.params.id || req.body.quiz_id || req.body.question_id;
    const { user_id, student_answer, course_id: explicitCourseId } = req.body;

    if (!quizId || student_answer === undefined) {
      return res.status(400).json({
        success: false,
        message: "quiz_id dan student_answer wajib diisi",
      });
    }

    // Ambil data kuis + course_id dari DB
    const [quizRows] = await pool.query(
      `SELECT q.*, m.course_id 
       FROM quizzes q 
       JOIN modules m ON q.module_id = m.id 
       WHERE q.id = ?`,
      [quizId]
    );

    if (quizRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz tidak ditemukan" });
    }

    const quiz = quizRows[0];
    const courseId = explicitCourseId || quiz.course_id;
    const misconceptions = parseJsonField(quiz.misconceptions);

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

    let evalResult;
    try {
      const deepTutorService = require("../services/deepTutorService");
      evalResult = await deepTutorService.evaluateQuiz(courseId, {
        question_id: quiz.id,
        question_type: quiz.question_type,
        student_answer: String(student_answer),
        expected_answer: quiz.expected_answer,
        rubric: quiz.rubric,
        misconceptions: misconceptions,
        question_text: quiz.question,
        course_title: courseTitle || courseId,
      });
    } catch (aiErr) {
      console.warn("DeepTutor service call failed, using fallback evaluator:", aiErr.message);
      // Fallback local evaluation
      const given = String(student_answer).trim().toUpperCase();
      const expected = String(quiz.expected_answer).trim().toUpperCase();
      const isCorrect = given.split(")")[0].trim() === expected.split(")")[0].trim();
      const score = isCorrect ? 1.0 : 0.0;
      evalResult = {
        status: "success (fallback)",
        correct: isCorrect,
        score: score,
        feedback: isCorrect
          ? "Correct! Spot on."
          : `Incorrect. Expected answer was ${quiz.expected_answer}.`,
        misconception: (!isCorrect && misconceptions && misconceptions[given]) || null,
      };
    }

    // Simpan / update progress jika user_id diberikan
    let progressData = null;
    if (user_id) {
      const [existingProgress] = await pool.query(
        `SELECT * FROM user_course_progress 
         WHERE user_id = ? AND course_id = ? AND module_id = ? 
         ORDER BY id DESC LIMIT 1`,
        [user_id, courseId, quiz.module_id]
      );

      const status = evalResult.correct ? "completed" : "in_progress";
      const score = evalResult.score ?? 0;

      if (existingProgress.length > 0) {
        await pool.query(
          `UPDATE user_course_progress 
           SET status = ?, score = ?, completed_at = ? 
           WHERE id = ?`,
          [
            status,
            score,
            evalResult.correct ? new Date() : existingProgress[0].completed_at,
            existingProgress[0].id,
          ]
        );
        progressData = { id: existingProgress[0].id, status, score };
      } else {
        const [insertRes] = await pool.query(
          `INSERT INTO user_course_progress (user_id, course_id, module_id, status, score, completed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            courseId,
            quiz.module_id,
            status,
            score,
            evalResult.correct ? new Date() : null,
          ]
        );
        progressData = { id: insertRes.insertId, status, score };
      }

      // Beri reward coins jika benar
      if (evalResult.correct) {
        await pool.query(
          `UPDATE users SET coins = coins + 10 WHERE id = ? AND role = 'student'`,
          [user_id]
        );
      }
    }

    return res.json({
      success: true,
      data: {
        quiz_id: quiz.id,
        course_id: courseId,
        module_id: quiz.module_id,
        evaluation: evalResult,
        progress: progressData,
      },
    });
  } catch (err) {
    console.error("evaluateQuizSubmission error:", err);
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
