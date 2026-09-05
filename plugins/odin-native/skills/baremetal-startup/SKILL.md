---
name: baremetal-startup
description: 'Use when writing reset-to-main startup code, vector tables, VTOR, .data/.bss init, stack setup, startup.s, or crt0 for Cortex-M/RISC-V. Not for the bootloader jump: use bootloaders-embedded.'
---

# Bare-metal startup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Firmware never reaches `main()`, a new MCU is being brought up without a vendor HAL, or a custom `startup.s`, `Reset_Handler`, or crt0 is being written or debugged on Cortex-M or RISC-V. |
| Authority | Read-only: emits startup code, linker symbol requirements, and diagnostics to chat; the user places them in the project. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The startup path from the reset vector to `main()` is stated step by step, the vector table layout and the `.data` and `.bss` loops are given for the target core, and every linker symbol the code uses is listed with the linker script line that defines it. |

## Inputs

- Target core (Cortex-M0+, M3, M4F, M7, or RISC-V RV32 or RV64) and the vendor part.
- The linker script, or at least its `MEMORY` regions and the symbols it exports.
- Whether the firmware boots directly from flash or is launched by a bootloader at an offset.
- Which C runtime is linked (newlib, newlib-nano, none) and whether C++ static constructors exist.

## Procedure

1. State the boot sequence for the core before writing code. On Cortex-M the hardware loads `SP` from vector 0 and branches to vector 1, `Reset_Handler`. On RISC-V the core starts at the reset address with `sp` undefined, so the first instruction sets it. Done when: the sequence is written as an ordered list from power-on to `main()`.

   Cortex-M vector table head:

   | Index | Entry |
   |---|---|
   | 0 | Initial stack pointer (`_estack`) |
   | 1 | `Reset_Handler` |
   | 2 | `NMI_Handler` |
   | 3 | `HardFault_Handler` |
   | 4 and up | Fault handlers, then device IRQ handlers in NVIC order |

2. Write the vector table and `Reset_Handler` for Cortex-M. Copy `.data` from its load address in flash to its run address in RAM, zero `.bss`, then call `SystemInit` and `main`. Compare addresses with an unsigned branch (`bcc`), because addresses are unsigned. Done when: the assembly assembles for the target and the three symbol pairs come from the linker script.

   ```asm
   .syntax unified
   .thumb

   .section .isr_vector,"a",%progbits
   .global g_pfnVectors
   g_pfnVectors:
       .word _estack
       .word Reset_Handler
       .word NMI_Handler
       .word HardFault_Handler
       /* remaining fault and device IRQ vectors from the vendor CMSIS header order */

   .section .text.Reset_Handler
   .thumb_func
   .global Reset_Handler
   Reset_Handler:
       ldr r0, =_sidata        /* .data load address in flash */
       ldr r1, =_sdata         /* .data run address in RAM */
       ldr r2, =_edata
       b   copy_check
   copy_data:
       ldr r3, [r0], #4
       str r3, [r1], #4
   copy_check:
       cmp r1, r2
       bcc copy_data
       ldr r2, =_sbss
       ldr r4, =_ebss
       movs r3, #0
       b   zero_check
   zero_bss:
       str r3, [r2], #4
   zero_check:
       cmp r2, r4
       bcc zero_bss
       bl  SystemInit
       bl  main
       b   .
   ```

3. Define the linker symbols the startup code names. `_estack` is the top of RAM, `_sidata` is the load address of `.data`, and `_sdata`, `_edata`, `_sbss`, `_ebss` bracket the sections. Done when: each symbol appears in the linker script and `.data` carries `AT> FLASH` so its load and run addresses differ.

   ```ld
   _estack = ORIGIN(RAM) + LENGTH(RAM);
   _sidata = LOADADDR(.data);
   ```

4. Relocate the vector table when the image does not sit at the default boot address. Write `SCB->VTOR`, then `__DSB()` and `__ISB()`. The table base must be aligned to its own size rounded up to a power of two, with a minimum of 128 bytes on ARMv7-M; the mask below is the ARMv7-M `TBLOFF` field and a table with many vectors needs coarser alignment. Done when: `VTOR` holds the address of this image's `g_pfnVectors` and an interrupt reaches this image's handler.

   ```c
   void relocate_vector_table(uint32_t base)
   {
       SCB->VTOR = base & 0xFFFFFF80U;   /* ARMv7-M TBLOFF field; align to table size */
       __DSB();
       __ISB();
   }
   ```

5. Write the RISC-V entry when the target is RISC-V. Set `sp`, zero `.bss` with `sw` on RV32 or `sd` on RV64, set `mtvec` to the trap handler, and call `main`. Done when: the entry assembles for the target XLEN and `mtvec` points at a valid handler before interrupts are enabled.

   ```asm
   .section .text.entry
   .global _start
   _start:
       la sp, _stack_top
       la t0, _bss_start
       la t1, _bss_end
   clear_bss:
       beq t0, t1, bss_done
       sw zero, 0(t0)      /* sd on RV64 */
       addi t0, t0, 4      /* 8 on RV64 */
       j clear_bss
   bss_done:
       la t0, trap_handler
       csrw mtvec, t0
       call main
       j .
   ```

6. Assign the remaining crt0 duties and confirm who owns each. Done when: every row below has an owner in the project.

   | Task | Owner |
   |---|---|
   | Copy `.data` from flash to RAM | `Reset_Handler` |
   | Zero `.bss` | `Reset_Handler` |
   | Initial stack | Vector 0 on Cortex-M; explicit `sp` load on RISC-V |
   | Heap (`_sbrk`) | Optional; newlib syscall or a custom allocator |
   | C++ static constructors | `__libc_init_array()` from newlib, called before `main` |
   | FPU enable on Cortex-M4F and M7 | `SystemInit`, by writing `SCB->CPACR` to grant CP10 and CP11 full access before any float instruction |

7. Keep `main` from returning. The `b .` after `bl main` catches a return; the body of `main` normally ends in a loop or `__WFI()`. Done when: a return from `main` lands in a known loop and not in the next bytes of flash.
8. Verify on the target: halt at `Reset_Handler` with the debugger, step the copy and zero loops, and inspect a known initialized global and a known zero global at the first line of `main`. Done when: both globals hold their expected values.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| HardFault on the first instruction | Vector 0 does not point into RAM | Set `_estack` to `ORIGIN(RAM) + LENGTH(RAM)`. |
| Initialized globals read as garbage | `.data` never copied | Add the copy loop and define `_sidata` with `LOADADDR(.data)`. |
| Zero-initialized globals are non-zero | `.bss` never zeroed | Add the zero loop over `_sbss` to `_ebss`. |
| Interrupts run the wrong handler or fault | `VTOR` points at another image's table | Write `SCB->VTOR` to this image's table and issue `__DSB(); __ISB();`. |
| Crash on the first float instruction | FPU not enabled on M4F or M7 | Set CP10 and CP11 in `SCB->CPACR` in `SystemInit`. |
| C++ constructor crashes before `main` | Constructors ran before clocks or peripherals were ready | Call `SystemInit` before `__libc_init_array`. |
| Execution falls off the end of `main` | No loop after `main` | Loop or `__WFI()` in `main`; keep `b .` after the call. |

## Output

Startup code for the target core (vector table, `Reset_Handler` or `_start`, `.data` and `.bss` loops), the list of linker symbols it requires with their defining lines, the `VTOR` relocation routine when the image is offset, and a debugger checklist for confirming globals at the first line of `main`.
