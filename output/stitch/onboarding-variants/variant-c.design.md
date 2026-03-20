```markdown
# Design System Strategy: Sport-Luxury Precision

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The High-Performance Instrument."** 

Unlike generic wellness apps that rely on soft pastels and rounded "bubbly" buttons, this system adopts the cold, calculated precision of a luxury chronograph or a high-end racing yacht. It is built for the "Outtcast"—the individual who values private excellence over public validation. 

To break the "template" look, we employ **Intentional Asymmetry**. Hero sections should feature oversized `display-lg` typography in Cormorant Garamond, often overlapping onto `surface-container` modular cards to create a sense of editorial depth. We move away from the "centered-everything" web standard in favor of a left-weighted, technical layout that feels like a professional telemetry dashboard.

---

## 2. Colors: The Mineral Palette
The color strategy mimics the cold, solid feel of minerals—graphite, steel, and cobalt. 

*   **Primary (`#0040E0` / `#2E5BFF`):** Used sparingly as a "kinetic" accent. It represents action, data pips, and active states.
*   **Secondary Steel-Teal (`#346666`):** The grounding force. Use this for supportive data visualizations or secondary utility actions.
*   **Tertiary Champagne (`#F1E5D1`):** A rare, "elevated" token. Reserved for milestone achievements or premium insights. If it appears more than once on a screen, it is being overused.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** 
Structure must be defined through tonal shifts. A `surface-container-low` section sitting against a `surface` background provides all the definition a high-end interface requires. If the eye cannot see the transition, increase the contrast between container tiers, do not reach for a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of mineral slabs. 
1.  **Base:** `surface` (#FCF8F9)
2.  **Sectioning:** `surface-container-low` (#F6F3F4)
3.  **Active Cards:** `surface-container-highest` (#E5E2E3)
4.  **Floating Elements:** `surface-container-lowest` (#FFFFFF) with 4% opacity ambient shadows.

### The "Glass & Gradient" Rule
To inject "soul" into the technical layout, use `primary` to `primary-container` linear gradients (135°) for main CTAs. For floating navigation or overlays, apply `surface-container-lowest` at 80% opacity with a `24px` backdrop blur.

---

## 3. Typography: Editorial Authority
The contrast between the serif and sans-serif is the heartbeat of the system.

*   **Signature Editorial (Cormorant Garamond):** Used exclusively for `display` and `headline` scales. This provides the "Luxury" in Sport-Luxury. It should feel like a high-end magazine header.
*   **Functional UI (Manrope):** Used for all `title`, `body`, and `label` scales. Manrope’s semi-geometric build provides the "Sport/Technical" precision.

**Hierarchy Guidance:**
- **The "Power Head":** Pair a `display-md` Cormorant Garamond headline with a `label-sm` Manrope sub-header in all-caps with `0.1rem` letter spacing. 
- **The "Technical Body":** Use `body-md` for standard reading. Ensure line height is generous (1.6) to maintain a "clean" feel.

---

## 4. Elevation & Depth
We convey authority through **Tonal Layering**, not structural scaffolding.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-dim` background creates a natural lift. 
*   **Ambient Shadows:** For floating modals, use a multi-layered shadow: 
    *   `0px 4px 20px rgba(27, 27, 28, 0.04)`
    *   `0px 12px 40px rgba(27, 27, 28, 0.08)`
    *   The shadow must be tinted with `on-surface` (#1B1B1C) to avoid a "muddy" grey look.
*   **The "Ghost Border" Fallback:** If accessibility requires a border (e.g., in high-glare environments), use `outline-variant` at **15% opacity**. This creates a "suggestion" of a boundary rather than a hard cage.

---

## 5. Components

### Buttons (The "Actuator" Style)
*   **Primary:** Cobalt gradient (`primary` to `primary-container`). Roundedness: `md` (0.375rem). No shadow; use a subtle `on-primary` inner glow at the top edge for a tactile, "machined" look.
*   **Secondary:** `surface-container-highest` background with `on-surface` graphite text.
*   **Tertiary:** Ghost style. No background. `primary` text color with an underline that only appears on hover.

### Modular Cards
*   **Style:** Forbid dividers. Separate content using the Spacing Scale (e.g., `spacing-8` between header and body). 
*   **Layout:** Use "Instrument-like" layouts—labels in `label-sm` (all caps) positioned in the top-right corner of cards to act as data metadata.

### Input Fields
*   **Design:** A "Bottom-Line Only" approach or a very subtle `surface-container-high` fill. 
*   **Interaction:** On focus, the bottom border transitions from `outline-variant` to `primary` (2px). The label should shift to `primary` color but maintain its size.

### Performance Chips
*   **Selection:** Use `secondary-container` with `on-secondary-container` text. 
*   **Shape:** `full` roundedness (9999px) to contrast against the `md` roundedness of cards and buttons.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use white space as a structural element. If a screen feels cluttered, increase spacing from `spacing-6` to `spacing-10`.
*   **DO** use Cormorant Garamond for numbers in hero sections (e.g., a "Current Streak" of 45). It looks like a luxury watch face.
*   **DO** utilize `surface-bright` for areas meant to draw the eye without using a loud color.

### Don’t
*   **DON'T** use generic icons. Use thin-stroke (1px or 1.5px) technical icons. Avoid "filled" icons unless it is an active state.
*   **DON'T** use gamification tropes like "Level Up" badges or confetti. Use "Achievement Unlocked" in a formal, champagne-tinted (`tertiary-fixed`) banner.
*   **DON'T** use 100% black. Always use `on-background` (#1B1B1C) for text to maintain the mineral, graphite aesthetic.
*   **DON'T** use "Springy" or "Bouncy" animations. Use "Ease-In-Out" with a duration of 200ms-300ms for a weighted, mechanical feel.