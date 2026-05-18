# Phase 1 — Foundation & Home Page

## What's Built

### Design System (`src/app/globals.css`)
- **Tailwind v4 `@theme` tokens** for the full brand palette:
  - Primary gold `#D89339` with opacity scale (gold-5 through gold-90)
  - Brand blue `#2563D9` + dark variant `#1E4FA8` with opacity scale
  - Cream `#FAF6F0`, Charcoal `#1F1F1F`, Soft gray `#6B6B6B`, Border warm `#E8E2D8`
- **Typography**: `--font-display` (Playfair Display 400/600/700) and `--font-body` (Inter 400/500/600) via `next/font`
- **Fluid type utilities**: `.text-hero` (clamp 2.25rem–5rem), `.text-section-heading` (clamp 1.75rem–2.75rem)
- **shadcn/ui** semantic CSS variables mapped to brand colours

### Animation System (`src/lib/animations.ts`)
5 motion patterns only — no extras:
1. `fadeUp` — opacity 0 + y:40 → visible, 0.7s easeOut
2. `fadeUpScale` — hero-level with scale:0.96, 1s easeOut
3. `cardLift` — hover: y:-6 + gold shadow
4. `tapFeedback` — whileTap scale:0.96
5. `staggerDelay(index)` — delay: index × 0.08

All `whileInView` uses `{ once: true, margin: '-80px' }`.

### Components

**Shared** (`src/components/shared/`):
- `Container` — max-w-7xl responsive padding wrapper
- `SectionHeading` — animated h2 + subtitle + gold divider
- `Reveal` — wraps children with fadeUp
- `BookingButton` — gold filled or blue outline CTA with tap feedback

**Layout** (`src/components/layout/`):
- `Header` — sticky, transparent → solid on scroll, z-50, logo text treatment
- `MobileNav` — full-screen overlay, scroll-lock, hamburger toggle
- `Footer` — 4-column grid, newsletter input (UI only), copyright bar

**Sections** (`src/components/sections/`):
- `Hero` — full-viewport, gradient overlay, Playfair headline, dual CTA, scroll indicator
- `WelcomeStrip` — intro paragraph + 4-stat row (rooms/categories/hall/dining)
- `RoomCategoriesPreview` — 4 responsive cards with rates, cardLift hover, balcony badge
- `AmenitiesGrid` — 8 amenities with lucide icons, stagger reveal, 2→3→4 col grid
- `DiningPreview` — split layout (image + content), T3 Café pitch
- `EventsPreview` — reversed split, configurations table, "Plan Your Event" CTA
- `TestimonialsSection` — 3 seed review cards, gold stars, cream background
- `ContactCTA` — charcoal background, gold border-top, contact info + map placeholder

### Pages
- `layout.tsx` — root layout with fonts, metadata (title template, OG, keywords), Hotel JSON-LD structured data
- `page.tsx` — home page composing all 8 sections

### Configuration
- `next.config.ts` — `images.remotePatterns` for Unsplash
- `tsconfig.json` — strict TypeScript with `@/*` path alias
- `components.json` — shadcn/ui configured

### Types (`src/types/index.ts`)
Defined for future phases: `Room`, `Testimonial`, `Amenity`, `EventConfiguration`, `BanquetInquiry`, `Booking`

---

## What's Deferred to Phase 2+

- `/rooms/[slug]` detail pages with full amenity list, gallery, rate table
- `/dining`, `/events`, `/contact`, `/gallery` pages
- Booking flow (form → Firebase → confirmation)
- Banquet inquiry form
- Admin panel
- Firebase / Razorpay / MSG91 / Resend integrations
- Real logo SVG (currently text treatment)
- Google Maps embed (currently styled placeholder)
- Newsletter form submission logic

---

## Placeholder Content to Swap

| Item | Location | Action |
|------|----------|--------|
| Hero background image | `Hero.tsx` line 16 | Replace Unsplash URL with actual hotel exterior photo |
| Room category images | `src/lib/content.ts` rooms array | Replace 4 Unsplash URLs with real room photos |
| Dining image | `DiningPreview.tsx` line 18 | Replace with T3 Café photo |
| Events image | `EventsPreview.tsx` line 47 | Replace with conference hall photo |
| Testimonials | `src/lib/content.ts` testimonials array | Replace 3 seed reviews with real guest feedback |
| Room sqft values | `src/lib/content.ts` rooms array | Verify actual sqft per category |
| Room rates | `src/lib/content.ts` rooms array | Verify current EP single rates |

---

## Tailwind Design Tokens Reference

Phase 2 can extend these in `globals.css` under `@theme inline`:

```
Brand:       gold, gold-light, blue, blue-dark
Opacity:     gold-{5,10,15,20,30,50,70,90}, blue-{5,10,15,20}
Neutrals:    cream, charcoal, soft-gray, border-warm
Typography:  font-display (Playfair), font-body (Inter)
Utilities:   text-hero, text-section-heading, font-display, font-body
```

To add new colours, add `--color-{name}: value` inside `@theme inline {}`.
To add new semantic variables, add to `:root {}` and map in `@theme inline`.
