const { Router } = require("express");
const healthRoutes = require("./health.routes");
const videoRoutes = require("./video.routes");
const clipRoutes = require("./clip.routes");
const authRoutes = require("./auth.routes");
const historyRoutes = require("./history.routes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);     // /api/auth/register, /api/auth/login, /api/auth/me
router.use("/history", historyRoutes); // /api/history (GET, POST, DELETE)
router.use("/", videoRoutes);        // /api/info, /api/download
router.use("/clips", clipRoutes);    // /api/clips/split, /api/clips/:workId/:filename

module.exports = router;
