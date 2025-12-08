const Redis = require('ioredis');
const logger = require('../utils/logger.utils');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

// Cache helper methods
const cache = {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
    }
  },

  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache delete error: ${error.message}`);
    }
  },

  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache pattern delete error: ${error.message}`);
    }
  },
};

module.exports = { redis, cache };