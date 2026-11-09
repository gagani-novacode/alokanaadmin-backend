//const dns = require("dns");
//dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
//require("dotenv").config();

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { protect } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const ordersRoutes = require("./routes/orders");
const logsRoutes = require("./routes/logs");
const customersRoutes = require("./routes/customers");

const app = express();

// connectDB();

const corsOptions = {
    origin: [
        "https://main.d2rf0qy3sgo7kl.amplifyapp.com",
        "https://alokanaadmin-frontend.lakshan-nipuna66.workers.dev",
        "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
    res.json({ success: true, message: "Andarayaya Dashboard API is running", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);
app.use("/api/orders", protect, ordersRoutes);
app.use("/api/logs", protect, logsRoutes);
app.use("/api/customers", protect, customersRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
