const mongoose = require("mongoose");

const phaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "INACTIVE" },
  },
  { collection: "phases" }
);

module.exports = mongoose.model("Phase", phaseSchema);
