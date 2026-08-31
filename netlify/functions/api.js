// netlify/functions/api.js
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');

// Import your Express app OR your route files here
// e.g. const routes = require('../../routes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// MongoDB connection handler (reused across serverless calls)
let isConnected = false;
const connectDB = async () => {
    if (!isConnected && process.env.MONGODB_URI) {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
    }
};

app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// Mount your API routes here (e.g. app.use('/api', routes))

module.exports.handler = serverless(app);
