const express = require("express");
const router = express.Router();
const {
  getModelCatalog,
  updateModelCatalog,
  getMemoryDoc,
  resetMemoryDoc,
  consolidateMemory,
} = require("../controllers/aiSettingsController");

// Model Catalog
router.get("/catalog", getModelCatalog);
router.put("/catalog", updateModelCatalog);

// Memory
router.post("/memory/consolidate", consolidateMemory);
router.get("/memory/:layer/:key", getMemoryDoc);
router.post("/memory/:layer/:key/reset", resetMemoryDoc);

module.exports = router;
