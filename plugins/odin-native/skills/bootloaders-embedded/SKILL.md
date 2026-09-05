---
name: bootloaders-embedded
description: 'Use when writing a custom bootloader, jumping to application code, relocating VTOR, or implementing DFU/USB firmware update on Cortex-M. Not for reset-to-main: use baremetal-startup.'
---

# Embedded bootloaders

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An application must run at a non-zero flash offset, a bootloader must validate and jump to it, a firmware update path (UART, USB DFU, custom protocol) is being written, or an application works when flashed alone but fails when launched by the bootloader. |
| Authority | Read-only: emits the flash layout, validation checks, handoff sequence, and update-safety rules to chat; the user places them in the project. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The flash partition table, the application validity check, the ordered handoff sequence, and the update commit rule are stated for the target part, and the application-side `VTOR` and linker changes are named. |

## Inputs

- Target part and its flash map: base address, sector or page sizes, and whether it has two banks.
- Bootloader size budget and the chosen application base address.
- Update transport (UART, USB DFU, external flash, none).
- Where the update request flag lives (RTC backup register, GPIO strap, magic word in RAM).
- Whether the vendor part has a system-memory bootloader and which transports it lists in the vendor application note (AN2606 for STM32).

## Procedure

1. Fix the flash layout and relink both images to it. The bootloader starts at the flash base; the application starts at a sector boundary above it and its vector table sits at that base. Done when: the application linker script sets `FLASH ORIGIN` to the application base and the bootloader never writes below it.

   | Region | Address (STM32 example) | Content |
   |---|---|---|
   | Bootloader | `0x08000000` | Boot code and update logic, typically 16 KB to 64 KB |
   | Application | `0x08010000` | Application vector table then code |

2. Validate the application image before jumping. Vector 0 must point into RAM; vector 1 must point into the application's flash range and carry the Thumb bit (bit 0 set). Add a CRC or magic word in an application metadata section when the update path can leave a half-written image. Done when: the check rejects an erased sector (`0xFFFFFFFF` in both vectors) and accepts a good image.

   ```c
   #define APP_BASE 0x08010000U

   static int app_valid(uint32_t base)
   {
       uint32_t sp    = *(volatile uint32_t *)base;
       uint32_t reset = *(volatile uint32_t *)(base + 4U);
       if (sp < SRAM_BASE || sp > SRAM_END)   return 0;
       if ((reset & 1U) == 0U)                return 0;   /* Thumb bit */
       if (reset < base || reset > FLASH_END) return 0;
       return 1;
   }
   ```

3. Hand off to the application in this order: disable interrupts, stop SysTick, clear every NVIC enable and pending bit, de-initialize any peripheral the bootloader used (UART, USB, DMA), write `SCB->VTOR` to the application base, load the main stack pointer from vector 0, barrier, then branch to vector 1. Done when: the sequence runs with no interrupt enabled between the NVIC clear and the branch.

   ```c
   typedef void (*app_entry_t)(void);

   void jump_to_app(uint32_t app_base)
   {
       uint32_t sp    = *(volatile uint32_t *)app_base;
       uint32_t reset = *(volatile uint32_t *)(app_base + 4U);

       __disable_irq();
       SysTick->CTRL = 0;
       for (unsigned i = 0; i < 8; i++) {
           NVIC->ICER[i] = 0xFFFFFFFFU;
           NVIC->ICPR[i] = 0xFFFFFFFFU;
       }
       /* de-init bootloader peripherals here, or reset them through RCC */

       SCB->VTOR = app_base;
       __set_MSP(sp);
       __DSB();
       __ISB();
       ((app_entry_t)reset)();   /* never returns */
   }
   ```

4. Make the application own its vector table. Either the bootloader's `VTOR` write is trusted, or the application's `Reset_Handler` writes `SCB->VTOR = APP_BASE` itself before enabling any interrupt. Prefer the second: it also lets the application run when flashed alone. Done when: an interrupt raised in the application reaches the application's handler.
5. Lay out the bootloader main loop. Initialize the minimum clock and the update transport, read the update request flag, and take one of three paths: receive and program an image, jump to a valid application, or stay in the bootloader shell. Done when: every path terminates in a jump or in the shell, and none falls through.
6. Keep the update commit safe. Write the new image to a scratch region or the inactive bank, verify its CRC in place, then switch the active-image marker in one atomic write (metadata pointer or bank swap). Never erase the only valid image without a recovery path, and only service the watchdog after the verified commit. Done when: a power loss at any point leaves at least one valid, bootable image.
7. Distinguish the vendor system-memory bootloader from yours. STM32 parts enter the ROM bootloader when `BOOT0` selects system memory at reset; the transports it offers (USART, USB DFU, others) vary by part and are listed in AN2606. It is not your flash bootloader and does not replace it. Done when: the design states which bootloader handles which recovery case.
8. Verify: flash both images, power-cycle, confirm the jump, then erase the application sector and confirm the bootloader stays in its shell instead of faulting. Done when: both outcomes are observed on the target.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| HardFault right after the jump | Stack pointer invalid or Thumb bit clear in vector 1 | Run `app_valid` first; relink the application if the vectors are wrong. |
| Interrupts land in bootloader handlers | `VTOR` still points at the bootloader table | Write `SCB->VTOR` before enabling interrupts, in the application's `Reset_Handler`. |
| Application works standalone, fails via bootloader | Application still linked at the flash base | Set the application linker `FLASH ORIGIN` to the application base. |
| Serial garbage after the jump | Bootloader left its UART or DMA running | De-initialize or reset the peripherals before the branch. |
| Device bricked after an update | Power loss during erase of the only image | Use a scratch region or dual bank with an atomic active marker. |

## Output

For the target part: a flash partition table, the application validity check, the ordered handoff routine, the application-side `VTOR` and linker changes, the bootloader main-loop paths, and the update commit rule that keeps one bootable image at every instant.
