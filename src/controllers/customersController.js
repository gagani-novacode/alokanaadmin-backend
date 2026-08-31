const TicketOrder = require("../models/TicketOrder");
const TicketInventoryOrder = require("../models/TicketInventoryOrder");

// =============================================================
// GET /api/customers
// List unique customers with their ticket purchase count
// Query params:
//   name   - partial match on first/last name or full name
//   email  - partial match on email
// =============================================================
const getCustomers = async (req, res) => {
  try {
    const { name, email } = req.query;

    const matchFilter = {};

    if (name) {
      const regex = new RegExp(name, "i");
      matchFilter.$or = [
        { "customer.firstName": regex },
        { "customer.lastName": regex },
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: ["$customer.firstName", " ", "$customer.lastName"],
              },
              regex: name,
              options: "i",
            },
          },
        },
      ];
    }

    if (email) {
      matchFilter["customer.email"] = new RegExp(email, "i");
    }

    // Aggregate: group by email to find unique customers
    const customers = await TicketOrder.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$customer.email",
          firstName: { $first: "$customer.firstName" },
          lastName: { $first: "$customer.lastName" },
          phone: { $first: "$customer.phone" },
          idType: { $first: "$customer.idType" },
          idNumber: { $first: "$customer.idNumber" },
          totalOrders: { $sum: 1 },
          totalSpentLKR: {
            $sum: {
              $cond: [{ $eq: ["$status", "PAID"] }, "$totalLKR", 0],
            },
          },
          paidOrders: {
            $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
          },
          orderIds: { $push: "$_id" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
      { $sort: { lastOrderAt: -1 } },
    ]);

    // Enrich each customer with total tickets purchased
    const enriched = await Promise.all(
      customers.map(async (customer) => {
        const inventoryOrders = await TicketInventoryOrder.find({
          ticketOrder: { $in: customer.orderIds },
        }).lean();
        const totalTickets = inventoryOrders.reduce(
          (sum, io) => sum + io.quantity,
          0
        );
        return {
          email: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          fullName: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          idType: customer.idType,
          idNumber: customer.idNumber,
          totalOrders: customer.totalOrders,
          paidOrders: customer.paidOrders,
          pendingOrders: customer.pendingOrders,
          totalTicketsPurchased: totalTickets,
          totalSpentLKR: customer.totalSpentLKR,
          lastOrderAt: customer.lastOrderAt,
        };
      })
    );

    res.json({
      success: true,
      total: enriched.length,
      data: enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// GET /api/customers/:email/orders
// All orders for a specific customer by email
// =============================================================
const getCustomerOrders = async (req, res) => {
  try {
    const { email } = req.params;

    const orders = await TicketOrder.find({
      "customer.email": new RegExp(`^${email}$`, "i"),
    })
      .sort({ createdAt: -1 })
      .lean();

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this customer",
      });
    }

    // For each order get ticket items
    const ordersWithInventory = await Promise.all(
      orders.map(async (order) => {
        const inventoryItems = await TicketInventoryOrder.find({
          ticketOrder: order._id,
        })
          .populate("ticketInventory", "seatType unitPriceLKR")
          .lean();
        const totalTickets = inventoryItems.reduce(
          (sum, io) => sum + io.quantity,
          0
        );
        return { ...order, inventoryItems, totalTickets };
      })
    );

    const totalTicketsPurchased = ordersWithInventory.reduce(
      (sum, o) => sum + o.totalTickets,
      0
    );

    res.json({
      success: true,
      customer: orders[0].customer,
      totalOrders: orders.length,
      totalTicketsPurchased,
      data: ordersWithInventory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCustomers, getCustomerOrders };
