const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const axios = require('axios');
const Shipment = require('./models/Shipment');
const mongoose = require('mongoose');
const shipmentRoutes = require('./routes/shipments');
const taskRoutes = require('./routes/taskRoutes');
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

mongoose.connect('mongodb://127.0.0.1:27017/supplyTracker')
  .then(() => console.log('MongoDB connected'))
  .catch(console.error);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('send_location', async (data) => {
    const { lat, lng, eta, city, status } = data;
    try {
      const shipment = new Shipment({ lat, lng, eta, city, status });
      await shipment.save();
      console.log('Shipment saved');
    } catch (error) {
      console.error('DB save error:', error);
    }
    socket.broadcast.emit('receive_location', data);
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

server.listen(5000, () => console.log('Server running on port 5000'));

app.use('/api/shipments', shipmentRoutes);
app.use('/api/tasks', taskRoutes);