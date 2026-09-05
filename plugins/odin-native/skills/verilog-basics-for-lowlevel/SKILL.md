---
name: verilog-basics-for-lowlevel
description: 'Use when reading RTL to understand hardware behavior, reset and clock domains, CDC synchronizers, APB/AHB/AXI bus protocols, or collaborating with hardware teams on SoC diagrams.'
---

# Verilog basics for low-level engineers

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A reference manual is unclear and the RTL settles the question, a clock-domain-crossing bug needs explaining, a bus transaction needs correlating with driver ordering, or an SoC block diagram needs reading with a hardware team. |
| Authority | Read-only. Emits analysis in chat; no file writes, no rollback needed. No remote mutation. |
| Side effect | An explanation of the RTL behavior in chat. Nothing is written. |
| Done | The hardware behavior behind the software question is stated in register-access terms, or the missing RTL or documentation is named. |

This skill gives reading literacy, not design skill. It does not replace an HDL course.

## Inputs

1. RTL or SoC documentation (required): the Verilog/SystemVerilog source, block diagram, or register map in question.
2. Software symptom (required): the driver behavior the hardware is meant to explain.
3. Reference manual (optional): the vendor document the RTL clarifies.

## Procedure

1. Read the module structure.

   ```verilog
   module uart_tx (
       input  wire       clk,
       input  wire       rst_n,   /* active-low async reset */
       input  wire       start,
       input  wire [7:0] data,
       output reg        busy
   );
       /* sequential logic */
       always @(posedge clk or negedge rst_n) begin
           if (!rst_n)
               busy <= 1'b0;
           else if (start)
               busy <= 1'b1;
       end
   endmodule
   ```

   `wire` carries a combinational connection. `reg` inside an `always @(posedge clk)` block is a flip-flop; inside `always @(*)` it is combinational. Done when: the module's ports, registers, and combinational paths are identified.
2. Read the synthesizable subset.

   | Construct | Meaning |
   |---|---|
   | `always @(posedge clk)` | Registered update on the clock edge |
   | `assign x = a & b` | Combinational logic |
   | `case` / `if` in `always @(*)` | Mux logic |
   | `#(.WIDTH(32))` | Parameterized width |

   `#delay` is simulation-only and never reaches silicon. Done when: each construct in the file is classified as sequential, combinational, or simulation-only.
3. Check reset discipline. Async assert with synchronous deassert is the common pattern (a `rst_sync_n` synchronizer). Firmware must honor post-reset setup times from the reference manual's reset chapter. A peripheral on its own reset domain may need an explicit soft-reset bit before use. Done when: the reset path for the block is traced.
4. Map the bus protocol. SoC diagrams hang peripherals off standard buses:

   | Bus | Typical use |
   |---|---|
   | APB | Slow peripherals, simple register interface |
   | AHB | Higher-throughput on-chip fabric |
   | AXI | DMA and modern SoCs; bursts and channels |

   A Linux `regmap` MMIO read lands on an APB or AXI slave decode in the RTL address map. Done when: the driver's MMIO accesses are mapped to bus transactions.
5. Check clock-domain crossings. A signal crossing `clk_a` to `clk_b` needs a synchronizer, typically two or more flip-flops. Metastability at an unsynchronized crossing produces intermittent failures that no software change fixes. Done when: every clock-domain crossing on the path is either synchronized or flagged.
6. Separate simulation from silicon.

   ```bash
   iverilog -o sim.vvp design.v tb.v
   vvp sim.vvp
   ```

   Icarus Verilog runs the testbench; QEMU and other peripheral models can diverge from RTL edge cases. Done when: the claim is checked against RTL or silicon, not against a model's behavior alone.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Status bit toggles once | Pulse in RTL | Poll a latch or use clear-on-read semantics in the driver |
| Random corruption | Unsynchronized CDC | Hardware synchronizer; do not patch with delays |
| Read returns stale data | Bus bridge buffering | Follow the reference manual's ordering or barrier rules |
| IRQ stuck | Level versus pulse mismatch in RTL | Match the handler's ACK sequence to the RTL |
| Mixed Verilog and VHDL docs | SoC uses both | Read the interface signal table; the languages share the port concepts |

## Output

An explanation of the hardware behavior in register-access terms: what the RTL does on the driver's MMIO read or write, which reset and clock domains apply, and which behaviors software cannot fix.
