---
name: peripherals-from-datasheet
description: 'Use when reading MCU datasheets or reference manuals in documentation-reading mode for pinouts, electrical limits, register maps, clock trees, timing, or errata, or writing a register-level peripheral driver in driver-writing mode: source locations, init sequence, bit definitions, and bounded waits.'
---

# MCU peripheral documentation and drivers

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Documentation for a target MCU peripheral must be read for a pin, register, clock, timing, or erratum fact, or a register-level driver must be written without a vendor HAL, ported between MCU families, or checked against the reference manual after an example "should work" does not. |
| Authority | Read-only: reads the supplied vendor documents and emits source-located facts in documentation-reading mode, or a register struct, bit definitions, init sequence, and driver skeleton in driver-writing mode, to chat; the user places any driver code in the project. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | Documentation-reading mode reports every requested fact with its document, section, table or figure, value, conditions, and applicable erratum; driver-writing mode matches register offsets and cited bit tables, follows the manual's bring-up order starting with the bus clock, and bounds every busy-wait with a named flag and timeout. |

## Inputs

- Mode: `documentation-reading` for source-located fact extraction, or `driver-writing` for a register-level driver.
- The exact part number, including package and revision suffix, and the silicon revision if known (`DBGMCU->IDCODE` `REV_ID` on STM32).
- The vendor documents: datasheet, reference manual, core programming manual, and errata sheet.
- The question or target peripheral: a pin, register field, clock limit, timing parameter, peripheral behavior, or driver chapter.
- The peripheral base address from the memory map.
- The clock tree values that feed the peripheral (bus clock, kernel clock).
- Pins and alternate-function numbers from the datasheet, configured through `gpio-baremetal`.
- Whether a driver is polled, interrupt-driven, or DMA-driven.

## Procedure

1. Select `documentation-reading` or `driver-writing` mode and ground the inputs. Record the exact part, package, revision suffix, silicon revision when known, vendor documents, requested fact or target peripheral, and driver mode when applicable. Done when: the selected mode and every available source input are stated.
2. Pick the document by the kind of fact before extracting values or copying writes. Done when: each requested fact is being sought in the document that owns it.

   | Document | Owns |
   |---|---|
   | Datasheet | Pinout and alternate-function table, absolute maximum ratings, operating conditions, package, electrical and timing characteristics |
   | Reference manual | Memory map, register maps and bit fields, clock tree, peripheral behavior and init sequences |
   | Core programming manual (Arm) | Core registers, NVIC, SysTick, MPU, fault registers, debug |
   | Errata sheet | Silicon defects and the firmware workaround for each |

   The datasheet says what exists; the reference manual says how to program it. Done when: the owning document is recorded for every requested value.

3. Read the reference manual in this order on a first pass: memory and bus architecture, reset and clock control, GPIO and pin multiplexing, the target peripheral chapter, the interrupt and event mapping table, then electrical characteristics only when timing is critical. Read the peripheral chapter's functional description and programming-model section before copying register writes; its init order lives in the functional description. Done when: the base address, clock enable bit, pin mux, interrupt line, and manual-prescribed bring-up order are each located.
4. Extract each register with its full row, not just the bit name. Done when: every column below is filled for each register the driver will touch or each register fact requested.

   | Column | Why it matters |
   |---|---|
   | Offset from peripheral base | Cross-check against the memory map table; struct padding must match |
   | Reset value | Read-modify-write starts from it |
   | Access type per bit (`r`, `w`, `rw`, `rc_w1`, `rc_w0`, `rs`) | Write-1-to-clear flags cannot be cleared by `&= ~bit` |
   | Mode-dependent fields | The notes under the table change a field's meaning |
   | Side effects | Reading a data register can clear a flag; reserved bits may require zero |

   ```c
   /* named constants from the bit table, with the section cited */
   #define USART_CR1_UE (1U << 13)   /* RM0090 30.6.4 */
   #define USART_CR1_TE (1U << 3)

   /* a bare address and value cannot be audited against the manual */
   *(volatile uint32_t *)0x40011000 = 0x2000;
   ```

