const express = require("express");
const router = express.Router();
const {
    generateRoadmap,
    getUserRoadmaps,
} = require("../controllers/roadmapController");

router.post("/generate", generateRoadmap);
router.get("/user/:userId", getUserRoadmaps);

module.exports = router;
