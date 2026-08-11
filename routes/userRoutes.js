const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.post("/", createUser); // CREATE
router.get("/", getUsers); // READ ALL
router.get("/:id", getUserById); // READ ONE
router.put("/:id", updateUser); // UPDATE
router.delete("/:id", deleteUser); // DELETE

module.exports = router;
