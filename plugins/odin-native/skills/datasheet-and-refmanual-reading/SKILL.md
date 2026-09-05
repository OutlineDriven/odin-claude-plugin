---
name: datasheet-and-refmanual-reading
description: 'Use when extracting pinouts, electrical limits, register maps, clock trees, timing, or errata from MCU datasheets and reference manuals. Not for writing the driver: use peripherals-from-datasheet.'
---

# Datasheet and reference manual reading

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Driver work starts on unfamiliar silicon, a register bit behaves ambiguously, an electrical or timing limit must be confirmed, or the question is where in the documentation a fact lives. |
| Authority | Read-only: reads vendor documents and reports locations, extracted values, and cross-references to chat. Rollback is not needed because no file is written. No remote mutation. |
| Side effect | Chat output only. |
| Done | Each requested fact is reported with the document, section, and table it came from, its conditions (voltage range, silicon revision, mode) are stated, and the errata sheet has been checked for the peripheral. |

## Inputs

- The exact part number, including package and revision suffix, and the silicon revision if known (`DBGMCU->IDCODE` `REV_ID` on STM32).
- The vendor documents: datasheet, reference manual, core programming manual, and errata sheet.
- The question: a pin, a register field, a clock limit, a timing parameter, or a peripheral behavior.

## Procedure

1. Pick the document by the kind of fact. Done when: the fact is being sought in the document that owns it.

   | Document | Owns |
   |---|---|
   | Datasheet | Pinout and alternate-function table, absolute maximum ratings, operating conditions, package, electrical and timing characteristics |
   | Reference manual | Memory map, register maps and bit fields, clock tree, peripheral behavior and init sequences |
   | Core programming manual (Arm) | Core registers, NVIC, SysTick, MPU, fault registers, debug |
   | Errata sheet | Silicon defects and the firmware workaround for each |

   The datasheet says what exists; the reference manual says how to program it.

2. Read the reference manual in this order on a first pass: memory and bus architecture, reset and clock control, GPIO and pin multiplexing, the target peripheral chapter, the interrupt and event mapping table, then electrical characteristics only when timing is critical. Done when: the base address, clock enable bit, pin mux, and interrupt line for the peripheral are each located.
3. Extract each register with its full row, not just the bit name. Done when: every column below is filled for each register the driver will touch.

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

4. Cross-reference a pin from the schematic net to the datasheet pin table (alternate-function number), then to the reference manual GPIO chapter (`MODER`, `AFR`), then to the peripheral chapter that confirms the signal. Confirm the pin's default state after reset: analog, pull, or reserved for the debug port. Done when: the alternate-function number appears in both the datasheet table and the peripheral chapter.
5. Read timing and electrical limits from the table that states their conditions. Clock limits depend on the voltage range and flash wait states, not the headline frequency. ADC sampling time depends on source impedance (a datasheet graph). GPIO toggle rate depends on load capacitance and the speed setting. Boot-mode pins are sampled only at reset. Done when: each limit is quoted with the operating condition row it belongs to.
6. Check the errata sheet for the peripheral before blaming the code. If a symptom matches an erratum, apply the documented workaround in the driver. If it does not, confirm the silicon revision, because errata are listed per revision. Done when: the errata search for the peripheral name is complete and the applicable items are listed.
7. Report each fact as document, section number, table or figure, value, and conditions. Done when: another engineer can open the document to the same table without searching.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Register behaves unlike the manual | Erratum for this silicon revision | Read the errata sheet for the peripheral and revision first. |
| Alternate function does not route | Datasheet pin name confused with the reference manual AF table | Cross-check the AF number in both tables. |
| Intermittent DMA corruption | Missed footnote on alignment or burst restrictions | Re-read the notes under the DMA register tables. |
| Clock runs but peripherals misbehave | Frequency taken from the datasheet headline, not the voltage-range table | Use the operating conditions table for the actual supply and wait states. |

## Output

For each requested fact: the document, section, table or figure, the extracted value or bit definition, the conditions under which it holds, and any applicable erratum with its workaround.
