---
name: rust-cross
description: 'Use when building Rust binaries for a different target architecture or OS, using cross or cargo-zigbuild, configuring .cargo/config.toml, or targeting embedded bare-metal'
---

# Rust cross-compilation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Building Rust for a target with a different architecture, OS, or ABI; configuring cross-compilation in `.cargo/config.toml`; or targeting bare-metal embedded devices. |
| Authority | Reversible local. Edits `.cargo/config.toml`, `Cross.toml`, `Cargo.toml`, installs `rustup` targets, and writes `target/` build directories; rollback reverts the edited files, runs `rustup target remove <triple>` for targets this skill added, and removes build artifacts. No remote mutation. |
| Side effect | Local configuration files, `rustup` installed targets, build artifacts, and Docker images if `cross` is used. |
| Done | The chosen target builds with the selected driver and the output matches the intended target triple and linking mode. |

## Inputs

1. **Target triple** (required): the CPU, vendor, OS, and ABI (for example, `aarch64-unknown-linux-gnu`, `thumbv7em-none-eabihf`).
2. **Host tool state** (required if not inferrable): the installed `rustup` targets from `rustup target list --installed`.
3. **Cross driver** (required): `cargo`, `cross`, `cargo-zigbuild`, or direct `rustc` with a system cross-linker.
4. **C library and linker needs** (optional): glibc, musl, MSVC, `zig cc`, or a system cross-linker.
5. **Embedded runner** (optional for bare metal): probe, emulator, or `qemu` command.

## Procedure

1. **Identify the target triple.** Match the CPU, vendor, OS, and ABI to the platform. Look up the triple in `references/cross-targets.md` if the platform is not known. Done when: the triple is selected and the matching `rustup target add <triple>` command is known.
2. **Install the target.** Run `rustup target add <triple>` and confirm it appears in `rustup target list --installed`. Done when: the target is installed.
3. **Choose the cross driver.**
   - Use `cross build --target <triple>` for hermetic Docker-based builds; add a `Cross.toml` when the image needs extra packages.
   - Use `cargo zigbuild --target <triple>` to avoid a system cross-linker; install `cargo-zigbuild` and a Zig toolchain.
   - Use `cargo build --target <triple>` with a linker set in `.cargo/config.toml` for direct builds.
   Done when: the driver is installed and a sample command runs without linker errors.
4. **Configure the linker and runner.** In `.cargo/config.toml`, add a `[target.<triple>]` section with `linker`, `runner`, and `rustflags` as needed. For a static musl build, set `rustflags = ["-C", "target-feature=+crt-static"]`. For bare metal, set the default target and runner. Done when: `.cargo/config.toml` contains a valid target section.
5. **Build and verify the output.** Run the build, then use `file <binary>` or `readelf -h <binary>` to confirm the ELF machine type and linking mode. For Windows or macOS targets, use `file` or `objdump -f`. Done when: the output reports the intended architecture and the build exits 0.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Target not installed | Run `rustup target add <triple>` and retry. |
| Linker not found | Install the system cross-linker or switch to `cargo-zigbuild`. |
| `cross` fails on a C dependency | Add a `pre-build` step to `Cross.toml` to install the target package. |
| glibc version mismatch with `cargo-zigbuild` | Append a glibc version to the triple, for example `aarch64-unknown-linux-gnu.2.17`. |
| Embedded binary does not run | Verify the runner, default target, and memory layout; check the probe or emulator configuration. |

## Output

1. A built artifact for the requested target.
2. Updated `.cargo/config.toml` and optionally `Cross.toml` or `Cargo.toml` profiles.
3. A short report with the build command, verification output, and any extra configuration.
