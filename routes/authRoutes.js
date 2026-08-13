const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// 🟢 IMPORT ALL MODELS INCLUDING AdminUser FROM User.js
const { User, AdminUser, AbandonedCart, WishlistRecord } = require('../models/User');

// 1. Google Auth Route
router.post('/google', async (req, res) => {
  const { name, email, googleId, avatar } = req.body;

  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = new User({
        name,
        email: cleanEmail,
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

// 2. EMAIL SIGN UP ROUTE (For Customers)
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
      isVerified: true
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

// 3. VERIFY OTP ROUTE
router.post('/verify-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Already verified', user });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// 4. LOGIN ROUTE
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

// 🟢 5. FETCH ALL CUSTOMERS ROUTE FOR ADMIN (ONLY PURE CUSTOMERS, NO ADMINS/STAFF)
router.get('/customers', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    
    const customers = await Promise.all(users.map(async (u) => {
      const cartRecord = await AbandonedCart.findOne({ userEmail: u.email }).lean();
      const wishlistRecord = await WishlistRecord.findOne({ userEmail: u.email }).lean();

      return {
        ...u,
        cart: cartRecord ? cartRecord.cartItems : [],
        wishlist: wishlistRecord ? wishlistRecord.wishlistItems : []
      };
    }));

    console.log(`📡 Fetching ${customers.length} pure customers for Admin Intelligence.`);
    res.status(200).json(customers);
  } catch (error) {
    console.error('Fetch Customers Error:', error);
    res.status(500).json({ message: 'Failed to fetch customers: ' + error.message });
  }
});

// ==========================================
// 🟢 NEW ADMIN & STAFF USERS MANAGEMENT ENDPOINTS
// ==========================================

// A. Get All Admin/Staff Users
router.get('/admin-users', async (req, res) => {
  try {
    const admins = await AdminUser.find({}).sort({ createdAt: -1 }).lean();
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin users: ' + error.message });
  }
});

// B. Create New Admin/Staff User
router.post('/admin-users', async (req, res) => {
  try {
    const { name, email, password, role, mobile } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingAdmin = await AdminUser.findOne({ email: cleanEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists with this email!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new AdminUser({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'Admin',
      mobile: mobile || ''
    });

    await newAdmin.save();
    const updatedAdmins = await AdminUser.find({}).sort({ createdAt: -1 });
    res.status(201).json({ message: 'Admin user created successfully!', admins: updatedAdmins });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create admin user: ' + error.message });
  }
});

// C. Update Admin/Staff User
router.put('/admin-users/:id', async (req, res) => {
  try {
    const { name, email, role, mobile, password } = req.body;
    const updateData = { name, email: email ? email.toLowerCase().trim() : undefined, role, mobile };

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updated = await AdminUser.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    const allAdmins = await AdminUser.find({}).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Admin updated successfully!', admins: allAdmins });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update admin: ' + error.message });
  }
});

// D. Delete Admin/Staff User
router.delete('/admin-users/:id', async (req, res) => {
  try {
    await AdminUser.findByIdAndDelete(req.params.id);
    const remainingAdmins = await AdminUser.find({}).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Admin user deleted successfully!', admins: remainingAdmins });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete admin user: ' + error.message });
  }
});

// ==========================================

// 🟢 6. UPDATE PROFILE + SYNC CART & WISHLIST TO SEPARATE MONGODB COLLECTIONS
router.put('/profile', async (req, res) => {
  try {
    const { email, name, mobile, address, pincode, cart, wishlist } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email ID is required to update profile' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Update main User profile info
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (mobile !== undefined) updateFields.mobile = mobile;
    if (address !== undefined) updateFields.address = address;
    if (pincode !== undefined) updateFields.pincode = pincode;

    let user = await User.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    if (!user) {
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

    // 🟢 SYNC CART TO SEPARATE AbandonedCart COLLECTION
    if (cart !== undefined && Array.isArray(cart)) {
      await AbandonedCart.findOneAndUpdate(
        { userEmail: cleanEmail },
        { 
          $set: { 
            userName: user.name, 
            mobile: user.mobile || mobile || '', 
            cartItems: cart 
          } 
        },
        { upsert: true, new: true }
      );
    }

    // 🟢 SYNC WISHLIST TO SEPARATE WishlistRecord COLLECTION
    if (wishlist !== undefined && Array.isArray(wishlist)) {
      await WishlistRecord.findOneAndUpdate(
        { userEmail: cleanEmail },
        { 
          $set: { 
            userName: user.name, 
            mobile: user.mobile || mobile || '', 
            wishlistItems: wishlist 
          } 
        },
        { upsert: true, new: true }
      );
    }

    // Fetch final merged user object to return
    const finalCart = await AbandonedCart.findOne({ userEmail: cleanEmail }).lean();
    const finalWishlist = await WishlistRecord.findOne({ userEmail: cleanEmail }).lean();

    const mergedUserResponse = {
      ...user.toObject(),
      cart: finalCart ? finalCart.cartItems : [],
      wishlist: finalWishlist ? finalWishlist.wishlistItems : []
    };

    console.log(`✏️ Profile & Separate Collections Updated for: ${cleanEmail}. Cart items: ${mergedUserResponse.cart.length}, Wishlist items: ${mergedUserResponse.wishlist.length}`);

    res.status(200).json({
      message: 'Profile and separate tracking records updated successfully in MongoDB!',
      user: mergedUserResponse
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile in database', error: error.message });
  }
});

// 🟢 7. INSTANT DELETE USER ACCOUNT & SEPARATE RECORDS
router.delete('/profile', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email ID is required to delete account' });
    }

    const cleanEmail = email.toLowerCase().trim();
    await User.findOneAndDelete({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
    await AbandonedCart.findOneAndDelete({ userEmail: cleanEmail });
    await WishlistRecord.findOneAndDelete({ userEmail: cleanEmail });

    console.log(`🗑️ Account & Separate Tracking Records Deleted from MongoDB: ${cleanEmail}`);

    res.status(200).json({ message: 'Account and tracking data permanently deleted from database.' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

module.exports = router;