const TicketOrder = require("../models/TicketOrder");
const TicketInventoryOrder = require("../models/TicketInventoryOrder");

// =============================================================
// GET /api/orders
// List all ticket orders with optional filtering
// Query params:
//   status      - "PAID" | "PENDING" | "CANCELLED" | "FAILED"
//   customerName - partial match on firstName or lastName
//   page        - page number (default: 1)
//   limit       - results per page (default: 20)
// =============================================================
const getOrders = async (req, res) => {
  try {
    const { status, customerName, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Filter by status
    if (status) {
      filter.status = status.toUpperCase();
    }

    // Filter by customer full name (first or last name)
    if (customerName) {
      const regex = new RegExp(customerName, "i");
      filter.$or = [
        { "customer.firstName": regex },
        { "customer.lastName": regex },
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: ["$customer.firstName", " ", "$customer.lastName"],
              },
              regex: customerName,
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

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: orders,
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
