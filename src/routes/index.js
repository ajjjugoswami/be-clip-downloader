const { Router } = require("express");
const healthRoutes = require("./health.routes");
const videoRoutes = require("./video.routes");
const clipRoutes = require("./clip.routes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/", videoRoutes);        // /api/info, /api/download
router.use("/clips", clipRoutes);    // /api/clips/split, /api/clips/:workId/:filename

module.exports = router;
