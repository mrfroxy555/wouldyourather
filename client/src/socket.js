import { io } from 'socket.io-client';

// In production, this should point to the actual server URL
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export const socket = io(URL, {
    autoConnect: false
});
