const express = require("express");
const router = express.Router();
const {
  createProgress,
  getProgress,
  getProgressById,
  updateProgress,
  deleteProgress,
} = require("../controllers/progressController");

router.post("/", createProgress); // CREATE
router.get("/", getProgress); // READ ALL (bisa filter ?user_id= / ?course_id= / ?module_id=)
router.get("/:id", getProgressById); // READ ONE
router.put("/:id", updateProgress); // UPDATE
router.delete("/:id", deleteProgress); // DELETE

module.exports = router;