const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Routes Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Aapka E-Commerce Backend Server Successfully Chalu Ho Gaya Hai!');
});

// Server Connection & Real MongoDB Atlas Setup (Without Seeder Override)
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI is missing in .env file!');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Real MongoDB Atlas Database Connected Successfully!');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port: http://localhost:${PORT}`);
      console.log(`📂 Auth Routes Mounted at: http://localhost:${PORT}/api/auth`);
    });
  } catch (err) {
    console.log('Database Connection Error:', err.message);
  }
};

startServer();