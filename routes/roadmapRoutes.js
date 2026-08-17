const express = require("express");
const router = express.Router();
const { generateRoadmap } = require("../controllers/roadmapController");

router.post("/generate", generateRoadmap);

module.exports = router;
