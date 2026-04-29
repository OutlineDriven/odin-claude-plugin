# tui.md — terminal UI surfaces

Surface reference for terminal UIs across Go (Bubble Tea), Rust (Ratatui), and Python (Textual). Companion to `references/cli.md` for non-interactive CLIs and `references/anti-slop.md` for slop tells specific to terminal density.

**Snapshot date: April 2026.** Re-verify versions and capability tables before relying on them in production.

## 1. Posture

TUIs are dense by design — terminal real estate is precious. Lean on capability tiers (16-color → 256-color → truecolor) and treat `isDark` as an explicit parameter on theme constructors. Runtime background detection is supported (Bubble Tea v2 ships `tea.RequestBackgroundColor` → `BackgroundColorMsg.IsDark()`), but the result must flow into your token resolver as a value — do not branch on a global "is dark?" query inside individual widgets, and have a fallback for terminals that refuse the query.

Color overdose is the first slop tell on `references/anti-slop.md` §1 — a TUI that paints every glyph in a different accent reads as decoration, not signal. Of the paradigms in `references/paradigms.md`, post-minimalism and neo-brutalism map cleanly to terminal density; glassmorphism and Material 3 Expressive do not — translucency and elevation have no terminal analogue.

## 2. Bubble Tea v2 (Go)

Charm shipped Bubble Tea v2, Lip Gloss v2, and Bubbles v2 stable on **February 23 2026**. The v2 line is the current target for new Go TUIs; v1 is in maintenance.

- **Bubble Tea v2** — ELM-style model/update/view loop with explicit message passing. `View()` now returns a `tea.View` struct rather than a string. Bubble Tea owns I/O (keyboard input, background-color queries via `tea.RequestBackgroundColor`); Lip Gloss is the styling library it drives.
- **Cursed Renderer** — new in v2, ncurses-derived diff renderer; reported ~10× faster than the v1 default renderer on update-heavy frames.
- **Lip Gloss v2** — `Style.Render(s)` still exists, but the renderer concept is gone: `Render()` always emits full-fidelity ANSI, and color downsampling moves to the writer layer (`lipgloss.Println`, `lipgloss.Fprintln`). `AdaptiveColor` is replaced by `lipgloss.LightDark(isDark)` (recommended) or the `compat` package for v1-shaped behaviour.
- **Bubbles v2** — theme-aware widgets accept an explicit `isDark bool` (or a `LightDark` selector) on their style constructors. The recommended migration is `tea.RequestBackgroundColor` in `Init()`, then thread the resulting `IsDark()` through to widget construction in `Update()`.

```go
// Token-derived style — isDark is resolved once (from BackgroundColorMsg.IsDark()
// or a CLI flag) and threaded into the style constructor.
func panelStyle(t Tokens, isDark bool) lipgloss.Style {
    pick := lipgloss.LightDark(isDark) // selector helper, v2-recommended
    return lipgloss.NewStyle().
        Foreground(pick(t.TextLight,    t.TextDark)).
        Background(pick(t.SurfaceLight, t.SurfaceDark)).
        BorderForeground(pick(t.SubtleLight, t.SubtleDark)).
        Border(lipgloss.NormalBorder()).
        Padding(0, 1)
}

// In your model: render with Style.Render(s); print via lipgloss.Println so the
// writer layer downsamples to the terminal's capability tier.
out := panelStyle(tokens, isDark).Render("ready")
lipgloss.Println(out)
```

The `Update(msg) (Model, Cmd)` shape forces every state mutation through the message tape — diffable, replayable, and the right substrate for snapshot testing. Reach for it when the TUI has more than one input source (keys + ticker + network); for a single-shot status print, use `references/cli.md` instead.

```go
// Init kicks the background-color query; Update folds the response back in.
func (m Model) Init() tea.Cmd { return tea.RequestBackgroundColor }

func (m Model) Update(msg tea.Msg) (Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.BackgroundColorMsg:
        m.isDark = msg.IsDark()
    case tea.KeyMsg:
        // ... handle keys
    }
    return m, nil
}
```

