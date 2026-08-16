const express = require("express");
const router = express.Router();
const {
  getModelCatalog,
  updateModelCatalog,
  getMemoryDoc,
  resetMemoryDoc,
} = require("../controllers/aiSettingsController");

// Model Catalog
router.get("/catalog", getModelCatalog);
router.put("/catalog", updateModelCatalog);

// Memory
router.get("/memory/:layer/:key", getMemoryDoc);
router.post("/memory/:layer/:key/reset", resetMemoryDoc);

module.exports = router;
