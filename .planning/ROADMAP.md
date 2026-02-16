# Roadmap: Talk Space - Frontend Overhaul v1.0

## Overview

This roadmap transforms Talk Space from a functional prototype (colored circles on a dark grid) into a visually stunning, polished proximity-based social platform. The journey progresses through six phases: establishing the design system foundation, building and polishing the authentication and lobby experience, upgrading the game world with parallax effects and decorations, overhauling the avatar system with expressive faces and animations, implementing a complete HUD overlay system with voice controls and panels, and finally adding polish with performance optimization, accessibility, and micro-interactions. Each phase delivers a complete, verifiable capability while maintaining the non-negotiable 60fps performance target with 30+ avatars.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Design System Foundation** - Establish design tokens, typography, and glassmorphism utilities before building components
- [ ] **Phase 2: Authentication & Lobby Redesign** - Create cinematic auth experience and polished lobby with smooth transitions
- [ ] **Phase 3: Game World Visual Upgrade** - Add parallax starfield, decorated zones, and immersive world environment
- [ ] **Phase 4: Avatar System Overhaul** - Transform circles into expressive avatars with faces, animations, and state indicators
- [ ] **Phase 5: HUD & Overlay System** - Build complete HUD with top bar, voice controls, chat panel, user list, and settings
- [ ] **Phase 6: Polish & Micro-interactions** - Performance optimization, accessibility, keyboard shortcuts, and UI sound effects

## Phase Details

### Phase 1: Design System Foundation
**Goal**: Establish the visual language and design system that all UI components will use
**Depends on**: Nothing (first phase)
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-06, DSGN-07, DSGN-08
**Success Criteria** (what must be TRUE):
  1. User sees consistent color palette across all UI (indigo primary, electric blue accent, emerald voice, amber social)
  2. User sees Inter font for body text and Space Grotesk for headings with no font loading flash
  3. User can interact with Button component showing all variants (primary, secondary, ghost, danger) with loading states and ripple effects
  4. User can type in Input component with floating label animation, focus glow ring, and validation state feedback
  5. User sees Card component with glassmorphism styling (backdrop-blur, white border, hover lift effect)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Authentication & Lobby Redesign
