# Phase 2: Authentication & Lobby Redesign - Research

**Researched:** 2026-02-17
**Domain:** Authentication UX, form validation, animated backgrounds, React transitions
**Confidence:** HIGH

## Summary

Phase 2 transforms the basic auth forms from Phase 1 into a cinematic first impression by combining authentication infrastructure (already built) with modern UI patterns. The technical foundation exists (Prisma User/Session models, JWT auth, bcrypt, validation), so implementation focuses on **visual polish and UX animations** using Phase 1's design system components.

The research confirms glassmorphism is trending in 2026, gradient mesh backgrounds are performant with CSS keyframes (avoid animating backdrop-filter), and React Hook Form + Zod is the standard stack for type-safe form validation. Password strength meters use zxcvbn for scoring. Transitions use framer-motion with AnimatePresence for route changes. Skeleton loaders improve perceived performance during session restore.

**Primary recommendation:** Build on existing auth backend (no changes needed), replace plain AuthForms.tsx with glassmorphism components using Phase 1's .glass utility, add gradient mesh background with CSS animations, integrate react-hook-form + zod for validation, implement password strength meter with zxcvbn, add framer-motion transitions, and create Lobby component with live online count via Socket.io.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.66.0+ | Form state management | Performance-first (274 code snippets in Context7, 91.5 score), minimal re-renders, excellent TypeScript support, standard for React forms in 2026 |
| zod | 3.24.2 or 4.0.1+ | Schema validation | TypeScript-first validation (552 snippets, 92.7 score), type inference, integrates with react-hook-form via @hookform/resolvers |
| @hookform/resolvers | Latest | RHF + Zod integration | Official adapter for validation library integration |
| framer-motion | Latest | Page transitions & animations | Production-ready animation library, AnimatePresence handles route transitions, supports fade/scale/zoom with exit animations |
| zxcvbn | 4.4.2+ | Password strength estimation | Dropbox's password strength library, industry standard, realistic scoring based on dictionaries and patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-loading-skeleton | Latest | Skeleton loading screens | Session restore loading state, improves perceived performance, shimmer animation out-of-box |
| colord | Already installed | Color manipulation | Generate gradient colors programmatically if needed (already in Phase 1 dependencies) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form + zod | Formik + Yup | Formik is older, more re-renders, Yup less TypeScript-friendly. React Hook Form is current standard. |
| framer-motion | React Spring | React Spring is more complex API, Framer Motion more declarative and easier for route transitions |
| zxcvbn | Custom regex checks | Custom validation misses dictionary attacks, common passwords, l33t speak. zxcvbn is battle-tested. |

