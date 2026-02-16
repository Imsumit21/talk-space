import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@talk-space/shared/types/messages.js";
import { TICK_RATE } from "@talk-space/shared/types/messages.js";
import { UserManager } from "./managers/UserManager.js";
import { SpatialGrid } from "./managers/SpatialGrid.js";
import { MediasoupService } from "./services/mediasoup.js";
import { verifyAccessToken } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { friendsRouter } from "./routes/friends.js";
import { rateLimit } from "./middleware/rateLimit.js";
import {
  savePosition,
  getLastPosition,
} from "./services/positionPersistence.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json({ limit: "3mb" })); // 3MB for avatar uploads
app.use(rateLimit);

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const userManager = new UserManager();
const spatialGrid = new SpatialGrid();
const mediasoupService = new MediasoupService();

// --- Session maps: bridge socket.id <-> persistent userId ---
const socketToUser = new Map<string, string>();
const userToSocket = new Map<string, string>();

// --- REST Routes ---

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    users: userManager.getUserCount(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/friends", friendsRouter);

// Serve uploaded avatars (dev only; in prod, use S3/CDN)
app.use("/uploads", express.static("./uploads"));

// --- Socket.io Auth Middleware ---

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, avatarUrl: true },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data.userId = user.id;
    socket.data.username = user.username;
    socket.data.avatarUrl = user.avatarUrl;

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

