---
name: kernel-debugging
description: 'Use when debugging the Linux kernel: kgdb and kdb, ftrace and kprobes, dynamic debug, kdump and crash analysis, or printk levels on a live or crashed target.'
---

# Kernel debugging

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A kernel panic or oops with an unclear trace, live debugging of a module with kgdb or kdb, tracing a function without recompiling, enabling driver debug output, or analyzing a vmcore. |
| Authority | Read-only. Emits analysis and commands for the operator to run on the target; no file writes, no rollback needed. No remote mutation. |
| Side effect | Diagnostic commands and an evidence-backed verdict in chat. Nothing is written. |
| Done | The failing path is named with evidence from a trace, backtrace, or crash session, or the next diagnostic step is stated with the reason. |

## Inputs

1. Symptom (required): panic, oops, hang, lockup, or wrong behavior.
2. Target access (optional): serial console, root shell, mounted debugfs, or a vmcore file.
3. Kernel build (optional): `vmlinux` with debug info for the running kernel; mainline 7.2 or LTS 6.18 assumed when not stated.

## Procedure

1. **Read the ring buffer before anything else.**

   ```bash
   dmesg -T -l err,warn              # filter by level
   dmesg -w                          # follow live
   cat /proc/sys/kernel/printk       # current default minimum boot-default
   echo 8 > /proc/sys/kernel/printk  # raise verbosity
   ```

   Driver `dev_dbg()` output stays hidden until dynamic debug or a `DEBUG` define turns it on. Done when: the level is raised and the first fault line is captured.
2. **Break into kgdb when the target is alive.** Boot with `kgdboc=ttyS0,115200 kgdbwait`, or attach at runtime and trigger the break from sysrq.

   ```bash
   echo ttyS0,115200 > /sys/module/kgdboc/parameters/kgdboc
   echo g > /proc/sysrq-trigger
   ```

   ```bash
   gdb vmlinux
   (gdb) set serial baud 115200
   (gdb) target remote /dev/ttyUSB0
   (gdb) bt
   ```

   A USB serial adapter shows up as `ttyUSB0` and works the same as a built-in port. Done when: gdb reports a backtrace on the stopped target.
3. **Use kdb when no host gdb exists.** `CONFIG_KGDB_KDB` gives an in-kernel shell at the sysrq break (`echo k > /proc/sysrq-trigger`). Commands: `bt` backtrace, `ps` process list, `lsmod` modules, `md <addr>` memory, `rd` registers, `id <addr>` disassembly, `cpu <n>` switch CPU, `go` continue. Done when: the faulting frame is visible without a host debugger.
4. **Trace without recompiling: ftrace.**

   ```bash
   cd /sys/kernel/debug/tracing
   echo function > current_tracer
   echo schedule > set_ftrace_filter
   echo '*probe*' > set_ftrace_notrace
   echo 1 > tracing_on
   cat trace_pipe
   echo 0 > tracing_on && echo nop > current_tracer
   ```

   ```bash
   trace-cmd record -p function -l schedule,do_page_fault
   trace-cmd report          # kernelshark reads the same trace.dat
   ```

   Requires debugfs mounted and root. Done when: the trace shows the calls in question with the filters narrowing it.
5. **Probe one suspect function with kprobes.**

   ```bash
   echo 'p:myprobe do_sys_open $arg1 $arg2' > /sys/kernel/debug/tracing/kprobe_events
   echo 1 > /sys/kernel/debug/tracing/events/kprobes/myprobe/enable
   cat /sys/kernel/debug/tracing/trace
   echo 'r:myret do_sys_open $retval' >> /sys/kernel/debug/tracing/kprobe_events
   # cleanup
   echo '-:myprobe' > /sys/kernel/debug/tracing/kprobe_events
   ```

   An in-kernel probe registers a `struct kprobe` with `.symbol_name` and a `.pre_handler` through `register_kprobe()`. Done when: the probe fires and the fetch arguments read sanely.
6. **Turn on driver debug prints with dyndbg.**

   ```bash
   echo 'module mydriver +p' > /sys/kernel/debug/dynamic_debug/control
   echo 'file drivers/i2c/i2c-core.c +p' > /sys/kernel/debug/dynamic_debug/control
   grep mydriver /sys/kernel/debug/dynamic_debug/control
   ```

   Boot time: `dyndbg="module mydriver +p"` on the kernel command line. Needs `CONFIG_DYNAMIC_DEBUG`. Done when: the driver's debug lines appear in the log.
7. **Analyze the crash dump.** Reserve memory with `crashkernel=256M`, then use the distro tool (`kdump-config show` on Ubuntu, `kdumpctl status` on RHEL). After a panic the vmcore lands in `/var/crash/`.

   ```bash
   crash /usr/lib/debug/boot/vmlinux-$(uname -r) /var/crash/*/vmcore
   crash> bt
   crash> log
   crash> ps
   crash> kmem -i
   crash> mod
   ```

   Compress with `makedumpfile -c -d 31 /proc/vmcore /tmp/vmcore`; the dump level is a number after `-d`. The `vmlinux` must carry debug info for the exact running kernel, usually the distro `linux-image-*-dbg` package. Done when: the crash session yields the panic backtrace.
8. **Tune the target for reproduction.**

   ```bash
   sysctl kernel.panic_on_oops=1      # stop at the first oops, in a VM
   sysctl kernel.softlockup_panic=1
   sysctl kernel.nmi_watchdog=1
   # boot: slub_debug=P,pagealloc     # poison slab for corruption hunts
   ```

   Done when: the target halts at the defect instead of limping on.
9. **Triage by issue class.**

   ```
   Panic or oops        -> dmesg, then crash on the vmcore
   Driver logic bug     -> dyndbg, then ftrace function_graph
   Latency regression   -> perf record -g -a, trace-cmd
   Intermittent         -> kprobe the suspect path
   Module crash         -> kgdb, audit module refcounts
   ```

   Done when: the next tool follows from the class.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| kgdb will not connect | Wrong tty or baud | Match `kgdboc` to the adapter, check both ends |
| Trace stays empty | Tracer not set or tracing off | `echo function > current_tracer`, `echo 1 > tracing_on` |
| kprobe registration fails | Inlined symbol or `CONFIG_KPROBES` off | Pick a symbol present in `/proc/kallsyms`, or use a tracepoint |
| dyndbg has no effect | `CONFIG_DYNAMIC_DEBUG` disabled | Rebuild the kernel with the option |
| crash rejects the vmcore | Wrong `vmlinux` debug symbols | Install the `dbg` package matching `uname -r` |
| sysrq dead | `kernel.sysrq` is 0 | `echo 1 > /proc/sys/kernel/sysrq` |

| Failure class | Behavior |
|---|---|
| Break hangs the target | Fall back to kdb in-kernel or to the kdump path; do not retry the same break without changing the transport. |
| kprobe floods the trace | Narrow to one symbol, or switch to a kretprobe that only logs `$retval`. |
| crash session mismatches the kernel | Refuse analysis; a mismatched `vmlinux` produces plausible garbage. Fetch the matching debug package first. |
| Debug controls write nothing | debugfs is not mounted: `mount -t debugfs none /sys/kernel/debug`. |

## Output

1. The faulting function or subsystem named with captured evidence.
2. The command transcript used.
3. The next diagnostic step when the cause is still open.
