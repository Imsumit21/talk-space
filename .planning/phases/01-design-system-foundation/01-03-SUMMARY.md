---
phase: 01-design-system-foundation
plan: 03
subsystem: frontend-ui-components
tags: [design-system, components, card, badge, tooltip, toast, glassmorphism, notifications]
dependency_graph:
  requires:
    - design-tokens-colors
    - design-tokens-typography
    - design-tokens-animations
    - glassmorphism-utilities
  provides:
    - card-component
    - badge-component
    - tooltip-component
    - toast-notification-system
  affects:
    - phase-02-canvas-ui-overlay
    - phase-04-social-layer-components
    - phase-05-chat-ui
tech_stack:
  added: []
  patterns:
    - "Glassmorphism container components"
    - "Status badge system with color variants"
    - "Accessible tooltip with positioning"
    - "Toast notification system with Zustand"
    - "Enter/exit animations with motion-safe guards"
key_files:
  created:
    - client/src/components/ui/Card.tsx
    - client/src/components/ui/Badge.tsx
    - client/src/components/ui/Tooltip.tsx
    - client/src/components/ui/Toast.tsx
  modified: []
decisions:
  - title: "Inline Zustand store for toast state"
    context: "Toast system needs global state management for notification stack"
    choice: "Create inline Zustand store within Toast.tsx instead of separate file"
    alternatives: ["Separate store file", "React Context", "Global singleton"]
    rationale: "Keeps toast system self-contained and portable, avoids external dependencies, simpler to understand and maintain"
  - title: "Auto-dismiss with exit animation"
    context: "Toasts need to disappear after duration but with smooth transition"
    choice: "Track exiting state, set before removal, wait 150ms for fadeOut animation"
    alternatives: ["Instant removal", "CSS-only animation", "AnimatePresence library"]
    rationale: "Provides smooth UX without external animation library, respects motion preferences, gives user time to read"
metrics:
  duration_minutes: 1.7
  tasks_completed: 2
  files_created: 4
  files_modified: 0
  commits: 2
  tests_added: 0
  completed_date: 2026-02-17
---

# Phase 01 Plan 03: Card, Badge, Tooltip, and Toast Components Summary

**One-liner:** Built complete visual/feedback component set — Card with glassmorphism variants, Badge with pulse indicators, Tooltip with smart positioning, and Toast notification system with Zustand-backed auto-dismiss stack.

## Overview

Created four production-ready UI components that provide container styling (Card), status indication (Badge), contextual help (Tooltip), and user notifications (Toast). These components complete the Phase 1 design system primitive set and establish patterns for glassmorphism, color variants, animations, and accessibility that all future components will follow.

## Tasks Completed

### Task 1: Build Card and Badge components
**Commit:** 0027444
**Files:** client/src/components/ui/Card.tsx, client/src/components/ui/Badge.tsx

**Card component:**
- 3 variants: glass (default, uses .glass utility), solid (opaque bg), outline (transparent)
- 4 padding options: none, sm (p-3), md (p-5), lg (p-8)
- Optional hover lift effect with shadow transition and glass-hover class
- Spreads extra HTMLDivElement props for flexibility
- Overflow hidden for clean borders
- Full TypeScript typing with CardProps interface

**Badge component:**
- 6 color variants: primary (indigo), accent (blue), voice (emerald), social (amber), danger (red), neutral (gray)
- 2 sizes: sm (text-xs px-1.5), md (text-xs px-2.5)
- Optional pulse indicator: animated dot in matching color
- ScaleIn enter animation with motion-safe guard
- Inline-flex for natural text flow
- Full TypeScript typing with BadgeProps interface

### Task 2: Build Tooltip and Toast notification system
**Commit:** 36ec02f
**Files:** client/src/components/ui/Tooltip.tsx, client/src/components/ui/Toast.tsx

