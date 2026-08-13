const mongoose = require('mongoose');

// 1. Main User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  address: { type: String, default: '' },
  pincode: { type: String, default: '' },
  googleId: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

// 🟢 2. Dedicated Abandoned Cart Tracking Schema (Separate Collection)
const abandonedCartSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  userName: { type: String, default: '' },
  mobile: { type: String, default: '' },
  cartItems: { type: Array, default: [] }
}, { timestamps: true });

// 🟢 3. Dedicated Wishlist Tracking Schema (Separate Collection)
const wishlistRecordSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  userName: { type: String, default: '' },
  mobile: { type: String, default: '' },
  wishlistItems: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const AbandonedCart = mongoose.model('AbandonedCart', abandonedCartSchema);
const WishlistRecord = mongoose.model('WishlistRecord', wishlistRecordSchema);

module.exports = {
  User,
  AbandonedCart,
  WishlistRecord
};