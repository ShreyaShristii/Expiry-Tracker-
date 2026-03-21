const express = require("express");
const Item = require("../models/Items");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/* ── Get notifications for user ── */
router.get("/", protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await Item.find({ user: req.user });

    const notifications = items.filter(item => {
      const validTill = new Date(item.validTill);
      validTill.setHours(0, 0, 0, 0);

      const reminderDate = new Date(validTill);
      reminderDate.setDate(validTill.getDate() - item.reminderDays);

      // Item is expiring soon (between reminder date and expiry date)
      return reminderDate <= today && validTill >= today;
    });

    res.json({
      status: "success",
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;