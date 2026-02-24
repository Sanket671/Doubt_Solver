const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');

// Save push subscription
router.post('/', async (req, res) => {
  try {
    const subscription = req.body;
    // Check if already exists
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      return res.status(200).json({ message: 'Subscription already exists' });
    }
    const newSub = new PushSubscription(subscription);
    await newSub.save();
    res.status(201).json({ message: 'Subscription saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove subscription (if needed)
router.delete('/', async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint });
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;