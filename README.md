# Talk Space

A web-based proximity social platform where users move avatars in a shared 2D world and automatically connect via spatial voice chat when near each other — similar to Gather.town.

## Concept

- Move your avatar with WASD/Arrow keys in a virtual space
- Walk near someone and voice chat starts automatically
- Audio gets louder as you get closer, with stereo panning
- Walk away and the connection fades out

## Tech Stack

**Frontend:** React + TypeScript, PixiJS (canvas rendering), Zustand, Socket.io-client, mediasoup-client

**Backend:** Node.js, Express, Socket.io, mediasoup (SFU), PostgreSQL, Redis

**Infrastructure:** Docker, AWS (EC2, RDS, ElastiCache, S3, CloudFront)

## Key Features (MVP)

- Real-time avatar movement with 60 FPS rendering
- Grid-based proximity detection (O(N*k) vs O(N^2))
- WebRTC voice chat via mediasoup SFU
- Spatial audio using Web Audio API
- User auth, friends list, profiles
- Screen sharing, emoji reactions, text chat

## Target Scale

50-200 concurrent users on a single server.

## Status

Under active development.
