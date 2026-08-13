const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Google Auth Route
router.post('/google', async (req, res) => {
  const { name, email, googleId, avatar } = req.body;

  try {
    let user = await User.findOne({ email: email ? email.toLowerCase().trim() : '' });

    if (!user) {
      user = new User({
        name,
        email: email ? email.toLowerCase().trim() : '',
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

    const cleanEmail = email ? email.toLowerCase().trim() : '';

    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email. Please Login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email: cleanEmail,
      password: hashedPassword,
      mobile: mobile || '',
      address: address || '',
      pincode: pincode || '',
      isVerified: true // Direct verified maan liya hai taaki OTP ki zarurat na pade
    });
    
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });

    console.log(`✅ User Registered Successfully: ${cleanEmail}`);
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
    const user = await User.findOne({ email: email ? email.toLowerCase().trim() : '' });
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
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please Sign Up first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });

    console.log(`🔓 User Logged In: ${cleanEmail}`);
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

// 🟢 5. UPDATE USER PROFILE ROUTE (PUT /api/auth/profile)
router.put('/profile', async (req, res) => {
  try {
    const { email, name, mobile, address, pincode } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email ID is required to update profile' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await User.findOneAndUpdate(
      { email: cleanEmail },
      { 
        $set: { 
          name: name || '', 
          mobile: mobile || '', 
          address: address || '', 
          pincode: pincode || '' 
        } 
      },
      { new: true, runValidators: false }
    );

    if (!user) {
      // If user profile record not created via signup, upsert it
      user = new User({
        email: cleanEmail,
        name: name || 'Verified Customer',
        password: 'google_authenticated_user',
        mobile: mobile || '',
        address: address || '',
        pincode: pincode || '',
        isVerified: true
      });
      await user.save();
    }

    console.log(`✏️ Profile Updated in MongoDB for: ${cleanEmail}`);

    res.status(200).json({
      message: 'Profile updated successfully in MongoDB!',
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        pincode: user.pincode
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile in database', error: error.message });
  }
});

// 🟢 6. INSTANT DELETE USER ACCOUNT ROUTE (DELETE /api/auth/profile)
router.delete('/profile', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email ID is required to delete account' });
    }

    const cleanEmail = email.toLowerCase().trim();
    await User.findOneAndDelete({ email: cleanEmail });

    console.log(`🗑️ Account Permanently Deleted from MongoDB: ${cleanEmail}`);

    res.status(200).json({ message: 'Account permanently deleted from database.' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

module.exports = router;