const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Google Auth Route
router.post('/google', async (req, res) => {
  const { name, email, googleId, avatar } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        avatar,
        password: 'google_authenticated_user',
        isVerified: true,
        mobile: '',
        address: '',
        pincode: ''
      });
      await user.save();
    }

    res.json({ message: 'Google Auth Successful', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. EMAIL SIGN UP ROUTE (Direct Signup - Testing Mode, No Email/OTP Required)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, mobile, address, pincode } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email. Please Login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      address,
      pincode,
      isVerified: true // Direct verified maan liya hai taaki OTP ki zarurat na pade
    });
    
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });

    console.log(`✅ User Registered Successfully: ${email}`);
    res.status(200).json({ 
      message: 'Registration successful!',
      token,
      user
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
});

// 3. VERIFY OTP ROUTE (Optional fallback)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Already verified', user });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// 4. LOGIN ROUTE (Bina OTP ke seedha Email aur Password se Direct Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please Sign Up first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });

    console.log(`🔓 User Logged In: ${email}`);
    res.status(200).json({
      message: 'Login successful!',
      token,
      user
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;