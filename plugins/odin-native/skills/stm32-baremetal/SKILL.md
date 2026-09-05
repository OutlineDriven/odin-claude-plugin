---
name: stm32-baremetal
description: 'Use when scaffolding STM32 firmware without HAL, CMSIS-only clock/RCC config, STM32F4/H7 bring-up, or building with arm-none-eabi-gcc for Cortex-M. Not for the startup file: use baremetal-startup.'
---

# STM32 bare metal with CMSIS only

## Contract

| Field | Bound contract |
|---|---|
| Trigger | STM32 firmware is started without the Cube HAL, vendor examples are ported to register-level code, a clock or flash-placement problem is being debugged, or a reproducible `arm-none-eabi-gcc` build layout is needed. |
| Authority | Reversible local: writes only the new project files under the directory the user names (startup file, system file, linker script, `main.c`, `Makefile`); rollback is deleting that directory or reverting it in version control. No remote mutation. |
| Side effect | New source, linker, and build files in the project directory. No existing file outside it is modified. |
| Done | The project builds with `arm-none-eabi-gcc`, `SystemInit` brings the system clock to the target frequency with bus prescalers and flash wait states inside the reference manual limits, a peripheral clock enable follows the read-back rule, and the flash and RAM map matches the part. |

## Inputs

- Exact part (for example STM32F407VG) and its reference manual and datasheet.
- Oscillator: HSE crystal frequency, or HSI only.
- Target system clock and supply voltage range (they set the flash wait states).
- Project directory to create files in.
- Whether a bootloader will launch the application at an offset.

## Procedure

1. Lay out the project. CMSIS-Core (`core_cm4.h`) and the device header come from the ST CMSIS device pack or its open-source mirror; the startup file follows `baremetal-startup`. Done when: the six files exist and the device header matches the exact part.

   ```
   stm32-bare/
     startup_stm32f407xx.s   vector table and Reset_Handler
     system_stm32f4xx.c      SystemInit(), SystemCoreClockUpdate()
     stm32f407xx.h           CMSIS device header
     core_cm4.h              CMSIS-Core
     linker.ld               FLASH and RAM regions, section placement
     main.c
     Makefile
   ```

2. Configure the clock tree in `SystemInit` inside the reference manual limits. For STM32F407 at 168 MHz from an 8 MHz HSE: PLLM = 8, PLLN = 336, PLLP = 2 (`00`), PLLQ = 7 (48 MHz for USB). APB1 is limited to 42 MHz and APB2 to 84 MHz, so AHB runs undivided, APB1 uses `/4`, and APB2 uses `/2`. Set the voltage scale in `PWR->CR` before turning the PLL on, and set flash wait states before switching `SW`. Done when: `SystemCoreClockUpdate` reports 168 MHz and both APB clocks are at or below their limits.

   ```c
   void SystemInit(void)
   {
       RCC->CR |= RCC_CR_HSEON;
       while (!(RCC->CR & RCC_CR_HSERDY)) { }

       RCC->APB1ENR |= RCC_APB1ENR_PWREN;
       PWR->CR |= PWR_CR_VOS;                     /* scale 1 for 168 MHz on F407 */

       RCC->PLLCFGR = RCC_PLLCFGR_PLLSRC_HSE
                    | (8U << RCC_PLLCFGR_PLLM_Pos)
                    | (336U << RCC_PLLCFGR_PLLN_Pos)
                    | (0U << RCC_PLLCFGR_PLLP_Pos)   /* /2 */
                    | (7U << RCC_PLLCFGR_PLLQ_Pos);
       RCC->CFGR |= RCC_CFGR_HPRE_DIV1 | RCC_CFGR_PPRE1_DIV4 | RCC_CFGR_PPRE2_DIV2;
       RCC->CR   |= RCC_CR_PLLON;
       while (!(RCC->CR & RCC_CR_PLLRDY)) { }

       FLASH->ACR = FLASH_ACR_ICEN | FLASH_ACR_DCEN | FLASH_ACR_PRFTEN | FLASH_ACR_LATENCY_5WS;
       RCC->CFGR |= RCC_CFGR_SW_PLL;
       while ((RCC->CFGR & RCC_CFGR_SWS) != RCC_CFGR_SWS_PLL) { }

       SystemCoreClockUpdate();
   }
   ```

   Wait states come from the reference manual table of HCLK against supply voltage: 5 wait states covers 150 to 168 MHz at 2.7 to 3.6 V on STM32F4. Other parts and voltages have their own rows.

