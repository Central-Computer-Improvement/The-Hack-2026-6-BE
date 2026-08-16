const express = require("express");
const router = express.Router();
const {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  trackVideoWatch,
} = require("../controllers/videoController");

router.post("/", createVideo); // CREATE
router.post("/track", trackVideoWatch); // AI VIDEO TRACKING (by body video_id)
router.post("/:id/track", trackVideoWatch); // AI VIDEO TRACKING (by param id)
router.get("/", getVideos); // READ ALL (bisa filter ?module_id=)
router.get("/:id", getVideoById); // READ ONE
router.put("/:id", updateVideo); // UPDATE
router.delete("/:id", deleteVideo); // DELETE

module.exports = router;