---
name: linux-kernel-architecture
description: 'Use when navigating kernel source, understanding boot flow, initcall levels, or major subsystems (VFS, scheduler, MM) in linux.git. Not for driver-model depth: use platform-device-model.'
---

# Linux kernel architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Navigating linux.git or understanding kernel structure: the boot sequence, initcall levels, subsystem layout, key data structures, or locating a symbol or `CONFIG_*` knob. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | None. The skill returns navigation guidance and source paths. |
| Done | A boot-flow map, a subsystem path with key structs, an initcall sequence, or a located symbol is delivered, with a deeper-skill pointer when the question crosses into implementation. |

## Inputs

1. Question (required): boot flow, subsystem location, initcall ordering, or symbol lookup.
2. Checkout path (optional): a linux.git tree to search; the answers assume a recent tree (mainline 7.2 or LTS 6.18).
3. Target symbol or config (optional): the name to locate.

## Procedure

1. Classify the question: boot flow, subsystem map, initcall level, or symbol location. Done when: the class is named and the matching step below is chosen.
2. For boot flow, state the sequence with the initcall placement made precise: firmware or UEFI hands off to `arch/*/boot`, which decompresses the kernel and runs early setup; `start_kernel()` initializes core subsystems (mm, scheduler, timers, IRQ); `rest_init()` spawns `kernel_init`, whose `do_basic_setup()` runs `do_initcalls()` through every initcall level; `kernel_init` then calls `run_init_process()` for userspace `init`. Driver `module_init` and built-in `device_initcall` code runs inside that initcall phase, before `init`. Done when: the sequence from firmware to userspace names where initcalls run.
3. For a subsystem question, map the subsystem to its source path and key structures:

   | Subsystem | Path (typical) | Key structs |
   |---|---|---|
   | Scheduler | `kernel/sched/` | `task_struct`, `sched_entity` |
   | Memory | `mm/` | `struct page`, `mm_struct`, `vm_area_struct` |
   | VFS | `fs/` | `inode`, `dentry`, `file`, `super_block` |
   | Block | `block/` | `request_queue`, `gendisk` |
   | Net | `net/` | `sk_buff`, `net_device` |
   | Drivers | `drivers/` | `device`, `device_driver` |
   | Syscalls | `kernel/`, `fs/`, `mm/` | `SYSCALL_DEFINE*` |

   Done when: the question's subsystem names its path and the structs a reader will meet first.
4. For initcall ordering, read the levels in run order from `include/linux/init.h`: `early_initcall`, `core_initcall`, `postcore_initcall`, `arch_initcall`, `subsys_initcall`, `fs_initcall`, `device_initcall`, `late_initcall`. Platform drivers typically register at `subsys_initcall` or through `module_init` (which lands at `device_initcall` for built-in code). Done when: the requested code sits at a named level relative to its dependencies.
5. For a symbol or config, search the checkout:

   ```bash
   grep -rn "platform_driver_register" drivers/
   ./scripts/config --state CONFIG_FOO
   ls Documentation/admin-guide/
   ```

   Done when: the command output names the defining file or the config state.
6. Route the question when it crosses into implementation: `kernel-memory-management` for `mm/` depth, `platform-device-model` for the driver model, `device-tree` for hardware description, `virtual-memory-paging-and-tlb` for paging mechanics, `kernel-security` for hardening and mitigations. Done when: the delivered answer states the boundary and names the skill that owns the depth.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Symbol not found | Widen the grep, or check whether the code is gated behind an unset `CONFIG_*` with `scripts/config`. |
| Driver probes too early | Its initcall level precedes a dependency: move the level later, or return `-EPROBE_DEFER` on the missing supplier. |
| Boot hangs before userspace | Add `earlycon` (or `earlyprintk` on x86) and `initcall_debug` to the command line to see the last boot step. |
| Wrong subsystem | Trace the call chain through `struct bus_type` or the subsystem's ops struct instead of guessing from names. |
| Question needs implementation depth | Hand off to the skill named in step 6. |

## Output

A boot-flow map with initcall placement; a subsystem path and struct table; the initcall sequence with the level for named code; the search command and its result; a deeper-skill pointer when the boundary is reached.
