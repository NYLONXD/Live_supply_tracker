require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/db.config');
const logger = require('./utils/logger.utils');
const errorHandler = require('./middleware/errorHandle.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const organizationRoutes = require('./routes/organization.routes');
const authRoutes     = require('./routes/auth.routes');
const shipmentRoutes = require('./routes/shipments.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const taskRoutes     = require('./routes/taskRoutes.routes');
const adminRoutes    = require('./routes/admin.routes');
const driverRoutes   = require('./routes/driver.routes');
const trackingRoutes = require('./routes/tracking.routes');
const aiRoutes       = require('./routes/ai.routes');
const inviteRoutes = require('./routes/invite.route');
const User = require('./models/user.models');
const Shipment = require('./models/Shipment.models');
const aiService = require('./services/aiIntegration.service');
const { getTokenFromCookieHeader } = require('./middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const { cache } = require('./config/redis.config');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

connectDB();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Make io accessible in controllers
app.set('io', io);

app.use('/api/auth',      authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/analytics', analyticsRoutes);   // single analytics mount
app.use('/api/tasks',     taskRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/driver',    driverRoutes);
app.use('/api/track',     trackingRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/invites', inviteRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_shipment', (trackingNumber) => {
    socket.join(`shipment_${trackingNumber}`);
    logger.info(`Socket ${socket.id} joined shipment_${trackingNumber}`);
  });

  socket.on('leave_shipment', (trackingNumber) => {
    socket.leave(`shipment_${trackingNumber}`);
  });

  socket.on('driver_location_update', async (payload = {}) => {
    try {
      if (!socket.user || socket.user.role !== 'driver') {
        socket.emit('driver_location_error', { message: 'Driver authentication required' });
        return;
      }

      const { shipmentId, lat, lng } = payload;

      if (!shipmentId || lat === undefined || lng === undefined) {
        socket.emit('driver_location_error', { message: 'shipmentId, lat, and lng are required' });
        return;
      }

      const shipment = await Shipment.findOne({ _id: shipmentId, assignedDriver: socket.user._id });
      if (!shipment) {
        socket.emit('driver_location_error', { message: 'Shipment not found or not assigned to you' });
        return;
      }

      await shipment.updateLocation(lat, lng);

      const newETA = await aiService.updateETA(
        { lat, lng },
        { lat: shipment.delivery.lat, lng: shipment.delivery.lng }
      );

      await shipment.updateETA(newETA.estimatedMinutes);
      await cache.delPattern('shipments:*');
      await cache.del(`track:${shipment.trackingNumber}`);

      io.to(`shipment_${shipment.trackingNumber}`).emit('location_updated', {
        shipmentId: shipment._id.toString(),
        trackingNumber: shipment.trackingNumber,
        location: { lat, lng },
        timestamp: new Date(),
      });

      io.to(`shipment_${shipment.trackingNumber}`).emit('eta_updated', {
        shipmentId: shipment._id.toString(),
        trackingNumber: shipment.trackingNumber,
        newETA: newETA.estimatedMinutes,
        timestamp: new Date(),
      });

      socket.emit('driver_location_ack', {
        shipmentId: shipment._id.toString(),
        currentETA: newETA.estimatedMinutes,
        remainingDistance: newETA.distance,
      });
    } catch (error) {
      logger.error(`Socket driver location update failed: ${error.message}`);
      socket.emit('driver_location_error', { message: 'Failed to update live location' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

io.use(async (socket, next) => {
  try {
    const token = getTokenFromCookieHeader(socket.handshake.headers.cookie || '');

    if (!token) {
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -__v');

    if (!user || !user.isActive) {
      socket.user = null;
      return next();
    }

    socket.user = user;
    next();
  } catch (error) {
    socket.user = null;
    next();
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = { app, io };
