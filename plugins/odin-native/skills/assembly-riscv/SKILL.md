---
name: assembly-riscv
description: 'Use when reading or writing RV32/RV64 assembly, inline asm in C, the RISC-V psABI, IMAFD extension naming, compressed instructions, or QEMU RISC-V debugging.'
---

# RISC-V assembly

RISC-V is a small load-store ISA grown through named extensions. This skill covers user-mode RV32 and RV64 assembly, the psABI register contract, and the QEMU loop.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task writes inline asm or assembly for RV32 or RV64, decodes ABI register names, names an ISA extension string, enables compressed instructions, or debugs RISC-V under QEMU with GDB. |
| Authority | Read-only. The skill explains and drafts; edits land through the normal coding path. No remote mutation. |
| Side effect | None. |
| Done | The drafted assembly assembles for the named base ISA and extensions, or the compiler output under discussion is explained register by register. |

## Inputs

- The C or C++ source, assembly fragment, or compiler output: required.
- The base ISA and extensions: required. The `-march` string such as `rv64gc`, written `IMAFDC` in ISA order.
- The execution environment: required. QEMU `virt` for user or system work, hardware otherwise.

## Procedure

1. Map registers by role. The ABI names are what disassembly and assembly listings show. Done when: every register in the fragment is classified.

| Register | ABI name | Role |
|----------|----------|------|
| `x0` | `zero` | Hardwired zero, writes are discarded |
| `x1` | `ra` | Return address |
| `x2` | `sp` | Stack pointer |
| `x3` | `gp` | Global pointer |
| `x4` | `tp` | Thread pointer |
| `x5` to `x7`, `x28` to `x31` | `t0` to `t6` | Temporaries, caller saved |
| `x8` | `s0`/`fp` | Frame pointer or saved register, callee saved |
| `x9`, `x18` to `x27` | `s1`, `s2` to `s11` | Saved registers, callee saved |
| `x10` to `x17` | `a0` to `a7` | Arguments and return values, caller saved |
| `f0` to `f7`, `f28` to `f31` | `ft0` to `ft11` | FP temporaries, caller saved |
| `f8` to `f9`, `f18` to `f27` | `fs0` to `fs11` | FP saved, callee saved |
| `f10` to `f17` | `fa0` to `fa7` | FP arguments and returns, caller saved |

2. Write the calling convention into the code. Args go in `a0` to `a7`, extra args on the stack, return value in `a0`. Save callee-saved registers before use and restore them before return. Done when: any `s` register used is saved and restored.

3. Read the base instructions. Done when: each instruction in the fragment parses.

```asm
add  a0, a1, a2        # a0 = a1 + a2
sub  a0, a1, a2
mul  a0, a1, a2        # M extension
div  a0, a1, a2        # signed divide, remainder in rem
and  a0, a1, a2
or   a0, a1, a2
xor  a0, a1, a2
sll  a0, a1, a2        # shift left by register
slli a0, a1, 3         # shift by immediate
lw   a0, 0(a1)         # load word, RV32
ld   a0, 0(a1)         # load doubleword, RV64
lbu  a0, 0(a1)         # byte, zero-extended
sw   a0, 0(a1)
sd   a0, 0(a1)
beq  a0, a1, label     # branch if equal
blt  a0, a1, label     # signed less than
bge  a0, a1, label     # unsigned forms are bgeu/bltu with the u suffix
jal  ra, func          # call
jalr zero, ra, 0       # return, pseudo for ret
la   a0, symbol        # load address, pseudo
li   a0, 42            # load immediate, pseudo
```

4. Write the minimal function shape. A leaf function that fits in registers needs no stack. Done when: every non-leaf function saves and restores what it uses.

```asm
.global factorial          # RV64 example
factorial:
    li   a1, 1             # result accumulator
1:  beqz a0, 2f
    mul  a1, a1, a0
    addi a0, a0, -1
    j    1b
2:  mv   a0, a1
    ret
```

5. Name the ISA correctly. Extensions combine into one string in fixed order. `rv64gc` is the common application profile and expands to `IMAFDC` plus Zicsr and Zifencei. `a` brings atomics, `m` integer multiply and divide, `f` and `d` single and double float. Done when: the `-march` string matches the hardware or QEMU target.

6. Write inline asm with the right constraints. RISC-V CSR access needs `csrr` or the `csrrs` family, and a `memory` clobber when the instruction has memory side effects. Done when: inputs, outputs, and clobbers are each listed.

```c
static inline uint64_t rdcycle(void) {
    uint64_t val;
    __asm__ volatile("rdcycle %0" : "=r"(val));
    return val;
}
```

7. Use compressed instructions where density matters. The C extension replaces common 32-bit encodings with 16-bit ones; enable it through `-march=rv64gc` or disable with `-march=rv64ima`. Verify with disassembly: compressed instructions print as `c.addi`, `c.ld`, and their `c.` family. Done when: the disassembly shows the intended encoding width.

```bash
riscv64-linux-gnu-gcc -march=rv64gc -O2 prog.c -o prog
riscv64-linux-gnu-objdump -d prog | grep -E '\sc\.'
```

8. Debug under QEMU. Run QEMU with GDB waiting, then connect and break. Done when: breakpoints hit and registers read out.

```bash
qemu-riscv64 -g 1234 ./prog            # user mode
qemu-system-riscv64 -M virt -nographic -kernel fw_jump.elf -gdb tcp::1234 -S
riscv64-linux-gnu-gdb ./prog
(gdb) target remote :1234
(gdb) b main
(gdb) c
```

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `f` instructions fail to assemble | The `-march` string lacks `f` or `d`. Extend it, for example `rv64gc` already carries both. |
| Atomics undefined | The `a` extension is missing from `-march`, or the target truly lacks it. Add `a` or rewrite with a lock. |
| Corruption across a call | A callee-saved `s` register was used without save and restore. Audit the prologue and epilogue. |
| QEMU hangs at boot | The kernel or firmware image does not match the machine. Re-run with `-nographic` and read the early console output. |
| GDB cannot connect | The port disagrees or QEMU lacks `-g`. Check the QEMU command line first, then the GDB target. |

## Output

Annotated assembly or inline asm with register roles, the exact `-march` string, and for QEMU work the exact launch and GDB commands. The full psABI table, including the floating-point calling variants, is in `references/riscv-abi.md`.
