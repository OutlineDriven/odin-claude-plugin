---
name: abi-and-calling-conventions
description: 'Use when explaining System V AMD64, ARM AAPCS, RISC-V psABI, stack frames, variadic calls, or FFI register rules. Not for the Rust FFI binding layer: use rust-ffi.'
---

# ABI and calling conventions

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A question or debugging session needs the register roles, stack alignment, argument passing, return value, or variadic rules of System V AMD64, ARM AAPCS, or the RISC-V psABI. |
| Authority | Read-only. The skill reads source, disassembly, and compiler output and answers in chat. Nothing on disk changes, so there is nothing to roll back. No remote mutation. |
| Side effect | Chat output only. Compiler and disassembler runs write nothing outside stdout. |
| Done | The answer names the argument registers, return registers, stack alignment, callee-saved set, and variadic rule for the named ABI, and points to the compiler output that confirms it. |

## Inputs

- Target ABI (required): System V AMD64, AAPCS64 (AArch64), or RISC-V psABI (RV64). If the user names Windows x64, see the failure table.
- Calling context (required): an assembly thunk, inline asm clobber list, a mixed C and assembly boundary, a variadic wrapper, or an FFI signature.
- Symptom (optional): a crash on `call`, a wrong argument value, or a corrupted register after a call.

## Procedure

1. Name the ABI from the toolchain target and the platform. Done when: one of the three ABIs is named, or the failure table applies.
2. State the register contract for that ABI. Done when: argument, return, alignment, and callee-saved rows are all given.

| ABI | Integer arguments | Float or vector arguments | Return | Stack alignment at call | Callee-saved |
|---|---|---|---|---|---|
| System V AMD64 | `rdi, rsi, rdx, rcx, r8, r9` | `xmm0` to `xmm7` | `rax` (`xmm0` for float or vector), plus `rdx` for 128-bit values | 16 bytes before `call` | `rbx, rbp, r12` to `r15`, `rsp` |
| AAPCS64 | `x0` to `x7` | `v0` to `v7` | `x0` and `x1`, or `v0` | 16 bytes | `x19` to `x28`, `x29` (frame pointer), `sp` |
| RISC-V psABI RV64 | `a0` to `a7` | `fa0` to `fa7` | `a0` and `a1` (`fa0` for float) | 16 bytes | `s0` to `s11`, `sp` |

System V AMD64 on Linux also grants a 128-byte red zone below `rsp` that leaf functions use without adjusting the stack pointer. Arguments past the register set go on the stack, so a seven-integer C function on System V passes the seventh in memory.

3. Draw the stack frame: return address at the top, then the saved frame pointer, locals, spill slots and alignment padding, and outgoing arguments at the lowest addresses next to the stack pointer. Done when: the user can place each item relative to the frame pointer.
4. Cover the variadic rule when the context has `...`. On System V AMD64 the caller sets `al` to the count of vector registers used, and `va_start` needs the register save area the prologue writes. Recommend typed wrappers over raw `va_arg` at FFI boundaries, and cast every `va_arg` type to its promoted form. Done when: the variadic rule is stated or the context has no variadic call.
5. Confirm the rule against the compiler. Done when: the compiler output shows the argument moves and the `.cfi_*` directives that match the stated rule.

```bash
gcc -O2 -S -o - foo.c          # argument moves and .cfi_* directives
objdump -d -M intel ./a.out    # the same after linking
```

For AArch32 Thumb interworking, note that a function pointer to Thumb code carries its low bit set. For the assembly side of each target, use `assembly-x86`, `assembly-arm`, or `assembly-riscv`. For symbol and relocation views, use `elf-inspection`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Windows x64 is the target | State that the Microsoft x64 convention differs from System V (different register order, 32-byte shadow space, no red zone) and stop. Do not apply System V rules to it. |
| ABI cannot be inferred | Ask for the toolchain target triple. Do not guess from the source language. |
| Crash on `call` | Check that `rsp` is 16-byte aligned at the call instruction. A pushed return address leaves the callee entry at 8 mod 16. |
| Wrong float argument | Match the prototype: a float without a prototype goes through integer promotion rules and lands in the wrong register class. |
| Corrupted callee-saved register | The inline asm or thunk clobbered a callee-saved register without saving it. List it in the clobber list or save and restore it. |
| Mixed-ABI FFI | Both sides must be built for the same target ABI. Check the compiler target on each side. |

## Output

A chat answer with the register table row for the named ABI, the stack frame picture, the variadic rule where relevant, and the compiler or disassembler command that confirms the rule on the user's toolchain.
