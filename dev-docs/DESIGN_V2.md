# Design V2: The Architectural Athletic Sanctuary (Phase 1)

## 1. The Design Philosophy
**The Champions Club** is reimagined through the lens of timeless sporting heritage meeting avant-garde modern athletics — blending the prestige of Wimbledon lawn courts and Roland Garros red clay with modern illuminated padel arenas.

Every surface evokes physical athletics:
- **Court Geometry & Chalk Lines**: Pure CSS/SVG boundary lines, service boxes, and subtle angled grid lines.
- **Physical Materials**: Clay court terracotta grain, lush midnight-forest lawn weave, taut net-mesh patterns, and warm brushed brass metal trims.
- **Nocturnal Floodlit Drama**: Deep night tones (`#070B12`, `#0D1522`) accented by glowing emerald and phosphor-court illumination.

---

## 2. Color Palette & Semantic Tokens

### Primary Athletic Surfaces
- **Lawn Forest** (`#0D2818` to `#1B4D2E`): Deep English grass, timeless prestige, primary brand anchor.
- **Roland Clay** (`#C85A32` to `#E06A3B`): Crushed terracotta brick dust, warmth, energetic sport accents.
- **Chalk Court** (`#FBFDF9` to `#F4F7F2`): Pristine white court paint, crisp card surfaces, high-contrast borders.
- **Sand & Cream** (`#F7F4EE` to `#EFE9DF`): Classic athletic canvas, heritage tennis sweaters, subtle card backings.
- **Nocturnal Floodlight** (`#070B12` to `#0F172A`): Deep stadium night sky, dark-mode accents, executive lounge backgrounds.
- **Tournament Brass / Trophy Gold** (`#D4AF37`, `#C5832B`, `#B87333`): Championship trophies, active membership seals, VIP honors.

---

## 3. Typography & Numerical Chronography
- **Display Headings**: `Outfit`, weights 600-800, geometric, architectural, high impact.
- **Body & Controls**: `Plus Jakarta Sans`, crisp clarity, balanced tracking, legible under high data density.
- **Chronograph & Scoreboard**: `font-mono tabular-nums`, precise digit alignment for slot times, prices, and court numbers.

---

## 4. The Signature Moment: "The Service Line Frame"
- A signature decorative motif: subtle SVG vector court markings (baseline, service line, center service notch, and net mesh overlay) woven into headers, hero cards, and digital membership badges.
- Built 100% in pure inline SVG code — zero external image dependencies, zero layout shift.

---

## 5. Motion System: "Athletic Snap"
- **Primary Timing Function**: `cubic-bezier(0.16, 1, 0.3, 1)` (the "racket impact snap" — fast initial burst with silky smooth settling).
- **Duration Scale**:
  - Micro-interactions (hover, active, toggle): `120ms` to `180ms`
  - Modal reveals, card elevations: `220ms` to `280ms`
  - Ambient glow / court pulse: `3s` to `5s` infinite ease-in-out
- **Reduced Motion**: Gracefully disables all transforms and pulses via `@media (prefers-reduced-motion: reduce)` leaving static, high-contrast states.
