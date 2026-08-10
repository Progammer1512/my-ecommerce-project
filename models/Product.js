const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    images: [{ type: String }],
    rating: { type: Number, default: 4.0 },
    numReviews: { type: Number, default: 0 },
    countInStock: { type: Number, default: 10 },
    colors: [{ type: String }],
    sizes: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);