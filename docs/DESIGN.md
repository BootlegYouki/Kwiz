# Kwiz — Design System

> Visual style reference for all UI decisions across Mobile and Desktop.

---

## Scope

**Mobile** — this document is the full design authority. All new screens and components follow the rules here.

**Desktop** — the codebase is BootHub-Desktop. It already has its own design system (Tauri + React + Tailwind). No redesign. Only document new Kwiz-specific screens here if they introduce patterns that don't exist in BootHub yet.

---

## Philosophy

The design is **TUI-inspired**, not TUI-literal. The visual structure borrows from terminal UIs — sharp edges, monospace type, high contrast — but the app feels like a product, not a dev tool.

**The one rule:** If it looks like it belongs in a hacker movie, cut it.

---

## Typography

Single font across the entire app.

| Role | Font | Weight |
|---|---|---|
| Everything | JetBrains Mono | 400 Regular, 700 Bold |

No system fonts. No fallbacks shown to the user. Font must be loaded before the app renders.

### Text sizes (`TuiText` size prop)

| Name | Usage |
|---|---|
| `xs` | Captions, timestamps, fine print |
| `sm` | Badges, secondary labels |
| `md` | Body text, button labels (default) |
| `lg` | Section titles |
| `xl` | Screen headings |
| `2xl` / `3xl` | Hero numbers, scores |

---

## Color System

The theme is fully dynamic. `primary` is the user-chosen accent color. All components reference `colors.*` tokens — never hardcoded hex values in components.

### Dark Mode (default)

| Token | Hex | Usage |
|---|---|---|
| `background` | `#18181B` | Screen background |
| `foreground` | `#FAFAFA` | Primary text |
| `card` | `#18181B` | Card / container background |
| `cardForeground` | `#FAFAFA` | Text on cards |
| `primary` | *accent* | Borders, labels, active states |
| `primaryForeground` | `#09090B` | Text on filled primary buttons |
| `secondary` | `#27272A` | Secondary surfaces |
| `secondaryForeground` | `#FAFAFA` | Text on secondary |
| `muted` | `#27272A` | Muted backgrounds |
| `mutedForeground` | `#A1A1AA` | Placeholder text, subtitles |
| `border` | `#27272A` | Structural borders |
| `input` | `#27272A` | Input field backgrounds |
| `destructive` | `#EF4444` | Delete, error states |

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `background` | `#F4F4F5` | Screen background |
| `foreground` | `#09090B` | Primary text |
| `card` | `#F4F4F5` | Card / container background |
| `primary` | *accent* | Borders, labels, active states |
| `primaryForeground` | `#FFFFFF` | Text on filled primary buttons |
| `secondary` | `#E4E4E7` | Secondary surfaces |
| `mutedForeground` | `#71717A` | Placeholder text, subtitles |
| `border` | `#000000` | Structural borders |
| `input` | `#FFFFFF` | Input field backgrounds |
| `destructive` | `#EF4444` | Delete, error states |

### Accent Themes

The user picks an accent color. `primary` resolves to one of these:

| Name | Dark | Light |
|---|---|---|
| Classic | `#FFFFFF` | `#000000` |
| Gray | `#71717A` | `#71717A` |
| Amber | `#F59E0B` | `#D97706` |
| Green | `#10B981` | `#059669` |
| Rose | `#F43F5E` | `#E11D48` |
| Cobalt | `#3B82F6` | `#2563EB` |

---

## Borders & Shape

No border radius anywhere. Every element is sharp-cornered.

| Element | Border width | Color |
|---|---|---|
| Container (default) | `1.5px` | `primary + '40'` (dark) / `primary + '30'` (light) |
| Container (accent) | `1.5px` | `primary` |
| Button | `1.5px` | depends on variant |
| Input | `1.5px` | `primary` when focused, muted when idle |
| Header bottom | `1.5px` | `primary` |
| Badge | `1px` | `primary` |

Containers use a **legend border** — the top border is split so the label sits inside the gap, flush with the top edge. This is a segmented absolute-position technique, not a native `fieldset`.

---

## Components

### TuiContainer

A bordered section card with a floating label on the top-left edge.

- **Label**: Bold, `primary` color, sits in a gap in the top border. Plain title-case text — no brackets, no caps.
- **Badge** (optional): Small bordered chip to the right of the label. Tappable if `onBadgePress` is provided.
- **`accentBorder`**: When true, border is full `primary` instead of faded.
- Content lives below the label, padded inside.

### TuiButton

Full-width button, four variants:

| Variant | Idle bg | Idle border | Idle text | Pressed |
|---|---|---|---|---|
| `default` | transparent | `primary` | `foreground` | bg fills `primary`, text flips |
| `accent` | `primary` | `primary` | `primaryForeground` | bg clears, text becomes `primary` |
| `outline` | transparent | `primary` | `primary` | bg gets faint `primary` tint |
| `destructive` | `destructive` | `destructive` | white | bg clears, text becomes `destructive` |

Press behavior is inversion — filled becomes outline, outline becomes filled. No opacity fade.

Disabled state: muted bg, muted border, muted text. No press effect.

### TuiHeader

Sticky top bar. Hard bottom border (`1.5px primary`). Contains:
- Optional icon (18px, `primary` color)
- Title (bold, `primary`)
- Optional right element

### TuiInput

Labeled text input with a label above the field.

- Idle: muted border
- Focused: `primary` border
- Multiline supported
- Character counter shown when `maxLength` is set

### TuiDrawer

Bottom sheet that slides up from the bottom edge. Backdrop dims to `rgba(0,0,0,0.6)`. Drag handle at top. Has a title row with a close button. Content is scrollable.

### TuiTabBar

Bottom navigation bar. Items are icon + label. Center item is an action button (FAB-style, filled accent). Animates in on mount with a slide-up from the bottom.

### TuiSkeletonLoader

Full-screen loading state with pulsing placeholder blocks. Matches the shape of the home screen layout.

### TuiText

Typography primitive. Props: `size`, `weight`, `style`. Always JetBrains Mono.

### TuiCheckbox

Square checkbox (no radius). Filled with `primary` when checked. Label to the right.

### TuiSwitch

Toggle switch. Track and thumb use `primary` when on, muted when off.

### TuiCalendar

Month grid date picker. Navigation arrows, day cells. Selected day filled with `primary`.

---

## Spacing

| Context | Value |
|---|---|
| Screen horizontal padding | `16px` |
| Gap between components | `16px` |
| Button vertical padding | `12px` |
| Button horizontal padding | `16px` |
| Container padding | `12px` horizontal, `8px` vertical |
| Header padding | `16px` horizontal, `12px` vertical |

---

## Interaction States

- **Press**: Color inversion — filled becomes outline, outline becomes filled. No opacity fade.
- **Disabled**: Muted colors across bg, border, text. No press response.
- **Focus** (input): Border switches to full `primary`.
- **Loading**: Skeleton pulse replaces content. No spinners.

---

## Do Not

- No border radius
- No gradients
- No drop shadows
- No terminal copy — no "Ready", no ">_", no status codes in UI text
- No brackets around labels
- No all-caps in UI labels or button text
- No spinners — skeleton loaders only
- No hardcoded colors in components — use tokens only
