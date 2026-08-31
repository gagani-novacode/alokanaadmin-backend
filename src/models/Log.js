const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["info", "warn", "error", "debug"] },
    context: String,
    message: String,
    meta: mongoose.Schema.Types.Mixed,
    requestId: String,
    orderId: String,
    customerFullName: String,
    timestamp: Date,
  },
  {
    timestamps: true,
    collection: "logs",
  }
);

module.exports = mongoose.model("Log", logSchema);