**Installation:**
\`\`\`bash
# Client
cd client
npm install react-hook-form zod @hookform/resolvers framer-motion zxcvbn
npm install --save-dev @types/zxcvbn

# Server (no new dependencies — auth backend already complete)
\`\`\`

## Architecture Patterns

### Recommended Project Structure
\`\`\`
client/src/
├── components/
│   ├── AuthForms.tsx           # Replace with glassmorphism + animated gradient
│   ├── Lobby.tsx               # NEW: Post-auth lobby with "Enter Space" button
│   ├── GradientBackground.tsx  # NEW: Animated gradient mesh background component
│   ├── PasswordStrengthMeter.tsx  # NEW: Visual password strength indicator
│   └── ui/                     # Phase 1 components (Button, Input, Card, Toast, Badge)
├── services/
│   └── auth.ts                 # Already exists, handles login/register/refresh
├── schemas/
│   └── auth.ts                 # NEW: Zod schemas for login/register validation
└── animations/
    └── transitions.ts          # NEW: Framer Motion variants (fade, scale, zoom)

server/src/
├── routes/
│   └── auth.ts                 # Already complete (register, login, refresh, logout)
├── lib/
│   ├── auth.ts                 # Already complete (JWT, bcrypt)
│   └── validation.ts           # Already complete (email, username, password)
└── managers/
    └── UserManager.ts          # Already tracks online users for Socket.io
\`\`\`

### Pattern 1: React Hook Form + Zod Integration

**What:** Controller component wraps custom Input component, Zod schema validates on blur
**When to use:** All form inputs with validation requirements
**Example:**
\`\`\`tsx
// Source: Context7 /react-hook-form/react-hook-form
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './ui/Input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur (matches requirement)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            type="email"
            label="Email"
            error={fieldState.error?.message}
            validation={fieldState.error ? 'error' : undefined}
          />
        )}
      />
      {/* ... */}
    </form>
  );
}
\`\`\`

### Pattern 2: Gradient Mesh Background Animation

**What:** CSS-only gradient animation using multiple radial gradients with keyframes
**When to use:** Auth page background (indigo/purple/blue shifting colors)
**Example:**
\`\`\`css
/* Source: WebSearch — CSS gradient mesh 2026 techniques */
@keyframes meshGradient {
  0%, 100% {
    background-position: 0% 50%, 100% 50%, 50% 0%;
  }
  50% {
    background-position: 100% 50%, 0% 50%, 50% 100%;
  }
}

.gradient-mesh {
  background:
    radial-gradient(circle at 20% 20%, #6366f1 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%),
    #1e1b4b;
  background-size: 200% 200%, 200% 200%, 200% 200%;
  animation: meshGradient 15s ease-in-out infinite;
}
\`\`\`

**CRITICAL:** Do NOT animate backdrop-filter — it's GPU-intensive and causes jank. Animate background-position instead (most performant).

### Pattern 3: Form Shake Animation on Error

**What:** CSS animation that moves form horizontally on validation error
**When to use:** Submit validation fails, show shake + red glow + toast
**Example:**
\`\`\`css
/* Source: WebSearch — form shake animation 2026 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

.form-shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
\`\`\`

**JavaScript trigger:** Add class on error, remove after animationend event fires (must remove or animation won't re-trigger).

### Pattern 4: Framer Motion Route Transitions

**What:** AnimatePresence with motion.div for fade/scale between auth → lobby → game
**When to use:** Page transitions (auth to lobby, lobby to game space)
**Example:**
\`\`\`tsx
// Source: WebSearch — framer-motion route transitions 2026
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 },
};

function App() {
  return (
    <AnimatePresence mode="wait">
      {showAuth && (
        <motion.div
          key="auth"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <AuthForms />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
\`\`\`

### Pattern 5: Password Strength Meter with zxcvbn

**What:** Real-time password scoring (0-4) with visual bar and feedback text
**When to use:** Register form only, updates on password input change
**Example:**
\`\`\`tsx
// Source: WebSearch — password strength meter React 2026
import zxcvbn from 'zxcvbn';

function PasswordStrengthMeter({ password }: { password: string }) {
  const result = zxcvbn(password);
  const score = result.score; // 0-4

  const colors = ['#ef4444', '#f59e0b', '#fbbf24', '#10b981', '#059669'];
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  return (
    <div className="mt-1">
      <div className="h-1 w-full bg-surface-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: \`\${(score + 1) * 20}%\`,
            backgroundColor: colors[score],
          }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
    </div>
  );
}
\`\`\`

### Pattern 6: Skeleton Loading for Session Restore

**What:** Show skeleton UI while verifying stored tokens on page load
**When to use:** App initialization, before rendering auth forms or lobby
**Example:**
\`\`\`tsx
// Source: WebSearch — skeleton loading React 2026
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function LoadingSkeleton() {
  return (
    <div className="glass p-8 rounded-lg w-96">
      <Skeleton height={40} width={200} className="mb-6" />
      <Skeleton height={48} count={3} className="mb-4" />
      <Skeleton height={48} width="100%" />
    </div>
  );
}
\`\`\`

### Pattern 7: JWT Refresh Token Auto-Retry

**What:** Intercept 401 responses, attempt token refresh, retry original request
**When to use:** All authenticated API calls (already partially implemented in auth.ts)
**Example:**
\`\`\`typescript
// Source: Context7 /auth0/node-jsonwebtoken
async function apiRequest(endpoint: string, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  let response = await fetch(\`/api\${endpoint}\`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': \`Bearer \${accessToken}\`,
    },
  });

  if (response.status === 401) {
    // Token expired, refresh
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshResponse.ok) {
      const { accessToken: newToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', newToken);
      // Retry original request
      return apiRequest(endpoint, options);
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/';
    }
  }

  return response.json();
}
\`\`\`

### Anti-Patterns to Avoid

- **Animating backdrop-filter:** Causes GPU jank. Animate background-position or opacity instead.
- **Validating on every keystroke:** Causes jarring UX. Validate on blur for inline feedback, on submit for final check.
- **Storing JWT in localStorage without XSS protection:** Use httpOnly cookies for refresh tokens if possible, or accept XSS risk with localStorage (common trade-off for SPA + Socket.io).
- **Password strength meter showing on login:** Only show on register — login doesn't need strength validation.
- **Not removing animation classes after completion:** Animation won't re-trigger. Always listen to animationend and remove class.
- **Using custom password validation regex:** Misses dictionary attacks, common passwords, patterns. Use zxcvbn.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password strength estimation | Regex checks for uppercase/number/special char | zxcvbn library | Custom regex misses dictionary words, common passwords (e.g., "P@ssw0rd" scores high with regex but is weak), l33t speak patterns, keyboard walks (qwerty), repeated characters. zxcvbn analyzes entropy realistically. |
| Form validation state management | useState for each field + manual error tracking | react-hook-form | Manual state causes excessive re-renders, complex error handling, hard to sync validation with UI. React Hook Form uses uncontrolled inputs, minimal re-renders, built-in error state. |
| Schema validation | Manual if/else validation logic | Zod schemas | Hand-rolled validation is verbose, error-prone, hard to maintain. Zod provides type inference, composable schemas, clear error messages, works with RHF. |
| Page transitions | Manual CSS classes + useEffect timers | framer-motion AnimatePresence | Manual transitions are brittle, hard to coordinate mount/unmount timing, no cleanup. AnimatePresence handles lifecycle automatically. |
| Gradient animations | JavaScript-driven canvas/WebGL gradients | CSS keyframes with background-position | JS animations are CPU/GPU intensive, hard to optimize. CSS keyframes are hardware-accelerated, performant, no JavaScript overhead. |

**Key insight:** Authentication UX is deceptively complex — password strength, validation timing, error feedback, session persistence all have edge cases. Use battle-tested libraries (zxcvbn, react-hook-form, zod) rather than custom solutions.

## Common Pitfalls

### Pitfall 1: Animating Glassmorphism Effects

**What goes wrong:** Animating backdrop-filter: blur() causes severe performance issues, stuttering, high GPU usage
**Why it happens:** backdrop-filter forces browser to re-blur background on every frame, expensive operation
**How to avoid:** Only use backdrop-filter for static glassmorphism. For animated glass elements, animate opacity or transform, never backdrop-filter.
**Warning signs:** Choppy animations, high CPU usage in DevTools Performance tab, stuttering on lower-end devices

### Pitfall 2: Validating Forms on Every Keystroke

**What goes wrong:** Error messages flash while user is still typing, jarring UX, user feels rushed
**Why it happens:** Setting react-hook-form mode to 'onChange' triggers validation on every character
**How to avoid:** Use mode: 'onBlur' for inline validation, mode: 'onSubmit' for final validation only. User sees errors after leaving field, not while typing.
**Warning signs:** User complaints about "annoying errors," high bounce rate on register form

### Pitfall 3: Not Handling Token Refresh Edge Cases

**What goes wrong:** User gets logged out mid-session, Socket.io disconnects, data loss
**Why it happens:** Access token expires (15min), refresh attempt fails (network error, expired refresh token), app doesn't handle gracefully
**How to avoid:** Implement retry logic with exponential backoff, show "Reconnecting..." UI during refresh, persist form state locally during auth issues
**Warning signs:** "Why did I get logged out?" user reports, sudden Socket.io disconnections at 15-minute intervals

### Pitfall 4: Password Strength Meter Blocking Submission

**What goes wrong:** User can't submit register form because password meter shows "Weak"
**Why it happens:** Validation rules enforce minimum strength score, but zxcvbn is opinionated (e.g., "correct horse battery staple" scores high, "P@ssw0rd123" scores low)
**How to avoid:** Password strength meter is informational only, not a blocker. Validation should check length (8+) but not zxcvbn score. Let user choose weaker passwords with warning, not prevention.
**Warning signs:** User frustration, "Why won't it let me register?" support tickets

### Pitfall 5: Gradient Mesh Performance on Mobile

**What goes wrong:** Animated gradient background stutters or drains battery on mobile devices
**Why it happens:** Multiple large radial gradients + animation is GPU-intensive, mobile GPUs are weaker
**How to avoid:** Use prefers-reduced-motion to disable animation on mobile, or simplify gradient (fewer stops, smaller radius) for mobile breakpoints
**Warning signs:** Battery drain reports, sluggish auth page on mobile, high GPU usage in Chrome DevTools

### Pitfall 6: Skeleton Loading Disappearing Too Fast

**What goes wrong:** Skeleton flash (appears for 100ms then disappears), jarring instead of smooth
**Why it happens:** Token validation is fast on localhost, skeleton unmounts immediately
**How to avoid:** Add minimum display time (e.g., 300ms) for skeleton, even if token validates faster. Creates smooth transition, not a flash.
**Warning signs:** "Flashing screen on load" bug reports, perceived as glitch rather than loading indicator

### Pitfall 7: Social Auth Buttons Looking Clickable When Disabled

**What goes wrong:** User clicks "Sign in with Google," nothing happens, confusion
**Why it happens:** Disabled button still looks interactive (hover effects, cursor pointer)
**How to avoid:** Clearly style disabled state: reduced opacity, cursor-not-allowed, "Coming Soon" label, optional tooltip explaining feature is planned
**Warning signs:** User clicks repeatedly, "Google login broken?" support tickets

### Pitfall 8: Form Shake Animation Triggering on Every Field Error

**What goes wrong:** Form shakes violently when multiple fields are invalid, nauseating effect
**Why it happens:** Shake animation triggers per-field, multiple invalid fields = multiple simultaneous shakes
**How to avoid:** Shake animation should trigger once per form submission, not per field. Trigger on form-level validation failure, not individual field errors.
**Warning signs:** User reports motion sickness, "form jumping around" complaints

## Code Examples

Verified patterns from official sources:

### JWT Token Generation and Verification (Backend)

\`\`\`typescript
// Source: Context7 /auth0/node-jsonwebtoken
import jwt from 'jsonwebtoken';

// Already implemented in server/src/lib/auth.ts — no changes needed
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const ACCESS_TOKEN_EXPIRY = '15m';

function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function verifyAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('INVALID_TOKEN');
  }
}
\`\`\`

### Bcrypt Password Hashing (Backend)

\`\`\`typescript
// Source: Context7 /kelektiv/node.bcrypt.js
import bcrypt from 'bcrypt';

// Already implemented in server/src/lib/auth.ts — no changes needed
const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
\`\`\`

### Zod Schema with Refinements (Frontend Validation)

\`\`\`typescript
// Source: Context7 /colinhacks/zod
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and hyphen'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Attach error to specific field
});

type RegisterFormData = z.infer<typeof registerSchema>;
\`\`\`

### Glassmorphism Card with Hover (Already Built in Phase 1)

\`\`\`tsx
// Source: Existing client/src/components/ui/Card.tsx — use this component
import { Card } from './ui/Card';

<Card variant="glass" hover className="w-full max-w-md p-8">
  {/* Auth form content */}
</Card>
\`\`\`

### Animated Gradient Background Component (New)

\`\`\`tsx
// NEW: client/src/components/GradientBackground.tsx
export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background: \`
            radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
            #1e1b4b
          \`,
          backgroundSize: '200% 200%',
          animation: 'meshGradient 15s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// Add to tailwind.config.js keyframes:
keyframes: {
  meshGradient: {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
  },
}
\`\`\`

### Framer Motion Page Transitions

\`\`\`tsx
// NEW: client/src/animations/transitions.ts
import { Variants } from 'framer-motion';

export const fadeScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.2 } },
};

export const zoomInVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.2, transition: { duration: 0.3 } },
};

// Usage:
import { motion, AnimatePresence } from 'framer-motion';
import { fadeScaleVariants } from './animations/transitions';

<AnimatePresence mode="wait">
  {currentPage === 'auth' && (
    <motion.div
      key="auth"
      variants={fadeScaleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AuthForms />
    </motion.div>
  )}
</AnimatePresence>
\`\`\`

### Live Online Count Badge (Lobby Component)

\`\`\`tsx
// NEW: client/src/components/Lobby.tsx
import { useEffect, useState } from 'react';
import { Badge } from './ui/Badge';
import { socket } from '../services/socket';

export function Lobby() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    socket.on('onlineCount', (count: number) => setOnlineCount(count));
    socket.emit('getOnlineCount');
    return () => { socket.off('onlineCount'); };
  }, []);

  return (
    <div className="glass p-8 rounded-lg">
      <Badge variant="voice" pulse>
        {onlineCount} online
      </Badge>
      {/* ... rest of lobby UI */}
    </div>
  );
}
\`\`\`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik + Yup for forms | react-hook-form + Zod | 2023-2024 | Better performance (uncontrolled inputs), stronger TypeScript support, simpler API |
| React Spring for animations | Framer Motion | 2022-2023 | More declarative API, better route transitions with AnimatePresence, easier to learn |
| Custom regex for password validation | zxcvbn library | Industry standard since 2012, reinforced 2024+ | Realistic strength estimation vs. naive pattern matching |
| Neomorphism UI trend | Glassmorphism (2026 comeback) | 2021 → 2024-2026 | Frosted glass aesthetic more modern, performant with backdrop-filter browser support |
| localStorage for all tokens | httpOnly cookies for refresh, localStorage for access | Ongoing security discussion | XSS mitigation for refresh tokens, but SPA + Socket.io often requires localStorage trade-off |

**Deprecated/outdated:**
- **Formik:** Still works but heavier, more re-renders than react-hook-form. Community momentum shifted to RHF.
- **Yup:** Less TypeScript-friendly than Zod. Zod's type inference is superior for TS projects.
- **Custom form shake with setTimeout:** Modern approach uses animationend event listener for reliable cleanup.

## Open Questions

1. **Social Auth Implementation Timeline**
   - What we know: Requirements say "placeholder section" with disabled buttons, "coming soon" state
   - What's unclear: Should we prepare OAuth infrastructure (OAuth provider table in Prisma) now or defer to future phase?
   - Recommendation: Add disabled UI buttons with "Coming Soon" tooltips. Do NOT implement OAuth backend yet — Phase 4 Social Layer can add OAuth providers. Keep placeholder visual only to avoid scope creep.

2. **Lobby → Game Space Transition Trigger**
   - What we know: Lobby has "Enter Space" button, should zoom-in transition to PixiJS game canvas
   - What's unclear: Does game canvas initialize on lobby load (hidden) or on button click (lazy init)? Impacts perceived performance.
   - Recommendation: Initialize PixiJS on button click, not on lobby load. Show loading indicator during initialization. Avoids wasting GPU if user doesn't enter immediately.

3. **Session Restore Skeleton Duration**
   - What we know: Should show skeleton loading during token verification
   - What's unclear: Minimum display duration to avoid flash? Token validation is fast on localhost.
   - Recommendation: 300ms minimum skeleton display, even if token validates faster. Prevents jarring flash, makes loading feel intentional.

4. **Mobile Gradient Performance**
   - What we know: Animated gradients can be GPU-intensive on mobile
   - What's unclear: Should gradient animation disable on mobile automatically, or only on prefers-reduced-motion?
   - Recommendation: Disable gradient animation on mobile (max-width: 768px) AND prefers-reduced-motion. Show static gradient on mobile to preserve aesthetic while improving performance.

5. **Password Strength Blocking vs. Warning**
   - What we know: Password strength meter should guide users
   - What's unclear: Should weak passwords be blocked (form won't submit) or warned (form submits with warning)?
   - Recommendation: Warning only, not blocker. zxcvbn is opinionated — let users choose weaker passwords with visible warning. Enforce minimum 8 characters server-side, but don't block based on zxcvbn score.

## Sources

### Primary (HIGH confidence)
- Context7 /auth0/node-jsonwebtoken — JWT authentication patterns, refresh token flow, verification
- Context7 /kelektiv/node.bcrypt.js — Password hashing with bcrypt, salt rounds (12 recommended)
- Context7 /react-hook-form/react-hook-form — Form validation with Controller, useController, mode: 'onBlur'
- Context7 /colinhacks/zod — Schema validation, email/password patterns, refinements, type inference
- Context7 /prisma/docs — User/Session/Account schema models for authentication, one-to-many relations
- Existing codebase analysis — server/src/lib/auth.ts, server/src/routes/auth.ts, server/prisma/schema.prisma all verified complete

### Secondary (MEDIUM confidence)
- [CSS Animated Gradient Examples](https://www.sliderrevolution.com/resources/css-animated-gradient/) — Keyframes for gradient animation, background-position performance
- [Bringing Life to Your Website with Moving Mesh Gradient Backgrounds](https://medium.com/design-bootcamp/bringing-life-to-your-website-with-moving-mesh-gradient-backgrounds-20b7e26844a2) — Mesh gradient design patterns
- [UI Design Trend 2026 #2: Glassmorphism and Liquid Design Make a Comeback](https://medium.com/design-bootcamp/ui-design-trend-2026-2-glassmorphism-and-liquid-design-make-a-comeback-50edb60ca81e) — Glassmorphism in 2026, current status
- [Dark Glassmorphism: The Aesthetic That Will Define UI in 2026](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) — Backdrop-filter performance considerations
- [How To Build a Password Strength Meter in React](https://www.digitalocean.com/community/tutorials/how-to-build-a-password-strength-meter-in-react) — zxcvbn integration patterns
- [Page Transitions in React Router with Framer Motion](https://blog.sethcorker.com/page-transitions-in-react-router-with-framer-motion/) — AnimatePresence route transitions
- [React transitions — Configure Motion animations](https://motion.dev/docs/react-transitions) — Framer Motion official docs
- [Handling React loading states with React Loading Skeleton](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) — Skeleton loading best practices
- [Shake On Invalid Input](https://labex.io/tutorials/shake-on-invalid-input-35237) — Form shake animation with animationend event

### Tertiary (LOW confidence)
- WebSearch results for "social authentication preparation OAuth placeholder buttons disabled state React 2026" — General OAuth integration patterns, but no specific placeholder UI patterns found (appears to be custom implementation detail)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Context7 verified react-hook-form, zod, framer-motion as current standards with extensive documentation
- Architecture: HIGH — Backend auth already complete (verified in codebase), frontend patterns well-documented in Context7 and modern React articles
- Pitfalls: MEDIUM-HIGH — Glassmorphism performance warnings verified across multiple sources, form validation timing from React Hook Form docs, token refresh patterns from Context7

**Research date:** 2026-02-17
**Valid until:** 30 days (stable domain — authentication patterns don't change rapidly, libraries are mature)

**Key unknowns:** Social auth placeholder UI styling (no standard found, appears custom), optimal skeleton loading duration (UX preference), gradient animation mobile breakpoint (performance-dependent).
