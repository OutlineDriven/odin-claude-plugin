# RISC-V psABI reference

Source: the RISC-V ELF psABI specification maintained by riscv-non-isa.

## Integer calling convention

| Register | ABI name | Role |
|----------|----------|------|
| `x0` | `zero` | Hardwired zero |
| `x1` | `ra` | Return address, caller saved |
| `x2` | `sp` | Stack pointer, callee owned |
| `x3` | `gp` | Global pointer |
| `x4` | `tp` | Thread pointer |
| `x5` to `x7` | `t0` to `t2` | Temporaries, caller saved |
| `x8` | `s0`/`fp` | Saved register or frame pointer, callee saved |
| `x9` | `s1` | Saved register, callee saved |
| `x10` to `x11` | `a0`, `a1` | Arguments and return values |
| `x12` to `x17` | `a2` to `a7` | Arguments |
| `x18` to `x27` | `s2` to `s11` | Saved registers, callee saved |
| `x28` to `x31` | `t3` to `t6` | Temporaries, caller saved |

Call sequence:

1. Caller places up to eight integer args in `a0` to `a7`; further args go on the stack, each aligned to its size.
2. Caller saves any `t` or `a` registers it needs across the call.
3. Caller executes `jal ra, target`.
4. Callee saves the `s` registers it will use and allocates its frame with a 16-byte-aligned `sp`.
5. Callee returns the value in `a0` and restores `sp` and the saved registers.
6. Callee executes `ret`, which is `jalr zero, ra, 0`.

Stack frame layout at function entry: the incoming args above `sp` if any were passed on the stack, the return address at `sp - 8` once saved, and locals below the saved registers.

## Floating-point calling convention

With `f` and `d` in the ISA, FP args go in `fa0` to `fa7`:

| Register | ABI name | Role |
|----------|----------|------|
| `f0` to `f7` | `ft0` to `ft7` | Temporaries, caller saved |
| `f8` to `f9` | `fs0`, `fs1` | Saved, callee saved |
| `f10` to `f17` | `fa0` to `fa7` | Arguments and returns, caller saved |
| `f18` to `f27` | `fs2` to `fs11` | Saved, callee saved |
| `f28` to `f31` | `ft8` to `ft11` | Temporaries, caller saved |

ABI variants selected by `-mabi`: `ilp32` and `lp64` pass floats in integer registers through software, `ilp32f` and `lp64f` use `f` registers for single precision, `ilp32d` and `lp64d` pass doubles in `f` registers. Hardware without FP uses the soft-float ABI.

## Atomics

The `a` extension provides load-reserved and store-conditional loops for lock-free code:

```asm
1:  lr.w t0, (a0)        # reserve the word
    addi t0, t0, 1
    sc.w t1, t0, (a0)    # t1 = 0 when the store landed
    bnez t1, 1b          # retry when the reservation broke
```

The `zawrs` and later extensions change wait strategies but not this loop shape.

## Extension naming

Extensions concatenate in the mandated order:

| Letter | Extension |
|--------|-----------|
| `I` | Base integer ISA, RV32I or RV64I |
| `M` | Integer multiply and divide |
| `A` | Atomics |
| `F` | Single-precision float |
| `D` | Double-precision float |
| `G` | Shorthand for `IMAFD` with Zicsr and Zifencei |
| `C` | Compressed 16-bit instructions |

Extra extensions, for example `B` for bit manipulation once ratified, append after the single-letter block. Write the full `-march` string and let the toolchain reject what the target lacks.
