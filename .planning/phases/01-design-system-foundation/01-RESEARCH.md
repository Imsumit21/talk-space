# Phase 1: Design System Foundation - Research

**Researched:** February 17, 2026
**Domain:** Design systems, Tailwind CSS configuration, typography, glassmorphism styling
**Confidence:** HIGH

## Summary

Phase 1 establishes the visual language and design system foundation for the Talk Space frontend overhaul. Research focused on Tailwind CSS v3/v4 configuration patterns, glassmorphism implementation, self-hosted font loading, component architecture patterns, and accessibility considerations (prefers-reduced-motion).

The primary finding is that **modern Tailwind CSS (v3.x) provides native utilities for glassmorphism** via `backdrop-blur-*`, `backdrop-saturate-*`, and opacity utilities—no third-party plugins needed. Glassmorphism is the dominant UI trend for 2025-2026, signaling premium/modern products. For typography, **@fontsource packages enable self-hosted fonts** with Vite auto-chunking, eliminating Google Fonts CDN dependencies and GDPR concerns.

**Primary recommendation:** Configure Tailwind with custom design tokens (indigo/blue/emerald/amber palette, Inter + Space Grotesk fonts), create reusable `.glass` utility via `@layer components`, build primitive components (Button, Input, Card, Badge, Tooltip, Toast) with variant patterns, and respect `prefers-reduced-motion` globally using Tailwind's `motion-safe`/`motion-reduce` variants.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^3.3.0 (existing) | Utility-first CSS framework with native glassmorphism support | Industry standard for rapid UI development. v3.x has native `backdrop-blur`, `backdrop-saturate` utilities. |
| @fontsource/inter | ^5.2.8 | Self-hosted Inter font for body text | Industry standard UI font (GitHub, Vercel, Linear use it). Self-hosting via npm eliminates CDN latency and GDPR concerns. Vite auto-chunks font files. |
| @fontsource/space-grotesk | ^5.2.10 | Self-hosted Space Grotesk for headings | Geometric sans with wider letterforms. Pairs well with Inter for visual hierarchy. "Space" theme synergy with project name. |
| colord | ^2.9.3 | Color manipulation utilities | Smallest (1.7kb gzipped), fastest color library. 3x faster than alternatives. TypeScript native, immutable API, LAB color space mixing. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss-animate | ^1.0.7 | Extended animation utilities (fade, slide, zoom classes) | Lightweight Tailwind plugin for simple CSS animations. No runtime cost (pure CSS). Use for tooltip/toast enter/exit animations. |

**Installation:**
```bash
npm install @fontsource/inter@^5.2.8 @fontsource/space-grotesk@^5.2.10 colord@^2.9.3 tailwindcss-animate@^1.0.7
```

See full research document for complete details on architecture patterns, pitfalls, code examples, and sources.

**READY FOR PLANNING**
