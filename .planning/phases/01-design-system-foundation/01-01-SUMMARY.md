---
phase: 01-design-system-foundation
plan: 01
subsystem: frontend-design-tokens
tags: [design-system, tailwind, typography, glassmorphism]
dependency_graph:
  requires: []
  provides:
    - design-tokens-colors
    - design-tokens-typography
    - design-tokens-animations
    - glassmorphism-utilities
    - accessibility-motion-preferences
  affects:
    - all-frontend-components
    - all-ui-work-phases-1-6
tech_stack:
  added:
    - "@fontsource/inter@5.2.8"
    - "@fontsource/space-grotesk@5.2.10"
    - "colord@2.9.3"
    - "tailwindcss-animate@1.0.7"
  patterns:
    - "Tailwind CSS design token system"
    - "Custom utility classes via @layer components"
    - "Font loading without FOIT via @fontsource"
    - "CSS custom properties for dynamic theming"
key_files:
  created: []
  modified:
    - client/tailwind.config.js
    - client/src/index.css
    - client/src/main.tsx
    - client/package.json
    - package-lock.json
decisions:
  - title: "ESM-compatible Tailwind config"
    context: "Node.js 25+ with type:module requires .js extension for imports"
    choice: "Use import tailwindcss-animate instead of require()"
    alternatives: ["Use .cjs extension", "Use dynamic import()"]
    rationale: "Maintains ES module consistency across the project, aligns with Vite and modern tooling"
  - title: "Glow ring utilities instead of dynamic shadows"
    context: "Need colored glow effects for interactive elements"
    choice: "Pre-defined .glow-ring-* classes for 5 semantic colors"
    alternatives: ["Use shadow-* with arbitrary values", "Use CSS variables"]
    rationale: "Better performance (no runtime calculation), easier to use, consistent with design system"
metrics:
  duration_minutes: 2.4
  tasks_completed: 2
  files_created: 0
  files_modified: 5
  commits: 2
  tests_added: 0
  completed_date: 2026-02-16
---

# Phase 01 Plan 01: Design System Foundation Summary

**One-liner:** Established complete Tailwind design token system with indigo/blue/emerald/amber semantic colors, Inter+Space Grotesk typography, glassmorphism utilities, and accessibility-first reduced-motion support.

## Overview

Created the foundational design token system that all subsequent UI work in Phases 1-6 will consume. This plan establishes a single source of truth for colors, fonts, spacing, animations, and glassmorphism effects to prevent inconsistency across the entire frontend overhaul.

## Tasks Completed

### Task 1: Install dependencies and configure Tailwind design tokens
**Commit:** 2cec99f
**Files:** client/package.json, client/tailwind.config.js, package-lock.json

- Installed 4 new dependencies: @fontsource/inter, @fontsource/space-grotesk, colord, tailwindcss-animate
- Created comprehensive Tailwind config with 6 color token scales (primary indigo, accent blue, voice emerald, social amber, surface dark, glass translucent)
- Added Inter as default sans font and Space Grotesk as heading font
- Configured 8 animation keyframes (fadeIn, fadeOut, slideUp, slideDown, scaleIn, ripple, float, glow-pulse)
- Added glow-sm/md/lg box shadow utilities for colored glows
- Added glass backdrop-blur utility (12px)
- Registered tailwindcss-animate plugin

**Auto-fixes applied:**
- Fixed ESM import path: tailwindcss/defaultTheme → tailwindcss/defaultTheme.js (Node.js 25+ requires .js extension)
- Fixed plugin import: require('tailwindcss-animate') → import tailwindcssAnimate (ES module compatibility)

### Task 2: Set up fonts, glass utility, glow utilities, and reduced-motion styles
**Commit:** 62b3fe5
**Files:** client/src/main.tsx, client/src/index.css

- Added 7 @fontsource imports for Inter (400-700) and Space Grotesk (500-700) weights
- Created .glass utility class with backdrop-filter blur(12px) and white border
- Created .glass-hover utility for interactive glassmorphism hover states
- Created 5 .glow-ring-* utilities (primary, accent, voice, social, danger) for focus states
- Added global prefers-reduced-motion media query to disable all animations for accessibility
- Added font-smoothing to base styles for better typography rendering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Node.js ESM import paths**
- **Found during:** Task 1 verification
- **Issue:** import defaultTheme from 'tailwindcss/defaultTheme' failed with ERR_MODULE_NOT_FOUND because Node.js 25+ with type:module requires explicit .js extension
- **Fix:** Changed to import defaultTheme from 'tailwindcss/defaultTheme.js'
- **Files modified:** client/tailwind.config.js
- **Commit:** 2cec99f (part of Task 1 commit)

