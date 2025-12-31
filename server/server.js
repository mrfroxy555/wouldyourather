const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const gameHandler = require('./socket/gameHandler');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

// Database Connection
const mongoUri = process.env.MONGO_URI;
console.log('Attempting to connect to MongoDB...');
mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('URI used:', mongoUri ? mongoUri.split('@')[1] : 'UNDEFINED');
    });

// Socket.IO
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);
    gameHandler(io, socket);

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
