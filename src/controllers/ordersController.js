const mongoose = require("mongoose");
const TicketOrder = require("../models/TicketOrder");
const TicketInventoryOrder = require("../models/TicketInventoryOrder");

// =============================================================
// GET /api/orders
// List all ticket orders with optional filtering
// Query params:
//   status       - "PAID" | "PENDING" | "CANCELLED" | "FAILED"
//   customerName - partial match on firstName or lastName
//   orderId      - exact or partial match on order ID
//   email        - partial match on customer email
//   date         - match orders created on YYYY-MM-DD
//   page         - page number (default: 1)
//   limit        - results per page (default: 20)
// =============================================================
const getOrders = async (req, res) => {
  try {
    const { status, customerName, orderId, email, date, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Filter by status
    if (status) {
      filter.status = status.toUpperCase();
    }

    // Filter by Order ID
    if (orderId && orderId.trim()) {
      const cleanId = orderId.trim();
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        filter._id = cleanId;
      } else {
        filter.$expr = {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: cleanId,
            options: "i",
          },
        };
      }
    }

    // Filter by Email
    if (email && email.trim()) {
      filter["customer.email"] = new RegExp(email.trim(), "i");
    }

    // Filter by Date (YYYY-MM-DD)
    if (date && date.trim()) {
      const startOfDay = new Date(date.trim());
      if (!isNaN(startOfDay.getTime())) {
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date.trim());
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // Filter by customer full name (first or last name)
    if (customerName && customerName.trim()) {
      const regex = new RegExp(customerName.trim(), "i");
      filter.$or = [
        { "customer.firstName": regex },
        { "customer.lastName": regex },
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: ["$customer.firstName", " ", "$customer.lastName"],
              },
              regex: customerName.trim(),
              options: "i",
            },
          },
        },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await TicketOrder.countDocuments(filter);

    const orders = await TicketOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Map total quantity of tickets for each returned order
    const orderIds = orders.map((o) => o._id);
    const inventoryOrders = await TicketInventoryOrder.find({
      ticketOrder: { $in: orderIds },
    }).lean();

    const quantityMap = {};
    inventoryOrders.forEach((io) => {
      const key = io.ticketOrder.toString();
      quantityMap[key] = (quantityMap[key] || 0) + (io.quantity || 1);
    });

    const ordersWithQty = orders.map((o) => {
      const qty = quantityMap[o._id.toString()];
      return {
        ...o,
        totalQuantity: qty && qty > 0 ? qty : 1,
      };
    });

    // Calculate total filtered tickets across all matching orders
    const allMatchingOrders = await TicketOrder.find(filter, { _id: 1 }).lean();
    const allMatchingIds = allMatchingOrders.map((o) => o._id);

    const matchingInvOrders = await TicketInventoryOrder.find({
      ticketOrder: { $in: allMatchingIds },
    }).lean();

    const matchedOrdersWithInv = new Set(matchingInvOrders.map((io) => io.ticketOrder.toString()));
    const invTicketsSum = matchingInvOrders.reduce((sum, io) => sum + (io.quantity || 1), 0);
    const ordersWithoutInvCount = allMatchingOrders.filter(
      (o) => !matchedOrdersWithInv.has(o._id.toString())
    ).length;

    const totalFilteredTickets = invTicketsSum + ordersWithoutInvCount;

    res.json({
      success: true,
      total,
      totalFilteredTickets,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: ordersWithQty,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// GET /api/orders/:id
// Single order details including inventory items
// =============================================================
const getOrderById = async (req, res) => {
  try {
    const order = await TicketOrder.findById(req.params.id).lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Fetch inventory breakdown for this order
    const inventoryItems = await TicketInventoryOrder.find({
      ticketOrder: req.params.id,
    })
      .populate("ticketInventory", "seatType unitPriceLKR phase")
      .lean();

    res.json({
      success: true,
      data: {
        ...order,
        inventoryItems,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================
// GET /api/orders/customer/:email
// All orders for a specific customer by email
// Query params: customerName - search by name instead
// =============================================================
const getOrdersByCustomer = async (req, res) => {
  try {
    const { name } = req.query;

    let filter = {};
    if (name) {
      const regex = new RegExp(name, "i");
      filter.$or = [
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

    const orders = await TicketOrder.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // For each order, count the total tickets purchased
    const ordersWithTickets = await Promise.all(
      orders.map(async (order) => {
        const inventoryOrders = await TicketInventoryOrder.find({
          ticketOrder: order._id,
        }).lean();
        const totalTickets = inventoryOrders.reduce(
          (sum, io) => sum + io.quantity,
          0
        );
        return { ...order, totalTickets };
      })
    );

    const totalTicketsPurchased = ordersWithTickets.reduce(
      (sum, o) => sum + o.totalTickets,
      0
    );

    res.json({
      success: true,
      totalOrders: orders.length,
      totalTicketsPurchased,
      data: ordersWithTickets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getOrdersByCustomer,
};
