const express = require("express");
const router = express.Router();
const { dbLimiter } = require("../middleware/rateLimiter");
const {
  createCampaign,
  getCampaigns,
  attachBlockchainId,
} = require("../controllers/campaignController");

router.post("/", dbLimiter, createCampaign);
router.get("/", dbLimiter, getCampaigns);
router.put("/:id/blockchain", dbLimiter, attachBlockchainId);

module.exports = router;
