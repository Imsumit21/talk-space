# Proximity-Based Social Platform - Zero to MVP Roadmap

## Executive Summary

Building a web-based social platform similar to Gather.town with proximity-based voice chat, spatial audio, and real-time avatar movement.

**Target Scale:** 50-200 concurrent users (MVP/Beta)
**Tech Stack:** JavaScript/TypeScript ecosystem
**Deployment:** AWS/Cloud Platform
**Timeline:** 10 weeks to complete MVP → Beta

---

## 1. Tech Stack Selection

### Frontend Stack

| Component | Choice | Justification |
|-----------|--------|---------------|
| **Framework** | React 18.2+ with TypeScript 5.0+ | Largest ecosystem, excellent WebRTC libraries, team familiarity |
| **State Management** | Zustand 4.4+ | Lightweight (<1KB), perfect for real-time position updates |
| **Canvas Rendering** | PixiJS 7.3+ | Hardware-accelerated WebGL, 60 FPS with 200+ avatars |
| **WebRTC Client** | mediasoup-client 3.6+ | Production-ready SFU client, pairs with mediasoup server |
| **WebSocket Client** | Socket.io-client 4.6+ | Auto-reconnection, event-based messaging, room management |
| **Spatial Audio** | Web Audio API (Native) | Built-in browser API, PannerNode for 3D positional audio |
| **UI Framework** | Tailwind CSS 3.3+ | Rapid prototyping, small bundle, excellent dark mode |

**Key Dependencies:**
```json
{
  "react": "^18.2.0",
  "pixi.js": "^7.3.2",
  "mediasoup-client": "^3.6.95",
  "socket.io-client": "^4.6.1",
  "zustand": "^4.4.1",
  "tailwindcss": "^3.3.0"
}
```

### Backend Stack

| Component | Choice | Justification |
|-----------|--------|---------------|
| **Runtime** | Node.js 20.x LTS | Native ESM support, improved performance, long-term support |
| **REST Framework** | Express 4.18+ | Standard Node.js framework for auth/user APIs |
| **WebSocket Server** | Socket.io 4.6+ (TCP) | Position sync, proximity events, room management |

⚠️ **MOVEMENT LATENCY WARNING:**
- **Socket.io uses TCP** - Guaranteed delivery causes head-of-line blocking
- **Problem:** Lost packets block all subsequent packets → "rubber-banding" or "teleporting" avatars
- **MVP Strategy:** Start with Socket.io (simpler), monitor for lag
- **Upgrade Path:** If movement feels laggy, use **Geckos.io** (UDP over WebRTC DataChannels) for position updates only
- **Hybrid Approach:** Geckos.io for movement + Socket.io for chat/state (best of both worlds)
| **Media Server** | mediasoup 3.12+ | SFU for audio routing, handles 200+ users on single server |

⚠️ **CRITICAL DEPLOYMENT WARNING:**
- **mediasoup is NOT a standard npm package** - It's a C++ wrapper requiring compilation
- **Requires:** Python, GCC, Make, and OS-level build tools
- **Cannot deploy to:** Vercel, Netlify, standard shared hosting
- **Must use:** Docker containers OR VMs with root access (EC2, DigitalOcean Droplets)
- **Docker is REQUIRED from Phase 1**, not optional in Phase 5
| **Spatial System** | Custom Grid (200×200 cells) | O(N×k) proximity detection vs O(N²) naive approach |
| **Database** | PostgreSQL 15+ with Prisma 5.x | Type-safe ORM, user/friends/sessions storage |
| **Cache** | Redis 7.x with ioredis | Session storage, spatial grid cache, active user state |
| **Authentication** | JWT + Refresh Tokens | Access token (15min), refresh token (7 days), RS256 signing |

**Server Capacity Analysis (Single Server):**
- **Hardware:** AWS c6i.2xlarge (8 vCPU, 16GB RAM)
- **Position Updates:** 200 users × 30 updates/sec = 6,000 updates/sec → 3 CPU cores
- **Audio Streams:** 2,000 streams (200 users × avg 10 connections) → 4 CPU cores (mediasoup)
- **Network:** ~180Mbps (128Mbps audio + 48Mbps position data)
- **Verdict:** Single server handles 200 users comfortably ✓

### Deployment Infrastructure (AWS)

```
┌─────────────────────────────────────────────────┐
│          CloudFront CDN (Static Assets)         │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  ALB (HTTPS) + NLB (WebSocket/WebRTC UDP)       │
└────────┬──────────────────────┬─────────────────┘
         │                      │
┌────────▼──────────┐  ┌────────▼──────────┐
│  EC2 Auto Scaling │  │   ECS Fargate     │
│  (App Servers)    │  │  (Alternative)    │
└────────┬──────────┘  └───────────────────┘
         │
┌────────▼──────────┬──────────────┬─────────────┐
│  RDS PostgreSQL   │  ElastiCache │     S3      │
│  (db.t4g.small)   │  Redis       │  (Avatars)  │
└───────────────────┴──────────────┴─────────────┘
```

