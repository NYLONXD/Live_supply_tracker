const mongoose = require('mongoose');
const logger = require('../utils/logger.utils');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Index creation
    await createIndexes();
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  const Shipment = require('../models/Shipment.models');
  const Route = require('../models/Router.models');
  
  await Shipment.collection.createIndex({ userId: 1, createdAt: -1 });
  await Shipment.collection.createIndex({ routeId: 1 });
  await Route.collection.createIndex({ from: 1, to: 1 }, { unique: true });
  
  logger.info('Database indexes created');
};

module.exports = connectDB;