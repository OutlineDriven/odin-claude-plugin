---
name: linkers-lto
description: 'Use when choosing a linker, fixing link order or undefined symbol errors, enabling LTO or ThinLTO, or cutting dead code with --gc-sections. Not for inspecting the linked binary: use elf-inspection.'
---

# Linkers and LTO

The linker turns object files into one binary and decides what survives from each translation unit. Most link failures are order problems; most size wins are LTO plus dead-code removal.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task fixes `undefined reference` or `multiple definition` errors, selects a linker, enables LTO or ThinLTO, removes dead code, controls symbol visibility, or reads a linker map. |
| Authority | Reversible local: writes only build flags, linker scripts, and build outputs; rollback is version control and a rebuild. No remote mutation. |
| Side effect | Local writes to the outputs the build produces and to build configuration the user names. |
| Done | The link succeeds with the intended flags, or the size and visibility changes are proven by the map, `--print-gc-sections`, or `nm -D` output. |

## Inputs

- The failing link command or build configuration: required.
- Toolchain in use: required. GCC and Clang differ in LTO setup and archive tools.
- Whether LTO must be incremental: required before choosing ThinLTO over full LTO.

## Procedure

1. Select the linker through the compiler driver. `ld` is the universal default, `gold` is the retired-in-name C++ linker kept for legacy builds, `lld` is the fast choice and the practical requirement for Clang LTO on large projects. Verify which linker actually ran from the driver's verbose output. Done when: the build uses the intended linker.

```bash
gcc  -fuse-ld=lld -o prog main.c
clang -fuse-ld=lld -o prog main.c
gcc -v main.c -o prog 2>&1 | grep 'collect2\|ld\.new\|lld'
```

2. Pass flags correctly. The driver forwards linker flags after `-Wl,` with commas instead of spaces. Done when: `readelf -d` or the map shows the flag took effect.

```bash
gcc main.o -o prog \
  -Wl,-rpath,/opt/mylibs/lib \
  -Wl,--as-needed \
  -Wl,--gc-sections \
  -Wl,-z,relro -Wl,-z,now \
  -L/opt/mylibs/lib -lfoo
```

3. Fix link order. GNU ld resolves archives left to right; a library must follow the objects that use it. Circular archive dependencies need a group. Done when: the link succeeds without suppression flags.

```bash
gcc main.o -lfoo -ldep -o prog                    # dependents first
gcc main.o -Wl,--start-group -lfoo -lbar -Wl,--end-group -o prog
```

4. Enable LTO with GCC. Every compile and the final link carry `-flto` with the same optimization level. LTO archives must be built with `gcc-ar` and `gcc-ranlib`, because plain `ar` cannot build the LTO symbol index. Done when: the link succeeds and size or performance improves against the non-LTO build.

```bash
gcc -O2 -flto -ffunction-sections -fdata-sections -c foo.c -o foo.o
gcc -O2 -flto -Wl,--gc-sections foo.o bar.o -o prog
gcc-ar rcs libfoo.a foo.o
gcc-ranlib libfoo.a
gcc -O2 -flto=auto foo.o bar.o -o prog   # parallel, uses the make jobserver
```

5. Enable ThinLTO with Clang. ThinLTO parallelizes across machines and caches results, so incremental links stay fast. Done when: the link succeeds and the ThinLTO cache directory fills.

```bash
clang -O2 -flto=thin -fuse-ld=lld foo.c bar.c -o prog
```

In CMake, `set(CMAKE_INTERPROCEDURAL_OPTIMIZATION ON)` selects the right LTO mode per compiler.

6. Remove dead code. `--gc-sections` discards unreferenced sections, which only exist if compilation used `-ffunction-sections -fdata-sections`. Done when: `--print-gc-sections` reports the removals and the binary still runs.

```bash
gcc -O2 -ffunction-sections -fdata-sections -c foo.c -o foo.o
gcc -Wl,--gc-sections -Wl,--print-gc-sections foo.o -o prog
```

7. Control visibility for LTO quality and DSO size. Hide everything, export the API. Done when: `nm -D --defined-only libfoo.so` lists only the public API.

```bash
gcc -fvisibility=hidden -O2 -shared -fPIC foo.c -o libfoo.so
```

```text
# foo.ver
{
  global: my_public_function; my_other_public;
  local: *;
};
```

```bash
gcc -Wl,--version-script=foo.ver -shared -fPIC -o libfoo.so foo.o
```

8. Read the map file when size or placement puzzles. Every symbol's origin and address is in the map. Done when: the surprising symbol is traced to its object and input section.

```bash
gcc -Wl,-Map=prog.map -o prog foo.o bar.o
```

9. Diagnose by error class. Done when: each error maps to its row and the fix is applied.

| Error | Cause | Fix |
|-------|-------|-----|
| `undefined reference to 'foo'` | Missing or misordered library | Add `-lfoo` after the objects that need it |
| `multiple definition of 'foo'` | Symbol defined in two objects | Keep one definition, or declare the other `extern` |
| `cannot find -lfoo` | Library outside `-L` paths | Add `-L` or install the development package |
| `relocation truncated to fit` | Address outside the relocation's reach | Use `-mcmodel=large`, or restructure the image layout |
| `version 'GLIBC_2.xx' not found` | Built on a newer glibc | Build on the older host or link statically |
| LTO bytecode mismatch | Mixed LTO and non-LTO objects | Recompile every object with the same `-flto` |
| `file format not recognized` | Foreign architecture object | Use the matching cross toolchain for all objects |

## Failure and recovery

| Failure class | Behavior |
|---|---|
| LTO build fails on one object | That object was compiled without `-flto`. Recompile it with the same flags as the rest. |
| `--gc-sections` removed a needed section | Something referenced it only from assembly or a linker script. Add `KEEP(*(...))` in the script, or the reference. |
| ThinLTO cache grows without bound | Point `-Wl,--thinlto-cache-dir` at a managed path and clear it on a schedule. |
| A group link got slow | `--start-group` rescans archives until fixed point. Resolve the cycle explicitly instead of leaving the group in place. |
| LTO changed behavior | Inlining across units can expose latent UB. Reproduce without LTO, then fix the source. |

## Output

The linked binary plus the evidence for each decision: linker chosen, map excerpts, `--print-gc-sections` output, or `nm -D` export lists. The full flag tables, lld extras, MSVC `/GL /LTCG`, and a linker script skeleton are in `references/flags.md`.
