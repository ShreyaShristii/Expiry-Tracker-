const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    validityType: {
      type: String,
      enum: ["expiry", "renewal", "warranty"],
      required: true
    },

    validTill: {
      type: Date,
      required: true
    },

    reminderDays: {
      type: Number,
      default: 7
    },

    cost: {
      type: Number,
      default: 0
    },

    notes: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);