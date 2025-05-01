import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const SOCKET_PORT = process.env.SOCKET_PORT1 || 8080;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', socket => {
    console.log('a user connected');

    socket.on('subscribe', async newRoom => {
        try {
            socket.join(newRoom);
            console.log(`User joined new room: ${newRoom}`);
        } catch (err) {
            console.error('Error handling room subscription:', err);
        }
    });

    // Leaving a room
    socket.on('unsubscribe', room => {
        socket.leave(room);
        console.log(`User left room: ${room}`);
    });

    // Emitting an event to a particular room
    /**
     * to - the particuler room id that you want to emit ex: userid
     * emit - emit name of what you want to emit
     * data - object that what you want to provide by emit
     */
    socket.on('emittoroom', ({ to, emit, data }) => {
        io.to(to).emit(emit, data);
    });

    // Emitting an event to a particular room
    /**
     * to - the array of room ids that you want to emit ex: ["userid1", "userid2", "userid3"]
     * emit - emit name of what you want to emit
     * data - object that what you want to provide by emit
     */
    socket.on('emittomultipleroom', ({ to, emit, data }) => {
        io.to(to).emit(emit, data);
    });

    // Emitting an event to a particular room
    /**
     * emit - emit name of what you want to emitcd
     * data - object that what you want to provide by emit
     */
    socket.on('emittoall', ({ emit, data }) => {
        io.emit(emit, { data });
    });

    // When a client disconnects
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(SOCKET_PORT, '127.0.0.1', () => {
    console.log(`listening on *:${SOCKET_PORT}`);
});