The `BackgroundColorMsg` may never arrive (terminal refused, SSH chain ate it) — keep a default `isDark` value and override only on receipt. Precedence order: an explicit user override wins first (`--theme=light|dark` flag), then a project-level env var if the app honours one (e.g. `MYAPP_THEME=dark`), then the protocol-detected `BackgroundColorMsg.IsDark()`, then the conservative default. Cache the resolved bool on the model; do not re-resolve per frame.

## 3. Ratatui 0.30+ (Rust)

Ratatui 0.30 is the current stable line as of April 2026. Immediate-mode TUI: re-render the whole frame each tick. Conceptually inverse to Bubble Tea's retained-mode/ELM loop — there is no model the runtime preserves between frames; the application owns state and re-emits widgets.

- **0.30 workspace split** — single monolithic crate split into `ratatui-core`, `ratatui-widgets`, `ratatui-crossterm`, etc., for compile-time and API-stability reasons.
- **WidgetRef stability** — remains gated behind the `unstable-widget-ref` feature flag in 0.30; some sources describe it as stabilizing in the 0.30.x line, but the upstream API is still marked unstable. Treat as unstable until a 0.30.x point release lifts the flag.

```rust
// Frame::render_widget — the immediate-mode entry point.
fn draw(frame: &mut Frame, state: &State, tier: ColorTier) {
    let border_color = match tier {
        ColorTier::TrueColor => Color::Rgb(196, 167, 231),     // iris
        ColorTier::Indexed256 => Color::Indexed(141),
        ColorTier::Basic16 => Color::Magenta,
    };
    let block = Block::default()
        .borders(Borders::ALL)
        .title("status")
        .border_style(Style::default().fg(border_color));
    frame.render_widget(block, frame.area());
}
```

Capability tiers map to `ratatui::style::Color` variants: `Color::Rgb` for truecolor, `Color::Indexed(u8)` for 256-color, named variants (`Color::Red`, `Color::Magenta`) for the 16-color basic palette. Pick the tier at startup, then pass it through; do not branch per draw call.

Reach for Ratatui when the surface needs deterministic layout (every frame is recomputed from state — no retained-mode drift) and when the host language is already Rust. The cost is shape: every input event is your job to debounce, and there is no message tape unless you build one. Pair with `crossterm` or the new `ratatui-crossterm` crate for the I/O backend.

## 4. Textual (Python)

Textual ships a CSS-like layout system on top of Python and runs against both terminal and web (via Textual Web). Trade-off: dual-target costs some terminal density and ties the surface to Python startup latency, but unlocks one codebase for two delivery surfaces.

- **App / Screen / Widget** — three-level hierarchy; widgets compose into screens, screens stack inside an app. Reactive properties (`reactive[T]`) trigger automatic re-render on assignment.
- **CSS-in-Python** — selectors, pseudo-classes, theme variables (`$primary`, `$surface`), and a subset of CSS properties; not full CSS, but the mental model transfers.
- **Accessibility** — screen-reader status as of April 2026 is uncertain across all three TUI runtimes (Bubble Tea, Ratatui, Textual); do not claim accessibility compliance without testing against the user's reader of choice.

```python
from textual.app import App
from textual.widgets import Button

class Dashboard(App):
    CSS = """
    Button { width: 24; margin: 1 2; background: $primary; }
    Button:hover { background: $primary-lighten-1; }
    """
    def compose(self):
        yield Button("Run", id="run")
```

Reach for Textual when Python is a hard constraint or when terminal+web parity is a real requirement; otherwise Bubble Tea v2 or Ratatui ship denser surfaces with less ceremony.

## 5. Density patterns

Production TUIs to anchor density decisions against. Each maps to a row in `references/anti-slop.md` §4 with extracted tokens.

