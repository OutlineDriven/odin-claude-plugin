---
name: qemu-embedded-simulation
description: 'Use when running ARM or RISC-V bare-metal firmware in QEMU: machine selection, -kernel ELF loading, semihosting, or GDB debugging without hardware. Not for KVM guests: use qemu-kvm.'
---

# QEMU embedded simulation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Bare-metal or RTOS firmware needs running without a board: Cortex-M on a QEMU STM32 machine, RISC-V on `virt`, a GDB stub session, or semihosting output. |
| Authority | Read-only. Emits analysis and commands for the operator to run; no file writes, no rollback needed. No remote mutation. |
| Side effect | QEMU command lines and a verdict in chat. Nothing is written. |
| Done | The firmware boots under the chosen machine, or the blocking limitation (unmodeled peripheral, wrong machine) is named. |

## Inputs

1. Firmware image (required): an ELF or binary linked for the target machine's memory map.
2. Target machine (required): the MCU or `virt` machine the firmware was built for.
3. Toolchain (required): `qemu-system-arm`, `qemu-system-aarch64`, or `qemu-system-riscv32/64`, plus a matching `*-gdb` for debug sessions.

## Procedure

1. Pick a Cortex-M machine. QEMU models a subset of STM32 boards, per the QEMU STM32 documentation:

   | Machine | MCU | Core |
   |---|---|---|
   | `stm32vldiscovery` | STM32F100RBT6 | Cortex-M3 |
   | `netduino2` | STM32F205RFT6 | Cortex-M3 |
   | `netduinoplus2` | STM32F405RGT6 | Cortex-M4F |
   | `olimex-stm32-h405` | STM32F405RGT6 | Cortex-M4F |

   ```bash
   arm-none-eabi-gcc -mcpu=cortex-m3 -T linker.ld -o firmware.elf main.c startup.s
   qemu-system-arm -machine stm32vldiscovery -kernel firmware.elf \
     -nographic -serial mon:stdio
   ```

   `-kernel` accepts an ELF or a raw binary. List machines with `qemu-system-arm -machine help`. Match `-mcpu` and the linker map to the machine's MCU; `stm32vldiscovery` is an F100, not an F407. Done when: the firmware reaches `main` under the right machine.
2. Use generic `virt` for Cortex-A code.

   ```bash
   qemu-system-aarch64 -machine virt -cpu cortex-a53 -m 128M \
     -kernel firmware.elf -nographic
   ```

   Done when: the image boots on `virt`.
3. Run RISC-V bare metal.

   ```bash
   qemu-system-riscv32 -machine virt -nographic \
     -bios none -kernel firmware.elf
   ```

   `-bios none` starts at the reset vector with no OpenSBI. Done when: the image runs from its reset entry.
4. Debug through the GDB stub.

   ```bash
   qemu-system-arm -machine stm32vldiscovery -kernel firmware.elf \
     -S -gdb tcp::3333 -nographic
   ```

   ```gdb
   arm-none-eabi-gdb firmware.elf
   (gdb) target remote :3333
   (gdb) monitor system_reset        # QEMU monitor command over the stub
   (gdb) load                        # write ELF sections into target memory
   ```

   `-S` halts the CPU at reset so GDB connects before any instruction runs. Done when: GDB controls the emulated target.
5. Enable semihosting when the toolchain supports it.

   ```bash
   qemu-system-arm ... -semihosting-config enable=on,target=native
   ```

   Semihosting routes `printf` and friends to the host through a syscall trap; the C library must be built with semihosting support. Done when: firmware output reaches the console without a UART model.
6. Respect the limitations. Per QEMU's STM32 machine documentation:

   | Gotcha | Reality |
   |---|---|
   | No GPIO | The GPIO controller is not modeled; LED-blink tests need hardware or another machine |
   | No DMA or I2C | Not implemented on the STM32 machines |
   | Partial RCC | Reset and enable only; no full clock tree |
   | Wrong MCU assumed | `stm32vldiscovery` is an F100 Cortex-M3; match CPU flags and linker memory |
   | Timing | Not cycle-accurate against silicon |

   Validate on hardware before sign-off. Done when: the test plan accounts for every unmodeled peripheral the firmware touches.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| QEMU exits immediately | `main` returned | End with a loop or `WFI` |
| Wrong entry address | ELF not linked for the machine | Check `readelf -h` entry against the memory map |
| No serial output | Wrong UART model address | Use the machine's UART map or semihosting |
| GDB cannot connect | Missing `-S` or `-gdb` | Add `-S -gdb tcp::3333` |
| HardFault in QEMU | Invalid stack or vector table | Fix startup; see `baremetal-startup` |

## Output

A working QEMU command line for the firmware and machine, the GDB stub session when debugging, and the named list of unmodeled peripherals that force hardware validation.
