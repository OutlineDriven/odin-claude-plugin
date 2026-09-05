# Testing Patterns in Go

Go's `testing` package + `go test` covers ~95% of real needs without a framework. The leverage is in the *deltas*: subtests that `t.Parallel` correctly, `t.Cleanup`/`t.Setenv`/`t.Chdir` semantics (and which can't run in parallel), `B.Loop` over `b.N`, `testing/synctest` for time-dependent code, and the coverage flags most people never reach for. Reach for testify when assertions get verbose; never reach for a *framework*.

> Source horizon: verified against Go **1.26.x** (stable) + **1.27 RC** notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md) and the 1.27 row was checked against the final notes. Version tags `[1.N]` mark the release a claim applies to. Written from primary sources (pkg.go.dev, release notes, Go blog).

## TL;DR: the modern deltas (read first)

- `for b.Loop()` [1.24] is the new benchmark loop. The condition must be written *exactly* `b.Loop()`; the compiler keeps loop-body args/results alive (a `runtime.KeepAlive` transform on statements *syntactically inside the braces*), so dead-code elimination can't hollow out your benchmark. It auto-resets the timer on first call and stops it on the last. **Never mix it with a `b.N` loop.**
- `testing/synctest` graduated [1.25] → stable [1.26]. `synctest.Test(t, func(*testing.T))` runs a "bubble" with a fake clock; `synctest.Wait()` blocks until every *other* goroutine in the bubble is durably blocked. The trap: **mutexes, I/O, and syscalls are NOT durably blocking**: a test that does a loopback `net.Dial` or grabs a global mutex never goes idle. Use `net.Pipe`.
- `t.Setenv` is [1.17], `t.Cleanup` [1.14], `t.TempDir` [1.15]; only `t.Chdir`/`t.Context` are [1.24]. **`t.Setenv` and `t.Chdir` panic in a test that has called `t.Parallel` (or has a parallel ancestor)**; they mutate process-global state.
- The [1.22] loop-variable change makes the old `tt := tt` copy redundant in `for _, tt := range tests`; but it is **not** a substitute for `t.Parallel` correctness, and it changed nothing for index-style `for i := 0; i < n; i++` loops (`go vet`'s `copylock` [1.24] now flags lock copies there).
- Integration coverage [1.20]: `go build -cover` instruments a *binary*; set `GOCOVERDIR`, run it, then `go tool covdata`. Coverage is no longer test-only.
- `go test` caches results keyed on inputs; a passing test that touches the network/clock can be served from cache and mask a regression. `-count=1` is the documented cache-buster.

## Table of Contents
1. [Table-Driven Tests](#table-driven)
2. [Subtests and Parallel Execution](#subtests)
3. [Deterministic Concurrency Testing](#synctest)
4. [Test Helpers](#helpers)
5. [Cleanup, TempDir, Setenv, Chdir](#fixtures)
6. [TestMain and global setup](#testmain)
7. [Mocking with Interfaces](#mocking)
8. [HTTP Handler Testing](#http-testing)
9. [Database Testing](#db-testing)
10. [Benchmarks](#benchmarks)
11. [Fuzz Testing](#fuzzing)
12. [Golden Files](#golden-files)
13. [Example Tests](#examples)
14. [Coverage](#coverage)
15. [Test Artifacts](#artifacts)
16. [Integration Tests](#integration)
17. [stdlib vs testify](#libraries)
18. [Version map](#versions)
19. [What models get wrong](#stale)

---

## Table-Driven Tests {#table-driven}

The canonical Go test shape. The value is *one assertion path, many cases*; a failure names the case, and `-run Name/case` reruns one.

```go
func TestParseDuration(t *testing.T) {
    tests := map[string]struct { // map keys ARE the subtest names — no name field needed
        in      string
        want    time.Duration
        wantErr bool
    }{
        "seconds":      {in: "5s", want: 5 * time.Second},
        "empty":        {in: "", wantErr: true},
        "negative":     {in: "-1h", want: -time.Hour},
        "overflow":     {in: "9999999999h", wantErr: true},
    }
    for name, tt := range tests {
        t.Run(name, func(t *testing.T) {
            got, err := ParseDuration(tt.in)
            if (err != nil) != tt.wantErr {
                t.Fatalf("err = %v, wantErr %v", err, tt.wantErr) // Fatal: stop THIS subtest
            }
            if got != tt.want {
                t.Errorf("got %v, want %v", got, tt.want)         // Error: keep checking other fields
            }
        })
    }
}
```

Expert points: a `map` table gives randomized iteration order (surfaces order-dependence for free) but non-deterministic *output* order; use a slice when you need stable ordering or duplicate names. `t.Fatal`/`Fatalf` calls `runtime.Goexit`; it must run on the **test goroutine**, so calling it from inside a spawned goroutine doesn't fail the test (it just kills that goroutine); send the error back over a channel or use `t.Error` from there. Always include zero values, empty, nil, boundaries, and the error branch; a table with no `wantErr` case usually has an untested error path.

---

## Subtests and Parallel Execution {#subtests}

```go
func TestUserService(t *testing.T) {
    svc := setupTestService(t) // serial setup, shared read-only across subtests

    t.Run("group", func(t *testing.T) { // optional grouping parent
        for name, tt := range cases {
            t.Run(name, func(t *testing.T) {
                t.Parallel() // PAUSES here; resumes after the enclosing Run returns
                got := svc.Do(tt.in)
                if got != tt.want { t.Errorf("got %v want %v", got, tt.want) }
            })
        }
    })
}
```

`t.Parallel` mechanics (the part models get wrong): calling it *pauses* the subtest until its parent test function returns, then all paused siblings run concurrently. Consequences:
- A parent's code after its `t.Run` block runs **before** the parallel children; so deferred/inline teardown in the parent tears down resources the children still need. Put teardown in `t.Cleanup`, which is **deferred until after parallel subtests finish**.
- [1.22] killed the classic loop-capture bug: each iteration of `for _, tt := range tests` now gets a fresh `tt`, so the old `tt := tt` shadow before `t.Parallel()` is dead weight (`go vet`/`gopls` flag it as redundant). This is the loop-variable scoping change, not a change to `t.Parallel`. It does **not** apply to C-style `for i := 0; i < n; i++`; there `i` is still shared, and a parallel subtest closing over `i` still races.
- `t.Setenv`/`t.Chdir` **panic** if the test is parallel; they're process-global. Conversely, a non-parallel test that calls `t.Setenv` makes the whole subtree effectively serial for that var.

```bash
go test -run 'TestUserService/group/create' ./...   # / selects subtest path; arg is a regexp per segment
go test -race -count=1 -shuffle=on ./...             # -shuffle [1.17] randomizes test+benchmark order
go test -parallel=4 ./...                            # cap concurrent t.Parallel subtests (default GOMAXPROCS)
```

---

## Deterministic Concurrency Testing {#synctest}

`testing/synctest` makes time-dependent and goroutine-coordination tests **fast and deterministic** with no clock-injection interface and no `time.Sleep`-for-sync. Experimental in [1.24] (`synctest.Run`, behind `GOEXPERIMENT=synctest`); **stable [1.25]** as `synctest.Test(t, func(*testing.T))`; carried into [1.26].

```go
import (
    "sync/atomic"
    "testing"
    "testing/synctest"
    "time"
)

func TestDebounce(t *testing.T) {
    synctest.Test(t, func(t *testing.T) { // runs f in a new "bubble"
        var count atomic.Int32
        debounced := Debounce(func() { count.Add(1) }, 100*time.Millisecond)
        debounced()

        time.Sleep(99 * time.Millisecond) // fake clock; completes in ~0 wall time
        synctest.Wait()                    // block until every OTHER bubble goroutine is durably blocked
        if count.Load() != 0 { t.Fatal("fired too early") }

        time.Sleep(time.Millisecond)
        synctest.Wait()
        if count.Load() != 1 { t.Fatal("expected exactly one call") }
    })
}
```

Model ("durably blocked"): the bubble has its own fake clock (starts midnight UTC 2000-01-01). When *every* goroutine in it is durably blocked, an outstanding `Wait()` returns; else the clock jumps to the next timer; else it's deadlocked and `Test` panics. **Durably blocking** (complete list): send/recv on a nil channel; send/recv on a channel *created inside the bubble*; a `select` where every case durably blocks; `time.Sleep`; `sync.Cond.Wait`; `sync.WaitGroup.Wait`.

NOT durably blocking (the failure modes):
- `sync.Mutex`/`RWMutex` lock: a goroutine waiting for a mutex held outside the bubble could be unblocked from outside, so it doesn't count. A test that contends on a global mutex (e.g. via `reflect`) may never go idle.
- I/O and syscalls: a loopback `net.Dial`/`net.Listen` read can be unblocked by the kernel; the runtime can't tell "waiting for data" from "data en route." **Use `net.Pipe` (in-memory `net.Conn`)** to test client/server code in a bubble.

Rules inside the bubble: `T.Run`, `T.Parallel`, `T.Deadline` must **not** be called; `T.Cleanup` runs in-bubble just before `Test` returns; `T.Context()`'s `Done` is bubble-scoped. **Operating on a bubbled channel/timer/ticker from outside panics.** A package-level `var wg sync.WaitGroup` can't associate with a bubble (its `Wait` won't durably block); use `var wg = new(sync.WaitGroup)`. The **race detector understands `Wait`**: a missing `Wait()` between a bubble write and read is a reported race under `-race`. `Test` waits for all bubble goroutines to exit, so a leaked background goroutine deadlocks the test.

See also [concurrency.md](concurrency.md) for synctest applied to channel/worker patterns and [testing-advanced.md](testing-advanced.md#synctest-patterns) for deeper recipes.

---

## Test Helpers {#helpers}

```go
func assertEqual[T comparable](t *testing.T, got, want T) {
    t.Helper() // first line: failures point at the CALLER's line, not here
    if got != want {
        t.Errorf("got %v, want %v", got, want)
    }
}
```

Expert points: `t.Helper()` re-attributes only the immediate frame; a helper calling another helper needs it in *both*. Idiomatically a helper takes `*testing.T` and calls `t.Fatal`/`t.Error` itself rather than returning an error to check; a helper returning a value should `t.Helper()` then `t.Fatalf` on failure so the value is always usable. `t.TempDir()`/`t.Cleanup()` registered in a helper are owned by the *test*, not the helper.

---

## Cleanup, TempDir, Setenv, Chdir {#fixtures}

The `testing.TB` fixture methods, with their real version tags and the parallel-safety rules that trip people up:

```go
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db, err := sql.Open("pgx", dsn)
    if err != nil { t.Fatal(err) }
    t.Cleanup(func() { db.Close() }) // [1.14] LIFO; runs after the test AND all its parallel subtests
    return db
}
```

| Method | Tag | Behavior / trap |
|---|---|---|
| `t.Cleanup(f)` | **[1.14]** | LIFO stack; runs after the test and any parallel subtests. Survives `t.Fatal`/`Goexit` (unlike a bare `defer` in a helper that already returned). On `T`, `B`, `F`. |
| `t.TempDir()` | **[1.15]** | Per-test dir auto-removed via Cleanup; unique per test/subtest. Use it instead of `os.MkdirTemp`+manual cleanup. |
| `t.Setenv(k,v)` | **[1.17]** | Sets env via `os.Setenv`, restores on cleanup. **Panics if the test is parallel or has a parallel ancestor.** Calling it implicitly serializes the subtree. |
| `t.Chdir(dir)` | **[1.24]** | `os.Chdir` + restore on cleanup (also sets `PWD` on Unix). **Cannot be used in parallel tests**: process-wide cwd. Prefer absolute paths / `os.Root` [1.24] over changing cwd at all. |
| `t.Context()` | **[1.24]** | Returns a `context.Context` **canceled just before** Cleanup functions run; propagate it into the code under test so it observes test teardown. |

`t.Output() io.Writer` and `t.Attr(key, value)` are **[1.25]**; `t.ArtifactDir()` is **[1.26]** (see [Artifacts](#artifacts)).

---

## TestMain and global setup {#testmain}

```go
func TestMain(m *testing.M) {
    flag.Parse() // TestMain runs BEFORE flag.Parse() — call it yourself if you read flags here
    pool := startSharedResource()
    code := m.Run()       // returns the exit code; do NOT call os.Exit before cleanup
    pool.Close()
    os.Exit(code)         // since TestMain returns, you must exit explicitly (or let it return — [1.15]+ exits with m.Run's code)
}
```

Expert points: `TestMain` is a *package-level* hook (one per test binary) for setup too expensive per-test (shared container, connection pool) or that must run on the main goroutine. `m.Run()` returns the code; `os.Exit` skips your deferred cleanup, so close resources *before* exiting. Don't use it for ordinary setup; per-test `t.Cleanup` is parallel-safe and scoped. Flags aren't parsed when `TestMain` starts (call `flag.Parse()` if you read them); there's no `*testing.T`, so `t.Skip`/per-test helpers don't apply.

---

## Mocking with Interfaces {#mocking}

Define the interface **at the consumer**, keep it small, and prefer a hand-written func-field fake over a generated mock for anything under ~3 methods.

```go
// Interface declared where it's USED (the service), not where it's implemented (the repo).
type userRepo interface {
    GetUser(ctx context.Context, id string) (*User, error)
}

// Func-field stub: each test sets only the methods it exercises.
type stubRepo struct {
    getUser func(ctx context.Context, id string) (*User, error)
}
func (s stubRepo) GetUser(ctx context.Context, id string) (*User, error) { return s.getUser(ctx, id) }

func TestService_GetUser(t *testing.T) {
    svc := NewService(stubRepo{
        getUser: func(_ context.Context, id string) (*User, error) {
            if id == "123" { return &User{ID: id, Name: "Alice"}, nil }
            return nil, ErrNotFound
        },
    })
    got, err := svc.GetUser(context.Background(), "123")
    if err != nil { t.Fatal(err) }
    if got.Name != "Alice" { t.Errorf("name = %q", got.Name) }
}
```

When to generate: for large interfaces or strict call-order/expectation assertions, `go.uber.org/mock` (`mockgen`; the maintained successor to the archived `golang/mock`) or `matryer/moq` (generates a func-field mock like the above). Drive generation with a `//go:generate` directive or a `tool` directive [1.24] in `go.mod`. **Don't mock what you don't own** (DB drivers, `http.Client`); fake at the seam you control (a repo interface, an `httptest.Server`). Over-mocking yields tests that pass while the integration is broken. Mocking/fakes depth: [testing-advanced.md](testing-advanced.md#mocking-strategy).

---

## HTTP Handler Testing {#http-testing}

```go
// Handler-level: no socket, synchronous, fast — use httptest.NewRecorder.
func TestUsersHandler(t *testing.T) {
    req := httptest.NewRequestWithContext(t.Context(), "GET", "/api/v1/users/123", nil) // [1.23] ctx-aware ctor
    rec := httptest.NewRecorder()
    handler.ServeHTTP(rec, req)

    res := rec.Result() // *http.Response
    defer res.Body.Close()
    if res.StatusCode != http.StatusOK {
        t.Fatalf("status = %d", res.StatusCode)
    }
}

// Stack-level: real loopback server (tests middleware, routing, TLS).
func TestHealth(t *testing.T) {
    srv := httptest.NewServer(router)
    t.Cleanup(srv.Close)
    res, err := srv.Client().Get(srv.URL + "/healthz") // srv.Client() trusts srv's TLS cert
    if err != nil { t.Fatal(err) }
    defer res.Body.Close()
}
```

Expert points: `NewRecorder` skips the server machinery (no write deadlines, `Flusher` timing, or `Server` middleware); use `NewServer`/`NewTLSServer` for those, and with TLS always dial via `srv.Client()` (it trusts the server cert). `ResponseRecorder.Code` defaults to 200 even if the handler never calls `WriteHeader`; assert on `Result().StatusCode`. Unit-test a client by pointing its `Transport` at an `httptest.Server`, not by mocking `http.Client`. Inside `synctest`, loopback needs `net.Pipe`. Config: [http-and-apis.md](http-and-apis.md).

---

## Database Testing {#db-testing}

Prefer a **real engine** (testcontainers-go, or a CI service container) over an in-memory SQL emulator; dialect drift (SQLite vs Postgres) silently passes tests that break in prod. Isolate parallel tests with a per-test schema or a rolled-back transaction, never a shared mutable table; register teardown via `t.Cleanup(func(){ container.Terminate(ctx) })`. `sqlmock` is brittle (asserts exact query strings); reserve it for *error-handling* paths you can't easily provoke against a live DB. Driver/migration patterns: [database.md](database.md). Full integration scaffolding: [Integration Tests](#integration).

---

## Benchmarks {#benchmarks}

```go
func BenchmarkMarshal(b *testing.B) {
    data := makeData()      // setup BEFORE the loop — excluded automatically by b.Loop
    b.ReportAllocs()        // or run with -benchmem
    for b.Loop() {          // [1.24] — condition must be EXACTLY b.Loop()
        sink, _ = json.Marshal(data) // assign to a package var to be safe pre-1.24; redundant with b.Loop
    }
}
```

`for b.Loop()` vs `for i := 0; i < b.N; i++` [1.24]:

| Aspect | `for b.Loop()` | `for i := 0; i < b.N; i++` |
|---|---|---|
| Timer | Resets on first `Loop()`, stops on last; setup/cleanup outside the loop is free | Manual `b.ResetTimer()`/`b.StopTimer()` |
| Dead-code elimination | Loop-body args/results kept alive (KeepAlive on statements *inside the braces*) | Compiler may delete an unused result → fake "0.3 ns/op" |
| Function executions | Function body runs **once** per `-count`; iterations adjusted internally | Whole function re-run multiple times as `b.N` grows |
| `b.N` | Holds **total iterations** *after* the loop (use for derived metrics) | The iteration count you loop to |

Traps: the loop condition must be written literally `b.Loop()` (the compiler pattern-matches the syntax); a wrapper like `for cond := b.Loop(); cond; cond = b.Loop()` defeats the KeepAlive transform. **Never mix `b.Loop()` and `b.N`** in one benchmark. `b.RunParallel(func(pb *testing.PB){ for pb.Next() {...} })` is still the API for parallel benchmarks (`b.Loop` is single-goroutine). Statistical rigor (multiple runs, `benchstat`) and profiling belong in [performance.md](performance.md#benchmarking); don't eyeball a single run.

```bash
go test -bench=. -benchmem -count=10 ./...   # -count=10 for variance; pipe to benchstat
go test -bench=BenchmarkMarshal -cpuprofile=cpu.out ./...
```

---

## Fuzz Testing {#fuzzing}

Native fuzzing landed **[1.18]** (`*testing.F`, `f.Add`, `f.Fuzz`). Seed the corpus, then assert an *invariant*; not a hardcoded output.

```go
func FuzzRoundTrip(f *testing.F) {
    f.Add("https://example.com/p?q=1") // seed corpus (also persisted under testdata/fuzz/)
    f.Add("")
    f.Fuzz(func(t *testing.T, in string) {
        u, err := Parse(in)
        if err != nil { return } // reject invalid input; not a failure
        if got := Parse(mustString(u)); got != u { // property: parse∘format == identity
            t.Errorf("round-trip: %v != %v", got, u)
        }
    })
}
```

```bash
go test -run='^$' -fuzz=FuzzRoundTrip -fuzztime=30s ./pkg   # -run '^$' skips unit tests while fuzzing
```

Expert points: fuzz arguments are limited to the supported types (`[]byte`, `string`, the numeric types, `bool`, `rune`); no structs/slices; pack structured inputs into `[]byte` and decode inside `f.Fuzz`. Without `-fuzz`, a `Fuzz` target runs only its **seed corpus** as a normal unit test (so seeds are regression tests). A crasher is written to `testdata/fuzz/<FuzzName>/` and **must be committed**: it then reproduces deterministically in CI without re-fuzzing. `-fuzz` runs **one target at a time**, so fuzzing isn't a CI default; gate it on a nightly/dedicated job. Property-based testing depth: [testing-advanced.md](testing-advanced.md#property-based).

---

## Golden Files {#golden-files}

```go
var update = flag.Bool("update", false, "update .golden files")

func TestRender(t *testing.T) {
    got := render(input)
    golden := filepath.Join("testdata", t.Name()+".golden") // t.Name() → unique per subtest
    if *update {
        if err := os.WriteFile(golden, []byte(got), 0o644); err != nil { t.Fatal(err) }
    }
    want, err := os.ReadFile(golden)
    if err != nil { t.Fatalf("read golden (run -update?): %v", err) }
    if diff := cmp.Diff(string(want), got); diff != "" { // go-cmp gives readable -want/+got diffs
        t.Errorf("mismatch (-want +got):\n%s", diff)
    }
}
```

Expert points: `testdata/` is special; `go build`/`go test` ignore it, and the working directory during a test is the **package directory**, so `testdata/...` resolves without tricks. Golden files shine for large/structured output (rendered templates, serialized trees) where an inline `want` literal would be unreadable. Normalize nondeterminism (timestamps, random IDs, map order) *before* writing/comparing or `-update` thrashes the file. `t.Name()` includes subtest path with `/`; sanitize it for filesystem-unsafe characters if your subtest names contain them. Snapshot-testing libraries exist but `flag.Bool("update")` + `go-cmp` is the zero-dep idiom.

---

## Example Tests {#examples}

Examples are compiled, run, **and** checked against their `// Output:` comment; they're tests *and* godoc that can't go stale.

```go
func ExampleParse() {
    u, _ := Parse("https://go.dev")
    fmt.Println(u.Host)
    // Output: go.dev
}

func ExampleClient_Get() { // ExampleType_Method → attaches to that method's godoc
    // ...
    // Unordered output:   // matches the lines below in any order
    // a
    // b
}
```

Expert points: the name must be `Example`, `ExampleF`, `ExampleT`, or `ExampleT_M` (in a `_test.go` file) to attach to godoc. An example with **no `// Output:`** comment is *compiled but not run* (verifies only that it builds). `// Unordered output:` matches lines in any order. Examples assert purely via stdout (no `*testing.T`) and are the most honest API docs you have.

---

## Coverage {#coverage}

```bash
go test -cover ./...                                  # summary % per package
go test -coverprofile=cov.out -covermode=atomic ./... # atomic mode is REQUIRED with -race
go tool cover -func=cov.out                           # per-function table
go tool cover -html=cov.out                           # annotated source in browser
go test -coverpkg=./... -coverprofile=cov.out ./...   # count coverage of OTHER packages exercised by these tests
```

**`-covermode`:** `set` (default; did-it-run booleans), `count` (hit counts), `atomic` (count, race-safe). **Use `atomic` whenever `-race` is on**; `count` mode's non-atomic counters are themselves data races. `-coverpkg` widens *instrumentation* to packages beyond the one under test (e.g. measure how much of `./internal/...` your handler tests exercise); without it you only see the test's own package.

Integration coverage of binaries [1.20]; coverage is no longer test-only:

```bash
go build -cover -o app.exe ./cmd/app   # instrument the BINARY (default: main module's packages)
GOCOVERDIR=$(mktemp -d) ./app.exe ...  # each run writes covcounters/covmeta files there
go tool covdata percent  -i="$GOCOVERDIR"            # summary
go tool covdata textfmt  -i="$GOCOVERDIR" -o=cov.txt # → feed to `go tool cover -func/-html`
go tool covdata merge    -i=dir1,dir2 -o=merged      # combine many runs / harnesses
```

`go build -cover -coverpkg=...` extends binary instrumentation to dependencies. This lets end-to-end / CLI / server-under-load tests contribute to a coverage number, merged with unit-test profiles via `covdata merge`.

---

## Test Artifacts {#artifacts}

**[1.26]** `t.ArtifactDir()` (on `T`, `B`, `F`) returns a per-test directory for output files (screenshots, debug dumps, captured payloads). With `go test -artifacts`, it lives under the test output dir and **persists**: without the flag it's a temp dir removed after the test. Repeated calls in the same (sub)test return the same path.

```go
if err := os.WriteFile(filepath.Join(t.ArtifactDir(), "response.json"), body, 0o644); err != nil {
    t.Fatal(err)
}
```

Pair with `t.Attr(key, value)` [1.25] to emit CI-readable test metadata, and `t.Output() io.Writer` [1.25] to stream large diagnostic output through the test log without `t.Log`'s per-call source annotation. For scratch space that should *not* survive, keep using `t.TempDir()`.

---

## Integration Tests {#integration}

```go
//go:build integration   // excluded from default `go test`; run with -tags=integration

package myapp_test
```

```bash
go test -short ./...                       # fast path: integration tests self-skip on testing.Short()
go test -tags=integration -count=1 ./...   # opt in; -count=1 so cached results don't hide infra changes
```

Two gating mechanisms, used together: a **build tag** (`//go:build integration`) keeps slow tests out of the default compile entirely; **`testing.Short()`** lets a test skip itself under `-short` even when compiled in. Build tags are coarse (whole file); `Short()` is per-test.

Test organization:
- `package foo` in `*_test.go` → **white-box** (can touch unexported identifiers).
- `package foo_test` in the same dir → **black-box** (only the public API; the documented default for most packages). You can have *both* files in one directory.
- `testdata/` → fixtures, ignored by the toolchain; cwd during tests is the package dir.
- `TestMain` → one-time package-level setup ([above](#testmain)).

---

## stdlib vs testify {#libraries}

| Tool | Status [2026] | Use when |
|---|---|---|
| stdlib `testing` + `go test` | **Default** | Always the baseline; covers ~95% |
| `google/go-cmp` (`cmp.Diff`) | **De-facto standard** for deep equality | Comparing structs/maps/slices with readable diffs; honors `cmpopts`, `Equal` methods. Don't use `reflect.DeepEqual` in tests. |
| `stretchr/testify` (`assert`/`require`) | Very common, maintained | Cutting assertion boilerplate. `require.*` stops the test (like `Fatal`); `assert.*` continues (like `Error`). Avoid `testify/suite`; fights `t.Parallel` and Go test idioms. |
| `go.uber.org/mock` (`mockgen`) | Maintained successor to archived `golang/mock` | Generated mocks with call-order/expectation assertions on large interfaces |
| `matryer/moq` | Maintained | Lightweight func-field mock generation |
| `testcontainers/testcontainers-go` | Maintained | Ephemeral real dependencies (DB, broker) for integration tests |
| `quicktest`, `is`, Ginkgo/Gomega | Niche / BDD | Rarely needed; Ginkgo's DSL diverges from idiomatic Go testing |

Rule of thumb: stdlib for control flow and `t.Run`; `go-cmp` for equality; `testify/require` to trim repetitive `if err != nil` chains. A *framework* (Ginkgo) is almost never the right call in Go.

---

## Version map {#versions}

| Ver | Testing-relevant additions |
|---|---|
| **[1.14]** | `t.Cleanup` |
| **[1.15]** | `t.TempDir`; `TestMain` may return instead of calling `os.Exit` |
| **[1.17]** | `t.Setenv`; `go test -shuffle` |
| **[1.18]** | Native fuzzing (`*testing.F`, `f.Add`, `f.Fuzz`); generics (typed test helpers) |
| **[1.20]** | `go build -cover` + `go tool covdata` (integration coverage of binaries) |
| **[1.21]** | `testing.Testing()` (am I running under `go test`?) |
| **[1.22]** | Loop-variable per-iteration scoping (kills `tt := tt`); enhanced `ServeMux` routing eases handler tests |
| **[1.23]** | `httptest.NewRequestWithContext`; timers GC'd unreferenced (old `time.After` leak advice stale) |
| **[1.24]** | `for b.Loop()`; `t.Chdir`/`t.Context`; `testing/synctest` (experimental, `GOEXPERIMENT=synctest`); `tool` directives in go.mod; `tests` vet analyzer; `copylock` flags 3-clause-loop lock copies |
| **[1.25]** | `testing/synctest` **stable** (`synctest.Test`/`Wait`); `t.Output`, `t.Attr` |
| **[1.26]** | `t.ArtifactDir` + `go test -artifacts`; synctest carried forward |
| **[1.27]** | `testing/synctest.Sleep` (sleep plus `synctest.Wait` in one call); `httptest.NewTestServer` (in-memory network for synctest bubbles); `go test` runs the `stdversion` vet check by default; `go test -json` gains `OutputType`. GA 2026-08-19; additions read from the final release notes. |

---

## What models get wrong {#stale}

1. Claiming `t.Setenv`/`t.Cleanup`/`t.TempDir` are all "[1.24]"; only `t.Chdir`/`t.Context` are; `Cleanup` [1.14], `TempDir` [1.15], `Setenv` [1.17].
2. Calling `t.Setenv` or `t.Chdir` in a test that also calls `t.Parallel`; it **panics** (process-global state).
3. Still writing `tt := tt` before `t.Parallel()` in a `range` loop; redundant since [1.22]; but assuming [1.22] also fixed C-style `for i := 0; i < n; i++` (it didn't).
4. Treating `b.Loop()` as cosmetic over `b.N`; it changes timer handling, prevents DCE, and runs the body once per `-count`. And **mixing** `b.Loop()` with a `b.N` loop.
5. Writing the `b.Loop()` condition indirectly (assigning it to a variable); defeats the compiler's KeepAlive transform.
6. Using `synctest` with loopback `net.Dial` or a global mutex and wondering why it hangs; those aren't durably blocking; use `net.Pipe`.
7. Calling `t.Run`/`t.Parallel` *inside* a `synctest` bubble; forbidden.
8. Forgetting `synctest.Wait()` between a bubble write and read; `-race` reports it as a data race.
9. Calling `t.Fatal` from a spawned goroutine; it only `Goexit`s that goroutine, not failing the test; send the error back to the test goroutine.
10. Tearing down shared resources via parent `defer`/inline code with parallel subtests; runs before the children; use `t.Cleanup`.
11. `reflect.DeepEqual` for test equality instead of `cmp.Diff` (no diff, surprising NaN/unexported behavior).
12. Running `-race` with `-covermode=count`; the counters race; use `atomic`.
13. Relying on cached `go test` results for tests that touch the clock/network; use `-count=1`.
14. Asserting on `ResponseRecorder.Code` (defaults to 200) instead of `Result().StatusCode`.
15. A fuzz target with no `// Output`-style invariant, or not committing the `testdata/fuzz/` crasher (so CI can't reproduce it).
16. Reaching for `testify/suite` or Ginkgo when `t.Run` + table tests + `go-cmp` suffice.
17. Mocking `http.Client`/DB drivers (don't own them) instead of faking at an owned seam (`httptest.Server`, repo interface).

---

## See Also {#see-also}

- [testing-advanced.md](testing-advanced.md); fuzzing depth, property-based testing, mocking strategies, test architecture, load/chaos
- [concurrency.md](concurrency.md); `synctest` for channel/worker patterns, goroutine lifecycle
- [debugging-and-diagnostics.md](debugging-and-diagnostics.md); race detector internals, `dlv`
- [performance.md](performance.md#benchmarking); benchmark statistics, `benchstat`, profiling
- [http-and-apis.md](http-and-apis.md); server/client config behind `httptest`

## Sources {#sources}

- pkg.go.dev/testing (go1.26), pkg.go.dev/testing/synctest (go1.26.4), pkg.go.dev/net/http/httptest
- go.dev/doc/go1.{14,15,17,18,20,22,23,24,25,26} release notes
- go.dev/blog/synctest (Damien Neil, 2025-02; durably-blocked rules, `net.Pipe`); go.dev/blog/integration-test-coverage (Than McIntosh, 2023-03; `go build -cover`/`covdata`)
- go.dev/blog/fuzz-beta; go.dev/security/fuzz; github.com/google/go-cmp; github.com/stretchr/testify; go.uber.org/mock; testcontainers-go
