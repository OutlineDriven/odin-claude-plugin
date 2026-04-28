# desktop.md — native cross-platform desktop surfaces

Surface reference for native desktop apps that are not built on Electron. Covers Tauri 2.x (web frontend + Rust backend), Slint 1.16 (declarative `.slint` markup), egui (immediate-mode), and Iced (Elm-inspired reactive). Companion to `references/paradigms.md` for paradigm fit and `references/anti-slop.md` for cross-platform color slop tells.

**Snapshot date: April 2026.** Re-verify versions and capability tables before relying on them in production.

## 1. Posture

Native desktop beats Electron for any app whose users care about cold-start, RAM, or battery. The four cross-platform options that avoid web-rendering — Tauri, Slint, egui, Iced — partition along two axes: language fit (Rust-only vs polyglot frontend) and render model (retained vs immediate). Pick by render model and language fit, not by aesthetics — the picked direction (paradigm + tokens) drives aesthetics, while the framework constrains the *render model* the tokens flow through.

The paradigms in `references/paradigms.md` map cleanly onto desktop: post-minimalism is the operator-tool default; Material 3 Expressive and Fluent 2 fit native OS shells; neo-brutalism reads loud on a desktop window. Cross-platform color slop tells documented in `references/anti-slop.md` §1 apply doubly here — a desktop app that hardcodes macOS accent blue on Windows reads as web-port-pretending-to-be-native.

## 2. Tauri 2.x

Tauri 2.0 stable shipped on **October 2 2024**. The 2.x mobile track — iOS and Android targets — reached production-ready status by **April 2026**, making Tauri the only desktop framework in this set that also produces phone binaries from the same codebase.

- **Frontend** — any web stack (React, Svelte, vanilla HTML/CSS, Solid). The webview is the OS-native one (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux), not a bundled Chromium.
- **Backend** — Rust. The Tauri runtime mediates between the webview and Rust commands.
- **Native menus** — `tauri-plugin-muda` (the muda menu library, extracted as a standalone plugin in 2.x).
- **File dialogs** — `tauri-plugin-dialog`.
- **Notifications** — `tauri-plugin-notification`.

The trade is a small binary (typically <10 MB vs Electron's ~150 MB baseline) and a fast cold-start, at the cost of webview drift across platforms. Treat the webview as a minimum-baseline target, not a uniform substrate.

IPC pattern — frontend invokes a named Rust command, awaits a JSON-serializable result:

```rust
#[tauri::command]
fn read_config(key: String) -> Result<String, String> {
    std::env::var(&key).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```ts
// frontend
import { invoke } from '@tauri-apps/api/core';
const value = await invoke<string>('read_config', { key: 'HOME' });
```

Native menu construction via muda — declarative, OS-native rendering, keyboard-shortcut wiring inherited from the platform:

```rust
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

let file = SubmenuBuilder::new(app, "File")
    .item(&MenuItemBuilder::new("Open").id("open").accelerator("CmdOrCtrl+O").build(app)?)
    .separator()
    .item(&MenuItemBuilder::new("Quit").id("quit").accelerator("CmdOrCtrl+Q").build(app)?)
    .build()?;
let menu = MenuBuilder::new(app).item(&file).build()?;
app.set_menu(menu)?;
```

File-dialog wrapping via `tauri-plugin-dialog` — async, returns the picked path or `None`:

```rust
use tauri_plugin_dialog::DialogExt;
let path = app.dialog().file().blocking_pick_file();
```

Token-driven theming flows via CSS custom properties; the Rust side never paints colors, only feeds tokens to the webview. Surface tokens in `tauri.conf.json` so theme changes do not require a Rust rebuild:

```toml
# Cargo.toml fragment — declare the theme features the frontend will read.
[features]
default = ["theme-tokens"]
theme-tokens = []
```

```json
// tauri.conf.json (excerpt)
{
  "app": {
    "windows": [{
      "title": "myctl",
      "width": 1024,
      "height": 768,
      "transparent": false
    }]
  }
}
```

Cross-platform color discipline — never hardcode platform colors; always derive from tokens. A direction artifact owns the OKLCH palette; the frontend reads CSS variables; macOS / Windows / Linux all see the same tokens unless an explicit per-platform branch resolves them differently.

Sandboxing — Tauri's allowlist must be tight. The default capability surface in 2.x is permission-scoped per command; widening it for convenience is the most common security regression in shipping Tauri apps.

## 3. Slint 1.16

Slint 1.16 stable released **April 16 2026**. Runtime is under 300 KiB — among the smallest cross-platform UI runtimes in production. Compile-time validation: declarative `.slint` markup with property bindings checked at build, so theme-token mismatches surface before runtime.

Bindings ship for Rust, C++, and JavaScript (Node). The `.slint` files are language-agnostic; pick the host language by integration constraint, not by Slint affinity.

Declarative `.slint` syntax — windows, components, property bindings:

```slint
import { Button, VerticalBox } from "std-widgets.slint";

global Theme {
    out property <color> accent: #d97757;
    out property <color> surface: #fafaf9;
}

export component MainWindow inherits Window {
    width: 480px;
    height: 320px;
    background: Theme.surface;

    VerticalBox {
        Button {
            text: "ready";
            primary: true;
        }
    }
}
```

Design-token integration via global properties — declare a `global Theme` block, bind UI to its outputs, swap implementations at compile time or via the Rust/C++ host. Compile-time binding-graph validation means a missing token produces a build error, not a runtime null.

## 4. egui

egui 0.27+ is the stable line as of April 2026. Render model is immediate-mode — re-render the whole frame each tick — which inverts the assumption every retained-mode framework makes. Cross-platform via web (WASM through `eframe`), desktop (`eframe`), and game-engine integrations (Bevy, Macroquad).

Immediate-mode contract — there is no scene graph; the `update()` callback is called every frame, and widgets are painted directly. State lives outside the UI tree. Use `egui::Context::request_repaint` to force a repaint when external state changes between input frames.

```rust
use eframe::egui;

fn main() -> Result<(), eframe::Error> {
    eframe::run_simple_native("ready", Default::default(), |ctx, _frame| {
        let mut style = (*ctx.style()).clone();
        style.visuals.override_text_color = Some(egui::Color32::from_rgb(217, 119, 87));
        ctx.set_style(style);

        egui::CentralPanel::default().show(ctx, |ui| {
            if ui.button("ready").clicked() { ctx.request_repaint(); }
        });
    })
}
```

Theming via `egui::Style` mutation — clone the current style, mutate, install via `Context::set_style`. Tokens are re-read every frame, so runtime theme switches are free; the cost is that style state is global per `Context`, not per widget.

## 5. Iced

Iced 0.13+ as of April 2026. Reactive Elm-inspired architecture (model / update / view / subscription) in idiomatic Rust. Renderer is wgpu — hardware-accelerated, cross-platform GPU surface; falls back to software where wgpu cannot bind.

Elm architecture in Rust — the `Application` trait splits state, message handling, and view construction. Token-driven styling routes through `iced::theme`; custom themes implement the `theme::Custom` shape and feed palette colors from tokens.

```rust
use iced::{Element, Sandbox, Settings, widget::{button, column, text}};

struct App { count: u32 }
#[derive(Debug, Clone)] enum Message { Pressed }

impl Sandbox for App {
    type Message = Message;
    fn new() -> Self { Self { count: 0 } }
    fn title(&self) -> String { "ready".into() }
    fn update(&mut self, m: Message) { match m { Message::Pressed => self.count += 1 } }
    fn view(&self) -> Element<Message> {
        column![text(self.count), button("ready").on_press(Message::Pressed)].into()
    }
}

fn main() -> iced::Result { App::run(Settings::default()) }
```

## 6. Native menus, dialogs, notifications

Posture — native beats custom for menus, dialogs, and notifications on every platform. A custom modal-as-menu reads as web (because that is where the pattern came from); a custom file-picker reads as toy. The OS owns these affordances and users carry muscle memory across apps.

- **Tauri** — muda for menus, `tauri-plugin-dialog` for file pickers, `tauri-plugin-notification` for toasts; all three resolve to the OS-native shell.
- **Slint** — platform integrations expose native menus on macOS / Windows; on Linux the menu protocol depends on the desktop environment.
- **egui / Iced** — delegate to the host platform via `rfd` (file dialogs) and `notify-rust` (notifications); menus are typically host-driven (the windowing crate, e.g. `winit`, owns the menu bar).

Custom-painted menus are reserved for surfaces where the menu *is* the product (e.g. a creative tool's tool palette) — not as a stylistic preference for stock app chrome.

## 7. Retained-mode token discipline

For retained-mode frameworks (Tauri, Slint, Iced), tokens flow once at app start and live in the framework's scene graph; runtime theme switches require explicit re-application — re-binding properties (Slint), re-issuing the theme message (Iced), or swapping the CSS variable scope (Tauri). The cost is small but non-zero, and the developer must remember to trigger it.

For immediate-mode (egui), tokens are re-read every frame from `Context::style()` — a runtime theme switch is a single mutation, no traversal cost. The trade is that any per-frame allocation in the style path will show up in CPU profiles. Pick storage (Arc, Cow, plain Style) based on theme-switch frequency.

## 8. Forbidden

- **Electron for lightweight tools** — RAM cost wrong by 10× and cold-start cost wrong by 5× for any app that fits Tauri's webview-plus-Rust shape. Reserve Electron for cases where the app *must* ship its own Chromium (latest CSS features, embedded DevTools).
- **Hardcoded platform-specific colors** — always token-driven. A constant `#0078D4` (Windows accent) buried in a Tauri component is the cross-platform color slop tell from `references/anti-slop.md`.
- **File I/O without sandboxing** — Tauri's allowlist must be tight. `fs:allow-read-text-file` scoped to a single directory beats a permissive `fs:default`.

## 9. Cite-and-defer

Citations: tauri.app, slint.dev, egui.rs, iced.rs. Defer to upstream changelogs for current API surfaces; the Tauri ecosystem in particular moves fast across plugin minor releases, and Slint's `.slint` syntax is still gaining sugar between point releases.