// --- Socket.io Connection Handler ---

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} (user: ${socket.data.userId})`);

  // Online status heartbeat
  let onlineHeartbeat: ReturnType<typeof setInterval> | null = null;

  socket.on("join", async (callback) => {
    const userId = socket.data.userId as string;
    const username = socket.data.username as string;
    const avatarUrl = socket.data.avatarUrl as string | null;

    // Register in session maps
    socketToUser.set(socket.id, userId);
    userToSocket.set(userId, socket.id);

    // Restore last position from Redis
    const lastPosition = await getLastPosition(userId);

    const user = userManager.addUser(
      socket.id,
      username,
      userId,
      avatarUrl,
      lastPosition ?? undefined,
    );
    console.log(`User joined: ${username} (${socket.id}, userId: ${userId})`);

    spatialGrid.addUser(socket.id, user.position);
    mediasoupService.addUser(socket.id);

    // Set online status in Redis
    await redis.set(`online:${userId}`, socket.id, "EX", 60);
    onlineHeartbeat = setInterval(async () => {
      await redis.set(`online:${userId}`, socket.id, "EX", 60);
    }, 30_000);

    callback({
      id: socket.id,
      userId,
      users: userManager.getAllUsers(),
    });

    socket.broadcast.emit("userJoined", user);
  });

  socket.on("positionUpdate", (position) => {
    const updated = userManager.updatePosition(socket.id, position);
    if (!updated) return;

    const user = userManager.getUser(socket.id);
    if (!user) return;

    const events = spatialGrid.updatePosition(socket.id, user.position);

    for (const event of events) {
      if (event.type === "enter") {
        socket.emit("proximityEnter", {
          userId: event.userId,
          distance: event.distance,
        });
        io.to(event.userId).emit("proximityEnter", {
          userId: socket.id,
          distance: event.distance,
        });

        if (mediasoupService.hasProducer(event.userId)) {
          socket.emit("newProducer", {
            producerId: mediasoupService.getProducerId(event.userId)!,
            userId: event.userId,
          });
        }
        if (mediasoupService.hasProducer(socket.id)) {
          io.to(event.userId).emit("newProducer", {
            producerId: mediasoupService.getProducerId(socket.id)!,
            userId: socket.id,
          });
        }
      } else {
        socket.emit("proximityExit", { userId: event.userId });
        io.to(event.userId).emit("proximityExit", { userId: socket.id });
      }
    }
  });

  socket.on("disconnect", async (reason) => {
    const user = userManager.getUser(socket.id);
    const userId = socketToUser.get(socket.id);

    if (user) {
      console.log(`User left: ${user.username} (${reason})`);

      const nearbyUserIds = spatialGrid.removeUser(socket.id);
      for (const otherId of nearbyUserIds) {
        io.to(otherId).emit("proximityExit", { userId: socket.id });
      }

      mediasoupService.removeUser(socket.id);
      userManager.removeUser(socket.id);
      io.emit("userLeft", socket.id);
    }

    // Clean up session maps and online status
    socketToUser.delete(socket.id);
    if (userId) {
      userToSocket.delete(userId);
      await redis.del(`online:${userId}`);
    }
    if (onlineHeartbeat) {
      clearInterval(onlineHeartbeat);
      onlineHeartbeat = null;
    }
  });

  // --- WebRTC Signaling Handlers ---

  socket.on("getRouterRtpCapabilities", (callback) => {
    try {
      const capabilities = mediasoupService.getRouterRtpCapabilities();
      callback(capabilities);
    } catch (err) {
      console.error("getRouterRtpCapabilities error:", err);
      callback(null as unknown);
    }
  });

  socket.on("createTransport", async (data, callback) => {
    try {
      const options = await mediasoupService.createTransport(
        socket.id,
        data.direction,
      );
      callback(options);
    } catch (err) {
      console.error("createTransport error:", err);
      callback(null as any);
    }
  });

  socket.on("connectTransport", async (data, callback) => {
    try {
      await mediasoupService.connectTransport(
        socket.id,
        data.transportId,
        data.dtlsParameters,
      );
      callback({ connected: true });
    } catch (err) {
      console.error("connectTransport error:", err);
      callback({ connected: false });
    }
  });

  socket.on("produce", async (data, callback) => {
    try {
      const producerId = await mediasoupService.produce(
        socket.id,
        data.transportId,
        data.kind,
        data.rtpParameters,
      );
      callback({ producerId });

      const nearbyUserIds = spatialGrid.getNearbyUsers(socket.id);
      for (const otherId of nearbyUserIds) {
        io.to(otherId).emit("newProducer", {
          producerId,
          userId: socket.id,
        });
      }
    } catch (err) {
      console.error("produce error:", err);
      callback({ producerId: "" });
    }
  });

  socket.on("consume", async (data, callback) => {
    try {
      const producerUserId = mediasoupService.findUserByProducerId(
        data.producerId,
      );
      if (!producerUserId) {
        callback(null as any);
        return;
      }

      if (!spatialGrid.areInProximity(socket.id, producerUserId)) {
        callback(null as any);
        return;
      }

      const result = await mediasoupService.consume(
        socket.id,
        producerUserId,
        data.rtpCapabilities,
      );

      if (result) {
        callback(result);
      } else {
        callback(null as any);
      }
    } catch (err) {
      console.error("consume error:", err);
      callback(null as any);
    }
  });

  socket.on("consumerResume", async (data, callback) => {
    try {
      await mediasoupService.resumeConsumer(socket.id, data.consumerId);
      callback({ resumed: true });
    } catch (err) {
      console.error("consumerResume error:", err);
      callback({ resumed: false });
    }
  });

  // --- Lobby Handlers ---

  socket.on("getOnlineCount", () => {
    const count = userManager.getUserCount();
    socket.emit("onlineCount", count);
  });
});

// 30Hz position broadcast
const BROADCAST_INTERVAL = 1000 / TICK_RATE;

setInterval(() => {
  const users = userManager.getAllUsers();
  if (users.length > 0) {
    io.emit("positionUpdate", users);
  }
}, BROADCAST_INTERVAL);

// Save positions to Redis every 5 seconds
setInterval(() => {
  const users = userManager.getAllUsers();
  for (const user of users) {
    savePosition(user.userId, user.position.x, user.position.y);
  }
}, 5000);

// Initialize mediasoup and start server
async function startServer() {
  await mediasoupService.initialize();

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Broadcasting positions at ${TICK_RATE}Hz`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
