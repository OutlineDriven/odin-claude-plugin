---
name: rust-profiling
description: 'Use when profiling Rust binaries with flamegraphs, cargo-bloat, cargo-llvm-lines, Criterion, perf, heaptrack, or DHAT'
---

# Rust profiling

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Profiling Rust performance, reducing binary size, measuring monomorphization bloat, writing Criterion benchmarks, or interpreting flamegraphs and perf output. |
| Authority | Read-only. Emits a guidance report and command transcripts to chat. No source or remote mutation. |
| Side effect | Emits a structured guidance report with profiling commands, benchmark setup, and interpretation. No source files are modified. |
| Done | A report is emitted that names the hot path, bloat source, size contributor, or benchmark result and the next action to take. |

## Inputs

1. **Target binary or benchmark** (required): the program, test, or Criterion benchmark to measure.
2. **Build profile** (required if not inferrable): a release profile with debug symbols (`release-with-debug` or `CARGO_PROFILE_RELEASE_DEBUG=true`).
3. **Profiling tool** (required): `cargo-flamegraph`, `cargo-bloat`, `cargo-llvm-lines`, Criterion, `perf`, `heaptrack`, or `valgrind --tool=dhat`.
4. **Optional inputs**: a saved baseline for comparison, or a specific function to annotate.

## Procedure

1. **Build for profiling.** Use a release profile with `debug = true` or set `CARGO_PROFILE_RELEASE_DEBUG=true`. For line-level attribution with faster builds, use `debug = 1`. For better call graphs, set `RUSTFLAGS="-C force-frame-pointers=yes"`. Done when: the binary has debug symbols and frame pointers are configured as needed.
2. **Generate a flamegraph.** Run `cargo flamegraph --bin <name> -- <args>`, or use `perf record -g` followed by `stackcollapse-perf.pl` and `flamegraph.pl`. Look for wide top frames, unexpected standard-library and allocator frames, and thin closure frames. Done when: a flamegraph SVG identifies hot leaves.
3. **Measure binary size with cargo-bloat.** Run `cargo bloat --release -n 20`, `cargo bloat --release --crates`, or `cargo bloat --release --filter <crate>`. Compare before and after with saved output. Done when: the largest size contributors are listed.
4. **Measure monomorphization bloat with cargo-llvm-lines.** Run `cargo llvm-lines --release | head -40`. A high `Copies` count usually means generic monomorphization; confirm by reading the function and its type parameters. Reduce it with a thin generic wrapper plus a concrete inner function. Done when: the functions with the most LLVM IR and copies are named.
5. **Write Criterion benchmarks.** Add `criterion` to `dev-dependencies`, create `benches/<name>.rs` with `criterion_group!` and `criterion_main!`, use `black_box` to prevent optimization, and compare with saved baselines. Done when: a benchmark file runs and produces a report.
6. **Profile with perf on Linux.** Record with `perf record -g -F 999 <binary>`, report with `perf report` or `perf annotate`, and gather quick counters with `perf stat`. Done when: the hot function and call graph are visible.
7. **Profile allocations with heaptrack or DHAT.** Run `heaptrack <binary>` and inspect with `heaptrack_print`, or run `valgrind --tool=dhat <binary>` and view `dhat-out.*` with `dh_view.html`. Done when: allocation hotspots and lifetimes are identified.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No debug symbols | Rebuild with `debug = true` or `debug = 1`. |
| Incomplete call graph | Set `RUSTFLAGS="-C force-frame-pointers=yes"` and disable ASLR with `setarch $(uname -m) -R`. |
| Flamegraph permission denied | Lower `perf_event_paranoid` to 1 or run with sudo/DTrace on macOS. |
| Benchmark results are noisy | Increase `measurement_time`, `sample_size`, and `warm_up_time` in Criterion. |
| Allocation profile is too large | Filter to a smaller workload or reduce profiling duration. |

## Output

1. A structured guidance report with the chosen tool, measured result, and interpretation.
2. A recommended next action: a code change, a new benchmark, or a further profiling pass.
3. Commands to reproduce the measurement.
