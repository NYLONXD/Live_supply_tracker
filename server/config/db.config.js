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

    await createIndexes();
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  const Shipment      = require('../models/Shipment.models');
  const User          = require('../models/user.models');
  const Organization  = require('../models/Organization.models');

  try {
    await Shipment.collection.dropIndex('trackingNumber_1');
  } catch (err) {
    // index may not exist — ignore
  }

  await Shipment.collection.createIndex({ organizationId: 1, createdAt: -1 });
  await Shipment.collection.createIndex({ createdBy: 1, createdAt: -1 });
  await Shipment.collection.createIndex({ assignedDriver: 1, status: 1 });
  await Shipment.collection.createIndex({ trackingNumber: 1 }, { unique: true });

  await User.collection.createIndex({ email: 1 }, { unique: true });
  await User.collection.createIndex({ role: 1 });
  await User.collection.createIndex({ organizationId: 1, role: 1 });

  await Organization.collection.createIndex({ slug: 1 }, { unique: true });

  logger.info('Database indexes created');
};

module.exports = connectDB;