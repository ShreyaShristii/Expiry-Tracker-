const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const protect = require("./middleware/authMiddleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Test Route
app.get("/", (req, res) => {
  res.send("Backend + MongoDB is working!");
});

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

// Protected Test Route
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected route",
    userId: req.user
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});