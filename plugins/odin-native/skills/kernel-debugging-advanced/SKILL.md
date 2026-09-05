---
name: kernel-debugging-advanced
description: 'Use when tracing kernel functions with ftrace or trace-cmd, profiling with perf, kprobes, or dyndbg, or analyzing a vmcore with crash. Not for QEMU GDB stubs: use qemu-for-kernel-development.'
---

# Advanced kernel debugging

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Production-grade kernel tracing and post-mortem work: ftrace function graph, `trace-cmd`, kernel `perf` probes, dynamic `kprobes`, `dyndbg`, breaking into kgdb/kdb, or analyzing a vmcore after a panic. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns commands and analysis procedures the caller runs on their target. No source files are modified. |
| Done | The trace, probe, or vmcore analysis plan is delivered with the config and mount prerequisites named. |

## Inputs

1. Symptom (required): the latency spike, wrong behavior, or panic to explain.
2. Target (required): the kernel build, whether it has debug symbols and tracepoints, and whether the box runs production traffic.
3. Access (optional): serial console for kgdb, kdump capture for vmcore, root for tracefs.

## Procedure

1. Graph the suspect function with ftrace before reaching for heavier tools. Prerequisites: `CONFIG_FUNCTION_GRAPH_TRACER` and tracefs mounted (`mount -t tracefs none /sys/kernel/tracing`; the `/sys/kernel/debug/tracing` path works when debugfs is mounted).

   ```bash
   cd /sys/kernel/tracing
   echo function_graph > current_tracer
   echo my_driver_probe > set_graph_function
   echo 1 > tracing_on
   # reproduce the issue
   echo 0 > tracing_on
   cat trace
   ```

   Graphing every function drowns the output and costs overhead; the `set_graph_function` filter is not optional. Done when: the trace shows entry and exit of the named function with durations.
2. Use `trace-cmd` when the capture must be shared or replayed. `-g` sets the graph filter; `-F` would run a command, not filter a kernel function.

   ```bash
   trace-cmd record -p function_graph -g my_probe
   trace-cmd report
   trace-cmd stat
   ```

   Done when: the report opens on another machine with `trace-cmd report`.

3. Profile in kernel context with perf. perf ships inside the kernel tree under `tools/perf`, so its features track the kernel being debugged.

   ```bash
   perf record -a -g -- sleep 10
   perf report --stdio
   perf probe --add my_probe        # define a probe at the function
   perf record -e probe:my_probe -aR -- sleep 10
   ```

   Done when: the report names kernel functions or the probe fires with the expected count.
4. Instrument precisely with a kprobe when a static tracepoint does not exist. Register it against a symbol; inlined functions have no symbol to attach to.

   ```c
   #include <linux/kprobes.h>

   static struct kprobe kp = {
       .symbol_name = "do_sys_open",
       .pre_handler = handler,
   };
   register_kprobe(&kp);
   ```

   Use kprobes sparingly on production boxes; prefer static tracepoints when one exists for the event. Done when: the probe registers (or the registration fails with the inline reason) and the handler records what the diagnosis needs.
5. Turn on `dyndbg` for the driver's own debug prints instead of recompiling.

   ```bash
   echo 'module mydriver +p' > /sys/kernel/debug/dynamic_debug/control
   # /proc/dynamic_debug/control is the same control file
   echo 'file drivers/foo/*.c +p' > /sys/kernel/debug/dynamic_debug/control
   ```

   In code, prefer `pr_debug` and `pr_warn_ratelimited` over raw `printk`; rate-limit anything an external party can trigger. Done when: the debug lines appear in `dmesg` for the failing path and stop after the diagnosis.
6. Break into kgdb/kdb only with a serial or console path arranged in advance.

   ```bash
   # kernel cmdline: kgdboc=ttyS0,115200 kgdbwait
   echo g > /proc/sysrq-trigger   # enter the debugger on a live system
   ```

   Done when: the debugger prompt answers over the configured console.
7. Analyze a vmcore with crash when the box panicked and kdump captured it. The `vmlinux` must carry debug info and match the running kernel build.

   ```bash
   crash /usr/lib/debug/boot/vmlinux-$(uname -r) /var/crash/<timestamp>/vmcore
   crash> bt
   crash> dev -s
   ```

   Where the distribution ships symbols as debug packages (`linux-image-*-dbg`) or via debuginfod, fetch the matching one. Done when: the backtrace names the faulting path and the state that led to it.
8. Assemble the findings into one causal story: the traced function, the measured duration, the probe evidence, or the panic backtrace. Route deeper work: `ebpf` for BPF-based tracing alternatives, `writing-char-drivers` when the trace target is an ioctl path; keep kgdb guidance grounded in `Documentation/process/debugging/gdb-kernel-debugging-guide.rst` of the target kernel. Done when: the story answers the reported symptom with evidence from steps 1 to 7.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| Empty trace | Tracer off or wrong tracer | Check `current_tracer` and `tracing_on`; confirm tracefs is mounted. |
| ftrace overhead too high | Graphing all functions | Set `set_graph_function` to the suspect. |
| kprobe registration fails | Symbol is inlined | Pick a nearby non-inlined symbol or a static tracepoint. |
| kgdb does not connect | Wrong `kgdboc` device | Match the actual serial or USB gadget console. |
| crash prints no symbols | Missing debug info for the exact build | Install the matching debug package or fetch via debuginfod. |

## Output

The ftrace or trace-cmd capture plan with prerequisites; the perf or kprobe evidence; the dyndbg recipe; the kgdb entry path; the crash analysis commands against the matched vmcore and vmlinux; the causal story for the reported symptom.
