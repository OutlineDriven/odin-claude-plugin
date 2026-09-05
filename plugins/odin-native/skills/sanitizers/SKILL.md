---
name: sanitizers
description: 'Use when enabling or interpreting ASan, UBSan, TSan, MSan, LSan, or HWASan with GCC or Clang, or reading sanitizer reports. Not for fuzz target setup: use fuzzing.'
---

# Sanitizers

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Runtime bug detection with compiler sanitizers: choosing the tool for a bug class, enabling flags, reading a report, suppressing known noise, or wiring sanitizers into CMake and CI. |
| Authority | Reversible local. Writes are limited to instrumented builds, logs, and suppression files in the project tree; rollback is deleting the build directory. No remote mutation. |
| Side effect | Instrumented binaries, sanitizer reports, suppression files, and a diagnosis per finding. |
| Done | Each detected defect has a class, a report excerpt, and a fix location, or the sanitizer choice is justified as exhausted for the bug class. |

## Inputs

1. Symptom (required): crash, wrong values, leak, hang, or race.
2. Build system (required): compiler invocations or CMake.
3. Toolchain (required): `gcc --version` or `clang --version`. Grounded channels: GCC 16.x and Clang 23.1.0; sanitizers ship with the compiler.
4. Test suite (optional): the fastest suite that exercises the suspect path.

## Procedure

1. Match the bug class to the sanitizer:

| Bug class | Sanitizer |
|---|---|
| Heap, stack, or global out-of-bounds; use-after-free; double-free | ASan |
| Undefined behavior: signed overflow, null deref, bad casts, bad shifts | UBSan |
| Data races between threads | TSan |
| Reads of uninitialized memory | MSan (Clang only) |
| Memory leaks only | LSan, standalone or inside ASan |
| Cheap heap checking on arm64 | HWASan |

ASan and UBSan combine in one build. TSan and MSan each require their own build; neither combines with ASan. Done when: one sanitizer per build is chosen and the reason is recorded.
2. Build with ASan plus UBSan as the default pass:

```bash
gcc -fsanitize=address,undefined -fno-sanitize-recover=all \
    -fno-omit-frame-pointer -g -O1 -o prog main.c
```

`-fno-omit-frame-pointer` and `-g` make reports readable; `-O1` keeps the build representative without hiding bugs; `-fno-sanitize-recover=all` makes the first error fatal, which CI needs. Done when: the instrumented build runs the test suite to completion or stops on a report.
3. Read the ASan report as three stacks: the access, the free, the allocation.

```text
==12345==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x602000000050
READ of size 4 at 0x602000000050 thread T0
    #0 0x401234 in foo main.c:15

0x602000000050 is located 0 bytes after a 40-byte region
[0x602000000028, 0x602000000050) allocated at:
    #0 0x7f12345 in malloc
    #1 0x401234 in main main.c:10
```

`0 bytes after` a 40-byte region is an off-by-one loop bound; `use-after-free` shows the free stack between allocation and access. Done when: the report's three frames are mapped to source lines.
4. Tune UBSan to the checks the code needs. `-fsanitize=undefined` covers the true undefined behaviors; note that `unsigned-integer-overflow` is not undefined and stays outside that group:

```bash
clang -fsanitize=undefined \
    -fsanitize=signed-integer-overflow,float-cast-overflow \
    -fno-sanitize-recover=all -g -O1 -o prog main.c
```

Each UBSan report is one line: `src/main.c:15:12: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'`. Add `UBSAN_OPTIONS=print_stacktrace=1` for frames. Done when: every reported UB has a source line and a fix or a suppression with an owner.
5. Run TSan for races on its own build:

```bash
clang -fsanitize=thread -g -O1 -o prog_tsan main.c
```

The report names both accesses and the variable: a write in one thread, a previous read in another, no synchronization. Fix with a mutex, an atomic, or a redesign; lock-order-inversion reports need a global lock order. Done when: each race report names the missing synchronization.
6. Use MSan only when the whole program, including its libraries, can be instrumented by Clang. Any uninstrumented object poisons results:

