---
name: flamegraphs
description: 'Use when turning perf, DTrace, pprof, or async-profiler stacks into an SVG flamegraph with the FlameGraph scripts, reading one, or diffing two profiles. Not for collecting data: use linux-perf.'
---

# Flamegraphs

A flamegraph draws every sampled stack as a column of frames, merges identical prefixes, and sets each frame's width to its share of samples. The x axis is sample share, not time order; the y axis is stack depth; colors carry no meaning unless a palette or a diff assigns one. The pipeline is always the same three stages: a profiler emits stacks, a `stackcollapse-*` script folds them to one line per unique stack with a count, and `flamegraph.pl` renders the SVG. The scripts live in `https://github.com/brendangregg/FlameGraph` and run from the checkout without an install step.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user has profiler output and wants an SVG, wants to read an existing flamegraph, or wants a before-and-after comparison of two profiles. |
| Authority | Reversible local: writes only the FlameGraph checkout, folded stack files, and SVG files in the working directory; rollback is deleting them. No remote mutation. |
| Side effect | Files on disk. No process is profiled by this skill; collection belongs to `linux-perf` or the profiler in question. |
| Done | The SVG exists, the widest leaf frame is named as the hotspot with its percentage, and, for a diff, the frames with the largest positive and negative change are named. |

## Inputs

- Profiler output: `perf script` text, a DTrace `ustack()` aggregation, Go pprof raw text, async-profiler collapsed output, or `heaptrack_print -F` folded stacks.
- The FlameGraph checkout on `PATH`: `git clone https://github.com/brendangregg/FlameGraph` then `export PATH="$PATH:$PWD/FlameGraph"`.
- For a diff: two folded files from the same program under the same workload.
- Perl for the scripts. Rust `inferno` is a drop-in reimplementation when Perl is unavailable.

## Procedure

1. Collect stacks with the profiler. For perf: `perf record -F 999 -g -o perf.data ./prog` and `perf script -i perf.data > out.perf` (`linux-perf` covers permissions and frame pointers). Done when: the raw stack text exists.
2. Fold the stacks with the collapser for the source format:

   | Source | Collapser |
   |---|---|
   | `perf script` | `stackcollapse-perf.pl out.perf > out.folded` |
   | DTrace `ustack()` aggregation | `stackcollapse.pl out.stacks > out.folded` |
   | Go `go tool pprof -raw -output=prof.txt ./prog` | `stackcollapse-go.pl prof.txt > out.folded` |
   | SystemTap | `stackcollapse-stap.pl` |
   | Java `jstack` dumps | `stackcollapse-jstack.pl` |
   | Lightweight Java Profiler | `stackcollapse-ljp.awk` |
   | async-profiler | none needed: `asprof -d 30 -f out.collapsed <pid>` writes folded output directly (the `.collapsed` extension selects the format) |
   | heaptrack | none needed: `heaptrack_print -f run.zst -F out.folded` |

   A folded line reads `main;parse;tokenize 1234`. FlameGraph ships no Callgrind converter; for Valgrind Callgrind data use `callgrind_annotate` or KCachegrind through `valgrind`. Done when: the folded file has one stack per line with a trailing count.
3. Render: `flamegraph.pl out.folded > fg.svg`. Useful options: `--title "text"`, `--subtitle "text"`, `--width <px>`, `--height <px per frame>`, `--minwidth <n>` to hide frames narrower than `n` pixels (or `n%` of samples), `--colors <palette>` (`hot` default, `mem`, `io`, `wakeup`, `chain`, `java`, `js`, `perl`, and flat `red`, `green`, `blue`, `aqua`, `yellow`, `purple`, `orange`), `--countname bytes` when the counts are not samples, `--inverted` for an icicle chart, `--reverse` to merge from the leaf, `--hash` for a color per function name that is stable across runs, `--cp` for a consistent palette saved in `palette.map`. A one-liner: `perf record -F 999 -g ./prog && perf script | stackcollapse-perf.pl | flamegraph.pl > fg.svg`. Done when: `fg.svg` opens in a browser (`xdg-open fg.svg`).
4. Read the graph. Hover shows the frame name, sample count, and percentage; click zooms; the search box highlights matches. The actionable hotspot is the widest frame with no or only narrow children above it, because that is where the CPU is when sampled. Trace downward from it to learn who calls it and why.

   | Shape | Meaning | Move |
   |---|---|---|
   | Wide plateau at the top | Leaf function is the hotspot | Optimize its body |
   | Wide base with many narrow towers | One caller fans out to many callees | Reduce per-call overhead, batch, or cache |
   | Very tall narrow tower | Deep recursion or call chain | Check depth; consider iteration |
   | Row of tiny slivers sharing width | Cost spread across many small functions | Algorithmic change or inlining, not micro-tuning |
   | One frame spanning most of the width at every level | Single bottleneck | Fix it before anything else |

   Done when: the hotspot is named with its percentage and its caller chain.
5. Diff two profiles: collapse both, then `difffolded.pl before.folded after.folded | flamegraph.pl > diff.svg`. Widths come from the `after` profile; red frames grew, blue frames shrank, pale shades are small changes, and a frame in only one profile is solid. `-n` normalizes the two sample totals before differencing, `-s` strips hex addresses so JIT or ASLR addresses do not split identical stacks. `difffolded.pl -n after.folded before.folded | flamegraph.pl --negate > diff_inv.svg` flips the sign so improvements read as red. Done when: the largest regression and the largest improvement are named.

Alternatives, when the SVG is not the right surface: `perf script | speedscope -` (`npm install -g speedscope`) for an interactive left-heavy and sandwich view; `perf script -F +pid > profile.perf` dropped onto `profiler.firefox.com`; `cargo install inferno` for `perf script | inferno-collapse-perf | inferno-flamegraph > fg.svg`; `cargo install flamegraph` for `cargo flamegraph --bin mybin`, which drives perf itself. Details and per-profiler recipes are in `references/tools.md`.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| Graph is one flat row of `[unknown]` | Stacks not captured | Record with `-g` or `--call-graph dwarf`; build with `-fno-omit-frame-pointer` (`linux-perf`) |
| Every stack is distinct, graph is a comb | Addresses in frame names | `difffolded.pl -s`, or fix symbol resolution so names replace addresses |
| Diff shows everything red | Different sample totals | Add `-n`, or record both runs for the same duration |
| `flamegraph.pl` prints `ERROR: No stack counts found` | Input not folded | Run the collapser first; check for a trailing count on each line |
| Colors change between renders | Random palette | `--hash` or `--cp` |
| Callgrind data | No converter in FlameGraph | `callgrind_annotate` or KCachegrind via `valgrind` |

## Output

The SVG path, the folded file paths, the hotspot named with its percentage and caller chain, and, for a diff, the largest regression and improvement with their frames.