**Cost Estimate (200 concurrent users):**
- EC2 c6i.2xlarge: ~$250/month
- RDS PostgreSQL db.t4g.small: ~$60/month
- ElastiCache Redis cache.t4g.small: ~$40/month
- Data Transfer (2TB/month): ~$180/month
- **TURN Relay Servers:** ~$50-150/month (see warning below)
- **Total:** ~$580-680/month for 200 users

⚠️ **TURN SERVER COST WARNING:**
- **10-20% of users** behind strict corporate/school firewalls **require TURN relay**
- **AWS bandwidth is expensive** ($0.09/GB outbound)
- **Options:**
  1. **Self-hosted Coturn** (free but complex setup, requires separate server)
  2. **Twilio Network Traversal** (~$0.004/min relayed, pay-as-you-go)
  3. **Metered.ca** (~$0.50/GB, $50/month minimum)
  4. **Xirsys** (~$49/month for 50GB)
- **Budget conservatively:** Assume 15% of traffic needs TURN relay
- **200 users × 15% = 30 relayed users × 64kbps × 50% duty cycle = ~3.5GB/hour**

---

## 2. Core Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   PixiJS     │  Socket.io   │  mediasoup   │  Web Audio    │
│   Canvas     │   Client     │   Client     │     API       │
│  (Render)    │  (Position)  │  (WebRTC)    │  (Spatial)    │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬───────┘
       │              │              │               │
       │ 60 FPS       │ 30Hz         │ Signaling     │ Volume
       │ Avatars      │ Updates      │ + Audio       │ Control
       │              │              │               │
┌──────▼──────────────▼──────────────▼───────────────▼───────┐
│              Network Layer (WSS/HTTPS/UDP)                  │
└──────┬──────────────┬──────────────┬───────────────┬───────┘
       │              │              │               │
┌──────▼───────┬──────▼───────┬──────▼────────┬──────▼───────┐
│   Express    │  Socket.io   │  mediasoup    │    Redis     │
│   REST API   │   Server     │    Server     │    Cache     │
│              │              │               │              │
│ Auth, Users, │ Position     │ Audio Stream  │ User State,  │
│ Friends API  │ Sync, Grid   │ Routing (SFU) │ Grid Data    │
└──────┬───────┴──────┬───────┴──────┬────────┴──────┬───────┘
       │              │              │               │
       └──────────────┴──────────────┴───────────────┘
                           │
                    ┌──────▼────────┐
                    │  PostgreSQL   │
                    │  (Persistent) │
                    └───────────────┘
```

### Server-Side Responsibilities (Authoritative)

1. **Position Validation & Broadcasting**
   - Validate movement (max speed: 5 units/tick, prevent teleportation)
   - Broadcast positions only to nearby users (grid optimization)
   - Anti-cheat: Log suspicious activity

2. **Proximity Detection**
   - Grid-based spatial partitioning (200×200 unit cells)
   - Calculate distances between users in same/adjacent 9 cells
   - Emit `proximityEnter`/`proximityExit` events
   - Limit audio connections per user (max 10 simultaneous)

3. **WebRTC Signaling**
   - Relay SDP offer/answer between peers
   - Forward ICE candidates
   - Track active connections, enforce limits

4. **State Synchronization**
   - Persist user positions to Redis every 5 seconds
   - Handle reconnections (restore last position)
   - Cleanup on disconnect

### Client-Side Responsibilities (Presentation)

1. **Rendering**
   - Interpolate avatar positions between server updates (smooth 60 FPS)
   - Camera follow local player
   - Render UI overlays (nameplates, proximity indicators)

2. **Input Handling**
   - WASD/Arrow key input
   - Send throttled position updates (30Hz)
   - Optimistic local prediction

3. **Audio Management**
   - Create PannerNodes for spatial audio
   - Adjust volume based on distance (0-500 units)
   - Handle WebRTC stream playback

### Spatial Partitioning Algorithm (Grid-Based)

**Grid Parameters:**
```typescript
const GRID_CELL_SIZE = 200;      // 2× proximity radius
const PROXIMITY_RADIUS = 100;    // Units for audio connection
const WORLD_SIZE = 5000;         // 5000×5000 virtual world
```

**Data Structure:**
```typescript
// Key: "cellX:cellY", Value: Set of userIds
const spatialGrid = new Map<string, Set<string>>();
```

**Complexity Analysis:**
- **Naive approach:** O(N²) = 200 users → 40,000 distance checks/sec
- **Grid approach:** O(N×k) where k = avg 20 users per 9-cell neighborhood → 4,000 checks/sec
- **Improvement:** 10× reduction in CPU usage

**Critical Implementation:**
`server/src/managers/SpatialGrid.ts`

### WebSocket Message Protocol

**Update Frequencies:**
- Position Updates: **30Hz** (every 33ms, batched broadcast)
- Proximity Events: **Event-driven** (immediate)
- Heartbeat: **25 seconds** (detect disconnects)

**Binary Encoding (Optimization):**
- JSON: ~40 bytes per position → 200 users = 8KB/update
- Binary (Float32Array): 12 bytes per position → 200 users = 2.4KB/update
- **Bandwidth savings:** 70% reduction

---

## 3. Development Phases

### Phase 1: Walking Skeleton (Week 1-2)

**Goal:** Basic movement and position synchronization

**Deliverables:**
- ✅ React app with PixiJS canvas rendering movable avatar
- ✅ Node.js server broadcasting positions at 30Hz
- ✅ Multiple clients seeing each other's positions in real-time
- ✅ WASD/Arrow key movement
- ✅ **Docker setup for server (REQUIRED for mediasoup in Phase 2)**

**Project Structure:**
```
proximity-social/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.tsx              # PixiJS wrapper
│   │   │   └── Avatar.ts               # Avatar sprite class
│   │   ├── services/
│   │   │   └── socket.ts               # Socket.io client
│   │   ├── store/
│   │   │   └── useGameStore.ts         # Zustand state
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile                      # Client build container
│
├── server/
│   ├── src/
│   │   ├── index.ts                    # Express + Socket.io
│   │   ├── managers/
│   │   │   └── UserManager.ts          # User state
│   │   └── types/
│   │       └── User.ts
│   ├── package.json
│   └── Dockerfile                      # ⚠️ REQUIRED for mediasoup
│
├── docker-compose.yml                  # Local development
└── shared/
    └── types/
        └── messages.ts                  # Shared interfaces
