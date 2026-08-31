const express = require("express");
const router = express.Router();
const { getLogs, getLogsSummary } = require("../controllers/logsController");

// GET /api/logs         - list logs (filterable)
router.get("/", getLogs);

// GET /api/logs/summary - aggregate stats
router.get("/summary", getLogsSummary);

module.exports = router;
