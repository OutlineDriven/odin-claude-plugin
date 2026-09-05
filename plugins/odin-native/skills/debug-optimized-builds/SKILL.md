---
name: debug-optimized-builds
description: 'Use when debugging RelWithDebInfo or -O2 release builds, using -Og for debuggable optimization, split-DWARF, GDB scheduler-locking, reading inlined frames, or understanding "value optimized out".'
---

# Debugging optimized builds

## Contract

| Field | Bound contract |
|---|---|
| Trigger | GDB reports `<optimized out>`, breakpoints land on wrong lines, a release or RelWithDebInfo build needs debugging, inlined frames confuse the backtrace, or a debuggable optimized build needs configuring. |
| Authority | Read-only. Emits analysis and commands for the operator to run on the target; no file writes, no rollback needed. No remote mutation. |
| Side effect | Diagnostic commands and a verdict in chat. Nothing is written. |
| Done | The optimized-build obstacle is named, the workaround is applied or stated, and program state is observable at the needed point. |

## Inputs

1. Build configuration (required): the optimization and debug flags in use, or the CMake build type.
2. Symptom (required): `<optimized out>` values, wrong-line breakpoints, inlined frames, or a crash in a release binary.
3. Rebuild access (optional): needed when the fix is a different optimization level.

## Procedure

1. Pick the build configuration for the goal.

   | Goal | Flags |
   |---|---|
   | Full debuggability, no optimization | `-O0 -g` |
   | Debuggable with some optimization | `-Og -g` |
   | Release with debug info for crash analysis | `-O2 -g -gsplit-dwarf` |
   | Shipped binary, no symbols | `-O2 -DNDEBUG` |

   `-Og` enables the optimizations that do not interfere with debugging: variables stay where GDB can see them and line numbers stay accurate. GCC and Clang both accept it.

   ```bash
   gcc -Og -g -Wall main.c -o prog
   cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug          # -O0 -g
   cmake -S . -B build -DCMAKE_BUILD_TYPE=RelWithDebInfo # -O2 -g -DNDEBUG
   cmake -S . -B build -DCMAKE_BUILD_TYPE=Release        # -O2 -DNDEBUG
   ```

   Done when: the flags match the goal.
2. Handle `<optimized out>`. The compiler decided the value needs no storage at this point: it lives only in a register, was folded to a constant, or is dead past this line. Workarounds:

   ```c
   volatile int counter = 0;                    // forces storage; changes semantics, use sparingly
   int counter2 __attribute__((used)) = 0;      // keeps the symbol
   ```

   ```cmake
   set_source_files_properties(tricky.c PROPERTIES COMPILE_FLAGS "-O0")
   ```

   Or read the value where it lives: `info registers`, then `p/x $rax`. Rebuilding the one translation unit at `-O0` or the whole build at `-Og` is cleaner than `volatile`. Done when: the value is recovered or the variable is made observable.
3. Read inlined frames. With optimization, GDB lists inlined calls as their own frames in `bt`; they show the call chain that was folded into the real frame.

   ```gdb
   (gdb) bt
   (gdb) frame 2                 # select the inlined frame
   (gdb) up / down               # move through real and inlined frames
   (gdb) break process_packet    # hits every inline expansion of the function
   (gdb) break network.c:45      # may resolve to several inlined call sites
   ```

   Done when: the real call chain is reconstructed.
4. Cope with line drift. Optimizers reorder instructions, so the reported line jumps.

   ```gdb
   (gdb) disassemble /s function_name   # source interleaved with asm
   (gdb) si / ni                        # step one instruction
   (gdb) layout split                   # TUI: source and asm side by side
   (gdb) set disassemble-next-line on
   (gdb) jump *0x400a2c                 # resume at an address when line stepping lies
   ```

   Done when: execution position is tracked at instruction level.
5. Lock the scheduler for multithreaded optimized code. Other threads racing ahead during a step hide the bug.

   ```gdb
   (gdb) set scheduler-locking step   # only the current thread steps; all run on continue
   (gdb) set scheduler-locking on     # only the current thread runs at all
   (gdb) set scheduler-locking off    # default: all threads run freely
   ```

   `replay` locks only during reverse execution. Done when: stepping is deterministic.
6. Use split DWARF for faster debug builds. `-gsplit-dwarf` moves debug info into `.dwo` sidecar files, so the linker never sees it.

   ```bash
   gcc -g -gsplit-dwarf -O2 -c file.c -o file.o   # makes file.o plus file.dwo
   gcc -g -gsplit-dwarf file.o -o prog            # binary references, not embeds, DWARF
   gdb prog                                       # finds .dwo next to the binary
   dwp -o prog.dwp prog                           # package .dwo files into one .dwp
   ```

   CMake: `add_compile_options(-gsplit-dwarf)`. Done when: link input shrinks and GDB still resolves symbols.
7. Inspect state when variable info is gone.

   ```gdb
   (gdb) info locals / info args        # may print <optimized out>
   (gdb) call (int)my_func(42)          # evaluate by calling the real function
   (gdb) watch *0x7fffffffe430          # watch an address, not a name
   (gdb) x/10xw $rsp                    # raw memory
   (gdb) bt                             # addresses still resolve without symbols
   (gdb) info sharedlibrary             # loaded libraries for symbol resolution
   ```

   Done when: program state is read despite missing variable info.

## Failure and recovery

- `<optimized out>` on the exact variable needed: rebuild that translation unit at `-O0`, or rebuild at `-Og`. Do not sprinkle `volatile` through the codebase for the debugger's sake.
- Breakpoint never hits: the line was optimized away or inlined. Break on the function name or on an address from `disassemble /s`.
- Stepping changes the bug: enable `set scheduler-locking step` and retry.
- `.dwo` files missing after a move: GDB cannot resolve split debug info. Keep `.dwo` files beside the objects, or package them with `dwp`.
- LTO builds lose still more info: see the LTO section of `dwarf-debug-format` for what survives.

## Output

A working debug configuration for the optimized build, the recovered program state, and the named cause of each observability loss.
