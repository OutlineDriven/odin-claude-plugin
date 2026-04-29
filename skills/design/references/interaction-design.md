# Interaction design

Cross-runtime interactive-element grammar — states, focus, dropdowns, modals, keyboard navigation. Surface-specific references (`web.md`, `react.md`, `tui.md`, `qt.md`, `desktop.md`) build on this; load this file first when an interaction pattern needs to land correctly across runtimes.

---

## The eight interactive states

Every interactive element needs all eight designed.

| State | When | Visual treatment |
|-------|------|------------------|
| **Default** | At rest | Base styling |
| **Hover** | Pointer over (not touch) | Subtle lift, color shift |
| **Focus** | Keyboard or programmatic focus | Visible ring (see below) |
| **Active** | Being pressed | Pressed in, darker |
| **Disabled** | Not interactive | Reduced opacity, no pointer |
| **Loading** | Processing | Spinner or skeleton |
| **Error** | Invalid state | Red border, icon, message |
| **Success** | Completed | Green check, confirmation |

**The common miss:** designing hover without focus, or vice versa. They are different. Keyboard users never see hover states; touch users never see hover states either (touch fires hover *and* active simultaneously).

---

## Focus rings: do them right

Never `outline: none` without replacement — it is an accessibility violation. Use `:focus-visible` to show the ring only for keyboard users.

```css
button:focus {
  outline: none;
}

button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Focus ring design:**
- High contrast (3:1 minimum against adjacent colors)
- 2–3px thick
- Offset from the element (not inside it)
- Consistent across all interactive elements

---

## Form design: the non-obvious

**Placeholders are not labels.** They disappear on input. Always use a visible `<label>` element.

**Validate on blur, not on every keystroke.** Exception: password strength meters.

**Place errors below fields**, with `aria-describedby` connecting the error message to the input.

---

## Loading states

**Optimistic updates** — show success immediately, roll back on failure. Use for low-stakes actions (likes, follows). Never use for payments or destructive actions.

**Skeleton screens beat spinners.** They preview content shape and feel faster than generic indeterminate spinners.

---

## Modals: the inert approach

Focus trapping in modals used to require complex JavaScript. Now use the `inert` attribute and the native `<dialog>` element.

```html
<main inert>
  <!-- content behind modal can't be focused or clicked -->
</main>
<dialog id="my-dialog">
  <h2>Modal title</h2>
  <!-- focus stays inside -->
</dialog>
```

```javascript
const dialog = document.querySelector('#my-dialog');
dialog.showModal(); // opens as modal with focus trap, closes on Escape
```

The `<dialog>` markup must NOT carry the `open` attribute when `showModal()` will be used — `open` creates a non-modal dialog, and `showModal()` throws if called on an already-open dialog. Use either the attribute (non-modal, no focus trap) or `showModal()` (modal, focus-trapped), never both.

Default-banned: see `anti-slop.md §1.6` "Modal as first thought" — exhaust inline / progressive alternatives before reaching for a modal.

---

## The Popover API

For tooltips, dropdowns, and non-modal overlays, use native popovers.

```html
<button popovertarget="menu">Open menu</button>
<div id="menu" popover>
  <button>Option 1</button>
  <button>Option 2</button>
</div>
```

**What the API gives you for free:** top-layer placement (escapes z-index and overflow), light-dismiss on outside click, automatic focus restoration when the popover closes, no portal needed.

**What you still must wire yourself:** proper ARIA roles for interactive content (`role="menu"` + `role="menuitem"` for menus, `role="listbox"` + `role="option"` for selectors), keyboard navigation between items (arrow keys, Home / End, type-ahead), and `aria-haspopup` / `aria-expanded` on the trigger. The Popover API is infrastructure, not a complete accessible component.

---

## Dropdown and overlay positioning

A dropdown rendered with `position: absolute` inside a container that has `overflow: hidden` or `overflow: auto` will be clipped. This is the single most common dropdown bug in generated code.

### CSS Anchor Positioning

Modern solution — tether an overlay to its trigger without JavaScript.

```css
.trigger {
  anchor-name: --menu-trigger;
}

