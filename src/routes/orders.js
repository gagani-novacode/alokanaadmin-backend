const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
  getOrdersByCustomer,
} = require("../controllers/ordersController");

// GET /api/orders          - list all (filterable by status, customerName)
router.get("/", getOrders);

// GET /api/orders/search   - search by customer name
router.get("/search", getOrdersByCustomer);

// GET /api/orders/:id      - single order with inventory breakdown
router.get("/:id", getOrderById);

module.exports = router;
