const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  evaluateQuizSubmission,
} = require("../controllers/quizController");

router.post("/", createQuiz); // CREATE
router.post("/evaluate", evaluateQuizSubmission); // AI EVALUATION (by body quiz_id)
router.post("/:id/evaluate", evaluateQuizSubmission); // AI EVALUATION (by param id)
router.get("/", getQuizzes); // READ ALL (bisa filter ?module_id=)
router.get("/:id", getQuizById); // READ ONE
router.put("/:id", updateQuiz); // UPDATE
router.delete("/:id", deleteQuiz); // DELETE

module.exports = router;