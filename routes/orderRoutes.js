const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');

// 1. Naya Order Create Karne Ki API (POST /api/orders)
router.post('/', async (req, res) => {
  try {
    const { userId, userEmail, orderItems, shippingAddress, totalPrice, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Cart khali hai!' });
    }

    const order = new Order({
      user: userId,
      userEmail,
      orderItems,
      shippingAddress,
      totalPrice,
      paymentMethod: paymentMethod || 'COD',
      status: 'Processing'
    });

    const createdOrder = await order.save();
    return res.status(201).json({ message: 'Order Successful!', order: createdOrder });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 2. ALL ORDERS FETCH FOR ADMIN PANEL (GET /api/orders)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Orders fetch karne mein dikkat aayi: ' + error.message });
  }
});

// 3. User Ke Saare Orders Fetch Karne Ki API (GET /api/orders/user/:userId)
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 4. Single Order Detail Fetch (GET /api/orders/:id)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Order ID format' });
    }

    const order = await Order.findById(id);
    if (order) {
      return res.json(order);
    } else {
      return res.status(404).json({ message: 'Order nahi mila' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 5. UPDATE ORDER STATUS FOR ADMIN (PUT /api/orders/:id) - FIXED CAST ERROR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Strict Object ID and 'undefined' validation
    if (!id || id === 'undefined' || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Galat ya missing Order ID. Kripya page refresh karein.' });
    }

    const { status, returnRequest } = req.body;
    const order = await Order.findById(id);

    if (order) {
      if (status) order.status = status;
      if (returnRequest) order.returnRequest = returnRequest;

      const updatedOrder = await order.save();
      return res.json({ message: 'Order status update ho gaya!', order: updatedOrder });
    } else {
      return res.status(404).json({ message: 'Order nahi mila' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;