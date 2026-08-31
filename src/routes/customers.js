const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerOrders,
} = require("../controllers/customersController");

// GET /api/customers                    - list unique customers (filterable by name/email)
router.get("/", getCustomers);

// GET /api/customers/:email/orders      - all orders for a customer
router.get("/:email/orders", getCustomerOrders);

module.exports = router;
