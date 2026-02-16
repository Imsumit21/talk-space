# Architecture Patterns - Frontend Overhaul

**Domain:** Proximity-based social platform frontend
**Researched:** February 16, 2026

## Recommended Architecture

### Component Hierarchy

```
App (Zustand providers, framer-motion AnimatePresence)
├── GameCanvas (PixiJS Application)
│   ├── BackgroundLayer (parallax starfield, particles)
│   ├── WorldLayer (avatars, decorations, proximity effects)
│   └── EffectsLayer (post-processing filters, overlays)
│
└── ReactUILayer (absolute positioned over canvas)
    ├── TopHUD (voice controls, settings, user list)
    ├── ChatPanel (lazy loaded emoji picker)
    ├── SettingsModal (glassmorphism, framer-motion)
    └── NotificationToast (sound + animation)
```

### Layer Separation Strategy

**PixiJS Canvas Layer:**
- Handles: Avatar rendering, particles, starfields, proximity effects, world decorations
- Technologies: PixiJS 7, @pixi/particle-emitter, pixi-filters
- Performance: 60fps guaranteed via RequestAnimationFrame loop
- Z-index: 0 (bottom layer)

**React UI Layer:**
- Handles: HUD, modals, chat, settings, notifications
- Technologies: React 18, framer-motion, Tailwind CSS, lucide-react
- Performance: 60fps for animations via hardware-accelerated transforms
- Z-index: 1000+ (top layer)

**Why separate?** React and PixiJS have different render cycles. Mixing them causes re-render hell. Keep PixiJS for game world, React for UI chrome.

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **GameCanvas** | PixiJS application lifecycle, render loop, world state | Zustand store (reads position, proximity state) |
| **BackgroundLayer** | Starfield particles, parallax scrolling, ambient effects | GameCanvas (receives viewport position) |
| **WorldLayer** | Avatar sprites, proximity glows, zone decorations | Zustand store (reads user positions, speaking state) |
| **EffectsLayer** | Post-processing filters (bloom, glow), dynamic effects | WorldLayer (applies filters to avatars) |
| **TopHUD** | Voice controls, settings button, user list button | Zustand store (reads/writes mute state, opens modals) |
| **ChatPanel** | Text input, emoji picker, message history | Zustand store (reads messages), Socket.io (sends messages) |
| **SettingsModal** | Volume controls, device selection, preferences | Zustand store (writes settings), Web Audio API (enumerates devices) |
| **NotificationToast** | Proximity alerts, user joined/left, system messages | Zustand store (reads notification queue), use-sound (plays sounds) |

---

## Data Flow

### Position Updates (Already Implemented)

```
Server (30Hz position broadcast)
  ↓ Socket.io
Zustand store.setPositions()
  ↓
GameCanvas.render() (60fps interpolation)
  ↓
PixiJS WorldLayer (updates sprite positions)
```

**No changes needed.** Existing architecture handles this.

---

### Proximity Detection (Already Implemented)

```
Server (spatial grid detection)
  ↓ Socket.io "proximityEnter" / "proximityLeave"
Zustand store.setProximity()
  ↓
├── GameCanvas.render() (adds glow filter)
└── NotificationToast (plays sound, shows toast)
```

**New additions:**
- `pixi-filters.GlowFilter` applied to avatars in range
- `use-sound` plays proximity-enter.mp3 on event

---

### Voice State Updates (Already Implemented)

```
User clicks mute button
  ↓
TopHUD.handleMute()
  ↓
Zustand store.setMuted()
  ↓
├── mediasoup (pauses audio producer)
├── Socket.io (broadcasts mute state)
└── GameCanvas.render() (shows muted icon over avatar)
```

**New additions:**
- `framer-motion` animates mute button icon
- `use-sound` plays mute-toggle.mp3
- `lucide-react` icons (Mic, MicOff) with animated transitions

---

### UI Modal Management

```
User clicks settings button
  ↓
TopHUD.openSettings()
  ↓
Zustand store.setModalOpen("settings")
  ↓
SettingsModal renders with framer-motion
  ↓
├── Fade in backdrop (glassmorphism overlay)
├── Scale up modal (spring animation)
└── Focus trap enabled (accessibility)
```

**Pattern:**
- Single Zustand modal state: `{ currentModal: "settings" | "userList" | null }`
- `AnimatePresence` handles enter/exit animations
- Escape key + backdrop click close modal

---

## Patterns to Follow

