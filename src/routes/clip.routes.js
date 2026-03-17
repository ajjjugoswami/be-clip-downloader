const { Router } = require("express");
const clipCtrl = require("../controllers/clip.controller");

const router = Router();

router.post("/split", clipCtrl.split);
router.get("/:workId/:filename", clipCtrl.getClip);

module.exports = router;