```bash
clang -fsanitize=memory -fsanitize-memory-track-origins=2 \
    -fno-omit-frame-pointer -g -O1 -o prog_msan main.c
```

Origin tracking costs more time and reports where the uninitialized value came from. Done when: the MSan build covers every linked object or the constraint rules MSan out.
7. Control runtime behavior through the option variables:

```bash
ASAN_OPTIONS=detect_leaks=1:abort_on_error=1:log_path=/tmp/asan.log ./prog
UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1 ./prog
LSAN_OPTIONS=suppressions=asan.supp ./prog
```

Useful ASan keys: `detect_leaks` (default 1 on Linux), `abort_on_error` (core dumps), `exitcode`, `log_path`, `symbolize`, `fast_unwind_on_malloc=0` for accurate but slower stacks, `quarantine_size_mb=256` default freed-memory quarantine. Done when: the run's options match what CI should see.
8. Suppress verified noise with a file, never by deleting the check:

```bash
cat > asan.supp << 'EOF'
leak:CRYPTO_malloc
EOF
LSAN_OPTIONS=suppressions=asan.supp ./prog
```

Each suppression names the frame or check and carries a comment saying who verified it and when. Done when: every suppression is traceable to a reviewed finding.
9. Wire CMake and CI:

```cmake
option(SANITIZE "Enable sanitizers" OFF)
if(SANITIZE)
    set(san_flags -fsanitize=address,undefined -fno-sanitize-recover=all
                  -fno-omit-frame-pointer -g -O1)
    add_compile_options(${san_flags})
    add_link_options(${san_flags})
endif()
```

```yaml
- name: Tests under sanitizers
  run: |
    cmake -S . -B build -DSANITIZE=ON && cmake --build build
    ASAN_OPTIONS=abort_on_error=1:detect_leaks=1 \
    UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1 \
    ctest --test-dir build --output-on-failure
```

Done when: one flag flip produces a sanitized CI lane.
10. Reach for the specialized variants when the mainstream ones do not fit. HWASan, a cheaper ASan variant, targets arm64 (and newer x86-64 with LAM in current toolchains): `clang -fsanitize=hwaddress -g -O1`. MemTagSanitizer uses ARM MTE hardware and needs AArch64 with the `+memtag` march flag: `-fsanitize=memtag-stack -march=armv8a+memtag`. GWP-ASan, the sampled guard-page allocator in compiler-rt, is enabled through allocator options in hosts that integrate it (Android system components), not through `-fsanitize`. Kernel code uses KASAN, configured with `CONFIG_KASAN=y` in the test kernel, with reports in dmesg. Overheads are approximate and workload dependent: ASan around 2x, HWASan less, MSan more. Done when: the chosen variant's hardware and toolchain requirements are verified on the target.

Report patterns and the full flag tables live in references/reports.md and references/flags.md.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Sanitizer slows the suite beyond usefulness | Run the sanitized lane on the smallest relevant suite; keep the full suite uninstrumented. |
| No error but the crash persists | The defect is in uninstrumented code, or the error surfaces late. Widen instrumentation; sync before reading results. |
| MSan reports nonsense | An uninstrumented library poisoned the run. Rebuild that library with MSan or drop MSan. |
| TSan reports a race in third-party code | Suppress with an owner named, or fix the upstream call pattern. |
| Report points at allocator internals | Real bug nearby; add `fast_unwind_on_malloc=0` and re-read the stack. |
| `-fsanitize=memtag*` rejected | Non-ARM target or missing `+memtag` march. Use ASan or HWASan instead. |

## Output

A diagnosis per finding: the sanitizer, the report excerpt, the mapped source lines, and the fix. Plus the build and CI wiring, and the suppression file with named owners. Every claim names the compiler line it assumes.
