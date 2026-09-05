---
name: resource-optimization-lowend
description: 'Use when reducing flash or RAM usage on constrained MCUs, analyzing stack depth, reading linker map files, or tuning -Os size-versus-speed tradeoffs on bare-metal and small RTOS images.'
---

# Resource optimization for low-end systems

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Firmware exceeds its flash or RAM budget, a stack overflows in production, a linker map needs reading, or `-Os` versus `-O2` needs deciding per file. |
| Authority | Read-only. Emits analysis and commands for the operator to run; no file writes, no rollback needed. No remote mutation. |
| Side effect | Measurement commands and a size verdict in chat. Nothing is written. |
| Done | The largest flash or RAM consumers are named from the map file, and each has a stated reduction tactic. |

## Inputs

1. Firmware ELF and map file (required): the linked image plus the `-Wl,-Map=` output.
2. Budget (required): flash and RAM limits from the part's datasheet.
3. Toolchain (required): the cross `binutils` matching the target, for example `arm-none-eabi-*`.

## Procedure

1. Measure the image.

   ```bash
   arm-none-eabi-size -A firmware.elf
   arm-none-eabi-objdump -h firmware.elf
   nm --size-sort -S firmware.elf | tail -20
   ```

   Done when: section totals and the largest symbols are known.
2. Read the linker map. Generate it at link time and grep the sections.

   ```bash
   gcc ... -Wl,-Map=firmware.map
   grep -E '\.text|\.rodata|\.data|\.bss' firmware.map | head
   ```

   Look for the largest symbols and for library code pulled in unexpectedly, such as full `printf`. Done when: the top consumers are named with their sizes.
3. Apply the size flags.

   | Flag | Effect |
   |---|---|
   | `-Os` | Optimize for size |
   | `-ffunction-sections -fdata-sections` | One section per symbol |
   | `-Wl,--gc-sections` | Drop unreferenced sections |
   | `-flto` | Cross-TU dead code elimination |
   | `-specs=nano.specs` | Smaller newlib on ARM GCC |
   | `-Wl,--print-memory-usage` | Print region usage at link time |

   ```makefile
   CFLAGS += -Os -ffunction-sections -fdata-sections
   LDFLAGS += -Wl,--gc-sections -Wl,--print-memory-usage
   ```

   `--gc-sections` can collect interrupt vectors and other unreferenced entry points; pin them with `KEEP()` in the linker script. Done when: the flags are on and the image still boots.
4. Measure the stack.

   ```bash
   # Static per-function usage, from -fstack-usage builds
   find . -name '*.su' -exec cat {} \;

   # Stack bound symbol from the linker script
   grep _estack firmware.map
   ```

   At runtime, fill the stack with a pattern such as `0xDEADBEEF`, run the worst-case path, and scan for the high-water mark. Under FreeRTOS use `uxTaskGetStackHighWaterMark`. Done when: worst-case stack depth is measured, not guessed.
5. Cut RAM by section.

   | Section | Tactic |
   |---|---|
   | `.bss` | Shrink buffers; use pool allocators |
   | `.data` | Move constants to flash with `const`, landing them in `.rodata` |
   | Heap | Avoid `malloc`; use fixed pools |
   | Stack | Reduce call depth; size ISR stacks separately |

   Done when: each RAM section has a named reduction.
6. Decide size versus speed per file.

   ```text
   Hot path in an ISR or a fast control loop?
   |-- yes -> -O2 for that file (#pragma GCC optimize or per-file flags)
   +-- no  -> -Os globally
   ```

   Done when: hot files carry `-O2` and the rest stay at `-Os`.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| `printf` is the largest pull-in | Full newlib implementation | Retarget `_write`; use a tiny printf |
| `--gc-sections` broke an IRQ | Vector or handler collected | `KEEP()` it in the linker script |
| Stack overflow appears late | Deep call plus IRQ nesting | Measure the high-water mark; raise the stack bound |
| RAM is free but the ELF is large | `.data` not loaded from flash | Check VMA versus LMA in the linker script |
| LTO link fails | Mixed compiler versions | Build every object with the same GCC |

## Output

A size report naming the top flash and RAM consumers from the map file, the flags applied, the measured stack bound, and the per-file optimization split.
