# Fuzz targets and corpus reference

Harness templates, flag tables, and CI patterns. Flag defaults confirmed against the libFuzzer documentation shipped with LLVM and `afl-fuzz -h`. Grounded channels: Clang 23.1.0 (libFuzzer ships inside it), AFL++ v5.03c.

## libFuzzer flags

`./fuzz_target -help=1` prints every option for the binary at hand.

| Flag | Default | Effect |
|---|---|---|
| `-max_len` | 4096 (or a corpus-derived guess, reported at startup) | Maximum input length |
| `-len_control` | 100 | Length growth rate while under `max_len` |
| `-timeout` | 1200 | Seconds before one run is a timeout failure |
| `-rss_limit_mb` | 2048 | Memory ceiling; 0 disables |
| `-malloc_limit_mb` | equal to `rss_limit_mb` | Per-malloc ceiling; 0 follows the RSS limit |
| `-max_total_time` | 0 (infinite) | Wall-clock budget in seconds |
| `-runs` | -1 (infinite) | Execution count budget |
| `-jobs` | 0 | Number of jobs to completion |
| `-workers` | min(jobs, cores / 2) | Concurrent worker processes |
| `-dict` | none | Token dictionary |
| `-seed` | 0 (time-derived) | PRNG seed |
| `-merge` | 0 | Corpus merge mode |
| `-minimize_crash` | 0 | Shrink one crash input |
| `-use_value_profile` | 0 | Compare-instruction profiling |
| `-print_coverage` | 0 | Print covered functions at exit |
| `-error_exitcode` | 77 | Exit code on a found bug |
| `-artifact_prefix` | empty (current directory) | Prefix for crash, OOM, timeout artifacts |
| `-reduce_inputs` | 1 | Shrink inputs while keeping features |
| `-reload` | 1 | Re-read the corpus directory periodically |

Merge and minimize:

```bash
./fuzz_target -merge=1 corpus_min/ corpus_old/ run1/ run2/
./fuzz_target -minimize_crash=1 -max_total_time=60 crash-abc123
```

## AFL++ flags

`afl-fuzz -h` prints the full set.

| Flag | Effect |
|---|---|
| `-i dir` | Input corpus |
| `-o dir` | Findings output |
| `-t msec` | Per-execution timeout |
| `-m mb` | Memory limit (default 50) |
| `-x dict` | Dictionary |
| `-n` | Dumb mode, no instrumentation |
| `-d` / `-D` | Skip or force deterministic mutations |
| `-M name` | Main instance for multi-core runs |
| `-S name` | Secondary instance |
| `-c prog` | Cmplog binary |
| `-l N` | Cmplog level |
| `-p schedule` | Power schedule (`fast`, `explore`, `exploit`, `rare`) |

Status tooling: `afl-whatsup out/`, `cat out/main/fuzzer_stats`, `afl-showmap -i queue -o /dev/null -- ./prog @@`.

Multi-core:

```bash
afl-fuzz -i corpus/ -o findings/ -M main -- ./prog @@
afl-fuzz -i corpus/ -o findings/ -S aux1 -- ./prog @@
```

## Harness anatomy

```c
#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>

__attribute__((constructor))
static void init(void) {
    // one-time setup; runs before the first input
}

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    if (size < 4) return 0;          // reject, never exit

    char *buf = malloc(size + 1);    // null-terminated copy for C-string APIs
    if (!buf) return 0;
    memcpy(buf, data, size);
    buf[size] = '\0';

    my_parse_function(buf, size);

    free(buf);
    return 0;
}
```

The anti-patterns, each a real defect: `exit()` stops fuzzing instead of reporting a bug; static counters couple inputs; `data[size]` reads out of bounds; writes to `data` are undefined because libFuzzer may share the buffer. Use `FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION` to compile production asserts out of the fuzz build only when they fire on benign inputs.

Custom mutator for structured formats:

```c
extern "C" size_t LLVMFuzzerCustomMutator(
    uint8_t *data, size_t size, size_t max_size, unsigned int seed)
{
    size = LLVMFuzzerMutate(data, size, max_size);
    if (size >= 4)
        fix_checksum(data, size);    // repair the invariant the format requires
    return size;
}
```

## Corpus management

Seed from real traffic and test fixtures; generate minimal valid inputs by hand for corners (`{}`, one field, max values). Measure corpus coverage:

```bash
./fuzz_target corpus/ -runs=0 -print_coverage=1

# or with llvm-cov
LLVM_PROFILE_FILE="fuzz_%p.profraw" ./fuzz_target corpus/ -runs=0
llvm-profdata merge -o fuzz.profdata fuzz_*.profraw
llvm-cov report ./fuzz_target -instr-profile=fuzz.profdata
```

## Dictionary format

```c
# parser.dict
# string tokens, double-quoted
kw1="<"
kw2="<!--"
# hex-escaped binary tokens
null_byte="\x00"
utf8_bom="\xef\xbb\xbf"
magic1="\x89PNG"
magic2="%PDF"
```

libFuzzer: `-dict=parser.dict`. AFL++: `-x parser.dict`.

## Sanitizer combinations

| Build | Flags | Use |
|---|---|---|
| ASan + UBSan (default) | `-fsanitize=fuzzer,address,undefined` | Memory bugs and UB |
| ASan only | `-fsanitize=fuzzer,address` | Fastest bug-finding build |
| MSan | `-fsanitize=fuzzer,memory` | Uninitialized reads; Clang only; all objects instrumented |

Always pair with `-fno-omit-frame-pointer -g -O1`. Never combine TSan with ASan or MSan.

## CI patterns

Short regression per pull request:

```yaml
- name: Fuzz regression
  run: |
    ./fuzz_parser corpus/ -max_total_time=60 -error_exitcode=1 \
      -artifact_prefix=artifacts/
- name: Reproduce known crashes
  run: |
    for f in known_crashes/*; do ./fuzz_parser "$f" || exit 1; done
```

Nightly campaign:

```yaml
- name: Extended fuzzing
  run: |
    ./fuzz_parser corpus/ -max_total_time=3600 \
      -jobs=$(nproc) -workers=$(nproc) \
      -artifact_prefix=findings/ -error_exitcode=1
```

Cache the corpus between runs so each campaign resumes from accumulated coverage.

## OSS-Fuzz

Minimal layout: `project.yaml`, a `Dockerfile` from `gcr.io/oss-fuzz-base/base-builder`, and `build.sh` that places targets and seed corpora in `$OUT`. Local reproduction:

```bash
python infra/helper.py build_image yourproject
python infra/helper.py build_fuzzers yourproject
python infra/helper.py run_fuzzer yourproject fuzz_target
```
