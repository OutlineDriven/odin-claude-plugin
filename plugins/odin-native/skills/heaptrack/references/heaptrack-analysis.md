# heaptrack_print reference

Options below come from `heaptrack_print --help` on heaptrack 1.5.0. Boolean options take `0` or `1`.

| Option | Default | Effect |
|---|---|---|
| `-f, --file <path>` | | Data file to read |
| `-d, --diff <path>` | | Second data file; every ranking becomes the delta of `--file` minus `--diff` |
| `-p, --print-peaks` | `1` | Rank stacks by bytes live at the global peak |
| `-a, --print-allocators` | `1` | Rank stacks by number of allocation calls |
| `-T, --print-temporary` | `1` | Rank stacks by temporary allocations (freed before the next allocation) |
| `-l, --print-leaks` | `0` | Rank stacks by bytes never freed |
| `-n, --peak-limit <N>` | `10` | Entries per ranking |
| `-s, --sub-peak-limit <N>` | `5` | Backtraces per merged peak location |
| `-t, --shorten-templates` | `1` | Collapse template arguments in symbol names |
| `-m, --merge-backtraces` | `1` | Merge identical stacks |
| `-F, --print-flamegraph <path>` | | Write folded stacks for `flamegraph.pl` |
| `--flamegraph-cost-type <t>` | `peak` | `allocations`, `temporary`, `leaked`, or `peak` |
| `-M, --print-massif <path>` | | Write a Massif-format file for `ms_print` |
| `--massif-threshold <pct>` | `1` | Aggregate allocations below this share of current usage |
| `--massif-detailed-freq <N>` | `2` | Every Nth Massif snapshot is detailed |
| `-H, --print-histogram <path>` | | Write an allocation-size histogram |
| `--suppressions <path>` | | Leak suppression file, one `leak:<pattern>` per line |
| `--print-suppressions` | `0` | Report matched suppressions and suppressed bytes |
| `--disable-embedded-suppressions` | | Ignore suppressions stored in the data file |
| `--disable-builtin-suppressions` | | Ignore heaptrack's default suppressions |

## Reading the summary

```text
total runtime: 5.23s.
calls to allocation functions: 1234567 (236049/s)
temporary allocations: 987654 (188847/s)
peak heap memory consumption: 123.45M
peak RSS (including heaptrack overhead): 256.78M
total memory leaked: 4.56M
```

| Line | Reading |
|---|---|
| `calls to allocation functions` | Many calls per unit of work means small-object churn |
| `temporary allocations` | A large share of calls means a buffer created and destroyed in a loop |
| `peak heap memory consumption` | The number to hold against the memory budget |
| `peak RSS` | Includes heaptrack's own memory, code, stacks, and file mappings; compare heap peaks, not RSS |
| `total memory leaked` | Bytes never freed; the leak ranking (`-l 1`) names the stacks |

## Ranking entry shape

```text
1000 calls to allocation functions with 413.70K peak consumption from
  malloc
    in /usr/lib/x86_64-linux-gnu/libc.so.6
  main (fn12_ht.c)
    at src/fn12_ht.c:3
    in ./fn12_ht
```

The first line is the count and cost; the stack follows leaf first.

## Patterns and their fixes

| Pattern in the ranking | Likely cause | Fix |
|---|---|---|
| Millions of small allocations from a string copy operator | Per-element string copies | Views (`std::string_view`), an arena, or a small-string type |
| Many allocations from a container's grow path | Repeated reallocation on append | Reserve the expected size before the loop |
| Leak ranking names a connect or open routine | Handle never released | Tie the handle to an owner (RAII wrapper, `unique_ptr` with a deleter) |
| Temporary ranking names a formatting routine in a hot loop | Fresh buffer per call | Format into a reused buffer |

## Massif and heaptrack commands side by side

| Task | Valgrind Massif | heaptrack |
|---|---|---|
| Record | `valgrind --tool=massif ./prog` | `heaptrack ./prog` |
| Print report | `ms_print massif.out.<pid>` | `heaptrack_print -f heaptrack.prog.<pid>.zst` |
| Peak sites | detailed snapshot in `ms_print` | `-p 1` (default ranking) |
| Leaks | `valgrind --leak-check=full` (Memcheck) | `heaptrack_print -l 1` |
| Flamegraph | no direct export | `heaptrack_print -F stacks.folded` then `flamegraph.pl` |
| Convert | | `heaptrack_print -M out.massif` feeds `ms_print` |
