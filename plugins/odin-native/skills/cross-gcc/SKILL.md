---
name: cross-gcc
description: 'Use when compiling for ARM, AArch64, RISC-V, or MIPS from x86-64 with a GCC cross toolchain: triplets, sysroots, pkg-config, CMake toolchain files, QEMU. Not for Zig: use zig-cross.'
---

# Cross-compilation with GCC

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user needs to build for a different architecture with a `<triplet>-gcc` toolchain, gets `Exec format error` or `wrong ELF class`, finds host libraries leaking into a cross link, or wants to run and debug a cross-built binary under QEMU. |
| Authority | Read-only. The skill emits install commands, compiler invocations, environment settings, and a toolchain file to chat; the user runs them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output. Confirmation compiles run on scratch files. |
| Done | The triplet, toolchain, sysroot, and build-system wiring are stated for the target, every flag is confirmed against the GCC target-options documentation or the installed cross compiler, and each error in the request has a cause and fix. |

## Inputs

- Target: required. Architecture, OS or bare metal, ABI, and CPU when known.
- Host distribution: required for install commands; the package names below are Debian and Ubuntu names.
- Whether the program links target libraries beyond libc: required; decides whether a sysroot is needed.
- Build system: required. Plain compiler, Make, autoconf, or CMake.
- GCC line of the cross compiler, from `<triplet>-gcc --version`: required. Current stable is GCC 16.2; distribution cross packages often lag.

## Procedure

1. Choose the triplet `<arch>-<vendor>-<os>-<abi>`, three or four parts. Common values: `aarch64-linux-gnu` (64-bit ARM, glibc), `arm-linux-gnueabihf` (32-bit ARM, hard float), `arm-none-eabi` (bare-metal ARM), `riscv64-linux-gnu`, `mipsel-linux-gnu`, `x86_64-w64-mingw32` (Windows from Linux). Done when: one triplet is chosen.
2. Install and confirm the toolchain. Debian and Ubuntu: `apt install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu binutils-aarch64-linux-gnu`; bare-metal ARM: `apt install gcc-arm-none-eabi`. Confirm with `aarch64-linux-gnu-gcc --version`. Done when: the compiler prints its version.
3. Compile. Hosted: `aarch64-linux-gnu-gcc -O2 -o hello hello.c`, `aarch64-linux-gnu-g++ -O2 -std=c++20 -o hello hello.cpp`. Bare-metal Cortex-M4: `arm-none-eabi-gcc -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16 -ffreestanding -nostdlib -nostartfiles -T linker.ld -o firmware.elf startup.s main.c`. Target flags from the reference: `-march`, `-mcpu`, `-mthumb`, `-mfloat-abi=soft|softfp|hard`, `-mfpu`, and for AArch64 `-moutline-atomics`; RISC-V uses `-march=rv64gc -mabi=lp64d` style ISA strings. Done when: the compile command names the CPU and ABI.
4. Add a sysroot when the program links target libraries: `--sysroot=/path/to/sysroot` on every compile and link. Sources: a vendor image, `debootstrap --arch arm64 <suite> <dir>` for Debian, or the Yocto or Buildroot output tree. Confirm with `aarch64-linux-gnu-gcc --sysroot=<dir> -v -E - < /dev/null 2>&1 | grep sysroot`. Done when: the sysroot path appears in the compiler's verbose output.
5. Redirect pkg-config, which returns host paths by default: `export PKG_CONFIG_SYSROOT_DIR=<sysroot>`, `export PKG_CONFIG_LIBDIR=$PKG_CONFIG_SYSROOT_DIR/usr/lib/aarch64-linux-gnu/pkgconfig:$PKG_CONFIG_SYSROOT_DIR/usr/share/pkgconfig`, `export PKG_CONFIG_PATH=`. Check with `pkg-config --libs <lib>`. Done when: the printed paths are under the sysroot.
6. Wire the build system. Environment for Make and autoconf: `CC`, `CXX`, `AR`, `STRIP`, `OBJDUMP` set to the triplet-prefixed tools, and `./configure --host=aarch64-linux-gnu`. CMake toolchain file:

   ```cmake
   set(CMAKE_SYSTEM_NAME Linux)
   set(CMAKE_SYSTEM_PROCESSOR aarch64)
   set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
   set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)
   set(CMAKE_SYSROOT /path/to/sysroot)
   set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
   set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
   set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
   ```

   Configure with `cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=aarch64.cmake`. Done when: the build system resolves the cross compiler and searches only the sysroot for libraries.
7. Run under QEMU user mode: `apt install qemu-user-static`, then `qemu-aarch64-static ./hello`; with binfmt_misc registered the binary runs directly. Debug: `qemu-aarch64-static -g 1234 ./hello &` then `aarch64-linux-gnu-gdb -ex "target remote :1234" ./hello`. Done when: the binary runs or the debugger attaches.
8. Map errors from the table. Done when: each reported error has a cause and fix.

   | Error | Cause | Fix |
   |---|---|---|
   | `cannot execute binary file: Exec format error` | Target binary run on the host | Run under `qemu-<arch>-static` |
   | `wrong ELF class: ELFCLASS64` (or 32) | Object from another architecture in the link | One toolchain for every object; check `AR` and `CC` |
   | `ld: cannot find -lfoo` | Host library path used in a cross link | Set `--sysroot`; fix `PKG_CONFIG_LIBDIR` |
   | `undefined reference to '__aeabi_*'` | ARM runtime helpers missing from a `-nostdlib` link | Add `-lgcc` |
   | `relocation ... out of range` | Code or data too far apart for the relocation | `-mcmodel=large` or restructure |
   | `unrecognized opcode` | `-mcpu` or `-march` does not match the source | Set the CPU flags for the real target |

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No distribution package for the target | Point to the vendor toolchain download; do not invent a package name. |
| Sysroot lacks a needed library | Report the library as missing from the sysroot; the fix is to install it into the sysroot, not to use the host copy. |
| Windows target requested | Use the `x86_64-w64-mingw32` triplet; MSVC-flavored builds: use msvc-cl. |
| No system cross toolchain wanted | `zig cc -target` cross-compiles C without one: use zig-cross. |
| Assembly-level question | AArch64 or ARM assembly: use assembly-arm. |

## Output

A chat report with the triplet, install and confirmation commands, the compile command with target flags, sysroot and pkg-config settings when needed, the build-system wiring, the QEMU run or debug command, and the error table entries that apply. Flag details are in `references/arm-flags.md`.
