---
phase: 02-authentication-lobby-redesign
plan: 03
subsystem: frontend-lobby-ui
tags: [framer-motion, lobby-ui, skeleton-loading, page-transitions, online-count, socket-io-events]
dependencies:
  requires: [02-02-auth-forms, phase-01-design-system]
  provides: [lobby-component, page-transitions, skeleton-loading]
  affects: [user-onboarding, app-shell]
tech-stack:
  added: []
  patterns: [framer-motion-AnimatePresence, skeleton-loading-pattern, 300ms-minimum-display, socket-io-online-count]
key-files:
  created:
    - client/src/animations/transitions.ts
    - client/src/components/Lobby.tsx
  modified:
    - client/src/App.tsx
    - shared/types/messages.ts
    - server/src/index.ts
decisions:
  - "framer-motion AnimatePresence with mode='wait' for clean transition lifecycle"
  - "300ms minimum skeleton display time prevents flash on fast connections"
  - "ToastProvider rendered outside AnimatePresence for persistent notifications across page transitions"
  - "Lobby component requests online count via Socket.io instead of REST for real-time accuracy"
  - "fadeScaleVariants for auth/lobby transitions, zoomInVariants for game entrance"
  - "PixiJS Canvas lazy-initialized on game page render for better lobby performance"
  - "Gradient avatar circle uses first letter of username as placeholder for future avatar system"
metrics:
  duration: 179s
  tasks: 2
  files_created: 2
  files_modified: 3
  commits: 2
  completed: 2026-02-17
---

# Phase 02 Plan 03: Polished Lobby & Page Transitions

**One-liner:** Built cinematic lobby component with gradient avatar circle, live online count badge via Socket.io, and glassmorphism design; implemented framer-motion AnimatePresence page transitions with fade/scale for auth/lobby and zoom-in for game entrance; added 300ms skeleton loading screen for session restore.

## Objective

Create the polished Lobby component, define framer-motion transition variants, and rewrite App.tsx with AnimatePresence page transitions and skeleton loading for session restore.

**Purpose:** Complete the cinematic user journey from auth to lobby to game space with smooth animated transitions at every step, and replace the plain loading text with proper skeleton UI.

## Tasks Completed

### Task 1: Create transition variants and polished Lobby component

**Status:** ✅ Complete
**Commit:** \`280958d\`
**Files:** \`client/src/animations/transitions.ts\`, \`client/src/components/Lobby.tsx\`, \`shared/types/messages.ts\`, \`server/src/index.ts\`

**What was done:**

1. **Created \`client/src/animations/transitions.ts\`:**
   - Exported \`fadeScaleVariants\`: Auth <-> lobby transition with subtle breathing effect
   - Exported \`zoomInVariants\`: Lobby -> game transition with dramatic entrance

2. **Created standalone \`client/src/components/Lobby.tsx\`:**
   - GradientBackground with animated mesh
   - Gradient Avatar Circle (80x80px, first letter of username)
   - Username Display with welcome message
   - Tagline: "Ready to explore?"
   - Live Online Count Badge via Socket.io
   - Enter Space Button with gradient styling
   - Logout Link

3. **Added Socket.io events (Auto-fix Rule 2):**
   - Added \`onlineCount\` and \`getOnlineCount\` to type definitions
   - Built shared package to compile updated types

4. **Implemented server handler (Auto-fix Rule 3):**
   - Added \`getOnlineCount\` handler in server/src/index.ts
   - Returns UserManager count via \`onlineCount\` event

**Verification:**
- ✅ TypeScript compiles for client and server
- ✅ Lobby component fully functional with all imports
- ✅ Socket.io online count working

### Task 2: Rewrite App.tsx with AnimatePresence transitions and skeleton loading

**Status:** ✅ Complete
**Commit:** \`aa0859a\`
**Files:** \`client/src/App.tsx\`

**What was done:**

1. **Added imports:** motion, AnimatePresence, transition variants, Lobby, ToastProvider
2. **Removed inline Lobby:** Now imports from separate file
3. **Created SessionSkeleton:** Glassmorphism card with shimmer placeholders
4. **300ms minimum display:** Prevents flash-of-skeleton on fast connections
5. **AnimatePresence setup:** mode="wait" with unique page keys
6. **Transitions applied:** fadeScaleVariants for skeleton/auth/lobby, zoomInVariants for game
7. **ToastProvider:** Rendered outside AnimatePresence for persistence
8. **PixiJS lazy init:** Canvas only renders on game page

**Verification:**
- ✅ TypeScript compiles
- ✅ All page transitions working with correct variants
- ✅ Skeleton loading with minimum display time
- ✅ ToastProvider persists across pages

## Success Criteria

- ✅ AUTH-07: Polished lobby with gradient avatar, online count, enter button
- ✅ AUTH-08: Smooth transitions with skeleton loading
- ✅ All tasks completed successfully
- ✅ TypeScript compiles without errors
- ✅ No regressions to existing functionality

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Socket.io online count events**
- **Found during:** Task 1
- **Issue:** Type definitions missing for getOnlineCount/onlineCount events
- **Fix:** Added events to shared/types/messages.ts and rebuilt package
- **Files:** shared/types/messages.ts
- **Commit:** 280958d

**2. [Rule 3 - Blocking issue] Server handler for getOnlineCount**
- **Found during:** Task 1
- **Issue:** Server had no handler to respond to online count requests
- **Fix:** Added Socket.io handler in server/src/index.ts
- **Files:** server/src/index.ts
- **Commit:** 280958d

## Next Steps

Phase 2 complete. Ready for Phase 3: PixiJS integration.

## Self-Check: PASSED

**Files created:**
- ✅ FOUND: client/src/animations/transitions.ts
- ✅ FOUND: client/src/components/Lobby.tsx

**Files modified:**
- ✅ FOUND: client/src/App.tsx
- ✅ FOUND: shared/types/messages.ts
- ✅ FOUND: server/src/index.ts

**Commits:**
- ✅ FOUND: 280958d
- ✅ FOUND: aa0859a