```

**Docker Setup (MANDATORY):**

```dockerfile
# server/Dockerfile
FROM node:20-bullseye

# Install build tools for mediasoup
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  server:
    build: ./server
    ports:
      - "3000:3000"
    volumes:
      - ./server:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

**Critical Files:**
1. `client/src/components/Canvas.tsx` - PixiJS initialization, game loop
2. `client/src/services/socket.ts` - WebSocket connection, position sending
3. `server/src/index.ts` - Socket.io server, 30Hz position broadcast
4. `server/src/managers/UserManager.ts` - In-memory user state

**Testing Criteria:**
- [ ] Open 3 browser windows → see 3 avatars
- [ ] Move in window 1 → see movement in windows 2 & 3 within 100ms
- [ ] Disconnect window 1 → avatar disappears in windows 2 & 3
- [ ] Monitor latency: Position update <50ms (server timestamp → client receipt)
- [ ] Maintain 60 FPS with 10+ users

**Metrics:**
- Position update rate: 30Hz
- Latency: <50ms
- Frame rate: 60 FPS

---

### Phase 2: The Signal (Week 3-4)

**Goal:** Proximity detection and WebRTC audio connections

**⚠️ DEPLOYMENT CHECKPOINT:**
Before starting Phase 2, ensure Docker setup is complete. mediasoup **will not work** without proper build environment.

**Deliverables:**
- ✅ Server-side grid-based proximity detection
- ✅ `proximityEnter`/`proximityExit` events firing correctly
- ✅ mediasoup SFU deployed (requires Docker with build tools)
- ✅ Basic WebRTC audio connections via SFU
- ✅ Visual proximity indicator (green circle around avatar)
- ✅ TURN server configured (Twilio or self-hosted Coturn)

**New Components:**
1. `server/src/managers/SpatialGrid.ts` - Grid partitioning, proximity detection
2. `server/src/services/mediasoup.ts` - **mediasoup SFU setup (requires Docker)**
3. `client/src/services/webrtc.ts` - mediasoup-client integration
4. `client/src/components/ProximityIndicator.tsx` - Visual UI indicator
5. Update `server/src/index.ts` - Add WebRTC signaling handlers
6. `server/config/ice-servers.ts` - STUN/TURN configuration

**mediasoup Setup Example:**
```typescript
// server/src/services/mediasoup.ts
import * as mediasoup from 'mediasoup';

export async function createWorker() {
  const worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
  });

  return worker;
}
```

**TURN Server Configuration:**
```typescript
// server/config/ice-servers.ts
export const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:YOUR_TURN_SERVER:3478',
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_PASSWORD,
  },
];
```

**Key Implementation: Proximity Detection Algorithm**

```typescript
// server/src/managers/SpatialGrid.ts
export class SpatialGrid {
  private grid = new Map<string, Set<string>>();
  private userProximity = new Map<string, Set<string>>();

  updateUserPosition(userId: string, x: number, y: number): ProximityEvent[] {
    // 1. Update grid cell membership
    const newCell = this.getCellKey(x, y);
    // ... update logic

    // 2. Check proximity in 9 adjacent cells
    const nearbyUsers = this.getNearbyUsers(x, y);
    const events: ProximityEvent[] = [];

    nearbyUsers.forEach(otherUser => {
      const distance = calculateDistance(user, otherUser);
      const wasInProximity = this.userProximity.get(userId)?.has(otherUser.id);
      const isInProximity = distance <= PROXIMITY_RADIUS;

      if (!wasInProximity && isInProximity) {
        events.push({ type: 'enter', userId: otherUser.id });
      } else if (wasInProximity && !isInProximity) {
        events.push({ type: 'exit', userId: otherUser.id });
      }
    });

    return events;
  }
}
```

