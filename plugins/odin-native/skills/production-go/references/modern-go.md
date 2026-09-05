# Modern Go Features (1.18 → 1.27)

LLM pre-training is dominated by pre-1.22 Go: per-loop variables, `interface{}`, `sort.Slice`, manual `errors.As`, `rand.Seed`. This file is the **freshness anchor** ; what changed, the one idiom to use now, and the trap. It deliberately touches many topics; each entry stays terse and cross-links the deep treatment via **See also**. Every entry answers: *what would an agent get WRONG without this?*

> Source horizon: verified against Go **1.26.x** (stable) + **1.27 RC** draft notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md) and the 1.27 entries were checked against the final notes. Version tags `[1.N]` mark the release a feature became available; `[1.N exp]` = GOEXPERIMENT/experimental. Baseline assumed: **1.22**.

## TL;DR: the deltas models miss most {#tldr}

- Loop variables are per-iteration since [1.22]: `v := v` is dead; `go func(){ use(v) }()` in a `for range` is now safe. The single highest-frequency stale pattern in generated Go.
- `math/rand/v2` [1.22] auto-seeds: `rand.Seed(...)` is obsolete (top-level `Seed` is a no-op since [1.24]); use `rand.IntN`/`rand.N[T]`. **`for i := range n` [1.22]** replaces the counting `for`.
- **`min`/`max`/`clear` are builtins [1.21]**; `slices`/`maps`/`cmp` [1.21] replace `sort.Slice` + hand-rolled loops; **`any` replaces `interface{}` [1.18]**.
- `errors.AsType[E]` [1.26] replaces `var e *T; errors.As(err, &e)` (typed, ~zero-alloc, compile-checked); `errors.Join` [1.20] replaces `multierr`.
- `sync.WaitGroup.Go(f)` [1.25] removes `Add`/`Done` boilerplate; **container-aware `GOMAXPROCS` [1.25]** makes `uber-go/automaxprocs` obsolete; **timers/tickers GC'd when unreferenced [1.23]** kills the "always `Stop()` or you leak" rule.
- Green Tea GC is the default [1.26] (10-40% less GC overhead); **arena memory is on hold** : use `sync.Pool`. Language additions: **`new(expr)` [1.26]**, **generic type aliases [1.24]**, **range-over-func + `iter` [1.23]**, **generic methods [1.27]**.

