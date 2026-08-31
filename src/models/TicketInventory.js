const mongoose = require("mongoose");

const ticketInventorySchema = new mongoose.Schema(
  {
    seatType: { type: String, required: true },
    unitPriceLKR: { type: Number, required: true },
    availableCount: { type: Number, required: true },
    phase: { type: mongoose.Schema.Types.ObjectId, ref: "Phase" },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "ticketinventories" }
);

module.exports = mongoose.model("TicketInventory", ticketInventorySchema);