**WebRTC Signaling Flow:**
```
User A enters User B's radius (100 units)
  ↓
Server detects proximity
  ↓
Server → A: { type: 'proximityEnter', userId: 'B' }
Server → B: { type: 'proximityEnter', userId: 'A' }
  ↓
Client A creates PeerConnection (initiator based on userId < otherUserId)
  ↓
A → Server → B: SDP Offer
B → Server → A: SDP Answer
A ↔ Server ↔ B: ICE Candidates (trickle ICE)
  ↓
Connection established, audio streams
```

**Testing Criteria:**
- [ ] User A moves within 100 units of User B → both receive `proximityEnter` event
- [ ] Green proximity indicator appears around avatars
- [ ] WebRTC `pc.connectionState === 'connected'` within 3 seconds
- [ ] Audio flows bidirectionally (speak into mic, hear on other end)
- [ ] User A moves >100 units away → `proximityExit` fires, audio disconnects
- [ ] Test with 5 users: A enters proximity of B, C, D, E → 4 simultaneous connections
- [ ] Verify grid assignment: Log cell keys, confirm correct cell membership

**Metrics:**
- Proximity detection latency: <100ms
- WebRTC connection time: <3 seconds
- Audio latency: <200ms (loopback test)
- Connection success rate: >95%

**Known Issue:**
- **Boundary toggling**: Users exactly at 100 units cause rapid enter/exit spam
- **Solution**: Add 5-unit hysteresis (exit at 105 units, not 100)

---

### Phase 3: Spatial Audio & Polish (Week 5-6)

**Goal:** Realistic distance-based audio attenuation

**Deliverables:**
- ✅ Web Audio API integration with PannerNode
- ✅ Volume adjusts based on distance (loud at 0 units, silent at 500 units)
- ✅ Stereo panning (left/right positioning)
- ✅ Sound notification on proximity enter (gentle "ding")
- ✅ Smooth avatar interpolation (no jitter)

**New Components:**
1. `client/src/services/spatialAudio.ts` - Web Audio API integration
2. `client/src/utils/interpolation.ts` - Linear interpolation for smooth movement
3. `client/public/sounds/proximity-enter.mp3` - Notification sound

**Key Implementation: Spatial Audio**

```typescript
// client/src/services/spatialAudio.ts
class SpatialAudioService {
  private audioContext: AudioContext;
  private audioNodes = new Map<string, {
    source: MediaStreamAudioSourceNode;
    panner: PannerNode;
    gain: GainNode;
  }>();

  addAudioStream(userId: string, stream: MediaStream, position: { x, y }) {
    const source = this.audioContext.createMediaStreamSource(stream);

    // Create PannerNode for 3D spatial audio
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 100;        // Proximity radius
    panner.maxDistance = 500;        // Complete silence
    panner.rolloffFactor = 1.0;      // Natural decay

    // Position audio in 3D space
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = 0;

    // Connect audio graph
    source.connect(panner).connect(this.audioContext.destination);

    this.audioNodes.set(userId, { source, panner, gain });
  }

  updatePosition(userId: string, x: number, y: number) {
    const node = this.audioNodes.get(userId);
    if (node) {
      node.panner.positionX.value = x;
      node.panner.positionY.value = y;
    }
  }

  updateListenerPosition(x: number, y: number) {
    const listener = this.audioContext.listener;
    listener.positionX.value = x;
    listener.positionY.value = y;
    listener.positionZ.value = 300; // Camera height
  }
}
```

**Avatar Interpolation (Smooth Movement):**

```typescript
// client/src/utils/interpolation.ts
export function interpolatePosition(
  current: { x: number; y: number },
  target: { x: number; y: number },
  alpha: number // 0-1, higher = faster interpolation
): { x: number; y: number } {
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
  };
}

// In game loop (60 FPS):
// Server sends positions at 30Hz
// Client interpolates between updates for smooth 60 FPS rendering
const alpha = 0.2; // Adjust for responsiveness vs smoothness
avatar.x = interpolate(avatar.x, serverPosition.x, alpha);
avatar.y = interpolate(avatar.y, serverPosition.y, alpha);
```

**Testing Criteria:**
- [ ] User B at 0 units → loud, 100 units → medium, 500 units → silent
- [ ] User B on left side → audio pans left in headphones
- [ ] "Ding" sound plays when entering proximity
- [ ] Avatar movement is smooth (no jitter) even with 30Hz server updates
- [ ] No audio echo (test echoCancellation works)
- [ ] Background noise suppressed (test noiseSuppression)

**Metrics:**
- Audio distance attenuation: 0dB at 0 units → -40dB at 500 units
- Interpolation smoothness: 60 FPS maintained
- Audio processing latency: <50ms additional

---

### Phase 4: Social Layer (Week 7-8)

**Goal:** Authentication, friends list, persistent user data

**Deliverables:**
- ✅ User registration/login (email + password)
- ✅ JWT authentication for WebSocket connections
- ✅ Friends list (add, remove, accept requests)
- ✅ User profiles (username, avatar upload to S3)
- ✅ Persistent user positions (Redis + PostgreSQL)

**Database Schema (Prisma):**

