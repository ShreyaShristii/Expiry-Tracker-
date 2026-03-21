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
      notes,
      renewalCycle,
      quantity,           // NEW
      dosage,             // NEW
      documentType,       // NEW
      warrantyEndDate,    // NEW
      guaranteeEndDate    // NEW
    } = req.body;

    const item = await Item.create({
      user: req.user,
      name,
      category,
      validityType,
      validTill,
      reminderDays,
      cost,
      notes,
      renewalCycle,
      quantity,           // NEW
      dosage,             // NEW
      documentType,       // NEW
      warrantyEndDate,    // NEW
      guaranteeEndDate    // NEW
    });

    res.status(201).json(item);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
/*
  🥈 Get All Items (Auto-Renew + Status)
*/
router.get("/", protect, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedItems = items.map(item => {
      const validTill = new Date(item.validTill);
      validTill.setHours(0, 0, 0, 0);

      const reminderDate = new Date(validTill);
      reminderDate.setDate(validTill.getDate() - item.reminderDays);

      let status = "Active";

      if (today > validTill) {
        status = "Expired";
      } 
      else if (today >= reminderDate) {
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

/*
  🔔 Get Items Needing Reminder
*/
router.get("/reminders", protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await Item.find({ user: req.user });

    const reminderItems = items.filter(item => {
      const validTill = new Date(item.validTill);
      validTill.setHours(0, 0, 0, 0);

      const reminderDate = new Date(validTill);
      reminderDate.setDate(validTill.getDate() - item.reminderDays);

      return reminderDate <= today && validTill >= today;
    });

    res.json(reminderItems);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/*
  🧠 Dashboard Summary
*/
router.get("/dashboard", protect, async (req, res) => {
  try {
    const items = await Item.find({ user: req.user });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    let total = items.length;
    let expired = 0;
    let expiringSoon = 0;
    let active = 0;

    items.forEach(item => {
      const validTill = new Date(item.validTill);

      if (validTill < today) {
        expired++;
      } 
      else if (validTill <= next7Days) {
        expiringSoon++;
      } 
      else {
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


/*
  📜 Get Renewal History
*/
router.get("/:id/history", protect, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.validityType !== "renewal") {
      return res.status(400).json({
        message: "Renewal history available only for renewal items"
      });
    }

    const history = item.renewalHistory
      .sort((a, b) => new Date(b.renewedOn) - new Date(a.renewedOn));

    res.json({
      itemName: item.name,
      totalRenewals: history.length,
      history
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
/*
  🔄 Manual Renew Item
*/
router.put("/:id/renew", protect, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.validityType !== "renewal") {
      return res.status(400).json({
        message: "Only renewal items can be renewed"
      });
    }

    const previousValidTill = new Date(item.validTill);
    let newValidTill = new Date(previousValidTill);

    if (item.renewalCycle === "monthly") {
      newValidTill.setMonth(newValidTill.getMonth() + 1);
    } 
    else if (item.renewalCycle === "yearly") {
      newValidTill.setFullYear(newValidTill.getFullYear() + 1);
    } 
    else {
      return res.status(400).json({
        message: "Invalid renewal cycle"
      });
    }

    // 🧠 Push to renewal history
    item.renewalHistory.push({
      renewedOn: new Date(),
      previousValidTill,
      newValidTill
    });

    item.validTill = newValidTill;

    await item.save();

    res.json({
      message: "Item renewed successfully",
      item
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
/*
  🗑 Delete Item
*/
router.delete("/:id", protect, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      user: req.user
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
/*
  ✏️ Update Item
*/
router.put("/:id", protect, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    const allowed = [
  "name",
  "category",
  "validTill",
  "reminderDays",
  "cost",
  "notes",
  "renewalCycle",
  "validityType",
  "quantity",           
  "dosage",             
  "documentType",       
  "warrantyEndDate",    
  "guaranteeEndDate"    
];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) item[key] = req.body[key];
    });

    await item.save();

    res.json({ message: "Item updated successfully", item });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;