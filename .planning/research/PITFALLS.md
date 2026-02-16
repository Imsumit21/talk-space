# Domain Pitfalls - Frontend Overhaul

**Domain:** Proximity-based social platform frontend with PixiJS + React
**Researched:** February 16, 2026

## Critical Pitfalls

Mistakes that cause rewrites or major issues. MUST avoid.

---

### Pitfall 1: Installing Deprecated Glassmorphism Plugins

**What goes wrong:** Developers install `tailwindcss-glassmorphism` or similar plugins, then discover they conflict with Tailwind 3.x native utilities or are no longer maintained.

**Why it happens:** Old tutorials (2021-2023) recommend plugins. Developers don't realize Tailwind 3.x has built-in `backdrop-blur-*`, `backdrop-saturate-*`, and `bg-opacity-*` utilities.

**Consequences:**
- Plugin conflicts with native Tailwind utilities
- Unmaintained code in dependency tree
- Larger bundle size (plugin overhead)
- Harder to debug when styles don't work

**Prevention:**
- Use native Tailwind utilities ONLY:
  ```css
  .glass {
    @apply bg-white/10 backdrop-blur-md backdrop-saturate-150 border border-white/20;
  }
  ```
- Check Tailwind docs (not random blog posts) for current best practices
- Verify plugin maintenance status on GitHub before installing

**Detection:**
- Warning sign: Tutorial older than 2024 recommending glassmorphism plugins
- Warning sign: `npm install tailwindcss-glassmorphism` in instructions
- Warning sign: Plugin README hasn't been updated in 2+ years

---

### Pitfall 2: Mixing React and PixiJS Render Cycles

**What goes wrong:** Developers use `react-pixi` or render React components inside PixiJS canvas, causing re-render conflicts, performance issues, and state sync bugs.

**Why it happens:** "React + PixiJS" tutorials recommend `react-pixi`. Seems easier than manual PixiJS setup. Developers don't understand reconciliation conflicts.

**Consequences:**
- React state changes trigger PixiJS re-renders (60fps drops to 15fps)
- PixiJS updates don't trigger React re-renders (state desync)
- Debugging nightmare (two render systems fighting)
- Forced rewrite to separate layers

**Prevention:**
- Keep PixiJS and React COMPLETELY SEPARATE
- PixiJS canvas layer: Handles game world (avatars, particles, effects)
- React UI layer: Absolute positioned over canvas (HUD, modals, chat)
- Communication via Zustand store (single source of truth)
- Never use `react-pixi`, `react-konva`, or similar reconciliation wrappers

**Detection:**
- Warning sign: `import { Stage, Sprite } from 'react-pixi'` in code
- Warning sign: React components rendering inside `<canvas>` element
- Warning sign: FPS drops when React state changes
- Warning sign: PixiJS sprites not updating when state changes

---

### Pitfall 3: Particle Emitter Memory Leaks

**What goes wrong:** Developers create particle emitters on events (proximity enter, clicks) but forget to destroy them. Memory grows unbounded, FPS degrades over time.

**Why it happens:** `@pixi/particle-emitter` doesn't auto-cleanup. Developers treat emitters like one-shot effects and forget lifecycle management.

**Consequences:**
- Memory usage grows by 10-50mb per hour
- FPS drops from 60 to 30 after 20 minutes
- Browser tab crashes after extended use
- Forced page refresh to clear memory

