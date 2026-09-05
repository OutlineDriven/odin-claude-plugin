---
name: gpio-baremetal
description: 'Use when configuring GPIO modes, alternate functions, pull resistors, or EXTI interrupts on STM32/nRF/ESP32-class MCUs. Not for register access rules: use mmio-and-bit-manipulation.'
---

# GPIO on bare metal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A pin must be driven, read, muxed to a peripheral, or made to raise an interrupt on an edge, without a vendor HAL. |
| Authority | Read-only: emits pin configuration sequences and interrupt setup to chat; the user places them in the firmware. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The sequence enables the port clock, sets mode, pull, speed, and alternate function from the datasheet AF table, and for an interrupt pin routes the line, selects the edge, and enables the NVIC entry, with each register bit named after the reference manual. |

## Inputs

- Target part and the pin (port and number) from the schematic.
- Desired function: output, input, alternate function (which peripheral signal), or analog.
- Electrical facts: active level of the LED or button, external pull-ups present, load on the pin.
- For interrupts: edge (rising, falling, both) and the handler that will run.

## Procedure

1. Enable the port clock before touching any port register. A register write to an ungated port is silently dropped. Done when: the RCC enable bit for the port is set and read back.

   ```c
   RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;
   (void)RCC->AHB1ENR;
   ```

2. Set the mode field for the pin. On STM32 `MODER` holds two bits per pin: `00` input, `01` output, `10` alternate function, `11` analog. Clear the field first, then set it. Done when: the `MODER` field for the pin reads the intended value.

   ```c
   /* PA5 as push-pull output */
   GPIOA->MODER &= ~(3U << (5 * 2));
   GPIOA->MODER |=  (1U << (5 * 2));
   ```

3. Drive outputs through the set/reset register, which changes one pin without a read-modify-write on `ODR`. On STM32 `BSRR` bits 0 to 15 set and bits 16 to 31 reset. Done when: the pin toggles and no other pin on the port changes.

   ```c
   GPIOA->BSRR = (1U << 5);          /* set */
   GPIOA->BSRR = (1U << (5 + 16));   /* reset */
   ```

4. For an alternate function, look up the AF number in the datasheet's alternate-function table for that exact pin, then write it into `AFR[0]` (pins 0 to 7) or `AFR[1]` (pins 8 to 15), four bits per pin. Set the speed field high enough for the signal rate. Done when: the AF number matches the datasheet row for the pin and the peripheral signal.

   ```c
   /* PA2 as USART2_TX: AF7 on STM32F4 */
   GPIOA->MODER  &= ~(3U << (2 * 2));
   GPIOA->MODER  |=  (2U << (2 * 2));
   GPIOA->AFR[0] &= ~(0xFU << (2 * 4));
   GPIOA->AFR[0] |=  (7U << (2 * 4));
   ```

5. For an input, set the mode to input and pick the pull from the circuit: an active-low button with no external resistor takes a pull-up (`PUPDR` = `01`). Read `IDR` and invert for active-low. Done when: the pin reads the idle level with nothing pressed.

   ```c
   /* PC13 input with pull-up, active-low button */
   GPIOC->MODER &= ~(3U << (13 * 2));
   GPIOC->PUPDR &= ~(3U << (13 * 2));
   GPIOC->PUPDR |=  (1U << (13 * 2));
   int pressed = !(GPIOC->IDR & (1U << 13));
   ```

6. For an edge interrupt on STM32, enable the SYSCFG clock, route the EXTI line to the port in `SYSCFG->EXTICR`, unmask the line, select the edge, and enable the NVIC entry. Line `n` uses `EXTICR[n / 4]`, nibble `n % 4`; line 13 is `EXTICR[3]` bits 7 to 4. Lines 10 to 15 share `EXTI15_10_IRQn`. In the handler, test `EXTI->PR` for the line and clear it by writing 1. Done when: one press produces one handler entry and `PR` is clear on exit.

   ```c
   RCC->APB2ENR |= RCC_APB2ENR_SYSCFGEN;
   SYSCFG->EXTICR[3] = (SYSCFG->EXTICR[3] & ~(0xFU << 4)) | (0x2U << 4);  /* EXTI13 <- port C */
   EXTI->IMR  |= (1U << 13);
   EXTI->FTSR |= (1U << 13);           /* falling edge */
   NVIC_EnableIRQ(EXTI15_10_IRQn);

   void EXTI15_10_IRQHandler(void)
   {
       if (EXTI->PR & (1U << 13)) {
           EXTI->PR = (1U << 13);      /* write 1 to clear */
           button_event();
       }
   }
   ```

7. Translate the same steps for other vendors. On nRF52 each pin has one `NRF_P0->PIN_CNF[n]` register holding direction, input buffer, pull, drive strength, and sense. On ESP32 the pin function is selected through the IO MUX and GPIO matrix, and outputs use write-1-to-set and write-1-to-clear registers. In every case, power or clock the port or domain before configuring the pin. Done when: the mapping from mode, pull, and function to the vendor's registers is stated.
8. Verify on the target: toggle the output and watch the LED or a probe; press the button and watch `IDR`; for the interrupt, count handler entries per press. Done when: each observation matches the design.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Pin does nothing | Port clock off, or `MODER` still at reset | Enable the port clock first; re-read the pin table. |
| Peripheral signal absent on the pin | Wrong AF number or wrong `AFR` half | Take the AF number from the datasheet table for that pin; pins 8 to 15 live in `AFR[1]`. |
| Interrupt storm on a button | Floating input or no debounce | Enable the pull; debounce in software or with a timer. |
| Interrupt never fires | SYSCFG clock off, wrong `EXTICR` nibble, or NVIC entry not enabled | Enable `SYSCFGEN`; compute `EXTICR[n / 4]` and nibble `n % 4`; enable the shared IRQ. |
| LED inverted | Active-low wiring | Check the schematic; invert the drive. |

## Output

A pin configuration sequence for the target part: port clock, mode, pull, speed, alternate function from the datasheet table, and for interrupt pins the EXTI routing, edge, NVIC enable, and handler with the correct flag clear.
