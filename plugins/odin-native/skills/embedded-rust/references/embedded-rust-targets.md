# Embedded Rust targets, HAL crates, and probe-rs chip names

Target names checked against `rustc --print target-list` on rustc 1.98.1 (2026-09-05). Crate names checked against crates.io the same day.

## Target triples

| Core | Target triple | Notes |
|---|---|---|
| Cortex-M0, M0+ | `thumbv6m-none-eabi` | ARMv6-M, no hardware divide |
| Cortex-M3 | `thumbv7m-none-eabi` | ARMv7-M |
| Cortex-M4, M7 without FPU | `thumbv7em-none-eabi` | ARMv7E-M |
| Cortex-M4F, M7F | `thumbv7em-none-eabihf` | ARMv7E-M with hardware float |
| Cortex-M23 | `thumbv8m.base-none-eabi` | ARMv8-M Baseline |
| Cortex-M33, M55 with FPU | `thumbv8m.main-none-eabihf` | ARMv8-M Mainline |
| RISC-V RV32I | `riscv32i-unknown-none-elf` | Base integer only |
| RISC-V RV32IMAC | `riscv32imac-unknown-none-elf` | Multiply, atomics, compressed |
| RISC-V RV64GC | `riscv64gc-unknown-none-elf` | 64-bit, full general extensions |
| AVR | `avr-none` | The per-chip `avr-unknown-gnu-atmega328` name is gone; pass the chip with `-C target-cpu=atmega328p` |
| MSP430 | `msp430-none-elf` | TI MSP430 |
| Xtensa LX6 (ESP32) | `xtensa-esp32-none-elf` | Listed by rustc but needs the esp-rs toolchain from `espup` |

`riscv32gc-unknown-none-elf` is not a rustc target; the RV32GC bare-metal builds use `riscv32imac-unknown-none-elf` or `riscv32imafc-unknown-none-elf`.

## Installing targets

```bash
rustup target add thumbv7em-none-eabihf
rustup target add riscv32imac-unknown-none-elf

# Xtensa needs the esp-rs fork of rustc
cargo install espup
espup install
source ~/export-esp.sh
```

## HAL crates by MCU family

| MCU | Crate |
|---|---|
| STM32F4 | `stm32f4xx-hal` |
| STM32L4 | `stm32l4xx-hal` |
| STM32H7 | `stm32h7xx-hal` |
| nRF52840 | `nrf52840-hal` |
| nRF9160 | `nrf9160-hal` |
| RP2040 | `rp2040-hal` |
| ESP32 family (no_std) | `esp-hal` |
| STM32, all families, async | `embassy-stm32` |
| nRF, all families, async | `embassy-nrf` |
| RP2040, async | `embassy-rp` |

## Memory configuration

`cortex-m-rt` reads `memory.x` from the crate root through its `link.x` script:

```
MEMORY
{
  FLASH : ORIGIN = 0x08000000, LENGTH = 512K
  RAM   : ORIGIN = 0x20000000, LENGTH = 128K
}
```

```toml
# .cargo/config.toml
[target.thumbv7em-none-eabihf]
rustflags = [
    "-C", "link-arg=-Tlink.x",
    "-C", "link-arg=--nmagic",   # no page alignment of sections; GNU ld and lld accept it
]
```

## probe-rs chip names

```bash
probe-rs chip list | grep -i stm32f4
probe-rs chip list | grep -i nrf52
probe-rs chip list | grep -i rp2040
```

Typical names: `STM32F411CEUx`, `STM32F407VGTx`, `STM32L476RGTx`, `nRF52840_xxAA`, `nRF9160_xxAA`, `RP2040`. ESP32 parts flash through `espflash`, not probe-rs.
