const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Route imports
const dashboardRoutes = require("./routes/dashboard");
const ordersRoutes = require("./routes/orders");
const logsRoutes = require("./routes/logs");
const customersRoutes = require("./routes/customers");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, message: "Andarayaya Dashboard API is running 🎉", timestamp: new Date() });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/customers", customersRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/summary`);
});