```prisma
// server/prisma/schema.prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  username    String   @unique
  passwordHash String
  avatarUrl   String?
  createdAt   DateTime @default(now())

  friends     Friend[] @relation("UserFriends")
  friendOf    Friend[] @relation("FriendUser")
  sessions    Session[]
}

model Friend {
  id        String   @id @default(uuid())
  userId    String
  friendId  String
  status    FriendStatus @default(PENDING) // PENDING, ACCEPTED
  createdAt DateTime @default(now())

  user      User @relation("UserFriends", fields: [userId], references: [id])
  friend    User @relation("FriendUser", fields: [friendId], references: [id])

  @@unique([userId, friendId])
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id])
}

enum FriendStatus {
  PENDING
  ACCEPTED
}
```

**New API Routes:**

```typescript
// server/src/routes/auth.ts
POST   /api/auth/register      { email, username, password }
POST   /api/auth/login         { email, password } → { accessToken, refreshToken }
POST   /api/auth/refresh       { refreshToken } → { accessToken }
POST   /api/auth/logout

// server/src/routes/users.ts
GET    /api/users/me           → User profile
PUT    /api/users/me           { username, avatarUrl }
POST   /api/users/avatar       (multipart/form-data) → S3 upload

// server/src/routes/friends.ts
GET    /api/friends            → List of friends (accepted)
POST   /api/friends/request    { friendId }
POST   /api/friends/accept     { friendId }
DELETE /api/friends/:friendId
```

**WebSocket Authentication:**

```typescript
// server/src/index.ts
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const decoded = verifyJWT(token);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});
```

**Testing Criteria:**
- [ ] Register new user → JWT token returned
- [ ] Login with wrong password → 401 error
- [ ] Connect WebSocket without token → connection rejected
- [ ] Send friend request → appears in other user's pending list
- [ ] Accept friend request → both users see each other in friends list
- [ ] Upload avatar image → S3 URL returned, visible on canvas
- [ ] Disconnect and reconnect → user spawns at last known position

**Metrics:**
- JWT verification latency: <10ms
- Database query latency: <50ms (friends list)
- S3 upload time: <2 seconds (1MB image)

---

### Phase 5: Enhanced Features & Beta Launch (Week 9-10)

**Goal:** Screen sharing, reactions, text chat, performance optimization

**Deliverables:**
- ✅ Screen sharing (WebRTC `getDisplayMedia`)
- ✅ Emoji reactions (floating animations)
- ✅ Direct text chat (proximity-based)
- ✅ UI polish (lobby, settings, mute controls)
- ✅ Performance optimization (viewport culling, connection limits)
- ✅ Beta deployment to AWS

**New Features:**

**1. Screen Sharing**
```typescript
// client/src/services/webrtc.ts
async startScreenShare() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio: false,
  });

  // Add screen track to existing PeerConnection
  const screenTrack = stream.getVideoTracks()[0];
  const sender = peerConnection.addTrack(screenTrack, stream);

  // Stop sharing when user ends
  screenTrack.onended = () => {
    peerConnection.removeTrack(sender);
  };
}
```

**2. Emoji Reactions**
```typescript
// client/src/components/Reactions.tsx
function showReaction(userId: string, emoji: string) {
  // Create floating emoji sprite on canvas
  const emojiSprite = new PIXI.Text(emoji, { fontSize: 48 });
  emojiSprite.x = user.x;
  emojiSprite.y = user.y - 50;

  // Animate upward and fade out
  const animation = { y: user.y - 150, alpha: 0, duration: 2000 };
  // ... GSAP or custom animation
}
```

**3. Direct Text Chat**
```typescript
// server/src/index.ts
socket.on('chat:message', (data) => {
  // Only deliver if users in proximity
  const inProximity = spatialGrid.areUsersInProximity(socket.userId, data.to);

  if (inProximity) {
    io.to(data.to).emit('chat:message', {
      from: socket.userId,
      text: sanitizeHtml(data.text),
      timestamp: Date.now(),
    });
  }
});
```

**4. Performance Optimizations**

**Viewport Culling:**
```typescript
// Only render avatars within viewport + 200px buffer
const visibleUsers = users.filter(u => {
  const dx = Math.abs(u.x - localUser.x);
  const dy = Math.abs(u.y - localUser.y);
  return dx < viewportWidth / 2 + 200 && dy < viewportHeight / 2 + 200;
});
```

**Connection Limits:**
```typescript
const MAX_AUDIO_CONNECTIONS = 10;

function onProximityEnter(userId: string) {
  if (activeConnections.size >= MAX_AUDIO_CONNECTIONS) {
    // Disconnect farthest user
    const farthest = findFarthestUser();
    disconnectUser(farthest);
  }
  connectToUser(userId);
}
```

**Binary Position Encoding:**
```typescript
// Replace JSON with binary ArrayBuffer
const buffer = new ArrayBuffer(2 + users.length * 12);
const view = new DataView(buffer);
view.setUint16(0, users.length); // User count

users.forEach((user, i) => {
  const offset = 2 + i * 12;
  view.setUint32(offset, hashUserId(user.id));
  view.setFloat32(offset + 4, user.x);
  view.setFloat32(offset + 8, user.y);
});

socket.emit('positions', buffer);
```

