# anti-slop.md — taste anchors and ban-lists

Depth for the SKILL.md §4 charter. Restraint anchored on production exemplars is the antidote to both flavors of slop.

## 1. Slop tells catalogue

Catalogue informed by Adrian Krebs (500 Show HN sites surveyed Mar 2025), Sailop's Top-10k AI-built sites scan, and ongoing SiteCritic anti-pattern threads.

### Purple-blue gradient

RLHF over-aligns to this; betrays self-generated palette.
```css
background: linear-gradient(135deg, #6366f1, #8b5cf6); /* slop */
```
Counter: pick ONE custom OKLCH accent from the direction's palette, no gradient.

### Inter alone as the type system

Default of every Vercel template; no commitment, no contrast.
```css
font-family: 'Inter', sans-serif; /* slop */
```
Counter: pair a display family with a separate text family, both committed in the direction artifact.

### Centered hero plus 3-column feature grid

The shadcn landing-page silhouette; reads as preset before the eye finishes scanning.
```css
.hero { text-align: center; max-width: 64rem; margin-inline: auto; }
.features { display: grid; grid-template-columns: repeat(3, 1fr); } /* slop */
```
Counter: asymmetric grid with one optical-alignment override; left-aligned hero against a 3-column rhythm.

### Glassmorphism on every surface

Translucence loses meaning when nothing behind it is opaque.
```css
.card { backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.1); } /* slop when global */
```
Counter: glass once, on the surface that earns elevation; everything else opaque.

### `rounded-lg` uniform on every element

Radius without hierarchy is decoration, not signal.
```css
.button, .card, .modal, .input { border-radius: 0.5rem; } /* slop */
```
Counter: tier radius by element role — input 4px, card 8px, modal 16px — and commit the tiers.

### `shadow-md` uniform across the surface

Elevation that conveys nothing about z-order.
```css
.card, .dropdown, .toast { box-shadow: 0 4px 6px rgb(0 0 0 / 0.1); } /* slop */
```
Counter: pick three elevation tiers, named tokens, each tied to a stacking role.

### `transition: all`

Animates layout, color, and transform together; jank guaranteed.
```css
.button { transition: all 200ms ease; } /* slop */
```
Counter: name the properties — `transition: opacity 120ms ease, transform 120ms ease`.

### `font-family: system-ui`

Abdicates the type decision; reads as "did not pick".
```css
body { font-family: system-ui, -apple-system, sans-serif; } /* slop */
```
Counter: commit a webfont stack derived from the direction's taste anchor.

### Default Tailwind palette

The costume of "I used the framework defaults".
```css
.cta { background: theme('colors.blue.500'); color: theme('colors.slate.50'); } /* slop */
```
Counter: derive 4-6 OKLCH swatches from a chosen accent; never reach for `slate-500` or `blue-500`.

### Colored card borders to assert structure

Borders are not the right tool for hierarchy; whitespace is.
```css
.card { border: 1px solid hsl(220 40% 90%); border-left: 4px solid blue; } /* slop */
```
Counter: remove the border, increase the gap; let negative space carry grouping.

### Emoji icons in production UI

Accessibility hostile; locale-fragile; reads as draft.
```html
<button>🚀 Deploy</button> <!-- slop -->
```
Counter: ship a real icon font or SVG sprite (Lucide, Phosphor, Radix Icons).

## 1.5 Slop tests (meta-checks)

Two register-specific tests applied after the slop tell catalogue. Each is a yes/no question the surface must pass before shipping.

### Brand register slop test

If someone could look at this and say "AI made that" without hesitation, it's failed. The bar is distinctiveness — a visitor should ask "how was this made?", not "which AI made this?"

### Product register slop test

Would a user fluent in category's best tools (Linear, Figma, Notion, Raycast, Stripe) sit down and trust this interface, or pause at every subtly-off component?

## 2. Overkill compensation catalogue

Slop in a different flavor — overkill is what happens when the model thinks "less" looks AI and overcorrects to "more".

### Sprites overdose

Decorative SVG sprites filling every empty pixel substituting for missing information density.
```css
.section::before { content: url('sparkle.svg'); }
.section::after { content: url('star.svg'); }
```
Counter: one decorative element per surface, defended; raise text density before adding ornament.

### Gradient on every section

Every section "important" means none are; the eye finds no entry point.
```css
section:nth-child(1) { background: linear-gradient(135deg, #fef, #eef); }
section:nth-child(2) { background: linear-gradient(135deg, #efe, #fee); }
```
Counter: one accent gradient on the surface that earns it; the rest hold flat ground.

### Animation on every element

Motion budget is a budget; spend it once.
```css
* { animation: fadeInUp 600ms ease both; } /* slop */
```
Counter: animate only the focused element on entry; budget total motion in milliseconds and commit.

### Multi-paradigm mash

Neo-brutalism shadow on a glass card on a Material 3 button reads as confusion, not eclecticism.
```css
.card { backdrop-filter: blur(12px); box-shadow: 8px 8px 0 black; border-radius: 28px; } /* three paradigms */
```
Counter: pick one paradigm in the direction commit; defend the choice in the rationale line.

### Decorative noise compensating for a thin idea

