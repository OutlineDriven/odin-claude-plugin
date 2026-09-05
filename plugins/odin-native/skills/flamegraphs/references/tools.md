# FlameGraph tools reference

Sources: `https://github.com/brendangregg/FlameGraph` (scripts and `flamegraph.pl --help` at the current default branch, checked 2026-09-05) and `https://www.brendangregg.com/flamegraphs.html`.

## Scripts in the checkout

| Script | Input |
|---|---|
| `stackcollapse-perf.pl` | `perf script` output |
| `stackcollapse-perf-sched.awk` | `perf script` output of `sched:sched_switch` traces, for off-CPU graphs |
| `stackcollapse.pl` | DTrace `ustack()` or `stack()` aggregations |
| `stackcollapse-bpftrace.pl` | bpftrace stack maps |
| `stackcollapse-stap.pl` | SystemTap |
| `stackcollapse-go.pl` | `go tool pprof -raw` text |
| `stackcollapse-jstack.pl` | Java `jstack` dumps |
| `stackcollapse-ljp.awk` | Lightweight Java Profiler |
| `stackcollapse-gdb.pl` | gdb backtraces |
| `stackcollapse-vtune.pl`, `stackcollapse-vtune-mc.pl` | Intel VTune exports |
| `stackcollapse-elfutils.pl` | elfutils `stack` output |
| `stackcollapse-chrome-tracing.py` | Chrome tracing JSON |
| `stackcollapse-recursive.pl` | Collapses recursive frames in an already folded file |
| `difffolded.pl` | Two folded files, emits a differential folded file |
| `flamegraph.pl` | Folded stacks, emits SVG |

There is no Callgrind or gprof collapser in the repository.

## Recipes

Linux perf:

```bash
perf record -F 999 -g -o perf.data ./prog
perf script -i perf.data > out.perf
stackcollapse-perf.pl out.perf > out.folded
flamegraph.pl out.folded > fg.svg
```

DTrace (macOS, FreeBSD, illumos), user stacks of one program for 30 seconds:

```bash
sudo dtrace -x ustackframes=100 \
  -n 'profile-997 /execname=="prog"/ { @[ustack()] = count(); }' \
  -o out.stacks sleep 30
stackcollapse.pl out.stacks > out.folded
flamegraph.pl out.folded > fg.svg
```

Go pprof:

```bash
go tool pprof -raw -output=cpu.txt ./prog cpu.pprof
stackcollapse-go.pl cpu.txt > out.folded
flamegraph.pl out.folded > fg.svg
```

Java with async-profiler 3.x (`asprof` replaced `profiler.sh` in 3.0):

```bash
asprof -d 30 -f out.collapsed <pid>      # .collapsed selects the folded format
flamegraph.pl --colors java out.collapsed > fg.svg
```

Rust, driving perf through cargo:

```bash
cargo install flamegraph
cargo flamegraph --bin mybin              # writes flamegraph.svg
```

heaptrack allocation graph:

```bash
heaptrack_print -f heaptrack.prog.1234.zst -F heap.folded --flamegraph-cost-type peak
flamegraph.pl --countname bytes --colors mem heap.folded > heap.svg
```

## flamegraph.pl options

| Option | Default | Effect |
|---|---|---|
| `--title TEXT` | `Flame Graph` | Title |
| `--subtitle TEXT` | none | Second title line |
| `--width NUM` | 1200 | Image width in pixels |
| `--height NUM` | 16 | Frame height in pixels |
| `--minwidth NUM` | 0.1 | Omit frames narrower than NUM pixels, or `NUM%` of samples |
| `--fonttype FONT` | Verdana | Font family |
| `--fontsize NUM` | 12 | Base font size |
| `--countname TEXT` | `samples` | Count label in tooltips |
| `--nametype TEXT` | `Function:` | Name label in tooltips |
| `--colors PALETTE` | `hot` | `hot`, `mem`, `io`, `wakeup`, `chain`, `java`, `js`, `perl`, `red`, `green`, `blue`, `aqua`, `yellow`, `purple`, `orange` |
| `--bgcolors COLOR` | palette-dependent | Background gradient or flat color |
| `--hash` | off | Color keyed by function-name hash, stable across runs |
| `--random` | off | Random colors |
| `--cp` | off | Consistent palette persisted in `palette.map` |
| `--reverse` | off | Merge stacks from the leaf |
| `--inverted` | off | Icicle graph, root at the top |
| `--flamechart` | off | Sort by time instead of merging stacks |
| `--negate` | off | Swap red and blue in a differential graph |
| `--notes TEXT` | none | Comment embedded in the SVG |

## Differential graphs

```bash
difffolded.pl before.folded after.folded | flamegraph.pl > diff.svg
difffolded.pl -n -s before.folded after.folded | flamegraph.pl > diff.svg          # normalized, addresses stripped
difffolded.pl -n after.folded before.folded | flamegraph.pl --negate > diff_inv.svg  # improvements in red
```

Frame widths come from the second file. Red is more samples in the second file, blue fewer; saturation scales with the size of the change; a frame present in only one file is fully colored.

## Other renderers

| Tool | Install | Use |
|---|---|---|
| speedscope | `npm install -g speedscope` | `perf script -i perf.data \| speedscope -` opens the browser with time-order, left-heavy, and sandwich views |
| Firefox Profiler | none | `perf script -F +pid > profile.perf`, then drop the file on `profiler.firefox.com` |
| inferno | `cargo install inferno` | `perf script \| inferno-collapse-perf \| inferno-flamegraph > fg.svg`; also `inferno-collapse-dtrace`, `inferno-collapse-guess` |
| pprof web UI | Go toolchain | `go tool pprof -http=:8080 profile.pb.gz`, flame view in the browser |

## Reading patterns

| Shape | Interpretation | Move |
|---|---|---|
| Wide top frame (leaf) | Time is spent in this function body | Optimize it |
| Wide base, many narrow towers | One caller, many callees | Reduce call overhead, cache, batch |
| Very tall stack | Deep recursion or call chain | Check depth; iterative rewrite |
| Plateau of tiny slivers | Cost spread thin | Algorithmic change or inlining |
| One frame dominating every level | Single bottleneck | Fix it first |
| Diff: red at the base, blue at the top | Cost moved deeper | A new hotspot lower in the chain |

The actionable hotspot is the widest frame with no wide children above it.