**Tooltip component:**
- 4 position options: top, bottom, left, right (default: top)
- Configurable show delay (default: 300ms) with timeout cleanup
- Mouse and keyboard triggers: onMouseEnter/Leave, onFocus/Blur
- Glassmorphism styling via .glass utility
- FadeIn animation with motion-safe guard
- Full accessibility: role="tooltip", aria-describedby, aria-hidden
- Auto-generated unique IDs for ARIA references

**Toast notification system:**
- **ToastProvider:** Fixed top-right container (z-100) with vertical stack
- **Toast:** Single notification item with 4 variants (info/success/warning/error)
  - Distinct left border colors: accent-500, voice-500, social-500, red-500
  - Inline SVG icons (16x16) for each variant
  - Auto-dismiss timer with configurable duration
  - Manual close button (x icon)
  - Exit animation: track exiting state, 150ms fadeOut before removal
  - Enter animation: slideUp on mount
- **useToast hook:** Convenience methods (toast, success, error, warning, info)
- **Inline Zustand store:** Self-contained state management within Toast.tsx
  - toasts array, addToast, removeToast actions
  - crypto.randomUUID() for unique IDs
  - No external store file needed

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

All success criteria met:

**Card:**
- Card has 3 variants (glass/solid/outline) with glassmorphism as default
- Card has hover lift effect option with shadow transition and glass-hover class
- Card has 4 padding options (none/sm/md/lg)
- Card spreads extra props for flexibility

**Badge:**
- Badge has 6 color variants matching design token palette
- Badge has 2 sizes (sm/md)
- Badge has optional pulse dot indicator with matching color
- Badge has scaleIn enter animation with motion-safe guard

**Tooltip:**
- Tooltip has 4 position options (top/bottom/left/right)
- Tooltip has configurable show delay with timeout cleanup
- Tooltip uses glassmorphism styling and fadeIn animation
- Tooltip has proper accessibility (role, aria-describedby, aria-hidden)
- Tooltip has mouse and keyboard trigger support

**Toast:**
- Toast system has 4 variants (info/success/warning/error) with distinct left border colors
- Toast has inline SVG icons for each variant
- Toast has auto-dismiss timer with configurable duration
- Toast has enter (slideUp) and exit (fadeOut) animations
- Toast has close button for manual dismissal
- ToastProvider renders fixed container in top-right corner
- useToast hook provides convenience methods
- Toast uses inline Zustand store for state management

**Overall:**
- All animations respect prefers-reduced-motion via motion-safe prefix
- TypeScript compilation succeeds with no errors
- All 4 files created and exported correctly

**Test results:**
- npx tsc --noEmit exits successfully (no type errors)
- All 4 files exist at expected paths
- Toast.tsx has 4 exports (useToast, ToastProvider, Toast type exports)
- glass utility found in Card.tsx
- hover lift effect found in Card.tsx
- pulse indicator found in Badge.tsx
- variant system found in Badge.tsx
- role="tooltip" found in Tooltip.tsx
- motion-safe:animate-* found in Toast.tsx and Tooltip.tsx
- Zustand create() import found in Toast.tsx

## What Works Now

Users and developers can now:

1. **Build glassmorphism containers** with Card component: `<Card variant="glass" hover padding="lg">`
2. **Show status indicators** with Badge: `<Badge variant="voice" pulse>Speaking</Badge>`
3. **Add contextual help** with Tooltip: `<Tooltip content="Delete account" position="bottom">`
4. **Display notifications** with useToast hook:
   ```tsx
   const { success, error } = useToast();
   success("Profile saved!");
   error("Connection lost");
   ```
5. **Create accessible UIs** with ARIA attributes and keyboard support built-in
6. **Respect user preferences** — all animations automatically disabled for reduced-motion users

## Component Usage Examples

**Card:**
```tsx
// Auth panel
<Card variant="glass" hover padding="lg">
  <h2>Sign In</h2>
  <AuthForm />
</Card>

// Settings section
<Card variant="solid" padding="md">
  <h3>Audio Settings</h3>
  <VolumeSlider />
</Card>
```

