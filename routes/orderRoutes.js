const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// 1. Naya Order Create Karne Ki API (POST /api/orders)
router.post('/', async (req, res) => {
  try {
    const { userId, orderItems, shippingAddress, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Cart khali hai!' });
    }

    const order = new Order({
      user: userId,
      orderItems,
      shippingAddress,
      totalPrice
    });

    const createdOrder = await order.save();
    res.status(201).json({ message: 'Order Successful!', order: createdOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. User Ke Saare Orders Fetch Karne Ki API (GET /api/orders/user/:userId)
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;