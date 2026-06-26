# Optimize — Tooling Matrix & Harness Templates

Used in Phase 2 (light locate) and Phase 3 (baseline benchmark) of the `/optimize` workflow.
A profiling/locate tooling matrix, extended
with benchmark harness templates for Phase 3's author-a-harness path.

---

## Per-Language Tooling Matrix

| Language | CPU profiler | Memory/alloc profiler | Benchmark / differential |
|---|---|---|---|
| **Rust** | `samply record`, `perf record` + `flamegraph`, `cargo flamegraph` | `heaptrack`, `dhat`, `valgrind --tool=massif` | `criterion`, `iai-callgrind`, `hyperfine` |
| **C / C++** | `perf record` + `flamegraph`, `valgrind --tool=callgrind`, `samply` | `valgrind --tool=massif`, `heaptrack`, `dhat` | `hyperfine`, `google/benchmark`, `criterion.rs` (C via cbindgen) |
| **Python** | `py-spy record --format flamegraph`, `scalene`, `cProfile` + `snakeviz` | `scalene` (memory mode), `tracemalloc`, `memray` | `pytest-benchmark`, `asv` (airspeed velocity), `hyperfine` |
| **Go** | `go tool pprof` (CPU profile via `runtime/pprof`), `go test -cpuprofile` | `go tool pprof` (heap), `runtime.MemStats` | `go test -bench -benchmem`, `benchstat`, `hyperfine` |
| **Java / Kotlin** | `async-profiler`, JFR (`jcmd <pid> JFR.start`) | JFR allocation events, Eclipse MAT on heap dump | JMH, `hyperfine` |
| **JavaScript / TypeScript** | Chrome DevTools, `node --prof` + `node --prof-process`, `clinic flame` | Chrome heap snapshot, `clinic doctor` | `tinybench`, `mitata`, `hyperfine` |
| **OCaml** | `landmarks`, `magic-trace`, `perf record` | `memtrace` + `memtrace-viewer`, `Statmemprof` | `bechamel`, `core_bench`, `hyperfine` |

**Tool rules (inherit from the ODIN banned-tool list):**
- `hyperfine` not `time`. `procs` not `ps`. `bat -P -p -n` not `cat`. `difft` not `diff`.
- Always `--warmup 3 --min-runs 10` on hyperfine. Export JSON: `--export-json <path>`.
- Profile in a release/optimized build, never debug. Benchmark the same binary that will ship.

---

## Minimal Harness Templates

Use these when Phase 3 finds no existing benchmark harness for the hot path. It is a **throwaway
instrument** — its only purpose is to measure `HOT_PATH` in isolation with realistic inputs.
Delete it after the skill run unless the user asks to keep it as a regression guard.

**Harness placement — toolchain-native vs portable:**

- **Python, TypeScript, OCaml** — toolchain-agnostic runners discover files by path argument;
  write the harness directly to `.outline/optimize/<target>/` and invoke it from there.
- **Rust (`cargo bench`)** — `cargo` discovers benches only under the project's `benches/`
  directory (registered in `Cargo.toml` or auto-discovered by convention). Write the harness to
  `<project-root>/benches/bench_<target>.rs`. Run from `<project-root>` as shown. Remove after
  the skill run.
- **Go (`go test -bench`)** — `go test` runs only within the package directory. Write the
  `_test.go` harness alongside the source file being benchmarked (same package directory). Run
  from that directory. Remove after the skill run.
- **JMH (Java/Kotlin)** — JMH requires the benchmark to live in the standard JMH source layout
  (`src/jmh/java/` for Gradle, `src/test/java/` annotated appropriately for Maven). Write to
  that location; run the build task (`./gradlew jmh` or `mvn jmh:benchmark`) from the project
  root. Remove after the skill run.

The `BENCH_CMD` passed to lens agents must reflect the actual invocation path after placement.

### Rust — criterion

```rust
// <project-root>/benches/bench_<target>.rs  (toolchain-native; registered in Cargo.toml)
use criterion::{criterion_group, criterion_main, Criterion};
use <crate>::<module>::<hot_function>;

fn bench(c: &mut Criterion) {
    // Replace with realistic input that exercises the hot path.
    let input = setup_realistic_input();
    c.bench_function("<hot_function>", |b| b.iter(|| <hot_function>(criterion::black_box(&input))));
}

criterion_group!(benches, bench);
criterion_main!(benches);
```

