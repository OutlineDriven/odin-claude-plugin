---
name: low-power-embedded
description: 'Use when configuring MCU sleep/stop/standby, WFI, STM32 PWR, nRF sleep, clock gating, wake-up EXTI sources, or measuring current draw. Not for the wake ISR: use interrupts-and-exceptions-baremetal.'
---

# Low-power embedded

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Battery firmware misses its power budget, a device will not wake or wakes at once, sleep current stays in the milliamp range, or a main loop or RTOS idle hook must sleep between events. |
| Authority | Read-only: emits mode selection, entry and exit sequences, gating checklists, and measurement steps to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The chosen mode is justified against wake latency and state retention, the entry sequence sets the mode bits the reference manual names, the wake source is configured, the clock tree restore after wake is stated, and current is measured with the measurement conditions recorded. |

## Inputs

- Target part and its power chapter (STM32 `PWR`, nRF `POWER`, or equivalent).
- Wake sources needed: pin edge, RTC alarm or wake-up timer, UART start bit, other.
- Allowed wake latency and whether RAM contents must survive.
- Current budget and the meter available (range and burden voltage).
- Whether an RTOS runs and owns the idle path.

## Procedure

1. Pick the mode from the retention and wake-latency needs. Done when: the row chosen is the lowest-power row that keeps the state the design needs and wakes within the latency budget.

   | Mode (STM32 naming) | CPU | Peripherals | SRAM | Wake source | Current |
   |---|---|---|---|---|---|
   | Run | on | on | kept | none needed | highest |
   | Sleep | halted | on | kept | any enabled interrupt | medium |
   | Stop | halted | most clocks off | kept | EXTI, RTC, some UARTs | low |
   | Standby | off | off | lost except backup domain | wake-up pins, RTC | lowest |

2. Enter Sleep with `__WFI()` after arming the wake source. Clear every pending interrupt first, because a pending interrupt makes `WFI` return at once. `__WFE()` wakes on events as well as interrupts. Done when: `WFI` returns only when the intended source fires.

   ```c
   __disable_irq();
   /* arm the wake source: EXTI line, RTC alarm, ... */
   __enable_irq();
   __WFI();
   ```

3. Enter Stop on STM32F4 by clearing `PDDS` (deep sleep selects Stop, not Standby), optionally setting `LPDS` for the low-power regulator, clearing the wake-up flag, setting `SLEEPDEEP`, and executing `WFI`. Setting `PDDS` selects Standby and loses SRAM. After wake the core runs from HSI; re-run the clock configuration that enabled HSE and the PLL, then re-init peripherals whose clocks were stopped. Done when: the device wakes into Stop-exit code with SRAM intact and the system clock restored.

   ```c
   #include "stm32f4xx.h"

   void enter_stop_mode(void)
   {
       PWR->CR  |= PWR_CR_CWUF;                /* clear the wake-up flag */
       PWR->CR  &= ~PWR_CR_PDDS;               /* deep sleep = Stop */
       PWR->CR  |= PWR_CR_LPDS;                /* regulator in low-power mode during Stop */
       SCB->SCR |= SCB_SCR_SLEEPDEEP_Msk;
       __WFI();
       SCB->SCR &= ~SCB_SCR_SLEEPDEEP_Msk;
       clock_config();                         /* the routine that turns HSE and PLL back on */
   }
   ```

4. Gate what stays on. Before sleeping: disable unused peripheral clocks in the RCC enable registers, stop ADC and DAC continuous modes, stop DMA streams, put UART and SPI in their idle or disabled state, and select the lowest regulator voltage scale the target clock allows (`PWR_CR_VOS` on STM32F4). Set unused pins to analog mode so no input buffer draws current. Done when: each item has been applied or recorded as needed for the wake path.
5. Configure the wake source for the mode. Done when: the source below is armed and its flag is clear.

   | Source | Configuration |
   |---|---|
   | Pin edge | EXTI line routed through `SYSCFG->EXTICR`, unmasked in `IMR`, edge in `RTSR` or `FTSR`, NVIC entry enabled |
   | RTC | Alarm or wake-up timer with its EXTI line and interrupt enabled |
   | UART | Start-bit or address-match wake from Stop on families whose USART lists it (STM32L4 for example); not available on every part |
   | Watchdog | Not a wake source; an expired IWDG resets the device |

6. Coordinate with the RTOS when one runs. FreeRTOS tickless idle (`configUSE_TICKLESS_IDLE`) calls a port hook that executes `WFI` or a Stop entry; put the mode logic in that hook and nowhere else, so two owners never fight over the sleep decision. Done when: exactly one code path enters a low-power mode.
7. Measure, do not estimate. Put the meter in series with the MCU supply, disconnect the debugger (the debug port and `DBGMCU` low-power debug bits keep clocks alive), and record run current and sleep current with the same clock tree and firmware build. Use the DWT cycle counter to time the wake path. Done when: the two current figures and the wake latency are written down with meter range, supply voltage, and debugger state.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Milliamps in "sleep" | Debugger attached, or `DBGMCU` keeps clocks in Stop | Disconnect the probe; clear the `DBG_SLEEP`, `DBG_STOP`, `DBG_STANDBY` bits. |
| `WFI` returns at once | An interrupt was pending | Clear pending flags and `CWUF` before `WFI`. |
| RAM lost after wake | Entered Standby because `PDDS` was set | Clear `PDDS` for Stop. |
| UART dead after wake | Clock tree left on HSI | Re-run the HSE and PLL configuration after `WFI`. |
| Current above the datasheet figure | Floating inputs or a peripheral left clocked | Set unused pins to analog; audit the RCC enable registers. |

## Output

A mode selection with its justification, the entry and exit sequence with the reference-manual bit names, the gating checklist, the wake-source configuration, the RTOS ownership rule when an RTOS runs, and the measured run and sleep currents with their conditions.
