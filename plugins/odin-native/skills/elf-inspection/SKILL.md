---
name: elf-inspection
description: 'Use when examining ELF binaries with readelf, objdump, nm, or ldd: dependencies, symbols, sections, relocations, build IDs, or hardening, or when enabling RELRO, PIE, stack canaries, FORTIFY_SOURCE, CET, CFI, or seccomp filters, or checking a binary with checksec. Not for modifying binaries: use binutils. Not for runtime sanitizer builds: use sanitizers.'
---

# ELF inspection

An ELF binary reports its own structure. Every question about dependencies, symbols, sections, or hardening is one `readelf`, `objdump`, `nm`, or `ldd` query away, and every hardening gap has a concrete, toolchain-gated flag set. This skill is read-only: it inspects binaries and emits flag sets and verification commands; transformation of binaries belongs to `binutils`, and runtime sanitizer builds belong to `sanitizers`.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task inspects what a binary depends on, why it is large, which symbols it exports or needs, whether it is PIE or RELRO-hardened, or why a symbol is undefined at link time or load time, or it hardens a binary or its build: checksec analysis, RELRO, PIE, stack canaries, FORTIFY_SOURCE, CET and shadow stack, Clang CFI, AArch64 BTI and PAC, MTE, or seccomp syscall filtering. |
| Authority | Read-only. Inspection commands read the named binaries and print to stdout; in `binary-hardening` mode the flag sets, build commands, and seccomp filters are emitted as recommendations for the operator to run, and the skill itself writes no files, so no rollback applies. No remote mutation. |
| Side effect | None on disk. Inspection answers, and in `binary-hardening` mode a protection report with the flag set and verification commands, go to the chat or the terminal. |
| Done | The question about the binary is answered with the matching tool output quoted and every quoted fact comes from the binary itself; in `binary-hardening` mode, every missing mitigation has a concrete flag confirmed supported by the project's compiler and libc, and every runtime claim is quoted from the toolchain, kernel, and CPU that must honor it. |

## Inputs

- The target: required. The binary or library to inspect, or the build to harden; in `binary-hardening` mode the flag set applies to the build's compile and link commands.
- The question: required. Dependency, symbol, size, hardening, relocation, or build identity.
- A symbol name or address: optional, narrows the query.
- The mode: optional. `inspect` (default) answers a question about the binary; `binary-hardening` measures the current mitigations and emits the flag set that closes the gaps.
- The toolchain: required in `binary-hardening` mode. `gcc --version` or `clang --version`, `ld --version`, and `ldd --version` for the libc. Grounded channels: GCC 16.x, Clang 23.1.0, binutils 2.47, glibc 2.44.
- Target platforms: optional. x86-64, AArch64, or both. Threat scope: optional, which mitigations the deployment actually needs.

## Procedure

1. Classify the file. `file` reports architecture, linkage, and stripped state; `size` reports text, data, and bss. Done when: the type and the stripped state are known, because they select the tools for later steps.

```bash
file prog
size --format=sysv prog
```

2. List dynamic dependencies with `ldd`. A `not found` row names the deployment gap. Done when: every `DT_NEEDED` entry resolves, or the missing one is named.

```bash
ldd ./prog
ldd -v ./prog          # include version requirements
```

`ldd` executes the loader against the binary. Never run it on an untrusted binary; use `readelf -d` for those.

3. Query symbols with `nm`. `-D` reads the dynamic table, `-C` demangles, `-u` lists what the binary needs. Done when: the symbol is found with its type, or its absence is proven.

```bash
nm -D ./libfoo.so            # exported dynamic symbols
nm -C prog                   # demangled
nm -u prog                   # undefined symbols
nm -S --defined-only prog    # with sizes
```

Type codes: `T`/`t` code, `D`/`d` initialized data, `B`/`b` bss, `R`/`r` read-only data, upper for global and lower for local, `U` undefined, `W`/`w` weak, `V` weak object.

4. Read structure with `readelf`. It needs no execution and parses every ELF. Done when: the requested section, segment, or table is printed.

```bash
readelf -h prog    # header: class, machine, type, entry
readelf -S prog    # sections
readelf -l prog    # program headers, segments
readelf -d prog    # dynamic section, raw form of ldd
readelf -s prog    # symbol tables
readelf -r prog    # relocations
readelf -n prog    # notes, build ID
readelf --debug-dump=info prog   # DWARF
```

5. Disassemble with `objdump`. `-S` interleaves source when the binary carries `-g`. Done when: the code around the address or symbol is shown in the requested syntax.

```bash
objdump -d -M intel prog
objdump -d -S prog
objdump -s -j .rodata prog   # hex dump of one section
objdump -p prog              # private headers, DT_NEEDED entries
```

