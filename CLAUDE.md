# Talk Space - Claude Code Context

## Project Overview
Proximity-based social platform (like Gather.town). Users move avatars in a 2D world, voice chat activates automatically when near each other with spatial audio.

## Tech Stack
- **Frontend:** React 18 + TypeScript + PixiJS 7 + Zustand + Socket.io-client + mediasoup-client
- **Backend:** Node.js 20 + Express + Socket.io + mediasoup (SFU)
- **Database:** PostgreSQL 15 + Redis 7
- **Infra:** Docker (required for mediasoup C++ compilation), AWS

## MCP Usage
Always use:
- **Context7** for up-to-date documentation on third-party libraries (PixiJS, mediasoup, Socket.io, etc.)
- **Serena** for semantic code retrieval and editing across the codebase
- **Sequential Thinking** for any architectural decisions or complex problem breakdowns

## Build & Run Commands
```bash
# Frontend
npm run dev          # Vite dev server
npm run build        # Production build
npm run typecheck    # TypeScript checks

# Backend
npm run dev          # nodemon + ts-node
npm run build        # tsc compilation
npm test             # Jest tests

# Docker
docker compose up    # Full stack locally
docker compose build # Rebuild containers

# Both
npm run typecheck && npm run build && npm test  # Pre-commit validation
```

## Project Structure (Target)
```
proximity-social/
├── client/           # React + PixiJS frontend (Vite)
│   ├── src/
│   │   ├── components/   # React components + PixiJS canvas
│   │   ├── services/     # socket.ts, webrtc.ts, spatialAudio.ts
│   │   ├── store/        # Zustand stores (useGameStore.ts)
│   │   └── utils/        # interpolation, helpers
│   └── Dockerfile
├── server/           # Node.js backend
│   ├── src/
│   │   ├── managers/     # UserManager, SpatialGrid
│   │   ├── services/     # mediasoup setup
│   │   ├── routes/       # auth, users, friends REST APIs
│   │   └── index.ts      # Express + Socket.io entry
│   └── Dockerfile        # REQUIRED for mediasoup C++ deps
├── shared/           # Shared TypeScript types
├── docker-compose.yml
└── plan.md           # Full roadmap (read this for context)
```

## Code Style & Conventions
- TypeScript strict mode everywhere
- ES modules (import/export, no require)
- Zustand for client state (lightweight, no boilerplate)
- Repository pattern for database access
- Socket.io events: camelCase (`positionUpdate`, `proximityEnter`)
- REST endpoints: kebab-case (`/api/auth/reset-password`)
- Error handling: try/catch with typed error responses

## Architecture Rules
- **Server-authoritative**: Server validates all movement (max 5 units/tick)
- **Grid-based spatial partitioning**: 200x200 cells for O(N*k) proximity detection
- **mediasoup SFU**: Never P2P mesh — use SFU for audio routing
- **Max 10 audio connections per user**: Disconnect farthest when limit hit
- **Binary position encoding**: Use Float32Array, not JSON, for position broadcasts
- **Client-side interpolation**: Smooth 60 FPS from 30Hz server updates

## Security Rules
- Never hardcode secrets — use environment variables only
- Sanitize all user input (DOMPurify for chat)
- JWT auth on all WebSocket connections
- Rate limit: 35 req/sec max per user
- Parameterized queries only (Prisma ORM)
- mediasoup SFU hides peer IPs (no direct peer connections)

## Known Gotchas
- mediasoup requires Docker with python3, make, g++ — NOT a standard npm package
- Socket.io uses TCP — may cause rubber-banding; upgrade to Geckos.io if needed
- Boundary toggling at exactly PROXIMITY_RADIUS: use 5-unit hysteresis
- Web Audio API needs user gesture before AudioContext starts
- Safari WebRTC quirks — use adapter.js polyfill
- TURN servers cost $50-150/month extra (10-20% users need relay)

## Current Phase
Phase 1: Walking Skeleton — basic movement and position synchronization

## Don'ts
- Don't use P2P mesh for audio (connection explosion)
- Don't use naive O(N^2) proximity checks
- Don't send position updates faster than 30Hz
- Don't skip Docker setup (mediasoup won't compile without it)
- Don't commit .env files or secrets
- Don't add features beyond current phase scope
