const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { dbLimiter } = require("../middleware/rateLimiter");
const { createSkin, getSkins, buySkin, getOwnedSkins } = require("../controllers/skinController");

router.post("/", dbLimiter, createSkin);
router.get("/", dbLimiter, getSkins);

router.post("/buy", authMiddleware, dbLimiter, buySkin);
router.get("/owned", authMiddleware, dbLimiter, getOwnedSkins);

module.exports = router;
