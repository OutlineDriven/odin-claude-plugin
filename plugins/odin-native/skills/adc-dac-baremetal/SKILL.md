---
name: adc-dac-baremetal
description: 'Use when configuring ADC sampling time, DMA-driven ADC, calibration, or DAC channel setup on bare-metal MCUs. Not for the DMA stream itself: use dma-baremetal.'
---

# ADC and DAC on bare metal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task is to sample an analog input, run the ADC continuously into a DMA buffer, calibrate the ADC after reset, or drive a DAC channel on an MCU without a vendor HAL. |
| Authority | Read-only: emits register sequences, formulas, and diagnostics to chat; the user pastes them into their firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The guidance names the clock enable, pin mode, sampling time, calibration step, trigger, and readout for the target family, and every register bit is cited to the reference manual chapter it comes from. |

## Inputs

- Target MCU family and part number (STM32F1, STM32F4, STM32G4, STM32L4, or another family with a reference manual at hand).
- The analog pin and ADC channel, from the datasheet pin table.
- Sample rate and source impedance of the signal.
- Whether readout is polled, interrupt-driven, or DMA circular.
- The ADC clock frequency after prescaling, from the clock tree.

## Procedure

1. Enable the ADC and GPIO clocks and put the pin in analog mode. The ADC reads nothing from a pin still in digital input mode. Done when: the RCC enable bit for the ADC bus and the GPIO port are set and `MODER` for the pin reads analog (`11`).
2. Power the ADC on and wait the stabilization time the datasheet gives as `tSTAB`. On STM32F4 this is `ADC_CR2_ADON` followed by a short wait; the wait is a datasheet number, not a magic loop count. Done when: `ADON` is set and the wait matches the datasheet value for the ADC clock in use.

   ```c
   RCC->APB2ENR |= RCC_APB2ENR_ADC1EN;
   ADC1->CR2 |= ADC_CR2_ADON;
   delay_us(ADC_TSTAB_US);   /* tSTAB from the datasheet, not a guessed loop */
   ```

3. Calibrate where the family requires it. STM32F1 exposes `ADC_CR2_RSTCAL` then `ADC_CR2_CAL` in `CR2` and the firmware polls each bit until hardware clears it. STM32L4 and STM32G4 expose `ADCAL` in `ADC_CR` with the ADC disabled. STM32F4 has no software calibration step; the part is factory calibrated. Done when: the family's calibration sequence has run, or the reference manual confirms the family has none.
4. Set the sampling time from the datasheet graph of sampling time against source impedance. On STM32F4 `SMPR2` field `SMP0` value `100` (`ADC_SMPR2_SMP0_2`) selects 84 ADC clock cycles for channel 0; the other encodings are 3, 15, 28, 56, 112, 144, and 480 cycles. A high-impedance source needs the longer settings. Done when: the chosen sampling time covers the source impedance at the ADC clock in use.
5. Select the channel sequence and start one conversion, then poll end-of-conversion and read the data register. Done when: a polled single conversion returns a plausible value for a known input (mid-rail or ground).

   ```c
   ADC1->SMPR2 |= ADC_SMPR2_SMP0_2;   /* 84 cycles on channel 0 */
   ADC1->SQR3   = 0;                  /* one conversion, channel 0 */
   ADC1->CR2   |= ADC_CR2_SWSTART;
   while (!(ADC1->SR & ADC_SR_EOC)) { }
   uint16_t sample = (uint16_t)ADC1->DR;
   ```

6. For continuous sampling, enable continuous mode and the ADC DMA request, then configure the DMA stream in circular mode with a half-word data size into a `uint16_t` buffer. On STM32F4, ADC1 maps to DMA2 Stream 0 or Stream 4, channel 0; confirm the request matrix in the DMA chapter. Process the first half of the buffer on the half-transfer interrupt and the second half on the transfer-complete interrupt. The stream configuration itself belongs to `dma-baremetal`. Done when: the buffer fills continuously and the two interrupts alternate.

   ```c
   ADC1->CR2 |= ADC_CR2_DMA | ADC_CR2_CONT;
   /* stream configured per dma-baremetal, then: */
   DMA2_Stream0->CR |= DMA_SxCR_EN;
   ADC1->CR2 |= ADC_CR2_SWSTART;
   ```

7. For a timer-paced sample rate, select the timer TRGO as the external trigger in `CR2` (`EXTSEL`, `EXTEN`) instead of continuous mode, so the sample period comes from the timer and not from conversion time. Timer setup belongs to `timers-pwm-baremetal`. Done when: the sample rate equals the timer update rate.
8. For DAC output, enable the DAC clock, set the output pin to analog mode, enable the channel, and write the data holding register. On STM32F4 the DAC sits on APB1 and channel 1 drives PA4; `DHR12R1` takes a right-aligned 12-bit value, so 2048 is mid-scale against `VREF+`. Done when: a meter on the pin reads half of `VREF+` for the value 2048.

   ```c
   RCC->APB1ENR |= RCC_APB1ENR_DACEN;
   DAC->CR      |= DAC_CR_EN1;
   DAC->DHR12R1  = 2048;
   ```

9. Convert counts to volts with the measured reference, not the nominal one: `V = counts * VREF / 4096` for a 12-bit result. Many families provide an internal reference channel (`VREFINT`) with a factory value stored in system memory; use it to compute the actual `VDDA`. Done when: a known input converts to within the datasheet accuracy.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Noisy readings | Sampling time too short for the source impedance | Increase the `SMP` field; check the datasheet impedance graph. |
| `EOC` never sets | ADC clock not enabled or `ADON` not set | Set the RCC enable bit, then `ADON`, then wait `tSTAB`. |
| Reading is offset or scaled wrong | `VDDA` is not the assumed value | Measure `VDDA` or compute it from `VREFINT`. |
| DMA buffer holds interleaved garbage | Data size mismatch or unaligned buffer | Use a `uint16_t` buffer with half-word DMA size on both sides. |
| DAC pin stays at 0 V or rails | Pin not in analog mode, or channel not enabled | Set `MODER` to analog and `EN1` in `DAC_CR`. |

## Output

A register-level sequence for the target family covering clock enable, pin mode, calibration, sampling time, channel sequence, trigger or DMA setup, readout, and the counts-to-volts conversion, with each bit named after its reference manual definition.
