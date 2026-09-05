---
name: kernel-security
description: 'Use when writing an SELinux or AppArmor policy, a seccomp-bpf filter, enabling CET, PAC, or BTI, or triaging a kernel CVE. Not for KASAN report analysis: use kernel-debugging.'
---

# Kernel security

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user confines a service with SELinux or AppArmor, sandboxes a process with seccomp-bpf, hardens binaries with shadow stacks and branch protection, checks KASLR, builds a sanitizer kernel for vulnerability research, or asks whether a kernel CVE affects a given kernel and what mitigates it. |
| Authority | Human-gated: policy, profile, and filter sources are drafted into files the user names inside the project. Loading a policy module, switching a profile to enforce, changing a sysctl, or booting a new kernel changes the running system and needs explicit user confirmation per command; rollback is the recorded prior state (`semodule -r`, `aa-complain`, the previous sysctl value, the previous kernel). No remote mutation. |
| Side effect | Drafts are written and checked with the tool's own compiler or validator. System state changes only after confirmation. |
| Done | Each requested artifact compiles or validates, the confinement is proven by a denied access appearing in the audit log for a forbidden operation and no denial for the service's normal work, and each hardening claim is read back from the binary or the running kernel. |

## Inputs

1. The target (required): the service binary and its file, network, and syscall needs, or the binary to harden, or the kernel version (`uname -r`) and the CVE id.
2. The active LSM set (gathered by the skill): `cat /sys/kernel/security/lsm`.
3. Distribution and kernel (gathered by the skill). Grounded current kernels are mainline 7.2 and LTS 6.18; the sysctl and `/proc` names below are read from the kernel's own admin guide.
4. Compiler (gathered by the skill): `gcc --version` or `clang --version`; the hardening flags below are confirmed on GCC 16.2 and Clang 23.1.0.

## Procedure

1. Place each control in the syscall path: discretionary access control (uid, gid, mode) runs first, then the LSM hooks (SELinux, AppArmor, Yama, Landlock, lockdown), then capability checks, then the seccomp filter, then the kernel service. A control lower in the list cannot grant what a control higher in the list denied. Read the active stack with `cat /sys/kernel/security/lsm`. Done when: the requested control is named with its position and the stack shows it is active.
2. For SELinux, read the current state and denials before writing policy:

   ```bash
   getenforce; sestatus
   ls -Z /usr/sbin/nginx; ps -eZ | grep nginx
   ausearch -m avc -ts recent
   ```

   Draft a module that gives the service its own domain and only the accesses observed:

   ```te
   policy_module(myapp, 1.0.0)
   type myapp_t;
   type myapp_exec_t;
   type myapp_log_t;
   init_daemon_domain(myapp_t, myapp_exec_t)
   allow myapp_t myapp_log_t:file { create write append open };
   allow myapp_t self:tcp_socket { create bind listen accept };
   ```

   ```bash
   checkmodule -M -m -o myapp.mod myapp.te
   semodule_package -o myapp.pp -m myapp.mod
   semodule -i myapp.pp        # confirmation required
   ```

   `audit2allow` turns a denial into a candidate rule; read each candidate and drop the ones the service does not need rather than installing its output whole. Done when: the module compiles, and after confirmed install the service runs with no AVC denial for its normal work and a denial appears for a forbidden access you provoke.
3. For AppArmor, generate a profile in complain mode from a real run, then tighten:

   ```bash
   aa-genprof /usr/bin/myapp      # confirmation required: writes under /etc/apparmor.d
   aa-status
   aa-enforce /etc/apparmor.d/usr.bin.myapp   # confirmation required
   ```

   ```apparmor
   #include <tunables/global>
   /usr/bin/myapp {
     #include <abstractions/base>
     /usr/bin/myapp mr,
     /var/log/myapp.log w,
     /etc/myapp/config r,
     network inet stream,
     deny /etc/shadow r,
   }
   ```

   Profile paths must match the paths the binary opens; a renamed log file breaks the profile, so use globs where the name varies. Done when: `aa-status` lists the profile in enforce mode and the audit log shows a denial only for the provoked forbidden access.
4. For seccomp-bpf, record the syscalls the program uses, then build the filter with libseccomp and a kill default:

   ```bash
   strace -f -c ./myapp        # syscall inventory before tightening
   ```

   ```c
   #include <errno.h>
   #include <seccomp.h>

   int sandbox(void) {
       scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL_PROCESS);
       if (!ctx) return -1;
       int rc = 0;
       rc |= seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 0);
       rc |= seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 0);
       rc |= seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0);
       rc |= seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(mmap), 0);
       rc |= seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(brk), 0);
       rc |= seccomp_rule_add(ctx, SCMP_ACT_ERRNO(EPERM), SCMP_SYS(openat), 0);
       if (rc) { seccomp_release(ctx); return -1; }
       rc = seccomp_load(ctx);
       seccomp_release(ctx);
       return rc;
   }
   ```

   `SCMP_ACT_ERRNO` makes a forbidden call fail with an error the program can handle; `SCMP_ACT_KILL_PROCESS` ends the process on anything not listed. `seccomp_export_bpf(ctx, fd)` writes the compiled filter for review. Install the filter after setup and before untrusted input is read. Done when: the program completes its normal work under the filter and a provoked forbidden syscall returns `EPERM` or kills the process as designed.