.dropdown {
  position: fixed;
  position-anchor: --menu-trigger;
  position-area: block-end span-inline-end;
  margin-top: 4px;
}

@position-try --flip-above {
  position-area: block-start span-inline-end;
  margin-bottom: 4px;
}
```

`position: fixed` escapes any `overflow` clipping on ancestors. `@position-try` handles viewport edges. **Browser support:** Chrome 125+, Edge 125+. Firefox and Safari need a fallback.

### Popover + anchor combo

Combining the Popover API with anchor positioning gives stacking, light-dismiss, accessibility, and correct positioning in one pattern. The `popover` attribute places the element in the **top layer**, which sits above all other content regardless of z-index or overflow. No portal needed.

### Portal / teleport pattern

In component frameworks, render the dropdown at the document root and position it with JavaScript.

- **React:** `createPortal(dropdown, document.body)`
- **Vue:** `<Teleport to="body">`
- **Svelte:** mount to `document.body` via portal library

Calculate position from the trigger's `getBoundingClientRect()`, apply `position: fixed` with `top` / `left`. Recalculate on scroll and resize.

### Fixed positioning fallback

For browsers without anchor positioning, `position: fixed` with manual coordinates avoids overflow clipping.

```css
.dropdown {
  position: fixed;
  /* top/left set via JS from trigger's getBoundingClientRect() */
}
```

Check viewport boundaries before rendering. If the dropdown would overflow the bottom, flip above the trigger. If it would overflow the right, align to the trigger's right side.

### Anti-patterns

- **`position: absolute` inside `overflow: hidden`** — the dropdown will be clipped. Use `position: fixed` or the top layer instead.
- **Arbitrary z-index** like `z-index: 9999`. Use a semantic scale: `dropdown (100) → sticky (200) → modal-backdrop (300) → modal (400) → toast (500) → tooltip (600)`.
- **Inline dropdown markup** without an escape hatch from the parent's stacking context. Use `popover` (top layer), a portal, or `position: fixed`.

---

## Destructive actions: undo > confirm

Undo is better than confirmation dialogs — users click through confirmations mindlessly. Remove from UI immediately, show an undo toast, actually delete after the toast expires.

Reserve confirmation dialogs for: truly irreversible actions (account deletion), high-cost actions, batch operations affecting many items.

---

## Keyboard navigation patterns

### Roving tabindex

For component groups (tabs, menu items, radio groups), one item is tabbable; arrow keys move within.

```html
<div role="tablist">
  <button role="tab" tabindex="0">Tab 1</button>
  <button role="tab" tabindex="-1">Tab 2</button>
  <button role="tab" tabindex="-1">Tab 3</button>
</div>
```

Arrow keys move `tabindex="0"` between items. Tab moves to the next component entirely.

### Skip links

Provide skip links (`<a href="#main-content">Skip to main content</a>`) for keyboard users to jump past navigation. Hide off-screen, show on focus.

---

## Gesture discoverability

Swipe-to-delete and similar gestures are invisible. Hint at their existence:

- **Partially reveal** — show the delete button peeking from the edge.
- **Coach marks** — first-use overlay teaching the gesture.
- **Always provide a visible fallback** — a menu with "Delete" so the gesture is an accelerator, not the only path.

Never rely on gestures as the only way to perform an action.

---

**Avoid:** removing focus indicators without alternatives; using placeholder text as labels; touch targets <44×44px; generic error messages; custom controls without ARIA / keyboard support.

**Cross-refs.** See `web.md` for HTML/CSS interaction primitives; `react.md` for React-specific state-management patterns; `motion.md` for state transitions; `anti-slop.md §1.6` for the modal / hero-metric / card-grid bans this reference assumes.
