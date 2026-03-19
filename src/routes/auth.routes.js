const { Router } = require("express");
const authCtrl = require("../controllers/auth.controller");
const authenticate = require("../middleware/authenticate");

const router = Router();

router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);
router.get("/me", authenticate, authCtrl.me);

module.exports = router;
