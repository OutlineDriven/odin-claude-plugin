---
name: riscv-privileged
description: 'Use when writing RISC-V M-mode or S-mode code: CSRs, trap handlers, PLIC and CLINT interrupts, OpenSBI payloads, Sv39 or Sv48 page tables, or QEMU virt boot. Not for user-mode asm: use assembly-riscv.'
---

# RISC-V privileged architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A kernel, hypervisor, or firmware for RISC-V needs privilege modes, CSR access, a trap entry, timer or external interrupts, OpenSBI integration, virtual memory, or a QEMU `virt` boot and GDB session. |
| Authority | Reversible local: writes only the kernel or firmware sources in the project directory the user names and the OpenSBI build output under its own `build/`; rollback is reverting the sources and deleting `build/`. No remote mutation. |
| Side effect | New or edited sources, an OpenSBI firmware image, and QEMU processes started for testing. |
| Done | The image boots on `qemu-system-riscv64 -machine virt`, an `ecall` from U-mode reaches the trap handler with `scause = 8`, the timer interrupt fires through SBI, a PLIC source is claimed and completed, and the kernel runs with `satp` pointing at a page table it built. |

## Inputs

- Which modes the target implements: M, S, and U (Linux-class), or M and U only (embedded).
- XLEN (RV32 or RV64) and the ISA string the toolchain targets (`-march=rv64gc`).
- Whether OpenSBI runs below the kernel (S-mode kernel) or the kernel owns M-mode.
- Toolchain: `riscv64-unknown-elf-gcc` or a Linux-target cross GCC, and a GDB that knows RISC-V (`gdb-multiarch`, or the toolchain's own).

## Procedure

1. Fix the mode layout. M-mode runs firmware (OpenSBI) and has every right; S-mode runs the kernel; U-mode runs applications. An embedded part with no S-mode runs M and U only, and the "kernel" is the M-mode firmware. Done when: the project states which mode each component runs in and which CSR set (`m*` or `s*`) it therefore touches.

2. Access CSRs through inline assembly wrappers. Done when: every CSR read and write goes through one wrapper per register, so a mode change is one edit.

   | CSR | Mode | Holds |
   |---|---|---|
   | `mstatus`, `sstatus` | M, S | Global interrupt enable, previous privilege, FS and XS state |
   | `mtvec`, `stvec` | M, S | Trap vector base and mode (direct or vectored) |
   | `mepc`, `sepc` | M, S | PC at the trap |
   | `mcause`, `scause` | M, S | Trap cause; top bit set means interrupt |
   | `mtval`, `stval` | M, S | Faulting address or instruction bits |
   | `mie`, `sie` | M, S | Per-source interrupt enable |
   | `mip`, `sip` | M, S | Per-source interrupt pending |
   | `satp` | S | Translation mode, ASID, root page table PPN |

   ```c
   static inline uint64_t read_satp(void) {
       uint64_t v; asm volatile("csrr %0, satp" : "=r"(v)); return v;
   }
   static inline void write_stvec(const void *handler) {
       asm volatile("csrw stvec, %0" :: "r"(handler));
   }
   ```

3. Decode traps. `scause` bit 63 (RV64) distinguishes interrupts from exceptions; the low bits give the code. Done when: the handler dispatches the codes below and panics on any other with `scause`, `sepc`, and `stval` printed.

   | `scause` | Kind | Meaning |
   |---|---|---|
   | interrupt, code 1 | Interrupt | Supervisor software interrupt |
   | interrupt, code 5 | Interrupt | Supervisor timer interrupt |
   | interrupt, code 9 | Interrupt | Supervisor external interrupt (PLIC) |
   | 8 | Exception | `ecall` from U-mode |
   | 12, 13, 15 | Exception | Instruction, load, store page fault |
   | 2 | Exception | Illegal instruction |

   ```c
   void handle_trap(uint64_t scause, uint64_t sepc, uint64_t stval) {
       if (scause >> 63) {
           switch (scause & 0xff) {
           case 5: timer_interrupt(); break;
           case 9: external_interrupt(); break;
           default: panic("interrupt %lu", scause & 0xff);
           }
           return;
       }
       switch (scause) {
       case 8:  handle_syscall(); break;                /* sepc += 4 before sret */
       case 12: case 13: case 15: handle_page_fault(stval, scause); break;
       default: panic("exception %lu sepc=%lx stval=%lx", scause, sepc, stval);
       }
   }
   ```

4. Write the trap entry. In direct mode every trap lands at `stvec`; the entry swaps to the kernel stack through `sscratch`, saves the registers, calls the C handler, restores, and executes `sret`. The spec requires `BASE` to be 4-byte aligned, and vectored mode (`MODE = 1`) jumps to `BASE + 4 * cause` for interrupts. Done when: an `ecall` from U-mode arrives in `handle_trap` with `scause = 8` and returns to the instruction after it.

   ```
   .section .text.trap
   .globl trap_entry
   .align 4
   trap_entry:
       csrrw sp, sscratch, sp      # switch to the kernel stack
       # push the caller-saved and callee-saved registers
       csrr  a0, scause
       csrr  a1, sepc
       csrr  a2, stval
       call  handle_trap
       # pop the registers
       csrrw sp, sscratch, sp
       sret
   ```

   ```c
   write_stvec(trap_entry);   /* low two bits 0: direct mode */
   ```

5. Wire the interrupt controllers. On QEMU `virt` the CLINT (or ACLINT with `-machine virt,aclint=on`) provides per-hart timer (`mtime`, `mtimecmp`) and software (`msip`) interrupts, and the PLIC routes device interrupts (UART, virtio) with per-source priority, per-context enable, and a claim and complete register pair. An S-mode kernel sets timers through SBI rather than touching `mtimecmp`, which is M-mode memory. Done when: a PLIC source (the UART) is claimed and completed once per interrupt and the timer fires at the programmed interval.

   ```c
   uint32_t irq = plic_claim(hart_context);   /* read claim register */
   handle_device_irq(irq);
   plic_complete(hart_context, irq);          /* write the same value back */
   ```

6. Build OpenSBI with the kernel as payload when the kernel is S-mode. `FW_PAYLOAD_PATH` takes the image file of the next stage (a flat binary, not the ELF); `FW_PAYLOAD_OFFSET` is the payload offset from the OpenSBI load address, and it must equal where the kernel is linked to run. Done when: `build/platform/generic/firmware/fw_payload.elf` exists and boots the kernel on QEMU.

   ```bash
   git clone https://github.com/riscv-software-src/opensbi
   make -C opensbi PLATFORM=generic FW_PAYLOAD=y \
        FW_PAYLOAD_PATH=../kernel.bin FW_PAYLOAD_OFFSET=0x200000
   # QEMU virt loads OpenSBI at 0x80000000, so 0x200000 puts the kernel at 0x80200000
   ```

   SBI calls are `ecall` from S-mode with the extension ID in `a7` and the function ID in `a6`; the TIME extension ID is `0x54494D45` and `sbi_set_timer` is function 0. Base, TIME, IPI, RFENCE, and HSM are the extensions a kernel uses first.

   ```c
   struct sbiret sbi_set_timer(uint64_t stime) {
       return sbi_ecall(0x54494D45, 0, stime, 0, 0, 0, 0, 0);
   }
   ```

7. Build page tables. Sv39 translates 39-bit virtual addresses through three levels; Sv48 uses four levels and 48 bits. On RV64 `satp` holds `MODE` in bits 63 to 60 (8 for Sv39, 9 for Sv48), a 16-bit ASID, and the 44-bit root PPN. Map the kernel's own code and data before writing `satp`, or the instruction after the write faults. Done when: the kernel runs with `satp` enabled and a user page mapped with `PTE_U` is readable from U-mode and faults from S-mode without `SUM` set.

   ```c
   #define PTE_V (1UL << 0)
   #define PTE_R (1UL << 1)
   #define PTE_W (1UL << 2)
   #define PTE_X (1UL << 3)
   #define PTE_U (1UL << 4)

   uint64_t *walk_create(uint64_t *root, uint64_t va, int alloc);
   void map_page(uint64_t *root, uint64_t va, uint64_t pa, int perm);
   ```

   Issue `sfence.vma` after changing a mapping the hart may have cached.

8. Boot and debug on QEMU `virt`. `-bios default` loads QEMU's bundled OpenSBI and jumps to `-kernel` in S-mode; `-bios none` runs the kernel in M-mode at `0x80000000`. `-s -S` opens a GDB stub on port 1234 and waits. Done when: GDB stops at the kernel entry after `target remote :1234`.

   ```bash
   qemu-system-riscv64 -machine virt -cpu rv64 -m 128M \
       -kernel kernel.elf -bios default \
       -serial mon:stdio -display none -no-reboot

   qemu-system-riscv64 -machine virt -m 128M \
       -kernel opensbi/build/platform/generic/firmware/fw_payload.elf \
       -bios none -nographic

   qemu-system-riscv64 -machine virt -m 128M -kernel kernel.elf -bios default -nographic -s -S &
   gdb-multiarch kernel.elf -ex "target remote :1234"
   ```

9. Read xv6-riscv when a reference is needed. `kernel/start.c` (M-mode to S-mode handoff), `kernel/trap.c`, `kernel/vm.c`, and `kernel/plic.c` are small and map onto steps 3 to 7. Done when: each step above has been compared to its xv6 counterpart.

   ```bash
   git clone https://github.com/mit-pdos/xv6-riscv
   make -C xv6-riscv qemu
   ```

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Trap loop right after `stvec` is set | `stvec` base misaligned or the handler itself faults | Align the entry to 4 bytes; check the handler's first instructions with GDB. |
| Fault on the instruction after `csrw satp` | Kernel code not mapped in the new table | Identity-map the kernel before enabling translation. |
| Timer never fires | S-mode kernel writes `mtimecmp` directly, or `sie.STIE` clear | Call `sbi_set_timer`; set `STIE` in `sie` and `SIE` in `sstatus`. |
| PLIC source never interrupts | Priority 0, enable bit clear, or threshold too high | Set priority above 0, set the enable bit for the hart context, set threshold 0. |
| OpenSBI prints its banner then hangs | `FW_PAYLOAD_OFFSET` does not match the kernel's link address | Make the offset plus `0x80000000` equal the linked entry. |
| Illegal instruction in the kernel | Compressed or other extension missing from the CPU model | Match `-march` to the QEMU CPU, or pass `-cpu rv64,c=true`. |

## Output

Kernel or firmware sources in the named directory that boot on QEMU `virt` with a working trap entry, timer and PLIC interrupt paths, and an enabled page table, plus the QEMU and GDB command lines used and, when OpenSBI is built, the payload offset that matched the link address.
