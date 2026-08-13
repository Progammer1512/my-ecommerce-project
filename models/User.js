const mongoose = require('mongoose');

// 1. Main Store Customer Schema (Only for store shoppers)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  address: { type: String, default: '' },
  pincode: { type: String, default: '' },
  googleId: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true });

// 🟢 2. Separate Admin & Staff User Schema (Only for store managers, inventory, support)
const adminUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Admin' }, // Admin, Inventory, Support, etc.
  mobile: { type: String, default: '' }
}, { timestamps: true });

// 3. Dedicated Abandoned Cart Tracking Schema (Separate Collection)
const abandonedCartSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  userName: { type: String, default: '' },
  mobile: { type: String, default: '' },
  cartItems: { type: Array, default: [] }
}, { timestamps: true });

// 4. Dedicated Wishlist Tracking Schema (Separate Collection)
const wishlistRecordSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  userName: { type: String, default: '' },
  mobile: { type: String, default: '' },
  wishlistItems: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const AdminUser = mongoose.model('AdminUser', adminUserSchema);
const AbandonedCart = mongoose.model('AbandonedCart', abandonedCartSchema);
const WishlistRecord = mongoose.model('WishlistRecord', wishlistRecordSchema);

module.exports = {
  User,
  AdminUser,
  AbandonedCart,
  WishlistRecord
};