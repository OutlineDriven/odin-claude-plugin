# Sanitizer flags reference

Build flags and runtime option variables. Grounded channels: GCC 16.x and Clang 23.1.0; sanitizers ship inside the compiler distribution and switch on through `-fsanitize=`.

## Quick table

| Sanitizer | Flag | GCC | Clang | Note |
|---|---|---|---|---|
| ASan | `-fsanitize=address` | yes | yes | |
| UBSan | `-fsanitize=undefined` | yes | yes | |
| TSan | `-fsanitize=thread` | yes | yes | Own build; never with ASan or MSan |
| MSan | `-fsanitize=memory` | no | yes | Every linked object must be instrumented |
| LSan | `-fsanitize=leak` | yes | yes | Standalone or included with ASan |
| CFI | `-fsanitize=cfi-*` | no | yes | Requires `-flto` |
| HWASan | `-fsanitize=hwaddress` | no | yes | arm64; newer x86-64 with LAM |
| MemTag | `-fsanitize=memtag-stack` | no | yes | AArch64 with `+memtag` march |

## Flags required alongside

```bash
-fno-omit-frame-pointer   # readable stacks
-g                        # source locations in reports
-O1                       # representative and still bug-finding
```

## Recovery control

```bash
-fno-sanitize-recover=all         # abort on first error; CI default
-fno-sanitize-recover=undefined   # abort on UBSan errors only
-fsanitize-recover=all            # log and continue
```

## UBSan check selection

`-fsanitize=undefined` covers the undefined behaviors. Named checks extend or narrow it:

```bash
-fsanitize=signed-integer-overflow   # in the undefined group
-fsanitize=unsigned-integer-overflow # NOT undefined; opt-in only
-fsanitize=float-divide-by-zero
-fsanitize=float-cast-overflow
-fsanitize=null
-fsanitize=alignment
-fsanitize=bounds                    # array indexing with known bounds
-fsanitize=vptr                      # C++ virtual call type
-fsanitize=pointer-overflow
-fsanitize=builtin
```

Clang groups several integer checks under `-fsanitize=integer`; GCC does not, so spell the checks out in portable builds.

## ASan-specific flags

```bash
-fsanitize-address-use-after-scope    # detect use-after-scope
-fsanitize-address-use-after-return   # detect use-after-return; slow
```

## Runtime option variables

Form: `ASAN_OPTIONS=key=value:key2=value2 ./prog`.

### ASAN_OPTIONS

| Key | Default | Effect |
|---|---|---|
| `detect_leaks` | 1 | LeakSanitizer on |
| `abort_on_error` | 0 | `abort()` instead of `_exit()`; enables core dumps |
| `exitcode` | 1 | Exit code on error |
| `log_path` | stderr | Write reports to a file |
| `symbolize` | 1 | Symbolize; needs `llvm-symbolizer` in PATH |
| `fast_unwind_on_malloc` | 1 | Set 0 for accurate allocation stacks |
| `quarantine_size_mb` | 256 | Freed-memory quarantine before reuse |
| `handle_segv` | 1 | ASan intercepts SIGSEGV |
| `print_stats` | 0 | Memory statistics at exit |
| `check_initialization_order` | 0 | Static init order bugs |

### UBSAN_OPTIONS

| Key | Effect |
|---|---|
| `print_stacktrace=1` | Add the stack to each report |
| `halt_on_error=1` | Stop on the first error |
| `suppressions=file` | Suppression file |
| `log_path=file` | Write reports to a file |

### TSAN_OPTIONS

| Key | Effect |
|---|---|
| `halt_on_error=1` | Stop on the first race |
| `suppressions=file` | Suppress reviewed races |
| `report_signal_unsafe=0` | Quiet signal-handler warnings |

### LSAN_OPTIONS

| Key | Effect |
|---|---|
| `suppressions=file` | Suppress reviewed leaks |
| `report_objects=1` | Print leaked object addresses |
| `max_leaks=N` | Cap reported leaks |
