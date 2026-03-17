const { Router } = require("express");
const healthCtrl = require("../controllers/health.controller");

const router = Router();

router.get("/", healthCtrl.check);

module.exports = router;