### Pattern 1: Lazy-Loaded Heavy Components

**What:** React.lazy() for large dependencies (emoji picker, sound library)

**When:** Component bundle >50kb OR used infrequently

**Example:**

```typescript
// ChatPanel.tsx
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));

function ChatPanel() {
  const [showPicker, setShowPicker] = useState(false);
  
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        {showPicker && <EmojiPicker onEmojiClick={handleEmoji} />}
      </Suspense>
    </div>
  );
}
```

**Why:** Reduces initial bundle by 80kb. Only loads when user opens emoji picker.

---

### Pattern 2: Hybrid Animation Strategy

**What:** Use Tailwind for simple animations, framer-motion for complex

**When to use Tailwind:**
- Hover effects (opacity, scale)
- Simple enter/exit (fade, slide)
- No gesture interaction

**When to use framer-motion:**
- Layout animations (reordering lists)
- Gesture interactions (drag, swipe)
- Spring physics (bouncy modals)
- Exit animations with cleanup

**Example:**

```typescript
// Simple tooltip - use Tailwind
<div className="opacity-0 hover:opacity-100 transition-opacity">
  Tooltip
</div>

// Complex modal - use framer-motion
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ type: "spring", damping: 20 }}
>
  Modal content
</motion.div>
```

---

### Pattern 3: Tree-Shaken Icon Imports

**What:** Import only used icons from lucide-react

**When:** Always (prevents bundling entire icon library)

**Example:**

```typescript
// ❌ DON'T DO THIS (imports all 1500 icons)
import * as Icons from 'lucide-react';

// ✅ DO THIS (imports only 5 icons)
import { Mic, MicOff, Settings, Users, MessageSquare } from 'lucide-react';

function VoiceControls() {
  return <Mic size={24} strokeWidth={2} />;
}
```

**Why:** Reduces bundle from 500kb to 5kb.

---

### Pattern 4: Particle Emitter Pooling

**What:** Reuse particle emitters instead of creating/destroying

**When:** Dynamic effects (proximity bursts, zone transitions)

**Example:**

```typescript
// ❌ DON'T DO THIS (creates new emitter every time)
function onProximityEnter(userId: string) {
  const emitter = new Emitter(container, proximityBurstConfig);
  emitter.emit = true;
  setTimeout(() => emitter.destroy(), 2000);
}

// ✅ DO THIS (reuse pooled emitter)
const emitterPool = new Map<string, Emitter>();

function onProximityEnter(userId: string) {
  let emitter = emitterPool.get('proximityBurst');
  if (!emitter) {
    emitter = new Emitter(container, proximityBurstConfig);
    emitterPool.set('proximityBurst', emitter);
  }
  emitter.resetPositionTracking();
  emitter.emit = true;
  setTimeout(() => emitter.emit = false, 2000);
}
```

**Why:** Prevents GC churn, maintains 60fps during rapid proximity changes.

---

### Pattern 5: Sound Sprite Organization

**What:** Combine multiple UI sounds into single audio sprite file

**When:** Always (reduces network requests, faster loading)

**Example:**

```typescript
// sounds/ui-sprite.mp3 contains:
// 0-100ms: button click
// 200-700ms: notification ding
// 800-2000ms: proximity enter
// 2100-3000ms: mute toggle

const [playClick] = useSound('/sounds/ui-sprite.mp3', {
  sprite: {
    click: [0, 100],
    notify: [200, 500],
    proximityEnter: [800, 1200],
    muteToggle: [2100, 900],
  },
});

// Usage
<button onClick={() => playClick({ id: 'click' })}>
  Click me
</button>
```

**Why:** Single 50kb MP3 vs 4x 15kb files. Faster load, fewer requests.

---

### Pattern 6: Glassmorphism Utility Pattern

**What:** Tailwind utility classes for glassmorphism (no plugin needed)

**When:** Any glass panel, modal, overlay

**Example:**

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      },
    },
  },
};

// Component
<div className="
  bg-white/10 
  backdrop-blur-md 
  backdrop-saturate-150 
  border border-white/20 
  rounded-2xl 
  shadow-2xl
">
  Glass panel content
</div>
```

**Why:** Native Tailwind 3.x has backdrop-blur. No plugin needed. Fewer dependencies.

---

### Pattern 7: Color Utility Composition

**What:** Use colord for dynamic color generation (proximity gradients, avatar colors)

**When:** Need to programmatically manipulate colors (lighten, darken, mix, alpha)

**Example:**

```typescript
import { colord } from 'colord';

