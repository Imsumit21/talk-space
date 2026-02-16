# Requirements: Talk Space Frontend Overhaul

**Defined:** 2026-02-17
**Core Value:** Users can naturally meet and talk with people nearby in a virtual space — proximity creates organic social interactions

## v1 Requirements

Requirements for Frontend Overhaul v1.0. Each maps to roadmap phases.

### Design System

- [ ] **DSGN-01**: User sees consistent color palette (indigo primary, electric blue accent, emerald voice, amber social)
- [ ] **DSGN-02**: User sees Inter font for body text and Space Grotesk for headings across all UI
- [ ] **DSGN-03**: User can interact with Button component (primary, secondary, ghost, danger variants with loading state and ripple effect)
- [ ] **DSGN-04**: User can type in Input component with floating label animation, focus glow ring, and validation states
- [ ] **DSGN-05**: User sees Card component with glassmorphism styling (backdrop-blur, white border, hover lift)
- [ ] **DSGN-06**: User sees Badge, Tooltip, and Toast notification components with enter/exit animations
- [ ] **DSGN-07**: User with reduced-motion preference sees no animations (prefers-reduced-motion respected globally)
- [ ] **DSGN-08**: Tailwind config extends with design tokens, .glass utility, glow utilities, and animation keyframes

### Auth & Lobby

- [ ] **AUTH-01**: User sees animated gradient mesh background on auth page (indigo/purple/blue shifting)
- [ ] **AUTH-02**: User sees glassmorphism card with Talk Space branding (SVG icon with glow) and smooth sliding tab switcher
- [ ] **AUTH-03**: User sees floating label inputs with validation icons on blur and password strength meter on register
- [ ] **AUTH-04**: User sees gradient submit button (indigo→blue) with hover scale + glow and orbital loading spinner
- [ ] **AUTH-05**: User sees error feedback via form shake animation, red glow on invalid fields, and descriptive toast
- [ ] **AUTH-06**: User sees social auth placeholder section (Google/GitHub buttons in disabled/coming-soon state)
- [ ] **AUTH-07**: User sees polished lobby with gradient avatar, username, "Ready to explore?" tagline, live online count, and prominent enter space button
- [ ] **AUTH-08**: User experiences smooth transitions (fade/scale auth→lobby, zoom-in lobby→space, skeleton loading for session restore)

### Game World

- [ ] **WRLD-01**: User sees layered parallax background (deep space gradient, twinkling star field, drifting nebula blobs)
- [ ] **WRLD-02**: User sees soft dotted grid (small circles at intersections, low opacity, blue tint) replacing hard lines
- [ ] **WRLD-03**: User sees at least one decorated zone with colored floor area, floating glass label, and decorative objects
- [ ] **WRLD-04**: User sees soft radial gradient aura around avatars in voice range (replacing hard green ring)
- [ ] **WRLD-05**: User sees faint curved bezier connection lines between connected users with gradient opacity
- [ ] **WRLD-06**: User experiences smooth camera follow with slight lag/easing (configurable, not locked 1:1)
- [ ] **WRLD-07**: User sees glowing edge with gradient fade at world boundaries (not hard 2px line)
- [ ] **WRLD-08**: User sees mini-map in corner showing full world with dot positions

### Avatar System

- [ ] **AVTR-01**: User sees gradient circle avatar with simple expressive face (two dot eyes, slight curve mouth)
- [ ] **AVTR-02**: User sees gentle idle bob animation (1-2px sine wave float) with occasional blink
- [ ] **AVTR-03**: User sees squash/stretch in movement direction with 3-4 fading afterimage trail
- [ ] **AVTR-04**: User sees speaking ring that pulsates mapped to actual voice amplitude (not fixed sine wave)
- [ ] **AVTR-05**: User sees pop-in scale animation (0→1.1→1.0) with sparkle particle burst on proximity enter
- [ ] **AVTR-06**: User sees AFK state (dimmed avatar, floating "zzz" text) after 2 minutes idle
- [ ] **AVTR-07**: User can trigger emote reactions (wave, thumbs up, laugh) via keyboard shortcuts (1-5) that float up and fade
- [ ] **AVTR-08**: User sees glassmorphism nameplate pill below avatar with truncated name, status dot, and typing indicator

### HUD & Overlays

- [ ] **HUD-01**: User sees glassmorphism top bar with zone name, online count badge, branding, user avatar, settings icon, and notifications bell
- [ ] **HUD-02**: User sees redesigned voice controls as floating glass pill with animated mic icon transition (mic↔mic-off)
- [ ] **HUD-03**: User sees active speaker stack (overlapping avatar circles) and tiny waveform showing own voice activity
- [ ] **HUD-04**: User can open slide-in chat panel (right side, toggle with T key) with proximity messages, emoji picker, and chat bubbles
- [ ] **HUD-05**: User can open collapsible user list (left side) showing all users with avatar, status, distance, and "teleport camera" click
- [ ] **HUD-06**: User can open settings modal with tabs (Audio: mic/speaker select, volume, noise suppression, live mic meter)
- [ ] **HUD-07**: User sees notification toasts for "[User] entered space", "[User] entered proximity", and connection status changes
- [ ] **HUD-08**: User can deafen all incoming audio via deafen button in voice controls

