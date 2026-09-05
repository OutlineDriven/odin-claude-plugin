---
name: binary-hardening
description: 'Use when enabling RELRO, PIE, stack canaries, FORTIFY_SOURCE, CET, CFI, or seccomp filters, or checking a binary with checksec. Not for runtime sanitizer builds: use sanitizers.'
---

# Binary hardening

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Hardening an ELF binary or its build: checksec analysis, RELRO, PIE, stack canaries, FORTIFY_SOURCE, CET and shadow stack, Clang CFI, AArch64 BTI and PAC, MTE, or seccomp syscall filtering. |
| Authority | Read-only. The skill emits flags, commands, and analysis; it writes no files. Nothing to roll back. No remote mutation. |
| Side effect | Hardening flag sets, verification commands, and a protection report per binary. |
| Done | The binary's current mitigations are measured, the missing ones have concrete flags, and each flag is confirmed supported by the project's compiler and libc. |

## Inputs

1. Binary or build (required): the ELF to check, or the build to harden.
2. Toolchain (required): `gcc --version` or `clang --version`, `ld --version`, and `ldd --version` for the libc. Grounded channels: GCC 16.x, Clang 23.1.0, binutils 2.47, glibc 2.44.
3. Target platforms (optional): x86-64, AArch64, or both.
4. Threat scope (optional): which mitigations the deployment actually needs.

## Procedure

1. Measure the binary first:

```bash
checksec --file=./mybinary
checksec --dir=/usr/bin
```

| Protection | Good | Concern |
|---|---|---|
| RELRO | Full RELRO | Partial or none |
| Stack canary | Canary found | None |
| NX | NX enabled | Disabled |
| PIE | PIE enabled | None |
| FORTIFY | Yes | No |

Done when: every row has a measured value for the binary.
2. Apply the hardening flag set that the toolchain supports:

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

Shared libraries compile with `-fPIC` instead of `-fPIE` and link with `-shared`. Gate each flag on the toolchain: `_FORTIFY_SOURCE=3` needs GCC 12 or newer, or Clang 9 or newer, plus glibc 2.34 or newer headers; older toolchains fall back to level 2. Done when: the build compiles clean and checksec shows the new values.
3. Read what each mitigation buys:

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

Done when: every flag in the set is traceable to a row here and no flag is cargo-culted.
4. Tune canary coverage deliberately. `-fstack-protector` guards functions with `alloca` or large buffers; `-strong` adds local arrays and address-taken locals; `-all` guards everything at a runtime cost. Verify presence with `readelf -s prog | grep stack_chk`. Done when: the coverage level is a recorded choice, not a default.
5. Check FORTIFY coverage in the output binary: `objdump -d prog | grep __.*_chk` counts fortified calls. Fedora 38 and later build distribution packages with level 3; query your own toolchain with `dpkg-buildflags --query` or `rpm --eval "%{build_cflags}"` instead of assuming. Done when: fortified call sites exist or the reason they cannot is stated.
6. Add Clang CFI where the codebase can absorb LTO. CFI checks indirect and virtual call types and requires LTO plus hidden visibility:

```bash
clang -fsanitize=cfi -fvisibility=hidden -flto -O2 -fPIE -pie main.cpp -o prog
# Narrower checks: -fsanitize=cfi-vcall, cfi-icall, cfi-derived-cast, cfi-unrelated-cast
# Across shared libraries: add -fsanitize-cfi-cross-dso and build everything with LTO
```

Done when: the link succeeds with LTO or the incompatible code is identified.
7. Deploy CET when hardware and kernel allow it. Build with `-fcf-protection=full`, verify the notes with `readelf -n prog | grep -E 'SHSTK|IBT'`, and expect `endbr64` landing pads in the disassembly. Runtime shadow stack needs a CPU with CET, Linux 6.6 or newer with `CONFIG_X86_USER_SHADOW_STACK=y`, glibc 2.39 or newer, and opt-in through tunables; it is off by default. `ld -z shstk` and `ld -z ibt` stamp the corresponding GNU property notes directly. Check CPU support with `grep -m1 user_shstk /proc/cpuinfo`. Done when: the notes are present and the runtime chain is confirmed or the gap is named.
8. On AArch64, use `-mbranch-protection=standard` for BTI plus return-address PAC (ARMv8.3+ for PAC), and verify with `readelf -n prog | grep -E 'BTI|PAC'`. For MTE-capable ARMv8.5+ hardware, Clang instruments stacks with `-fsanitize=memtag-stack` together with `-march=armv8a+memtag` (or `armv9a+memtag`); the flag errors out on non-ARM targets. MTE tags 16-byte granules with 4-bit tags and faults on mismatch. Done when: the notes verify and the hardware claim is checked, or the feature is deferred.
9. Restrict syscalls with libseccomp after all initialization, since the filter is irreversible once loaded:

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

The full flag tables live in references/hardening-flags.md.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Flag rejected by the compiler | Drop the flag, record which toolchain refused it, ship the rest. |
| FORTIFY=3 silently below level 3 | The toolchain or glibc is too old. Verify with the `_chk` count; fall back to level 2 explicitly. |
| CFI link fails | Non-LTO objects or visibility leaks in the build. Fix the object set before enabling cross-DSO. |
| SHSTK absent at runtime | A layer below the binary lacks support. Check CPU flag, kernel config, and glibc version in order. |
| Program dies with SIGSYS under seccomp | The allowlist is incomplete. Read the strace count and add the missing syscall deliberately. |
| checksec disagrees with the build flags | The link stage dropped a mitigation. Confirm `-pie` and the `-Wl,-z` flags reached the final link. |

## Output

A protection report: the checksec reading, the applied or recommended flag set with per-flag toolchain support, verification command outputs, and the seccomp allowlist where one applies. Each claim names the compiler, binutils, and libc versions it assumes.
