const express = require("express");
const router = express.Router();
const {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
} = require("../controllers/videoController");

router.post("/", createVideo); // CREATE
router.get("/", getVideos); // READ ALL (bisa filter ?module_id=)
router.get("/:id", getVideoById); // READ ONE
router.put("/:id", updateVideo); // UPDATE
router.delete("/:id", deleteVideo); // DELETE

module.exports = router;