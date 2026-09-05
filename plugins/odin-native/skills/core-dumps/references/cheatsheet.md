# Core dump cheatsheet

Sources: `core(5)` man page, the GDB manual's core-file section, and the systemd `coredumpctl` documentation.

## Enable core dumps

```bash
# Per-session
ulimit -c unlimited

# Per-process, in code
#include <sys/resource.h>
struct rlimit rl = { RLIM_INFINITY, RLIM_INFINITY };
setrlimit(RLIMIT_CORE, &rl);

# Persistent, all users: /etc/security/limits.conf
*   soft   core   unlimited
*   hard   core   unlimited

# Check
ulimit -c
cat /proc/self/limits
```

## Core pattern configuration

```bash
cat /proc/sys/kernel/core_pattern

# Temporary
sudo sysctl -w kernel.core_pattern=/tmp/core-%e-%p-%t

# Persistent: /etc/sysctl.d/99-core.conf
kernel.core_pattern=/tmp/core-%e-%p-%t
kernel.core_uses_pid=1

sudo sysctl -p /etc/sysctl.d/99-core.conf
```

A pattern starting with `|` pipes the core to a handler instead of writing a file: `|/usr/lib/systemd/systemd-coredump ...` for systemd, `|/usr/share/apport/apport ...` for Ubuntu apport.

Core pattern tokens:

| Token | Meaning |
|---|---|
| `%e` | Executable filename, no path |
| `%E` | Executable path, `/` replaced by `!` |
| `%p` | PID in the process's PID namespace |
| `%P` | PID in the initial PID namespace |
| `%u` | UID |
| `%g` | GID |
| `%s` | Signal number |
| `%t` | Unix timestamp |
| `%h` | Hostname |
| `%c` | Core file size soft limit |

## systemd / coredumpctl

```bash
coredumpctl list                     # all recorded crashes
coredumpctl list myapp               # one executable
coredumpctl info                     # latest crash details
coredumpctl info 12345               # specific PID
coredumpctl gdb                      # latest crash in GDB
coredumpctl gdb myapp                # latest crash of one executable
coredumpctl dump 12345 -o /tmp/myapp.core   # export the core
ls /var/lib/systemd/coredump/        # storage location
```

To stop systemd from collecting cores, set `Storage=none` under `[Coredump]` in `/etc/systemd/coredump.conf`.

## Analyze with GDB

```bash
gdb ./prog /tmp/core-prog-12345-1700000000
gdb ./prog-with-debug-symbols /tmp/core   # stripped binary: use the debug build
```

```gdb
(gdb) bt                          # call stack
(gdb) bt full                     # stack plus locals
(gdb) info registers              # CPU registers at the crash
(gdb) frame 2
(gdb) info locals
(gdb) print ptr
(gdb) x/10wx $rsp                 # memory near the stack pointer
(gdb) thread apply all bt full    # every thread
(gdb) info signals                # signal handling table
(gdb) print $_siginfo             # signal details on Linux
(gdb) set print pretty on
(gdb) print *my_struct_ptr
(gdb) info symbol 0x7fff12345678  # what an address resolves to
(gdb) x/s 0x7fff12345678          # read it as a string
```

A `SIGABRT` backtrace usually means an assertion or `abort()`; walk up the frames to the check that fired.

## Analyze with LLDB

```bash
lldb ./prog -c core.12345
```

```lldb
(lldb) target create ./prog --core core.12345
(lldb) bt
(lldb) thread backtrace all
(lldb) frame select 2
(lldb) frame variable
(lldb) register read
(lldb) memory read -s8 -fx -c10 0x7fff0000
(lldb) thread info                # stop reason and signal
```

## debuginfod for symbols

```bash
sudo apt install debuginfod                       # Debian/Ubuntu
sudo dnf install elfutils-debuginfod-client       # Fedora/RHEL

export DEBUGINFOD_URLS="https://debuginfod.ubuntu.com https://debuginfod.elfutils.org"

gdb ./stripped-prog core          # GDB fetches automatically when the variable is set

readelf -n ./prog | grep 'Build ID'
debuginfod-find debuginfo <build-id-hex>
debuginfod-find source <build-id-hex> /path/to/source.c
DEBUGINFOD_PROGRESS=1 gdb ./prog core   # show fetch progress
```

Public debuginfod servers:

| Distro | URL |
|---|---|
| Ubuntu | `https://debuginfod.ubuntu.com` |
| Fedora | `https://debuginfod.fedoraproject.org` |
| Debian | `https://debuginfod.debian.net` |
| Arch Linux | `https://debuginfod.archlinux.org` |
| openSUSE | `https://debuginfod.opensuse.org` |
| Generic | `https://debuginfod.elfutils.org` |

## Non-interactive triage

```bash
gdb -batch \
    -ex 'set print thread-events off' \
    -ex 'thread apply all bt full' \
    -ex 'info registers' \
    -ex 'quit' \
    ./prog core 2>&1 | tee crash_report.txt

gdb -batch -ex 'bt full' -ex 'info registers' ./prog core

eu-readelf -n core | grep -i signal   # signal from core notes
file core                             # signal, PID, architecture
```

## macOS cores

```bash
ulimit -c unlimited
ls /cores/                            # /cores/core.<PID>
lldb ./prog -c /cores/core.12345

# Crash Reporter logs
ls ~/Library/Logs/DiagnosticReports/
ls /Library/Logs/DiagnosticReports/
```

## Stripping and symbol management

```bash
# Keep an unstripped copy indexed by build ID
BUILD_ID=$(readelf -n prog | grep 'Build ID' | awk '{print $3}')
mkdir -p /srv/symbols/${BUILD_ID:0:2}
cp prog /srv/symbols/${BUILD_ID:0:2}/${BUILD_ID:2}.debug

# Split and strip
objcopy --only-keep-debug prog prog.debug
strip --strip-debug prog
objcopy --add-gnu-debuglink=prog.debug prog

# Debug packages
sudo apt install myapp-dbgsym         # Debian/Ubuntu; or myapp-dbg
sudo dnf install myapp-debuginfo      # Fedora/RHEL

# Tell GDB where debug files live
(gdb) set debug-file-directory /usr/lib/debug:/srv/symbols
```
