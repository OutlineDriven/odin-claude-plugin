# Toolchain commands

Branch-specific build, run, report, and differential commands for the SKILL.md procedure. The shared spine (pick one toolchain, build at -O2, run over corpus, merge and report excluding harness noise) stays in SKILL.md; this file carries the per-toolchain flags and commands.

## LLVM / Clang (C/C++)

Build instrumentation:
```
-fprofile-instr-generate -fcoverage-mapping
```

Run:
```
LLVM_PROFILE_FILE=<target>/fuzz.profraw ./fuzz_exec <corpus>/
```

Merge and report:
```
llvm-profdata merge -sparse <target>/fuzz.profraw -o <target>/fuzz.profdata
llvm-cov report ./fuzz_exec -instr-profile=<target>/fuzz.profdata -ignore-filename-regex='harness|execute-rt'
llvm-cov show ... -format=html -output-dir <target>/html/
```

Differential (when a baseline profile was supplied):
```
llvm-cov show ... -instr-profile=<baseline>.profdata -instr-profile=<target>/fuzz.profdata
```

## GCC (C/C++)

Build instrumentation:
```
-ftest-coverage -fprofile-arcs
```

Run:
```
./fuzz_exec_gcov <corpus>/
```
`.gcda` files accumulate across runs; use `gcovr --delete` to start fresh.

Differential (when a baseline profile was supplied):
```
gcovr --gcov-executable "llvm-cov gcov" --exclude harness --exclude execute-rt --root . --html-details -o <target>/coverage_diff.html <baseline-gcda-dir> <target-gcda-dir>
```
Compare line coverage between the two `gcovr` HTML reports to identify regions gained or lost.

Merge and report:
```
gcovr --gcov-executable "llvm-cov gcov" --exclude harness --exclude execute-rt --root . --html-details -o <target>/coverage.html
```

## Rust

Build instrumentation:
```
rustup toolchain install nightly --component llvm-tools-preview
cargo +nightly fuzz coverage <target>
```

Coverage data is produced by `cargo fuzz coverage`.

Report:
```
cargo +nightly cov -- show -Xdemangler=rustfilt <target-binary> \
  -instr-profile=<profdata> \
  -show-line-counts-or-regions -show-instantiations \
  -format=html -o <target>/html/ <src-filter>
```

Differential (when a baseline profile was supplied):
```
cargo +nightly cov -- show -Xdemangler=rustfilt <target-binary> \
  -instr-profile=<baseline>.profdata \
  -instr-profile=<target>.profdata \
  -show-line-counts-or-regions -show-instantiations \
  -format=html -o <target>/diff_html/ <src-filter>
```
