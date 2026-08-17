const express = require("express");
const router = express.Router();
const {
  listKnowledgeBases,
  createKnowledgeBase,
  deleteKnowledgeBase,
  uploadDocument,
  uploadMiddleware,
} = require("../controllers/knowledgeController");

router.get("/", listKnowledgeBases);
router.post("/", uploadMiddleware, createKnowledgeBase);
router.delete("/:kb_name", deleteKnowledgeBase);
router.post("/:kb_name/upload", uploadMiddleware, uploadDocument);
router.post("/:kb_name/documents/upload", uploadMiddleware, uploadDocument);

module.exports = router;

