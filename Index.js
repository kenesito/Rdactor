const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSockets } = require('./sockets');
 
dotenv.config();
connectDB();
 
const app = express();
const server = http.createServer(app);
 
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
 
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
 
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/content', require('./routes/content.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
 
initSockets(io);
 
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));