import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents } from '@talk-space/shared/types/messages.js';
import { TICK_RATE } from '@talk-space/shared/types/messages.js';
import { UserManager } from './managers/UserManager.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const userManager = new UserManager();

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    users: userManager.getUserCount(),
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join', (username) => {
    const user = userManager.addUser(socket.id, username);
    console.log(`User joined: ${username} (${socket.id})`);

    // Send the new user their own info + all existing users
    socket.emit('joinSuccess', {
      id: socket.id,
      users: userManager.getAllUsers(),
    });

    // Notify everyone else
    socket.broadcast.emit('userJoined', user);
  });

  socket.on('positionUpdate', (position) => {
    userManager.updatePosition(socket.id, position);
  });

  socket.on('disconnect', (reason) => {
    const user = userManager.getUser(socket.id);
    if (user) {
      console.log(`User left: ${user.username} (${reason})`);
      userManager.removeUser(socket.id);
      io.emit('userLeft', socket.id);
    }
  });
});

// 30Hz position broadcast
const BROADCAST_INTERVAL = 1000 / TICK_RATE;

setInterval(() => {
  const users = userManager.getAllUsers();
  if (users.length > 0) {
    io.emit('positionUpdate', users);
  }
}, BROADCAST_INTERVAL);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Broadcasting positions at ${TICK_RATE}Hz`);
});