**Prevention:**
- ALWAYS call `emitter.destroy()` in cleanup functions
- Use emitter pooling for repeated effects (reuse, don't recreate)
- Set up React `useEffect` cleanup:
  ```typescript
  useEffect(() => {
    const emitter = new Emitter(container, config);
    emitter.emit = true;
    return () => emitter.destroy(); // CRITICAL
  }, []);
  ```
- Monitor memory with Chrome DevTools (watch for sawtooth pattern)

**Detection:**
- Warning sign: Memory usage increasing over time (DevTools Memory tab)
- Warning sign: FPS degrades after 10-20 minutes of use
- Warning sign: `new Emitter()` without corresponding `destroy()` call
- Warning sign: Emitters created in event handlers without cleanup

---

### Pitfall 4: Bundling Entire Icon/Emoji Libraries

**What goes wrong:** Developers import entire icon library or emoji dataset, bloating bundle by 500kb-2mb.

**Why it happens:** Lazy imports like `import * as Icons from 'lucide-react'` or not lazy-loading `emoji-picker-react`.

**Consequences:**
- Initial bundle size: 2-3mb (uncompressed)
- Slow initial load (3-5 seconds on 3G)
- Poor Lighthouse scores
- Users bounce before app loads

**Prevention:**
- **Icons:** Import only used icons:
  ```typescript
  import { Mic, MicOff, Settings } from 'lucide-react'; // ✅
  import * as Icons from 'lucide-react'; // ❌
  ```
- **Emoji picker:** Lazy load with React.lazy():
  ```typescript
  const EmojiPicker = React.lazy(() => import('emoji-picker-react')); // ✅
  import EmojiPicker from 'emoji-picker-react'; // ❌
  ```
- Verify bundle size with `npm run build` and check `dist/` folder
- Use Vite's `rollup-plugin-visualizer` to see bundle composition

**Detection:**
- Warning sign: `dist/index.js` larger than 500kb
- Warning sign: Lighthouse "Reduce unused JavaScript" warning
- Warning sign: Import statements without tree-shaking (import *)
- Warning sign: Emoji picker loads immediately, not on demand

---

### Pitfall 5: Synchronous Font Loading Blocking Render

**What goes wrong:** Developers import all font weights upfront (`import "@fontsource/inter"`), blocking initial render with 500kb+ font files.

**Why it happens:** Fontsource docs show simple import (loads all weights). Developers don't realize they can import specific weights.

**Consequences:**
- FOIT (Flash of Invisible Text) for 2-3 seconds
- Initial render blocked until fonts load
- Poor user experience (blank screen)
- Lighthouse "Reduce render-blocking resources" warning

**Prevention:**
- Import ONLY used weights:
  ```typescript
  import "@fontsource/inter/400.css"; // Regular
  import "@fontsource/inter/600.css"; // Semibold
  // Don't import 100, 200, 300, 500, 700, 800, 900
  ```
- Use `font-display: swap` (Fontsource does this by default)
- Preload critical fonts in `index.html`:
  ```html
  <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
  ```

**Detection:**
- Warning sign: White screen for 2-3 seconds on initial load
- Warning sign: Lighthouse "Ensure text remains visible during webfont load"
- Warning sign: Network tab shows 500kb+ font file loading synchronously
- Warning sign: `import "@fontsource/inter"` without weight suffix

---

## Moderate Pitfalls

Issues that cause rework but not full rewrites.

---

### Pitfall 6: Over-Animating with framer-motion

**What goes wrong:** Developers use `motion.div` and `whileHover` for every element, causing JS overhead and 60fps → 45fps degradation.

**Why it happens:** framer-motion is fun. Developers animate everything. Don't realize CSS is faster for simple effects.

**Consequences:**
- 15-30ms frame time overhead (60fps → 40-50fps)
- Janky hover effects on slower devices
- Larger bundle size (framer-motion adds 85kb, used unnecessarily)

**Prevention:**
- Use Tailwind for simple hover effects: `hover:scale-105 transition-transform`
- Use framer-motion ONLY for:
  - Layout animations (reordering lists)
  - Gesture interactions (drag, swipe)
  - Spring physics (bouncy modals)
  - Exit animations with cleanup

**Detection:**
- Warning sign: `motion.div` used for static content
- Warning sign: `whileHover={{ scale: 1.05 }}` instead of CSS hover
- Warning sign: FPS drops when hovering over elements

---

### Pitfall 7: Inline Animation Variants Breaking React.memo

**What goes wrong:** Developers define framer-motion variants inline (inside render function), breaking memoization and causing re-renders.

**Why it happens:** Convenience. Variants defined next to component feel DRY. Don't realize new object = new reference = re-render.

**Consequences:**
- React.memo() ineffective (re-renders every time)
- Animation props change every render (breaks animations)
- Performance degradation (5-10ms per component)

**Prevention:**
- Define variants OUTSIDE render function:
  ```typescript
  const modalVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  function Modal() {
    return <motion.div variants={modalVariants} />
  }
  ```
- Use `useMemo` if variants depend on props:
  ```typescript
  const variants = useMemo(() => ({
    hidden: { x: isLeft ? -100 : 100 },
  }), [isLeft]);
  ```

**Detection:**
- Warning sign: Variants defined inside component function
- Warning sign: React DevTools Profiler shows re-renders on every frame
- Warning sign: Animations restart on unrelated state changes

---

### Pitfall 8: Unoptimized PixiJS Filters

**What goes wrong:** Developers apply multiple filters to every avatar, causing GPU overdraw and 60fps → 20fps.

**Why it happens:** pixi-filters are easy to use. Developers stack GlowFilter + BloomFilter + BlurFilter on every sprite.

**Consequences:**
- FPS drops to 15-30fps with 10+ users
- GPU overload on integrated graphics (laptops)
- Battery drain on mobile devices

**Prevention:**
- Apply filters ONLY to on-screen sprites (cull off-screen)
- Use single filter when possible (GlowFilter OR BloomFilter, not both)
- Limit filter radius (lower = faster):
  ```typescript
  new GlowFilter({ distance: 10 }); // ✅ Fast
  new GlowFilter({ distance: 50 }); // ❌ Slow
  ```
- Use `filterArea` to limit processing region

**Detection:**
- Warning sign: FPS drops when more users join
- Warning sign: GPU usage at 100% (Activity Monitor / Task Manager)
- Warning sign: Multiple filters stacked on same sprite

---

### Pitfall 9: Sound Effect Overload

**What goes wrong:** Developers play sound for every event (proximity, chat, movement), causing audio chaos and user annoyance.

**Why it happens:** use-sound is easy. Developers add sounds to everything. Don't consider cumulative effect.

**Consequences:**
- 10 proximity sounds playing simultaneously (cacophony)
- Users mute app or close tab
- Accessibility issue (screen reader users overwhelmed)

**Prevention:**
- Throttle sounds (max 3 concurrent)
- Prioritize proximity sounds over UI sounds (drop button clicks when proximity event fires)
- Use `useSound` volume option to duck background sounds:
  ```typescript
  const [playNotify] = useSound('/notify.mp3', { volume: 0.5 });
  ```
- Add global mute toggle for UI sounds (separate from voice mute)

**Detection:**
- Warning sign: Multiple sounds playing at once
- Warning sign: User testing reveals annoyance
- Warning sign: Sound plays for every mouse movement or hover

---

### Pitfall 10: Chat Emoji Picker Not Lazy-Loaded

**What goes wrong:** Developers import `emoji-picker-react` at top level, adding 80kb to initial bundle.

**Why it happens:** Standard import pattern. Developers don't realize emoji picker is huge.

**Consequences:**
- Initial bundle 80kb larger (500kb → 580kb)
- Slower initial load (300ms penalty)
- Wasted bandwidth for users who never open chat

**Prevention:**
- Always lazy load:
  ```typescript
  const EmojiPicker = React.lazy(() => import('emoji-picker-react'));
  // ...
  <Suspense fallback={<LoadingSpinner />}>
    {showPicker && <EmojiPicker />}
  </Suspense>
  ```

**Detection:**
- Warning sign: `import EmojiPicker from 'emoji-picker-react'` at top level
- Warning sign: Lighthouse "Reduce unused JavaScript" (emoji picker in initial bundle)
- Warning sign: `npm run build` shows emoji picker in main chunk

---

## Minor Pitfalls

Cosmetic issues or easily fixed bugs.

---

### Pitfall 11: Missing framer-motion AnimatePresence

**What goes wrong:** Exit animations don't play. Modals disappear instantly instead of fading out.

**Why it happens:** Developers forget to wrap with `<AnimatePresence>`. framer-motion docs buried.

**Consequences:**
- Jarring UX (modals pop in/out)
- Exit animations never trigger
- Confusing behavior (entry animations work, exit doesn't)

**Prevention:**
- Always wrap conditional renders with `<AnimatePresence>`:
  ```typescript
  <AnimatePresence>
    {isOpen && <Modal />}
  </AnimatePresence>
  ```

**Detection:**
- Warning sign: Entry animations work, exit animations don't
- Warning sign: Components unmount instantly

---

### Pitfall 12: Particle Emitter Config Typos

**What goes wrong:** Particle emitter config has typo (`lifetime` instead of `life`), particles don't appear.

**Why it happens:** @pixi/particle-emitter config is untyped JSON. Easy to misspell properties.

**Consequences:**
- Particles don't render (silent failure)
- Debugging takes hours (no error messages)

**Prevention:**
- Use particle editor to generate config: https://pixijs.io/particle-emitter-editor/
- Copy/paste working configs from examples
- Add TypeScript types if possible (community types exist)

**Detection:**
- Warning sign: Particles don't appear (no error in console)
- Warning sign: Config hand-written instead of editor-generated

---

### Pitfall 13: lucide-react Icon Size Inconsistency

**What goes wrong:** Developers use different `size` props across icons, causing visual inconsistency.

**Why it happens:** lucide-react defaults to 24px. Developers manually set size without system.

**Consequences:**
- Icons look misaligned (some 20px, some 24px, some 28px)
- Visual chaos in HUD

**Prevention:**
- Establish size system:
  ```typescript
  const ICON_SIZE = { sm: 16, md: 20, lg: 24, xl: 28 };
  <Mic size={ICON_SIZE.md} />
  ```
- Use Tailwind-like sizing scale
- Document in design system

**Detection:**
- Warning sign: Icons visually misaligned
- Warning sign: Hardcoded size values (`size={22}`, `size={18}`, etc.)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Design System** | Installing deprecated Tailwind plugins | Use native backdrop-blur utilities |
| **HUD Components** | Over-animating with framer-motion | Use Tailwind for simple effects |
| **PixiJS World** | Particle emitter memory leaks | Always destroy emitters in cleanup |
| **PixiJS World** | Unoptimized filter stacking | Apply filters sparingly, cull off-screen |
| **Chat Panel** | Emoji picker not lazy-loaded | Use React.lazy() |
| **Sound Design** | Sound effect overload | Throttle concurrent sounds, prioritize |
| **All Phases** | Bundling entire icon library | Import specific icons only |
| **All Phases** | Font loading blocking render | Import specific weights only |

---

## Pre-Implementation Checklist

Before starting each phase, review these questions:

**Design System:**
- [ ] Using native Tailwind backdrop-blur (NOT plugins)?
- [ ] Importing only used font weights?
- [ ] Color utilities use colord (NOT polished)?

**HUD Components:**
- [ ] Icons imported individually (NOT import *)?
- [ ] Simple animations use Tailwind (NOT framer-motion)?
- [ ] Animation variants defined outside render?

**PixiJS World:**
- [ ] Particle emitters destroyed in cleanup?
- [ ] Filters applied only to visible sprites?
- [ ] Emitter pooling for repeated effects?

**Chat Panel:**
- [ ] Emoji picker lazy-loaded with React.lazy()?
- [ ] Suspense fallback provided?

**Sound Design:**
- [ ] Sound sprites used (NOT individual files)?
- [ ] Concurrent sound throttling implemented?
- [ ] Global UI sound mute toggle exists?

---

## Recovery Strategies

If you hit a critical pitfall:

**Pitfall 1 (Glassmorphism Plugin):**
1. `npm uninstall tailwindcss-glassmorphism`
2. Replace plugin classes with native Tailwind
3. Test all glass components

**Pitfall 2 (React + PixiJS Mixing):**
1. Extract React components from PixiJS canvas
2. Create separate React UI layer (absolute positioned)
3. Use Zustand for state sync (not props drilling)
4. Rewrite may take 2-3 days

**Pitfall 3 (Memory Leaks):**
1. Audit all `new Emitter()` calls
2. Add `destroy()` in cleanup functions
3. Implement emitter pooling
4. Monitor memory with DevTools

**Pitfall 4 (Bundle Bloat):**
1. Run `npm run build` and check `dist/` size
2. Use `rollup-plugin-visualizer` to find large chunks
3. Refactor imports to tree-shake
4. Lazy-load heavy components

**Pitfall 5 (Font Blocking):**
1. Remove generic `@fontsource/inter` import
2. Import specific weights (`/400.css`, `/600.css`)
3. Add `font-display: swap` if not already present
4. Preload critical fonts in `index.html`

---

## Sources

- [Tailwind Backdrop Blur Docs](https://tailwindcss.com/docs/backdrop-blur)
- [PixiJS Performance Guide](https://pixijs.com/8.x/guides/components/scene-objects/particle-container)
- [framer-motion Best Practices](https://www.framer.com/motion/layout-animations/)
- [@pixi/particle-emitter Memory Management](https://github.com/pixijs-userland/particle-emitter#cleanup)
- [React.lazy() Guide](https://react.dev/reference/react/lazy)
- [use-sound Audio Sprites](https://github.com/joshwcomeau/use-sound#sprite)
- [lucide-react Tree Shaking](https://lucide.dev/guide/packages/lucide-react)
- [Fontsource Weight Import](https://fontsource.org/docs/getting-started/install)
- Talk Space existing codebase patterns (plan.md, CLAUDE.md)
