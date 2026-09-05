---
name: timers-pwm-baremetal
description: 'Use when configuring general-purpose timers for PWM, input capture, periodic ticks, timer prescaler, PWM duty cycle, or SysTick without an RTOS. Not for the timer pin mux: use gpio-baremetal.'
---

# Timers and PWM on bare metal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A PWM output, a pulse-width measurement, a millisecond tick, or a hardware trigger for ADC sampling is needed without an RTOS. |
| Authority | Read-only: emits timer register sequences, frequency arithmetic, and diagnostics to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The timer input clock is derived from the clock tree including the APB doubling rule, prescaler and period values are computed from it, the channel mode and output enable are set, and a measured frequency or duty on the pin matches the arithmetic. |

## Inputs

- Target part and the timer instance (which bus it sits on, its counter width, which channels exist).
- The APB prescaler for that bus, from the clock configuration.
- Desired PWM frequency and duty, or capture edge, or tick rate.
- The pin and alternate-function number for the channel output, from the datasheet table.

## Procedure

1. Derive the timer input clock. On STM32 a timer on APB1 or APB2 runs at the APB clock when the APB prescaler is 1, and at twice the APB clock otherwise (the reference manual's timer clock rule, subject to the `TIMPRE` bit on parts that have it). At 168 MHz with APB1 at `/4`, TIM2 runs at 84 MHz. Done when: the timer clock is written down with its derivation.
2. Compute prescaler and period. `f_out = f_timer / ((PSC + 1) * (ARR + 1))` and `duty = CCR / (ARR + 1)`. Choose `PSC` so `ARR` stays within the counter width (16 bits on most general-purpose timers; TIM2 and TIM5 are 32-bit on STM32F4) with enough resolution for the duty step. Done when: the two values reproduce the requested frequency exactly or the rounding error is stated.
3. Configure PWM: enable the timer clock, set `PSC` and `ARR`, set the compare value, select PWM mode 1 (`OC1M` = `110`) with preload, enable the channel output, enable auto-reload preload, generate an update event to load the shadow registers, and start the counter. Done when: the pin shows the computed frequency and duty.

   ```c
   RCC->APB1ENR |= RCC_APB1ENR_TIM2EN;

   TIM2->PSC   = 83;                              /* 84 MHz / 84 = 1 MHz */
   TIM2->ARR   = 999;                             /* 1 MHz / 1000 = 1 kHz */
   TIM2->CCR1  = 500;                             /* 50 % */
   TIM2->CCMR1 = (6U << TIM_CCMR1_OC1M_Pos)       /* PWM mode 1 */
               | TIM_CCMR1_OC1PE;
   TIM2->CCER  = TIM_CCER_CC1E;
   TIM2->CR1   = TIM_CR1_ARPE;
   TIM2->EGR   = TIM_EGR_UG;                      /* load PSC and ARR now */
   TIM2->CR1  |= TIM_CR1_CEN;
   ```

   The channel reaches a pin only through its alternate function: TIM2_CH1 is PA0 with AF1 on STM32F4, configured per `gpio-baremetal`.

4. Configure input capture to measure a pulse: set the channel as input mapped to its `TI` signal in `CCMR` (`CC1S` = `01`), choose the edge in `CCER`, enable the capture interrupt, and in the handler read `CCR` and difference it with the previous capture, accounting for counter wrap. For period plus duty in one pass, use two channels on the same input with opposite polarities or the timer's PWM input mode. Done when: a known pulse measures within one timer tick.
5. Provide a tick without an RTOS using SysTick: `SysTick_Config(SystemCoreClock / hz)` sets the reload, enables the interrupt, and starts the counter; the handler increments a `volatile` counter. Exactly one owner configures SysTick; an RTOS takes it over if one is added later. Done when: the counter advances at the requested rate against a reference clock.

   ```c
   volatile uint32_t tick_ms;

   void SysTick_Handler(void) { tick_ms++; }

   void systick_init(uint32_t hz)
   {
       SysTick_Config(SystemCoreClock / hz);   /* SystemCoreClock must be current */
   }
   ```

6. Use a timer as a hardware trigger for sampling: select the update event as `TRGO` in `CR2` (`MMS` = `010`) and point the ADC's external trigger at it, as `adc-dac-baremetal` describes. Done when: the sample rate equals the timer update rate.
7. Verify on the pin with a scope or logic analyzer: frequency and duty for PWM, captured width against a generated pulse, tick rate against a reference. Done when: the measurement matches the arithmetic from step 2.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Frequency off by 2 | APB timer clock doubling not applied | Re-derive the timer clock with the prescaler rule. |
| No output on the pin | Channel output not enabled, or pin not in AF mode | Set `CCxE` in `CCER`; configure the pin's alternate function. |
| Duty changes take effect late or glitch | Preload disabled, or `ARR` changed without preload | Set `OCxPE` and `ARPE`; change values through the shadow registers. |
| First period wrong | `PSC` not loaded until the first update | Write `EGR.UG` after setting `PSC` and `ARR`. |
| Tick drifts or stops | Two owners of SysTick, or stale `SystemCoreClock` | One owner; call `SystemCoreClockUpdate()` before `SysTick_Config`. |
| Capture value jumps | Counter wrapped between captures | Difference captures modulo the counter width. |

## Output

For the target timer: the derived timer clock, `PSC` and `ARR` with their arithmetic, the channel configuration for PWM or capture, the SysTick tick when requested, and the pin measurement that confirms them.
