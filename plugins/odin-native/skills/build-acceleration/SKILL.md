---
name: build-acceleration
description: 'Use when reducing C/C++ compilation times with ccache, sccache, distcc, unity builds, precompiled headers, split DWARF, IWYU, or link time reduction.'
---

# Build acceleration

Reduce C/C++ build times: measure first, then apply caching (ccache, sccache), distributed compilation (distcc), unity builds, precompiled headers, split DWARF, and include pruning.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A C/C++ build is too slow, or the task sets up ccache, sccache, distcc, precompiled headers, unity builds, split DWARF, or IWYU include pruning. |
| Authority | Reversible local: writes only build configuration (`CMakeLists.txt`, `ccache.conf`, environment variables) and local build outputs; rollback is version control plus deleting the build directory. No remote mutation. |
| Side effect | Local builds and cache daemons; distcc and sccache contact user-configured workers or storage. |
| Done | The chosen technique is configured and a before/after build time is measured, or the blocker is reported. |

## Inputs

- Build system (required): CMake, Make, Meson, or Bazel; gathered from the tree.
- Compiler (required): GCC or Clang; affects flag support.
- Bottleneck evidence (optional): existing timings or a profiler report.
- Cache or distribution infrastructure (optional): shared cache directory, distcc workers, sccache storage backend.

## Procedure

1. Measure before changing anything. A speedup claim without a baseline is not a claim. Done when: a baseline build time is recorded.

```bash
time cmake --build build -j"$(nproc)"

# Per-translation-unit cost, GCC and Clang
cmake -S . -B build -DCMAKE_CXX_FLAGS="-ftime-report"
cmake --build build 2>&1 | grep "Total" | sort -t: -k2 -rn | head -20

# Ninja keeps per-edge timings in build/.ninja_log; inspect with
# ninja -d stats or feed the log to ninjatracing for a Chrome trace
ninja -C build -d stats
```

2. Set up ccache for compiler caching. Done when: `ccache -s` shows hits on a rebuild.

```bash
apt-get install ccache   # Debian/Ubuntu
brew install ccache      # macOS
ccache -s                # hit rate
ccache --set-config=max_size=20G
ccache -C                # clear cache
```

```cmake
find_program(CCACHE_PROGRAM ccache)
if(CCACHE_PROGRAM)
    set(CMAKE_C_COMPILER_LAUNCHER   ${CCACHE_PROGRAM})
    set(CMAKE_CXX_COMPILER_LAUNCHER ${CCACHE_PROGRAM})
endif()
```

3. Use sccache when the cache must live on shared or cloud storage. sccache supports S3, Redis, Memcached, GCS, GitHub Actions cache, Azure, and WebDAV backends. Done when: `sccache --show-stats` reports hits.

```bash
cargo install sccache    # or: brew install sccache
export RUSTC_WRAPPER=sccache
export CMAKE_C_COMPILER_LAUNCHER=sccache
export CMAKE_CXX_COMPILER_LAUNCHER=sccache

# S3 backend
export SCCACHE_BUCKET=my-build-cache
export SCCACHE_REGION=us-east-1
sccache --start-server
sccache --show-stats
```

4. Add precompiled headers for large stable headers (STL, Boost, Qt). Skip PCH for headers that change often; each change rebuilds every consumer. Done when: `target_precompile_headers` is set on the heavy targets.

```cmake
# CMake 3.16+
target_precompile_headers(mylib PRIVATE
    <vector>
    <string>
    <unordered_map>
    "myproject/common.h"
)

# Share one PCH across targets
target_precompile_headers(myapp REUSE_FROM mylib)
```

5. Enable unity builds where ODR-safe. Unity builds batch several `.cpp` files into one translation unit, cutting repeated header parsing. Watch for anonymous namespaces, `using namespace` in headers, and duplicate internal-linkage symbols. Done when: the unity build compiles and links cleanly.

```cmake
set_target_properties(mylib PROPERTIES UNITY_BUILD ON)
set_target_properties(mylib PROPERTIES UNITY_BUILD_BATCH_SIZE 16)  # default 8
set_source_files_properties(problem.cpp PROPERTIES SKIP_UNITY_BUILD_INCLUSION ON)
```

6. Cut link time with split DWARF. `-gsplit-dwarf` moves debug info into `.dwo` sidecar files so the linker does not process it. The link-time win depends on how much debug info the build carries; measure it on the project rather than trusting a fixed multiplier. Done when: link time is measured with and without the flag.

```bash
gcc -g -gsplit-dwarf -Wl,--gdb-index -o prog main.c
# Optional: bundle .dwo files for distribution
dwp -o prog.dwp prog
```

```cmake
add_compile_options(-gsplit-dwarf)
```

7. Distribute compilation with distcc when spare machines exist. Done when: `distcc` jobs run on the configured hosts.

```bash
apt-get install distcc
distccd --daemon --allow 192.168.1.0/24 --jobs 8   # on each worker

export DISTCC_HOSTS="localhost/4 worker1/8 worker2/8"
make -j20 CC="distcc gcc"
```

Stack ccache in front so local hits never reach the network: `CC="ccache distcc gcc"`.

8. Prune includes with IWYU once the build is otherwise fast. Done when: the IWYU report is produced and fixes are applied or deferred. See `include-what-you-use` for the full workflow.

```bash
cmake -S . -B build -DCMAKE_CXX_INCLUDE_WHAT_YOU_USE=iwyu
cmake --build build 2>&1 | tee iwyu.log
fix_include < iwyu.log --nosafe_headers
```

For ccache configuration details see `references/ccache-config.md`.

## Failure and recovery

- ccache hit rate stays low: check `ccache -s -v` miss reasons; absolute paths need `base_dir`, `__DATE__`/`__TIME__` need `time_macros` in `sloppiness`.
- Unity build fails on duplicate symbols: exclude the file with `SKIP_UNITY_BUILD_INCLUSION` or fix the internal-linkage collision.
- PCH rebuilds constantly: the precompiled header changes too often; remove project headers from the PCH list.
- distcc saturates the network or is slower: reduce `DISTCC_HOSTS` slots or drop distcc; remote compile only pays when the network is faster than local compile.
- split-DWARF breaks debugger or packaging: ship `.dwo` files beside the binary or run `dwp` to bundle them.
- No measured improvement: revert the change; report the measured delta, not the expectation.

## Output

A configured acceleration technique (cache, PCH, unity, split DWARF, or distcc) plus the measured before/after build time. For diagnosis-only tasks, a ranked list of the slowest translation units or link steps with the recommended technique per bottleneck.
