const express = require('express');
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
    res.status(201).json({ message: 'Order Successful!', order: createdOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. ALL ORDERS FETCH FOR ADMIN PANEL (GET /api/orders) - THIS WAS MISSING
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Orders fetch karne mein dikkat aayi: ' + error.message });
  }
});

// 3. User Ke Saare Orders Fetch Karne Ki API (GET /api/orders/user/:userId)
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Single Order Detail Fetch (GET /api/orders/:id)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order nahi mila' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. UPDATE ORDER STATUS FOR ADMIN (PUT /api/orders/:id)
router.put('/:id', async (req, res) => {
  try {
    const { status, returnRequest } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      if (status) order.status = status;
      if (returnRequest) order.returnRequest = returnRequest;

      const updatedOrder = await order.save();
      res.json({ message: 'Order status update ho gaya!', order: updatedOrder });
    } else {
      res.status(404).json({ message: 'Order nahi mila' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;