**Testing Criteria:**
- [ ] Start screen share → other users see screen in modal
- [ ] Send 👋 reaction → emoji floats upward and fades on all clients
- [ ] Send text chat in proximity → message appears, disappears when out of range
- [ ] 50 users on canvas → maintain 60 FPS (viewport culling working)
- [ ] 15 users in proximity → only 10 audio connections (limit enforced)
- [ ] Load test: 200 concurrent users → server CPU <80%, latency <100ms

**Beta Deployment Checklist:**
- [ ] Docker multi-stage build (client + server)
- [ ] GitHub Actions CI/CD pipeline
- [ ] AWS EC2 Auto Scaling Group configured
- [ ] CloudWatch alarms (CPU >80%, latency >200ms)
- [ ] HTTPS with Let's Encrypt SSL certificate
- [ ] Environment variables in AWS Parameter Store
- [ ] Database backups (RDS automated snapshots)
- [ ] CloudFront CDN for static assets
- [ ] Error tracking (Sentry integration)

---

## 4. Potential Pitfalls & Solutions

### 1. Scaling WebRTC Connections (Connection Mesh Explosion)

**Problem:**
In P2P mesh topology, N users = N×(N-1)/2 total connections. 50 users = 1,225 connections, each user handles ~49 connections. Browser limits ~50-100 PeerConnections. Each connection uses 64kbps audio = 3.2Mbps for 50 users.

**Detection:**
- Monitor `RTCPeerConnection` count per client
- CPU usage >80% in browser DevTools
- Audio becomes choppy/robotic
- `pc.iceConnectionState === 'failed'`

**Solutions:**
1. **Use mediasoup SFU (RECOMMENDED)** - Each client sends 1 stream to server, server forwards to N listeners
2. **Limit simultaneous connections to 10** - Disconnect farthest users when limit exceeded
3. **Spatial audio zones** - Only connect to users in same 500×500 region

**Mitigation:**
- Emergency fallback: Disable audio for users >100 units away
- Show warning: "Too many nearby users, audio limited to 10 closest"

---

### 2. TCP Head-of-Line Blocking (Movement Lag)

**Problem:**
Socket.io uses TCP which guarantees packet delivery. When one packet is lost, ALL subsequent packets wait for retransmission. This causes "rubber-banding" where avatars teleport to catch up with missed updates.

**Detection:**
- Avatars "rubber-band" (jump forward suddenly)
- Movement feels laggy despite low ping
- Smooth movement on localhost but choppy on internet
- Network inspector shows packet retransmissions

**Solutions:**
1. **Accept TCP lag for MVP** - Socket.io is simpler, good enough for 80% of users
2. **Upgrade to Geckos.io** (UDP via WebRTC DataChannels) if users complain
   ```typescript
   // Geckos.io for movement (unreliable, unordered)
   geckos.on('position', (data) => {
     updateAvatar(data.userId, data.x, data.y);
   });

   // Socket.io for chat/state (reliable, ordered)
   socket.on('chat:message', (data) => {
     displayMessage(data);
   });
   ```
3. **Client-side interpolation** - Smooth out dropped packets locally
4. **Increase update rate** - 30Hz → 60Hz helps mask packet loss

**When to Upgrade:**
- If >20% of users report laggy movement
- If server load allows higher update rates
- If you have time to learn Geckos.io (adds complexity)

---

### 3. Server CPU Load with Position Updates

**Problem:**
200 users × 30 updates/sec = 6,000 updates/sec. Naive O(N²) proximity checks = 40,000 distance calculations/sec. Single-threaded Node.js event loop blocks.

**Detection:**
- Server CPU >80% (CloudWatch)
- Position update latency >100ms
- Jittery avatar movement

**Solutions:**
1. **Grid-based partitioning (IMPLEMENTED)** - O(N²) → O(N×k), 10× reduction
2. **Throttle client updates** - Drop updates sent faster than 30Hz
3. **Delta compression** - Only broadcast positions that changed >5 units
4. **Binary encoding** - 12 bytes vs 40 bytes per update (70% smaller)

**Mitigation:**
- Reduce update rate: 30Hz → 20Hz
- Increase grid cell size: 200×200 → 300×300
- Scale horizontally: Add second server, split by region

---

### 4. Network Bandwidth Optimization

**Problem:**
200 users × 10 connections × 64kbps = 128Mbps outbound. Position updates: 6,000 msgs/sec × 50 bytes = 2.4Mbps. Total: ~130Mbps.

**Detection:**
- CloudWatch NetworkOut metric spikes
- Audio packet loss >5%
- `pc.getStats()` shows high `packetsLost`

**Solutions:**
1. **Adaptive bitrate** - Reduce from 64kbps → 32kbps if packet loss >5%
2. **Opus DTX (Discontinuous Transmission)** - Silence = no data sent
3. **Viewport culling** - Don't send positions for off-screen users
4. **Binary position encoding** - 70% bandwidth reduction

**Mitigation:**
- Enable Opus DTX and FEC (forward error correction)
- Reduce update rate to 20Hz
- Use WebRTC Insertable Streams for custom packet filtering

---

### 5. WebRTC Signaling Failures and Reconnection

**Problem:**
ICE negotiation fails ~5-10% of time (symmetric NAT, firewalls). Network switches (WiFi → cellular) break connections. No automatic reconnection.

