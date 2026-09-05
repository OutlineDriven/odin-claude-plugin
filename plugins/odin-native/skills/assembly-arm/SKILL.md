---
name: assembly-arm
description: 'Use when reading or writing AArch64 or AArch32 Thumb assembly, inline asm in C, AAPCS64 register roles, or NEON and SVE vector code. Not for ABI detail across ISAs: use abi-and-calling-conventions.'
---

# ARM and AArch64 assembly

AArch64 has 31 general 64-bit registers, a clean load-store instruction set, and per-core SIMD through NEON. This skill reads compiler output and writes correct inline asm for it.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task reads GCC or Clang AArch64 output, writes inline asm or standalone assembly, decodes AAPCS64 register roles, or writes NEON intrinsics or SVE kernels. |
| Authority | Read-only. The skill explains, drafts, and annotates assembly; edits land in the user's source through the normal coding path. No remote mutation. |
| Side effect | None. Output is analysis and drafted code in chat. |
| Done | The drafted assembly assembles for the named target, or the compiler output under discussion is explained register by register. |

## Inputs

- The C or C++ source, compiler output, or assembly fragment: required.
- The target: required. `aarch64-linux-gnu` for application cores, `arm-none-eabi` with `-mthumb` for 32-bit Cortex-M.
- The purpose: required. Reading output, writing inline asm, or vectorizing.

## Procedure

1. Generate a baseline. Write the C version first and read its output before hand-writing anything. Done when: the compiler's own code for the same function is on screen.

```bash
aarch64-linux-gnu-gcc -O2 -S foo.c -o foo.s
aarch64-linux-gnu-objdump -d a.out
```

2. Map registers by role. The table names are the ABI's, and assembly must respect them. Done when: every register in the fragment is classified.

| Register | Alias | Role |
|----------|-------|------|
| `x0` to `x7` | `w0` for 32-bit use | Arguments and return values, caller saved |
| `x8` | | Indirect result location, or syscall number on Linux |
| `x9` to `x15` | | Temporaries, caller saved |
| `x16`, `x17` | `ip0`, `ip1` | Intra-procedure call scratch, do not keep values across calls |
| `x18` | | Platform register, reserved on some platforms, do not use |
| `x19` to `x28` | | Callee saved |
| `x29` | `fp` | Frame pointer |
| `x30` | `lr` | Link register, return address |
| `sp` | | Stack pointer, must stay 16-byte aligned at public interfaces |
| `v0` to `v7` | `q`/`d`/`s` views | FP and SIMD arguments and returns, caller saved |
| `v8` to `v15` | | Callee saved, low 64 bits only |

3. Read the common instructions. Load and store are separate from arithmetic, which only runs on registers. Done when: each instruction in the fragment parses.

```asm
ldr  x0, [x1]          // load 64-bit
ldrb w0, [x1]          // load byte, zero-extended
strb w0, [x1]          // store byte
ldp  x0, x1, [sp]      // load pair
stp  x29, x30, [sp, #-16]!  // store pair with pre-index writeback
add  x0, x1, x2        // x0 = x1 + x2
mul  x0, x1, x2        // low 64 bits of the product
madd x0, x1, x2, x3    // x0 = x1*x2 + x3
sdiv x0, x1, x2        // signed divide
udiv x0, x1, x2        // unsigned divide
cmp  x0, x1            // set flags from x0 - x1
cbz  x0, label         // branch if zero, no flags needed
blr  x0                // branch to address in register, set x30
ret                    // return through x30
adrp x0, symbol        // page address of a symbol
add  x0, x0, :lo12:symbol
```

4. Write the standard prologue and epilogue. Leaf functions that fit in a frame need none. Done when: any callee-saved register pushed is popped, and `sp` returns aligned.

```asm
my_func:               // non-leaf example
    stp  x29, x30, [sp, #-32]!
    mov  x29, sp
    stp  x19, x20, [sp, #16]
    // body
    ldp  x19, x20, [sp, #16]
    ldp  x29, x30, [sp], #32
    ret
```

5. Write inline asm with the constraints the target needs. `volatile` stops reordering, `memory` declares side effects on memory, and hardware registers need explicit clobbers. Use the counter to read the timer. Done when: the fragment compiles and its inputs, outputs, and clobbers are each listed.

```c
static inline uint64_t read_cntvct(void) {
    uint64_t val;
    __asm__ volatile("mrs %0, cntvct_el0" : "=r"(val));
    return val;
}
```

6. Use NEON for 128-bit SIMD. Work through `<arm_neon.h>` intrinsics; they map one to one onto instructions. Done when: the loop processes one vector per iteration and the scalar tail stays correct.

```c
#include <arm_neon.h>

void sum_f32(const float *a, const float *b, float *dst, int n) {
    for (int i = 0; i + 4 <= n; i += 4) {
        float32x4_t va = vld1q_f32(a + i);   // load 4 floats
        float32x4_t vb = vld1q_f32(b + i);
        float32x4_t vc = vaddq_f32(va, vb);
        vst1q_f32(dst + i, vc);              // store 4 floats
    }
}
```

7. Apply the platform corrections. Apple silicon uses 16 KiB pages and a 128-byte cache line, so `sysconf(_SC_PAGESIZE)` replaces the 4096 assumption. AMX is internal to Apple libraries; write portable code with Accelerate or Metal instead. SVE exists only where the hardware has it; guard SVE code and keep a NEON fallback. Done when: the code states no portability assumption the target contradicts.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `sp` misaligned crash in a callee | A path adjusted `sp` by a non-16-byte amount. Audit every `sub sp` and pre-index offset. |
| Value lost across a call in hand-written asm | The value sat in `x0` to `x17`. Move it to a callee-saved register or spill it. |
| Inline asm result wrong at `-O2` | Missing `volatile` or a missing `"memory"` clobber let the compiler delete or reorder the asm. |
| NEON code fails on Cortex-M | Cortex-M has no NEON and runs Thumb. Rewrite with scalar code or a DSP extension. |
| SVE build fails on a NEON-only core | SVE needs supporting hardware. Use the guarded fallback from step 7. |

## Output

Annotated assembly or inline asm, with the register roles named, the clobbers justified, and the target stated. The condition-code table, the wider instruction list, and the NEON category reference are in `references/reference.md`.
