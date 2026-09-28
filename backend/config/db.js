const mongoose = require('mongoose');
const env = require('./env');
async function connectDB() {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
}
module.exports = { connectDB };
