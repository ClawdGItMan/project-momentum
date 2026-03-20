# Design System Strategy: The Digital Atelier

## 1. Overview & Creative North Star
**Creative North Star: The Stoic Sanctuary**
This design system rejects the frantic, dopamine-driven patterns of traditional social apps. Instead, it adopts the persona of a high-end private members' club—quiet, authoritative, and deeply intentional. We move beyond "SaaS-blue" and generic rounded corners to embrace a "Digital Atelier" aesthetic: where atmospheric editorial moments meet a rigorous technical structure.

**The Design Philosophy:**
*   **Asymmetric Sophistication:** Avoid perfectly centered, mirrored layouts. Use off-center typography and overlapping elements to create an editorial, "crafted" feel.
*   **Atmospheric Contrast:** Use expansive whitespace (the "mineral" surfaces) to make high-contrast "Cobalt" actions feel like significant choices, not just buttons.
*   **Ritualistic Flow:** Interactions should feel like a calm ritual. No jarring transitions; use soft fades and staggered entries for content.

## 2. Colors & Surface Logic
The palette is rooted in a "Mineral Contrast" philosophy, moving from the warmth of off-white to the cold precision of graphite.

### Surface Hierarchy & Nesting
We abandon the "flat" web. Depth is created through **Tonal Layering**, mimicking physical sheets of fine paper or frosted glass stacked atop one another.

*   **Base Layer:** `surface` (#f9f9f7). The canvas of the app.
*   **Secondary Layer:** `surface_container_low` (#f4f4f2). Used for large inset sections or background shifts.
*   **Floating Layer:** `surface_container_lowest` (#ffffff). Reserved for high-priority cards or "active" work areas.
*   **Sunken Layer:** `surface_dim` (#dadad8). Used sparingly for footer areas or "archived" content to indicate a lower plane of existence.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define section boundaries. 
*   **The Alternative:** Use color shifts between `surface_container` tiers. If a boundary is functionally required for accessibility, use a **"Ghost Border"**: `outline_variant` at 15% opacity.
*   **Glassmorphism:** For floating navigation or modals, use `surface_container_lowest` at 80% opacity with a `20px` backdrop blur. This creates a "frosted mineral" effect that integrates the UI with the content beneath.

### Signature Accents
*   **The Cobalt Pulse:** `primary` (#00327d) is reserved for the most critical actions. It represents the "energy" of the brand.
*   **Champagne Milestones:** `tertiary_fixed` (#f0e0c8) is a rare highlight. Use it only for premium achievements or "milestone" moments to maintain its sense of exclusivity.

## 3. Typography
The system uses a high-contrast pairing: a serif for "soul" and a sans-serif for "function."

*   **Signature Editorial (Cormorant Garamond/Newsreader):** Use for `display` and `headline` scales. This is our "human" voice. It should feel aspirational and literary.
*   **Technical Precision (Manrope):** Use for `title`, `body`, and `labels`. This provides the "private-club utility"—clean, legible, and authoritative.

**Visual Tension:** Always pair a large `display-lg` headline (Cormorant) with a small, high-tracking `label-md` (Manrope) in all-caps for sub-headers. This tension between old-world elegance and modern technicality defines the brand.

## 4. Elevation & Depth
We eschew "Material" shadows for **Ambient Tonalism**.

*   **Tonal Lift:** Rather than a shadow, a card gains "elevation" by moving from `surface_container` to `surface_container_lowest`.
*   **Ambient Shadows:** When a true float is required (e.g., a floating action button), use a shadow color tinted with the `on_surface` tone:
    *   `box-shadow: 0 12px 40px rgba(26, 28, 27, 0.06);`
*   **The "Deep Focus" Gradient:** Use a subtle radial gradient transitioning from `surface` to `surface_container_low` in the background of hero sections to draw the eye toward the center "editorial moment."

## 5. Components

### Buttons & CTAs
*   **Primary:** Cobalt (#00327d) background, White (#ffffff) text. Shape: `md` (0.375rem). No shadow.
*   **Ghost Action:** No background. `outline_variant` (15% opacity) border. Text in `secondary` (#446273).
*   **Premium Milestone:** `tertiary_fixed` background. Reserved for "Unlock" or "Upgrade" moments.

### Cards & Content Modules
*   **The Rule:** No dividers. Use `1.5` (0.5rem) or `2` (0.7rem) spacing tokens to create grouping.
*   **Atmospheric Header:** A card should often feature a `headline-sm` title in Cormorant Garamond, paired with a small Manrope metric in the top right, creating an asymmetrical "dashboard" look.

### Input Fields
*   **Style:** Minimalist. No containing box. A single-pixel `outline_variant` (30% opacity) bottom border only.
*   **Focus State:** The bottom border transforms into a `primary` (Cobalt) 2px line with a soft `surface_tint` glow.

### Ritual Progress Indicators
Instead of "gamified" progress bars, use "Mineral Meters."
*   **The Meter:** A thin, high-width bar using `surface_container_highest`. The progress fill is `secondary` (Steel-Teal), moving with a slow, eased transition (1000ms+) to emphasize "calm ritual energy."

## 6. Do's and Don'ts

### Do
*   **Do** use extreme vertical whitespace (`16` to `24` tokens) between major sections to let the design breathe.
*   **Do** use asymmetrical image placements—images should feel like gallery pieces, not standard thumbnails.
*   **Do** use `on_surface_variant` (#434653) for secondary text to maintain a soft, low-contrast "calm" atmosphere.

### Don't
*   **Don't** use "Alert Red" or "Warning Orange" unless it is a system-critical error. For gentle nudges, use the Steel-Teal accent.
*   **Don't** use rounded-full "pill" buttons for everything. Stick to the `md` (0.375rem) or `sm` (0.125rem) scale to maintain a sense of architectural structure.
*   **Don't** use generic icons. If icons are required, use ultra-thin (1pt) stroke weights that match the graphite `on_surface` color.
*   **Don't** use 100% black. The "Deep Graphite" (#1a1c1b) is our darkest point, ensuring the "mineral" feel remains soft.