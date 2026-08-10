const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

// Helmet Safe Require (Prevents MODULE_NOT_FOUND Crash)
let helmet;
try {
  helmet = require('helmet');
} catch (e) {
  console.log('⚠️ Helmet package missing, proceeding without helmet middleware');
}

// Existing Routes Imports
let authRoutes, productRoutes, orderRoutes;
try { authRoutes = require('./routes/authRoutes'); } catch (e) {}
try { productRoutes = require('./routes/productRoutes'); } catch (e) {}
try { orderRoutes = require('./routes/orderRoutes'); } catch (e) {}

// Models Imports with Dynamic Fallbacks
let Banner, Review, Coupon;
try { Banner = require('./models/bannerModel'); } catch (e) {
  const schema = new mongoose.Schema({ title: String, subtitle: String, badge: String, img: String, bg: String }, { timestamps: true });
  Banner = mongoose.models.Banner || mongoose.model('Banner', schema);
}
try { Review = require('./models/reviewModel'); } catch (e) {
  const schema = new mongoose.Schema({ orderId: String, customerName: String, customerEmail: String, rating: Number, comment: String }, { timestamps: true });
  Review = mongoose.models.Review || mongoose.model('Review', schema);
}
try { Coupon = require('./models/couponModel'); } catch (e) {
  const schema = new mongoose.Schema({ code: String, discount: Number, category: String, maxUsage: Number, usedCount: Number, status: String }, { timestamps: true });
  Coupon = mongoose.models.Coupon || mongoose.model('Coupon', schema);
}

const app = express();

// Middlewares with High Payload Limits & CORS Priority
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

if (helmet) {
  app.use(helmet({ crossOriginResourcePolicy: false }));
}

// Multer Storage for Uploads
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

// 2. Direct Banner Endpoints
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

// 🚀 4.1 COUPON USAGE INCREMENT ENDPOINT (Fixes 404 Error on Order Place)
app.post('/api/coupons/use', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (coupon) {
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
      return res.status(200).json({ message: 'Coupon usage incremented', coupon });
    }
    return res.status(404).json({ message: 'Coupon not found' });
  } catch (error) {
    return res.status(500).json({ message: 'Coupon update error: ' + error.message });
  }
});

// 🚀 5. DIRECT MASTER CLEAR ROUTE (Delete All Corrupted/Old Orders from MongoDB Collection)
app.get('/api/orders/all/clear', async (req, res) => {
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('orders').deleteMany({});
      return res.status(200).send('<h1>✅ Sare Purane Orders MongoDB Database Se Hamesha Ke Liye Saaf Ho Gaye!</h1>');
    }
    return res.status(500).send('Database connection error');
  } catch (err) {
    return res.status(500).send('Error clearing orders: ' + err.message);
  }
});

// Mounted API Routes
if (authRoutes) app.use('/api/auth', authRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);

// Root Healthcheck Route
app.get('/', (req, res) => {
  res.send('Aapka E-Commerce Backend Server Successfully Chalu Ho Gaya Hai!');
});

// Server Connection Setup
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI is missing in .env file!');
    } else {
      await mongoose.connect(mongoUri);
      console.log('✅ Real MongoDB Atlas Database Connected Successfully!');
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log('Database Connection Error:', err.message);
  }
};

startServer();