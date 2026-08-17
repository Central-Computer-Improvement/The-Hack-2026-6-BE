const express = require("express");
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  resetCourseSession,
} = require("../controllers/courseController");

router.post("/", createCourse); // CREATE
router.post("/:id/reset", resetCourseSession); // RESET AI COURSE SESSION
router.get("/", getCourses); // READ ALL
router.get("/:id", getCourseById); // READ ONE
router.put("/:id", updateCourse); // UPDATE
router.delete("/:id", deleteCourse); // DELETE

module.exports = router;