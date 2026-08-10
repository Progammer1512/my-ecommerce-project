const mongoose = require('mongoose');
const Product = require('./models/Product');

const sampleProducts = [
  {
    name: 'Wireless Noise-Canceling Headphones',
    price: 2999,
    category: 'Electronics',
    description: 'Immersive sound quality with active noise cancellation and 30-hour battery life.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    rating: 4.5,
    countInStock: 15
  }
];

const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    // Agar database pehle se bhara hai, toh yeh kuch delete nahi karega!
    if (count === 0) {
      await Product.insertMany(sampleProducts);
      console.log('✅ Initial Products Seeded Successfully!');
    } else {
      console.log('📦 Database already has products. Skipping seeder override.');
    }
  } catch (error) {
    console.log('Error seeding data:', error.message);
  }
};

module.exports = seedProducts;