**Goal**: Create a cinematic, polished first impression from landing page through lobby entry
**Depends on**: Phase 1 (requires design system components)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08
**Success Criteria** (what must be TRUE):
  1. User sees animated gradient mesh background with shifting indigo/purple/blue colors on auth page
  2. User sees glassmorphism card with Talk Space branding (SVG icon with glow) and smooth sliding tab switcher between login/register
  3. User sees floating label inputs that validate on blur with icons, password strength meter on register, and gradient submit button with hover glow
  4. User experiences error feedback via form shake animation, red glow on invalid fields, and descriptive toast notifications
  5. User sees polished lobby with gradient avatar, username, live online count badge, and prominent "Enter Space" button
  6. User experiences smooth transitions: fade/scale from auth to lobby, zoom-in from lobby to game space, skeleton loading on session restore
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Game World Visual Upgrade
**Goal**: Transform the dark grid canvas into an immersive space environment with depth and decorations
**Depends on**: Phase 2 (lobby must transition into upgraded world)
**Requirements**: WRLD-01, WRLD-02, WRLD-03, WRLD-04, WRLD-05, WRLD-06, WRLD-07, WRLD-08
**Success Criteria** (what must be TRUE):
  1. User sees layered parallax background with deep space gradient, twinkling star field (500-1000 particles), and drifting nebula blobs
  2. User sees soft dotted grid (small circles at intersections) with low opacity replacing the hard grid lines
  3. User sees at least one decorated zone with colored floor area, floating glass label, and decorative objects
  4. User sees soft radial gradient aura around avatars in voice range (replacing hard green proximity ring)
  5. User sees faint curved bezier connection lines between connected users with gradient opacity
  6. User experiences smooth camera follow with slight lag/easing (not locked 1:1 to avatar)
  7. User sees glowing edge with gradient fade at world boundaries (not hard 2px border line)
  8. User sees mini-map in corner showing full world with dot positions for all users
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Avatar System Overhaul
**Goal**: Replace colored circles with expressive avatars that communicate state through faces and animations
**Depends on**: Phase 3 (avatars render in upgraded world environment)
**Requirements**: AVTR-01, AVTR-02, AVTR-03, AVTR-04, AVTR-05, AVTR-06, AVTR-07, AVTR-08
**Success Criteria** (what must be TRUE):
  1. User sees gradient circle avatar with simple expressive face (two dot eyes, slight curve mouth)
  2. User sees gentle idle bob animation (1-2px sine wave float) and occasional blink when avatar is stationary
  3. User sees squash/stretch effect in movement direction with 3-4 fading afterimage trail particles
  4. User sees speaking ring that pulsates mapped to actual voice amplitude (not fixed sine wave)
  5. User sees pop-in scale animation (0→1.1→1.0) with sparkle particle burst when someone enters proximity
  6. User sees AFK state (dimmed avatar, floating "zzz" text) after 2 minutes of no input
  7. User can trigger emote reactions (wave, thumbs up, laugh) via keyboard shortcuts (1-5 keys) that float up and fade
  8. User sees glassmorphism nameplate pill below avatar with truncated name, status dot, and typing indicator
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: HUD & Overlay System
**Goal**: Build complete React-based HUD overlay system with voice controls, chat, user list, and settings
**Depends on**: Phase 4 (HUD displays avatar states and interacts with game world)
**Requirements**: HUD-01, HUD-02, HUD-03, HUD-04, HUD-05, HUD-06, HUD-07, HUD-08
**Success Criteria** (what must be TRUE):
  1. User sees glassmorphism top bar with zone name, online count badge, branding, user avatar, settings icon, and notifications bell
  2. User sees redesigned voice controls as floating glass pill with animated mic icon transition (mic↔mic-off) and volume indicator
  3. User sees active speaker stack (overlapping avatar circles) and tiny waveform showing own voice activity
  4. User can open slide-in chat panel (right side, toggle with T key) with proximity messages, emoji picker, and chat bubbles
  5. User can open collapsible user list (left side) showing all users with avatar, status, distance, and "teleport camera" click action
  6. User can open settings modal with tabs including Audio settings (mic/speaker select, volume sliders, noise suppression toggle, live mic meter)
  7. User sees notification toasts for "[User] entered space", "[User] entered proximity", and connection status changes
  8. User can deafen all incoming audio via deafen button in voice controls (separate from mute)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Polish & Micro-interactions
**Goal**: Optimize performance, add accessibility features, keyboard shortcuts, and UI sound effects to complete the experience
**Depends on**: Phase 5 (all core features exist to polish)
**Requirements**: PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05, PLSH-06, PLSH-07, PLSH-08
**Success Criteria** (what must be TRUE):
  1. App maintains 60fps with 30+ visible avatars, parallax effects, particles, and all HUD panels open (verified via continuous 10-minute test)
  2. User can use keyboard shortcuts (M=mute, T=chat, Tab=user list, Esc=close panel, 1-5=emotes) with hints shown in tooltips
  3. User hears subtle UI sounds (proximity enter/exit chime, button click, notification ping) when sound effects are enabled in settings
  4. User sees visible focus indicators (glow rings) on all interactive HUD elements for keyboard navigation
  5. User sees reconnection overlay ("Reconnecting..." with spinner and retry button) on socket disconnect
  6. User sees helpful guide modal with troubleshooting steps when microphone permission is denied by browser
  7. HUD panels adapt to tablet layout (bottom sheets instead of side panels) and canvas resizes correctly on window resize
  8. App shows "Desktop recommended" message with explanation when accessed from mobile device
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design System Foundation | 0/0 | Not started | - |
| 2. Authentication & Lobby Redesign | 0/0 | Not started | - |
| 3. Game World Visual Upgrade | 0/0 | Not started | - |
| 4. Avatar System Overhaul | 0/0 | Not started | - |
| 5. HUD & Overlay System | 0/0 | Not started | - |
| 6. Polish & Micro-interactions | 0/0 | Not started | - |
