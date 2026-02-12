import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents } from '@talk-space/shared/types/messages.js';
import { TICK_RATE } from '@talk-space/shared/types/messages.js';
import { UserManager } from './managers/UserManager.js';
import { SpatialGrid } from './managers/SpatialGrid.js';
import { MediasoupService } from './services/mediasoup.js';

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
const spatialGrid = new SpatialGrid();
const mediasoupService = new MediasoupService();

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

    // Register in spatial grid and mediasoup
    spatialGrid.addUser(socket.id, user.position);
    mediasoupService.addUser(socket.id);

    socket.emit('joinSuccess', {
      id: socket.id,
      users: userManager.getAllUsers(),
    });

    socket.broadcast.emit('userJoined', user);
  });

  socket.on('positionUpdate', (position) => {
    const updated = userManager.updatePosition(socket.id, position);
    if (!updated) return;

    // Update spatial grid and detect proximity events
    const user = userManager.getUser(socket.id);
    if (!user) return;

    const events = spatialGrid.updatePosition(socket.id, user.position);

    for (const event of events) {
      if (event.type === 'enter') {
        // Notify both users of proximity enter
        socket.emit('proximityEnter', {
          userId: event.userId,
          distance: event.distance,
        });
        io.to(event.userId).emit('proximityEnter', {
          userId: socket.id,
          distance: event.distance,
        });

        // If the other user has a producer, notify this user
        if (mediasoupService.hasProducer(event.userId)) {
          socket.emit('newProducer', {
            producerId: mediasoupService.getProducerId(event.userId)!,
            userId: event.userId,
          });
        }
        // If this user has a producer, notify the other user
        if (mediasoupService.hasProducer(socket.id)) {
          io.to(event.userId).emit('newProducer', {
            producerId: mediasoupService.getProducerId(socket.id)!,
            userId: socket.id,
          });
        }
      } else {
        // Proximity exit: notify both users
        socket.emit('proximityExit', { userId: event.userId });
        io.to(event.userId).emit('proximityExit', { userId: socket.id });
      }
    }
  });

  socket.on('disconnect', (reason) => {
    const user = userManager.getUser(socket.id);
    if (user) {
      console.log(`User left: ${user.username} (${reason})`);

      // Get users who were in proximity before removing
      const nearbyUserIds = spatialGrid.removeUser(socket.id);

      // Notify nearby users of proximity exit
      for (const otherId of nearbyUserIds) {
        io.to(otherId).emit('proximityExit', { userId: socket.id });
      }

      // Clean up mediasoup resources
      mediasoupService.removeUser(socket.id);

      userManager.removeUser(socket.id);
      io.emit('userLeft', socket.id);
    }
  });

  // --- WebRTC Signaling Handlers ---

  socket.on('getRouterRtpCapabilities', (callback) => {
    try {
      const capabilities = mediasoupService.getRouterRtpCapabilities();
      callback(capabilities);
    } catch (err) {
      console.error('getRouterRtpCapabilities error:', err);
      callback(null as unknown);
    }
  });

  socket.on('createTransport', async (data, callback) => {
    try {
      const options = await mediasoupService.createTransport(
        socket.id,
        data.direction
      );
      callback(options);
    } catch (err) {
      console.error('createTransport error:', err);
      callback(null as any);
    }
  });

  socket.on('connectTransport', async (data, callback) => {
    try {
      await mediasoupService.connectTransport(
        socket.id,
        data.transportId,
        data.dtlsParameters
      );
      callback({ connected: true });
    } catch (err) {
      console.error('connectTransport error:', err);
      callback({ connected: false });
    }
  });

  socket.on('produce', async (data, callback) => {
    try {
      const producerId = await mediasoupService.produce(
        socket.id,
        data.transportId,
        data.kind,
        data.rtpParameters
      );
      callback({ producerId });

      // Notify all nearby users that this user is now producing
      const nearbyUserIds = spatialGrid.getNearbyUsers(socket.id);
      for (const otherId of nearbyUserIds) {
        io.to(otherId).emit('newProducer', {
          producerId,
          userId: socket.id,
        });
      }
    } catch (err) {
      console.error('produce error:', err);
      callback({ producerId: '' });
    }
  });

  socket.on('consume', async (data, callback) => {
    try {
      const producerUserId = mediasoupService.findUserByProducerId(
        data.producerId
      );
      if (!producerUserId) {
        callback(null as any);
        return;
      }

      // Verify users are actually in proximity before allowing consume
      if (!spatialGrid.areInProximity(socket.id, producerUserId)) {
        callback(null as any);
        return;
      }

      const result = await mediasoupService.consume(
        socket.id,
        producerUserId,
        data.rtpCapabilities
      );

      if (result) {
        callback(result);
      } else {
        callback(null as any);
      }
    } catch (err) {
      console.error('consume error:', err);
      callback(null as any);
    }
  });

  socket.on('consumerResume', async (data, callback) => {
    try {
      await mediasoupService.resumeConsumer(socket.id, data.consumerId);
      callback({ resumed: true });
    } catch (err) {
      console.error('consumerResume error:', err);
      callback({ resumed: false });
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

// Initialize mediasoup and start server
async function startServer() {
  await mediasoupService.initialize();

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Broadcasting positions at ${TICK_RATE}Hz`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
