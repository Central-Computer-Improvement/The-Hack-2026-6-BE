const express = require("express");
const router = express.Router();
const {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
  completeModuleMilestone,
} = require("../controllers/moduleController");

router.post("/", createModule); // CREATE
router.post("/complete", completeModuleMilestone); // AI MODULE COMPLETE (by body module_id)
router.post("/:id/complete", completeModuleMilestone); // AI MODULE COMPLETE (by param id)
router.get("/", getModules); // READ ALL (bisa filter ?course_id=)
router.get("/:id", getModuleById); // READ ONE
router.put("/:id", updateModule); // UPDATE
router.delete("/:id", deleteModule); // DELETE

module.exports = router;