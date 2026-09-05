# Linker and LTO flags reference

Sources: binutils ld documentation, LLVM ThinLTO documentation, GCC optimize options documentation, lld documentation.

## Linker selection

```bash
gcc -fuse-ld=gold main.c -o prog    # legacy C++ linker
gcc -fuse-ld=lld  main.c -o prog
clang -fuse-ld=lld main.c -o prog
gcc -fuse-ld=mold main.c -o prog    # mold must be installed
gcc -v main.c -o /dev/null 2>&1 | grep 'collect2\|ld\b'
```

## GNU ld and gold flags

Pass through the driver with `-Wl,flag` and commas for spaces.

Basics:

| Flag | Effect |
|------|--------|
| `-e symbol` | Entry point |
| `-L dir` | Library search directory |
| `-l name` | Link `libname.so` or `libname.a` |
| `-rpath dir` | Runtime search path, embedded in the ELF |
| `-rpath-link dir` | Search path for indirect dependencies, not embedded |
| `-soname name` | SONAME of a shared library |
| `-shared` | Build a shared library |
| `-static` | Force static linking |
| `-pie` | Position-independent executable |
| `-no-pie` | Force non-PIE |

Symbol control:

| Flag | Effect |
|------|--------|
| `--export-dynamic` | Export all symbols, needed for `dlopen` of the main program |
| `--dynamic-list=file` | Dynamic symbol list |
| `--version-script=file` | Symbol versioning and visibility |
| `--retain-symbols-file=file` | Keep only the listed symbols |
| `--strip-all` | Strip all symbols at link time |
| `--strip-debug` | Strip debug symbols at link time |

Dead-code removal, requires `-ffunction-sections -fdata-sections` at compile time:

```bash
-Wl,--gc-sections            # remove unused sections
-Wl,--print-gc-sections      # report removals
-Wl,--icf=safe               # identical code folding, gold and lld
-Wl,--icf=all                # aggressive folding, can break function pointers
```

Hardening:

```bash
-Wl,-z,relro                 # relocations read-only after startup
-Wl,-z,now                   # resolve PLT entries at startup, full RELRO
-Wl,-z,noexecstack           # mark stack non-executable
-Wl,-z,separate-code         # separate code from data pages
```

Diagnostics:

```bash
-Wl,--as-needed              # DT_NEEDED only for libraries actually used
-Wl,--no-as-needed
-Wl,--warn-common            # warn on tentative definitions
-Wl,--warn-unresolved-symbols
-Wl,-Map=prog.map            # map file
-Wl,--print-map
-Wl,--verbose
```

Circular archive dependencies:

```bash
-Wl,--start-group -lA -lB -Wl,--end-group
```

## lld extras

lld accepts most GNU flags plus:

```bash
-Wl,--thinlto-cache-dir=/tmp/thinlto-cache
-Wl,--thinlto-cache-policy=cache_size_bytes=1g
-Wl,--thinlto-jobs=8
-Wl,--icf=safe
-Wl,--call-graph-profile-sort=cdsort    # order code by profile
-Wl,--reproduce=repro.tar               # bundle inputs to replay a link failure
```

## GCC LTO flags

```bash
gcc -O2 -flto -ffunction-sections -fdata-sections -c foo.c -o foo.o
gcc -O2 -flto -Wl,--gc-sections foo.o bar.o -o prog
gcc -O2 -flto=auto ...   # parallel through the make jobserver
gcc -O2 -flto=4 ...      # exactly four jobs
gcc-ar rcs libfoo.a foo.o bar.o
gcc-ranlib libfoo.a
gcc -O2 -flto -fdump-ipa-all foo.c -o prog   # dump IPA decisions
```

An LTO object carries machine code plus GIMPLE IR. Plain `ar` stores it, but only `gcc-ar` builds the index the LTO linker needs.

## Clang LTO flags

```bash
clang -O2 -flto -fuse-ld=lld foo.c bar.c -o prog          # full LTO
clang -O2 -flto=thin -c foo.c -o foo.o                    # ThinLTO
clang -O2 -flto=thin -fuse-ld=lld foo.o bar.o -o prog
```

ThinLTO caches per-module results, so unchanged modules skip re-optimization on the next link.

## MSVC LTCG

```cmd
cl /GL /O2 /c foo.cpp /Fo:foo.obj
link /LTCG foo.obj bar.obj /OUT:prog.exe
```

`/GL` at compile with `/LTCG` at link is the MSVC form of `-flto`.

## Linker script basics

Hand-written scripts appear mostly in embedded and kernel work:

```ld
MEMORY {
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
    RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

SECTIONS {
    .text : {
        KEEP(*(.isr_vector))   /* the vector table must stay first */
        *(.text*)
        *(.rodata*)
    } > FLASH

    .data : {
        _sdata = .;
        *(.data*)
        _edata = .;
    } > RAM AT > FLASH        /* load address in flash, run address in RAM */

    .bss : {
        _sbss = .;
        *(.bss*)
        *(COMMON)
        _ebss = .;
    } > RAM

    _estack = ORIGIN(RAM) + LENGTH(RAM);
}
```

Concepts: `MEMORY` names address regions, `SECTIONS` maps input sections into them, `AT >` separates load from run address for startup copy, and `KEEP(...)` protects a section from `--gc-sections`.

## Common linker errors

| Error | Cause | Fix |
|-------|-------|-----|
| `undefined reference to 'foo'` | Missing library or wrong order | Add `-lfoo` after the objects |
| `cannot find -lfoo` | Library outside the search path | Add `-L`, install the dev package |
| `multiple definition of 'x'` | Two definitions | Keep one, declare the other `extern` |
| `relocation truncated to fit` | Address beyond relocation reach | `-mcmodel=large`, or restructure |
| `version GLIBC_2.xx not found` | Newer build glibc than runtime | Older build host or static link |
| `circular reference` | Archives depend on each other | `--start-group` and `--end-group` |
| LTO mismatch | Mixed LTO and non-LTO objects | Recompile all with `-flto` |
| `file format not recognized` | Wrong architecture object | Use the matching cross toolchain |
