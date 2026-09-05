---
name: embedded-rust
description: 'Use when writing no_std Cortex-M or RISC-V firmware in Rust with cortex-m-rt, probe-rs, defmt, RTIC, or a panic handler. Not for no_std library constraints: use rust-no-std.'
---

# Embedded Rust

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A Rust firmware project needs to be set up or fixed: `#![no_std]` `#![no_main]` layout, `cortex-m-rt` startup, `probe-rs` flashing and log streaming, `defmt` logging, an RTIC application, or the choice of panic handler. |
| Authority | Reversible local: writes only the project files under the directory the user names (`Cargo.toml`, `.cargo/config.toml`, `memory.x`, `src/`); rollback is deleting that directory or reverting it in version control. No remote mutation. |
| Side effect | New or edited project files in the named directory. Flashing a board writes the board's flash, which the next `cargo run` overwrites. |
| Done | `cargo build --release` produces an ELF for the target triple, `cargo run --release` flashes it and streams `defmt` output to the terminal, and exactly one panic handler is linked. |

## Inputs

- MCU part and its probe-rs chip name (`probe-rs chip list` prints the names).
- Core: which Cortex-M or RISC-V core, and whether it has an FPU. This picks the target triple.
- Flash and RAM origin and size from the datasheet (for `memory.x`).
- Concurrency model: plain `#[entry]` loop, RTIC, or Embassy.
- Debug probe on hand, or none (this picks the panic handler and the `defmt` transport).

## Procedure

1. Pick the target triple from the core and install it. Done when: `rustup target add <triple>` succeeds and the triple appears in `rustc --print target-list`. The full table is in `references/embedded-rust-targets.md`.

   | Core | Target triple |
   |---|---|
   | Cortex-M0, M0+ | `thumbv6m-none-eabi` |
   | Cortex-M3 | `thumbv7m-none-eabi` |
   | Cortex-M4, M7 without FPU | `thumbv7em-none-eabi` |
   | Cortex-M4F, M7F | `thumbv7em-none-eabihf` |
   | Cortex-M33 with FPU | `thumbv8m.main-none-eabihf` |
   | RISC-V RV32IMAC | `riscv32imac-unknown-none-elf` |

2. Write `Cargo.toml` and `.cargo/config.toml`. Use edition 2024. The versions below are the current crates.io releases on 2026-09-05; run `cargo add <crate>` to take the current one rather than copying a number. `debug = true` in the release profile keeps DWARF for `defmt` and `probe-rs`; it does not change the flashed code size because debug info is not loaded to flash. Done when: `cargo build --release` links.

   ```toml
   # Cargo.toml
   [package]
   name = "my-firmware"
   version = "0.1.0"
   edition = "2024"

   [dependencies]
   cortex-m = { version = "0.7", features = ["critical-section-single-core"] }
   cortex-m-rt = "0.7"
   defmt = "1"
   defmt-rtt = "1"
   panic-probe = { version = "1", features = ["print-defmt"] }

   [profile.release]
   opt-level = "s"
   lto = true
   codegen-units = 1
   debug = true
   ```

   ```toml
   # .cargo/config.toml
   [build]
   target = "thumbv7em-none-eabihf"

   [target.thumbv7em-none-eabihf]
   runner = "probe-rs run --chip STM32F411CEUx"
   rustflags = ["-C", "link-arg=-Tlink.x"]
   ```

   `link.x` is the linker script `cortex-m-rt` generates; it includes your `memory.x`:

   ```
   MEMORY
   {
     FLASH : ORIGIN = 0x08000000, LENGTH = 512K
     RAM   : ORIGIN = 0x20000000, LENGTH = 128K
   }
   ```

3. Write the minimal program. `#![no_std]` drops the standard library, `#![no_main]` hands the entry point to `cortex-m-rt`, and the two `as _` imports link the RTT transport and the panic handler without naming them. Done when: the program builds and `cortex_m::Peripherals::take()` is called at most once.

   ```rust
   #![no_std]
   #![no_main]

   use cortex_m_rt::entry;
   use defmt::info;
   use defmt_rtt as _;
   use panic_probe as _;

   #[entry]
   fn main() -> ! {
       info!("boot");
       let _core = cortex_m::Peripherals::take().unwrap();
       loop {
           info!("tick");
           cortex_m::asm::delay(8_000_000);
       }
   }
   ```