6. Check hardening state. PIE means `ET_DYN` on an executable; full RELRO needs `GNU_RELRO` plus `BIND_NOW`; a non-executable stack means `GNU_STACK` flags `RW`, not `RWE`. Done when: each property is reported present or absent from the binary's own headers.

```bash
readelf -h prog | grep 'Type:'
readelf -l prog | grep GNU_RELRO
readelf -d prog | grep BIND_NOW
readelf -l prog | grep GNU_STACK
nm prog | grep __stack_chk_fail     # stack protector
```

`checksec --file=prog` runs the same checks in one call, and `checksec --dir=/usr/bin` measures every binary in a directory at once; it is a separate install. In `binary-hardening` mode, run it and record every row of this measurement before changing anything:

| Protection | Good | Concern |
|---|---|---|
| RELRO | Full RELRO | Partial or none |
| Stack canary | Canary found | None |
| NX | NX enabled | Disabled |
| PIE | PIE enabled | None |
| FORTIFY | Yes | No |

Done when, in `binary-hardening` mode: every row has a measured value for the binary. In `binary-hardening` mode, continue with steps 10 through 17.

7. Analyze size. Rank symbols by size, then rank sections. For per-object contribution, rebuild the link with `-Wl,--print-map` or run `bloaty`, a separate install. Done when: the largest contributors are named with numbers.

```bash
size --format=sysv prog | sort -k2 -nr | head
nm -S --defined-only prog | sort -k2 -nr | head -20
```

8. Read the build ID. It identifies the exact build for `debuginfod` lookups and pairs the binary with its `.debug` file. Done when: the ID is quoted.

```bash
readelf -n prog | grep 'Build ID'
```

9. Run the diagnosis flows. Done when: the reported error traces to its cause in the binary.

- Undefined symbol at load time: `nm -D libfoo.so | grep mysymbol` to see whether the expected provider exports it, then `ldd ./prog | grep libfoo` to see whether the loader found that provider.
- Binary too large: steps 1 and 7, then decide between stripping debug info (`binutils`), removing sections, or restructuring data.
- Unexpected dependency: `readelf -d prog | grep NEEDED`, then trace who pulls it in with the link map.

10. In `binary-hardening` mode, apply the hardening flag set that the toolchain supports:

```bash
CFLAGS="-O2 -pipe \
  -fstack-protector-strong \
  -fstack-clash-protection \
  -fcf-protection \
  -D_FORTIFY_SOURCE=3 \
  -D_GLIBCXX_ASSERTIONS \
  -fPIE \
  -Wformat -Wformat-security -Werror=format-security"

LDFLAGS="-pie \
  -Wl,-z,relro \
  -Wl,-z,now \
  -Wl,-z,noexecstack \
  -Wl,-z,separate-code"

gcc ${CFLAGS} -o prog main.c ${LDFLAGS}
```

Shared libraries compile with `-fPIC` instead of `-fPIE` and link with `-shared`. Clang takes the same hardening defines in place of the `gcc` call; `-D_GLIBCXX_ASSERTIONS` applies whenever libstdc++ headers are in use. Gate each flag on the toolchain: `_FORTIFY_SOURCE=3` needs GCC 12 or newer, or Clang 9 or newer, plus glibc 2.34 or newer headers; older toolchains fall back to level 2. Done when: the build compiles clean and checksec shows the new values.

11. In `binary-hardening` mode, state what each mitigation buys:

| Flag | Protection |
|---|---|
| `-fstack-protector-strong` | Canary on functions with local arrays or address-taken locals |
| `-fstack-clash-protection` | Stack-heap collision on huge allocations |
| `-fcf-protection` | x86 CET markers (IBT plus shadow stack) |
| `-D_FORTIFY_SOURCE=2` / `=3` | Bounds-checked libc calls; 3 adds dynamic object sizes |
| `-fPIE` + `-pie` | Address-space layout randomization for the executable |
| `-Wl,-z,relro` | GOT read-only after relocation |
| `-Wl,-z,now` | Eager binding; with relro, Full RELRO |
| `-Wl,-z,noexecstack` | Non-executable stack |

Done when: every flag in the set is traceable to a row here and no flag is cargo-culted. Gate the set further on the toolchain: `-fstack-clash-protection` needs GCC 8 or newer or Clang 11 or newer, `-fcf-protection` needs GCC 8 or newer, and Clang's `-fsanitize=safe-stack` is an optional extra that changes the ABI. The stricter link set adds `-Wl,-z,nodlopen`, `-Wl,-z,nodump`, and `-Wl,--as-needed`.