Run: `cargo bench --bench bench_<target> -- --save-baseline before`

### Python — pytest-benchmark

```python
# .outline/optimize/<target>/bench_<target>.py
from <module> import <hot_function>

def test_<hot_function>(benchmark):
    input_data = setup_realistic_input()
    benchmark(<hot_function>, input_data)
```

Run: `pytest .outline/optimize/<target>/bench_<target>.py --benchmark-json before.json`

### Go

```go
// <pkg-dir>/bench_<target>_test.go  (alongside the source file under test, same package)
package <pkg>  // same-package: no import needed, call unexported functions directly

import "testing"

func Benchmark<HotFunction>(b *testing.B) {
    input := setupRealisticInput()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        <HotFunction>(input)  // direct call — no package qualifier
    }
}
```

// For exported-API-only hot paths, swap `package <pkg>` → `package <pkg>_test` and add
// `import "<module>"`, then call `<module>.<HotFunction>(input)`.

Run: `go test -bench=Benchmark<HotFunction> -benchmem -count=10 .`
Diff: `benchstat before.txt after.txt`

### Java / Kotlin — JMH

```java
// src/jmh/java/BenchHotPath.java  (Gradle) or src/test/java/ with @Fork (Maven)
@State(Scope.Thread)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@Warmup(iterations = 3)
@Measurement(iterations = 10)
public class BenchHotPath {
    private InputType input;

    @Setup
    public void setup() { input = setupRealisticInput(); }

    @Benchmark
    public ResultType bench() { return HotClass.hotFunction(input); }
}
```

Run: `./gradlew jmh` or `mvn jmh:benchmark`

### JavaScript / TypeScript — tinybench

```typescript
// .outline/optimize/<target>/bench.<target>.ts
import { Bench } from "tinybench";
import { hotFunction } from "<module>";

const bench = new Bench({ iterations: 100, warmupIterations: 10 });
const input = setupRealisticInput();

bench.add("<hotFunction>", () => { hotFunction(input); });

await bench.run();
console.table(bench.table());
```

Run: `npx tsx .outline/optimize/<target>/bench.<target>.ts`
Or via `hyperfine 'npx tsx bench.<target>.ts'` for wall-clock comparison.

### OCaml — bechamel

```ocaml
(* .outline/optimize/<target>/bench_<target>.ml *)
open Bechamel
open Toolkit

let test =
  Test.make ~name:"<hot_function>" (fun () ->
    let input = setup_realistic_input () in
    Staged.stage (fun () -> <Module>.<hot_function> input))

let () =
  let cfg = Benchmark.cfg ~limit:100 ~quota:(Time.second 5.) () in
  let ols = Analyze.ols ~bootstrap:0 ~r_square:true ~predictors:[| Measure.run |] in
  let results = Benchmark.all cfg [ test ] in
  let analysis = Analyze.all ols results in
  Bechamel_notty.Unit.run Fmt.stderr analysis
```

---

## Measurement Discipline

- **stddev > 20 % of median** — stop and fix measurement noise before proceeding.
  Causes: CPU frequency scaling, background load, cold cache, OS jitter.
  Fixes: `cpupower frequency-set -g performance`, `nice -n -20`, warm-up runs, pin to a core
  (`taskset 0x1`), disable turbo boost (`echo 1 > /sys/devices/.../no_turbo`).
- **Always measure what ships.** Optimize + benchmark the release build; debug builds have
  different inlining, bounds-check overhead, and optimization levels.
- **Re-measure end-to-end (Phase 7, integrated benchmark gate).** A worktree win sometimes
  vanishes after integration due to changed inlining decisions, link order, or PGO profile
  invalidation. The integrated re-measure on the main tree before commit is the ground truth.
- **Report variance, not just median.** Commit body format: `After: <median> ± <stddev>`.
  A 10 % speedup with 15 % stddev is noise; a 10 % speedup with 1 % stddev is a win.
