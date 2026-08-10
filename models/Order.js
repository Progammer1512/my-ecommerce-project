const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: String, default: 'GuestUser' },
  userEmail: { type: String, default: 'guest@techstore.com' },
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true },
      product: { type: String },
      image: { type: String }
    }
  ],
  shippingAddress: {
    name: { type: String },
    address: { type: String, required: true },
    phone: { type: String }
  },
  paymentMethod: { type: String, default: 'Cash on Delivery (COD)' },
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'Processing' },
  returnRequest: { type: Object }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);