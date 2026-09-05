# WebAssembly and Embedded Go

Go has **two unrelated wasm ports**: `GOOS=js GOARCH=wasm` (browser/Node, `syscall/js`, since 1.11) and `GOOS=wasip1 GOARCH=wasm` (any WASI runtime, since 1.21). They share `GOARCH=wasm` (single-threaded, no parallelism, no cgo) but nothing else: `syscall/js` exists only on `js`; `//go:wasmimport`/`//go:wasmexport` are meaningful only on `wasip1`. Standard Go can **export functions and build reactor libraries** since 1.24: the "wasm is command-only / must use `js.Global().Set`" belief is stale. TinyGo is a *size/embedded/Component-Model* choice, not a WASI prerequisite. Embed wasm in a Go host with **wazero** (pure-Go, no cgo).

> Verified against Go **1.26.x** (stable) + **1.27 RC** notes, TinyGo **0.41.x**, 2026-06. Version tags `[1.N]` mark the release a claim applies to. Deepened from deep-research + primary-source verification.

## TL;DR: the modern deltas (read first)

- `//go:wasmexport` [1.24] exports a Go func to the host: but **only on `GOOS=wasip1`** (compile error on `js/wasm`). With **`-buildmode=c-shared` [1.24]** a `wasip1` build becomes a **reactor/library** (exports `_initialize`, does *not* run `main`) the host calls repeatedly. This kills the old "expose via `js.FuncOf` + `select{}`" pattern for server-side wasm.
- Standard Go supports only WASI Preview 1 through 1.26. **`GOOS=wasip2` is an open proposal (#65333), not shipped.** The Component Model (WIT, resources, cross-language linking) is **TinyGo-only** today (`-target=wasip2`).
- `GOWASM=signext,satconv` are ignored [1.26] (always emitted now), and **wasm memory got much better [1.26]**: the runtime grows the heap in small increments, "significantly reduced memory usage for ... heaps less than around 16 MiB." The old "~7× heap, never returns memory" behavior (#59061) is obsolete.
- `string` is a parameter-only wasm type for both directives (lowers to `(i32, i32)`, **not** allowed as a result); `int`/`uint`/slices/maps/chans/interfaces are never allowed; **multiple results unsupported**.
- Both ports are single-threaded: goroutines run concurrently, never in parallel; any host call blocks *all* goroutines; background goroutines **freeze** the instant a `wasmexport` returns. `GOWASM=threads` (#56305) never landed.
- `syscall/js` DOM calls are ~10× slower than native JS (#32591): minimize/batch boundary crossings. **wazero** is the pure-Go, **CGO-free** host runtime (Core 1.0 + 2.0); wasmtime/wasmer use cgo.

## Table of Contents
1. [WASI wasip1 port](#wasip1)
2. [Browser port (syscall/js) + interop traps](#browser-wasm)
3. [go:wasmexport: exporting to the host](#wasmexport)
4. [go:wasmimport evolution](#wasmimport)
5. [Reactor vs Command mode](#reactor)
6. [js/wasm vs wasip1](#js-vs-wasip1)
7. [WASI Preview 1 vs Preview 2 / Component Model](#wasi-p2)
8. [Threads & goroutines under wasm](#threads)
9. [Host-side embedding: wazero vs wasmtime/wasmer](#host-embedding)
10. [TinyGo for WASM](#tinygo-wasm)
11. [TinyGo for Embedded / IoT](#tinygo-embedded)
12. [Size optimization](#size-optimization)
13. [Limitations](#limitations)
14. [Decision table: Standard Go vs TinyGo](#decision-table)
15. [Library landscape & status](#libraries)
16. [Version map 1.21→1.27](#versions)
17. [Anti-patterns](#anti-patterns)
18. [What models get wrong](#stale)

---

## WASI wasip1 port {#wasip1}

`GOOS=wasip1 GOARCH=wasm` [1.21] targets `wasi_snapshot_preview1`. The default **command** module runs `main` and exits via `proc_exit`. Provides filesystem, clock, env, stdio, random: **but no socket creation** (see the networking gap below).

```bash
# [1.21] build & run a WASI command module
GOOS=wasip1 GOARCH=wasm go build -o app.wasm ./cmd/app
wasmtime app.wasm        # or: wazero run app.wasm  /  wasmedge app.wasm

# [1.24] run the test suite under WASI — support files moved misc/wasm → lib/wasm
export PATH="$PATH:$(go env GOROOT)/lib/wasm"
GOOS=wasip1 GOARCH=wasm go test ./...        # uses go_wasip1_wasm_exec
GOWASIRUNTIME=wazero GOOS=wasip1 GOARCH=wasm go test ./...   # pick the host
```

```bash
# WRONG — stale pre-1.24 path; also wasip1 does NOT use wasm_exec.js at all
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .     # misc/wasm removed in 1.24
```

Networking gap (all versions through 1.26): wasip1 defines operations only on *already-open* sockets: there is no socket-creation syscall. `net.Listen`/`http.ListenAndServe` do **not** work out of the box. For a host with the socket extensions (WasmEdge / wasi-go), use `github.com/dispatchrun/net` (the renamed `github.com/stealthrocket/net`):

```go
import ("net/http"; "github.com/dispatchrun/net/wasip1")

func main() {
    ln, err := wasip1.Listen("tcp", "127.0.0.1:3000")   // NOT http.ListenAndServe
    if err != nil { log.Fatal(err) }
    log.Fatal(http.Serve(ln, handler))                  // http.Serve over a host-provided listener
}
```

---

## Browser port (syscall/js) + interop traps {#browser-wasm}

`GOOS=js GOARCH=wasm` [1.11] runs in a browser/Node via the `wasm_exec.js` glue and `syscall/js`. `syscall/js` is **exempt from the Go 1 compatibility promise**: treat its API as unstable.

```bash
GOOS=js GOARCH=wasm go build -o main.wasm ./cmd/web
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .   # [1.24] lib/wasm — MUST match the Go version
```

```html
<script src="wasm_exec.js"></script>
<script>
  const go = new Go();
  WebAssembly.instantiateStreaming(fetch("main.wasm"), go.importObject)
    .then(r => go.run(r.instance));   // serve main.wasm as Content-Type: application/wasm
</script>
```

```go
package main

import "syscall/js"

func main() {
    js.Global().Set("greet", js.FuncOf(greet))
    select {} // block forever — keep the Go runtime alive so the callback survives
}

func greet(this js.Value, args []js.Value) any {
    js.Global().Get("document").Call("getElementById", "out").
        Set("innerText", "Hello, "+args[0].String())
    return nil
}
```

Interop / marshalling traps models miss:
- Every boundary crossing is expensive: `syscall/js` DOM calls benchmark ~10× slower than native JS (golang/go #32591: 131 ms/op vs 11 ms/op). Do heavy compute in Go; batch DOM writes; touch the DOM once.
- Crossing the boundary copies: `js.ValueOf(goSlice)` does **not** share memory. Move bulk bytes with `js.CopyBytesToJS`/`js.CopyBytesToGo` against a `Uint8Array`, never per-element `Get`/`Set`.
- `js.FuncOf` leaks until `.Release()` (lifetime callbacks are fine; per-event ones must be released). `js.Value` isn't `==`-comparable (use `.Equal()`); a wrong-type access like `.Int()` on a string **panics**: guard with `.Type()`.
- Don't return from `main`: the instance dies and callbacks stop. `select{}` keeps it alive. And never pull `net/http`'s server into a browser build (several MB: see [size](#size-optimization)); call `fetch` via `syscall/js`.

---

## go:wasmexport: exporting to the host {#wasmexport}

`//go:wasmexport name` [1.24] exports a Go function to the wasm host. **`wasip1`-only** (compile error on `js/wasm`).

```go
//go:wasmexport add
func add(a, b int32) int32 { return a + b }

func main() {}   // still required even for a reactor; an empty body is fine
```

Argument/result types (verified against the `cmd/compile` doc, Go 1.26: same table for `wasmimport` and `wasmexport`):
| Go type | Wasm | Notes |
|---|---|---|
| `bool`, `int32`, `uint32` | `i32` | |
| `int64`, `uint64` | `i64` | |
| `float32` / `float64` | `f32` / `f64` | |
| `unsafe.Pointer`, `pointer` | `i32` | host is 32-bit; pointer restrictions below |
| `string` | `(i32, i32)` | **parameter only. NOT permitted as a result** |

A **pointer's element type** must be `bool`, a sized int/uint (`int8`..`uint64`), `float32/64`, an array of a permitted element type, or a struct that (if non-empty) embeds `structs.HostLayout` [1.23] and contains only permitted-element fields. **Pointers to structs that contain pointer-typed fields are forbidden** (64-bit guest / 32-bit host mismatch).

```go
import "structs"

type Rect struct {
    _             structs.HostLayout // [1.23] guarantees host-compatible layout
    Width, Height int32
}

//go:wasmexport area
func area(r *Rect) int32 { return r.Width * r.Height }
```

Hard restrictions: functions only (not methods); no `int`/`uint` (use sized variants); no slices, maps, channels, interfaces; multiple results are not supported (the wasm multi-value path is unimplemented in the Go backend); reserved names `_start`/`_initialize`; a panic reaching the top of a `wasmexport` call **crashes the module**: there is no host-propagation mechanism, so validate inputs and recover internally. These directives are **exempt from the Go 1 compatibility promise**.

```go
// WRONG — stale js/wasm pattern emitted for server-side WASI; unnecessary on a wasip1 reactor
func main() {
    js.Global().Set("add", js.FuncOf(func(_ js.Value, a []js.Value) any { return a[0].Int() + a[1].Int() }))
    select {}
}
// WRONG — int is not a permitted wasmexport type
//go:wasmexport add
func add(a, b int) int { return a + b }   // use int32/int64
```

---

## go:wasmimport evolution {#wasmimport}

`//go:wasmimport module name` [1.21] declares a host function (body-less). This is how `runtime`/`syscall` reach WASI; you can use it in your own packages since the early package restriction was lifted (#59149).

```go
//go:wasmimport wasi_snapshot_preview1 random_get
//go:noescape
func random_get(buf unsafe.Pointer, bufLen uint32) uint32
```

- [1.21] integers, floats, `unsafe.Pointer`; single result.
- [1.24] added `bool`, `string`, `uintptr`, and pointers to permitted types (structs embed `structs.HostLayout`): the same expanded set `wasmexport` uses.
- GC can't see wasm pointers: they're passed as `uint32`, so the collector may reclaim the pointee mid-call. Keep it alive with `runtime.KeepAlive` (or `//go:uintptrescapes` on uintptr-carrying syscalls).

---

## Reactor vs Command mode {#reactor}

| Mode | Build | Entry | Lifecycle |
|---|---|---|---|
| **Command** (default) | `go build` | `_start` (runs `main`, then `proc_exit`) | one-shot; dead after `main` |
| **Reactor / library** [1.24] | `go build -buildmode=c-shared` | `_initialize` (runtime + pkg init; does **not** call `main`) | stays alive; exported funcs callable repeatedly |

`-buildmode=c-shared` is *repurposed* on wasip1: `go help buildmode` states it "builds it to a WASI reactor/library, of which the callable symbols are those functions exported using a //go:wasmexport directive."

```bash
GOOS=wasip1 GOARCH=wasm go build -buildmode=c-shared -o reactor.wasm ./cmd/plugin
```

```go
// wazero host calling a reactor: instantiate with _initialize, then call exports repeatedly
ctx := context.Background()
r := wazero.NewRuntime(ctx)
defer r.Close(ctx)
wasi_snapshot_preview1.MustInstantiate(ctx, r)

cfg := wazero.NewModuleConfig().WithStartFunctions("_initialize") // NOT "_start"
mod, err := r.InstantiateWithConfig(ctx, wasmBytes, cfg)
if err != nil { log.Fatal(err) }

res, err := mod.ExportedFunction("add").Call(ctx, api.EncodeI32(3), api.EncodeI32(4))
if err != nil { log.Fatal(err) }
fmt.Println(api.DecodeI32(res[0])) // 7 — instance stays alive for more calls
```

```go
// WRONG — a c-shared reactor has no _start; this fails to instantiate
cfg := wazero.NewModuleConfig().WithStartFunctions("_start")
```

---

## js/wasm vs wasip1 {#js-vs-wasip1}

| | `GOOS=js GOARCH=wasm` [1.11] | `GOOS=wasip1 GOARCH=wasm` [1.21] |
|---|---|---|
| Host | Browser/Node via `wasm_exec.js` | Any WASI runtime (wasmtime, wazero, …) |
| Interop | `syscall/js` (`js.Global`, `js.FuncOf`, `js.Value`) | WASI syscalls; `go:wasmimport`/`export` |
| Export funcs | only by assigning a `js.FuncOf` to a JS global | `//go:wasmexport` [1.24] |
| Reactor mode | n/a | `-buildmode=c-shared` [1.24] |
| `syscall/js` | js-only; exempt from Go 1 compat | not available |
| Sockets | via browser `fetch` | none in P1 (needs `dispatchrun/net` + extended host) |

Mixing the two is the classic error: `syscall/js` cannot run under wasip1, and `go:wasmimport`/`go:wasmexport` are no-ops/compile errors under `js/wasm`.

---

## WASI Preview 1 vs Preview 2 / Component Model {#wasi-p2}

- Standard Go = Preview 1 only through 1.26. `GOOS=wasip2` is **proposal #65333 (open, unmerged)**; a `wasip3` effort (#77141) targets async `wasi:http` and needs a patched runtime. Don't claim std Go "supports WASI P2."
- TinyGo compiles to P2 components: `tinygo build -target=wasip2` (native support since v0.33.0; current as of **TinyGo 0.41.x**). Toolchain: `wit-bindgen-go` (go.bytecodealliance.org), `wkg` (WIT deps), `wasm-tools`. As of 0.41 the wasip2 target is **hardwired to the `wasi:cli/command` world** (worlds beyond it are tracked in tinygo #4843), so a custom world must currently be expressed against that.
- Preview 1 vs Preview 2: P1 exposes only ints/floats + linear memory; P2's **Component Model** adds WIT interfaces and lifting/lowering of high-level types (strings, records, resources) and cross-language linking.

```bash
# TinyGo component (P2): generate WIT bindings, then build
go tool wit-bindgen-go generate --world plugin-api --out internal ./pkg.wasm
tinygo build -target=wasip2 --wit-package ./pkg.wasm --wit-world plugin-api -o plugin.wasm ./main.go
```

---

## Threads & goroutines under wasm {#threads}

- Single-threaded, no parallelism in both ports (through 1.26). The scheduler runs goroutines concurrently and stdio is non-blocking, but **any host call blocks all goroutines** until it returns, and **`GOMAXPROCS>1` buys nothing**.
- A `wasmexport` call may spawn goroutines, but **background goroutines are paused the instant the exported function returns**; they resume only when the host calls back in. Don't rely on a fire-and-forget goroutine outliving the call.
- `GOWASM=threads` (#56305) was never accepted. Browser parallelism = multiple **Web Workers**, each hosting a *separate* module instance: not OS threads inside one instance.

---

## Host-side embedding: wazero vs wasmtime/wasmer {#host-embedding}

To run untrusted wasm *inside* a Go program (plugins, sandboxed user code), the runtime choice dominates deployability.

```go
// wazero: pure Go, no cgo. Run a wasip1 module with stdio + filesystem.
ctx := context.Background()
r := wazero.NewRuntime(ctx)
defer r.Close(ctx)
wasi_snapshot_preview1.MustInstantiate(ctx, r)

cfg := wazero.NewModuleConfig().
    WithStdout(os.Stdout).WithStderr(os.Stderr).
    WithFSConfig(wazero.NewFSConfig().WithDirMount("/data", "/")) // capability-scoped FS
if _, err := r.InstantiateWithConfig(ctx, wasmBytes, cfg); err != nil {
    log.Fatal(err)
}
```

- wazero (`github.com/tetratelabs/wazero`): **pure Go, zero deps, no cgo**; Core 1.0 + 2.0 compliant. Keeps `CGO_ENABLED=0` cross-compilation and static binaries working; its **interpreter** mode runs on *any* `GOARCH` (e.g. riscv64), **compiler** mode is default elsewhere. Capabilities (FS, env, clocks) are opt-in per module: good sandbox posture. The default host runtime.
- wasmtime-go / wasmer-go: bindings over the Rust runtimes via **cgo**. Fuller WASI P2 / Component Model support and often faster raw execution, but cgo forfeits the single-static-binary / cross-compile story (usually why a team picked Go). Adopt only for a concrete P2/component need wazero lacks.

---

## TinyGo for WASM {#tinygo-wasm}

TinyGo's LLVM backend omits most of the Go runtime, producing far smaller wasm. Current: **0.41.x** (adds Go 1.26 support). TinyGo's Go-version compatibility is **strict and lags upstream**: pin a TinyGo release that matches your Go toolchain (e.g. an older TinyGo will reject a newer Go).

```bash
# Browser wasm — TinyGo uses the GOOS=js GOARCH=wasm form (its own wasm_exec.js)
GOOS=js GOARCH=wasm tinygo build -o out.wasm --no-debug ./main.go
cp "$(tinygo env TINYGOROOT)/targets/wasm_exec.js" .   # TinyGo's glue — must match TinyGo version

# WASI Preview 1 / Preview 2
tinygo build -target=wasip1 --no-debug -o out.wasm ./main.go
tinygo build -target=wasip2 --no-debug -o out.wasm ./main.go   # Component Model
```

**TinyGo exports use `//export`** (and host imports too): **not** `//go:wasmexport`:

```go
//export multiply
func multiply(x, y int) int { return x * y }   // callable as wasm.exports.multiply in JS

//export add
func add(x, y int) int   // body-less = imported from the JS `env` module
```

Deltas vs standard Go: partial `reflect` (can panic), `recover()` is effectively a no-op in TinyGo wasm, and parts of stdlib are incomplete (historically `fmt`/`encoding/json` rough edges): validate inputs instead of relying on recovery, and test the exact stdlib paths you use.

---

## TinyGo for Embedded / IoT {#tinygo-embedded}

TinyGo supports **100+ boards** (Arduino, RP2040/RP2350 Pico & Pico 2, Nordic nRF52, STM32, Adafruit SAMD, BBC micro:bit, ESP32) with **130+ drivers** in `tinygo.org/x/drivers`. For microcontrollers it is the **only** option: standard Go has no MCU backend. Peripherals are reached through the `machine` package (`machine.LED.Configure`, `machine.I2C0.Configure`, `machine.SPI0.Configure`, etc.); pin/bus names are board-specific. `tinygo flash -target=arduino-nano33 ./main.go` compiles and flashes in one step.

| Family | Examples | Notes |
|---|---|---|
| Arduino (ARM) | Nano 33 IoT, Nano RP2040 | strongest TinyGo support |
| Raspberry Pi | Pico (RP2040), Pico 2 (RP2350) | RP2350 supported |
| Nordic | nRF52832, nRF52840 | BLE-capable |
| ESP | ESP32, ESP8266 | GPIO/SPI/I2C work; WiFi/BT support is partial/board-specific |
| STM32 | STM32F4 Discovery, Blue Pill | industrial |

---

## Size optimization {#size-optimization}

Standard Go statically links the whole runtime + GC + reflect (+ often `fmt`), so a trivial `js/wasm` binary is typically **1-2 MB**. Order of impact: **strip debug → drop heavy imports → choose TinyGo → wasm-opt → compress over the wire**.

| Strategy | Command / action | Impact (representative) |
|---|---|---|
| Strip DWARF + symtab (std Go) | `go build -ldflags="-s -w"` | ~10-33% smaller |
| Drop heavy imports | avoid `net/http`, minimize `fmt` | largest std-Go lever |
| Switch to TinyGo | `tinygo build --no-debug` | ~5-20× smaller |
| TinyGo `--no-debug` | strip debug info | single biggest TinyGo win (~⅔ off) |
| TinyGo `-scheduler=none` | drop the goroutine scheduler | further (no goroutines) |
| TinyGo `-gc=leaking` | remove the GC entirely | smallest; **short-lived only**, never frees |
| TinyGo `-panic=trap` | trap instead of unwinding panics | further |
| `wasm-opt -Oz` (Binaryen) | post-process | **modest** on Go/TinyGo output |
| Brotli/Gzip | serve compressed | ~75-78% *transfer* reduction |

Import-size reality (std Go wasm), approximate: empty ≈ 1.3 MB, `+fmt` ≈ 2 MB, `+encoding/json` ≈ 2.2 MB, `+net/http` jumps multiple MB. Figures are from sample programs, not guarantees: profile with **twiggy** to see which symbols dominate.

```bash
# Aggressive TinyGo pipeline (short-lived modules)
tinygo build -target=wasip1 --no-debug -scheduler=none -panic=trap -gc=leaking -o out.wasm ./main.go
wasm-opt -Oz out.wasm -o out.wasm
```

Two stale beliefs: `wasm-opt -Oz` is a silver bullet (it's big for Rust/C, only modest on Go: Binaryen can't undo runtime bloat); and "Go wasm never returns memory" (#59061): **[1.26]** materially fixes this for heaps under ~16 MiB.

---

## Limitations {#limitations}

Standard Go wasm: no cgo; single-threaded (no parallelism); no socket creation in wasip1; ~1-2 MB minimum binaries; background goroutines pause when a `wasmexport` call returns; no multi-value results; no WASI P2 / Component Model; `syscall/js` and the wasm directives are exempt from the Go 1 compatibility promise. TinyGo: partial `reflect` (may panic), `recover()` effectively unavailable in wasm, incomplete stdlib in places, strict Go-version pinning. Both: a panic at the top of a `wasmexport` call crashes the module.

---

## Decision table: Standard Go vs TinyGo {#decision-table}

| Criterion | Winner | Why |
|---|---|---|
| Binary size | TinyGo | sub-100 KB vs 1-2 MB minimum |
| Full stdlib / `reflect` | Standard Go | TinyGo partial, may panic |
| WASI server-side plugin | Standard Go | `wasmexport` + reactor [1.24], official support |
| WASI Preview 2 / components | **TinyGo** | only path today (`-target=wasip2`) |
| Microcontroller / IoT | TinyGo | only option (100+ boards) |
| Goroutine-heavy code | Standard Go | full scheduler vs cooperative subset |
| Production maturity | Standard Go | Go-team owned |
| Edge/serverless cold start | TinyGo | smaller binary = faster start |

Rule of thumb: Standard Go for full language/stdlib fidelity and server/edge WASI; TinyGo when binary size, microcontrollers, or the Component Model is the constraint. For a browser build, start on `GOOS=js` with `-ldflags="-s -w"`; move to TinyGo once the gzipped binary exceeds a few hundred KB *and* you don't need full reflect/stdlib.

---

## Library landscape & status {#libraries}

| Library / component | Status [2026] | Use when |
|---|---|---|
| stdlib `wasip1` (`go:wasmexport`/reactor) | **Default** [1.24] | server/edge WASI, plugins; no P2 |
| stdlib `js/wasm` + `syscall/js` | Maintained, legacy | in-browser DOM/JS interop |
| **wazero** (`tetratelabs/wazero`) | **Default host runtime**, pure-Go/no-cgo | embedding wasm in Go without cgo |
| wasmtime-go | Active, cgo | need P2 / Component Model on the host |
| wasmer-go | Active, cgo | alternative cgo host |
| TinyGo | Active; **0.41.x** (Go 1.26) | size, microcontrollers, WASI P2 |
| `tinygo.org/x/drivers` | Active | 130+ sensor/peripheral drivers |
| `dispatchrun/net` | Active (was `stealthrocket/net`) | wasip1 sockets on extended hosts |
| `wit-bindgen-go` (go.bytecodealliance.org) | Active | WIT→Go bindings for components |
| `GOOS=wasip2` (#65333) | **Proposal, not shipped** | watch the tracker; use TinyGo today |
| `GOWASM=threads` (#56305) | **Never landed** | use Web Workers instead |
| `GOWASM=signext,satconv` | **Ignored [1.26]** | omit: always on now |

---

## Version map 1.21→1.27 {#versions}

| Ver | WebAssembly-relevant |
|---|---|
| **1.21** | `GOOS=wasip1 GOARCH=wasm` port; `//go:wasmimport` (ints/floats/`unsafe.Pointer`, single result); `wasip1` test runner |
| **1.22** | minor; wasm crypto perf improvements (no port-level wasm changes) |
| **1.23** | `structs.HostLayout` (used by wasm pointer-to-struct rules); minor wasm fixes |
| **1.24** | **`//go:wasmexport`; reactor via `-buildmode=c-shared`; expanded directive types (`bool`/`string`/`uintptr`/pointers-to-`HostLayout`); `misc/wasm`→`lib/wasm`; reduced initial memory** |
| **1.25** | **no WebAssembly changes** (release notes have no wasm section) |
| **1.26** | `GOWASM=signext,satconv` ignored (always on); runtime grows heap in small increments → much lower memory for heaps < ~16 MiB; Green Tea GC default (opt-out `GOEXPERIMENT=nogreenteagc`, slated for removal in 1.27) |
| **1.27 (RC)** | generic methods; `asynctimerchan` GODEBUG removed; Green Tea opt-out removal expected. No `wasipN` port merged yet: treat P2 as TinyGo-only until GA (~Aug 2026). |

---

## Anti-patterns {#anti-patterns}

| Don't | Do instead |
|---|---|
| `GOOS=js` for server-side wasm | `GOOS=wasip1`: `js/wasm` needs a JS host |
| `js.FuncOf` + `select{}` to expose a server-side func | `//go:wasmexport` on a `wasip1` reactor [1.24] |
| `//go:wasmexport` on a `js/wasm` build | wasip1 only: it's a compile error on js |
| `int`/`uint`/slices/maps in directive signatures | sized `int32`/`int64`; pass buffers via pointer + length |
| Return a `string` from `wasmexport` | string is parameter-only; return a pointer/length or status code |
| Instantiate a reactor with `_start` | call `_initialize` (wazero `WithStartFunctions("_initialize")`) |
| `http.ListenAndServe` under wasip1 | `dispatchrun/net` + a host with socket extensions |
| Assume std Go supports WASI P2 / components | use TinyGo `-target=wasip2` today |
| Per-element `Get`/`Set` to move bytes across the JS boundary | `js.CopyBytesToJS`/`CopyBytesToGo`; batch DOM work; `.Release()` short-lived `FuncOf` |
| Reach for wasmtime/wasmer "for speed" by default | wazero (pure-Go, no cgo) unless you need P2/components |
| `wasm-opt -Oz` as the primary size fix for Go | strip debug + drop imports + compress; wasm-opt is modest on Go |
| Rely on `recover()` in TinyGo wasm | validate inputs: panics are effectively unrecoverable |
| Mismatched `wasm_exec.js`; expect a goroutine to run after `wasmexport` returns | match the install (`lib/wasm`/`targets/`); it's paused until the host calls back |

---

## What models get wrong {#stale}

1. "You can't export Go funcs to wasm / must use `js.Global().Set`": **false since [1.24]**: `//go:wasmexport` on `wasip1`. The `js.FuncOf`+`select{}` pattern is browser-only, and it's a **compile error** to put `wasmexport` on a `js/wasm` build.
2. "TinyGo is required for WASI": **false since [1.21]**; std Go has native `wasip1`. TinyGo is now a size/embedded/Component-Model choice.
3. "Std Go supports WASI Preview 2 / the Component Model": **it doesn't** (through 1.26); only TinyGo (`-target=wasip2`) does.
4. `misc/wasm/wasm_exec.js`: **moved to `lib/wasm/` [1.24]**; and wasip1 doesn't use `wasm_exec.js` at all.
5. `http.ListenAndServe` under wasip1: no socket creation in P1; need `dispatchrun/net` (renamed from `stealthrocket/net`) + an extended host.
6. Mixing the ports: `syscall/js` is js-only; `go:wasmimport`/`export` are wasip1-only.
7. Stale type rules: `string` is **parameter-only**; **`int`/`uint`/slices/maps/chans/interfaces are never allowed**; pointers *inside* structs forbidden; **multiple results unsupported** (backend rejects >1).
8. Suggesting `GOWASM=signext,satconv` (**ignored [1.26]**. And citing "~7× heap, never returns memory" (#59061)) **substantially fixed [1.26]** for heaps < ~16 MiB.
9. Assuming goroutine parallelism / `GOMAXPROCS` helps: single-threaded; `GOWASM=threads` never landed; background goroutines pause when a `wasmexport` returns.
10. Forgetting `runtime.KeepAlive` on pointers handed to WASI: the GC can't track `uint32`-encoded pointers and may reclaim them mid-call.
11. `wasm-opt` as a silver bullet for Go (modest; strip-debug + compress matter more); instantiating a c-shared reactor with `_start` instead of `_initialize`.
12. Picking wasmtime/wasmer by reflex: they need **cgo**, forfeiting Go's static-binary/cross-compile story; default to wazero (pure-Go).

---

## See Also {#see-also}
- [platform-and-build.md](platform-and-build.md#wasm): cross-compilation, `GOOS`/`GOARCH` matrix, build tags
- [cgo-and-interop.md](cgo-and-interop.md#wasmexport): `go:wasmimport`/`export` ABI, `unsafe.Pointer`, `structs.HostLayout`
- [concurrency.md](concurrency.md): goroutine semantics that change under single-threaded wasm
- [modern-go.md](modern-go.md#quick-ref): version feature matrix (1.21-1.26)

## Sources {#sources}
- go.dev/doc/go1.24, go1.26 release notes (WebAssembly sections); go.dev/doc/go1.25 (no wasm changes)
- pkg.go.dev/cmd/compile (WebAssembly Directives: type table, pointer rules, `string` parameter-only); `go help buildmode` (c-shared on wasip1)
- go.dev/blog/wasi; go.dev/blog/wasmexport; go.dev/wiki/WebAssembly
- wazero.io and github.com/tetratelabs/wazero (pure-Go, no-cgo, Core 1.0+2.0, interpreter on any GOARCH)
- tinygo.org/docs/guides/webassembly/{wasm,wasi}; tinygo.org/blog (0.41 release: Go 1.26 + wasip1/wasip2); tinygo-org/tinygo #4843 (wasip2 world)
- Proposals/issues: #65333 (`GOOS=wasip2`, open), #56305 (`GOWASM=threads`, not landed), #59061 (wasm memory), #32591 (`syscall/js` ~10× slower), #59149 (wasmimport package restriction lifted)
- github.com/dispatchrun/net (formerly stealthrocket/net); go.bytecodealliance.org (wit-bindgen-go)
