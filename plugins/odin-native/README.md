# ODIN Native

ODIN workflows for native systems, toolchains, and performance.

147 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-native@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-native@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-native/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-native:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| abi-and-calling-conventions | Use when explaining System V AMD64, ARM AAPCS, RISC-V psABI, stack frames, variadic calls, or FFI register rules. |
| adc-dac-baremetal | Use when configuring ADC sampling time, DMA-driven ADC, calibration, or DAC channel setup on bare-metal MCUs. |
| af-xdp | Use when creating AF_XDP sockets, configuring UMEM and XSK rings, writing an XDP redirect program, or choosing copy versus zero-copy mode. |
| apple-silicon | Use when tuning or profiling native code on Apple M-series Macs: unified memory, 16 KiB pages, Accelerate and Metal for matrix work, xctrace and leaks, Rosetta 2, or sysctl hardware queries. |
| arm-sve | Use when writing or porting AArch64 SIMD to SVE or SVE2: arm_sve.h intrinsics, predicates, vector-length-agnostic loops, auto-vectorization, or SVE registers in GDB. |
| assembly-arm | Use when reading or writing AArch64 or AArch32 Thumb assembly, inline asm in C, AAPCS64 register roles, or NEON and SVE vector code. |
| assembly-riscv | Use when reading or writing RV32/RV64 assembly, inline asm in C, the RISC-V psABI, IMAFD extension naming, compressed instructions, or QEMU RISC-V debugging. |
| assembly-x86 | Use when reading GCC or Clang x86-64 assembly, writing inline asm, decoding AT&T syntax, or applying System V AMD64 register rules. |
| baremetal-startup | Use when writing reset-to-main startup code, vector tables, VTOR, .data/.bss init, stack setup, startup.s, or crt0 for Cortex-M/RISC-V. |
| bazel | Use when writing Bazel BUILD files with cc_library or cc_binary rules, Bzlmod dependencies, toolchain registration, remote execution, sandbox debugging, or bazel query and cquery graphs. |
| binary-hardening | Use when enabling RELRO, PIE, stack canaries, FORTIFY_SOURCE, CET, CFI, or seccomp filters, or checking a binary with checksec. |
| binutils | Use when building static archives with ar, stripping or converting binaries, mapping crash addresses with addr2line, or demangling C++ symbols. |
| bootloaders-embedded | Use when writing a custom bootloader, jumping to application code, relocating VTOR, or implementing DFU/USB firmware update on Cortex-M. |
| branch-prediction-and-speculation | Use when explaining branch predictors, mispredict penalties, speculative execution, Spectre or Meltdown mitigations, or branchless code. |
| build-acceleration | Use when reducing C/C++ compilation times with ccache, sccache, distcc, unity builds, precompiled headers, split DWARF, IWYU, or link time reduction. |
| bus-drivers-i2c-spi | Use when writing a Linux i2c_driver or spi_driver, doing bus register access, DMA-safe SPI transfers, or debugging -EREMOTEIO. |
| c-hardening-baseline | Use when C code is written or audited and needs a pure-C baseline: standard, undefined behavior, integer and buffer safety, sanitizers, fuzzing, build flags. |
| carbon-lang | Use when evaluating Carbon for a C++ code base, running the carbon toolchain from a nightly or Bazel build, or comparing Carbon with staying on C++. |
| cargo-workflows | Use when managing Cargo workspaces, feature flags, build scripts, CI caching, dependency auditing, or Cargo.lock with Rust. |
| clang | Use when a C or C++ build uses clang and needs diagnostics, optimization remarks, clang-tidy, ThinLTO with lld, LLVM PGO, or a GCC-to-Clang migration. |
| cmake | Use when writing CMakeLists.txt, out-of-source builds, target_link_libraries, target properties, find_package/FetchContent, toolchain files, CPack, CMake presets, or cmake configure errors. |
| code-generation-and-backends | Use when reading llc output, tracing IR through legalization and instruction selection, or scoping a new LLVM target. |
| compiler-frontend | Use when building a lexer, Pratt or recursive-descent parser, AST, symbol table, type checker, or LLVM IR emitter for a language or DSL. |
| compiler-optimizations-deep | Use when -O3 leaves a hot loop scalar, spills appear in assembly, or a PGO or BOLT deployment is planned or stalls. |
| conan-vcpkg | Use when adding C/C++ dependencies with Conan or vcpkg, managing binary compatibility, integrating with CMake via conanfile.txt or vcpkg.json, or choosing between Conan and vcpkg. |
| concurrency-debugging | Use when reading TSan race reports, debugging deadlocks with GDB thread inspection, analyzing Helgrind lock-order violations, or reviewing std::atomic and happens-before usage. |
| containers-internals | Use when explaining or building on Linux container primitives: namespaces, cgroups v2, overlayfs, runc and the OCI spec, seccomp-bpf, capabilities, or escapes. |
| core-dumps | Use when loading core files in GDB or LLDB, enabling core dump generation via ulimit or coredumpctl, mapping symbols with debuginfod, or extracting backtraces from production segfaults. |
| cpp-coroutines | Use when working with C++20 co_await, co_yield, and co_return, implementing promise_type, sizing coroutine frames, or debugging suspended coroutines in GDB. |
| cpp-modules | Use when a C++ project adopts C++20 modules: named modules, partitions, header units, the global module fragment, CMake CXX_MODULES, or a BMI lookup error. |
| cpp-templates | Use when a C++ template error needs decoding, a template needs a concept or requires-clause instead of SFINAE, or template instantiation is slowing compilation. |
| cpu-cache-opt | Use when diagnosing cache misses with perf, fixing false sharing, choosing AoS or SoA layout, or adding software prefetch. |
| cpu-kernel-authoring | Use when writing, optimizing, or benchmarking a C++ CPU kernel with AVX2 or AVX512 intrinsics for the Hugging Face kernels ecosystem. |
| cpu-pipelines-and-hazards | Use when explaining pipeline stages, data or control hazards, forwarding, stalls, or superscalar basics behind a counter reading. |
| cross-gcc | Use when compiling for ARM, AArch64, RISC-V, or MIPS from x86-64 with a GCC cross toolchain: triplets, sysroots, pkg-config, CMake toolchain files, QEMU. |
| cuda | Use when writing CUDA kernels, managing the thread, block, and grid hierarchy, tiling shared memory, using streams, setting nvcc flags, or using Thrust. |
| cuda-debugging | Use when debugging CUDA with cuda-gdb or Compute Sanitizer, reading GPU core dumps, using device printf, or triaging error codes 700, 701, 702, and 719. |
| cuda-profiling | Use when profiling CUDA with Nsight Systems or Nsight Compute, reading roofline and occupancy metrics, or annotating phases with NVTX. |
| custom-allocators | Use when implementing pool/slab/arena allocators, tuning jemalloc/mimalloc/tcmalloc, writing a Rust GlobalAlloc, or benchmarking allocator performance and fragmentation. |
| datasheet-and-refmanual-reading | Use when extracting pinouts, electrical limits, register maps, clock trees, timing, or errata from MCU datasheets and reference manuals. |
| debug-optimized-builds | Use when debugging RelWithDebInfo or -O2 release builds, using -Og for debuggable optimization, split-DWARF, GDB scheduler-locking, reading inlined frames, or understanding "value optimized out". |
| device-drivers | Use when writing or fixing a Linux device driver: platform/i2c/spi probe and remove, char device lifecycle, threaded IRQs, DMA mappings, regmap, runtime PM, or udev rules. |
| device-tree | Use when writing DTS/DTSI, bindings, overlays, phandles, or debugging OF platform probe failures. |
| dma-baremetal | Use when configuring DMA channels, circular buffer mode, double buffering, memory-to-peripheral transfers, or DMA IRQ completion on bare-metal MCUs. |
| dpdk | Use when initializing EAL, configuring PMD drivers and huge pages, using mbuf pools and rte_ring, setting up RSS, or validating a port with testpmd. |
| dwarf-debug-format | Use when inspecting .debug_info or .debug_line sections with dwarfdump or readelf, working with split-DWARF .dwo files, setting up debuginfod, or checking how LTO and stripping affect debug info. |
| dwarf-expert | Use when inspecting, searching, verifying, or parsing DWARF debug info: DIEs, DW_TAG_/DW_AT_ entries, .debug_* sections, line tables, or llvm-dwarfdump/readelf output. |
| dynamic-linking | Use when debugging shared library load failures, setting RPATH or RUNPATH, applying soname versioning, writing dlopen plugins, or intercepting with LD_PRELOAD. |
| ebpf | Use when writing eBPF programs with libbpf or bpftrace, attaching kprobes, tracepoints, or XDP hooks, triaging verifier errors, choosing maps, or porting with CO-RE. |
| ebpf-rust | Use when writing eBPF programs in Rust with aya-ebpf and aya-log, declaring maps, sharing them with a tokio user-space loader, or debugging an Aya load failure. |
| elf-inspection | Use when examining ELF binaries with readelf, objdump, nm, or ldd: dependencies, symbols, sections, relocations, build IDs, or hardening. |
| embedded-rust | Use when writing no_std Cortex-M or RISC-V firmware in Rust with cortex-m-rt, probe-rs, defmt, RTIC, or a panic handler. |
| flamegraphs | Use when turning perf, DTrace, pprof, or async-profiler stacks into an SVG flamegraph with the FlameGraph scripts, reading one, or diffing two profiles. |
| freertos | Use when creating FreeRTOS tasks, queues, semaphores, or mutexes, catching stack overflow, writing FreeRTOSConfig.h, or debugging tasks over OpenOCD and GDB. |
| gcc | Use when a C or C++ build uses GCC and needs build-mode flags, warning triage, debug info, LTO, PGO, or a compilation error explained. |
| gdb | Use when running GDB: breakpoints, watchpoints, segfault or hang debugging, reverse debugging, remote gdbserver, core dumps, pretty-printers, Python scripting, or multi-threaded debugging. |
| gpio-baremetal | Use when configuring GPIO modes, alternate functions, pull resistors, or EXTI interrupts on STM32/nRF/ESP32-class MCUs. |
| gpu-memory-model | Use when analyzing warp divergence, memory coalescing, shared memory bank conflicts, cache behavior, atomics, or occupancy tradeoffs on NVIDIA and AMD GPUs. |
| hardware-counters | Use when measuring PMU events with perf stat -e or PAPI, computing IPC, miss rates, or MPKI, or attributing cache misses to source lines with perf annotate. |
| hare-lang | Use when building or evaluating a Hare program: hare build, run, or test, tagged-union error handling, or calling C through bodyless fn declarations and -l. |
| heaptrack | Use when tracking heap allocations on Linux with heaptrack: allocation hotspots, peak heap, temporary allocations, leaks, or a diff of two runs via heaptrack_print. |
| hip-rocm | Use when writing HIP kernels with hipcc, porting CUDA code through HIPIFY, profiling with rocprofv3, debugging with rocgdb, or optimizing for MI300X. |
| hypervisor-internals | Use when studying Intel VT-x or AMD-V internals: VMCS and VMCB, EPT and NPT, VM exit handling, APIC virtualization, or building a minimal type-1 hypervisor. |
| idiomatic-rust | Use when writing, reviewing, or refactoring Rust code. |
| include-what-you-use | Use when reducing header bloat and compilation cascades with Include What You Use, interpreting IWYU reports, mapping files, forward declarations, or CMake integration. |
| intel-vtune-amd-uprof | Use when profiling with Intel VTune or AMD uProf for hotspots, top-down pipeline stalls, memory-bound analysis, or roofline data. |
| interpreters | Use when designing bytecode dispatch loops, choosing stack or register VM shapes, adding inline caches, or building a first JIT with mmap. |
| interrupts-and-exceptions-baremetal | Use when writing Cortex-M NVIC ISRs, configuring priorities, handling HardFault, tail-chaining, or measuring interrupt latency. |
| io-uring | Use when building Linux servers with liburing, batching SQEs, multi-shot operations, provided buffer rings, registered files and buffers, or zero-copy send. |
| jit-compilation | Use when adding code generation with LLVM ORC or LLJIT, Cranelift, or dynasm, lazy compilation or inline caches, or fixing W^X faults. |
| kernel-concurrency | Use when choosing kernel spinlocks versus mutexes, using RCU, seqlocks, completions, or memory barriers, or debugging scheduling-while-atomic. |
| kernel-debugging | Use when debugging the Linux kernel: kgdb and kdb, ftrace and kprobes, dynamic debug, kdump and crash analysis, or printk levels on a live or crashed target. |
| kernel-debugging-advanced | Use when tracing kernel functions with ftrace or trace-cmd, profiling with perf, kprobes, or dyndbg, or analyzing a vmcore with crash. |
| kernel-internals | Use when diagnosing scheduler latency, kmalloc vs vmalloc, page cache, meminfo under pressure, or OOM victim choice, or when reading kernel/sched, mm, or fs source. |
| kernel-memory-management | Use when using kmalloc, vmalloc, or the page allocator, sizing kmalloc allocations, working with SLUB or the buddy allocator, or debugging memory zones and kernel OOM. |
| kernel-security | Use when writing an SELinux or AppArmor policy, a seccomp-bpf filter, enabling CET, PAC, or BTI, or triaging a kernel CVE. |
| kernel-testing | Use when writing KUnit tests, adding kselftest cases, fuzzing syscalls with syzkaller and kcov, running LTP, or wiring CI for a kernel patch. |
| linker-scripts | Use when writing a GNU ld script for a bare-metal target, placing code in a flash or RAM region, wiring .data and .bss startup, or fixing a region overflowed error. |
| linkers-lto | Use when choosing a linker, fixing link order or undefined symbol errors, enabling LTO or ThinLTO, or cutting dead code with --gc-sections. |
| linux-kernel-architecture | Use when navigating kernel source, understanding boot flow, initcall levels, or major subsystems (VFS, scheduler, MM) in linux.git. |
| linux-kernel-modules | Use when writing loadable kernel modules: Kbuild, module parameters, proc and sysfs entries, char devices, or ftrace debugging. |
| linux-perf | Use when collecting sampling profiles with perf record, reading perf report or perf annotate, or measuring counters with perf stat on Linux. |
| lldb | Use when debugging with LLDB on macOS, FreeBSD, or Linux-clang, mapping GDB commands to LLDB, Xcode or VS Code integration, LLDB Python scripting, or debugging Swift and Objective-C. |
| llvm | Use when working with LLVM IR as a user: emitting IR from clang, running opt passes, lowering with llc, reading IR, or finding a missed optimization. |
| llvm-ir-and-passes | Use when reading LLVM IR, explaining SSA and PHI nodes, finding what -O2 changed, or running opt on a .ll or .bc file. |
| llvm-passes | Use when writing an LLVM pass plugin, registering it for opt -passes, using DominatorTree or LoopInfo, or testing with FileCheck and lit. |
| low-power-embedded | Use when configuring MCU sleep/stop/standby, WFI, STM32 PWR, nRF sleep, clock gating, wake-up EXTI sources, or measuring current draw. |
| make | Use when writing or debugging Makefiles, understanding pattern rules and automatic dependency generation, managing CFLAGS/LDFLAGS, or diagnosing incremental build, phony targets, or recursive make. |
| memory-hierarchy-and-caches | Use when explaining cache levels, associativity, cache lines, false sharing, prefetching, or MESI coherence. |
| memory-model | Use when choosing memory orderings for C++ or Rust atomics, reasoning about happens-before, writing lock-free patterns, or diagnosing data races. |
| meson | Use when setting up a Meson project, meson setup/compile/test, wrap dependencies, cross-file cross-compiling, meson.build, or migrating from CMake/Autotools to Meson. |
| mlir | Use when defining an MLIR dialect with ODS, writing a lowering with ConversionPattern, running mlir-opt pipelines down to the LLVM dialect, or importing models via Torch-MLIR or IREE. |
| mmio-and-bit-manipulation | Use when accessing memory-mapped peripherals with volatile, bit masks, read-modify-write, register alignment, or endianness in bare-metal firmware. |
| modern-cpp-practices | Use when C++ code is being written or reviewed and the compiler supports modern safe idioms. |
| mpi | Use when writing or debugging MPI programs: sends and receives, collectives, non-blocking requests, communicators, MPI-IO, hybrids with OpenMP, or mpirun launches. |
| msvc-cl | Use when building C or C++ on Windows with cl.exe or clang-cl: GCC-to-MSVC flag translation, /MT versus /MD, PDB output, or an LNK error. |
| ninja | Use when diagnosing Ninja build failures, tuning parallelism, interpreting verbose output, or working with build.ninja files as a CMake-generated low-level build executor. |
| numa-programming | Use when detecting NUMA topology, binding processes with numactl, using the libnuma API, building NUMA-aware data structures, or measuring remote memory access penalties. |
| openmp | Use when parallelizing loops or tasks with OpenMP: parallel for, schedules, reductions, data sharing, simd, target offload, OMP_* tuning, or false sharing. |
| openocd-jtag | Use when configuring OpenOCD for a JTAG or SWD target, flashing through it, attaching GDB to a bare-metal MCU, or setting hardware breakpoints and watchpoints. |
| os-dev-scratch | Use when building a minimal x86-64 OS: boot protocols, long mode, page tables, IDT, PIC/APIC, serial and keyboard drivers, frame allocator, or context switching. |
| peripherals-from-datasheet | Use when writing a register-level peripheral driver from an MCU reference manual: register map, init sequence, timing, bit definitions. |
| pgo | Use when a C or C++ binary needs profile-guided optimization with GCC or Clang: instrumented or sampled profiles, merging, the two-stage build, or BOLT. |
| platform-device-model | Use when implementing or debugging platform_driver probe/remove, sysfs attributes, device properties, or deferred probe on Linux. |
| production-go | Use when writing, reviewing, debugging, or architecting Go code. |
| protocol-analysis | Use when decoding I2C, SPI, or UART captures with sigrok or PulseView, checking bus traffic against a datasheet, or post-processing captures in Python. |
| qemu-embedded-simulation | Use when running ARM or RISC-V bare-metal firmware in QEMU: machine selection, -kernel ELF loading, semihosting, or GDB debugging without hardware. |
| qemu-for-kernel-development | Use when booting custom kernels in QEMU, building Buildroot or Yocto rootfs, attaching virtio devices, or iterating kernel modules over NFS or 9p root. |
| qemu-kvm | Use when running qemu-system-x86_64 with KVM, wiring virtio devices, passing a PCI device through with VFIO, driving QMP, using virsh or virt-install, or booting a kernel with -kernel and -append. |
| rdma-verbs | Use when programming InfiniBand or RoCE with libibverbs: device setup, memory registration, queue pairs, send/recv or RDMA write, completion polling, or perftest benchmarks. |
| resource-optimization-lowend | Use when reducing flash or RAM usage on constrained MCUs, analyzing stack depth, reading linker map files, or tuning -Os size-versus-speed tradeoffs on bare-metal and small RTOS images. |
| reverse-engineering | Use when triaging an unknown binary, decompiling with Ghidra, scripting radare2, or diffing two builds for patched functions. |
| riscv-privileged | Use when writing RISC-V M-mode or S-mode code: CSRs, trap handlers, PLIC and CLINT interrupts, OpenSBI payloads, Sv39 or Sv48 page tables, or QEMU virt boot. |
| rust-async-internals | Use when understanding the Rust Future poll model, Pin and Unpin, tokio scheduling, async stack traces, waker leaks, or select!/join! behavior. |
| rust-build-times | Use when profiling slow Rust builds with cargo --timings, configuring sccache, selecting the Cranelift dev backend, splitting a workspace for parallelism, or tuning LTO and the linker. |
| rust-cross | Use when building Rust binaries for a different target architecture or OS, using cross or cargo-zigbuild, configuring .cargo/config.toml, or targeting embedded bare-metal. |
| rust-debugging | Use when debugging Rust binaries with GDB or LLDB, enabling pretty-printers, interpreting panics and backtraces, debugging async with tokio-console, or stepping through no_std code. |
| rust-ffi | Use when calling C libraries from Rust, generating bindings with bindgen, exporting Rust functions to C with cbindgen, writing safe wrappers over unsafe FFI, or linking system libraries. |
| rust-no-std | Use when writing #![no_std] Rust crates, using core and alloc without std, selecting panic handlers, or testing no_std code on the host. |
| rust-profiling | Use when profiling Rust binaries with flamegraphs, cargo-bloat, cargo-llvm-lines, Criterion, perf, heaptrack, or DHAT. |
| rust-sanitizers-miri | Use when running AddressSanitizer, ThreadSanitizer, MemorySanitizer, UndefinedBehaviorSanitizer, or Miri on Rust code, interpreting sanitizer output, or validating unsafe code for undefined behaviour. |
| rust-security | Use when auditing Rust dependencies for vulnerabilities, enforcing license and source policies with cargo-deny, reviewing RUSTSEC advisories, or fuzzing and testing unsafe code for security. |
| rust-unsafe | Use when writing, reviewing, or auditing unsafe Rust, or understanding raw pointers, transmute, UnsafeCell, and safe abstractions over unsafe code. |
| rustc-basics | Use when selecting RUSTFLAGS, configuring Cargo profiles, tuning release builds, reading assembly or MIR output, understanding monomorphization, or diagnosing compilation errors. |
| sanitizers | Use when enabling or interpreting ASan, UBSan, TSan, MSan, LSan, or HWASan with GCC or Clang, or reading sanitizer reports. |
| simd-intrinsics | Use when reading auto-vectorization reports, writing SSE2, AVX2, or NEON intrinsics, or fixing vectorization failures. |
| spi-i2c-baremetal | Use when implementing SPI/I2C master transfers, register read/write protocols, I2C START/STOP, clock phase/polarity, or bus stalls on bare-metal MCUs. |
| static-analysis | Use when hardening C/C++ code quality with clang-tidy, cppcheck, or scan-build, interpreting check categories, suppressing false positives, integrating into CI, or working with compile_commands.json. |
| stm32-baremetal | Use when scaffolding STM32 firmware without HAL, CMSIS-only clock/RCC config, STM32F4/H7 bring-up, or building with arm-none-eabi-gcc for Cortex-M. |
| strace-ltrace | Use when a binary misbehaves without crashing and the question is which file, socket, syscall, or library call fails: strace for syscalls, ltrace for library calls. |
| timers-pwm-baremetal | Use when configuring general-purpose timers for PWM, input capture, periodic ticks, timer prescaler, PWM duty cycle, or SysTick without an RTOS. |
| triton-lang | Use when writing Triton kernels with @triton.jit, tl.load and tl.store with masking, tl.atomic_add, autotuning, benchmarking, or integrating kernels into PyTorch. |
| uart-serial-baremetal | Use when configuring UART baud rate/BRR, polling or IRQ-driven TX/RX, serial printf retargeting, USART interrupts, or UART with DMA on bare-metal MCUs. |
| valgrind | Use when running Valgrind Memcheck for heap errors, leaks, or uninitialised reads on an unmodified binary, or Cachegrind, Callgrind, or Massif profiling. |
| verilog-basics-for-lowlevel | Use when reading RTL to understand hardware behavior, reset and clock domains, CDC synchronizers, APB/AHB/AXI bus protocols, or collaborating with hardware teams on SoC diagrams. |
| virtual-memory-paging-and-tlb | Use when explaining page faults, multi-level page tables, TLB misses, huge pages, or mmap and brk behavior. |
| wasm-emscripten | Use when compiling C or C++ to WebAssembly with emcc, exporting functions to JavaScript, sizing WASM memory, using Asyncify, or debugging .wasm. |
| wasm-wasmtime | Use when running WASM with the wasmtime CLI, embedding wasmtime in Rust, limiting execution with fuel, or building WASI preview2 components. |
| writing-char-drivers | Use when writing a Linux char driver: file_operations, cdev, copy_to_user, ioctl commands, device memory mmap, or poll. |
| zephyr | Use when building a Zephyr app with west, picking a board target, editing prj.conf or a devicetree overlay, adding logging, running on native_sim, or using west debug. |
| zig-build-system | Use when writing or fixing a build.zig: executables, libraries, modules, C sources, build options, test steps, custom steps, or build.zig.zon dependencies. |
| zig-cinterop | Use when Zig code calls C or C code calls Zig: @cImport, translate-c, C type mapping, extern and packed structs, export fn, opaque handles, or a mixed C and Zig build. |
| zig-compiler | Use when invoking zig directly: build-exe, build-lib, optimize modes, zig cc as a C compiler, emit flags, ast-check, fmt, or a Zig compile error. |
| zig-comptime | Use when Zig code needs compile-time evaluation: comptime parameters, generic types, anytype, @typeInfo reflection, comptime tables, or a ported C++ template pattern. |
| zig-cross | Use when building Zig or C for another platform with Zig: target triples, -mcpu features, zig cc cross-compiles, multi-target build.zig, bare-metal Cortex-M, or WebAssembly. |
| zig-debugging | Use when a Zig program panics, returns an error trace, or needs stepping in GDB or LLDB, print or std.log tracing, or a comptime value printed. |
| zig-testing | Use when writing or running Zig tests: test blocks, zig test, filters, std.testing assertions, the leak-detecting allocator, comptime tests, or the fuzzer. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