12. In `binary-hardening` mode, tune canary coverage deliberately. `-fstack-protector` guards functions with `alloca` or large buffers; `-strong` adds local arrays and address-taken locals; `-all` guards everything at a runtime cost. Verify presence with `readelf -s prog | grep stack_chk`. Done when: the coverage level is a recorded choice, not a default.

13. In `binary-hardening` mode, check FORTIFY coverage in the output binary: `objdump -d prog | grep __.*_chk` counts fortified calls. Fedora 38 and later build distribution packages with level 3; query your own toolchain with `dpkg-buildflags --query` or `rpm --eval "%{build_cflags}"` instead of assuming. Done when: fortified call sites exist or the reason they cannot is stated.

14. In `binary-hardening` mode, add Clang CFI where the codebase can absorb LTO. CFI checks indirect and virtual call types and requires LTO plus hidden visibility:

```bash
clang -fsanitize=cfi -fvisibility=hidden -flto -O2 -fPIE -pie main.cpp -o prog
# Narrower checks: -fsanitize=cfi-vcall, cfi-icall, cfi-derived-cast, cfi-unrelated-cast
# Across shared libraries: add -fsanitize-cfi-cross-dso and build everything with LTO
```

Done when: the link succeeds with LTO or the incompatible code is identified.

15. In `binary-hardening` mode, deploy CET when hardware and kernel allow it. Build with `-fcf-protection=full`, verify the notes with `readelf -n prog | grep -E 'SHSTK|IBT'`, and expect `endbr64` landing pads in the disassembly. Runtime shadow stack needs a CPU with CET, Linux 6.6 or newer with `CONFIG_X86_USER_SHADOW_STACK=y`, glibc 2.39 or newer, and opt-in through tunables; it is off by default. `ld -z shstk` and `ld -z ibt` stamp the corresponding GNU property notes directly. Check CPU support with `grep -m1 user_shstk /proc/cpuinfo`. Done when: the notes are present and the runtime chain is confirmed or the gap is named.

16. In `binary-hardening` mode on AArch64, use `-mbranch-protection=standard` for BTI plus return-address PAC (ARMv8.3+ for PAC), and verify with `readelf -n prog | grep -E 'BTI|PAC'`. For MTE-capable ARMv8.5+ hardware, Clang instruments stacks with `-fsanitize=memtag-stack` together with `-march=armv8a+memtag` (or `armv9a+memtag`); the flag errors out on non-ARM targets. MTE tags 16-byte granules with 4-bit tags and faults on mismatch. Done when: the notes verify and the hardware claim is checked, or the feature is deferred.

17. In `binary-hardening` mode, restrict syscalls with libseccomp after all initialization, since the filter is irreversible once loaded:

```c
#include <seccomp.h>

void apply_seccomp_filter(void) {
    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL_PROCESS);
    seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 0);
    seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 0);
    seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0);
    seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(brk), 0);
    seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(mmap), 0);
    seccomp_load(ctx);
    seccomp_release(ctx);
}
```

Build the allowlist from measurement, not guesswork: `strace -c ./prog` counts the syscalls actually used, and `strace ./prog` confirms nothing dies with SIGSYS after the filter lands. Done when: the program runs its real workload under the filter.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `nm` prints `no symbols` | The binary is stripped. Inspect the dynamic table with `nm -D`, or point the tools at the `.debug` file or unstripped build. |
| `ldd` reports `not a dynamic executable` | The binary is static or for another architecture. Confirm with `file`, and use the triplet-prefixed tools for foreign objects. |
| Section names absent | The binary may be stripped of the section header table. Read it through program headers with `readelf -l`. |
| Two builds disagree | Compare build IDs from `readelf -n` before comparing anything else; a mismatch means the inputs differ. |
| Flag rejected by the compiler | Drop the flag, record which toolchain refused it, ship the rest. |
| FORTIFY=3 silently below level 3 | The toolchain or glibc is too old. Verify with the `_chk` count; fall back to level 2 explicitly. |
| CFI link fails | Non-LTO objects or visibility leaks in the build. Fix the object set before enabling cross-DSO. |
| SHSTK absent at runtime | A layer below the binary lacks support. Check CPU flag, kernel config, and glibc version in order. |
| Program dies with SIGSYS under seccomp | The allowlist is incomplete. Read the strace count and add the missing syscall deliberately. |
| checksec disagrees with the build flags | The link stage dropped a mitigation. Confirm `-pie` and the `-Wl,-z` flags reached the final link. |

## Output

A quoted-answer report: the tool command, its relevant output lines, and the conclusion drawn from them; in `binary-hardening` mode, a protection report: the checksec reading, the applied or recommended flag set with per-flag toolchain support, verification command outputs, and the seccomp allowlist where one applies, each claim naming the compiler, binutils, and libc versions it assumes. The command table, symbol type list, and section map are in `references/cheatsheet.md`.
