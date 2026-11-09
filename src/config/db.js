const mongoose = require("mongoose");

let connecting = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: "alokana3red2",
        serverSelectionTimeoutMS: 8000,
      })
      .catch((err) => {
        connecting = null;
        console.error("MongoDB Connection Error:", err.message);
        throw err;
      });
  }
  await connecting;
};

module.exports = connectDB;