- **lazygit** — dense panel grid for git operations; multi-pane status with consistent left-aligned action labels and reserved hotkey columns. Trait: every region is interactive; dead pixels are rare. The hotkey legend is always visible — discoverability without a help menu.
- **helix** — modal editor; sparse default, accent-on-mode-change. The status line carries the action context (mode, register, count) instead of decorating the editing area. Trait: the chrome moves so the content can stay still. Selection-as-noun shows up in the status line, not in inline color.
- **gitui** — lazygit-shape layout with selective truecolor accents on diff regions (added/removed/context). Trait: color earns its keep where the eye must scan diffs; elsewhere it is restrained. The diff column is the only place where saturation rises above the muted baseline.

Common rule across all three: borders and inactive labels stay muted; accent tokens fire where the user's eye must land. A TUI that paints separators in saturated colors flattens the priority hierarchy and hides the actionable surface.

## 6. Theme token interface

Token shape for cross-runtime theming — the same logical names should resolve through Lip Gloss styles, Ratatui colors, and Textual CSS variables.

- **isDark — explicit bool threaded into the resolver.** Bubble Tea v2 can ask the terminal (`tea.RequestBackgroundColor` → `BackgroundColorMsg.IsDark()`); Lip Gloss v2 exposes `lipgloss.HasDarkBackground(in, out)`. Resolve once, then pass the bool down. Have a CLI-flag override (e.g. `--theme=light|dark|auto`) — some terminals refuse the query and SSH chains can lose it.
- **Capability tier — 16-color (8 + bright), 256-color (xterm-256), truecolor (24-bit RGB).** Degradation is one-way: truecolor → 256 → 16; never assume `$TERM=xterm-256color` implies truecolor.
- **Semantic role names — borrow Rosé Pine: rose / love / gold / pine / foam / iris / muted / subtle / text.** Avoid product-specific names like "primary" / "secondary" for TUI palettes; semantic-role names survive theme swaps.
- **`NO_COLOR` env-var compliance** — when `NO_COLOR` is set to a non-empty value, all color is dropped and the surface remains usable on a 1-bit terminal. Layout must not depend on color to convey state. See `references/cli.md` §6 for the full env-var resolution order; per-invocation flags (`--theme=light`, `--no-color`) override `NO_COLOR` per the spec.

```go
type Tokens struct {
    LightTrue, DarkTrue       lipgloss.Color // 24-bit
    Light256,  Dark256        lipgloss.Color // xterm-256
    Light16,   Dark16         lipgloss.Color // ANSI 16
}

func (t Tokens) Resolve(isDark bool, tier Tier, noColor bool) lipgloss.Color {
    if noColor { return lipgloss.NoColor{} }
    switch tier {
    case TierTrueColor: if isDark { return t.DarkTrue }; return t.LightTrue
    case TierIndexed:   if isDark { return t.Dark256  }; return t.Light256
    default:            if isDark { return t.Dark16   }; return t.Light16
    }
}
```

Every theme-aware draw call goes through `Resolve`. Branching on `isDark` or `tier` inside individual widgets is the slop tell — centralise the tier logic, then forget about it.

The same shape ports to other runtimes. In Ratatui, `Resolve` returns a `ratatui::style::Color` and the variant choice (`Rgb` vs `Indexed` vs named) collapses the tier branch. In Textual, the tokens become CSS variables (`$rose`, `$pine`, `$muted`) and `isDark` selects a theme via `App.theme = "dark"` — the runtime swaps the variable bindings, individual widgets stay token-only.

Tier detection itself is out of scope for the resolver — pick it once at startup from `$COLORTERM` (`truecolor` or `24bit` → tier 3), `$TERM` (`*-256color` → tier 2), and the pessimistic default (tier 1). Cache the answer; do not re-probe per frame.

## 7. Cite-and-defer

Citations: `github.com/charmbracelet/bubbletea`, `github.com/charmbracelet/lipgloss`, `github.com/charmbracelet/bubbles`, `github.com/ratatui/ratatui` (workspace root), `textual.textualize.io`. The Charm v2 release post and the Ratatui 0.30 release notes are the primary anchors for the version table above.

This is starter density — defer to upstream changelogs for current capability surface before relying on a feature in production.
