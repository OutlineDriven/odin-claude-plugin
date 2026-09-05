---
name: mmio-and-bit-manipulation
description: 'Use when accessing memory-mapped peripherals with volatile, bit masks, read-modify-write, register alignment, or endianness in bare-metal firmware. Not for pin setup: use gpio-baremetal.'
---

# MMIO and bit manipulation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A peripheral register must be read or written without a HAL, a register shows stale reads or lost updates, C bitfields are being replaced with masks, or an ISR and the main loop touch the same register. |
| Authority | Read-only: emits access patterns, macros, and diagnostics to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | Every register access in the guidance is `volatile` with the width the reference manual states, every field write uses named shift and mask constants, shared registers use a race-free update, and barriers appear only where the ordering they enforce is named. |

## Inputs

- Target core and part (Cortex-M0+, M3, M4, M7, or another), and the peripheral.
- The register: base address, offset, width, and access type per bit from the reference manual.
- Whether an interrupt or another core can access the same register.
- Whether a data cache or a write buffer sits between the core and the peripheral.

## Procedure

1. Declare every register through a `volatile`-qualified pointer of the width the manual gives. Without `volatile` the compiler may merge, reorder, or delete accesses, because it treats the address as ordinary memory. Done when: no MMIO access goes through a plain pointer.

   ```c
   #include <stdint.h>

   #define REG32(addr) (*(volatile uint32_t *)(addr))
   #define REG16(addr) (*(volatile uint16_t *)(addr))
   #define REG8(addr)  (*(volatile uint8_t *)(addr))

   #define GPIOA_BASE  0x40020000U
   #define GPIOA_MODER REG32(GPIOA_BASE + 0x00U)
   ```

   | Qualifier | Effect |
   |---|---|
   | `volatile` | Every access is a real load or store, in program order relative to other volatile accesses |
   | `const volatile` | Read-only hardware register |
   | Plain pointer | Wrong for hardware; the compiler may drop or cache the access |

2. Replace magic numbers and C bitfields with named shift and mask constants taken from the reference manual bit table. Bitfield layout is implementation-defined and the compiler may access it with a different width than the register allows. Done when: every field write reads as `(reg & ~MASK) | VAL(n)` with names from the manual.

   ```c
   #define GPIO_MODER_MODE0_SHIFT  0U
   #define GPIO_MODER_MODE0_MASK   (3U << GPIO_MODER_MODE0_SHIFT)
   #define GPIO_MODER_MODE0_VAL(n) ((uint32_t)(n) << GPIO_MODER_MODE0_SHIFT)

   GPIOA_MODER = (GPIOA_MODER & ~GPIO_MODER_MODE0_MASK) | GPIO_MODER_MODE0_VAL(1U);
   ```

3. Make shared-register updates race-free. A read-modify-write that an ISR can interrupt loses one of the two updates. Prefer a hardware set/clear register when one exists (`BSRR` on STM32 GPIO writes one pin without reading the port). Otherwise wrap the update in a critical section that restores the previous mask. Bit-band aliases, which turn a word write into a single-bit write, exist only on Cortex-M3 and M4 and only for the regions the vendor maps; do not rely on them on M0+, M7, or M33. Done when: the update is safe for the sharing the design has.

   ```c
   /* hardware set/clear: no read, no race */
   GPIOA_BSRR = (1U << 5);           /* set PA5 */
   GPIOA_BSRR = (1U << (5 + 16));    /* reset PA5 */

   /* critical section for registers without a set/clear alias */
   uint32_t primask = __get_PRIMASK();
   __disable_irq();
   *reg = (*reg & ~mask) | (value << shift);
   __set_PRIMASK(primask);
   ```

4. Match the access width and alignment to the register. Use `REG8` for byte registers, `REG16` for half-word, `REG32` for word, at the address the map gives for that lane. Peripheral space is Device memory on Cortex-M, and unaligned accesses to it fault; ARMv6-M cores (M0, M0+) fault on every unaligned access. Some peripherals also behave differently under a byte access than a word access (a data register may transmit one byte or two), so the width is part of the protocol, not a convenience. Done when: each access uses the width the manual lists for that register and an aligned address.
5. Insert a barrier only where an ordering must be enforced. After changing a control register the CPU must observe before its next instruction (for example `SCB->VTOR`, `SCB->SCR`, MPU regions), issue `__DSB()` then `__ISB()`. Between writing a buffer or descriptor in memory and setting the enable bit that lets a DMA engine read it, issue `__DMB()` (or `__DSB()` when the data must also have left the write buffer). The CMSIS intrinsics come from `core_cm*.h`. Done when: every barrier has a comment naming the two accesses it orders, and there are no others.

   ```c
   SCB->VTOR = table;
   __DSB();
   __ISB();

   descriptor_ready = 1;
   __DSB();                          /* descriptor visible before the enable write */
   DMA_CR |= DMA_EN;
   ```

6. Confirm on hardware or a faithful simulator: read the register back after the write, watch the peripheral behavior, and exercise the shared case under interrupt load. Done when: the observed value and behavior match the manual.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Write has no effect | Peripheral clock off, wrong address, or wrong width | Enable the clock first; confirm offset and width in the register table. |
| Random bit changes | Read-modify-write raced with an ISR | Use a set/clear register or a critical section. |
| HardFault on access | Unaligned or wrong-width access to Device memory | Use the listed width at an aligned address. |
| Value stale or access vanished | Missing `volatile` | Route the access through a `volatile` pointer. |
| Field lands in the wrong bits | C bitfield laid out differently from the hardware | Replace the bitfield with shift and mask constants. |
| Peripheral starts before its setup is visible | Missing barrier between memory write and enable | Add `__DSB()` before the enable write. |

## Output

A register access pattern for the target: `volatile` declarations at the manual's width, named shift and mask constants, a race-free update for shared registers, and the barriers the ordering needs with each one's purpose stated.
