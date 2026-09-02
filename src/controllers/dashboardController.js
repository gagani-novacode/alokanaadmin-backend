const TicketOrder = require("../models/TicketOrder");
const TicketInventoryOrder = require("../models/TicketInventoryOrder");
const TicketInventory = require("../models/TicketInventory");

// =============================================================
// GET /api/dashboard/summary
// Returns high-level stats for the dashboard
// =============================================================
const getDashboardSummary = async (req, res) => {
  try {
    // Total orders
    const totalOrders = await TicketOrder.countDocuments();

    // Orders by status
    const ordersByStatus = await TicketOrder.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Total revenue (only PAID orders)
    const revenueResult = await TicketOrder.aggregate([
      { $match: { status: "PAID" } },
      { $group: { _id: null, totalRevenueLKR: { $sum: "$totalLKR" } } },
    ]);
    const totalRevenueLKR =
      revenueResult.length > 0 ? revenueResult[0].totalRevenueLKR : 0;

    // Total tickets sold (sum of quantities in PAID orders)
    const paidOrders = await TicketOrder.find(
      { status: "PAID" },
      { _id: 1 }
    ).lean();
    const paidOrderIds = paidOrders.map((o) => o._id);

    const ticketsSoldResult = await TicketInventoryOrder.aggregate([
      { $match: { ticketOrder: { $in: paidOrderIds } } },
      { $group: { _id: null, totalTicketsSold: { $sum: "$quantity" } } },
    ]);
    const totalTicketsSold =
      ticketsSoldResult.length > 0
        ? ticketsSoldResult[0].totalTicketsSold
        : 0;

    // Available ticket count from inventories
    const inventories = await TicketInventory.find().lean();
    const totalAvailableTickets = inventories.reduce(
      (sum, inv) => sum + inv.availableCount,
      0
    );

    // Payment method breakdown (PAID orders only)
    const paymentMethodBreakdown = await TicketOrder.aggregate([
      { $match: { status: "PAID", paymentMethod: { $exists: true } } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$totalLKR" } } },
    ]);

    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await TicketOrder.aggregate([
      {
        $match: {
          status: "PAID",
          paidAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          revenue: { $sum: "$totalLKR" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Unique customers
    const uniqueCustomers = await TicketOrder.distinct("customer.email");

    const statusMap = ordersByStatus.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalOrders,
        totalPaidOrders: statusMap["PAID"] || 0,
        totalPaidTickets: totalTicketsSold,
        totalRevenueLKR,
        totalTicketsSold,
        totalAvailableTickets,
        uniqueCustomers: uniqueCustomers.length,
        ordersByStatus: statusMap,
        paymentMethodBreakdown,
        dailyRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardSummary };
