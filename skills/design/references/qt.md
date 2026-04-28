# qt.md — Qt-specific desktop surface

Surface reference for Qt — the most mature cross-platform native UI toolkit. Companion to `references/desktop.md` for non-Qt native frameworks (Tauri, Slint, egui, Iced) and `references/paradigms.md` for paradigm fit.

**Snapshot date: April 2026.** Re-verify versions and capability tables before relying on them in production.

## 1. Posture

Qt is the most mature cross-platform native UI toolkit, with a generation of production deployments behind it. QML plus Quick Controls 2 is the recommended target for new code; Widgets remains supported for legacy and rich-desktop apps where the immediate-mode QML retained-tree shape is the wrong fit. Do not fight Qt's idioms — embrace QML, embrace property bindings, embrace the singleton-as-theme-provider pattern. Bypassing the binding graph is the single most common source of Qt-specific slop.

## 2. Qt versions

- **Qt 6.5 LTS** — standard support ended **April 3 2026** (commercial extended support continues for paying customers). Open-source projects on 6.5 should plan a migration to 6.8 LTS.
- **Qt 6.8 LTS** — current LTS line; the production target for new work as of April 2026.
- **Qt 6.11 stable** — released **March 23 2026**. Lottie and SVG rendering moved out of tech preview; Quick Controls now ships `DoubleSpinBox` (a long-requested gap); hardware-accelerated 2D graphics improvements via the RHI backend.
- **Qt 7** — roadmap not yet published as of April 2026.

Recommendation: target **Qt 6.8 LTS** for production releases; track 6.11 for new features and treat it as the staging line for next-LTS migration. Pin the major.minor in build manifests; Qt point releases are well-behaved, but minor-version drift across a team produces avoidable rebuild cycles.

```toml
# Cargo.toml fragment for a Qt-bound Rust app
[dependencies]
cxx-qt = "0.7"  # bindings against system Qt; align with installed 6.8 LTS
```

The Qt licensing model still bifurcates LGPL/GPL open source vs commercial — confirm the license shape against the deployment target before pinning a version.

## 3. QML + Quick Controls 2

QML is declarative, with property bindings and signal handlers; Quick Controls 2 is the modern control library, distinct from the legacy `QtQuick.Controls` 1 (deprecated since Qt 5.x). Three style families ship in-box:

- **Material** — Material Design 3 in QML; Google ecosystem fit.
- **Universal** — Microsoft Fluent / Windows visual language.
- **Imagine** — fully customizable via NinePatch images; the right pick when the brand demands a non-platform look.

Pick a style via the `QT_QUICK_CONTROLS_STYLE` env var or via a `qtquickcontrols2.conf` file shipped with the binary:

```ini
# qtquickcontrols2.conf
[Controls]
Style=Material

[Material]
Theme=Dark
Accent=Orange
```

```bash
QT_QUICK_CONTROLS_STYLE=Material ./myapp
```

A concrete `.qml` button with explicit Material style — the binding fires on click, the style is resolved at component instantiation:

```qml
import QtQuick
import QtQuick.Controls.Material

ApplicationWindow {
    width: 480; height: 320
    visible: true
    Material.theme: Material.Dark
    Material.accent: Material.Orange

    Button {
        anchors.centerIn: parent
        text: "ready"
        onClicked: console.log("clicked")
    }
}
```

Mixing styles within a single window is supported but rarely correct — pick one per app and commit. Cross-style compositing reads as a Qt-specific anti-slop tell on par with the cross-platform color slop in `references/anti-slop.md` §1.

## 4. Theming via singletons

Define a single `ThemeProvider` singleton (QML or C++) that exposes design tokens as properties; bind UI to those properties. When tokens change, every bound UI updates automatically through Qt's binding graph — no manual fan-out. The pattern beats per-component palette overrides every time.

```qml
// Theme.qml
pragma Singleton
import QtQuick

QtObject {
    readonly property color accent:  "#d97757"
    readonly property color surface: "#fafaf9"
    readonly property color text:    "#1a1a1a"
    readonly property int   radius:  8
    readonly property int   gutter:  16
}
```

```qml
// qmldir entry that registers the singleton
// singleton Theme 1.0 Theme.qml
```

```qml
// Consumer
import QtQuick
import QtQuick.Controls
import "."  // pulls in qmldir-registered singleton

Rectangle {
    color: Theme.surface
    radius: Theme.radius
    Text { text: "ready"; color: Theme.text }
}
```

The C++ alternative — register a `QObject` subclass with `qmlRegisterSingletonType` — applies when tokens are sourced from native config (settings store, keychain, or system theme detection). The contract is the same: properties exposed, bindings driven by them.

## 5. Layouts beat anchors

`RowLayout`, `ColumnLayout`, and `GridLayout` from `QtQuick.Layouts` handle responsive hierarchies — resize, content-driven sizing, alignment, stretch ratios — automatically. Anchors are the right tool only for absolute positioning or simple-edge alignment within a fixed-size region; reach for them sparingly. Layouts compose; nested anchored components do not.

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    width: 480; height: 240
    visible: true

    RowLayout {
        anchors.fill: parent
        spacing: 12
        Button { text: "open";   Layout.fillWidth: true }
        Button { text: "save";   Layout.fillWidth: true }
        Button { text: "cancel"; Layout.fillWidth: true }
    }
}
```

The diagnostic for anchors-versus-layouts: if a component needs to grow with available space, or align siblings on a shared baseline, layouts. If a component is pinned to a specific corner of a fixed-size parent, anchors. Routine forms, toolbars, and content panes are layout territory.

## 6. Forbidden

- **Hardcoded color values** — always palette- or theme-driven. A literal `"#0078D4"` in a `.qml` file means the singleton has been bypassed.
- **Heavy custom rendering for routine widgets** — `paintEvent` / `QPainter` for buttons and text fields bypasses the native style baseline and the binding graph; reserve custom paint for canvases, plots, and bespoke surfaces.
- **`Component.onCompleted` JavaScript for state** — imperative initialization defeats the binding graph. Express initial state through property bindings, not procedural assignments.
- **Mixing Quick Controls 2 styles within a window** — one style per app, committed at build.

## 7. Cite-and-defer

Citations: doc.qt.io, qt.io/blog. Qt 6.8 LTS for production; defer to release notes for 6.11 features and the 6.11 → next-LTS migration window. The Qt commercial / open-source licensing split shifts independently of the version cadence — confirm against current terms before pinning.