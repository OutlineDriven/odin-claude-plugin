---
name: device-tree
description: 'Use when writing DTS/DTSI, bindings, overlays, phandles, or debugging OF platform probe failures. Not for probe and remove code: use platform-device-model.'
---

# Device tree

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing or debugging Linux devicetree source: DTS/DTSI structure, bindings, phandles, overlays, `compatible` and property layout, or a driver whose OF probe never fires. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns DTS fragments, property tables, and debug commands. No source files are modified. |
| Done | The node or fragment, the property set with cells explained, and a probe-failure diagnosis are delivered. |

## Inputs

1. Hardware fact to describe (required): the block or device, its MMIO base, IRQ, clocks, and the bus it sits on.
2. Board context (optional): the SoC `.dtsi` to include and the board `.dts` to extend.
3. Failure report (optional): the symptom, such as a driver that never probes or an IRQ that never fires.

## Procedure

1. Lay out the node under its bus parent. A board file includes the SoC `.dtsi` and extends or references its nodes by label.

   ```dts
   /dts-v1/;
   #include "soc.dtsi"

   / {
       model = "My Board";
       compatible = "vendor,my-board", "vendor,soc-family";

       &uart0 {
           status = "okay";
       };
   };
   ```

   ```dts
   uart0: serial@40011000 {
       compatible = "vendor,uart";
       reg = <0x40011000 0x400>;
       interrupts = <GIC_SPI 38 IRQ_TYPE_LEVEL_HIGH>;
       clocks = <&clk_uart0>;
       status = "disabled"; /* the board file sets "okay" */
   };
   ```

   Done when: the node sits under the right bus parent and every cell count matches the parent's `#address-cells` and `#size-cells`.
2. Set the load-bearing properties correctly.

   | Property | Meaning |
   |---|---|
   | `compatible` | Driver match strings, most specific first |
   | `reg` | MMIO address and length, cells per `#address-cells`/`#size-cells` |
   | `interrupts` | IRQ specifier, cells defined by the interrupt parent |
   | `clocks` / `clock-names` | Phandles to clock providers |
   | `status` | `"disabled"` keeps the device unprobed |

   Done when: each property value traces to the datasheet or the binding document.
3. Wire phandles for cross-node references. A phandle is the label reference the compiler resolves to a number.

   ```dts
   clk_uart0: clock-uart0 {
       compatible = "fixed-clock";
       #clock-cells = <0>;
   };

   &uart0 {
       clocks = <&clk_uart0>;
       clock-names = "apb_pclk";
   };
   ```

   Done when: every `&label` reference resolves to a node defined in the compiled tree.
4. Match the driver to the node. The OF core parses the DTB at boot; `of_platform_populate()` creates `platform_device` instances for bus nodes, and a driver binds when its `of_match_table` matches `compatible`.

   ```c
   static const struct of_device_id my_of_match[] = {
       { .compatible = "vendor,uart" },
       { }
   };
   MODULE_DEVICE_TABLE(of, my_of_match);
   ```

   Done when: the driver's match table names the exact `compatible` string of the node.
5. Compile and inspect the tree. `dtc` ships with the kernel in `scripts/dtc`; `make dtbs` builds the in-tree boards.

   ```bash
   dtc -I dts -O dtb -o board.dtb board.dts
   dtc -I fs -O dts /proc/device-tree | less   # what the running kernel sees
   ls /sys/firmware/devicetree/base/
   ```

   Name the binding document (`Documentation/devicetree/bindings/`, YAML under dt-schema) in the commit that adds or changes a binding. Done when: the compiled DTB matches the running tree, or the delta explains the failure.
6. Apply overlays where the platform supports them. `CONFIG_OF_OVERLAY` gives the kernel core overlay support. Mainline applies overlays through the bootloader: U-Boot's `fdt apply`, or `fdtoverlay` to merge a `.dtbo` into the kernel FDT at build time. A runtime configfs interface (`/sys/kernel/config/device-tree/overlays/`) exists only on kernels carrying a vendor patch (`CONFIG_OF_CONFIGFS`); do not assume it on a mainline kernel. Overlay resolution failures name unresolved symbols in `__fixups__`; export the target labels as `__symbols__` in the base DTB. Done when: the apply path is named for the actual kernel and boot chain.
7. Diagnose a probe failure bottom-up: confirm the node is present in the running tree (`/proc/device-tree`), confirm `status` is `"okay"`, confirm the `compatible` string matches the driver table character for character, then confirm suppliers (clocks, regulators, phys) are available or the driver handles `-EPROBE_DEFER`. Route deeper work: `platform-device-model` for probe and driver-model behavior, `bus-drivers-i2c-spi` for I2C/SPI child nodes, `datasheet-and-refmanual-reading` for mapping hardware facts to DT properties. Done when: the first broken link in the chain is named.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| Driver never binds | `compatible` mismatch | Diff the string against the driver's `of_match_table`. |
| Wrong MMIO decoded | `#address-cells`/`#size-cells` mismatch | Follow the SoC `.dtsi` parent conventions. |
| IRQ never fires | Wrong interrupt parent or cells | Copy the specifier shape from a working node on the same interrupt controller. |
| Probe deferred forever | Missing supplier node or driver | Add the supplier to DT, or enable its driver. |
| Overlay fails to apply | Unresolved symbols | Export labels as `__symbols__` in the base DTB. |

## Output

The node or board fragment; the property table with cell arithmetic; the phandle wiring; the driver match snippet; the compile and inspect transcript; the overlay apply path for the actual kernel; the named first broken link in the probe chain.
