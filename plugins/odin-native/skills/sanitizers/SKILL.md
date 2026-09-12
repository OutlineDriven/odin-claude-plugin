---
name: sanitizers
description: 'Use when building, running, or interpreting ASan, UBSan, TSan, MSan, LSan, HWASan, or Miri for native or Rust code, including memory-corruption debugging, unsafe-code validation, and sanitizer CI wiring. Not for fuzz target setup: use fuzzing.'
---

# Sanitizers and Miri

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Runtime bug detection for native or Rust code with compiler sanitizers or Miri: choosing the tool for a bug class, enabling flags, reading a report, validating unsafe code, suppressing known noise, or wiring sanitizer checks into CMake, Cargo, and CI. |
| Authority | Reversible local. Writes are limited to instrumented builds, logs, suppression files, and (when explicitly requested) Cargo.toml or CI configuration in the project tree. A user-approved `rustup` component installation is an explicit exception that changes shared global toolchain state; record its pre-existing state and leave rollback to the user. No remote mutation. |
| Side effect | Instrumented native or Rust binaries, Miri runs, sanitizer reports, suppression files, and a diagnosis per finding; a user-approved `rustup` component install may download components and alter shared global toolchain state, and requested Cargo or CI wiring may alter local configuration. |
| Done | Each detected defect or undefined-behaviour finding has a class, report excerpt, mapped source location, and fix location, or the tool choice is justified as exhausted or unsupported for the target. A supplied report may be interpreted without a fresh run. |

## Inputs

1. Mode (required): `build/run` for a target exercise, or `interpret report` for supplied sanitizer or Miri output.
2. Target (required for `build/run`): a native source or build target (C/C++), or a Rust crate, workspace, test, or binary; include the command that exercises it and identify unsafe blocks or FFI when relevant. A specific report or captured output is required for `interpret report`.
3. Symptom (required when choosing a tool): crash, wrong values, memory corruption, leak, hang, race, uninitialized read, or suspected undefined behaviour.
4. Build system and toolchain (required for `build/run`): native compiler invocations or CMake, or Cargo and rustup; provide `gcc --version`/`clang --version` and the Rust target triple when applicable.
5. Test suite (optional): the fastest suite that exercises the suspect path.
6. Runtime, fuzzer, and CI context (optional): option variables, an existing libFuzzer/AFL++/cargo-fuzz/honggfuzz harness, and the CI runner or platform.

## Procedure

1. Select the mode and establish applicability. In `interpret report` mode, retain the supplied output as the evidence and do not claim a fresh run. In `build/run` mode, confirm the target is C/C++, Rust with unsafe code or FFI, or pure Rust for Miri; state native sanitizer platform limits before proceeding (Linux has full support, while macOS and Windows support can be limited or experimental). Done when: the mode, language, platform, target triple, and applicable constraints are recorded.
2. Confirm the toolchain. For native code, record the GCC or Clang version; sanitizers ship with the compiler. For Rust sanitizers and Miri, run `rustup toolchain list`, `rustc +nightly --version`, and `rustup component list --toolchain nightly` to capture the pre-existing component state. If `nightly` is absent, report that prerequisite and stop before any component command; this workflow does not install a missing toolchain. With nightly present, `rust-src` is required and Miri also needs its component. If the user accepts installation, add only missing components with `rustup component add rust-src --toolchain nightly` and `rustup component add miri --toolchain nightly`; otherwise report the missing prerequisite without changing global toolchain state. Done when: the baseline component state, acceptance status, selected compiler or nightly toolchain, and target support are known.
3. Match the bug class to the tool:

| Bug class | Tool |
|---|---|
| Heap, stack, or global out-of-bounds; use-after-free; double-free | ASan |
| Undefined behaviour: signed overflow, null dereference, bad casts, or bad shifts | UBSan |
| Data races between threads | TSan |
| Reads of uninitialized memory | MSan (Clang only) |
| Memory leaks only | LSan, standalone or inside ASan |
| Cheap heap checking on arm64 | HWASan |
| Interpretation-time UB in Rust, including provenance, invalid transmute, borrow, initialization, or lifetime errors | Miri |

ASan and UBSan combine in one build. TSan and MSan each require their own build; neither combines with ASan. Rust sanitizer support varies by target triple, so keep each Rust sanitizer in its own command and record the compatibility reason. Done when: one tool or compatible build combination is selected and the reason is recorded.
4. Build the selected sanitizer target. For native code, use ASan plus UBSan as the default pass and put the flags in both compile and link steps:

