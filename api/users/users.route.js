const express = require("express");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  profile,
  updateProfile,
  changePassword,
} = require("./users.controller");

const authMiddleware = require("../../middlewares/authentication.middleware");
const rolesMiddleware = require("../../middlewares/roles.middleware");
const { upload } = require("../../utils/storage.utils");

const router = express.Router();

router.get("/", authMiddleware, rolesMiddleware(["admin"]), getUsers);

router.get("/profile", authMiddleware, profile);

router.put(
  "/profile/update",
  authMiddleware,
  upload.single("avatar"),
  updateProfile
);

router.post("/profile/change-password", authMiddleware, changePassword);

router.get("/:userId", authMiddleware, rolesMiddleware(["admin"]), getUserById);

router.post("/create", authMiddleware, rolesMiddleware(["admin"]), createUser);

router.put(
  "/:userId/update",
  authMiddleware,
  rolesMiddleware(["admin"]),
  updateUser
);

router.delete(
  "/:userId/remove",
  authMiddleware,
  rolesMiddleware(["admin"]),
  deleteUser
);

module.exports = router;
