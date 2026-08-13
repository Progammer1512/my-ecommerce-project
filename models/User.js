const mongoose = require('mongoose');

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
  isAdmin: { type: Boolean, default: false },
  
  // 🟢 NEW TRACKING FIELDS FOR ABANDONED CART & WISHLIST RECOVERY
  cart: { type: Array, default: [] },
  wishlist: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);