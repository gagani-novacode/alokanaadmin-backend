const Log = require("../models/Log");

// =============================================================
// GET /api/logs
// List logs with optional filters
// Query params:
//   level       - "info" | "warn" | "error" | "debug"
//   context     - e.g. "tickets"
//   message     - partial match
//   customerName - partial match on customerFullName
//   orderId     - exact match
//   startDate   - ISO date string (from)
//   endDate     - ISO date string (to)
//   page        - page number (default: 1)
//   limit       - results per page (default: 50)
// =============================================================
const getLogs = async (req, res) => {
  try {
    const {
      level,
      context,
      message,
      customerName,
      orderId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (level) filter.level = level.toLowerCase();
    if (context) filter.context = new RegExp(context, "i");
    if (message) filter.message = new RegExp(message, "i");
    if (customerName && customerName.trim()) {
      const regex = new RegExp(customerName.trim(), "i");
      filter.$or = [
        { customerFullName: regex },
        { message: regex },
        { "meta.customerName": regex },
        { "meta.customerEmail": regex },
        { "meta.customer.firstName": regex },
        { "meta.customer.lastName": regex },
      ];
    }
    if (orderId) filter.orderId = orderId;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Log.countDocuments(filter);

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// GET /api/logs/summary
// Aggregate counts grouped by level and context
// =============================================================
const getLogsSummary = async (req, res) => {
  try {
    const byLevel = await Log.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byContext = await Log.aggregate([
      { $group: { _id: "$context", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byMessage = await Log.aggregate([
      { $group: { _id: "$message", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        byLevel: byLevel.reduce((acc, cur) => {
          acc[cur._id] = cur.count;
          return acc;
        }, {}),
        byContext,
        topMessages: byMessage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLogs, getLogsSummary };
