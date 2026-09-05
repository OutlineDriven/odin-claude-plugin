---
name: peripherals-from-datasheet
description: 'Use when writing a register-level peripheral driver from an MCU reference manual: register map, init sequence, timing, bit definitions. Not for finding facts: use datasheet-and-refmanual-reading.'
---

# Peripheral drivers from the reference manual

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A peripheral driver must be written without a vendor HAL, ported between MCU families, or checked against the reference manual because it "should work" per an example and does not. |
| Authority | Read-only: emits the register struct, bit definitions, init sequence, and driver skeleton to chat; the user places them in the project. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | The register struct matches the manual's offset column, every bit constant cites its table, the init sequence follows the manual's bring-up order starting with the bus clock, and each busy-wait has a documented flag and timeout. |

## Inputs

- Target part and the reference manual chapter for the peripheral.
- The peripheral base address from the memory map.
- The clock tree values that feed the peripheral (bus clock, kernel clock).
- Pins and alternate-function numbers from the datasheet, configured through `gpio-baremetal`.
- Whether the driver is polled, interrupt-driven, or DMA-driven.

## Procedure

1. Read the peripheral chapter's functional description and programming-model section before copying register writes. The chapter is structured as functional description, register map (offsets), register bit definitions, then timing notes; the init order lives in the functional description. Done when: the bring-up order the manual prescribes is written down as a list.
2. Build the register struct from the offset column. One `volatile uint32_t` per 32-bit register, reserved words filled with padding so every member lands on its listed offset. Done when: `offsetof` for each member equals the manual's offset.

   ```c
   /* RM0090 30.6, USART2 base 0x40004400 */
   typedef struct {
       volatile uint32_t SR;    /* 0x00 status */
       volatile uint32_t DR;    /* 0x04 data */
       volatile uint32_t BRR;   /* 0x08 baud rate */
       volatile uint32_t CR1;   /* 0x0C control 1 */
       volatile uint32_t CR2;   /* 0x10 control 2 */
       volatile uint32_t CR3;   /* 0x14 control 3 */
       volatile uint32_t GTPR;  /* 0x18 guard time and prescaler */
   } USART_TypeDef;

   #define USART2 ((USART_TypeDef *)0x40004400UL)
   ```

3. Define bit constants from the bit table and cite the section in a comment, so a reviewer can audit each one. Done when: no bare numeric mask appears in the driver.

   ```c
   #define USART_CR1_UE (1U << 13)   /* RM0090 30.6.4 */
   #define USART_CR1_TE (1U << 3)
   #define USART_CR1_RE (1U << 2)
   ```

4. Follow the bring-up order. Done when: each step below appears in the init function in this order, or the manual states the peripheral does not need it.

   | Step | Action |
   |---|---|
   | 1 | Enable the bus clock in the RCC enable register |
   | 2 | Reset the peripheral through its RCC reset bit when the manual requires a known state |
   | 3 | Configure the pins: mode, alternate function, speed, pull |
   | 4 | Write configuration registers (mode, baud or prescaler, frame) while the peripheral is disabled |
   | 5 | Set the enable bits (`UE`, `TE`, `RE` for a USART) |
   | 6 | Enable the NVIC entry when interrupt-driven |
   | 7 | Check the status flags before the first transaction |

   A configuration write before step 1 is silently dropped:

   ```c
   USART2->CR1 |= USART_CR1_UE;   /* clock still off: no effect */
   ```

5. Write every busy-wait against a named flag with parentheses around the test and a bounded timeout. `&` binds weaker than `==`, so `RCC->CR & RCC_CR_PLLRDY == 0` tests `RCC->CR & 0` and never terminates. Take oscillator and PLL settle times from the electrical characteristics table. Done when: each loop has the form below and a timeout that reports failure instead of hanging.

   ```c
   uint32_t t = PLL_LOCK_TIMEOUT;
   while ((RCC->CR & RCC_CR_PLLRDY) == 0U) {
       if (--t == 0U) return DRIVER_ERR_TIMEOUT;
   }
   ```

6. Structure the driver as one init function that calls the clock, pin, and configuration steps by name, so the order is visible. Done when: the init reads as the bring-up table.

   ```c
   int usart2_init(uint32_t baud)
   {
       rcc_enable_usart2();
       gpio_config_usart2_pins();
       USART2->BRR = usart_brr(pclk1_hz(), baud);
       USART2->CR1 = USART_CR1_TE | USART_CR1_RE | USART_CR1_UE;
       return 0;
   }
   ```

7. Verify on hardware: read back the configuration registers, then run one transaction and check the status flags the manual says should set and clear. Done when: the observed flags match the chapter's description of the transaction.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Peripheral dead | Bus clock not enabled | Set the RCC enable bit first. |
| Wrong baud or timing | Assumed bus clock differs from the actual clock tree | Compute from the measured or configured clock, not a constant. |
| Signal absent on the pin | Alternate-function number from the wrong table | Cross-check the datasheet AF table with the peripheral chapter. |
| Interrupt stuck | Flag clear sequence wrong | Read the "clearing flags" subsection for that flag. |
| Data silently wrong | Register width or byte lane mismatch | Match the access width the register table lists. |
| Loop never exits | Precedence bug or unbounded wait | Parenthesize the mask test; add a timeout. |

## Output

A driver skeleton for the peripheral: register struct matching the offset column, cited bit constants, an init function in the manual's bring-up order, bounded flag waits, and a hardware verification list.