**2. [Rule 1 - Bug] Fixed ES module plugin import**
- **Found during:** Task 1 verification
- **Issue:** require('tailwindcss-animate') threw "ReferenceError: require is not defined in ES module scope"
- **Fix:** Changed to import tailwindcssAnimate from 'tailwindcss-animate' and used variable in plugins array
- **Files modified:** client/tailwind.config.js
- **Commit:** 2cec99f (part of Task 1 commit)

## Verification Results

All success criteria met:

- ✅ Tailwind config has 6 custom color scales (primary, accent, voice, social, surface, glass)
- ✅ Tailwind config has Inter as default sans font and Space Grotesk as heading font
- ✅ Tailwind config has 8 animation keyframes and corresponding animation utilities
- ✅ Tailwind config has glow-sm, glow-md, glow-lg box shadow utilities
- ✅ Tailwind config has tailwindcss-animate plugin registered
- ✅ index.css has .glass utility with backdrop-filter and border
- ✅ index.css has .glow-ring-* utilities for all 5 color variants
- ✅ index.css has prefers-reduced-motion media query disabling all animations
- ✅ main.tsx imports 7 @fontsource CSS files before index.css
- ✅ TypeScript compilation succeeds
- ✅ No regressions to existing functionality

**Test results:**
- npm ls shows all 4 dependencies installed
- Node.js config import shows 6 colors, 2 font families, 8 animations
- 7 @fontsource imports found in main.tsx
- 2 .glass class references in index.css
- prefers-reduced-motion media query present
- npx tsc --noEmit exits successfully

## What Works Now

Users and developers can now:

1. **Use semantic color tokens** in any Tailwind class: text-primary-500, bg-accent-600, border-voice-400, text-social-300
2. **Apply glassmorphism** with a single class: <div class="glass"> for modern frosted glass effect
3. **Use heading typography** with Space Grotesk: <h1 class="font-heading">
4. **Apply glow effects** for interactive states: <button class="glow-ring-primary focus:glow-ring-accent">
5. **Use smooth animations** that respect user preferences: animate-fadeIn, animate-slideUp, animate-float
6. **Build accessible UIs** that automatically disable animations for users with prefers-reduced-motion

## Design Token Reference

**Color Palette:**
- **primary** (indigo #6366f1): Primary brand color, main CTAs, interactive elements
- **accent** (blue #3b82f6): Secondary actions, highlights, links
- **voice** (emerald #10b981): Voice activity indicators, audio controls
- **social** (amber #f59e0b): Social features, notifications, user interactions
- **surface** (dark #0f0f23-#3a3a4e): Background layers, cards, containers
- **glass** (translucent white): Glassmorphism overlays, modals, floating panels

**Typography:**
- **Inter**: Body text, UI elements (400, 500, 600, 700 weights)
- **Space Grotesk**: Headings, emphasis (500, 600, 700 weights)

**Animations:**
- **fadeIn/fadeOut**: Opacity transitions (150-200ms)
- **slideUp/slideDown**: Vertical motion (200ms)
- **scaleIn**: Zoom-in effect (150ms)
- **ripple**: Click feedback (600ms)
- **float**: Subtle hover effect (3s infinite)
- **glow-pulse**: Attention-grabbing pulse (2s infinite)

## Impact on Future Work

**Unblocks:**
- Phase 1 Plan 2: Button component system (will use primary/accent colors, glass utilities)
- Phase 1 Plan 3: Input component system (will use voice/social colors, glow-ring utilities)
- Phase 2: Canvas UI overlay components (will use glassmorphism utilities)
- Phase 3: PixiJS avatar components (will use color tokens for status indicators)
- Phase 5: Chat UI (will use typography tokens, animations)
- Phase 6: Performance dashboard (will use surface colors, glow effects)

**Prevents:**
- Color inconsistency across 6 phases of UI work
- Font loading flash (FOIT) due to unoptimized font imports
- Accessibility violations for motion-sensitive users
- Duplicate utility class definitions across components

## Self-Check: PASSED

**Created files verification:**
- ✅ No new files were created (only modifications)

**Modified files verification:**
- ✅ FOUND: client/tailwind.config.js
- ✅ FOUND: client/src/index.css
- ✅ FOUND: client/src/main.tsx
- ✅ FOUND: client/package.json
- ✅ FOUND: package-lock.json

**Commits verification:**
- ✅ FOUND: 2cec99f (Task 1)
- ✅ FOUND: 62b3fe5 (Task 2)

All files and commits verified on disk.
