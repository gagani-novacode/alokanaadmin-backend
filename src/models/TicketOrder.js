const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    idType: String,
    idNumber: String,
  },
  { _id: false }
);

const qrSchema = new mongoose.Schema(
  {
    code: String,
    status: String,
    payload: String,
    issuedAt: Date,
    s3Key: String,
  },
  { _id: false }
);

const ticketPdfSchema = new mongoose.Schema(
  {
    s3Key: String,
    issuedAt: Date,
  },
  { _id: false }
);

const ticketOrderSchema = new mongoose.Schema(
  {
    customer: customerSchema,
    totalLKR: { type: Number, required: true },
    currency: { type: String, default: "LKR" },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED", "FAILED"],
      default: "PENDING",
    },
    onepayTxId: String,
    paidAt: Date,
    paymentId: String,
    paymentMethod: String,
    qr: qrSchema,
    ticketPdf: ticketPdfSchema,
  },
  {
    timestamps: true,
    collection: "ticketorders",
  }
);

module.exports = mongoose.model("TicketOrder", ticketOrderSchema);
