const express = require("express");
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");

router.post("/", createCourse); // CREATE
router.get("/", getCourses); // READ ALL
router.get("/:id", getCourseById); // READ ONE
router.put("/:id", updateCourse); // UPDATE
router.delete("/:id", deleteCourse); // DELETE

module.exports = router;