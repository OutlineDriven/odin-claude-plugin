---
name: openocd-jtag
description: 'Use when configuring OpenOCD for a JTAG or SWD target, flashing through it, attaching GDB to a bare-metal MCU, or setting hardware breakpoints and watchpoints. Not for probe-rs: use embedded-rust.'
---

# OpenOCD over JTAG and SWD

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A microcontroller must be flashed or debugged through a debug adapter: an OpenOCD config is needed, GDB must attach to the target, a hardware breakpoint or watchpoint is needed, or OpenOCD reports a connection error. |
| Authority | Reversible local: writes only `openocd.cfg` and GDB command files in the project directory the user names; rollback is reverting those files in version control. No remote mutation. |
| Side effect | Flashing rewrites the target's flash. A debug session halts and resets the target. |
| Done | `openocd -f openocd.cfg` examines the target and reports its breakpoint and watchpoint count, `program firmware.elf verify reset` completes, and GDB stops at `main` after `load`. |

## Inputs

- Adapter: ST-LINK, CMSIS-DAP (DAPLink), J-Link, or an FTDI board, and whether the target exposes JTAG, SWD, or both.
- Exact MCU part, to pick the `target/*.cfg` file.
- Firmware ELF, or a raw binary with its flash base address.
- OpenOCD version (`openocd --version`; v0.12.0 is the current release on 2026-09-05).

## Procedure

1. Choose the transport. JTAG uses at least four signals (TCK, TMS, TDI, TDO) and can chain several devices; SWD uses two (SWCLK, SWDIO) and reaches one target. Cortex-M parts expose SWD and most also expose JTAG; Cortex-A, Cortex-R, and RISC-V debug modules use JTAG. Done when: the transport matches the pins wired on the board.

2. Write `openocd.cfg`: one interface file, one target file, the transport, and the clock. `adapter speed` is in kHz. Select one adapter among several with `adapter serial`. Done when: `openocd -f openocd.cfg` prints the detected core and a line of the form `target has N breakpoints, M watchpoints`.

   ```tcl
   # ST-LINK or any CMSIS-DAP probe on an STM32F4
   source [find interface/cmsis-dap.cfg]
   transport select swd
   source [find target/stm32f4x.cfg]
   adapter speed 4000

   # J-Link on an nRF52 (alternative)
   # source [find interface/jlink.cfg]
   # adapter serial 123456789
   # transport select swd
   # source [find target/nrf52.cfg]
   # adapter speed 8000
   ```

   `find` searches the current directory, any `-s dir` given on the command line, `$OPENOCD_SCRIPTS`, `$XDG_CONFIG_HOME/openocd`, `$HOME/.openocd`, and the install's `scripts/` directory, in that order. List `interface/` and `target/` under the install's `scripts/` directory to see the shipped names.

3. Attach GDB. OpenOCD serves GDB on port 3333 and a Tcl console on 4444. `monitor` forwards a command to OpenOCD. Done when: `break main` then `continue` stops at `main`.

   ```bash
   openocd -f openocd.cfg &
   arm-none-eabi-gdb firmware.elf \
       -ex "target extended-remote :3333" \
       -ex "monitor reset halt" \
       -ex "load" \
       -ex "monitor reset init" \
       -ex "break main" \
       -ex "continue"
   ```

4. Flash. `program` erases, writes, optionally verifies, and resets in one command; `exit` closes OpenOCD after it. A raw binary needs its base address. Done when: `program ... verify` reports success and the target runs the new image after `reset`.

   ```bash
   openocd -f openocd.cfg -c "program firmware.elf verify reset exit"
   openocd -f openocd.cfg -c "program firmware.bin 0x08000000 verify reset exit"
   ```

   From the Tcl console (`telnet localhost 4444`) or through `monitor`:

   ```
   reset halt
   flash write_image erase firmware.bin 0x08000000
   flash write_bank 0 firmware.bin 0
   flash erase_sector 0 0 last
   reset run
   ```

5. Use hardware breakpoints and watchpoints on code in flash. A software breakpoint patches instruction memory, which OpenOCD cannot do in flash, so `break` on a flash address needs OpenOCD to substitute a hardware breakpoint or you use `hbreak` directly. The count is a property of the core's Flash Patch and Breakpoint unit and Data Watchpoint and Trace unit; read it from OpenOCD's `target has N breakpoints, M watchpoints` line rather than assuming. Done when: `info breakpoints` shows the hardware breakpoint as `hw breakpoint` and the watchpoint triggers on the access.

   ```
   (gdb) hbreak function_name
   (gdb) hbreak *0x08001234
   (gdb) watch  global_variable     # write
   (gdb) rwatch some_buffer         # read
   (gdb) awatch sensor_value        # read or write
   (gdb) info breakpoints
   ```

6. Drive the target from the console when GDB is not attached. Done when: each command below returns without `target not halted`.

   ```
   reset halt            # reset and stop at the reset vector
   reset init            # reset and run the target's init script
   reset run             # reset and run
   halt
   resume
   mdw 0x20000000        # read a word
   mww 0x40021000 0x1    # write a word
   reg r0
   flash list
   ```

7. For J-Link, either run it under OpenOCD with `interface/jlink.cfg`, or use SEGGER's own GDB server and point GDB at its port. Done when: GDB connects to whichever server is chosen and `monitor reset halt` (OpenOCD) or `monitor reset` (SEGGER) stops the core.

   ```bash
   JLinkGDBServer -if SWD -device STM32L476RG -port 3333 &
   arm-none-eabi-gdb -ex "target remote :3333" firmware.elf
   ```

## Failure and recovery

| Error | Cause | Fix |
|---|---|---|
| `unable to find JTAG device` or no probe found | Adapter not powered or not seen by USB, wrong interface file | Check USB permissions and udev rules; power the target; match the interface file to the adapter. |
| `JTAG scan chain interrogation failed` | Target wired for SWD, or wrong target file | Add `transport select swd`; pick the target file for the exact part. |
| `flash 'stm32f4x' is not supported` or wrong flash size | Target file for another part | Use the target file for the exact MCU. |
| `timed out while waiting for target halted` | Core running with debug locked out, or BOOT pins select another image | `reset halt`; check the BOOT pins; use connect-under-reset if the adapter supports it. |
| `Cannot access memory at address` | Address outside the map, or MPU blocks it | Check the linker map; read the address after `reset halt`. |
| `target not examined yet` | OpenOCD could not talk to the core | Fix power and wiring, then restart OpenOCD. |
| `break` in flash never hits | Software breakpoint on flash | Use `hbreak` on that address. |

## Output

An `openocd.cfg` in the named directory that examines the target, plus the command lines that flash the image and attach GDB, and a note of the breakpoint and watchpoint count OpenOCD reported for the core.