### Polish & Accessibility

- [ ] **PLSH-01**: App maintains 60fps with 30+ visible avatars, parallax, particles, and all HUD panels open
- [ ] **PLSH-02**: User can use keyboard shortcuts (M=mute, T=chat, Tab=user list, Esc=close panel, 1-5=emotes) with hints in tooltips
- [ ] **PLSH-03**: User hears subtle UI sounds (proximity enter/exit chime, button click, notification) when sound effects enabled
- [ ] **PLSH-04**: User sees visible focus indicators on all interactive HUD elements for keyboard navigation
- [ ] **PLSH-05**: User sees reconnection overlay ("Reconnecting..." with spinner and retry button) on disconnect
- [ ] **PLSH-06**: User sees helpful guide modal when microphone permission is denied
- [ ] **PLSH-07**: HUD panels adapt to tablet layout (bottom sheets) and canvas resizes on window resize
- [ ] **PLSH-08**: App shows "Desktop recommended" message on mobile device detection

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Social Features

- **SOCL-01**: User can add/remove friends from user list
- **SOCL-02**: User can view other users' profiles with stats
- **SOCL-03**: User can create and join multiple rooms/spaces

### Advanced Avatar

- **AVTR-09**: User can customize avatar with color picker and shape selection (circle, square, hexagon)
- **AVTR-10**: User can see webcam-based facial expression sync on avatar (Live2D-style)

### Advanced World

- **WRLD-09**: User can place decorative objects in the world (drag-drop from palette)
- **WRLD-10**: User can create ephemeral "huddle" zones that auto-delete when empty
- **WRLD-11**: User sees spatial audio zones with different audio behaviors (stage, huddle, quiet)

### Communication

- **COMM-01**: User can send rich text messages with markdown formatting
- **COMM-02**: User can start screen sharing with nearby users
- **COMM-03**: User can enable optional video chat

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first platform, desktop is primary |
| OAuth/social login backend | UI placeholders only, backend deferred to social layer milestone |
| Real-time chat backend | Chat panel UI only, Socket.io chat events deferred |
| Video chat | Audio-only for this milestone |
| Custom avatar uploads | Moderation complexity, procedural avatars for now |
| Room creation UI | Single world for now |
| 3D avatars | Breaks 2D aesthetic, performance concerns |
| Payment/monetization | Not relevant for frontend overhaul |
| Blockchain/NFT features | No UX value, high complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSGN-01 | Phase 1 | Pending |
| DSGN-02 | Phase 1 | Pending |
| DSGN-03 | Phase 1 | Pending |
| DSGN-04 | Phase 1 | Pending |
| DSGN-05 | Phase 1 | Pending |
| DSGN-06 | Phase 1 | Pending |
| DSGN-07 | Phase 1 | Pending |
| DSGN-08 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| AUTH-08 | Phase 2 | Pending |
| WRLD-01 | Phase 3 | Pending |
| WRLD-02 | Phase 3 | Pending |
| WRLD-03 | Phase 3 | Pending |
| WRLD-04 | Phase 3 | Pending |
| WRLD-05 | Phase 3 | Pending |
| WRLD-06 | Phase 3 | Pending |
| WRLD-07 | Phase 3 | Pending |
| WRLD-08 | Phase 3 | Pending |
| AVTR-01 | Phase 4 | Pending |
| AVTR-02 | Phase 4 | Pending |
| AVTR-03 | Phase 4 | Pending |
| AVTR-04 | Phase 4 | Pending |
| AVTR-05 | Phase 4 | Pending |
| AVTR-06 | Phase 4 | Pending |
| AVTR-07 | Phase 4 | Pending |
| AVTR-08 | Phase 4 | Pending |
| HUD-01 | Phase 5 | Pending |
| HUD-02 | Phase 5 | Pending |
| HUD-03 | Phase 5 | Pending |
| HUD-04 | Phase 5 | Pending |
| HUD-05 | Phase 5 | Pending |
| HUD-06 | Phase 5 | Pending |
| HUD-07 | Phase 5 | Pending |
| HUD-08 | Phase 5 | Pending |
| PLSH-01 | Phase 6 | Pending |
| PLSH-02 | Phase 6 | Pending |
| PLSH-03 | Phase 6 | Pending |
| PLSH-04 | Phase 6 | Pending |
| PLSH-05 | Phase 6 | Pending |
| PLSH-06 | Phase 6 | Pending |
| PLSH-07 | Phase 6 | Pending |
| PLSH-08 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after initial definition*