**Detection:**
- `pc.iceConnectionState === 'failed'`
- ICE gathering stuck at `'gathering'` >10 seconds
- No audio despite `connectionState === 'connected'`

**Solutions:**
1. **Comprehensive ICE servers** - Multiple STUN servers + TURN relay
2. **Connection state monitoring** - Restart ICE on `'failed'` state
3. **Timeout detection** - 10-second timeout, fallback to TURN
4. **Network change handling** - Reconnect on `window.addEventListener('online')`

**Mitigation:**
- Display connection status: "Connecting...", "Reconnecting...", "Failed"
- Automatic retry with exponential backoff: 1s, 2s, 4s, 8s
- Manual "Reconnect Audio" button

---

### 6. Audio Quality and Latency Issues

**Problem:**
Target latency <200ms, achievable 50-150ms (P2P) or 100-300ms (SFU). Factors: network jitter, packet loss, audio processing delays. Poor quality: echo, noise, robotic voices.

**Detection:**
- `pc.getStats()` → `jitter`, `packetsLost`, `roundTripTime`
- User reports: "Can't hear you", "You're cutting out"
- Loopback latency test

**Solutions:**
1. **Proper audio constraints** - echoCancellation, noiseSuppression, autoGainControl
2. **Jitter buffer tuning** - 50ms target, 200ms max
3. **Opus FEC (Forward Error Correction)** - Recover from packet loss
4. **Monitor and adapt** - Check packet loss every 5s, reduce bitrate if >5%

**Mitigation:**
- Show audio quality indicator: Green/Yellow/Red
- Allow manual mute controls
- Dynamic bitrate reduction based on packet loss

---

### 7. Security Concerns

**Problem:**
Position spoofing (teleportation), unauthorized access, proximity abuse (DDoS), WebRTC IP leaks, XSS/CSRF vulnerabilities.

**Detection:**
- Server logs: "Invalid movement detected"
- Sudden position jumps: (100, 100) → (5000, 5000) in 1 frame
- Rate limit triggers: >100 updates/sec from single user

**Solutions:**
1. **Server-authoritative validation** - Max speed check (5 units/tick)
2. **WebSocket authentication** - Verify JWT on connection
3. **Rate limiting** - 35 requests/sec max per user (30Hz + buffer)
4. **Input sanitization** - DOMPurify for chat messages
5. **SFU hides peer IPs** - Users only connect to server, not each other

**Mitigation:**
- Log suspicious activity for review
- Auto-ban users with repeated violations
- Emergency kill switch to disconnect abusive users

---

### 8. Browser Compatibility

**Problem:**
Web Audio API PannerNode behaves differently across browsers. Safari WebRTC quirks. Firefox autoplay policies.

**Detection:**
- User reports: "Audio doesn't work on Safari"
- Console errors: "getUserMedia is not defined"
- Silent audio (autoplay blocked)

**Solutions:**
1. **Feature detection** - Check `navigator.mediaDevices` exists
2. **Polyfills** - adapter.js for WebRTC cross-browser compatibility
3. **User gesture requirement** - Only start audio after button click (autoplay policy)
4. **Fallback UI** - Show "Enable microphone" prompt if permission denied

**Browsers to Test:**
- Chrome/Edge (Chromium) - Best support
- Firefox - Good, some PannerNode differences
- Safari - Limited support, test on iOS
- Mobile browsers - Touch input, performance constraints

---

### 9. Performance on Mobile Devices

**Problem:**
Mobile CPUs weaker than desktop. Limited battery. Smaller screens. Touch controls.

**Detection:**
- Frame rate drops to 30 FPS on mobile
- Battery drains in <1 hour
- Overheating

**Solutions:**
1. **Adaptive quality** - Reduce avatar count on mobile (show 50 nearest users)
2. **Lower update rates** - 30Hz → 20Hz on mobile
3. **Reduce audio quality** - 64kbps → 48kbps
4. **Disable visual effects** - Reactions, shadows, particles
5. **Touch controls** - Virtual joystick for movement

**Mitigation:**
- Show "Low Power Mode" setting
- Warn users on mobile: "Best experienced on desktop"
- Progressive enhancement: Desktop gets full features, mobile gets core features

---

## 5. Verification & Testing Strategy

### Unit Testing

**Backend:**
```bash
# Test spatial grid proximity detection
npm test -- SpatialGrid.test.ts

# Test movement validation (anti-cheat)
npm test -- UserManager.test.ts

# Test JWT authentication
npm test -- auth.test.ts
```

**Frontend:**
```bash
# Test WebRTC connection logic
npm test -- webrtc.test.ts

# Test position interpolation
npm test -- interpolation.test.ts
```

### Integration Testing

**WebRTC Audio Flow:**
```typescript
// E2E test with Playwright
test('audio connection between users', async ({ page }) => {
  // User 1 joins
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="join"]');

  // User 2 joins in second browser context
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto('http://localhost:5173');

  // Move User 1 into proximity of User 2
  await page.keyboard.press('ArrowRight', { delay: 100 });

  // Assert proximity indicator appears
  await expect(page.locator('.proximity-indicator')).toBeVisible();

  // Assert audio connection established
  const connState = await page.evaluate(() =>
    window.peerConnections.get('user2').connectionState
  );
  expect(connState).toBe('connected');
});
```

