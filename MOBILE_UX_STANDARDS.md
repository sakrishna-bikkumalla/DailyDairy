# Mobile UX & High-Density Design Standards

**Daily Dairy** employs a "High-Density" (HD) design philosophy to ensure that complex dairy management tasks remain efficient on small screens. Unlike standard responsive design which often hides data, HD design optimizes typography and components to keep data visible and actionable.

## 📐 Core Design Principles

1. **Information Density over Whitespace**: On small viewports, we prioritize the maximum number of visible data points.
2. **One-Tap Actions**: Buttons are reshaped into prominent, full-width blocks or equal-split grids for outdoor/mobile usage.
3. **Adaptive Transformation**: Large data tables are dismantled into card-based grids below the `1024px` breakpoint.

---

## 🎨 Token & Styling Standards

### 1. Typography
We use **Inter** with specialized weights to maintain high legibility at small sizes:
- **Badge Font**: `text-[9px]` or `text-[10px]`, `font-black`, `uppercase`, `tracking-widest`.
- **Address Text**: `text-[11px]`, `leading-snug`, `break-words`.
- **Heading Tracking**: All secondary headings use `tracking-tighter` or `tracking-widest` to define hierarchy without extra vertical space.

### 2. Glassmorphism & Depth
To minimize visual clutter in "Dark Mode":
- **Panels**: `bg-slate-900/40` with subtle `border-slate-800`.
- **Gradients**: Dairy thematic gradients (e.g., `from-dairy-green-600 to-dairy-green-400`) for primary progress indicators.
- **Accents**: High-contrast amber (`text-amber-400`) for pending items and red (`text-red-400`) for skipped tasks.

---

## 🧩 Component Optimizations

### Adaptive Manifest Cards
On mobile, manifests transition from tables to HD cards.
- **Top Row**: Customer Name / Primary Status.
- **Middle Row**: Address (limited to 2 lines with `line-clamp-2`).
- **Footer**: Quantity and fulfillment-specific metadata.

### Full-Width Primary Actions
In the Agent and Customer Request flows, the primary confirmation button (e.g., "MARK AS DONE") is always **full-width**. This provides a target area of at least `48px` to ensure accidental misses are minimized during field operations.

### Compact Progress Bars
The `DeliveryProgressBar` component supports a `compact` prop which:
- Reduces vertical padding.
- Shrinks the progress percentage font size.
- Tightens the sub-label spacing.
