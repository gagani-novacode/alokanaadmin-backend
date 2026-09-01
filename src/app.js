const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const dashboardRoutes = require("./routes/dashboard");
const ordersRoutes = require("./routes/orders");
const logsRoutes = require("./routes/logs");
const customersRoutes = require("./routes/customers");

const app = express();

connectDB();

app.use(cors({
    origin: [
        "https://main.d2rf0qy3sgo7kl.amplifyapp.com",
        "http://localhost:3000"
    ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
    res.json({ success: true, message: "Andarayaya Dashboard API is running 🎉", timestamp: new Date() });
});

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/customers", customersRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app; // ← key line