5. For KASLR, read the kernel's own signals. `kernel.randomize_va_space` governs user-space ASLR, not the kernel image; KASLR is on unless `nokaslr` is on the kernel command line, and the boot log states it:

   ```bash
   grep -o nokaslr /proc/cmdline || echo "kaslr on"
   dmesg | grep -i kaslr
   sysctl kernel.kptr_restrict kernel.unprivileged_bpf_disabled
   ```

   `kptr_restrict=1` hides `%pK` pointers from unprivileged readers, and `unprivileged_bpf_disabled=1` or `2` closes the largest unprivileged leak surface; `/proc/<pid>/maps` of another user's process is already restricted by ptrace access mode. Done when: the three values are read back and any change is applied only after confirmation.
6. For x86 control-flow enforcement, compile with `-fcf-protection=full` (GCC and Clang) and read the property note:

   ```bash
   gcc -fcf-protection=full -o app app.c
   readelf -n app | grep -E 'IBT|SHSTK'
   ```

   The shadow stack (SHSTK) defends return addresses against ROP; indirect branch tracking (IBT) restricts indirect `call` and `jmp` targets to `endbr` landing pads. The property is a request: the CPU and the kernel decide. `grep -ow user_shstk /proc/cpuinfo` shows user-space shadow stack support, and `/proc/<pid>/status` reports `shstk` for a process running with it, per the kernel's `arch/x86/shstk` documentation. Done when: the note is present and the runtime status is read from `/proc`.
7. For AArch64, compile with `-mbranch-protection=standard` (GCC and Clang) for pointer authentication and branch target identification, then read the property note:

   ```bash
   clang --target=aarch64-linux-gnu -mbranch-protection=standard -c app.c -o app.o
   readelf -n app.o | grep 'AArch64 feature'
   ```

   PAC signs return addresses and selected pointers with a key held by the CPU; BTI marks valid indirect branch targets and faults on any other. The note reads `AArch64 feature: BTI, PAC` (a GCS entry appears when guarded control stacks are also requested). Done when: the note lists BTI and PAC.
8. For vulnerability research, build a kernel with `CONFIG_KASAN=y` (use-after-free and out-of-bounds in kernel memory) or `CONFIG_KMSAN=y` (uninitialized memory). The kernel's own documentation states both increase memory footprint and slow the whole system, with the generic KASAN mode the heaviest and the hardware-tag mode on arm64 the lightest; run these kernels in test VMs only. A report begins `BUG: KASAN: <class> in <function>` with a call trace. Done when: the kernel boots and a known-bad test module produces a report. For reading the report, use `kernel-debugging`.
9. For a CVE, answer four questions in order: which subsystem (net, fs, a driver), local or remote reachability, whether the running kernel already carries the fix, and what mitigates it without the patch (blacklist the module, a sysctl, a firewall rule).

   ```bash
   uname -r
   zgrep -l CVE-2026-XXXXX /usr/share/doc/linux-*/changelog.Debian.gz   # Debian and Ubuntu backports
   ```

   Use the distribution security tracker and the NVD entry for the fixed versions; a distribution backports fixes without changing the upstream version string, so the changelog, not `uname -r`, decides. Done when: each of the four questions has an answer with its source.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| SELinux denials after install | A needed access is missing. Read the AVC record, add the specific rule, rebuild, and reinstall with confirmation. |
| AppArmor profile breaks the service | Path mismatch. Correct the path or add a glob; keep the profile in complain mode until clean. |
| seccomp kills the program | A syscall is missing from the inventory. Re-run under `strace -f`, add the rule, and repeat. |
| CET property present but inactive | The CPU or kernel lacks support. Read `/proc/cpuinfo` and `/proc/<pid>/status`; report the gap rather than the flag. |
| Sanitizer kernel too slow for the workload | Expected in generic mode. Use a smaller test workload or the arm64 hardware-tag mode. |
| A single control is treated as sufficient | A kernel bug bypasses any one LSM. Stack controls and keep the kernel patched; say so in the report. |

No partial result is claimed complete. If a step cannot finish, the report states which steps passed and which await confirmation.

## Output

A security delivery containing:
1. Artifacts: policy, profile, or filter sources with the validator result.
2. Confirmation log: each system-changing command, whether it was confirmed and run, and the recorded rollback state.
3. Evidence: audit records for the provoked denial and the clean normal run, and the property notes or `/proc` values read back.
4. CVE verdict: the four answers with sources, when a CVE was in scope.
