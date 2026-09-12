---
name: hypervisor-internals
description: 'Use when studying Intel VT-x or AMD-V internals: VMCS and VMCB, EPT and NPT, VM exit handling, APIC virtualization, or building a minimal type-1 hypervisor. Not for running VMs: use qemu-kvm.'
---

# Hypervisor internals

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A VM exit storm or EPT violation needs diagnosing, a KVM or Hyper-V behavior needs mapping to the hardware feature under it, a hypervisor CVE needs triage, or an educational hypervisor is being built. |
| Authority | Read-only. The skill reads kernel headers, sysfs, and module parameters and answers in chat. Nothing on disk changes, so there is nothing to roll back. No remote mutation. |
| Side effect | Chat output only. |
| Done | The hardware structure and exit reason in question are named with their header constants, the Intel and AMD forms are both given where they differ, and the tuning or mitigation lever is identified. |

## Inputs

- Question (required): a structure, an exit reason, a paging level, or a symptom such as slow nested virtualization.
- Vendor (optional): Intel VT-x or AMD-V. Both are covered; the answer names each form.
- Host access (optional): needed to quote `kvm_intel` or `kvm_amd` module parameters and the vulnerability files.

## Procedure

1. Place the hypervisor. A type-1 hypervisor (Hyper-V, Xen, ESXi) runs on the hardware; a type-2 (KVM with QEMU, VirtualBox) runs inside a host OS. KVM sits in the host kernel and exposes `/dev/kvm`; QEMU is its user-space device model. Done when: the user knows which layer the question lives in.
2. Walk the Intel VMX life cycle. `VMXON` enters VMX root mode; the hypervisor fills a VMCS with guest state, host state, and control fields; `VMLAUNCH` or `VMRESUME` enters the guest; the guest runs until a VM exit returns to the host handler at the host RIP in the VMCS; `VMXOFF` leaves VMX operation. Done when: each instruction is placed on the path.

| VMCS area | Contents |
|---|---|
| Guest state | General registers, `CR0`, `CR3`, `CR4`, segment selectors, `RIP`, `RSP` |
| Host state | Host `RIP` (the exit handler), host `CR3` |
| Controls | Pin-based, processor-based, VM-exit, and VM-entry controls |
| Exit information | Exit reason, exit qualification, guest linear address |

3. Read exit reasons from the kernel's own header. Basic exit reason codes from `arch/x86/include/uapi/asm/vmx.h`: 0 exception or NMI, 1 external interrupt, 2 triple fault, 10 `CPUID`, 12 `HLT`, 28 CR access, 30 I/O instruction, 31 MSR read, 32 MSR write, 48 EPT violation, 49 EPT misconfiguration. Done when: the observed exit reason maps to a constant.
4. Give the AMD form. `EFER.SVME` enables SVM; the VMCB holds a control area (intercept vectors for `CPUID`, MSR, and I/O, the nested paging enable bit, the ASID) and a guest save area; `VMRUN` enters the guest and `#VMEXIT` returns. Exit codes from `arch/x86/include/uapi/asm/svm.h`: `0x72` `CPUID`, `0x78` `HLT`, `0x7b` I/O, `0x7c` MSR, `0x400` nested page fault. Done when: the Intel concept has its AMD counterpart.

| Intel | AMD |
|---|---|
| VMCS | VMCB |
| `VMXON` and `VMXOFF` | `EFER.SVME` |
| `VMLAUNCH` and `VMRESUME` | `VMRUN` |
| EPT | NPT |

5. Explain second-level paging. The guest page tables map guest virtual to guest physical; EPT or NPT, owned by the hypervisor, maps guest physical to host physical. An EPT violation exit means the guest touched an unmapped guest-physical address or violated the EPT permission bits. Nested virtualization adds another level of walk, which is where its cost comes from. Done when: the address that faulted is placed on one of the two walks.
6. Tune the exit rate with bitmaps. The 4 KiB MSR bitmap chooses per MSR whether a read or write exits; the I/O bitmap chooses per port. A hypervisor intercepts control MSRs such as `IA32_FEATURE_CONTROL` and `IA32_EFER` and passes through the rest. Done when: the MSR or port causing an exit storm is identified and its bitmap bit is the proposed lever.
7. Cover interrupt virtualization. Virtual interrupt delivery avoids an exit on EOI, posted interrupts let hardware inject without an exit, and TPR shadowing avoids exits on priority changes. Intel injects through the VM-entry interruption-information field; AMD through `V_IRQ` and `V_INTR_PRIO` in the VMCB. On a Linux host these appear as `kvm_intel` parameters (`enable_apicv`, `enable_device_posted_irqs`, `ept`, `nested`, `vpid`, `pml`) under `/sys/module/kvm_intel/parameters/`. Done when: the interrupt path from device to guest ISR is drawn.
8. Name the side-channel mitigations. L1TF is mitigated by flushing L1D on VM entry (`kvm_intel` parameter `vmentry_l1d_flush`; state in `/sys/devices/system/cpu/vulnerabilities/l1tf`). Read that directory for the current host state before making a claim about it. Done when: the mitigation and its sysfs evidence are named.
9. For an educational hypervisor, follow this order: detect support (`X86_FEATURE_VMX` or `X86_FEATURE_SVM`, exposed as `vmx` or `svm` in `/proc/cpuinfo`), enable VMX or SVM, allocate the VMCS or VMCB and fill host and guest state, handle exits for `CPUID` and `HLT`, add EPT or NPT with an identity map, then inject interrupts. Done when: the next step in that order is identified.
10. Show the KVM API when the question is how QEMU talks to the kernel. Done when: the ioctl sequence is stated.

```c
int kvm = open("/dev/kvm", O_RDWR);
ioctl(kvm, KVM_GET_API_VERSION, 0);            /* must be 12 */
int vm = ioctl(kvm, KVM_CREATE_VM, 0);
/* KVM_SET_USER_MEMORY_REGION maps guest memory before any vCPU runs. */
int vcpu = ioctl(vm, KVM_CREATE_VCPU, 0);
/* mmap the vCPU fd for KVM_GET_VCPU_MMAP_SIZE bytes to read the exit reason. */
ioctl(vcpu, KVM_RUN, 0);                        /* returns on each VM exit */
```

For running guests and passing through devices, use `qemu-kvm`. For lighter isolation without a VM, use `containers-internals`. For the guest OS side, use `os-dev-scratch`. For host kernel mitigations, use `kernel-security`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| VM exit storm on MSR access | The MSR bitmap intercepts a hot MSR. Pass that MSR through when it is safe. |
| EPT misconfiguration exit | A malformed EPT entry (reserved bits or bad memory type). Check the entry against the SDM format. |
| Nested guest slow | Two-level page walk plus exits forwarded through the outer hypervisor. Enable hardware assists, limit nesting depth. |
| `VMXON` fails | `CR0` or `CR4` fixed bits are wrong, or `IA32_FEATURE_CONTROL` is locked without VMX enabled. Check both. |
| Guest triple fault | The guest's IDT or an unhandled exception in early boot. Check the guest interrupt setup. |
| Every port I/O exits | The I/O bitmap traps everything. Shrink it to the emulated ports. |

## Output

A chat answer naming the structure, the exit reason with its header constant, the Intel and AMD forms, and the lever (bitmap, parameter, or paging change) that addresses the symptom, with the sysfs or header evidence quoted.
