const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  pincode: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, // OTP verify hone ke baad true hoga
  otp: { type: String },
  otpExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);