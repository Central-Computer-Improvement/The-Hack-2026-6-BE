const deepTutorService = require("../services/deepTutorService");

// ============================================================
// MODEL CATALOG SETTINGS
// ============================================================
exports.getModelCatalog = async (req, res) => {
  try {
    const data = await deepTutorService.getModelCatalog();
    return res.json({ success: true, data });
  } catch (err) {
    console.error("getModelCatalog error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch model catalog",
    });
  }
};

exports.updateModelCatalog = async (req, res) => {
  try {
    const data = await deepTutorService.updateModelCatalog(req.body);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("updateModelCatalog error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update model catalog",
    });
  }
};

// ============================================================
// 3-LAYER MEMORY INSPECTION & RESET
// ============================================================
exports.getMemoryDoc = async (req, res) => {
  try {
    const { layer, key } = req.params;
    const data = await deepTutorService.getMemoryDoc(layer, key);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("getMemoryDoc error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch memory document",
    });
  }
};

exports.resetMemoryDoc = async (req, res) => {
  try {
    const { layer, key } = req.params;
    const data = await deepTutorService.resetMemoryDoc(layer, key);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("resetMemoryDoc error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to reset memory document",
    });
  }
};
