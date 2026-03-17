const { Router } = require("express");
const videoCtrl = require("../controllers/video.controller");

const router = Router();

router.post("/info", videoCtrl.getInfo);
router.post("/download", videoCtrl.download);

module.exports = router;