// Generate proximity glow gradient based on distance
function getProximityGlow(distance: number, maxDistance: number): string {
  const ratio = 1 - (distance / maxDistance); // 0 (far) to 1 (close)
  const baseColor = colord('#4F46E5'); // Indigo
  return baseColor
    .alpha(ratio * 0.8) // Fade based on distance
    .lighten(ratio * 0.2) // Brighten when close
    .toRgbString();
}

// Generate avatar color from user ID (deterministic)
function getAvatarColor(userId: string): string {
  const hue = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  return colord({ h: hue, s: 70, l: 60 }).toHex();
}
```

**Why:** Immutable API, LAB color space mixing (better than RGB), tiny bundle (1.7kb).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Rendering React Inside PixiJS

**What:** Using react-pixi or rendering React components inside PixiJS canvas

**Why bad:** React reconciliation conflicts with PixiJS render loop. Performance issues, re-render hell.

**Instead:** Keep PixiJS and React separate. PixiJS for world, React for UI chrome.

---

### Anti-Pattern 2: Creating Animation Variants Inline

**What:** Defining framer-motion variants inside render function

**Why bad:** New object every render, breaks React.memo, poor performance

**Example:**

```typescript
// ❌ DON'T DO THIS
function Modal() {
  return (
    <motion.div
      initial={{ opacity: 0 }} // New object every render
      animate={{ opacity: 1 }}
    >
      ...
    </motion.div>
  );
}

// ✅ DO THIS
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

function Modal() {
  return (
    <motion.div variants={modalVariants} initial="hidden" animate="visible">
      ...
    </motion.div>
  );
}
```

---

### Anti-Pattern 3: Particle Emitter Memory Leaks

**What:** Creating particle emitters without destroying them

**Why bad:** Memory grows unbounded, FPS degrades over time

**Instead:** Always call `emitter.destroy()` when component unmounts or effect ends

```typescript
useEffect(() => {
  const emitter = new Emitter(container, config);
  emitter.emit = true;
  
  return () => {
    emitter.destroy(); // CRITICAL: cleanup
  };
}, []);
```

---

### Anti-Pattern 4: Synchronous Font Loading

**What:** Importing all font weights upfront

**Why bad:** Blocks initial render, large bundle

**Instead:** Import only weights used, lazy-load display font

```typescript
// ❌ DON'T DO THIS
import "@fontsource/inter"; // Loads all weights (400-900)

// ✅ DO THIS
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
// Only loads weights 400 and 600
```

---

### Anti-Pattern 5: Over-Using framer-motion

**What:** Using framer-motion for simple hover effects

**Why bad:** Adds JS overhead when CSS is sufficient

**Instead:** Use Tailwind for simple transitions, framer-motion for complex

```typescript
// ❌ DON'T DO THIS (JS overhead for simple hover)
<motion.button whileHover={{ scale: 1.05 }}>Click</motion.button>

// ✅ DO THIS (pure CSS, faster)
<button className="hover:scale-105 transition-transform">Click</button>
```

---

## Scalability Considerations

| Concern | At 10 users | At 100 users | At 1000 users |
|---------|-------------|--------------|---------------|
| **PixiJS rendering** | 60fps easy | 60fps with ParticleContainer | Cull off-screen avatars, limit particle count |
| **Proximity particles** | Burst per user | Burst pooling required | Limit to nearest 5 users only |
| **Glow filters** | All users glow | Apply to on-screen only | Spatial grid culling |
| **User list panel** | Show all | Virtualized list | Paginate or proximity-sorted |
| **Chat history** | Full history | Limit to 100 messages | Windowed rendering |
| **Sound effects** | Play all | Throttle to 3 concurrent | Prioritize proximity sounds, drop UI sounds |

---

## Sources

- [ParticleContainer - PixiJS v8](https://pixijs.com/blog/particlecontainer-v8)
- [Framer Motion Best Practices](https://www.framer.com/motion/layout-animations/)
- [PixiJS Performance Tips](https://pixijs.com/8.x/guides/components/scene-objects/particle-container)
- [React.lazy() Official Docs](https://react.dev/reference/react/lazy)
- [use-sound API](https://github.com/joshwcomeau/use-sound)
- [Tailwind Backdrop Blur](https://tailwindcss.com/docs/backdrop-blur)
- [colord Documentation](https://colord.omgovich.ru/)
