import { io } from 'socket.io-client';

// Replace with your server URL
const socket = io(process.env.SOCKET_URL);

// Handle connection
socket.on('connect', () => {
    console.log(`\n Connected with socket id: ${socket.id} \n`);
});

// Handle disconnection
socket.on('disconnect', reason => {
    console.log('Disconnected from server', reason);
});

const emitToRoom = ({ to, emit, data }) => {
    socket.emit('emittoroom', { to, emit, data });
};

const emitToMultipleRoom = ({ to, emit, data }) => {
    socket.emit('emittomultipleroom', { to, emit, data });
};

const emittoAll = ({ emit, data }) => {
    socket.emit('emittoall', { emit, data });
};

export {
    emittoAll,
    emitToRoom,
    emitToMultipleRoom
}