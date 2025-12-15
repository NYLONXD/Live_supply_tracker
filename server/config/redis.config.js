const Redis = require('ioredis');
const logger = require('../utils/logger.utils');

// Build redis URL and log a small, non-secret preview for troubleshooting
let redisUrl = process.env.REDIS_URL || null;
logger.info('Redis URL present', { hasUrl: !!redisUrl, host: redisUrl ? redisUrl.split('@').pop().split(':')[0] : null });

// Build options depending on scheme
const redisOptions = {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

if (redisUrl && redisUrl.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

// Use the (url, options) constructor form so ioredis parses the URL correctly
const redis = new Redis(redisUrl, redisOptions);

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('error', (err) => {
  // Log full error object so we can see why connection fails
  logger.error('Redis error', {
    message: err && err.message,
    stack: err && err.stack,
    error: err,
  });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
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