### Load Testing

**Simulate 200 Concurrent Users:**
```bash
# Use artillery.io for WebSocket load testing
npm install -g artillery

# artillery.yml
config:
  target: 'ws://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/sec for 60s = 600 users
  socketio:
    transports: ['websocket']

scenarios:
  - name: "Position updates"
    engine: socketio
    flow:
      - emit:
          channel: "position"
          data:
            x: "{{ $randomNumber(0, 5000) }}"
            y: "{{ $randomNumber(0, 5000) }}"
      - think: 0.033  # 30Hz

# Run test
artillery run artillery.yml
```

**Performance Benchmarks:**
- Position update latency: <50ms (p95)
- WebRTC connection time: <3 seconds
- Audio latency: <200ms
- Server CPU: <80% at 200 users
- Server memory: <4GB at 200 users
- Frame rate: 60 FPS with 50 visible users

### Beta Testing

**Phased Rollout:**
1. **Alpha (Week 9):** Internal team testing (5-10 users)
2. **Closed Beta (Week 10):** Invite 50 users, gather feedback
3. **Public Beta (Week 11+):** Open to 200 users, monitor stability

**Feedback Collection:**
- In-app feedback form (Typeform integration)
- Bug reporting (Sentry error tracking)
- Analytics (PostHog for user behavior)
- User interviews (Discord community)

**Success Metrics:**
- Daily Active Users (DAU): >100
- Avg session duration: >15 minutes
- Audio connection success rate: >95%
- User retention (7-day): >40%
- Net Promoter Score (NPS): >50

---

## 6. Next Steps After Beta

### Scalability Improvements
- Horizontal scaling with Redis Pub/Sub adapter
- Region-based sharding (split world into quadrants)
- CDN for static assets (CloudFront)
- Database read replicas

### Feature Enhancements
- Private rooms (invite-only spaces)
- Customizable avatars (upload images, choose colors)
- Mini-games (tic-tac-toe, trivia in proximity)
- Voice effects (pitch shift, robot voice)
- Recording/replay system

### Monetization
- Premium avatars/skins ($2.99)
- Private servers ($9.99/month)
- Custom domains (enterprise: $99/month)
- API access for developers

### Infrastructure
- Kubernetes for container orchestration
- Monitoring: Prometheus + Grafana
- Logging: ELK stack (Elasticsearch, Logstash, Kibana)
- CI/CD: GitHub Actions → AWS ECS

---

## Summary

**10-Week Roadmap:**
- **Weeks 1-2:** Walking Skeleton (movement + sync)
- **Weeks 3-4:** Proximity detection + WebRTC audio
- **Weeks 5-6:** Spatial audio + polish
- **Weeks 7-8:** Auth + friends + persistence
- **Weeks 9-10:** Enhanced features + beta launch

**Critical Success Factors:**
1. Grid-based spatial partitioning (10× CPU improvement)
2. mediasoup SFU for audio (prevents connection explosion)
3. Server-authoritative movement (anti-cheat)
4. Adaptive bitrate audio (handle poor networks)
5. Comprehensive testing (unit, integration, load)

**Tech Stack (Final):**
- **Frontend:** React 18 + TypeScript + PixiJS 7 + Socket.io-client + mediasoup-client
- **Backend:** Node.js 20 + Express + Socket.io + mediasoup
- **Database:** PostgreSQL 15 + Redis 7
- **Deployment:** AWS (EC2 + RDS + ElastiCache + S3 + CloudFront)

**Estimated Costs:**
- Development: 10 weeks × $5k/week = $50k (1 full-stack engineer)
- Infrastructure: ~$580-680/month for 200 users (includes TURN relay)
- Total MVP cost: ~$50k + $1.9k (3 months hosting)

**Risk Level:** Medium-High (Updated)
- **High confidence:** Movement sync, proximity detection, basic WebRTC
- **Medium confidence:** Spatial audio quality, scale to 200 users
- **Low confidence:** Mobile performance, cross-browser compatibility
- **NEW CRITICAL RISKS:**
  1. **mediasoup deployment complexity** (C++ compilation, Docker required)
  2. **TCP lag with Socket.io** (may need to upgrade to UDP/Geckos.io)
  3. **TURN server costs** (10-20% users need relay, adds $50-150/month)

**Recommended Next Action:**
Begin Phase 1 implementation:
1. **FIRST:** Set up Docker environment (mandatory for mediasoup)
2. Create project structure with client/server/shared
3. Implement basic Canvas + WebSocket position synchronization
4. Test Docker build process before proceeding to Phase 2

**Pre-Implementation Checklist:**
- [ ] Docker Desktop installed and running
- [ ] Understand mediasoup requires C++ compilation (not standard npm)
- [ ] Budget for TURN relay costs ($50-150/month additional)
- [ ] Plan to test with Geckos.io if Socket.io movement feels laggy
- [ ] AWS/DigitalOcean account with root access (not shared hosting)
