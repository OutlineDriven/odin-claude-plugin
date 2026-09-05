# Advanced Testing Patterns

Beyond table-driven tests: native fuzzing finds inputs you didn't imagine, property-based tests check invariants over thousands of cases, `synctest` makes time-dependent concurrency *deterministic*, and `benchstat` tells you whether a change is real or noise. The meta-rule: **don't mock what you can run for real** (testcontainers), and don't run for real what a fake clock can simulate (`synctest`).

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. This is the DELTA beyond [testing.md](testing.md): table-driven, subtests, `httptest`, basic `f.Add`/`f.Fuzz`, golden files, and `b.Loop` live there.

## TL;DR: the modern deltas (read first)

- Native fuzz args are a closed set: only `string`, `[]byte`, the sized int/uint types (`int`,`int64`,`rune`,`byte`,…), `float32/64`, `bool`. **No structs, no slices-of-struct, no maps.** To fuzz a struct, fuzz `[]byte` and decode, or reach for property-based testing instead.
- `synctest.Test(t, f)` [1.26] (was `synctest.Run` behind `GOEXPERIMENT` in 1.24) gives a fake clock + goroutine isolation bubble: the *correct* tool for retries, timeouts, rate limiters, debouncers. `t.Run`/`t.Parallel`/`t.Deadline` are **forbidden inside a bubble**.
- `benchstat` reports median + 95% CI and a Mann-Whitney p-value [current `x/perf`], not "mean ±%". `~` under `vs base` means *no statistically significant difference*. Run `-count≥10`; **never re-run until it goes green** (that's p-hacking).
- The maintained gomock is `go.uber.org/mock` [v0.6.0] (`github.com/uber/mock`); the old `github.com/golang/mock` is **archived**. `gomock.NewController(t)` auto-registers `Finish` via `t.Cleanup`; `defer ctrl.Finish()` is obsolete.
- `goleak.VerifyNone(t)` fights `t.Parallel()`: goroutines from sibling tests look like leaks. Prefer `goleak.VerifyTestMain(m)` once per package.
- Don't mock value types or what you own. Mock at *process boundaries* (network, clock, third-party SDKs). For your own DB layer, a real container beats a hand-rolled mock that drifts from SQL reality.

## Table of Contents
1. [Native fuzzing in depth](#fuzzing-depth)
2. [Property-Based Testing](#property-based)
3. [Mocking strategy: hand mocks vs generators vs none](#mocking-strategy)
4. [Integration testing with containers](#integration-containers)
5. [Contract Testing](#contract-testing)
6. [Snapshot Testing](#snapshot-testing)
7. [Synctest Patterns](#synctest-patterns)
8. [Benchmark stability & benchstat](#benchmark-stability)
9. [Flaky-test isolation](#flaky-isolation)
10. [Coverage of generics](#generics-coverage)
11. [Load Testing](#load-testing)
12. [Chaos Engineering](#chaos-engineering)
13. [Goroutine Leak Detection](#goroutine-leaks)
14. [Test Architecture](#test-architecture)
15. [Library landscape & status](#libraries)
16. [Version map 1.18→1.27](#versions)
17. [What models get wrong](#stale)

---

## Native fuzzing in depth {#fuzzing-depth}

`go test` fuzzing [1.18] is coverage-guided (libFuzzer-style mutation), with automatic shrinking and a regression corpus. The basics (`f.Add`, `f.Fuzz`) are in [testing.md#fuzzing](testing.md#fuzzing); here is what trips people up.

**The hard constraints** (from the official spec; these are compile/run errors, not style):

- A fuzz target takes **`*testing.T` first**, then the fuzzing args; **exactly one** `f.Fuzz` per `FuzzXxx`.
- Fuzzing args are a **closed type set**: `string`, `[]byte`; `int`,`int8`,`int16`,`int32`/`rune`,`int64`; `uint`,`uint8`/`byte`,`uint16`,`uint32`,`uint64`; `float32`,`float64`; `bool`. **No structs/slices/maps/time.Time.** Every `f.Add` seed (and every `testdata/fuzz` file) must match the arg types **exactly, in order**.
- Per-input execution timeout is **1 second**: a target that deadlocks or loops is reported as a failure. Keep targets fast and **free of global state** (workers run in parallel, nondeterministic order).

```go
// CORRECT — fuzz []byte, decode inside, assert a property (round-trip).
func FuzzRoundTrip(f *testing.F) {
    f.Add([]byte(`{"id":1,"name":"a"}`)) // seed types == fuzz arg types
    f.Fuzz(func(t *testing.T, data []byte) {
        var u User
        if err := json.Unmarshal(data, &u); err != nil {
            return // reject invalid input — not a failure
        }
        out, err := json.Marshal(u)
        if err != nil {
            t.Fatalf("re-marshal of valid value failed: %v", err)
        }
        var u2 User
        if err := json.Unmarshal(out, &u2); err != nil {
            t.Fatalf("round-trip broke decodability: %v", err)
        }
        if u != u2 {
            t.Fatalf("round-trip changed value: %+v -> %+v", u, u2)
        }
    })
}
```

```go
// WRONG — won't compile: struct is not an allowed fuzz arg type.
func FuzzUser(f *testing.F) {
    f.Fuzz(func(t *testing.T, u User) { /* ... */ }) // compile error
}
// WRONG — seed type mismatch panics at test start (int seed, []byte arg).
f.Add(42)
f.Fuzz(func(t *testing.T, b []byte) {})
```

**Corpus layout & CI strategy**: the part models skip:

- **Seed corpus** = `f.Add` calls **plus** files in `testdata/fuzz/FuzzXxx/`; seeds run on *every* `go test` (fuzzing or not), so **commit them**. **Generated corpus** lives in `$GOCACHE/fuzz`, machine-local; **do not commit**.
- A discovered failure is auto-written to `testdata/fuzz/FuzzXxx/<hash>` and becomes a **permanent regression test** run by default. Commit it with the fix.
- `go test -fuzz` with **no `-fuzztime` runs forever**, which is useless in CI. Pattern: a time-boxed fuzz job (`-fuzztime=60s` per target) nightly, plus the always-on seed-corpus replay in the normal unit run. For continuous deep fuzzing, native Go targets are supported by **OSS-Fuzz**.

```bash
go test -run=^$ -fuzz=FuzzRoundTrip -fuzztime=60s ./...   # nightly/CI, time-boxed
go test ./...                                              # replays seed+regression corpus (no -fuzz)
```

**Knobs & limits:** `-fuzzminimizetime` (shrink budget; `0` disables shrinking), `-parallel` (defaults `$GOMAXPROCS`; `-cpu` is ignored while fuzzing). Coverage instrumentation exists **only on AMD64 and ARM64**; on other arches the corpus can't grow, so fuzzing degenerates to replay. Large binary seeds: convert with `golang.org/x/tools/cmd/file2fuzz` (encodes a file as a `[]byte` corpus entry). **A fuzz failure prints a `go test -run=FuzzXxx/<hash>` line; paste it to reproduce deterministically.**

---

## Property-Based Testing {#property-based}

When inputs don't fit fuzzing's type whitelist (structs, slices of structs, stateful sequences), use `pgregory.net/rapid`: generate typed values, assert invariants, get **automatic shrinking** to a minimal failing case.

```go
import "pgregory.net/rapid"

func TestSortIdempotent(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {                 // *rapid.T, not *testing.T
        xs := rapid.SliceOf(rapid.Int()).Draw(t, "xs")
        sort.Ints(xs)
        once := slices.Clone(xs)
        sort.Ints(xs)
        if !slices.Equal(xs, once) {
            t.Fatalf("double-sort changed result: %v vs %v", xs, once)
        }
    })
}
```

Generators (all return `*rapid.Generator[T]`; consume with `.Draw(t, label)`): `Int()`, `IntRange(lo,hi)`, `Float64()`, `String()`, `StringMatching(re)`, `SliceOf(g)`, `SliceOfN(g,min,max)`, `MapOf(k,v)`, `OneOf(gs...)`, `Just(v)`, `Custom(func(*rapid.T) T)`, `Map(g, fn)`. Compose `Custom` for domain types:

```go
genUser := rapid.Custom(func(t *rapid.T) User {
    return User{
        Name: rapid.StringMatching(`[A-Za-z ]{1,20}`).Draw(t, "name"),
        Age:  rapid.IntRange(0, 150).Draw(t, "age"),
    }
})
```

Stateful / model-based testing is the highest-value use: drive a real implementation and a simple model through random operation sequences, assert they agree. Catches ordering and concurrency bugs that example tests never reach.

```go
func TestQueueModel(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        var real Queue
        var model []int
        t.Repeat(map[string]func(*rapid.T){
            "push": func(t *rapid.T) {
                v := rapid.Int().Draw(t, "v")
                real.Push(v); model = append(model, v)
            },
            "pop": func(t *rapid.T) {
                if len(model) == 0 { t.Skip("empty") }
                got, ok := real.Pop()
                if !ok || got != model[0] {
                    t.Fatalf("pop=%v,%v want %v", got, ok, model[0])
                }
                model = model[1:]
            },
            "": func(t *rapid.T) { // "" runs after every step: a global invariant check
                if real.Len() != len(model) {
                    t.Fatalf("len drift: %d vs %d", real.Len(), len(model))
                }
            },
        })
    })
}
```

Choosing properties: round-trip (`decode(encode(x)) == x`), invariants (length, ordering, conservation), idempotence (`f(f(x)) == f(x)`), oracle (agree with a slow reference), metamorphic (`f(perm(x))` relates predictably to `f(x)`). Failing cases persist to `testdata/rapid/` and **replay deterministically**; scale iterations with `-rapid.checks=N`.

Property tests vs fuzzing: fuzzing is coverage-*guided* (best for parsers/decoders on `[]byte`/`string`); rapid is type-*driven* (best for structured domain types and stateful APIs). Use fuzzing for byte-oriented inputs, rapid for everything else.

---

## Mocking strategy: hand mocks vs generators vs none {#mocking-strategy}

**Decision order.** (1) Can you use the real thing cheaply? Use it (in-memory fake, `httptest`, testcontainer). (2) Small interface (≤3 methods)? Hand-write a mock. (3) Large/volatile interface verified across many tests? Generate. **Mock at the *boundary*** (network calls, the clock, third-party SDKs), never your own value types or pure functions.

```go
// Hand mock — function fields make per-test behavior trivial; zero deps. Best default.
type stubRepo struct {
    getUser func(ctx context.Context, id string) (*User, error)
}
func (s stubRepo) GetUser(ctx context.Context, id string) (*User, error) {
    return s.getUser(ctx, id)
}
```

**Generated mocks: pick one and know what it is:**

| Tool | Import / status [2026] | Style | Use when |
|---|---|---|---|
| **`go.uber.org/mock`** (`mockgen`) | **v0.6.0**, maintained fork of golang/mock | Expectation DSL (`EXPECT().M().Return()`) | You want strict call-order/count assertions; large interfaces |
| **`matryer/moq`** | Active | Generates a plain struct of `MFunc` fields + call recorder | You like hand-mock ergonomics but want them generated |
| **`mockery`** | Active, config-driven (`.mockery.yaml`) | testify-style (`m.On(...).Return(...)`) | Codebases already on `testify/mock` |
| `github.com/golang/mock` | **Archived** | none | Never; migrate to `go.uber.org/mock` |

```go
// go.uber.org/mock [v0.6.0] — NewController auto-cleans up; no defer ctrl.Finish().
ctrl := gomock.NewController(t)
repo := NewMockUserRepository(ctrl) // generated by `mockgen`
repo.EXPECT().
    GetUser(gomock.Any(), gomock.Eq("123")).
    Return(&User{ID: "123", Name: "Alice"}, nil).
    Times(1)
```

```go
// WRONG — obsolete since the controller registers t.Cleanup(Finish) itself.
ctrl := gomock.NewController(t)
defer ctrl.Finish() // redundant when a *testing.T is passed
```

Generate via the `tool` directive [1.24] so the version is pinned in `go.mod` (no `//go:generate` magic comment needed for the dep):

```go
//go:generate go tool mockgen -source=repo.go -destination=mock_repo_test.go -package=user
```

**When NOT to mock** (the expert call models miss): mocking your own database layer encodes your *assumptions* about SQL, not its *behavior*; the mock passes while the query is wrong (use a container). Mocking time via an injected `Clock` interface is now inferior to a `synctest` fake clock (no production interface pollution). Over-mocking asserts *implementation* (which methods were called) instead of *behavior*; those tests break on every refactor. **A test that only verifies "the mock was called" verifies nothing about correctness.**

See also [testing.md#mocking](testing.md#mocking) for the interface-at-the-consumer principle.

---

## Integration testing with containers {#integration-containers}

Prefer a **real dependency in a throwaway container** over a mock for databases, brokers, and caches. `testcontainers-go` is the standard; `ory/dockertest` is the lighter, older alternative.

```go
//go:build integration

import (
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
    "github.com/testcontainers/testcontainers-go/wait"
)

func newPostgres(t *testing.T) string {
    t.Helper()
    ctx := context.Background()
    ctr, err := postgres.Run(ctx, "postgres:17-alpine",
        postgres.WithDatabase("app"),
        postgres.WithUsername("test"), postgres.WithPassword("test"),
        testcontainers.WithWaitStrategy(                  // wait for READINESS, not just "started"
            wait.ForLog("database system is ready to accept connections").
                WithOccurrence(2).WithStartupTimeout(30*time.Second)),
    )
    if err != nil { t.Fatalf("start postgres: %v", err) }
    t.Cleanup(func() { testcontainers.TerminateContainer(ctr) }) // ALWAYS terminate
    dsn, err := ctr.ConnectionString(ctx, "sslmode=disable")
    if err != nil { t.Fatalf("dsn: %v", err) }
    return dsn
}
```

**Expert points:** (1) The #1 flake is **starting a query before the container is ready**: an open TCP port ≠ Postgres accepting connections; use a log/SQL-ping wait strategy, and note Postgres logs "ready" *twice* (init + real start), hence `WithOccurrence(2)`. (2) **One container per package, not per test**: share via `TestMain`; isolate state with per-test schemas/transactions or truncate in `t.Cleanup`. (3) Gate behind `//go:build integration` (or `testing.Short()`); requires a Docker/Podman socket in CI. (4) Reusable containers and Ryuk (the reaper sidecar) speed local iteration but need care in CI; confirm the current flag/env via the testcontainers docs `[verify]`.

See also [testing.md#integration](testing.md#integration) and [database.md](database.md).

---

## Contract Testing {#contract-testing}

Consumer-driven contracts verify a provider honors what consumers actually need, **without running both services together**. The consumer test records expectations as a *pact* (JSON); the provider replays it. Use Pact when teams own services independently; for a monorepo where you control both ends, prefer a shared integration test.

```go
import (
    "github.com/pact-foundation/pact-go/v2/consumer"
    "github.com/pact-foundation/pact-go/v2/matchers"
)

func TestUserClientContract(t *testing.T) {
    mock, err := consumer.NewV2Pact(consumer.MockHTTPProviderConfig{
        Consumer: "frontend", Provider: "user-service",
    })
    if err != nil { t.Fatal(err) }

    err = mock.AddInteraction().
        Given("user 42 exists").                       // provider state
        UponReceiving("a request for user 42").
        WithRequest("GET", "/users/42").
        WillRespondWith(200, func(b *consumer.V2ResponseBuilder) {
            b.Header("Content-Type", matchers.String("application/json"))
            b.JSONBody(matchers.MapMatcher{
                "id":   matchers.Like(42),               // match TYPE, not exact value
                "name": matchers.Like("Alice"),
            })
        }).
        ExecuteTest(t, func(cfg consumer.MockServerConfig) error {
            c := NewUserClient(fmt.Sprintf("http://%s:%d", cfg.Host, cfg.Port))
            u, err := c.GetUser(context.Background(), 42)
            if err != nil { return err }
            if u.Name == "" { return fmt.Errorf("name not parsed") }
            return nil
        })
    if err != nil { t.Fatal(err) }
}
```

**Tips:** match on **types** (`Like`, `Term`, `EachLike`) not literals, or the contract breaks on every data change. Pact-Go v2 needs a native FFI lib; run `pact-go install` in CI before tests. Provider verification (`provider.NewVerifier().VerifyProvider`) replays the JSON with `StateHandlers` seeding each `Given` state; publish pacts to a Pact Broker and run provider verification on **every provider PR**; that's the whole point.

---

## Snapshot Testing {#snapshot-testing}

For large structured output (rendered templates, serialized trees, CLI help), snapshot tests beat hand-written expectations. `go-cmp` golden files ([testing.md#golden-files](testing.md#golden-files)) cover most cases with stdlib + `-update`; reach for `github.com/bradleyjkemp/cupaloy/v2` only for its auto-managed `.snapshots/` ergonomics: `cupaloy.SnapshotT(t, value)`, update with `UPDATE_SNAPSHOTS=true go test`. **The discipline matters more than the tool:** output must be deterministic: sort maps, strip timestamps/UUIDs/addresses before snapshotting, or every run is a false diff. Review `.snapshots/`/`.golden` diffs in PRs **like code** (a blind `-update` defeats the purpose). Prefer golden-file (stdlib + `cmp.Diff`) over a snapshot dep when you can.

---

## Synctest Patterns {#synctest-patterns}

`testing/synctest` [stable 1.26; experiment 1.24] runs `f` in a **bubble**: a fake clock (starts midnight UTC 2000-01-01) that advances only when *every* goroutine in the bubble is **durably blocked**, plus isolation so background goroutines can't leak in. It is *the* tool for timeouts, retries, tickers, rate limiters, and `context.AfterFunc`. Basics: [testing.md#synctest](testing.md#synctest).

```go
import "testing/synctest"

func TestRateLimiterRefill(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {        // [1.26] signature: Test(t, func(*testing.T))
        lim := NewLimiter(10, time.Second)
        for range 10 {
            if !lim.Allow() { t.Fatal("first 10 must pass") }
        }
        if lim.Allow() { t.Fatal("11th must be denied") }

        time.Sleep(time.Second) // fake clock — completes instantly
        synctest.Wait()         // let the refill goroutine settle
        if !lim.Allow() { t.Fatal("must allow after refill") }
    })
}
```

What counts as "durably blocked" (the whole mental model): a channel send/recv or `select` on bubble channels, `sync.Cond.Wait`, `sync.WaitGroup.Wait` (when `Add` happened in the bubble), and `time.Sleep`. **NOT durably blocked:** locking a `sync.Mutex`, **network/file I/O**, and syscalls: something *outside* the bubble could unblock them. So a goroutine parked on a real socket **stalls the bubble** (time never advances) → use `net.Pipe()` for in-process networking, never a loopback listener.

Forbidden inside a bubble: `t.Run`, `t.Parallel`, `t.Deadline`. A `sync.WaitGroup` declared as a *package var* (`var wg sync.WaitGroup`) can't associate with the bubble and won't block durably; use `var wg = new(sync.WaitGroup)` or a local. Cleanups/finalizers (`runtime.AddCleanup`/`SetFinalizer`) run **outside** any bubble.

```go
// CORRECT — Wait() drains pending goroutines so assertions see settled state.
func TestAfterFunc(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {
        ctx, cancel := context.WithCancel(t.Context())
        fired := false
        context.AfterFunc(ctx, func() { fired = true })

        synctest.Wait()
        if fired { t.Fatal("fired before cancel") }
        cancel()
        synctest.Wait()
        if !fired { t.Fatal("must fire after cancel") }
    })
}
```

`synctest.Wait()` returns once all *other* bubble goroutines are durably blocked (it does **not** advance the clock); `time.Sleep` is what advances it. Mixing them (sleep to reach a deadline, `Wait()` to drain side effects) is the core idiom.

---

## Benchmark stability & benchstat {#benchmark-stability}

A single `-bench` run is noise. Statistical comparison is mandatory; modern `benchstat` (`golang.org/x/perf/cmd/benchstat`) reports **median + 95% confidence interval** and a **Mann-Whitney U-test p-value**, not the old "mean ±N%". Benchmark mechanics (`b.Loop` [1.24], `b.ReportAllocs`) are in [testing.md#benchmarks](testing.md#benchmarks); this is about trusting the numbers.

```bash
go test -run=^$ -bench=. -count=10 -benchmem ./... > old.txt   # ≥10 runs; -run=^$ skips tests
# ...make the change...
go test -run=^$ -bench=. -count=10 -benchmem ./... > new.txt
benchstat old.txt new.txt
```

```
                  │   old.txt   │               new.txt               │
                  │   sec/op    │   sec/op     vs base                │
Encode/json-8       1.718µ ± 1%   1.423µ ± 1%  -17.20% (p=0.000 n=10)
Encode/gob-8        3.066µ ± 0%   3.070µ ± 2%        ~ (p=0.446 n=10)
```

Reading it like an expert: `~` under `vs base` means **no statistically significant difference**; do *not* claim a win. A high `± %` means a noisy machine, not a real effect; reduce noise (idle box, AC power, no thermal throttling) before trusting small deltas. **"Significant" ≠ "large"**: with enough samples a 0.5% change is significant but may be irrelevant.

Process traps: (1) **Re-running until green is p-hacking**: at α=0.05, ~1 in 20 unchanged benchmarks reports "significant" by chance; pick `-count` (10, ideally 20) up front. (2) **Interleave**, don't batch: 10 old then 10 new lets thermal drift masquerade as a result. (3) For **noiseless** metrics (binary size, allocs-by-construction) annotate the unit `assume=exact` so benchstat flags any variation. (4) Compare configs in one file with `benchstat -col /format new.txt`; relabel inputs with `benchstat O=old.txt N=new.txt`. See also [performance.md#benchmarking](performance.md#benchmarking).

---

## Flaky-test isolation {#flaky-isolation}

Flakes come from four sources: **(a)** shared mutable state across parallel tests, **(b)** real wall-clock timing, **(c)** ordering dependence, **(d)** leaked goroutines/resources. Fixes map one-to-one.

```go
// CORRECT — parallel subtests with PER-CASE isolated state (no shared `tt` capture footgun in 1.22+,
// but shared fixtures still race). Build state inside the subtest.
func TestHandlers(t *testing.T) {
    cases := []struct{ name, in, want string }{ /* ... */ }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()
            db := newPostgres(t)          // each subtest its own fixture
            // ...assert...
        })
    }
}
```

- (a) Each `t.Parallel()` subtest must own its fixtures; never share a writable map/DB row. Run `go test -race` in CI; most "heisenbugs" are data races. (The 1.22 loop-variable fix removed the classic `tc` capture bug, but *shared* fixtures still race.)
- (b) Replace `time.Sleep`-based synchronization with `synctest` or channel signaling. A test that sleeps to "wait for" something is flaky by construction.
- (c) `go test -shuffle=on` [1.17] randomizes order to surface ordering deps; `-count=1` disables result caching so a flake actually re-runs. Put both in CI.
- (d) Leak detection (below): a leaked goroutine from test N fails test N+1.
- Quarantine, don't ignore: reproduce a suspected flake with `go test -run TestX -count=100 -race`. `t.Skip` with a tracking issue beats a disabled-and-forgotten test.

---

## Coverage of generics {#generics-coverage}

Generic code needs **instantiation coverage**, not just line coverage: a bug can hide in the behavior for one type argument while the lines are "covered" by another. The compiler may also share one instantiation across several types (GC shape stenciling), so coverage tooling counts the *generic* lines once regardless of how many types exercise them; green coverage ≠ all type args tested.

```go
// Table over TYPE ARGUMENTS, not just values. One subtest per instantiation.
func TestMapKeys(t *testing.T) {
    t.Run("int", func(t *testing.T) {
        got := Keys(map[int]string{1: "a", 2: "b"})
        slices.Sort(got)
        if !slices.Equal(got, []int{1, 2}) { t.Fatalf("got %v", got) }
    })
    t.Run("string", func(t *testing.T) {
        got := Keys(map[string]int{"x": 1})
        if !slices.Equal(got, []string{"x"}) { t.Fatalf("got %v", got) }
    })
}
```

**Expert points:** test the **constraint boundaries**: types with surprising comparison/ordering (`NaN` for floats, custom `Ordered`) and the zero value of each. Property-based tests shine here: a generic invariant (`Reverse(Reverse(s)) == s`) checked across `rapid`-generated element types beats any hand table. `go test -cover` reports generic functions, but **instantiation-aware coverage is a known gap** `[verify]`; rely on explicit per-type subtests, not the percentage.

---

## Load Testing {#load-testing}

In-process load assertions catch regressions in CI; full load tests belong in staging, never production.

```go
import vegeta "github.com/tsenart/vegeta/v12/lib"

func TestAPILoad(t *testing.T) {
    if testing.Short() { t.Skip("load test") }
    rate := vegeta.Rate{Freq: 100, Per: time.Second}
    tg := vegeta.NewStaticTargeter(vegeta.Target{Method: "GET", URL: srvURL + "/users"})
    var m vegeta.Metrics
    for res := range vegeta.NewAttacker().Attack(tg, rate, 10*time.Second, "load") {
        m.Add(res)
    }
    m.Close()
    if m.Success < 0.99 { t.Errorf("success %.2f%% < 99%%", m.Success*100) }
    if m.Latencies.P99 > 200*time.Millisecond { t.Errorf("p99 %v > 200ms", m.Latencies.P99) }
}
```

| Tool | Best for | Form |
|------|----------|------|
| **Vegeta** | Constant-rate API attacks, in-CI thresholds | Go lib **or** CLI (`echo "GET …" \| vegeta attack -rate=100/s -duration=30s \| vegeta report`) |
| **k6** | Scripted multi-step scenarios, ramp stages | JS scripts, `thresholds` for pass/fail |

Assert on **p99/p999** latency and success rate, never the mean (it hides tail pain). Keep these behind `testing.Short()`.

---

## Chaos Engineering {#chaos-engineering}

Inject faults to verify resilience (retries, breakers, timeouts from [errors-and-resilience.md](errors-and-resilience.md)) actually fire.

```go
import toxiproxy "github.com/Shopify/toxiproxy/v2/client"

func TestDBLatencyTolerance(t *testing.T) {
    client := toxiproxy.NewClient("localhost:8474")
    proxy, err := client.CreateProxy("pg", "localhost:15432", "postgres:5432")
    if err != nil { t.Fatal(err) }
    t.Cleanup(func() { proxy.Delete() })

    proxy.AddToxic("lag", "latency", "downstream", 1.0, toxiproxy.Attributes{
        "latency": 500, "jitter": 100,
    })
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    if _, err := svc.GetUser(ctx, "42"); err == nil {
        t.Error("expected timeout/degraded response under injected latency")
    }
}
```

Toxics: `latency`, `bandwidth`, `slow_close`, `timeout`, `slicer`, `reset_peer`, `limit_data`. Toxiproxy needs a running server (Docker in CI). **Zero-dependency alternative**: wrap a dependency and fail deterministically:

```go
type faultyStore struct {
    Store
    failAfter, calls int
}
func (f *faultyStore) Get(ctx context.Context, k string) (string, error) {
    f.calls++
    if f.calls > f.failAfter { return "", errors.New("injected: connection reset") }
    return f.Store.Get(ctx, k)
}
```

Interface-based injection covers most needs (test that retry stops after N, that a breaker opens); reach for Toxiproxy only when you need *network-level* faults (partial reads, latency, RST).

---

## Goroutine Leak Detection {#goroutine-leaks}

```go
import "go.uber.org/goleak"

// Preferred: one check per package — works WITH t.Parallel().
func TestMain(m *testing.M) { goleak.VerifyTestMain(m) }

// Per-test only when you need scoping — but it conflicts with t.Parallel().
func TestNoLeak(t *testing.T) {
    defer goleak.VerifyNone(t,
        goleak.IgnoreTopFunction("database/sql.(*DB).connectionOpener"), // known pool goroutine
    )
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()                        // omit this and the test reports the leak
    go worker(ctx)
}
```

**Why models get this wrong:** `goleak.VerifyNone(t)` snapshots all goroutines at call time, so under `t.Parallel()` *sibling* tests' goroutines get flagged as leaks; `VerifyNone` and `t.Parallel()` are **mutually exclusive**. `VerifyTestMain` runs after the package finishes and is the right default. Filter genuine long-lived runtime goroutines (DB pools, `http.Server`, the reaper) with `IgnoreTopFunction`/`IgnoreCurrent`, not by disabling the check. Go 1.26 also ships an experimental **goroutine-leak profile** in the runtime for production diagnosis, complementary to `goleak`. See also [concurrency.md#goroutine-lifecycle](concurrency.md#goroutine-lifecycle).

---

## Test Architecture {#test-architecture}

Helpers (`t.Helper()` fixes the reported line; `t.Cleanup` runs after subtests and even after `t.FailNow`):

```go
func TempDB(t *testing.T) *sql.DB {
    t.Helper()
    db := openTestDB(t)
    migrate(t, db)
    t.Cleanup(func() { db.Close() })   // beats defer: survives t.Fatal, composes across helpers
    return db
}
```

Fixtures via `embed` keep `testdata/` the single source of truth (and `go vet`/tooling ignores `testdata/`):

```go
//go:embed testdata/users.json
var usersJSON []byte
```

Layout:

```
internal/
├── testutil/              # shared helpers, fixtures, testdata/
└── user/
    ├── repo.go
    ├── repo_test.go            # white-box (package user) — unexported access
    ├── repo_export_test.go     # black-box (package user_test) — public API only
    └── repo_integ_test.go      # //go:build integration
tests/e2e/                  # separate go.mod: heavy deps don't pollute the main module graph
```

Rules: `//go:build integration` (or `testing.Short()`) gates slow tests; `package foo_test` (black-box) tests the public API and prevents testing internals you'll refactor; one `TestMain` per package for shared setup (container, `goleak`, global migrations); keep e2e in a separate module. **Don't put assertion helpers in `_test.go` of the package under test if other packages need them**; promote to `internal/testutil`.

---

## Library landscape & status {#libraries}

| Library | Status [2026] | Use when |
|---|---|---|
| stdlib `testing` (fuzz, `b.Loop`, subtests) | **Default** | Almost always |
| `testing/synctest` (stdlib) | **Stable** [1.26] | Time/concurrency determinism; supersedes injected `Clock` interfaces in tests |
| `pgregory.net/rapid` | Active, standard | Property-based + stateful/model tests |
| `go.uber.org/mock` (`github.com/uber/mock`) | **Active**, v0.6.0, the maintained gomock | Generated mocks with call-order/count assertions |
| `github.com/golang/mock` | **Archived** | Never; migrate to `go.uber.org/mock` |
| `matryer/moq` | Active | Struct-of-funcs generated mocks (hand-mock feel) |
| `mockery` | Active | testify-style generated mocks, YAML-configured |
| `testcontainers-go` | Active, standard | Real deps (DB/broker/cache) in throwaway containers |
| `ory/dockertest` | Active, lighter | Simpler container lifecycle, fewer modules |
| `go.uber.org/goleak` | Active, standard | Goroutine-leak detection (`VerifyTestMain`) |
| `golang.org/x/perf/cmd/benchstat` | Active (Go team) | Statistical A/B benchmark comparison |
| `github.com/stretchr/testify` | Active, ubiquitous | Assertions/`require`; `mock` for testify-style mocking |
| `github.com/google/go-cmp` | Active, standard | Deep equality + golden diffs (`cmp.Diff`) |
| `pact-foundation/pact-go/v2` | Active | Consumer-driven contract testing (needs FFI) |
| `Shopify/toxiproxy` (client) | Active | Network-level fault injection |
| `tsenart/vegeta/v12` | Active | Constant-rate load testing (lib + CLI) |
| `cupaloy/v2` | Maintained | Snapshot testing (prefer stdlib golden when feasible) |

---

## Version map 1.18→1.27 {#versions}

| Ver | Testing-relevant |
|---|---|
| **1.18** | Native fuzzing (`testing.F`, `f.Add`/`f.Fuzz`, `testdata/fuzz`, coverage-guided) |
| **1.20** | Coverage for integration tests (`go build -cover`); `go test -shuffle` matured |
| **1.22** | Loop-variable scoping fixed (kills the classic `t.Parallel` capture bug); `go test` range-over-int in cases |
| **1.24** | `b.Loop()` (opt-out of dead-code elim, auto setup/teardown timing); `tool` directive (pin `mockgen`); `synctest` experiment (`GOEXPERIMENT=synctest`, `synctest.Run`) |
| **1.25** | `synctest` graduates to `testing/synctest` (`Test`/`Wait`) in this line; `go test -json` improvements |
| **1.26** | `testing/synctest` **stable**; `t.ArtifactDir()` + `go test -artifacts`; `go.uber.org/mock` ecosystem at v0.6.x; experimental goroutine-leak profile |
| **1.27 (RC)** | Generic methods (richer generic test helpers); `encoding/json/v2` GA (golden/snapshot error text & output may differ; re-baseline). Treat as draft until GA (~Aug 2026). |

> Note: `synctest`'s exact graduation point is the 1.25→1.26 line; this skill targets the **stable** `synctest.Test` API [1.26]. The 1.24 experiment used `synctest.Run(func())`.

---

## What models get wrong {#stale}

1. Trying to fuzz a struct/slice/map: **only the scalar+`string`+`[]byte` set is allowed**; fuzz `[]byte` and decode, or use `rapid`.
2. `f.Add` seeds whose types don't match the fuzz args exactly → panic at test start, not a compile hint.
3. Letting `go test -fuzz` run with no `-fuzztime` in CI (runs forever); or forgetting that **seeds + `testdata/fuzz` regressions run on plain `go test`** and must be committed (generated corpus in `$GOCACHE` must not).
4. Importing the **archived `github.com/golang/mock`**; the maintained fork is `go.uber.org/mock` [v0.6.0].
5. `defer ctrl.Finish()` after `gomock.NewController(t)`; redundant; the controller registers `t.Cleanup`.
6. Mocking the database/clock/value types instead of **using a container** / `synctest`; mocks encode assumptions, then pass while the real query/timing is wrong.
7. `goleak.VerifyNone(t)` together with `t.Parallel()`; sibling goroutines flag as leaks; use `VerifyTestMain`.
8. Reporting a single `-bench` run, or claiming a win when benchstat shows `~` (no significant difference); **re-running until green is p-hacking**.
9. Reading benchstat as "mean ±%"; it's **median + 95% CI + Mann-Whitney p**; high `±%` means a noisy machine, not a result.
10. `time.Sleep` to synchronize tests; flaky by construction; use `synctest` or channels.
11. Calling `t.Run`/`t.Parallel`/`t.Deadline` **inside a `synctest` bubble** (forbidden), or doing real network/file I/O in a bubble (stalls the fake clock, use `net.Pipe`).
12. `defer` for teardown that must survive `t.Fatal`; use `t.Cleanup`.
13. Assuming generic code is tested because lines are covered; it needs **per-type-argument** subtests / property tests.
14. Snapshot/golden tests over non-deterministic output (timestamps, map order, UUIDs) → perpetual false diffs.
15. Pact matchers on literal values instead of `Like`/`EachLike` types → contract breaks on every data change.
16. Starting queries before a testcontainer is *ready* (port-open ≠ accepting); use a log/ping wait strategy (`WithOccurrence(2)` for Postgres).
17. Forgetting `-shuffle=on` / `-count=1` in CI; caches hide flakes and ordering deps.

---

## See Also {#see-also}
- [testing.md](testing.md): table-driven, subtests, `httptest`, basic fuzz/`b.Loop`/golden, synctest basics
- [concurrency.md](concurrency.md): race detector, goroutine lifecycle, `errgroup`
- [errors-and-resilience.md](errors-and-resilience.md): retries/breakers/timeouts the chaos tests exercise
- [performance.md](performance.md#benchmarking): profiling, deeper benchstat methodology
- [database.md](database.md): repository design that integration tests target

## Sources {#sources}
- pkg.go.dev: testing, testing/synctest (Test/Wait, durably-blocked & isolation rules), go.uber.org/mock/gomock (v0.6.0), pgregory.net/rapid, golang.org/x/perf/cmd/benchstat
- go.dev/doc/security/fuzz (arg type set, corpus layout, 1s timeout, AMD64/ARM64 coverage, file2fuzz, OSS-Fuzz); go.dev/doc/tutorial/fuzz
- go.dev/doc/go1.18-go1.27 release notes; go.dev/blog/synctest, go.dev/blog/fuzz-beta
- testcontainers.com/docs (wait strategies, modules), pact.io (consumer-driven contracts), go.uber.org/goleak, github.com/tsenart/vegeta, github.com/Shopify/toxiproxy