When a surface earns its weight, restraint amplifies it; when it does not, decoration cannot rescue it.
```css
.hero::before { background: url('noise.png'); opacity: 0.4; } /* mask for missing proposition */
```
Counter: cut decoration; sharpen the headline; ship the surface or kill it.

## 3. Counter-techniques

1. **Explicit negative prompting with second-order forbids.** Banning Inter alone is not enough; the likely fallback must also be banned, or the model trades one slop tell for another.

   | If banned | Also ban (likely fallback) |
   |---|---|
   | Inter | Space Grotesk, Geist, Manrope |
   | Purple-blue gradient | Pink-orange, teal-cyan gradient |
   | `slate-500` | `zinc-500`, `gray-500`, `neutral-500` |
   | `rounded-lg` uniform | `rounded-xl` uniform, `rounded-2xl` uniform |
   | Glassmorphism global | Neumorphism global, mesh-gradient global |

   **Font reflex-reject list** (snapshot 2026-04-28 from impeccable/brand.md; review yearly when font fashion clearly shifts; treat as second-order reflex-reject — banned by default; pick anyway when the surface has a defensible historical / homage rationale): Fraunces, Newsreader, Lora, Crimson, Crimson Pro, Crimson Text, Playfair Display, Cormorant, Cormorant Garamond, Syne, IBM Plex Mono, IBM Plex Sans, IBM Plex Serif, Space Mono, Space Grotesk, Inter, DM Sans, DM Serif Display, DM Serif Text, Outfit, Plus Jakarta Sans, Instrument Sans, Instrument Serif.

2. **Style anchoring on production exemplars.** Every direction names 1-2 taste anchors from §4 below; vague references ("clean", "modern") underspecify and the model defaults to slop.
3. **Density commitment (2-3x default LLM output).** Vertical rhythm, line-height, and information density tighten 2-3x relative to the model's default. Default LLM output is sparse and air-padded; the sparseness itself reads as slop.
4. **Asymmetric grid (one optical-alignment override per page).** A single deliberate asymmetry — a hero left-aligned where the rest is centered, a sidebar that breaks the column rhythm — prevents the surface from reading as preset.
5. **OKLCH custom palette derivation.** Never the default Tailwind / Material ramp. Derive 4-6 swatches from a chosen accent in OKLCH space, with named lightness steps that match the direction's mood. Lightness ramps in OKLCH are perceptually uniform; HSL ramps are not.
6. **Code-level constraints.** Surface the bans in CSS via property-level lints (`stylelint-no-restricted-syntax`) or DTCG token validators. If a banned value enters tokens, every component inherits the slop.

## 4. Taste anchors with extracted tokens

Twelve exemplars. OKLCH values use `oklch(L C H)` triples where authoritatively observable; unverified positions marked `?` rather than fabricated.

| Exemplar | Primary OKLCH | Accent OKLCH | Heading Type | Body Type | Mono Type | Spacing Base | Signature Trait | Source URL |
|---|---|---|---|---|---|---|---|---|
| Linear | `?` | `?` | Inter Display | Inter Text | `?` | 4px | Velocity-driven density | https://linear.app |
| Stripe | `?` | `?` | Tiempos | Sohne | `?` | 8px | Editorial type accent on transactional UI | https://stripe.com |
| Vercel | `oklch(0 0 0)` | `oklch(1 0 0)` | Geist Sans | Geist Sans | Geist Mono | 4px | Monochrome with razor-edge mono accents | https://vercel.com |
| Read.cv | `?` | `?` | `?` mono | `?` mono | `?` | `?` | Anti-LinkedIn neo-brutalism (rebranded Posts, shut down 2024) | https://read.cv |
| Anthropic | `?` (#141413) | `?` (#faf9f5) | Tiempos Headline | DM Sans | DM Mono | `?` | "Stewardship" register, warm not cold | https://www.anthropic.com |
| Things 3 | `?` (system yellow) | `?` | SF Pro Display | SF Pro Text | SF Mono | 8px | Inherited macOS palette, no custom branding | https://culturedcode.com/things |
| Rosé Pine | `?` | `?` | `?` | `?` | `?` | n/a | TUI-friendly semantic palette (rose / love / gold / pine / foam / iris) | https://rosepinetheme.com |
| Helix editor | `?` | `?` | n/a (TUI) | n/a (TUI) | terminal mono | n/a | Modal editing aesthetic, sparse | https://helix-editor.com |
| lazygit | `?` | `?` | n/a (TUI) | n/a (TUI) | terminal mono | n/a | Dense panel grid for git ops; high-contrast status | https://github.com/jesseduffield/lazygit |
| gh CLI | `?` | `?` | n/a (TUI) | n/a (TUI) | terminal mono | n/a | ANSI-degradation-aware status (green/red/yellow) | https://cli.github.com |
| Radix Colors | `?` | `?` | n/a (system) | n/a (system) | n/a | n/a | 12-step P3-aware ramps (1=app bg, 9=solid, 12=high-contrast text) | https://www.radix-ui.com/colors |
| Fluent 2 | `?` | `?` | Segoe UI Variable | Segoe UI Variable | Cascadia Code | 4px | Luminosity-aware shadows honest with backplate | https://fluent2.microsoft.design |

These are not templates. They are evidence. Read each as "why does this surface feel this way?" and the answer becomes the direction the next design must commit to.