**Badge:**
```tsx
// User status
<Badge variant="voice" pulse>Speaking</Badge>
<Badge variant="neutral">AFK</Badge>
<Badge variant="danger">Muted</Badge>

// Notification count
<Badge variant="primary" size="sm">3</Badge>
```

**Tooltip:**
```tsx
// Icon button help
<Tooltip content="Mute microphone" position="bottom">
  <button><MicIcon /></button>
</Tooltip>

// Info label
<Tooltip content="This setting affects all users in your proximity">
  <InfoIcon />
</Tooltip>
```

**Toast:**
```tsx
// In component
const { success, error, warning } = useToast();

// On action
onClick={() => success("Friend request sent!")}
onError={() => error("Failed to save changes")}
onWarning(() => warning("Low bandwidth detected")}

// In App.tsx (add once)
<ToastProvider />
```

## Design Patterns Established

**1. Color variant system:**
All components use semantic color names (primary, accent, voice, social, danger, neutral) that map to design tokens. Future components should follow this pattern instead of using arbitrary colors.

**2. Glassmorphism integration:**
Card uses the .glass utility from index.css for consistent frosted glass effect. Future overlay components (modals, dropdowns, popovers) should follow this pattern.

**3. Motion-safe animations:**
All animations use motion-safe: prefix to respect prefers-reduced-motion. This is now the standard for all animated components.

**4. Inline state management:**
Toast demonstrates inline Zustand store pattern for self-contained features. Future notification-like systems can follow this approach.

**5. Accessibility by default:**
Tooltip shows how to implement ARIA attributes correctly. Future interactive components must include role, aria-*, and keyboard support.

## Impact on Future Work

**Unblocks:**
- Phase 2: Canvas UI overlay (will use Card for HUD panels, Badge for user status, Toast for connection alerts)
- Phase 4: Social layer (will use Card for friend list, Badge for online status, Tooltip for profile info)
- Phase 5: Chat UI (will use Card for chat container, Badge for unread count, Toast for mentions)
- Phase 6: Performance dashboard (will use Card for metrics panels, Badge for warning states)

**Prevents:**
- Inconsistent glassmorphism implementations across overlay UIs
- Custom notification systems being built per-feature
- Accessibility violations in tooltip-like components
- Animation-related motion sickness issues

**Enables:**
- Rapid prototyping of new features using established component library
- Consistent UX across all UI surfaces
- Easy theming via design token updates

## Technical Notes

**Glassmorphism best practices:**
- Card glass variant uses backdrop-filter: blur(12px) from Tailwind config
- Always pair with dark background for contrast
- Use glass-hover class for interactive glass elements

**Toast system architecture:**
- Zustand store is module-scoped (one instance per app)
- crypto.randomUUID() requires modern browsers (fallback needed for Safari <15.4)
- Auto-dismiss uses setTimeout — cleanup on unmount prevents memory leaks
- Exit animation state prevents visual jump when removing from DOM

**Tooltip positioning:**
- Absolute positioning relative to inline-block wrapper
- Uses Tailwind transforms for centering (translate-x-1/2, translate-y-1/2)
- No collision detection — future enhancement if needed
- pointer-events-none prevents tooltip from blocking clicks

**Badge pulse indicator:**
- Uses Tailwind's built-in animate-pulse (opacity 0-1 cycle)
- Separate from motion-safe guard (pulse is not motion-sensitive)
- aria-hidden="true" to prevent screen reader announcement

## Self-Check: PASSED

**Created files verification:**
- FOUND: client/src/components/ui/Card.tsx
- FOUND: client/src/components/ui/Badge.tsx
- FOUND: client/src/components/ui/Tooltip.tsx
- FOUND: client/src/components/ui/Toast.tsx

**Commits verification:**
- FOUND: 0027444 (Task 1: Card and Badge)
- FOUND: 36ec02f (Task 2: Tooltip and Toast)

All files and commits verified on disk.