```bash
gcc -fsanitize=address,undefined -fno-sanitize-recover=all \
    -fno-omit-frame-pointer -g -O1 -o prog main.c
```

Use `clang` as the compiler where required. `-fno-omit-frame-pointer` and `-g` make reports readable; `-O1` keeps the build representative without hiding bugs; `-fno-sanitize-recover=all` makes the first error fatal. If sanitized slowdown versus the uninstrumented run exceeds roughly 4x, use `-O2` or `-O3` and record the trade-off. For Rust, set `RUSTFLAGS="-Z sanitizer=<tool>"` and run `cargo +nightly test -Zbuild-std --target <triple>`; for MSan add `-Z sanitizer-memory-track-origins`. Done when: the native target compiles and links with the selected flags, or the Rust target builds with nightly and the required standard library.
5. If an existing fuzzer drives the target, adapt only its sanitizer run. For libFuzzer use `-fsanitize=fuzzer,address` and `-rss_limit_mb=0`; for AFL++ set `AFL_USE_ASAN=1` and `-m none`; for cargo-fuzz pass `--sanitizer=address`; for honggfuzz compile with `hfuzz-clang -fsanitize=address`. These memory-limit changes are required because ASan reserves approximately 20 TB of virtual address space; fuzzer planning and harness setup belong to `fuzzing`. Done when: the fuzzer's sanitizer command and memory limit are explicit.
6. For Rust Miri mode, after step 2 confirms the component is present (or after the user's accepted install), run `cargo +nightly miri test` or `cargo +nightly miri run`. Use `MIRIFLAGS="-Zmiri-strict-provenance"` for strict provenance, `MIRIFLAGS="-Zmiri-disable-isolation"` for host I/O, clocks, or randomness, and `-Zmiri-seed=42 -Zmiri-num-cpus=4` for reproducible randomized concurrency scheduling. Use `-Zmiri-ignore-leaks` only for intentional global leaks and `-Zmiri-backtrace=full` when the default trace is insufficient. Miri cannot execute unsupported `extern "C"` calls, `asm!`, platform syscalls, or long-running programs; provide `#[cfg(miri)]` stubs or report the unsupported operation. Done when: Miri completes, reports UB, or names the unsupported operation and its bounded workaround.
7. In `build/run` mode, run the instrumented native or Rust sanitizer target and capture its output. In `interpret report` mode, skip execution and preserve the supplied output as evidence. Use runtime options that match the requested evidence:

```bash
ASAN_OPTIONS=verbosity=1:detect_leaks=1:abort_on_error=1:log_path=/tmp/asan.log ./prog
UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1 ./prog
LSAN_OPTIONS=suppressions=asan.supp ./prog
```

`verbosity=1` confirms ASan startup; `detect_leaks=0` is appropriate only while fuzzing so leak output does not obscure crashes. Done when: build/run mode has a captured completion or report, or interpret report mode has preserved supplied evidence without a fresh-run claim.
8. Interpret the report or Miri result. For ASan, read the access, free, and allocation stacks; `0 bytes after` a region is the classic off-by-one, and a use-after-free places the free stack between allocation and access. For UBSan, map each `file:line:column: runtime error:` to a source line and use `UBSAN_OPTIONS=print_stacktrace=1` when macros hide the caller. For TSan, name both unsynchronized accesses and the missing mutex, atomic, message passing, or global lock order. For MSan, map the origin of every uninitialized value and reject results from uninstrumented linked objects. For LSan, classify the leak and trace its owner. For Miri, map the failing operation to a Rust source line and check for stale pointers after reallocation, invalid enum or boolean transmute, misaligned loads, an active stacked-borrow reborrow, reads or partial initialization through `MaybeUninit`, or a reference that outlives its local. In report mode, extract the error type, faulting stack, allocation/deallocation traces, or Miri failure without requiring a new run. Done when: every finding has a failure class and source location.
9. Suppress only verified noise. Put reviewed ASan/LSan/UBSan/TSan suppressions in a file, for example:

```bash
cat > asan.supp << 'EOF'
leak:CRYPTO_malloc
EOF
LSAN_OPTIONS=suppressions=asan.supp ./prog
```

Each suppression names the frame or check and carries the verifying owner and date; never delete a check to hide a report. Done when: every suppression is traceable to a reviewed finding.
10. Wire the requested native and Rust checks into CI. For CMake, expose one switch and apply flags to compilation and linking:

```cmake
option(SANITIZE "Enable sanitizers" OFF)
if(SANITIZE)
    set(san_flags -fsanitize=address,undefined -fno-sanitize-recover=all
                  -fno-omit-frame-pointer -g -O1)
    add_compile_options(${san_flags})
    add_link_options(${san_flags})
endif()
```

For Cargo locally, use the nightly toolchain and the pre-install component baseline confirmed in step 2; run its accepted missing-component commands before the selected `RUSTFLAGS`/`cargo +nightly test -Zbuild-std --target <triple>` command and, for Miri, `cargo +nightly miri test`. For CI wiring, pin the requested nightly toolchain and install only the requested `rust-src` and Miri components in the CI job, without changing this workflow's local shared state. Done when: each requested native or Rust command is reproducible as a CI lane.
11. Reach for specialized variants when the mainstream tools do not fit. HWASan targets arm64 (and newer x86-64 with LAM in current toolchains): `clang -fsanitize=hwaddress -g -O1`. MemTagSanitizer needs AArch64 with `-fsanitize=memtag-stack -march=armv8a+memtag`. GWP-ASan is enabled through allocator options in hosts that integrate it, such as Android system components, not through `-fsanitize`. Kernel code uses KASAN with `CONFIG_KASAN=y` and reports in dmesg. Overheads are workload-dependent: ASan is around 2x, HWASan less, and MSan more. Done when: the chosen variant's hardware and toolchain requirements are verified on the target.
12. In `build/run` mode, verify the repair with the same target and command. A run that reports one error stops at that error; do not claim the target is clean. Rerun after the fix and record a clean result or every remaining finding. In `interpret report` mode, report the supplied evidence without a rerun. Done when: the output and fix status support the final diagnosis.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Sanitizer slows the suite beyond usefulness | Run the sanitized lane on the smallest relevant suite; keep the full suite uninstrumented. |
| No error but the crash persists | The defect is in uninstrumented code, or the error surfaces late. Widen instrumentation and sync before reading results. |
| MSan reports nonsense | An uninstrumented library poisoned the run. Rebuild that library with MSan or drop MSan. |
| TSan reports a race in third-party code | Suppress it with a named owner, or fix the upstream call pattern. |
| Report points at allocator internals | Add `fast_unwind_on_malloc=0` and re-read the nearby source stack. |
| `-fsanitize=memtag*` is rejected | The target is not ARM or lacks `+memtag`; use ASan or HWASan instead. |
| ASan runtime is not initialized | `-fsanitize=address` was missing from the link step; relink with it and rerun. |
| Fuzzer kills the process immediately | Its memory limit is below ASan's virtual mapping; set `-rss_limit_mb=0` or `-m none` and rerun. |
| LeakSanitizer obscures a fuzzing crash | Set `ASAN_OPTIONS=detect_leaks=0` during fuzzing and review leaks separately. |
| ASan prints no startup info | The binary was not instrumented; rebuild and confirm `verbosity=1` prints initialization. |
| Rust toolchain or component is missing | Report an absent nightly toolchain before any component command; this workflow does not install a missing toolchain. When nightly is present and the user accepts component installation, record the baseline and add only missing `rust-src` or `miri` components using the commands in step 2; otherwise leave shared toolchain state unchanged. |
| Rust sanitizer fails to build | Check the target triple, `-Zbuild-std`, and sanitizer compatibility for that target. |
| Miri reports an unsupported operation | Guard the operation with `cfg` and provide a Miri stub, or report that the target cannot run under Miri. |
| CI cannot fetch nightly | Pin a known-good nightly date and add it to the CI cache. |
| Instrumented run reports an error | Report that partial result and its location; further runs may surface additional errors. |
| Rollback is requested | Delete instrumented artifacts and revert explicitly requested local Cargo or CI edits; no source change is required for instrumentation-only builds. |

## Output

A diagnosis per finding: the sanitizer or Miri mode, the report excerpt, the mapped source lines, the allocation/deallocation or Miri evidence, and the fix. Include the build and CI wiring, the fuzzer command when one was supplied, and the suppression file with named owners. In report-only mode, state that the supplied output was interpreted without a fresh run. Every claim names the compiler, Rust toolchain, and target it assumes.
