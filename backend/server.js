require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startJobs } = require('./src/jobs/index');
const setupSocket = require('./src/socket/index');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocket(io);
app.set('io', io);   // makes io available as req.app.get('io') in controllers

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Instora server running on port ${PORT}`);
    startJobs();
  });
});