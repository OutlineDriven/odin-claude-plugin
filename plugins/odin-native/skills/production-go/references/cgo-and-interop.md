# CGo and C Interoperability

cgo is not Go: it severs trivial cross-compilation, dynamically links your binary, blocks an OS thread per blocking call, and "features out" your tracebacks/pprof across the boundary. The boundary itself is cheap (~20-40 ns, **~30% cheaper in 1.26**), not the ~200 ns folklore. Reach for it only when no pure-Go path exists; and before you do, weigh **purego** (dlopen/dlsym, no toolchain) and **wazero** (C-to-Wasm, sandboxed). When you must, the pointer rules + `runtime.Pinner`/`cgo.Handle` keep you out of GC-corruption territory.

> Verified against Go **1.26.1** (stable) + **1.27 RC** notes, 2026-06, against go.dev/cmd/cgo, the runtime docs, and the 1.21/1.24/1.26 release notes. Version tags `[1.N]` mark the release a claim applies to. Deepened from deep-research + primary sources.

## TL;DR: the modern deltas (read first)

- `GODEBUG=cgocheck=2` no longer exists [1.21]. The thorough pointer checker became a *build-time* `GOEXPERIMENT=cgocheck2`. `GODEBUG=cgocheck=1` (cheap, default) and `=0` (off) remain. Models emit `cgocheck=2` constantly; stale since 1.21.
- `checkptr` is a different thing from `cgocheck`; a compiler instrumentation (`-gcflags=all=-d=checkptr`, on under `-race`) that catches `unsafe.Pointer` *conversion/arithmetic* abuse, not the cgo pointer-passing rules. Don't conflate them.
- `runtime.Pinner` [1.21] is the modern answer, not "copy into `C.malloc`," whenever C must hold a Go pointer past a call or you pass a struct/slice that *contains* a Go pointer. `cgo.Handle` [1.17] is for threading an interface/closure/context through a C `void*`.
- cgo is NOT ~200 ns. It's ~20-40 ns single-threaded on modern hardware, and **1.26 cut baseline overhead ~30%** (release notes, verbatim). Old CockroachDB/Go-1.5 numbers are a decade stale.
- `#cgo noescape` / `#cgo nocallback` shipped in [1.24], not 1.23 (reverted there). They are *unsafe* performance assertions: misuse → corruption (`noescape`) or panic (`nocallback`).
- Avoid cgo when you can. `CGO_ENABLED=0` + `netgo,osusergo` gives static `scratch`/distroless images and trivial cross-compile. See [platform-and-build.md](platform-and-build.md#cross-compile).

## Table of Contents
1. [CGo Basics](#basics)
2. [Type Mapping](#type-mapping)
3. [String and Byte Conversions](#string-byte)
4. [Memory Management](#memory)
5. [Go Pointer Passing Rules](#pointer-rules)
6. [runtime.Pinner vs cgo.Handle vs C.malloc](#pinner-handle)
7. [Callbacks: Calling Go from C](#callbacks)
8. [Static vs Dynamic Linking](#linking)
9. [Cross-Compilation with CGo](#cross-compile)
10. [CGo Performance](#performance)
11. [Pure Go Alternatives](#pure-go)
12. [go:wasmexport as a Plugin Alternative](#wasmexport)
13. [Anti-Patterns](#anti-patterns)
14. [Version map 1.20→1.27](#versions)
15. [What models get wrong](#stale)

---

## CGo Basics {#basics}

C declarations go in a comment **immediately** before `import "C"`; no blank line between, or the preamble is silently ignored.

```go
package main

// #include <stdlib.h>
// void greet(const char* name);
import "C"
import "unsafe"

func main() {
    name := C.CString("World")
    defer C.free(unsafe.Pointer(name)) // CString mallocs; GC will NOT free it
    C.greet(name)
}
```

Access C types/functions via the `C` pseudo-package: `C.int`, `C.struct_stat`, `C.enum_color`, `C.sizeof_int`. `#cgo` directives tweak the toolchain:

```go
// #cgo CFLAGS: -DPNG_DEBUG=1 -I/usr/local/include
// #cgo LDFLAGS: -L/usr/local/lib -lpng -lz
// #cgo pkg-config: libpng cairo
// #cgo linux LDFLAGS: -lrt
// #cgo darwin LDFLAGS: -framework CoreFoundation
// #cgo LDFLAGS: -L${SRCDIR}/libs -lfoo   // ${SRCDIR} → absolute src dir
import "C"
```

`CFLAGS/CPPFLAGS/CXXFLAGS/FFLAGS/LDFLAGS`; a platform constraint (`linux`, `!windows`, `amd64 386`) prefixes the flag name. For security cgo allows only a limited flag set (`-D -U -I -l` plus a few); widen with `CGO_CFLAGS_ALLOW` (must match a *full* argument). `cmd/cgo -ldflags` [1.23] threads large `CGO_LDFLAGS` past "argument list too long."

Three things Go's cgo can't do, and the workarounds: (1) **call variadic C functions**: wrap in a non-variadic `static` helper; (2) **call C function pointers directly**: but you *can* hold a `C.intFunc`-typed value and pass it back, and C may call function pointers received from Go; (3) **declare Go methods on C types** [error since 1.21, also via alias since 1.24]. `errno` arrives as a second return in multiple-assignment: `n, err := C.setenv(...)`; but **check the primary result first**, errno may be non-zero on success.

---

## Type Mapping {#type-mapping}

Numeric: `C.char`→`int8`, `C.schar`/`C.uchar`, `C.short`/`C.ushort`→16-bit, `C.int`/`C.uint`→32-bit, `C.long`/`C.ulong`→**platform-dependent** (64-bit on LP64 Linux/macOS, 32-bit on Windows; a portability trap), `C.longlong`/`C.ulonglong`→64-bit, `C.float`/`C.double`, `C.size_t`. `void*`→`unsafe.Pointer`; `__int128_t`→`[16]byte`. Aggregates: `struct foo`→`C.struct_foo`, `union foo`→`C.union_foo` (Go byte array of the same size; no field access), `enum foo`→`C.enum_foo`. C keyword fields clash: access C's `type` field as `x._type`. Bit-fields/misaligned fields are **omitted** (replaced by padding); you cannot read them from Go.

cgo types are **unexported** per-package: a `C.foo` in package A is a *different type* from `C.foo` in package B. **Never expose C types in your package's exported API**: wrap them. Special handle types (CoreFoundation `*Ref`, JNI `jobject`, EGL `EGLDisplay`/`EGLConfig`) are `uintptr`, not pointers, so the GC ignores them; initialize them with `0`, not `nil`.

---

## String and Byte Conversions {#string-byte}

| Function | Direction | Allocates on | Free? |
|---|---|---|---|
| `C.CString(string)` | Go → C | C heap (malloc) | **Yes**: `C.free` |
| `C.CBytes([]byte)` | Go → C | C heap (malloc) | **Yes**: `C.free` |
| `C.GoString(*C.char)` | C → Go | Go heap (copy) | No |
| `C.GoStringN(*C.char, C.int)` | C → Go, explicit len | Go heap (copy) | No |
| `C.GoBytes(unsafe.Pointer, C.int)` | C → Go | Go heap (copy) | No |

`C.GoString*` and `C.GoBytes` **copy** into Go memory; safe to keep after C frees. `C.CString`/`C.CBytes` **malloc** on the C heap; the GC never touches them; you must `C.free`.

**Zero-copy view of a C array** [1.17]: no allocation, *aliases* C memory (dangling if C frees):

```go
b := unsafe.Slice((*byte)(cArray), n)   // []byte view over C memory; do NOT retain past C's lifetime
s := unsafe.String((*byte)(cArray), n)  // string view (immutable assumption — never mutate underlying C mem)
```

A C function can also take a Go string directly via the special `_GoString_` parameter type; but the contents are pinned only for the call and **may lack a trailing NUL**; C must not retain or modify them.

---

## Memory Management {#memory}

Golden rule: whoever allocates frees, with the *matching* allocator. The GC manages only Go memory.

| Allocated by | Freed by | Mechanism |
|---|---|---|
| `C.CString` / `C.CBytes` / `C.malloc` | Go code | `C.free(unsafe.Pointer(p))` |
| C library function | per library API | library-specific free |
| Go (`new`, `make`, `&T{}`) | GC | automatic (subject to pointer rules) |

```go
cs := C.CString(s)
defer C.free(unsafe.Pointer(cs)) // MUST — Go GC does NOT collect C memory
C.use(cs)
```

`C.malloc` is special: it wraps libc malloc but **crashes the program on OOM (never returns nil)**, so there is no errno form. **Cleanup for wrapped C resources: prefer `runtime.AddCleanup` [1.24] over `runtime.SetFinalizer`**; multiple cleanups per object, attachable to interior pointers, no cycle leaks, no delayed free. But a `defer C.free` at the call site is still clearer than any finalizer when the lifetime is scoped. **Leak detection:** `go build -asan` detects C-side leaks at exit [1.25].

```go
type Buf struct{ p unsafe.Pointer }
func NewBuf(n int) *Buf {
    b := &Buf{p: C.malloc(C.size_t(n))}
    runtime.AddCleanup(b, func(p unsafe.Pointer) { C.free(p) }, b.p) // [1.24] cleanup ≠ the object's own ptr
    return b
}
```

---

## Go Pointer Passing Rules {#pointer-rules}

These exist because Go's GC **moves** objects and must locate every Go pointer. "Go pointer" vs "C pointer" is a **dynamic** property of how the memory was allocated, *not* the pointer's type. The current `cmd/cgo` rules (go1.26.1, verbatim-derived):

1. **All Go pointers passed to C must point to *pinned* Go memory.** Function arguments are **implicitly pinned for the duration of the call**: the simple case needs nothing.
2. **You may pass a Go pointer to C only if the pointed-to memory contains no Go pointers to *unpinned* memory.** Scope matters: passing `&s.field`, the relevant memory is *the field*; passing `&arr[i]` (or a slice element), it's the **entire backing array**.
3. **C may keep a copy of a Go pointer only while that memory stays pinned**: and may *not* keep it past the call unless pinned via `runtime.Pinner` and not unpinned while stored. This is why C can never retain a `string`, `[]T`, `map`, `chan`, `func`, or `_GoString_`: they contain Go pointers and **cannot be pinned**.
4. **An exported Go function may return a Go pointer only to *pinned* memory** (so never a string/slice/map/chan).

Types that always contain Go pointers (cannot cross as raw values): `interface`, `chan`, `map`, `func`. `string`/`[]T`/`struct`/array may or may not, by construction.

```go
// WRONG — struct embeds a Go pointer → "cgo argument has Go pointer to unpinned Go pointer" (panic)
type Pet struct{ owner *Person }
p := &Pet{owner: &Person{age: 50}}
C.print_pet((*C.pet_t)(unsafe.Pointer(p)))

// RIGHT [1.21] — pin the nested pointer for the call
var pin runtime.Pinner
defer pin.Unpin()
owner := &Person{age: 50}
pin.Pin(owner)
p := &Pet{owner: owner}
C.print_pet((*C.pet_t)(unsafe.Pointer(p)))
```

Checks are dynamic, via GODEBUG:

```bash
GODEBUG=cgocheck=1 ./app        # DEFAULT — cheap dynamic checks
GODEBUG=cgocheck=0 ./app        # disable
GOEXPERIMENT=cgocheck2 go build # thorough, BUILD-TIME only [1.21]  (was GODEBUG=cgocheck=2 ≤1.20)
```

The write-barrier checker throws `unpinned Go pointer stored into non-Go memory`. **Distinct from `checkptr`** (`-d=checkptr`, on under `-race`), which catches `unsafe.Pointer` conversion/arithmetic abuse and throws `checkptr: unsafe pointer conversion`; a different failure class. **Documented cgo bug to know:** writing into uninitialized C memory whose bytes *look like* a Go pointer can trigger a spurious runtime error; **zero out C memory in C before passing it to Go** if Go will store pointers there.

---

## runtime.Pinner vs cgo.Handle vs C.malloc {#pinner-handle}

| Scenario | Use |
|---|---|
| Go string/buffer to C for **one call** | `C.CString`+`defer C.free`, or pass `&buf[0]` (implicitly pinned) |
| C **writes into** a Go buffer for one call | pass `unsafe.SliceData(buf)`, optionally `Pin` it |
| C **retains** a Go pointer past the call | `runtime.Pinner` [1.21] |
| Struct/slice **containing** a Go pointer | `runtime.Pinner` on the nested pointer(s) |
| Pass an **interface / closure / context** opaquely through C | `cgo.Handle` [1.17] |
| C must **own** the lifetime / pure C struct | `C.malloc` + `C.free` |

### runtime.Pinner [1.21]

```go
type Pinner struct{ /* unexported; zero value ready */ }
func (p *Pinner) Pin(pointer any) // arg MUST be a pointer or unsafe.Pointer (else panic)
func (p *Pinner) Unpin()          // unpins ALL objects pinned by p
```

`Pin` prevents the GC moving/freeing an object until `Unpin`. The **Pinner must stay alive as long as C holds the pointer**: a `defer pin.Unpin()` keeps it referenced for the scope. Reuse a Pinner (it's encouraged, to amortize init). Three traps: **it does not recurse** (each nested Go pointer needs its own `Pin`); **you cannot pin a string/slice/map/chan** directly; pin `unsafe.StringData(s)` / `unsafe.SliceData(b)`; and **don't `Unpin` early** while C still references it. A leaked pinned pointer makes the GC panic (`pinnerLeakPanic`).

```go
var pin runtime.Pinner
defer pin.Unpin()
buf := make([]byte, 4096)
pin.Pin(unsafe.SliceData(buf))                          // pin the DATA, not the slice header
C.read_into(unsafe.Pointer(&buf[0]), C.size_t(len(buf)))
```

### runtime/cgo.Handle [1.17]

```go
type Handle uintptr
func NewHandle(v any) Handle // valid until Delete
func (h Handle) Value() any  // panics if invalid
func (h Handle) Delete()     // MUST call, or it leaks in a global map
```

A `Handle` is an **integer**, not a pointer, so it threads a Go value *containing Go pointers* (closures, interfaces, context) through a C `void*` **without** breaking the pointer rules. Backed by a global `sync.Map`; the zero value is never valid (a safe C sentinel). **You must `Delete()`** when C is done. Subtlety models miss: if you pass `unsafe.Pointer(&h)` (the Handle's *address*) and C retains it past the call, the `h` variable itself must be kept alive/pinned. Never coerce a `Handle` integer to an `unsafe.Pointer`.

Pinner vs Handle in one line: Pinner when C needs a real *Go pointer* to live Go memory; Handle when C needs *no* Go pointer at all (just an opaque token to recover a value in a callback). Handle pays map/lock cost per New/Delete; Pinner is cheaper and reusable but pointer-only.

---

## Callbacks: Calling Go from C {#callbacks}

### //export pattern

```go
// extern int goAdd(int a, int b);        // DECLARATION ok in an //export file's preamble
import "C"

//export goAdd
func goAdd(a, b C.int) C.int { return a + b }
```

Preamble restriction (verbatim from cmd/cgo): a file using `//export` may contain only **declarations** in its preamble, never **definitions**: the preamble is copied into two C outputs, so a definition yields duplicate symbols and a link failure. Put definitions in a separate `.c` file (or a non-`//export` Go file's preamble). Multiple Go return values map to a generated `_return` struct; Go struct/array params aren't exportable (use a C struct / C pointer).

### Closure context via cgo.Handle (the canonical pattern)

You **cannot** pass a Go closure to C as a function pointer. Export a top-level function and thread per-call context through the C API's `void*` user-data argument as a `cgo.Handle`:

```go
/*
extern void goCallback(void* ctx, int value);
static inline void doWork(void* ctx) { goCallback(ctx, 42); }
*/
import "C"

//export goCallback
func goCallback(ctx unsafe.Pointer, value C.int) {
    h := *(*cgo.Handle)(ctx)
    h.Value().(func(int))(int(value))
}

func main() {
    h := cgo.NewHandle(func(v int) { fmt.Println(v) })
    defer h.Delete()
    C.doWork(unsafe.Pointer(&h)) // pass &h; h stays alive for the call
}
```

Cost asymmetry: C→Go is markedly pricier than Go→C; the runtime must set up a goroutine/stack context for arbitrary Go code. [1.21] made per-thread setup *persist across calls on Unix*, cutting subsequent C→Go calls from **~1-3 µs to ~100-200 ns** (release notes, verbatim). Bench figures around ~50 ns Go→C vs ~150 ns C→Go are illustrative, hardware-specific `[verify]`.

---

## Static vs Dynamic Linking {#linking}

**cgo flips the default to a dynamically-linked binary** (external linker) on Unix, because static linking against glibc is discouraged. Pure Go links static by default. The stdlib cgo users are `net` (DNS) and `os/user`; importing them can pull in libc → dynamic; **on macOS [1.20] rewrote both to pure Go**, but elsewhere use the build tags.

```bash
# Fully static WITH cgo — needs BOTH flags + a static-friendly libc (musl)
CGO_ENABLED=1 CC=musl-gcc go build \
  -ldflags '-linkmode external -extldflags "-static"' -o app .

# Force pure-Go net/user (still allows other cgo)
CGO_ENABLED=1 go build -tags 'netgo osusergo' -o app .

# Cleanest static, no C deps, trivial cross-compile, runs on scratch/distroless:
CGO_ENABLED=0 go build -o app .
```

| `CGO_ENABLED` | Behavior |
|---|---|
| `1` | cgo on (default for native builds with a C compiler) |
| `0` | cgo off (default when cross-compiling or no `CC` found); static, no C deps |

Key env: `CC`, `CXX`, `CGO_CFLAGS`, `CGO_LDFLAGS`, `CGO_CFLAGS_ALLOW`/`_DISALLOW`, and `CC_FOR_TARGET` / `CC_FOR_${GOOS}_${GOARCH}` for cross builds. **Container trap:** a glibc-linked cgo binary breaks on Alpine (musl); build with musl or stay `CGO_ENABLED=0`. Internal linking of cgo programs reached `windows/arm64` [1.26] and `linux/loong64` [1.25].

---

## Cross-Compilation with CGo {#cross-compile}

Pure Go cross-compiles by setting `GOOS`/`GOARCH`. **cgo needs a full C cross-toolchain for the target.** See [platform-and-build.md](platform-and-build.md#cross-compile) for the matrix.

```bash
# Native cross C compiler
GOOS=linux GOARCH=arm64 CGO_ENABLED=1 CC=aarch64-linux-gnu-gcc go build -o app .

# Zig bundles cross toolchains — one tool, many targets
GOOS=linux GOARCH=amd64 CGO_ENABLED=1 CC="zig cc -target x86_64-linux-gnu" go build -o app .

# Docker-based, multi-target
xgo --targets=linux/amd64,linux/arm64,windows/amd64 ./cmd/app
```

Guidance: (1) avoid cgo if you can; `CGO_ENABLED=0` makes this a non-problem; (2) if required, `zig cc` or a Docker builder; (3) in CI, prefer one job per target with a native compiler; (4) test on real targets. [1.27 RC] switches big-endian `linux/ppc64` to the ELFv2 ABI (cgo/PIE/external linking); re-check if you target it.

---

## CGo Performance {#performance}

| Operation | Approx cost | Notes |
|---|---|---|
| Inlined / non-inlined Go call | ~0.3-2 ns | baseline (cgo calls can't inline) |
| Go→C call (1.21-1.25) | ~20-40 ns | hardware-dependent |
| **Go→C call (1.26)** | **~30% lower** | release notes: "baseline runtime overhead of cgo calls reduced by ~30%" |
| Go→C, high parallelism | ~4-6 ns/op | scales near-linearly with cores |
| C→Go call | higher than Go→C | goroutine/stack setup; ~100-200 ns subsequent-call after [1.21] |

The old "~170-200 ns" figure is a decade stale. **1.26 mechanism `[verify]`:** secondary analysis + golang/go #58492 attribute the ~30% to removing the dedicated syscall processor state on the transition; **the release notes give only the "~30%" figure**: treat the mechanism and any ns/op numbers (e.g. ~19 ns M1) as illustrative, not guaranteed.

Why blocking cgo is expensive in aggregate: C has no growable stack and no scheduler awareness, so a call saves goroutine state and switches to the OS-thread stack. A **blocking** cgo call **occupies a real OS thread the scheduler can't reclaim**: many concurrent blocking calls spawn hundreds of threads and can hit `debug.SetMaxThreads`/`ulimit`. **`GOMAXPROCS` does not bound C threads or blocking cgo calls**; actual parallelism can exceed it. [1.25] made the `GOMAXPROCS` default cgroup-aware and dynamic (disable via `GODEBUG=containermaxprocs=0` / `updatemaxprocs=0`); [1.26] keeps it.

Reducing overhead: (1) **batch**; N items per call (pass `&data[0]`+len to a C loop) instead of N calls; (2) `#cgo noescape`/`#cgo nocallback` [1.24] *after verifying* the C function's behavior (below); (3) keep hot paths pure Go; (4) `unsafe.Slice` for zero-copy. **Benchmark fairly:** compare against a *non-inlined* Go func (`-gcflags=-l`) and use `testing.B.Loop` [1.24], which keeps args/results alive ([1.26] additionally stopped `B.Loop` from suppressing inlining of the body).

### #cgo noescape / #cgo nocallback [1.24]

```go
/*
#cgo noescape   fast_hash   // memory passed to fast_hash does NOT escape (allow stack alloc)
#cgo nocallback fast_hash   // fast_hash does NOT call back into Go (skip callback prep)
extern unsigned long fast_hash(const void* p, size_t n);
*/
import "C"
```

These are **unsafe performance assertions**, not free wins. `noescape` suppresses the heap-escape that normally keeps the object alive; **if the C function retains the pointer, you get crashes / memory corruption.** `nocallback` skips callback setup; **if the C function does call back into Go, the program panics.** Targeted for 1.23, **reverted** (crypto/boring miscompile, #63739), first shipped enabled in **[1.24]**. Use only after verifying the C function neither retains pointers nor re-enters Go, and benchmark the win.

---

## Pure Go Alternatives {#pure-go}

Before reaching for cgo, check for a pure-Go path; it preserves `CGO_ENABLED=0`, trivial cross-compile, fast builds, and full tooling.

| C library | Pure-Go alternative | Notes |
|---|---|---|
| SQLite | `modernc.org/sqlite` | C transpiled to Go (no cgo) |
| SQLite | `ncruces/go-sqlite3` | SQLite-on-Wasm via wazero |
| libpng/libjpeg | `image/png`, `image/jpeg` | stdlib |
| OpenSSL | `crypto/*` | stdlib TLS/hashing |
| libsodium | `golang.org/x/crypto` | NaCl, Argon2 |
| libpcap | `google/gopacket/pcapgo` | pure-Go capture (main `pcap` uses cgo) |
| libgit2 | `go-git/go-git/v5` | pure-Go Git |
| libcurl / zlib | `net/http` / `compress/gzip` | stdlib |
| gRPC C core | `google.golang.org/grpc` | pure-Go gRPC |

purego (`github.com/ebitengine/purego`): call C **shared libraries without cgo** via `Dlopen`/`Dlsym` + `RegisterLibFunc`/`SyscallN`/`NewCallback`. Works with `CGO_ENABLED=0` (cross-compile, faster builds, smaller binaries, no per-call C wrapper) and as a cgo fallback. **Same pointer-lifetime rules as cgo**; C must not retain Go memory; non-NUL strings are copied into purego-owned memory valid only for that call; struct padding is your responsibility. Caveats: platform support is **tiered and evolving** (verify your GOOS/GOARCH at build time `[verify]`); on amd64 `SyscallN` mishandles mixed int/float and >8 float args.

wazero (`github.com/tetratelabs/wazero`): pure-Go WebAssembly runtime, **no cgo, zero deps beyond Go + x/sys**. Compile C/Rust/etc. to Wasm and run it from Go with full cross-compile and sandboxing. The compiler (AOT) backend is ~an order of magnitude faster than the interpreter; the interpreter has no arch-specific code (runs anywhere, e.g. riscv64). Trade-off: sandbox-boundary cost, and Wasm sees only numeric types (Go host functions bridge the rest).

Escalation order: pure-Go reimplementation → **purego** (lib is a shared object on target) → **wazero** (untrusted/portable C, want sandbox + cross-compile) → **cgo** (tight FFI to a specific native lib, can manage a C toolchain).

---

## go:wasmexport as a Plugin Alternative {#wasmexport}

Export Go functions to a WebAssembly host without cgo [1.24]:

```go
//go:wasmexport add
func add(a, b int32) int32 { return a + b }

func main() {} // required; not called in reactor/library mode
```

```bash
GOOS=wasip1 GOARCH=wasm go build -buildmode=c-shared -o plugin.wasm  # reactor mode [1.24]
```

| Aspect | `go:wasmexport` | `//export` (cgo) |
|---|---|---|
| Cross-compilation | trivial | needs C cross-compiler |
| Sandboxing | full Wasm sandbox | none |
| Performance | slower than native; sandbox cost | ~20-40 ns boundary/call (1.26: ~30% lower) |
| Type support | numeric, bool, string, pointers [1.24] | full C types |
| Parallelism | single-threaded | full multi-threading |

Limits: single-threaded, no maps/slices/channels across the boundary, serialization overhead for rich data. Full WASM detail: [wasm-and-embedded.md](wasm-and-embedded.md#wasmexport).

---

## Anti-Patterns {#anti-patterns}

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| `GODEBUG=cgocheck=2` | removed [1.21] | `GOEXPERIMENT=cgocheck2` at build time |
| "cgo is ~200 ns" | decade stale; it's ~20-40 ns, −30% in 1.26 | benchmark vs non-inlined Go (`-gcflags=-l`) |
| Forgetting `C.free` after `C.CString` | leak; GC ignores C memory | `defer C.free(unsafe.Pointer(cs))` |
| Blank line before `import "C"` | preamble silently ignored | no blank line between comment and import |
| `malloc`-copy for "C writes into Go buffer" | obsolete since [1.21] | `runtime.Pinner` |
| Pinning a slice/string header | pins the wrong memory | pin `unsafe.SliceData`/`StringData` |
| Expecting `Pinner.Pin` to recurse | it doesn't | pin each nested Go pointer |
| Passing a Go func value to C | can't convert closure → C fn ptr | `//export` gateway + `cgo.Handle` via `void*` |
| C definitions in an `//export` preamble | duplicate-symbol link error | `static inline` or a separate `.c` file |
| Leaking a `cgo.Handle` | lives in a global map | `Delete()` when C is done |
| `import "C"` in `*_test.go` | unsupported | test the Go wrappers |
| cgo in hot loops | ~20-40 ns/call adds up | batch, or keep hot path pure Go |
| Unbounded blocking cgo calls | each pins an OS thread → thread blowup | bound concurrency; watch `debug.SetMaxThreads` |
| Assuming `GOMAXPROCS` bounds C threads | it doesn't | bound at the call site |
| `os.Getenv` after `C.setenv` | Go caches a different env copy | read with `C.getenv`, or don't mix |
| Passing uninitialized C mem to Go that stores ptrs | spurious "Go pointer" runtime error | zero the C memory in C first |

---

## Version map 1.20→1.27 {#versions}

| Ver | cgo/interop-relevant |
|---|---|
| **1.20** | cgo auto-disabled when no `CC`; macOS `net`/`os/user` rewritten pure-Go; `cgo.Incomplete` marker |
| **1.21** | **`runtime.Pinner`**; `GODEBUG=cgocheck=2` → build-time `GOEXPERIMENT=cgocheck2`; C→Go per-thread setup persists (~1-3 µs → ~100-200 ns); error on Go methods on C types; loong64 `c-archive`/`c-shared`/`pie` |
| **1.22** | Windows SEH preservation; `runtime/cgo` supplied to linker for external-link compatibility |
| **1.23** | `cmd/cgo -ldflags`; `noescape`/`nocallback` targeted then **reverted** (#63739) |
| **1.24** | **`#cgo noescape` / `#cgo nocallback`** ship; `runtime.AddCleanup` (prefer over `SetFinalizer`); `go:wasmexport` + `wasip1 -buildmode=c-shared`; cgo type-via-alias method error; `B.Loop` |
| **1.25** | `-asan` detects C leaks at exit; `GOMAXPROCS` cgroup-aware + dynamic; loong64 cgo internal linking + race + `SetCgoTraceback` |
| **1.26** | **cgo baseline overhead −30%**: heap base-address randomization (security; `GOEXPERIMENT=norandomizedheapbase64` opt-out); `crypto/subtle.WithDataIndependentTiming` propagates DIT across cgo; `windows/arm64` cgo internal linking; `B.Loop` stops suppressing inlining |
| **1.27 (RC)** | big-endian `linux/ppc64` → ELFv2 ABI (cgo/PIE/external linking). Treat as draft until GA (~Aug 2026). |

---

## What models get wrong {#stale}

1. Emitting `GODEBUG=cgocheck=2`; **removed [1.21]**: it's build-time `GOEXPERIMENT=cgocheck2`. `cgocheck=0/1` GODEBUG remain (1 = default).
2. Conflating `cgocheck` (cgo pointer-passing checks) with `checkptr` (`unsafe.Pointer` conversion/arithmetic instrumentation, on under `-race`); different mechanisms, different panics.
3. Claiming cgo is ~200 ns; **stale**; ~20-40 ns single-threaded, **−30% in 1.26**.
4. Hand-rolling `C.malloc`-copy for "C writes into a Go buffer" / "struct contains a Go pointer"; use `runtime.Pinner` [1.21].
5. Assuming `Pinner.Pin` recurses (it doesn't) or pinning a slice/string *header* instead of `unsafe.SliceData`/`StringData`.
6. Passing a Go closure to C as a function pointer; use an `//export`ed func + `cgo.Handle` through `void*`.
7. Putting C **definitions** in an `//export` file's preamble → duplicate-symbol link error (declarations only).
8. Forgetting `cgo.Handle.Delete()` (leaks the global map); and if C keeps `&h`, not keeping `h` alive (#68044).
9. Misattributing `#cgo noescape`/`#cgo nocallback` to 1.23; they shipped in **[1.24]** (reverted in 1.23); and using them without verifying the C function (corruption / panic).
10. Assuming `GOMAXPROCS` bounds C/cgo threads, or that goroutine-cheapness carries into C; blocking cgo pins OS threads; [1.25] also changed the `GOMAXPROCS` default (cgroup-aware).
11. Returning a Go pointer to unpinned memory from an exported function, or letting C retain a string/slice/map/chan.
12. Exposing `C.*` types in a package's public API (they're unexported and per-package-distinct).
13. Reaching for cgo at all when `modernc.org/sqlite`, purego, or wazero would keep the build pure-Go and cross-compilable.

---

## See Also {#see-also}
- [platform-and-build.md](platform-and-build.md#cross-compile); `CGO_ENABLED`, GOOS/GOARCH matrix, static images
- [internals.md](internals.md); `unsafe` package, memory model, compiler directives, the moving GC
- [wasm-and-embedded.md](wasm-and-embedded.md#wasmexport); `go:wasmexport`, wazero host functions
- [performance.md](performance.md#runtime-costs); ns/op reference for common operations

## Sources {#sources}
- go.dev/cmd/cgo (go1.26.1: Passing pointers, Optimizing calls of C code, C references to Go); pkg.go.dev/{runtime#Pinner, runtime/cgo#Handle}
- go.dev/doc/go1.21 (cgocheck2, Pinner, C→Go thread setup), go1.24 (noescape/nocallback, AddCleanup, B.Loop, wasmexport), go1.25 (GOMAXPROCS, -asan), go1.26 ("Faster cgo calls" −30%, heap randomization)
- go.dev/blog/cgo; go.dev/wiki/cgo; runtime/cgocheck.go (`unpinned Go pointer stored into non-Go memory`)
- Accepted proposals/issues: Pinner #46787; noescape/nocallback #56378 (reverted #63739); cgo speedup #58492 (mechanism unverified vs release notes); Handle lifetime #68044
- ebitengine/purego, tetratelabs/wazero, modernc.org/sqlite repos
