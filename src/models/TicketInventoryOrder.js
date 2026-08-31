const mongoose = require("mongoose");

const ticketInventoryOrderSchema = new mongoose.Schema(
  {
    ticketInventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketInventory",
      required: true,
    },
    ticketOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketOrder",
      required: true,
    },
    quantity: { type: Number, required: true, default: 1 },
  },
  {
    timestamps: true,
    collection: "ticketinventoryorders",
  }
);

module.exports = mongoose.model(
  "TicketInventoryOrder",
  ticketInventoryOrderSchema
);
