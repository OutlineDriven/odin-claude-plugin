---
name: assembly-x86
description: 'Use when reading GCC or Clang x86-64 assembly, writing inline asm, decoding AT&T syntax, or applying System V AMD64 register rules. Not for SIMD intrinsic selection: use simd-intrinsics.'
---

# x86-64 assembly

GCC and Clang emit AT&T syntax by default. This skill reads that output, writes inline asm, and keeps register use inside the System V AMD64 ABI.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task reads compiler assembly output, writes inline asm in C or C++, decides AT&T versus Intel syntax, or explains calling conventions and stack layout in a disassembly. |
| Authority | Read-only. The skill explains and drafts; edits land through the normal coding path. No remote mutation. |
| Side effect | None. |
| Done | The drafted assembly assembles with `gcc -c` or `clang -c`, or the compiler output under discussion is explained register by register. |

## Inputs

- The C or C++ source, compiler output, or assembly fragment: required.
- The compiler: required. AT&T versus Intel output and inline asm details follow it.
- The ABI: required. System V for Linux and macOS; the Microsoft x64 ABI changes the register map entirely.

## Procedure

1. Generate the baseline. Read the compiler's own output before writing any. Done when: the disassembly of the function under discussion is on screen.

```bash
gcc -O2 -S -fverbose-asm foo.c -o foo.s
gcc -O2 -c foo.c -o foo.o && objdump -d -M intel foo.o
```

2. Map registers by role. Done when: every register in the fragment is classified.

| Register | 32-bit view | Role |
|----------|-------------|------|
| `rax` | `eax` | Accumulator, 1st return value, caller saved |
| `rbx` | `ebx` | Base, callee saved |
| `rcx` | `ecx` | 4th argument, caller saved |
| `rdx` | `edx` | 3rd argument, 2nd return value, caller saved |
| `rsi` | `esi` | 2nd argument, caller saved |
| `rdi` | `edi` | 1st argument, caller saved |
| `rbp` | `ebp` | Frame pointer, callee saved |
| `rsp` | `esp` | Stack pointer |
| `r8` to `r11` | | 5th through 8th arguments, caller saved |
| `r12` to `r15` | | Callee saved |
| `rflags` | `flags` | Condition codes |
| `xmm0` to `xmm7` | | FP and SIMD arguments and returns |
| `xmm8` to `xmm15` | | FP and SIMD scratch, caller saved |

System V argument order: integer and pointer args in `rdi, rsi, rdx, rcx, r8, r9`, then the stack; float and vector args in `xmm0` to `xmm7`.

3. Respect the stack rules. `rsp` stays 16-byte aligned before a `call`, because the call pushes 8 bytes and the callee expects alignment. The red zone is the 128 bytes below `rsp` that leaf functions may use without adjusting `rsp`. Kernel code compiles with `-mno-red-zone` because interrupts do not honor it. Done when: the drafted prologue keeps the alignment and names the red-zone choice.

```asm
push rbp
mov  rbp, rsp
sub  rsp, 16        # keep rsp a multiple of 16 before call sites
```

4. Read the recurring instruction shapes. Done when: each line in the fragment parses.

| Pattern | Meaning |
|---------|---------|
| `mov %rdi, -8(%rbp)` | Store the first argument to a local slot |
| `mov (%rdi), %rax` | Load 8 bytes from the address in `rdi` |
| `lea 8(%rdi), %rax` | Compute an address without memory access |
| `addq $8, %rdi` | Advance a pointer by one element |
| `push %rbp` then `pop %rbp` | Frame save and restore |
| `call func` then `ret` | Call pushes the return address, `ret` pops it |
| `leave` | `mov %rbp, %rsp` then `pop %rbp` |
| `test %rax, %rax` | Set flags from `rax == 0` cheaply |
| `cmp $0, %rax` | Same flag result, one byte longer |
| `sete %al` | Copy `ZF` into a byte register |
| `cmovne %rdx, %rax` | Conditional move, branchless select |

5. Choose a syntax and stay in it. AT&T puts the source operand first and prefixes registers and immediates; Intel puts the destination first. Done when: the listing and the written code use one syntax.

| AT&T | Intel |
|------|-------|
| `mov %rax, %rbx` | `mov rbx, rax` |
| `mov $8, %rax` | `mov rax, 8` |
| `movb %al, (%rdi)` | `mov byte ptr [rdi], al` |
| Default in GCC | `-masm=intel` or `objdump -M intel` |

6. Write inline asm with the extended syntax. The template lists outputs, inputs, and clobbers. Constraint codes: `r` general register, `a`/`b`/`c`/`d` specific ones, `m` memory, `i` immediate. Tell the compiler about memory effects with `"memory"`. Done when: the fragment compiles and survives optimization with correct results.

```c
static inline long cpuid_leaf(long leaf) {
    long a, b, c, d;
    __asm__ volatile("cpuid"
                     : "=a"(a), "=b"(b), "=c"(c), "=d"(d)
                     : "a"(leaf));
    return a;
}
```

```c
static inline int atomic_incr(int *p) {
    int ret;
    __asm__ volatile("lock xaddl %0, %1"
                     : "=r"(ret), "+m"(*p)   // +m: read and written
                     : "0"(1));
    return ret;   // returns the previous value
}
```

7. Recognize the SSE and AVX headers when reading vector code. `<xmmintrin.h>` provides SSE, `<emmintrin.h>` SSE2, and `<immintrin.h>` everything through AVX-512. For choosing and writing intrinsics use `simd-intrinsics`. Done when: vector code under discussion is attributed to its instruction set level.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Crash after a `call` in hand-written asm | Stack misalignment. Re-align `rsp` to 16 before every call site. |
| Inline asm result wrong at `-O2` | Missing `volatile`, a wrong constraint, or a missing `"memory"` clobber. Fix the declaration, not the build flags. |
| `lock` prefix rejected | The destination is a register or the assembler is 16-bit mode. `lock` needs a memory destination. |
| Intel-syntax source fails to build | The file mixes syntaxes. Convert with `objdump -M intel` as reference, and compile with one syntax. |
| Value lost across a call | It sat in a caller-saved register. Move it to `rbx`, `r12` to `r15`, or spill it. |

## Output

Annotated assembly or inline asm with register roles, stack alignment stated, and clobbers justified. The full instruction tables, flags register map, conditional jump list, and prologue patterns are in `references/reference.md`.