3. Enable a peripheral clock and read the enable register back before the first access. The STM32F4 errata sheet documents a delay after enabling a peripheral clock; the read-back provides it. Done when: every clock enable in the project is followed by the read-back.

   ```c
   static inline void gpioa_clock_enable(void)
   {
       RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;
       (void)RCC->AHB1ENR;    /* errata: delay after RCC peripheral clock enable */
   }
   ```

4. Write the build flags. Cortex-M4F takes `-mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard`; section flags plus `--gc-sections` drop unused code; `nano.specs` selects newlib-nano and `nosys.specs` supplies stub syscalls. Done when: `make` produces an ELF, and `arm-none-eabi-size` shows text and data within the flash and RAM sizes.

   ```makefile
   MCU     = -mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard
   CFLAGS  = $(MCU) -std=c23 -Wall -Wextra -ffunction-sections -fdata-sections -g3 -O2
   LDFLAGS = $(MCU) -T linker.ld -Wl,--gc-sections --specs=nano.specs --specs=nosys.specs
   ```

5. Write the memory map from the datasheet. Done when: `MEMORY` in `linker.ld` lists the regions below with the sizes for the exact part.

   | Region | Address | Notes |
   |---|---|---|
   | Flash | `0x08000000` | Vector table at the start; the boot alias at `0x00000000` maps here |
   | SRAM1 | `0x20000000` | Stack, heap, `.data`, `.bss`, DMA buffers |
   | CCM | `0x10000000` | STM32F405, F407, F427, F429 only: 64 KB core-coupled, not reachable by DMA |

   An application launched by a bootloader links its flash origin at the application base (for example `0x08010000`) and writes `SCB->VTOR` to that base in its startup; see `bootloaders-embedded`.

6. Choose where to test. QEMU's STM32 machines model STM32F100, F205, F405, and L475 parts and implement USART, SPI, ADC, EXTI, SYSCFG, timers, and RCC reset and enable only; GPIO, DMA, I2C, PWR, RTC, flash interface, and USB are missing (QEMU system documentation, STM32 boards page). Use QEMU for CPU-side and USART logic; validate clocks, GPIO, DMA, and I2C on hardware. Done when: each feature under test is assigned to QEMU or to hardware according to that list.
7. Build, flash, and confirm: measure the system clock through `MCO` on a pin or infer it from a UART baud, and read a known register back. Done when: the measured clock matches the configured one and the UART prints at the configured baud.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Hang in `SystemInit` | HSE crystal absent, or PLL factors out of range | Bring up on HSI first; check the crystal and the PLL factor ranges in the manual. |
| Peripheral dead | Clock gate off, or no read-back after enable | Set the enable bit and read the register back. |
| HardFault at boot | Stack outside RAM, or `VTOR` wrong for an offset image | Check `_estack` and the application `VTOR` write. |
| Wrong UART baud | `SystemCoreClock` stale after the PLL switch | Call `SystemCoreClockUpdate()` at the end of `SystemInit`. |
| DMA from a CCM buffer fails | CCM is not on the DMA bus path | Place DMA buffers in SRAM1. |
| Peripheral misbehaves at speed | APB clock above its limit | Use `PPRE1_DIV4` and `PPRE2_DIV2` at 168 MHz. |

## Output

A buildable CMSIS-only project in the named directory: startup file, `SystemInit` with the clock tree inside the manual's limits, linker script with the part's memory map, `main.c`, and `Makefile`, plus a note on which features to validate under QEMU and which on hardware.
