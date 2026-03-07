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

const authRoutes     = require('./routes/auth.routes');
const shipmentRoutes = require('./routes/shipments.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const taskRoutes     = require('./routes/taskRoutes.routes');
const adminRoutes    = require('./routes/admin.routes');
const driverRoutes   = require('./routes/driver.routes');
const trackingRoutes = require('./routes/tracking.routes');
const aiRoutes       = require('./routes/ai.routes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
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

app.use(errorHandler);

// Socket.IO — only room join/leave here.
// Location updates go through HTTP POST /api/driver/location (saves to DB + emits here)
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_shipment', (trackingNumber) => {
    socket.join(`shipment_${trackingNumber}`);
    logger.info(`Socket ${socket.id} joined shipment_${trackingNumber}`);
  });

  socket.on('leave_shipment', (trackingNumber) => {
    socket.leave(`shipment_${trackingNumber}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = { app, io };