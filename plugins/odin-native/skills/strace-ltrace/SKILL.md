---
name: strace-ltrace
description: 'Use when a binary misbehaves without crashing and the question is which file, socket, syscall, or library call fails: strace for syscalls, ltrace for library calls. Not for stepping: use gdb.'
---

# strace and ltrace

`strace` (6.19 on the grounding host) prints every system call a process makes with its arguments, return value, and errno. `ltrace` (0.7.91) does the same for calls that go through PLT slots into shared libraries. Together they answer "what did the program ask the system for, and what did it get back" without a debugger or a rebuild, which is the fastest route to a missing file, a refused connection, or a permission error.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A program exits wrong, hangs, cannot find a file, cannot connect, is killed by a policy, or starts slowly, and the user wants to see its syscalls or library calls. |
| Authority | Reversible local: writes only trace output files named with `-o` in the working directory; rollback is deleting them. Attaching to a running process needs ptrace permission and is proposed, not forced. No remote mutation. |
| Side effect | The traced program runs slower: every traced syscall stops the process twice. `ltrace` costs more than `strace` because it breakpoints PLT entries. |
| Done | The failing call is named with its arguments, return value, and errno, and the report states the cause (missing path, wrong permission, closed descriptor, refused address) and the fix. |

## Inputs

- The command line to trace, or the PID of a running process for `-p`.
- The symptom, which picks the filter: file not found (`%file`), network (`%network`), process spawn (`%process`), memory (`%memory`), signals (`%signal`), descriptors (`%desc`), or everything (`all`).
- ptrace permission: attaching to another user's process or a process in a container needs `CAP_SYS_PTRACE` (containers: `--cap-add=SYS_PTRACE`); `/proc/sys/kernel/yama/ptrace_scope` at `1` restricts attaching to descendants.

## Procedure

1. Trace the whole run to a file first: `strace -f -o trace.txt ./myapp args`. `-f` follows forks and clones and prefixes lines with the PID; `-o` keeps the trace out of the program's own stderr. Attach to a live process with `strace -p <pid> -o trace.txt`. Done when: `trace.txt` ends with `+++ exited with N +++` or the attach is confirmed.
2. Filter to the syscall class the symptom points at. The class names take a `%` prefix (`file` without the prefix still works but is deprecated):

   ```bash
   strace -e trace=%file ./myapp          # open, openat, stat, access, unlink, rename
   strace -e trace=%network ./myapp       # socket, connect, bind, accept, sendto, recvfrom
   strace -e trace=%process ./myapp       # fork, clone, execve, wait4, exit_group
   strace -e trace=%memory ./myapp        # mmap, munmap, mprotect, brk
   strace -e trace=%signal ./myapp        # kill, rt_sigaction, rt_sigprocmask
   strace -e trace=%desc ./myapp          # close, dup, poll, epoll_wait
   strace -e trace=openat,read,write ./myapp
   ```

   Done when: the trace holds only the class under suspicion.
3. Show only failures. `strace -Z` prints only syscalls that returned an error (`-z` prints only successes); combine with a class: `strace -Z -e trace=%file ./myapp`. Each failing line has the form `openat(AT_FDCWD, "/etc/myapp.conf", O_RDONLY) = -1 ENOENT (No such file or directory)`, which names the path the program expected. Done when: the first failing call relevant to the symptom is identified.
4. Read the errno:

   | errno | Meaning | Usual cause |
   |---|---|---|
   | `ENOENT` | No such file or directory | Wrong path, missing config, missing shared library |
   | `EACCES` | Permission denied | File mode, ownership, SELinux or AppArmor label |
   | `EPERM` | Operation not permitted | Missing capability, seccomp, needs setuid |
   | `EADDRINUSE` | Address already in use | Port still bound by another process |
   | `ECONNREFUSED` | Connection refused | Nothing listening on the target port |
   | `ETIMEDOUT` | Connection timed out | Route or firewall drops the packets |
   | `EAGAIN` | Resource temporarily unavailable | Non-blocking descriptor; a retry is expected |
   | `EBADF` | Bad file descriptor | Descriptor closed or never opened |
   | `ENOMEM` | Out of memory | Allocation or mmap refused |
   | `ENOEXEC` | Exec format error | Binary for another architecture or a bad interpreter line |

   Done when: the errno is mapped to a cause in the program's own terms.
5. Add detail where the default output hides it. `-s 256` raises the string cutoff from 32 bytes; `-y` appends the path behind each descriptor (`3</etc/ld.so.cache>`); `-t`, `-tt`, `-ttt` add wall-clock timestamps at increasing precision; `-r` prints relative timestamps; `-T` prints the time spent inside each call; `-k` prints a stack trace per syscall so the caller in the program is visible without gdb; `-e verbose=all` expands structures; `-i` prints the instruction pointer. Done when: the failing call carries the detail the diagnosis needs.
6. Profile with the summary when the symptom is slowness: `strace -c ./myapp` prints one row per syscall with `% time`, `seconds`, `usecs/call`, `calls`, and `errors`. A high `usecs/call` marks a blocking call; a non-zero `errors` column marks retries; a high call count on `read` or `write` with small sizes marks missing buffering. Done when: the top syscall by time and the top by error count are named.
7. Trace library calls with `ltrace` when the failure is in user space above the syscall layer. Filters use `+` between symbols and glob patterns: `ltrace -e malloc+free+fopen ./myapp`, `ltrace -e 'pthread_*' ./myapp`, `ltrace -e 'dlopen+dlsym+dlclose' ./myapp`. `-l libfoo.so*` traces every call into one library; `-S` adds syscalls; `-n 2` indents nested calls; `-c` prints a call-count summary; `-p <pid>` attaches; `-s 256` widens strings. Each line reads `malloc(1024) = 0x55a1b2c3d000`. `ltrace` sees only PLT calls, so a statically linked or LTO-inlined call does not appear. Done when: the library call and its return value are named.
8. Verify the diagnosis by fixing the cause (create the file, open the port, grant the permission) and rerunning the same filtered trace. Done when: the failing line no longer appears and the program behaves.

Recipes for the common cases live in `references/strace-patterns.md`.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| `strace: attach: ptrace(PTRACE_SEIZE, N): Operation not permitted` | Yama scope or missing capability | Run as the process owner from a parent shell, propose `CAP_SYS_PTRACE`, or in containers `--cap-add=SYS_PTRACE` |
| Trace is empty or stops early | Program is a shell script or forks the real work | Add `-f`; check the `execve` line for the interpreter |
| Program killed by `SIGSYS` | seccomp policy denied a syscall | The last line before `+++ killed by SIGSYS +++` names the syscall; add it to the policy or avoid it |
| Strings truncated at 32 bytes | Default `-s` | `-s 256` or larger |
| `ltrace` shows nothing for a call | Not through a PLT slot (static, inlined, or `-fno-plt`) | Use `strace` for the syscall underneath, or `gdb` with a breakpoint |
| Timing changes hide a race | Tracing slows the process | Narrow with `-e trace=`, or reproduce under `perf trace` where available |

## Output

A diagnosis naming the failing syscall or library call with its full line from the trace, the errno and its cause in the program's terms, the fix applied or proposed, and the confirming rerun; plus the trace file paths.
