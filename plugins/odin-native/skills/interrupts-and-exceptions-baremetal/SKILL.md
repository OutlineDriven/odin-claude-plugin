---
name: interrupts-and-exceptions-baremetal
description: 'Use when writing Cortex-M NVIC ISRs, configuring priorities, handling HardFault, tail-chaining, or measuring interrupt latency. Not for the vector table itself: use baremetal-startup.'
---

# Interrupts and exceptions on bare metal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A peripheral interrupt must be enabled and prioritized, an ISR must share data with the main loop, a HardFault appears after interrupts are enabled, or interrupt latency must be measured or reduced on Cortex-M. |
| Authority | Read-only: emits NVIC configuration, ISR templates, fault-decoding code, and measurement steps to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The IRQ is enabled with an explicit priority, the ISR clears its flag the way the reference manual states, shared data crosses the boundary through a critical section or a lock-free buffer, and fault decoding names the stacked PC and the fault status registers for the core. |

## Inputs

- Target core (Cortex-M0+, M3, M4, M7, M33) and the vendor CMSIS device header.
- The interrupt: NVIC number (`*_IRQn`), the peripheral flag that raises it, and how that flag clears.
- Priority relationships with other interrupts and with the scheduler tick, if any.
- For faults: whether a debugger is attached and which registers are readable.

## Procedure

1. State the exception flow. The NVIC compares the pending priority with the current one and with `PRIMASK` and `BASEPRI`; on entry the hardware stacks `r0` to `r3`, `r12`, `lr`, `pc`, and `xPSR`; it branches through the vector table; on return it unstacks, or tail-chains directly into the next pending exception without unstacking. Done when: the flow is stated as an ordered list.
2. Set the priority, then enable the interrupt. Lower numeric value means higher urgency on every Cortex-M. The number of implemented priority bits is vendor-specific (STM32 implements 4), and `NVIC_SetPriorityGrouping` splits them into preempt and sub-priority fields. Done when: the priority is written with `NVIC_SetPriority` before `NVIC_EnableIRQ`, and the relation to other interrupts is recorded.

   ```c
   #include "stm32f4xx.h"

   void uart_irq_init(void)
   {
       uint32_t group = NVIC_GetPriorityGrouping();
       NVIC_SetPriority(USART2_IRQn, NVIC_EncodePriority(group, 2, 0));
       NVIC_EnableIRQ(USART2_IRQn);
   }
   ```

3. Write the ISR to do the minimum and clear the source. Read the status register once, handle each flag that is set, and clear each flag the way the manual states: some clear on a data-register read, some clear on writing 1, some on writing 0. Hand data to the main loop through a ring buffer or a flag. No blocking calls, no `printf`, no `malloc`, no waiting loops. Done when: every flag the ISR handles has its clearing action in the body, and the ISR calls nothing that can block.

   ```c
   void USART2_IRQHandler(void)
   {
       uint32_t sr = USART2->SR;
       if (sr & USART_SR_RXNE) {
           ringbuf_push((uint8_t)USART2->DR);   /* reading DR clears RXNE */
       }
       if (sr & USART_SR_ORE) {
           (void)USART2->DR;                    /* SR read then DR read clears ORE */
       }
   }
   ```

4. Protect shared data with a critical section that restores the previous mask, so nesting works. Where only some interrupts must be held off, raise `BASEPRI` instead of `PRIMASK` (not available on Cortex-M0 and M0+). Keep the window short; a long masked window is the usual cause of missed deadlines elsewhere. Done when: every access to data the ISR also touches is inside a section, or the data structure is single-producer single-consumer with atomic indices.

   ```c
   uint32_t primask = __get_PRIMASK();
   __disable_irq();
   /* shared update */
   __set_PRIMASK(primask);
   ```

5. Install a HardFault handler that captures the faulting frame. The handler must be `naked`, because a compiler prologue would overwrite the stacked registers before they are read. Bit 2 of `lr` selects the main or process stack; the stacked PC is at index 6 and xPSR at index 7. Done when: a deliberate fault (a read from an unmapped address) stops in `hard_fault_c` with the PC of the faulting instruction.

   ```c
   __attribute__((naked)) void HardFault_Handler(void)
   {
       __asm volatile(
           "tst lr, #4\n"
           "ite eq\n"
           "mrseq r0, msp\n"
           "mrsne r0, psp\n"
           "b hard_fault_c\n");
   }

   void hard_fault_c(uint32_t *frame)
   {
       volatile uint32_t pc  = frame[6];
       volatile uint32_t psr = frame[7];
       volatile uint32_t cfsr = SCB->CFSR;   /* ARMv7-M and later; absent on M0/M0+ */
       volatile uint32_t hfsr = SCB->HFSR;
       volatile uint32_t bfar = SCB->BFAR;   /* valid only when CFSR.BFARVALID is set */
       (void)pc; (void)psr; (void)cfsr; (void)hfsr; (void)bfar;
       for (;;) { }
   }
   ```

   Decode `CFSR` by its three bytes: memory management, bus fault, and usage fault. `HFSR.FORCED` means a lower-priority fault escalated. On Cortex-M0 and M0+ these registers do not exist; only the stacked PC is available.

6. Reduce latency where it matters. Done when: each row that applies has been acted on.

   | Factor | Effect | Action |
   |---|---|---|
   | Long ISR | Delays every lower and equal priority interrupt | Move work to the main loop through a buffer |
   | Long critical section | Delays every interrupt | Shorten the masked window; use `BASEPRI` |
   | Lazy FPU stacking (M4F, M7) | Extra stacking cycles when the ISR uses float | Keep float out of ISRs or accept the cost |
   | Priority order | A slow high-priority ISR starves the rest | Give the tightest deadline the highest priority |
   | Tail-chaining | Back-to-back exceptions skip unstack and restack | Free; no action, but do not rely on a gap between them |

7. Measure latency instead of estimating it. Toggle a GPIO at the top of the ISR and compare with the trigger on a scope, or read the DWT cycle counter. `DWT->CYCCNT` exists on ARMv7-M cores and needs `CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk` and `DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk` first. Done when: a latency number with its measurement method is recorded.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Interrupt never fires | NVIC entry not enabled, `PRIMASK` set, or peripheral interrupt enable bit clear | `NVIC_EnableIRQ`; check `PRIMASK`; set the peripheral's interrupt enable. |
| ISR re-enters at once | Flag not cleared, or cleared the wrong way | Follow the manual's clearing action for that flag. |
| HardFault inside an ISR | Stack overflow, or an unaligned or unmapped access | Grow the stack; decode `CFSR` and `BFAR`. |
| Bytes lost under load | ISR too slow or too low in priority | Buffer in the ISR, raise its priority, shorten other ISRs. |
| Deadline missed elsewhere | Long critical section | Shrink the masked window or switch to `BASEPRI`. |

## Output

For the target interrupt: the priority and enable sequence, an ISR body with the correct flag clearing and a hand-off buffer, a critical-section pattern, a HardFault handler with the frame and fault-register decode available on the core, and a latency measurement method.