4. Flash and stream logs with probe-rs. `probe-rs run` flashes, resets, and prints RTT and `defmt` output; `probe-rs attach` connects without reset or flash and keeps the running state. Done when: `cargo run --release` prints the `info!` lines.

   ```bash
   curl --proto '=https' --tlsv1.2 -LsSf https://github.com/probe-rs/probe-rs/releases/latest/download/probe-rs-tools-installer.sh | sh
   probe-rs list                      # connected probes
   probe-rs chip list | grep -i stm32 # chip names for --chip
   cargo run --release                # build, flash, stream defmt
   probe-rs attach --chip STM32F411CEUx target/thumbv7em-none-eabihf/release/my-firmware
   ```

   If `probe-rs run` fails to find a probe or chip, read `probe-rs run --help` and `probe-rs list` before changing the config.

5. Log with defmt. `defmt` sends an interned string index plus raw arguments; the host decodes them from the ELF, so the ELF that is running must be the one the host reads. Done when: a `#[derive(Format)]` type prints through `info!("{:?}", value)`.

   ```rust
   use defmt::{Format, error, info, warn};

   #[derive(Format)]
   struct Packet { id: u8, len: u16 }

   info!("temperature {} C", temp);
   warn!("stack {}/{}", used, total);
   error!("i2c {:?}", err);
   defmt::assert_eq!(result, expected);
   ```

   Transport: `defmt-rtt` needs a probe attached and is the default. `defmt-semihosting` works through a GDB or OpenOCD semihosting channel and is slower; use it when RTT is unavailable.

6. For interrupt-driven concurrency, use RTIC 2. Tasks with `binds` are hardware interrupt handlers; software tasks run on the dispatcher interrupts you list. Shared resources are locked, so RTIC proves no data race at compile time. Done when: the RTIC app compiles and the bound ISR fires on the hardware event.

   ```rust
   #[rtic::app(device = stm32f4xx_hal::pac, peripherals = true, dispatchers = [SPI1])]
   mod app {
       use defmt::info;

       #[shared]
       struct Shared { counter: u32 }

       #[local]
       struct Local {}

       #[init]
       fn init(_cx: init::Context) -> (Shared, Local) {
           periodic::spawn().unwrap();
           (Shared { counter: 0 }, Local {})
       }

       #[task(shared = [counter])]
       async fn periodic(mut cx: periodic::Context) {
           loop {
               let n = cx.shared.counter.lock(|c| { *c += 1; *c });
               info!("count {}", n);
               rtic_monotonics::systick::Systick::delay(500.millis()).await;
           }
       }

       #[task(binds = EXTI0, priority = 2)]
       fn button(_cx: button::Context) {
           info!("button");
       }
   }
   ```

   Cargo dependencies for this: `rtic` with the `thumbv7-backend` feature and `rtic-monotonics` with the `cortex-m-systick` feature. Embassy (`embassy-executor`) is the async alternative; pick one executor per binary.

7. Pick exactly one panic handler. Two handlers produce a duplicate `#[panic_handler]` link error. Done when: `Cargo.toml` lists one of the crates below and the build links.

   | Crate | Behavior | Use when |
   |---|---|---|
   | `panic-halt` | Infinite loop | Production without a probe |
   | `panic-probe` | Prints the message through `defmt`, then a breakpoint | Development with probe-rs |
   | `panic-semihosting` | Prints through semihosting | Development under GDB or OpenOCD |
   | `panic-reset` | Resets the core | Recovery where a watchdog would reset anyway |

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| `can't find crate for core` | Target not installed | `rustup target add <triple>`. |
| Link error naming `memory.x` or `_stack_start` | `memory.x` missing or not on the linker search path | Put `memory.x` next to `Cargo.toml`, or emit its directory from `build.rs` with `cargo:rustc-link-search`. |
| Duplicate `#[panic_handler]` | Two panic crates linked | Keep one. |
| No `defmt` output | Host reads a different ELF than the one flashed, or RTT is not linked | Rebuild and flash in one `cargo run`; keep `use defmt_rtt as _;`. |
| `probe-rs` reports no probe | USB permissions or no udev rule | Run `probe-rs list`; install the udev rules from the probe-rs docs. |
| HardFault at boot | Wrong `MEMORY` origins or FPU triple on a core without FPU | Check `memory.x` against the datasheet and the triple against the core. |

## Output

A project directory that builds for the target triple, flashes with `cargo run --release`, streams `defmt` logs, and links one panic handler, plus a note naming the target triple and the probe-rs chip name that were used.
