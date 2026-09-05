---
name: os-dev-scratch
description: 'Use when building a minimal x86-64 OS: boot protocols, long mode, page tables, IDT, PIC/APIC, serial and keyboard drivers, frame allocator, or context switching.'
---

# OS development from scratch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Building a minimal operating system from scratch on x86-64: bootloader choice, GDT and page tables for long mode, IDT and interrupt dispatch, PIC or APIC, serial and keyboard input, a frame allocator, or cooperative context switching. |
| Authority | Read-only. Emits architecture decisions, code patterns, and boot commands; the code is written in the user's tree. No file writes, no rollback needed. No remote mutation. |
| Side effect | An architecture plan and runnable command sequences in chat. Nothing is written. |
| Done | A boot path reaches serial output, each stage's acceptance command passes, and the next milestone is named. |

## Inputs

1. Target ISA and firmware (required): x86-64 with BIOS/legacy or UEFI; xv6-RISC-V as a reference port.
2. Host toolchain (required): a cross toolchain and QEMU available or installable.
3. Milestone (optional): boot, long mode, interrupts, or scheduling.

## Procedure

1. **Pick the boot path and stick to it.**

   ```
   BIOS path (legacy)
   +-- POST
   +-- MBR boot sector loads stage 2
   +-- GRUB or another multiboot loader loads the kernel ELF
   +-- kernel entry (_start)

   UEFI path (modern)
   +-- UEFI firmware
   +-- EFI loader (limine, systemd-boot) loads kernel from the ESP
   +-- handoff with the memory map
   ```

   Multiboot keeps the first milestone short; UEFI is the path for real hardware. Done when: one path is named and the loader's load address is known.
2. **Stand up the freestanding cross toolchain.** Use `x86_64-elf-gcc` and binutils, not the host compiler: the host toolchain injects startup files and libc assumptions that break a kernel.

   ```bash
   x86_64-elf-gcc -ffreestanding -nostdlib -c kernel.c -o kernel.o
   x86_64-elf-ld -T linker.ld kernel.o -o kernel.elf
   ```

   ```ld
   ENTRY(_start)
   SECTIONS {
       . = 0x100000;   /* 1 MiB, the multiboot convention */
       .text   : { *(.text .text.*) }
       .rodata : { *(.rodata .rodata.*) }
       .data   : { *(.data .data.*) }
       .bss    : { *(.bss .bss.*) }
   }
   ```

   The linker script's load address must match what the loader promises; a mismatch is the classic relocation triple fault. Done when: `kernel.elf` links and `readelf -h` shows the expected entry and load address.
3. **Boot under QEMU with serial as the first output.**

   ```bash
   qemu-system-x86_64 -kernel kernel.elf -serial stdio -m 128M -no-reboot -no-shutdown
   ```

   `-kernel` loads an ELF carrying a multiboot header; the header must sit in the first 8 KiB of the image. For the UEFI path, run under OVMF with a disk image the loader has claimed:

   ```bash
   qemu-system-x86_64 -bios /usr/share/ovmf/OVMF.fd -drive file=disk.img,format=raw -serial stdio
   ```

   Done when: the first `serial_putc('K')` from the entry path shows in the terminal.
4. **Enter long mode through PAE and 4-level paging.** The path is: protected mode, enable PAE, build PML4/PDPT/PD, set `EFER.LME`, then enable paging.

   ```c
   uint64_t pml4[512] __attribute__((aligned(4096)));
   uint64_t pdpt[512] __attribute__((aligned(4096)));
   uint64_t pd[512]   __attribute__((aligned(4096)));

   void setup_paging(void) {
       for (int i = 0; i < 512; i++)
           pd[i] = (uint64_t)i * 0x200000 | 0x83;  /* 2 MiB pages, present|rw|PS */
       pdpt[0] = (uint64_t)pd   | 0x03;
       pml4[0] = (uint64_t)pdpt | 0x03;
       __asm__ volatile("mov %0, %%cr3" :: "r"(pml4));
   }
   ```

   This identity-maps the first GiB with 2 MiB pages; the kernel stack must be valid before any interrupt can fire. Done when: code runs at 64-bit with serial output intact.
5. **Load the IDT and dispatch by vector.** Each gate points at an assembly stub that pushes a trap frame; the C handler switches on the vector.

   ```c
   struct idt_entry {
       uint16_t offset_low;
       uint16_t selector;
       uint8_t  ist;
       uint8_t  type_attr;
       uint16_t offset_mid;
       uint32_t offset_high;
       uint32_t zero;
   } __attribute__((packed));
   ```

   ```c
   void interrupt_handler(struct trap_frame *f) {
       if (f->vector == 14)        /* page fault: cr2 holds the address */
           handle_page_fault(f->cr2, f->error_code);
       else if (f->vector == 33)   /* IRQ1 keyboard after PIC remap */
           keyboard_handler();
   }
   ```

   Done when: a deliberate page fault is caught, reported over serial, and execution continues or halts cleanly.
