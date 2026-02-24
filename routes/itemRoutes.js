const express = require("express");
const Item = require("../models/Items");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
  🥇 Add Item (Protected)
*/
router.post("/", protect, async (req, res) => {
  try {
    const {
      name,
      category,
      validityType,
      validTill,
      reminderDays,
      cost,
      notes
    } = req.body;

    const item = await Item.create({
      user: req.user,
      name,
      category,
      validityType,
      validTill,
      reminderDays,
      cost,
      notes
    });

    res.status(201).json(item);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
  🥈 Get All Items of Logged-in User (Protected)
  Adds dynamic status field
*/
router.get("/", protect, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user });

    const today = new Date();

    const updatedItems = items.map(item => {
      const validTill = new Date(item.validTill);

      // Calculate reminder date
      const reminderDate = new Date(validTill);
      reminderDate.setDate(validTill.getDate() - item.reminderDays);

      let status = "Active";

      if (today > validTill) {
        status = "Expired";
      } else if (today >= reminderDate) {
        status = "Expiring Soon";
      }

      return {
        ...item._doc,
        status
      };
    });

    res.json(updatedItems);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
// 🧠 Dashboard Summary
router.get("/dashboard", protect, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user });

    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    let total = items.length;
    let expired = 0;
    let expiringSoon = 0;
    let active = 0;

    items.forEach(item => {
      const validTill = new Date(item.validTill);

      if (validTill < today) {
        expired++;
      } else if (validTill <= next7Days) {
        expiringSoon++;
      } else {
        active++;
      }
    });

    res.json({
      total,
      expired,
      expiringSoon,
      active
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});