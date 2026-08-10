const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
require('dotenv').config();

// Existing Routes Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Models Imports for Direct Endpoints
const Banner = require('./models/bannerModel');
const Review = require('./models/reviewModel');
const Coupon = require('./models/couponModel');

const app = express();

// Middlewares with High Payload Limits for Images & Cors Priority
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));

// Multer Memory Storage (For Base64 Uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// 1. Direct Base64 Image Upload Handler
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    return res.status(200).json({ imageUrl: base64Image });
  } catch (error) {
    return res.status(500).json({ message: 'Upload error: ' + error.message });
  }
});

// 2. Direct Banner Endpoints (Fixed 404 Error)
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ createdAt: -1 });
    return res.status(200).json(banners);
  } catch (error) {
    return res.status(500).json({ message: 'Banners fetch failed' });
  }
});

app.post('/api/banners', async (req, res) => {
  try {
    const { title, subtitle, badge, img, bg } = req.body;
    if (!title || !img) {
      return res.status(400).json({ message: 'Title and Image are required' });
    }

    const newBanner = new Banner({
      title: title || 'Special Offer',
      subtitle: subtitle || '',
      badge: badge || 'PROMO',
      img: img,
      bg: bg || 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'
    });

    await newBanner.save();
    const updatedBanners = await Banner.find({}).sort({ createdAt: -1 });
    return res.status(201).json({ message: 'Banner added successfully!', banners: updatedBanners });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save banner' });
  }
});

app.delete('/api/banners/:id', async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    const updatedBanners = await Banner.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ message: 'Banner deleted', banners: updatedBanners });
  } catch (error) {
    return res.status(500).json({ message: 'Delete banner failed' });
  }
});

// 3. Direct Reviews Endpoints
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// 4. Direct Coupons Endpoints
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return res.status(200).json(coupons);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch coupons' });
  }
});

// Mounted API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Aapka E-Commerce Backend Server Successfully Chalu Ho Gaya Hai!');
});

// Server Connection Setup
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
    });
  } catch (err) {
    console.log('Database Connection Error:', err.message);
  }
};

startServer();