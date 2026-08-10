const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 1. GET All Products (Supports both Pagination and Direct Array for Frontend)
router.get('/', async (req, res) => {
  try {
    // Agar frontend query mein 'all=true' bhejta hai ya pagination nahi hai toh saare products bhej do
    if (req.query.all === 'true' || (!req.query.page && !req.query.limit)) {
      const allProducts = await Product.find({});
      return res.json(allProducts);
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15; // Limit badhakar 15 kar di hai taaki zyada products dikhein
    const skip = (page - 1) * limit;

    const count = await Product.countDocuments();
    const products = await Product.find().skip(skip).limit(limit);

    res.json({
      products,
      page,
      pages: Math.ceil(count / limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. CREATE New Product (POST)
router.post('/', async (req, res) => {
  const { name, price, category, description, image, rating, countInStock } = req.body;
  try {
    const product = new Product({
      name,
      price,
      category,
      description,
      image,
      rating: rating || 4.2,
      countInStock: countInStock || 10
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. UPDATE Product (PUT)
router.put('/:id', async (req, res) => {
  const { name, price, category, description, image, rating, countInStock } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.category = category || product.category;
      product.description = description || product.description;
      product.image = image || product.image;
      product.rating = rating || product.rating;
      product.countInStock = countInStock || product.countInStock;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. DELETE Product (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await Product.deleteOne({ _id: req.params.id });
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;