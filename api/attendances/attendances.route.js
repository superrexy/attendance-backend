const express = require("express");
const {
  getAttendances,
  getAttendanceById,
  checkIn,
  checkOut,
} = require("./attendances.controller");

const authMiddleware = require("../../middlewares/authentication.middleware");
const { upload } = require("../../utils/storage.utils");

const router = express.Router();

router.get("/", authMiddleware, getAttendances);
router.get("/:attendanceId", authMiddleware, getAttendanceById);
router.post("/check-in", upload.single("file"), authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);

module.exports = router;