5. Cross-reference a pin from the schematic net to the datasheet pin table (alternate-function number), then to the reference manual GPIO chapter (`MODER`, `AFR`), then to the peripheral chapter that confirms the signal. Confirm the pin's default state after reset: analog, pull, or reserved for the debug port. Done when: the alternate-function number appears in both the datasheet table and the peripheral chapter.
6. Read timing and electrical limits from the table that states their conditions. Clock limits depend on the voltage range and flash wait states, not the headline frequency. ADC sampling time depends on source impedance (a datasheet graph). GPIO toggle rate depends on load capacitance and the speed setting. Boot-mode pins are sampled only at reset. For driver waits, take oscillator and PLL settle times from the electrical characteristics table. Done when: each limit and timeout carries the operating-condition row it belongs to.
7. Check the errata sheet for the peripheral before blaming the code. In `documentation-reading` mode, report any matching erratum, revision, and workaround; in `driver-writing` mode, apply the documented workaround in the emitted driver skeleton. If there is no match, confirm the silicon revision, because errata are listed per revision. Done when: the errata search for the peripheral name is complete and the applicable items are listed for the selected mode.
8. In `documentation-reading` mode, report each fact as document, section number, table or figure, value, conditions, and applicable erratum or workaround. Another engineer must be able to open the document to the same table without searching. Done when: every requested fact has a source location and conditions; `documentation-reading` mode stops here.
9. In `driver-writing` mode, build the register struct from the offset column. One `volatile uint32_t` per 32-bit register, reserved words filled with padding so every member lands on its listed offset. Done when: `offsetof` for each member equals the manual's offset.

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

10. Define bit constants from the bit table and cite the section in a comment, so a reviewer can audit each one. Done when: no bare numeric mask appears in the driver.

   ```c
   #define USART_CR1_UE (1U << 13)   /* RM0090 30.6.4 */
   #define USART_CR1_TE (1U << 3)
   #define USART_CR1_RE (1U << 2)
   ```

11. Follow the bring-up order. Done when: each step below appears in the init function in this order, or the manual states the peripheral does not need it.

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

12. Write every busy-wait against a named flag with parentheses around the test and a bounded timeout. `&` binds weaker than `==`, so `RCC->CR & RCC_CR_PLLRDY == 0` tests `RCC->CR & 0` and never terminates. Done when: each loop has the form below and a timeout that reports failure instead of hanging.

   ```c
   uint32_t t = PLL_LOCK_TIMEOUT;
   while ((RCC->CR & RCC_CR_PLLRDY) == 0U) {
       if (--t == 0U) return DRIVER_ERR_TIMEOUT;
   }
   ```

13. Structure the driver as one init function that calls the clock, pin, and configuration steps by name, so the order is visible. Done when: the init reads as the bring-up table.

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

14. Verify on hardware: read back the configuration registers, then run one transaction and check the status flags the manual says should set and clear. Done when: the observed flags match the chapter's description of the transaction.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Register behaves unlike the manual | Erratum for this silicon revision | Read the errata sheet for the peripheral and revision first. |
| Peripheral dead | Bus clock not enabled | Set the RCC enable bit first. |
| Wrong baud or timing, or clock runs but peripherals misbehave | Assumed bus clock differs from the actual clock tree, or frequency was taken from the datasheet headline rather than the voltage-range table | Compute from the measured or configured clock and use the operating-conditions table for the actual supply and wait states. |
| Signal absent on the pin, or alternate function does not route | Alternate-function number, pin name, or reset state came from the wrong table | Cross-check the AF number in both datasheet and peripheral tables, then confirm the GPIO reset state. |
| Intermittent DMA corruption | Missed footnote on alignment or burst restrictions | Re-read the notes under the DMA register tables. |
| Interrupt stuck | Flag clear sequence wrong | Read the "clearing flags" subsection for that flag. |
| Data silently wrong | Register width or byte lane mismatch | Match the access width the register table lists. |
| Loop never exits | Precedence bug or unbounded wait | Parenthesize the mask test; add a timeout. |

## Output

In `documentation-reading` mode: each requested fact with its document, section, table or figure, extracted value or bit definition, operating conditions, and applicable erratum with its workaround. In `driver-writing` mode: a driver skeleton for the peripheral with a register struct matching the offset column, cited bit constants, an init function in the manual's bring-up order, bounded flag waits, and a hardware verification list.
