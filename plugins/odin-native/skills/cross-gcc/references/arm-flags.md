# ARM, AArch64, and RISC-V GCC target flags

Sources: https://gcc.gnu.org/onlinedocs/gcc/ARM-Options.html, https://gcc.gnu.org/onlinedocs/gcc/AArch64-Options.html, https://gcc.gnu.org/onlinedocs/gcc/RISC-V-Options.html. Every flag and value below appears on those pages for GCC 16.

## AArch64

| Flag | Effect |
|---|---|
| `-march=armv8-a` | ARMv8-A baseline |
| `-march=armv8.2-a+fp16` | ARMv8.2-A with the half-precision extension |
| `-mcpu=cortex-a72` | Select and tune for Cortex-A72 |
| `-mcpu=native` | Detect the host CPU; only for native AArch64 builds |
| `-moutline-atomics` | Call runtime helpers that pick LSE atomics when the CPU has them |

## 32-bit ARM

| Flag | Effect |
|---|---|
| `-march=armv7-a` | ARMv7-A (Cortex-A) |
| `-march=armv7-m` | ARMv7-M (Cortex-M3) |
| `-mcpu=cortex-m4` | Select and tune for Cortex-M4 |
| `-mthumb` | Generate Thumb code |
| `-mthumb-interwork` | Allow ARM and Thumb code to call each other |
| `-mfloat-abi=soft` | Software floating point |
| `-mfloat-abi=softfp` | Hardware FPU, floats passed in integer registers |
| `-mfloat-abi=hard` | Hardware FPU, floats passed in FP registers |
| `-mfpu=fpv4-sp-d16` | Cortex-M4 single-precision FPU |
| `-mfpu=fpv5-d16` | Cortex-M7 double-precision FPU |
| `-mfpu=neon-vfpv4` | NEON with VFPv4 |

`-mfloat-abi` must match the libraries being linked; a hard-float object does not link against a soft-float libc.

## Bare-metal link

```bash
arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16 \
  -ffreestanding -nostdlib -nostartfiles -T linker.ld -o firmware.elf startup.s main.c
```

`-ffreestanding` tells the compiler no hosted C library exists; `-nostdlib` drops the standard libraries from the link; `-nostartfiles` drops `crt0.o` and friends; `-T` selects the linker script. Add `-lgcc` back when the link reports missing `__aeabi_*` helpers.

## RISC-V

| Flag | Effect |
|---|---|
| `-march=rv64gc` | 64-bit, general-purpose extensions plus compressed instructions |
| `-march=rv32imc` | 32-bit, integer, multiply, compressed |
| `-mabi=lp64d` | 64-bit ABI with double-precision floats in FP registers |
| `-mabi=ilp32` | 32-bit ABI, soft float |
| `-mcpu=sifive-u74` | SiFive U74 core |

The `-march` string is composed from the base ISA and extension letters as the RISC-V options page describes; `rv64gc` and `rv32imc` are two such compositions.
