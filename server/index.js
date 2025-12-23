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

// Routes
const authRoutes = require('./routes/auth.routes');
const shipmentRoutes = require('./routes/shipments.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const taskRoutes = require('./routes/taskRoutes.routes');
const adminRoutes = require('./routes/admin.routes');
const driverRoutes = require('./routes/driver.routes');
const trackingRoutes = require('./routes/tracking.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Rate Limiting
app.use('/api', apiLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/ai', aiRoutes);

// Socket.IO Events
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Join specific shipment room for tracking
  socket.on('join_shipment', (trackingNumber) => {
    socket.join(`shipment_${trackingNumber}`);
    logger.info(`Socket ${socket.id} joined shipment_${trackingNumber}`);
  });

  // Leave shipment room
  socket.on('leave_shipment', (trackingNumber) => {
    socket.leave(`shipment_${trackingNumber}`);
    logger.info(`Socket ${socket.id} left shipment_${trackingNumber}`);
  });

  // Driver sends location update
  socket.on('update_location', async (data) => {
    const { shipmentId, trackingNumber, lat, lng } = data;
    
    // Broadcast to all users tracking this shipment
    io.to(`shipment_${trackingNumber}`).emit('location_updated', {
      shipmentId,
      trackingNumber,
      location: { lat, lng },
      timestamp: new Date(),
    });
    
    logger.info(`Location updated for shipment ${trackingNumber}`);
  });

  // Status update
  socket.on('status_changed', (data) => {
    const { trackingNumber, status } = data;
    io.to(`shipment_${trackingNumber}`).emit('status_updated', {
      ...data,
      timestamp: new Date(),
    });
    logger.info(`Status updated for shipment ${trackingNumber}: ${status}`);
  });

  // ETA update
  socket.on('eta_changed', (data) => {
    const { trackingNumber, newETA } = data;
    io.to(`shipment_${trackingNumber}`).emit('eta_updated', {
      ...data,
      timestamp: new Date(),
    });
    logger.info(`ETA updated for shipment ${trackingNumber}: ${newETA} minutes`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available to controllers
app.set('io', io);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = { app, io };