6. **Remap the PIC before unmasking anything.** The 8259 pair delivers IRQs at vectors 32 through 47 after remap; the APIC (LAPIC plus I/O APIC, discovered from the ACPI MADT) is the modern controller and its LAPIC timer is the preemption source.

   ```c
   outb(0x20, 0x11); outb(0xA0, 0x11);  /* ICW1: init, cascade */
   outb(0x21, 0x20); outb(0xA1, 0x28);  /* ICW2: vector offsets 0x20 and 0x28 */
   ```

   Send EOI (0x20 to port 0x20) at the end of every handled IRQ. Done when: the timer or keyboard IRQ fires exactly once per event.
7. **Write serial first, keyboard second.** Poll COM1's line status for transmit-empty; the keyboard is a scancode port with an EOI.

   ```c
   void serial_putc(char c) {
       while ((inb(0x3F8 + 5) & 0x20) == 0)
           ;
       outb(0x3F8, c);
   }

   void keyboard_handler(void) {
       uint8_t sc = inb(0x60);
       char c = scancode_to_ascii[sc];
       if (c)
           serial_putc(c);
       outb(0x20, 0x20);   /* EOI */
   }
   ```

   Done when: typed keys echo over serial.
8. **Build the frame allocator from the firmware memory map.** Take usable regions from the multiboot or UEFI memory map, mark one bitmap bit per 4 KiB frame, and return frame addresses on first fit.

   ```c
   #define PAGE_SIZE 4096
   uint64_t alloc_frame(void) {
       for (uint64_t i = 0; i < total_frames; i++)
           if (!test_bit(frame_bitmap, i)) {
               set_bit(frame_bitmap, i);
               return i * PAGE_SIZE;
           }
       return 0;   /* out of frames: the caller must see this */
   }
   ```

   A linear scan is fine at this scale; replace it with a free list only when allocation shows up in a profile. Done when: every handed-out frame is later reclaimed exactly once.
9. **Switch contexts cooperatively before adding preemption.** Save callee-saved registers per the System V AMD64 ABI, restore the next task's, and return into its saved rip.

   ```c
   struct context {
       uint64_t rbx, rbp, r12, r13, r14, r15, rsp, rip;
   };
   void switch_context(struct context *old, struct context *new);
   ```

   Caller-saved registers live in the stack frame already, so only the callee-saved set plus stack pointer and return address need storing. Add a timer-IRQ preemption tick only after cooperative switching is stable. Done when: two tasks alternate under a yield call without corrupting either stack.
10. **Keep xv6-RISC-V open as the reference.**

    ```bash
    git clone https://github.com/mit-pdos/xv6-riscv && cd xv6-riscv && make qemu
    ```

    | xv6 component | Concept |
    |---|---|
    | `kernel/vm.c` | Page table management |
    | `kernel/trap.c` | Trap dispatch |
    | `kernel/proc.c` | Context switch and scheduler |
    | `kernel/plic.c` | Interrupt controller |
    | `user/usys.pl` | System call stubs |

    The concepts port directly to x86-64; the register and controller details do not. Done when: each new milestone reads the corresponding xv6 file first.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| Triple fault on boot | Invalid GDT or IDT, or no stack before interrupts | Set up a stack before `sti`, validate GDT/IDT contents |
| QEMU black screen | No serial output configured | `-serial stdio`, initialize COM1 first |
| Page fault in kernel | Unmapped address | Identity-map the kernel, check `cr3` |
| IRQ never fires | IDT not loaded or IRQ masked | `lidt`, unmask in the PIC, send EOI |
| Timer silent | LAPIC not initialized | Parse the ACPI MADT, calibrate the LAPIC timer |
| Linker relocation fault | Load address mismatch | Match `linker.ld` to the loader's promise |

| Failure class | Behavior |
|---|---|
| Stage change bricks the boot | Bisect stages: keep the last working QEMU invocation and revert one stage at a time. |
| Interrupt storm after enabling the PIC | A handler missed its EOI; audit every registered handler before the next enable. |
| Corrupted state after a switch | The context struct or the assembly save set is incomplete; compare against the ABI's callee-saved list. |
| Cannot tell hang from crash | Run QEMU with `-d int -no-reboot` and read the injected interrupt log. |

## Output

1. The chosen boot path and load address.
2. Per-stage code patterns with the acceptance command for each.
3. The next milestone named.
