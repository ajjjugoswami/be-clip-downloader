const { Router } = require("express");
const historyCtrl = require("../controllers/history.controller");
const authenticate = require("../middleware/authenticate");

const router = Router();

router.use(authenticate);
router.get("/", historyCtrl.getHistory);
router.post("/", historyCtrl.addHistory);
router.delete("/", historyCtrl.clearHistory);

module.exports = router;
