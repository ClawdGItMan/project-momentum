# Design System Specification: The Mineral Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Curator"**

This design system rejects the cluttered, "always-on" anxiety of traditional social media. It is built to feel like a high-end, private-members athletic club—quiet, authoritative, and meticulously curated. We move beyond the "template" look by utilizing intentional asymmetry, expansive negative space, and a "fashion-editorial" typographic hierarchy. 

The experience is defined by **Satin Athleticism**: surfaces should feel like performance fabrics—matte, smooth, and layered. We replace loud gamification with high-precision "snap" interactions, ensuring every movement feels mechanical, expensive, and intentional.

---

## 2. Colors & Materiality
The palette is grounded in mineral tones, moving away from "tech-blue" into a sophisticated range of graphite, cobalt, and steel.

### Color Tokens (Material Design Convention)
*   **Surface Foundation:** `surface: #f8f9ff` (Soft off-white), `on_surface: #0b1c30` (Deep graphite)
*   **Primary Accent:** `primary: #00288e` (Rich cobalt) for high-impact intent.
*   **Secondary Support:** `secondary: #446273` (Steel-teal) for utility and persistence.
*   **Milestone Accent:** `tertiary_fixed: #f3e0ca` (Champagne) reserved strictly for achievement and rare "elevation" moments.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through **Tonal Shifting**. To separate a content block, shift the background from `surface` to `surface_container_low`. 

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of mineral-wash materials. 
*   **Level 0 (Base):** `surface`
*   **Level 1 (Sectioning):** `surface_container_low` (#eff4ff)
*   **Level 2 (In-Page Cards):** `surface_container` (#e5eeff)
*   **Level 3 (Floating/Active):** `surface_container_highest` (#d3e4fe)

### The Glass & Gradient Rule
For modal overlays and floating navigation, use **Glassmorphism**. Apply a backdrop-blur (12px–20px) to `surface_container_low` at 80% opacity. For primary CTAs, apply a subtle linear gradient from `primary` (#00288e) to `primary_container` (#1e40af) to create a "satin" sheen that flat color cannot replicate.

---

## 3. Typography
The system employs a high-contrast pairing: a literary serif for "The Soul" and a precision sans-serif for "The Metric."

*   **Signature Serif (Cormorant Garamond):** Used for `display` and `headline` roles. This font carries the editorial weight. It should be typeset with slightly tighter tracking (-2%) for a premium, "ink-on-paper" feel.
*   **Technical Sans (Manrope):** Used for `title`, `body`, and `label` roles. This font handles the "performance" aspect of the app—data, metrics, and controls.

**Hierarchy Goal:** A `display-lg` headline should feel like a magazine masthead, while `label-sm` technical data should feel like a Swiss watch face.

---

## 4. Elevation & Depth
In this design system, shadows are an admission of failure in tonal layering. 

*   **The Layering Principle:** Depth is achieved by "stacking" container tiers. A `surface_container_lowest` (#ffffff) card sitting on a `surface_container_low` (#eff4ff) background provides all the "lift" required.
*   **Ambient Shadows:** If a floating element (like a FAB or Popover) requires a shadow, use a "Mineral Drift": 
    *   `X: 0, Y: 12, Blur: 32, Spread: -4`
    *   Color: `on_surface` (#0b1c30) at **4% opacity**. It should be felt, not seen.
*   **Ghost Borders:** For accessibility on inputs, use `outline_variant` at **20% opacity**. Never use 100% opaque outlines.

---

## 5. Components

### Buttons: The Performance Toggle
*   **Primary:** Satin gradient (Primary to Primary-Container), `rounded-md` (0.375rem). Text: `label-md` in All-Caps with +5% tracking.
*   **Secondary:** `surface_container_high` background with `on_surface` text. No border.
*   **Tertiary:** Ghost style. `on_surface` text with an underline that only appears on hover.

### Tailored Cards
Cards must never use dividers. Use `spacing-6` (2rem) of internal padding to create "breathing room." Content hierarchy is defined by the switch from Cormorant (Headlines) to Manrope (Data).

### Inputs & Fields
Text inputs use `surface_container_low` backgrounds. The "Active" state is signaled not by a heavy border, but by the label shifting to `primary` (Cobalt) and a 1px `primary` underline.

### Milestone Chips
Reserved for achievements. Use `tertiary_fixed` (#f3e0ca) with `on_tertiary_fixed` (#231a0d) text. These should feel like "stamps" or "seals" of quality.

### Editorial Lists
Avoid "rows." Use `surface_container_low` blocks with `spacing-3` gaps. Each list item is a "slab" rather than a thin line, providing a sense of weight and importance.

---

## 6. Do’s and Don’ts

### Do
*   **Embrace Asymmetry:** Align headlines to the left while placing metrics on the far right "margin."
*   **Use Generous Leading:** Increase line-height for Cormorant Garamond to 1.4x for a relaxed, luxury feel.
*   **Snap Interactions:** UI transitions should be fast (200ms) with a `cubic-bezier(0.2, 1, 0.3, 1)` "athletic snap" easing.

### Don't
*   **No "Wellness" Gradients:** Avoid soft pink-to-purple transitions. We are Mineral, not Pastel.
*   **No Divider Lines:** If you feel the need to draw a line, increase the whitespace (`spacing-8`) or change the background tone instead.
*   **No Standard Icons:** Avoid "filled" chunky icons. Use ultra-thin (1pt or 1.5pt) stroke icons to match the Manrope technical aesthetic.
*   **No Density:** Do not cram information. If the screen feels full, move content to a secondary "Drill-down" layer.