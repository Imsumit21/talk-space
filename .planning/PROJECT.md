# Talk Space

## What This Is

A proximity-based social platform where users move avatars in a 2D world and voice chat activates automatically when near each other with spatial audio. Built with React, TypeScript, PixiJS, mediasoup, and Socket.io. Currently a functional prototype (colored circles on a dark grid) with working multiplayer movement, proximity voice chat, and spatial audio — needs visual polish to compete with Gather.town.

## Core Value

Users can naturally meet and talk with people nearby in a virtual space — proximity creates organic social interactions that feel like being in the same room.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Multiplayer movement with server-authoritative validation — Phase 1
- ✓ Real-time position sync with client-side interpolation — Phase 1
- ✓ Proximity detection with spatial grid partitioning — Phase 2
- ✓ WebRTC audio via mediasoup SFU — Phase 2
- ✓ Spatial audio with Web Audio API panning — Phase 3
- ✓ Speaking indicators and volume controls — Phase 3
- ✓ Basic JWT authentication with login/register — Phase 4 (partial)
- ✓ PostgreSQL database with Prisma ORM — Phase 4 (partial)

### Active

<!-- Current scope — Frontend Overhaul v1.0 -->

- [ ] Design system with tokens, shared UI components, and Tailwind extension
- [ ] Cinematic auth page with glassmorphism and animated background
- [ ] Polished lobby with live online count and transition animations
- [ ] Immersive game world with parallax layers, star field, and decorated zones
- [ ] Expressive avatar system with faces, animations, and state indicators
- [ ] Complete HUD system (top bar, voice controls, chat, user list, settings)
- [ ] Performance optimization for 60 FPS with 30+ users
- [ ] Accessibility and responsive design

### Out of Scope

<!-- Explicit boundaries for this milestone -->

- Mobile native app — Web-first, desktop is primary platform
- Video chat — Audio-only for this milestone, video later
- Custom avatar uploads/sprites — Procedural avatars only for now
- Room/space creation UI — Single world for now
- Real-time text chat backend — Chat panel UI only, backend deferred
- OAuth/social login integration — UI placeholders only, implementation deferred
- Payment/monetization — Not relevant for this milestone

## Current Milestone: v1.0 Frontend Overhaul

**Goal:** Transform Talk Space from a functional prototype (colored circles on a dark grid) into a visually stunning, polished proximity-based social platform that surpasses Gather.town's UI/UX.

**Target features:**
- Comprehensive design system (tokens, Tailwind, shared components)
- Cinematic auth & lobby experience with glassmorphism aesthetic
- Immersive game world with parallax, environment objects, zones
- Expressive avatar system with faces, states, animations
- Complete HUD overlay system (top bar, voice, chat, settings)
- Performance polish, accessibility, and micro-interactions

**Design vision:** Modern glassmorphism aesthetic with depth, glow effects, and micro-interactions. Discord's polish + Figma's spatial feel + Gather.town's functionality. Color palette: deep space indigo/purple base, electric blue accents, warm amber for social, emerald for voice/proximity.

## Context

- **Existing codebase:** ~12 client files, clean separation (components, services, store)
- **Current visual state:** Dark blue canvas (0x0f0f23), faint grid lines, 20px colored circles as avatars, basic proximity rings, bottom voice control bar
- **Stack:** React 18, TypeScript, PixiJS 7, Zustand, Tailwind CSS, Vite, Socket.io, mediasoup
- **Phase 4 (Social Layer)** is partially implemented — auth endpoints exist but UI is basic
- **Docker required** for mediasoup C++ compilation
- **Server-authoritative** architecture — all movement validated server-side

## Constraints

- **Tech stack**: Must use existing React + PixiJS + Tailwind stack — no framework migration
- **Performance**: Must maintain 60 FPS with 30+ visible avatars on mid-range hardware
- **Accessibility**: Must support prefers-reduced-motion and keyboard navigation
- **Browser**: Chrome, Firefox, Safari (latest 2 versions) — WebRTC required
- **PixiJS rendering**: Canvas/WebGL elements can't use CSS — need PixiJS equivalents for in-world UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Glassmorphism design language | Modern, depth-rich aesthetic that differentiates from Gather.town's pixel art style | — Pending |
| PixiJS for world rendering | Already in stack, hardware-accelerated 2D, good for parallax/particles | ✓ Good |
| Zustand for state | Lightweight, no boilerplate, already in stack | ✓ Good |
| mediasoup SFU for audio | Scalable, hides peer IPs, server-controlled routing | ✓ Good |
| Inter + Space Grotesk fonts | Clean modern typography, free, good readability | — Pending |

---
*Last updated: 2026-02-17 after milestone v1.0 initialization*
