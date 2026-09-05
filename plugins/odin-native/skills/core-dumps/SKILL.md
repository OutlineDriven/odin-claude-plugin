---
name: core-dumps
description: 'Use when loading core files in GDB or LLDB, enabling core dump generation via ulimit or coredumpctl, mapping symbols with debuginfod, or extracting backtraces from production segfaults.'
---

# Core dumps

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A program crashed and left a core file, cores need enabling on Linux or macOS, symbols are missing for a production binary, or a backtrace is needed without re-running the program. |
| Authority | Read-only. Emits analysis and commands for the operator to run on the target; no file writes, no rollback needed. No remote mutation. |
| Side effect | Diagnostic commands and a crash verdict in chat. Nothing is written. |
| Done | The crashing frame, signal, and faulting access are named, or the missing prerequisite (symbols, core file, build ID) is stated. |

## Inputs

1. Core file or crash record (required): a `core` file, a `coredumpctl` entry, or a `/cores/core.<PID>` file on macOS.
2. Binary (required): the exact executable that crashed, ideally the unstripped build.
3. Build ID or debug package access (optional): needed when the binary is stripped.

## Procedure

1. Enable cores on Linux.

   ```bash
   ulimit -c unlimited                 # this shell only
   ulimit -c                           # confirm
   cat /proc/self/limits               # per-process view
   ```

   Persist for all users in `/etc/security/limits.conf`:

   ```text
   *   soft   core   unlimited
   *   hard   core   unlimited
   ```

   Control where cores land:

   ```bash
   cat /proc/sys/kernel/core_pattern
   sudo sysctl -w kernel.core_pattern=/tmp/core-%e-%p-%t
   ```

   `%e` is the executable name, `%p` the PID, `%t` the timestamp. If the pattern starts with `|`, a pipe handler such as systemd-coredump or apport owns core collection; use step 2 instead of looking for files. Done when: `ulimit -c` reports unlimited and the pattern names a writable path or a known pipe handler.
2. Use coredumpctl when systemd collects cores.

   ```bash
   coredumpctl list                    # recorded crashes
   coredumpctl list myapp              # crashes of one executable
   coredumpctl info                    # details of the latest
   coredumpctl gdb                     # open the latest in GDB
   coredumpctl gdb 12345               # open a specific PID
   coredumpctl dump 12345 -o myapp.core   # export the core file
   ```

   Cores live in `/var/lib/systemd/coredump/`. Done when: the crash is listed and `coredumpctl gdb` opens it.
3. Enable cores on macOS.

   ```bash
   ulimit -c unlimited
   ls /cores/                          # cores land as /cores/core.<PID>
   ```

   Crash Reporter also writes `.crash` and `.ips` logs under `~/Library/Logs/DiagnosticReports/`. Done when: a core or crash report exists for the failed run.
4. Analyze the core with GDB.

   ```bash
   gdb ./prog core.12345
   gdb ./prog-with-symbols core.12345  # use the unstripped build when stripped
   ```

   ```gdb
   (gdb) bt                            # call stack
   (gdb) bt full                       # stack plus locals
   (gdb) info registers                # CPU state at the fault
   (gdb) frame 2                       # jump to a frame
   (gdb) info locals
   (gdb) print ptr
   (gdb) thread apply all bt full      # every thread
   (gdb) print $_siginfo               # signal details on Linux
   ```

   Done when: the crashing frame, the signal, and the faulting address are named.
5. Analyze the core with LLDB.

   ```bash
   lldb ./prog -c core.12345
   ```

   ```lldb
   (lldb) target create ./prog --core core.12345   # equivalent, inside LLDB
   (lldb) bt
   (lldb) thread backtrace all
   (lldb) frame select 2
   (lldb) frame variable
   (lldb) register read
   ```

   Done when: the crashing frame and faulting access are named.
6. Resolve missing symbols with debuginfod. debuginfod maps build IDs to DWARF data over HTTP.

   ```bash
   export DEBUGINFOD_URLS="https://debuginfod.ubuntu.com https://debuginfod.elfutils.org"
   gdb ./prog core                     # GDB fetches symbols automatically
   debuginfod-find debuginfo <build-id>
   debuginfod-find source <build-id> /path/to/file.c
   ```

   Done when: symbols resolve, or the build ID is recorded for manual lookup.
7. Resolve symbols manually when debuginfod cannot help.

   ```bash
   readelf -n ./prog | grep 'Build ID'
   ```

   Install the matching debug package (`prog-dbgsym` or `prog-dbg` on Debian, `prog-debuginfo` on Fedora/RHEL), then point GDB at it:

   ```gdb
   (gdb) set debug-file-directory /usr/lib/debug
   ```

   Done when: GDB loads the matching debug file and `bt` shows function names.
8. Strip for distribution while keeping symbols. Build with symbols, split them out, ship the stripped binary.

   ```bash
   objcopy --only-keep-debug prog prog.debug
   objcopy --strip-debug prog prog.stripped
   objcopy --add-gnu-debuglink=prog.debug prog.stripped
   ```

   `eu-strip -f prog.debug prog` does the split in one step. Keep `prog.debug` in a symbol store indexed by build ID. Done when: the stripped binary resolves symbols through its `.gnu_debuglink`.
9. Triage without an interactive session.

   ```bash
   gdb -batch -ex 'bt full' -ex 'thread apply all bt full' ./prog core 2>&1 | tee crash.txt
   gdb -batch -ex 'info registers' ./prog core
   file core                           # signal, PID, architecture
   ```

   Done when: `crash.txt` holds the backtrace and register state.

For the core-pattern token table, the public debuginfod server list, and the full command set, see `references/cheatsheet.md`.

## Failure and recovery

- No core file exists: check `ulimit -c`, the `kernel.core_pattern` target, and whether a pipe handler intercepted the dump. Re-run the failing program after fixing the limit.
- `coredumpctl list` is empty: cores may go to files instead; check `core_pattern` and the filesystem it names.
- GDB reports `no debugging symbols found`: fetch them through debuginfod (step 6) or install the debug package (step 7). A stripped binary still yields addresses and a usable `bt` skeleton.
- The core does not match the binary: GDB warns about mismatched build IDs. Locate the exact binary by build ID; do not trust a same-named rebuild.
- Corrupted stack: `bt` stops early or shows `??` frames. Read `info registers` and walk the stack pointer manually with `x/`.

## Output

A crash verdict naming the signal, the faulting frame and address, and the register state, plus the symbol-resolution path used (unstripped binary, debug package, or debuginfod).