## Table of Contents
1. [Version Quick-Reference Table](#quick-ref)
2. [Iteration & Collections](#iteration)
3. [Concurrency Additions](#concurrency)
4. [Error Handling](#errors)
5. [Type System & Generics](#type-system)
6. [Runtime & GC](#runtime)
7. [Tooling](#tooling)
8. [Anti-Patterns (Old → Modern)](#deprecated)
9. [On Hold: Arena Memory](#arena)
10. [Go 1.27](#go127)
11. [Version map 1.18→1.27](#versions)
12. [What models get wrong](#stale)
13. [See also](#see-also)
14. [Sources](#sources)

---

## Version Quick-Reference Table {#quick-ref}

Scan first. Sections below expand only features needing more than a line. `exp` = behind GOEXPERIMENT.

| Feature | Ver | Status | One line |
|---|---|---|---|
| Generics (type params), `any`, `comparable` | 1.18 | Stable | `func F[T any]`; `any` = `interface{}`; `comparable` constraint |
| Workspaces (`go.work`, `go work`) | 1.18 | Stable | Multi-module dev without `replace` : see `modules-and-dependencies.md` |
| `errors.Join`, multi-`%w` | 1.20 | Stable | Combine errors; `Unwrap() []error` tree: see `errors-and-resilience.md` |
| `context.WithCancelCause`/`Cause` | 1.20 | Stable | Cancel with a specific cause error |
| PGO (profile-guided optimization) | 1.20→1.21 | Stable | Preview 1.20, **GA 1.21**; `default.pgo` in main pkg: see `performance.md` |
| `min`/`max`/`clear` builtins | 1.21 | Stable | `min(a,b,c)` any ordered type; `clear` empties map / zeros slice |
| `slices`/`maps`/`cmp` packages | 1.21 | Stable | Generic slice/map ops; `cmp.Ordered`, `cmp.Compare` |
| `log/slog` | 1.21 | Stable | Structured logging: see `observability.md` |
| `sync.OnceFunc`/`OnceValue`/`OnceValues` | 1.21 | Stable | Type-safe lazy init; replaces `sync.Once`+package var |
| `panic(nil)` → `*runtime.PanicNilError` | 1.21 | Stable | `recover()` after a real panic is never a misleading nil |
| `context.WithoutCancel`/`WithTimeoutCause`/`AfterFunc` | 1.21 | Stable | Cause-carrying + detached contexts |
| Loop variable per-iteration scoping | 1.22 | Stable | Each iteration gets its own var; `v := v` hack is dead |
| Range-over-int (`for i := range n`) | 1.22 | Stable | Replaces `for i := 0; i < n; i++` |
| `math/rand/v2` | 1.22 | Stable | Auto-seeded; `rand.N[T]`, `IntN`; PCG/ChaCha8 sources |
| Enhanced `ServeMux` routing | 1.22 | Stable | `"POST /items/{id}"` + `PathValue` : see `http-and-apis.md` |
| `cmp.Or` | 1.22 | Stable | First non-zero value of its args |
| `go vet` slog / `append` / `time.Since` checks | 1.22 | Stable | Catches mismatched slog kv pairs, no-op append, undeferred `time.Since` |
| Range-over-func (`iter.Seq`/`Seq2`) | 1.23 | Stable | Custom iterators via `func(yield func(V) bool)` : see `advanced-patterns.md` |
| `unique` package | 1.23 | Stable | Value interning; pointer-comparable `Handle[T]` |
| Timer/Ticker GC-eligible + unbuffered channels | 1.23 | Stable | Unreferenced timers GC'd; `Stop()` no longer needed for GC |
| Generic type aliases | 1.24 | Stable | `type Set[T comparable] = map[T]bool` |
| `weak` package + `runtime.AddCleanup` | 1.24 | Stable | Weak pointers; cleanup superseding `SetFinalizer` |
| `os.Root` | 1.24 | Stable | Directory-scoped FS; blocks path traversal: see `security.md` |
| `tool` directive in `go.mod` | 1.24 | Stable | Replaces the `tools.go` blank-import hack |
| `b.Loop()` benchmark loop | 1.24 | Stable | `for b.Loop()` replaces `for i := 0; i < b.N; i++` : see `testing.md` |
| `encoding.TextAppender`/`BinaryAppender` | 1.24 | Stable | Append-to-`[]byte` marshaling (alloc-free) |
| `omitzero` JSON struct tag | 1.24 | Stable | Omits zero values incl. `time.Time` (unlike `omitempty`) |
| `rand.Text` (crypto) | 1.24 | Stable | Crypto-secure random text strings: see `security.md` |
| Post-quantum TLS `X25519MLKEM768` default | 1.24 | Stable | Hybrid KEM on by default: see `security.md` |
| Swiss-table `map` + faster runtime | 1.24 | Stable | ~2-3% CPU, internal |
| `testing/synctest` | 1.24→1.25 | Stable | exp in 1.24 (`GOEXPERIMENT=synctest`), **GA 1.25** : see `testing.md` |
| Container-aware `GOMAXPROCS` | 1.25 | Stable | Reads cgroup limit; `uber-go/automaxprocs` obsolete |
| `sync.WaitGroup.Go()` | 1.25 | Stable | `wg.Go(f)` = `Add(1)`+`go`+`Done()` |
| `runtime/trace.FlightRecorder` | 1.25 | Stable | Always-on trace ring buffer: see `observability.md` |
| `T.Output()` / `T.Attr()` | 1.25 | Stable | `io.Writer` to test log; structured test attributes |
| `reflect.TypeAssert[T]()` | 1.25 | Stable | Alloc-free typed assert from `reflect.Value` |
| `net/http.CrossOriginProtection` | 1.25 | Stable | Built-in CSRF middleware: see `security.md` |
| `slog.GroupAttrs` | 1.25 | Stable | Build a group `Attr` from `[]Attr` |
| `encoding/json/v2` + `jsontext` | 1.25 exp | Experimental | `GOEXPERIMENT=jsonv2`; **GA in 1.27** : see below |
| Green Tea GC default | 1.25→1.26 | Stable | exp 1.25, **default 1.26**; 10-40% less GC overhead |
| `new(expr)` | 1.26 | Stable | `new(computeAge())` → `*int` pointing at the value |
| Self-referential generic types | 1.26 | Stable | `type Adder[A Adder[A]] interface{ Add(A) A }` |
| `errors.AsType[E]()` | 1.26 | Stable | Generic typed error extraction: see `errors-and-resilience.md` |
| `slog.NewMultiHandler()` | 1.26 | Stable | Fan-out to multiple handlers |
| `signal.NotifyContext` cancels with cause | 1.26 | Stable | `context.Cause` returns the signal name |
| `reflect.Type.Fields/Methods/Ins/Outs` iterators | 1.26 | Stable | `for f := range t.Fields()` |
| `go fix` modernizers | 1.26 | Stable | Dozens of fixers; `go fix ./...` auto-modernizes |
| `T.ArtifactDir()` | 1.26 | Stable | Per-test artifact output dir: see `testing.md` |
| `io.ReadAll` speedup | 1.26 | Stable | ~2× faster, ~½ the allocations (automatic) |
| `crypto/hpke` | 1.26 | Stable | Hybrid Public Key Encryption (RFC 9180), see `security.md` |
| Goroutine-leak profile | 1.26 exp | Experimental | `GOEXPERIMENT=goroutineleakprofile`; **GA 1.27** |
| `simd/archsimd` | 1.26 exp | Experimental | Arch-specific SIMD; `GOEXPERIMENT=simd` |
| `runtime/secret` | 1.26 exp | Experimental | Secure erasure of secrets; `GOEXPERIMENT=runtimesecret` : see `security.md` |
| Generic methods | 1.27 | Stable | Methods may declare their own type params |
| `encoding/json/v2` GA | 1.27 | Stable | `encoding/json` now backed by v2; opt out `GOEXPERIMENT=nojsonv2` |
| Arena memory |; | **On hold** | Infectious API + use-after-free; use `sync.Pool` |

---

## Iteration & Collections {#iteration}

**Stops agents generating manual index loops, `sort.Slice`, and membership loops.**

### Range-over-func [1.23]

Custom iterators: `iter.Seq[V]` (`func(yield func(V) bool)`) and `iter.Seq2[K,V]`. Consume with `for v := range myIter`. Stdlib producers: `slices.All`/`Values`/`Backward`, `maps.Keys`/`Values`, `strings.Lines`/`SplitSeq`, `bytes.Lines`; consumers: `slices.Collect`/`Sorted`/`AppendSeq`, `maps.Collect`.

```go
func Filter[T any](s []T, keep func(T) bool) iter.Seq[T] {
    return func(yield func(T) bool) {
        for _, v := range s {
            if keep(v) && !yield(v) { return } // honor early break: yield returns false
        }
    }
}
for v := range Filter(xs, isEven) { use(v) }
```

Trap: a `yield` that returns `false` means the consumer broke out; you **must** stop and return, or you corrupt loop semantics (and `range` panics on a second yield after false). Don't reach for iterators when a plain slice is clearer; they shine for lazy/streaming/composed pipelines. See `advanced-patterns.md#iterators`.

### `slices` / `maps` / `cmp` [1.21]

```go
slices.Sort(s)                                  // not sort.Slice(s, func(i,j int) bool{...})
slices.SortFunc(users, func(a, b User) int { return cmp.Compare(a.Age, b.Age) }) // 3-way: <0,0,>0
if slices.Contains(s, x) { ... }                // not a 4-line loop
m2 := maps.Clone(m); host := cmp.Or(cfg.Host, "localhost") // cmp.Or [1.22]: first non-zero
```

Trap: `slices.SortFunc`/`SortStableFunc`/`slices.CompareFunc` use a **three-way `cmp`** (`-1/0/+1`), *not* the `less bool` of `sort.Slice` ; returning a bool silently mis-sorts. `slices.Sort` on `[]float64` orders NaNs first (it uses `cmp.Less`).

### `min` / `max` / `clear` builtins [1.21]

```go
lo, hi := min(a, b), max(x, y, z)   // any ordered type, ≥1 arg; for floats a NaN arg propagates
clear(m)                            // delete ALL map entries (incl. handling NaN keys correctly)
clear(s)                            // zero all slice elements, length UNCHANGED
```

Trap: `clear(slice)` does **not** set `len` to 0; it zeroes in place. For an empty slice use `s = s[:0]` (keep cap) or `s = nil`.

### `unique` package [1.23]

`unique.Make(v)` returns a pointer-comparable `Handle[T]`: two handles are `==` iff the values are equal. Fast map keys and dedup for high-duplicate data (log parsing, network protocols, symbol tables). Interned values are reclaimed eagerly and in parallel since [1.25]. **Skip** for few duplicates or short-lived values.

### Timer/Ticker GC + unbuffered channels [1.23]

Pre-1.23 an unstopped `time.Timer` leaked until it fired and a `time.Ticker` leaked forever. Now both are **GC-eligible when unreferenced**, and timer channels are **unbuffered** (synchronous), so `Reset`/`Stop` no longer leave a stale value buffered. `Stop()` still *cancels*, but is no longer needed to prevent a leak. Only active for modules whose `go.mod` declares `go 1.23+`. The `asynctimerchan` GODEBUG escape hatch is **removed in [1.27]** (always synchronous). Kills the old "use `NewTimer`+`Reset`, never `time.After` in a loop" advice; `staticcheck SA1015` is obsolete on 1.23+. See `errors-and-resilience.md#retry`.

---

## Concurrency Additions {#concurrency}

Modern sync primitives instead of verbose pre-1.21 patterns. Goroutine lifecycle, `errgroup`, and channel patterns live in `concurrency.md`.

### `sync.WaitGroup.Go()` [1.25]

```go
var wg sync.WaitGroup
for _, job := range jobs {
    wg.Go(func() { process(job) })   // job is per-iteration [1.22], no Add/Done
}
wg.Wait()
```

Removes the `Add(1)` / `defer Done()` mismatch class of bugs. **Trap:** its doc says **`f` must not panic** ; there is no recovery for you, and an unrecovered panic in the goroutine crashes the process. `go vet`'s `waitgroup` analyzer [1.25] also flags `wg.Add` placed *inside* a freshly-spawned goroutine. For error-collecting parallelism use `errgroup`. See `concurrency.md`.

### `sync.OnceValue` / `OnceValues` [1.21]

```go
var loadConfig = sync.OnceValue(func() Config { return mustParse() }) // type-safe lazy singleton
cfg := loadConfig() // computed once, cached; no package-level var + sync.Once
```

### Container-aware `GOMAXPROCS` [1.25]

On Linux the runtime reads the cgroup CPU-bandwidth limit and caps `GOMAXPROCS` to it (and re-checks periodically as limits change). **`uber-go/automaxprocs` is now obsolete** ; delete the blank import. Disabled automatically if you set `GOMAXPROCS` env/`runtime.GOMAXPROCS`; `runtime.SetDefaultGOMAXPROCS()` [1.25] re-enables the default. See `cloud-native.md`.

### Flight Recorder [1.25]

`trace.NewFlightRecorder(cfg)` keeps a low-overhead trace ring buffer in memory; `fr.Start()` at boot, `fr.WriteTo(w)` to snapshot the last few seconds on an incident. Far cheaper than a continuous trace. See `observability.md#runtime-diagnostics`.

### `testing/synctest` [1.24 exp → 1.25 GA]

`synctest.Test(t, func(t){...})` runs goroutines in a "bubble" with a **fake clock** that jumps instantly when all bubbled goroutines block, plus `synctest.Wait()`. Makes timeout/retry/ticker tests deterministic and fast. Experiment in 1.24 (different API), **GA in 1.25** (old `synctest.Run` API removed in 1.26). See `testing.md`.

---

## Error Handling {#errors}

Use `errors.AsType` over the verbose `errors.As` + pre-declared variable; `errors.Join` over third-party multierr. Full treatment: `errors-and-resilience.md`.

### `errors.AsType[E]()` [1.26]

Generic typed extraction: `func AsType[E error](err error) (E, bool)`. No throwaway pointer, reflection-free, ~zero-alloc on the fast path, and a wrong type is a **compile error** (not the runtime panic `errors.As` throws on a bad target).

```go
// MODERN [1.26]
if pe, ok := errors.AsType[*fs.PathError](err); ok {
    log.Printf("failed at %s", pe.Path)
}
// OLD — verbose throwaway pointer; reflection; panics if target type is wrong
var pe *fs.PathError
if errors.As(err, &pe) { /* ... */ }
```

`errors.As` is **not deprecated** (keep it for a dynamically-chosen `target any` or pre-1.26 support); the docs just say "for most uses, prefer `AsType`." Use `errors.Is` for sentinel identity, `AsType` to extract a typed value. **`fmt.Errorf("static")` now allocates the same as `errors.New` [1.26]** : the "use `errors.New` for plain strings" rule is stale. See `errors-and-resilience.md#astype`.

### `errors.Join` + multi-`%w` [1.20]

`errors.Join(errs...)` is nil-safe and builds an `Unwrap() []error` tree; `fmt.Errorf` accepts multiple `%w`. **Traps:** `Join` does **not flatten** (loop-`Join` is O(N²), accumulate `[]error`, `Join` once), and `errors.Unwrap` returns **nil** for a Join (type-assert `interface{ Unwrap() []error }` to walk children). Supersedes `uber/multierr` and `hashicorp/go-multierror`. See `errors-and-resilience.md#multi-error`.

---

## Type System & Generics {#type-system}

New language features instead of pre-generics workarounds. Constraint design and "when NOT to use generics" live in `advanced-patterns.md#generics`.

### Generics, `any`, `comparable` [1.18]

`any` is the builtin alias for `interface{}` ; idiomatic everywhere since 1.18. `comparable` constrains to types usable with `==`. Since [1.20] a `comparable` type parameter may be **satisfied** by an ordinary interface even though comparison can panic at runtime (so `map[K]V` with an interface key type instantiates).

```go
func Keys[K comparable, V any](m map[K]V) []K {
    ks := make([]K, 0, len(m))
    for k := range m { ks = append(ks, k) }
    return ks
}
```

### Generic type aliases [1.24]

Type aliases may now be parameterized; useful for gradual refactors and re-exports (preview in 1.23 behind `GOEXPERIMENT=aliastypeparams`, **stable in 1.24**).

```go
type Set[T comparable] = map[T]bool   // parameterized alias
type Result[T any] = pkg.Result[T]    // re-export a generic type from another package
```

### `new(expr)` [1.26]

`new` now accepts an **expression**, not just a type; kills the "temp variable just to take its address" pattern, ideal for optional/pointer JSON fields.

```go
type Person struct{ Age *int `json:"age"` }
p := Person{Age: new(yearsSince(born))}     // not: a := yearsSince(born); p := Person{Age: &a}
s, n := new("hello"), new(42)               // *string, *int
```

### Self-referential generic types [1.26]

A generic type may reference itself in its own constraint (F-bounded polymorphism), for type-safe arithmetic, fluent builders, recursive constraints.

```go
type Adder[A Adder[A]] interface{ Add(A) A }
func Sum[A Adder[A]](xs ...A) (out A) { for _, x := range xs { out = out.Add(x) }; return }
```

---

## Runtime & GC {#runtime}

Production tuning advice; stop recommending obsolete approaches. Deep GC internals: `internals.md#gc`; tuning: `performance.md#gc-tuning`.

### Green Tea GC [default 1.26]

Default since **1.26** (experiment in 1.25). **10-40% reduction in GC overhead**, biggest on programs with many small objects (better marking locality + CPU scalability); a further ~10% on newer amd64 (Ice Lake / Zen 4) via vector scanning. Works with existing `GOGC`/`GOMEMLIMIT`. Opt out: `GOEXPERIMENT=nogreenteagc` (removal expected in 1.27).

### Other automatic wins

`io.ReadAll` ~2× faster / ~½ allocations [1.26]; cgo call overhead −30% [1.26]; Swiss-table `map` + runtime mutex ~2-3% CPU [1.24]; heap base-address randomization on 64-bit [1.26] (security, cgo). All free on upgrade: no code change.

### Weak pointers & cleanups [1.24]

`weak.Pointer[T]` enables GC-friendly caches/canonicalization maps. `runtime.AddCleanup` supersedes `runtime.SetFinalizer` (multiple cleanups per object, attachable to interior pointers, no cycle leaks, no freeing delay). Prefer `AddCleanup` in new code.

---

## Tooling {#tooling}

**Correct `go.mod` files and modern build workflows.**

### `tool` directive in `go.mod` [1.24]

Replaces the `tools.go` blank-import hack. `go get -tool golang.org/x/tools/cmd/stringer` adds a `tool` line; run with `go tool stringer`; `go get -u tool` upgrades all. See `modules-and-dependencies.md#1-gomod-anatomy`.

### `go fix` modernizers [1.26]

`go fix` was completely revamped onto the `go vet` analysis framework: dozens of fixers that mechanically modernize code (and a source inliner driven by `//go:fix inline` for your own API migrations). Run `go fix ./...` after upgrading; preview with `go fix -diff ./...`. **Trap:** the historical `go fix` (Go 1→2 era rewrites) is gone; this is a different tool.

### `go mod init` lowers the default `go` line [1.26]

`go mod init` with toolchain `1.N.X` now writes `go 1.(N-1).0` (a release-candidate writes `1.(N-2).0`) to encourage cross-version-compatible modules. Bump deliberately with `go get go@1.N`.

---

## Anti-Patterns: Old → Modern {#deprecated}

Highest-value section. Agents emit these from pre-training; each is a concrete rewrite.

| Old Pattern | Modern Replacement | Min Ver | Why old is wrong |
|---|---|---|---|
| `v := v` inside loop body/closures | Delete it; per-iteration scoping is default | 1.22 | Loop vars are now fresh each iteration |
| `for i := 0; i < n; i++` (counting) | `for i := range n` | 1.22 | Range-over-int is cleaner |
| `rand.Seed(time.Now().UnixNano())` | Delete it: `math/rand/v2` auto-seeds | 1.22 | Global source auto-randomized; `Seed` a no-op since 1.24 |
| `rand.Intn(n)` / `rand.Int63n(n)` | `rand.IntN(n)` / `rand.N[T](n)` | 1.22 | `math/rand/v2` API |
| `interface{}` | `any` | 1.18 | Builtin alias; idiomatic since 1.18 |
| `sort.Slice(s, func(i,j) bool {...})` | `slices.Sort(s)` / `slices.SortFunc(s, cmp)` | 1.21 | Type-safe; note `SortFunc` is 3-way `cmp`, not `less` |
| manual membership loop | `slices.Contains(s, v)` | 1.21 | One-liner |
| `sync.Once`+pkg var+`once.Do` | `sync.OnceValue(func() T {...})` | 1.21 | Type-safe, single declaration |
| `a := x(); p := &S{F: &a}` | `p := &S{F: new(x())}` | 1.26 | `new` takes an expression |
| `wg.Add(1); go func(){ defer wg.Done(); ... }()` | `wg.Go(func(){ ... })` | 1.25 | Eliminates `Add`/`Done` mismatch |
| `var t *PathError; errors.As(err,&t)` | `pe, ok := errors.AsType[*PathError](err)` | 1.26 | Typed, zero-alloc, compile-checked |
| `uber/multierr`, `hashicorp/go-multierror` | `errors.Join(errs...)` | 1.20 | Stdlib multi-error |
| `import _ "go.uber.org/automaxprocs"` | Delete it; runtime reads cgroup limits | 1.25 | Built-in container-aware GOMAXPROCS |
| `timer.Stop()` to avoid GC leak | Not needed for GC (still use to cancel) | 1.23 | Unreferenced timers are GC-eligible |
| `time.After` in `select` loop (leak fear) | Safe in 1.23+; pre-1.23: `NewTimer`+`Reset` | 1.23 | Pre-1.23 leaked; now GC'd, channel synchronous |
| `tools.go` blank imports | `tool` directive in `go.mod` | 1.24 | No build-tag file needed |
| `for i := 0; i < b.N; i++` | `for b.Loop()` | 1.24 | Keeps args/results alive; runs setup once |
| `for i := 0; i < t.NumField(); i++` | `for f := range t.Fields()` | 1.26 | reflect iterators |
| custom slog multi-handler | `slog.NewMultiHandler(h1, h2)` | 1.26 | Stdlib fan-out |
| `omitempty` for `time.Time` | `omitzero` | 1.24 | `omitempty` never omits a zero `time.Time` |
| `reflect.TypeOf((*T)(nil)).Elem()` | `reflect.TypeFor[T]()` | 1.22 | Direct |
| `ioutil.ReadAll`/`ReadFile` | `io.ReadAll` / `os.ReadFile` | 1.16 | `io/ioutil` deprecated |
| `GOEXPERIMENT=arena` | `sync.Pool` / pre-alloc / `GOMEMLIMIT` |; | Arena on hold (see below) |

---

## On Hold: Arena Memory {#arena}

Arena memory (`GOEXPERIMENT=arena`) is **on hold indefinitely** : the API is infectious (every allocating function needs an `arena` param) and it reintroduces use-after-free. **Use instead:** `sync.Pool` for hot-path reuse, `make([]T, 0, cap)` to pre-allocate, `GOMEMLIMIT` for a soft cap, and Green Tea GC [1.26] for free overhead reduction. See `performance.md`.

---

## Go 1.27 {#go127}

> GA 2026-08-19 (current pin: SKILL.md). Entries below were compiled from the 2026-06 RC notes and confirmed against the final release notes.

- Generic methods: a method declaration may now declare its own type parameters (long-awaited). Interface methods still may not be generic, nor be implemented by generic methods.
- `encoding/json/v2` + `encoding/json/jsontext` GA: `encoding/json` is now **backed by v2**; marshal behavior preserved but **error message text differs**, and v2 defaults are stricter (rejects invalid UTF-8 and duplicate object keys). v1 API stays supported; opt out with `GOEXPERIMENT=nojsonv2`. (Was `GOEXPERIMENT=jsonv2` in 1.25/1.26.)
- Goroutine-leak profile GA: `goroutineleak` in `runtime/pprof` and `/debug/pprof/goroutineleak` (experiment in 1.26).
- Struct-literal keys may be any field selector, not just a top-level field name; **function type inference generalized** to all assignment/conversion contexts.
- `asynctimerchan` GODEBUG removed: timer channels are always unbuffered/synchronous.
- New stdlib: `crypto/mldsa` (post-quantum ML-DSA signatures), top-level `uuid` package, portable `simd` (experiment), `strings.CutLast`/`bytes.CutLast`.
- GODEBUG removals: `gotypesalias`, plus TLS `tls10server`/`tlsrsakex`/`tls3des`/`tlsunsafeekm`/`x509keypairleaf` (the new behavior becomes unconditional).

---

## Version map 1.18 → 1.27 {#versions}

| Ver | Headline modern features |
|---|---|
| **1.18** | Generics (type params); `any`; `comparable`; workspaces (`go work`); fuzzing |
| **1.20** | `errors.Join` + multi-`%w` + `Unwrap() []error`; `context.WithCancelCause`/`Cause`; PGO preview; slice→array conversion; `comparable` satisfied by interfaces |
| **1.21** | `min`/`max`/`clear`; `slices`/`maps`/`cmp`; `log/slog`; `sync.OnceValue`; PGO **GA**; `panic(nil)`→`PanicNilError`; `context.WithoutCancel`/`WithTimeoutCause`/`AfterFunc`; loopvar **preview** |
| **1.22** | **Loop var per-iteration**; range-over-int; `math/rand/v2`; enhanced `ServeMux`; `cmp.Or`; vet slog/append/`time.Since`; `reflect.TypeFor`; rangefunc preview |
| **1.23** | Range-over-func + `iter`; `unique`; timer/ticker GC + unbuffered channels; `slices`/`maps` iterators; `structs.HostLayout` |
| **1.24** | Generic type aliases; `weak` + `runtime.AddCleanup`; `os.Root`; `tool` directive; `b.Loop`; `encoding` appenders; `omitzero`; `rand.Text`; PQ-TLS default; Swiss-table map; `synctest` (exp) |
| **1.25** | Container-aware `GOMAXPROCS`; `WaitGroup.Go`; `FlightRecorder`; `synctest` **GA**; `T.Output`/`T.Attr`; `reflect.TypeAssert`; `CrossOriginProtection`; `slog.GroupAttrs`; `json/v2` (exp); Green Tea (exp); DWARF5 |
| **1.26** | `new(expr)`; self-referential generic types; `errors.AsType`; `slog.NewMultiHandler`; **Green Tea default**; `go fix` modernizers; `NotifyContext` cause; reflect iterators; `T.ArtifactDir`; faster `io.ReadAll`/cgo; `crypto/hpke`; goroutine-leak/`simd`/`runtime/secret` (exp) |
| **1.27** | Generic methods; `encoding/json/v2` **GA**; goroutine-leak profile **GA**; struct-literal field-selector keys; generalized inference; `asynctimerchan` removed; `crypto/mldsa`, `uuid` |

---

## What models get wrong {#stale}

1. `v := v` inside a `for` loop: unnecessary since [1.22] (loop vars are per-iteration). The most common stale pattern.
2. `rand.Seed(...)` ; obsolete; `math/rand/v2` auto-seeds, top-level `Seed` a no-op since [1.24]. `rand.Intn` → `rand.IntN`/`rand.N[T]`.
3. `interface{}` not `any` [1.18]; `sort.Slice` not `slices.Sort` [1.21]; passing a `less bool` to `slices.SortFunc` (wants 3-way `cmp`).
4. `var x; errors.As(err,&x)` not `errors.AsType[T]` [1.26]; claiming `fmt.Errorf("plain")` is slower than `errors.New` (stale alloc parity [1.26]).
5. `uber/multierr`/`hashicorp/go-multierror` not `errors.Join` [1.20]; expecting `Join` to flatten or `errors.Unwrap` to traverse it (returns nil).
6. `wg.Add(1)/Done` boilerplate not `wg.Go` [1.25], and assuming `wg.Go` recovers panics (it does **not**).
7. Importing `go.uber.org/automaxprocs` ; obsolete since container-aware `GOMAXPROCS` [1.25].
8. "Always `Stop()` or you leak" / avoiding `time.After` in a `select` loop; stale for `go 1.23+` (GC-eligible, synchronous channels).
9. `a := expr; p := &a` not `new(expr)` [1.26]; `reflect.TypeOf((*T)(nil)).Elem()` not `reflect.TypeFor[T]()` [1.22].
10. `tools.go` hack not `go.mod` `tool` [1.24]; `for i:=0;i<b.N;i++` not `for b.Loop()` [1.24]; `ioutil.*`/`pkg/errors` (both superseded).
11. `omitempty` on a `time.Time` expecting the zero value dropped: use `omitzero` [1.24].
12. Recommending arena memory; on hold; use `sync.Pool`/`GOMEMLIMIT`.
13. Mis-tagging `encoding/json/v2`: `GOEXPERIMENT=jsonv2` from [1.25], only **GA in [1.27]** (opt-out `nojsonv2`); *not* a 1.26 default.
14. Assuming `synctest` is 1.26-only: **experiment 1.24**, **GA 1.25** (old `Run` API removed 1.26).

---

## See also {#see-also}
- [errors-and-resilience.md](errors-and-resilience.md), `errors.AsType`, `Join`, retry/timer specifics
- [concurrency.md](concurrency.md), goroutine lifecycle, `errgroup`, `WaitGroup.Go`
- [advanced-patterns.md](advanced-patterns.md#iterators), range-over-func, generics depth
- [performance.md](performance.md#gc-tuning), PGO, Green Tea GC, `GOMEMLIMIT`
- [testing.md](testing.md), `synctest`, `b.Loop`, `T.Output`/`T.ArtifactDir`
- [modules-and-dependencies.md](modules-and-dependencies.md), workspaces, `tool` directive, `go` line
- [security.md](security.md), `os.Root`, post-quantum TLS, `rand.Text`, `crypto/hpke`, `runtime/secret`

## Sources {#sources}
- Release notes: go.dev/doc/go1.18 … go.dev/doc/go1.26; **go.dev/doc/go1.27**; go.dev/doc/devel/release
- Packages: pkg.go.dev/{slices,maps,cmp,iter,unique,weak,errors,log/slog,sync,math/rand/v2,encoding/json/v2,testing/synctest}; pkg.go.dev/os#Root
- Blogs: loopvar-preview, range-functions, container-aware-gomaxprocs, flight-recorder, greenteagc, jsonv2-exp, gofix; go.dev/blog
- GODEBUG history: go.dev/doc/godebug (go-122/123/126); arena issue: github.com/golang/go/issues/51317
