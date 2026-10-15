const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 4000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Connected clients
const socketConnected = new Set();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socketConnected.add(socket.id);

    // Update total clients
    io.emit('clients-total', socketConnected.size);

    // Receive and broadcast messages
    socket.on('message', (data) => {
        console.log('Message received:', data);

        // Send to everyone except the sender
        socket.broadcast.emit('chat-message', data);
    });

    // Typing feedback
    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        socketConnected.delete(socket.id);

        io.emit('clients-total', socketConnected.size);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`💬 Server running at http://localhost:${PORT}`);
});