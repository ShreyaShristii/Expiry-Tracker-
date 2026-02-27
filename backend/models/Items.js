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

    renewalCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly"
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
    },

    // 🧠 Renewal History Tracking
    renewalHistory: [
      {
        renewedOn: {
          type: Date
        },
        previousValidTill: {
          type: Date
        },
        newValidTill: {
          type: Date
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);