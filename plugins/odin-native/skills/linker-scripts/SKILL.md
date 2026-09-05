---
name: linker-scripts
description: 'Use when writing a GNU ld script for a bare-metal target, placing code in a flash or RAM region, wiring .data and .bss startup, or fixing a region overflowed error. Not for LTO: use linkers-lto.'
---

# Linker scripts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A bare-metal image needs a GNU ld script: `MEMORY` and `SECTIONS`, VMA versus LMA for `.data`, the symbols startup code copies between, a function placed in a named region, weak default handlers, or a region overflow error. |
| Authority | Reversible local: writes only the linker script and the startup source in the project directory the user names; rollback is reverting those files in version control. No remote mutation. |
| Side effect | New or edited `.ld` and startup files. The image layout changes on the next link. |
| Done | The ELF links, `readelf -S` shows `.data` with an LMA inside flash and a VMA inside RAM, `.bss` and the stack fit the RAM region, and the startup code copies `.data` and zeroes `.bss` between the script's symbols before `main`. |

## Inputs

- Flash and RAM origins and lengths from the datasheet, plus any extra region (CCM, TCM, backup SRAM).
- The vector table section name the startup file emits (`.isr_vector` in the CMSIS templates).
- Whether the C runtime is newlib (needs `__libc_init_array` and the `.init_array` sections) or none.
- Functions or buffers that must live in a specific region.

## Procedure

1. Write `MEMORY` and the skeleton `SECTIONS`. `ENTRY` names the reset symbol; `KEEP` on the vector table stops `--gc-sections` from removing it; `_estack` at the top of RAM is where the startup file points the stack. Done when: the script has one `MEMORY` block with every region from the datasheet and the link succeeds with `-T script.ld`.

   ```ld
   ENTRY(Reset_Handler)

   MEMORY
   {
       FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
       RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
   }

   SECTIONS
   {
       .text :
       {
           KEEP(*(.isr_vector))
           *(.text .text.*)
           *(.rodata .rodata.*)
           . = ALIGN(4);
           _etext = .;
       } > FLASH

       .data :
       {
           . = ALIGN(4);
           _sdata = .;
           *(.data .data.*)
           . = ALIGN(4);
           _edata = .;
       } > RAM AT > FLASH

       _sidata = LOADADDR(.data);

       .bss :
       {
           _sbss = .;
           *(.bss .bss.*)
           *(COMMON)
           . = ALIGN(4);
           _ebss = .;
       } > RAM

       _estack = ORIGIN(RAM) + LENGTH(RAM);
   }
   ```

2. Separate VMA from LMA for `.data`. The VMA is the address the code runs at (RAM); the LMA is where the bytes sit in the image (flash). `> RAM AT > FLASH` sets both; `AT(_etext)` after the section name is the equivalent explicit form. `LOADADDR(.data)` gives startup code the flash copy's address. Done when: `arm-none-eabi-readelf -S firmware.elf` shows `.data` with `Addr` in RAM and `arm-none-eabi-objdump -h` shows its `LMA` in flash.

3. Copy `.data` and zero `.bss` in the reset handler, between the script's symbols. With newlib, call `__libc_init_array()` before `main` so C++ constructors and `.init_array` entries run. Done when: a global initialized to a nonzero value reads that value in `main`, and a zero-initialized global reads zero.

   ```c
   extern uint32_t _sdata, _edata, _sidata, _sbss, _ebss;

   void Reset_Handler(void) {
       uint32_t *src = &_sidata, *dst = &_sdata;
       while (dst < &_edata) *dst++ = *src++;
       for (dst = &_sbss; dst < &_ebss; ) *dst++ = 0;
       __libc_init_array();
       main();
       for (;;);
   }
   ```

   The startup file itself is the subject of `baremetal-startup`; this skill owns the symbols it consumes.

4. Place code or data in a named region. Give the input section a name with `__attribute__((section(".name")))`, collect it into an output section with `> REGION AT > FLASH`, and copy it at startup like `.data` when the region is RAM. Done when: `objdump -h` shows the section in the intended region and the copy loop covers it.

   ```ld
   MEMORY
   {
       FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
       RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
       CCM   (rwx) : ORIGIN = 0x10000000, LENGTH = 64K
   }

   .fast_code :
   {
       _sfast = .;
       *(.fast_code .fast_code.*)
       _efast = .;
   } > CCM AT > FLASH
   _sifast = LOADADDR(.fast_code);
   ```

   ```c
   __attribute__((section(".fast_code"))) void critical_isr_handler(void) { }
   ```

   CCM on STM32F4 is not on the DMA bus; place DMA buffers in SRAM.

5. Use `KEEP`, `ALIGN`, `PROVIDE`, and the fill expression where each applies. `KEEP` protects sections `--gc-sections` would drop (vector table, `.init_array`). `ALIGN(8)` before the stack satisfies the AAPCS 8-byte stack alignment. `PROVIDE` defines a symbol only if no object defines it, which makes it the default a program can override. The `=0xFF` fill after an output section writes the erased-flash value into gaps. Done when: every `KEEP` guards a section the code never references directly, and the stack region starts 8-byte aligned.

   ```ld
   PROVIDE(_stack_size = 0x400);

   .stack (NOLOAD) :
   {
       . = ALIGN(8);
       . += _stack_size;
       _stack_top = .;
   } > RAM

   .text : { *(.text .text.*) . = ALIGN(4); } > FLASH = 0xFF
   ```

6. Give every exception a weak default handler. `PROVIDE(NMI_Handler = Default_Handler)` in the script, or `__attribute__((weak))` in C, binds the vector to a spin loop until the application defines the real symbol. Done when: a firmware with no `SysTick_Handler` links, and one that defines it calls the definition.

   ```ld
   PROVIDE(NMI_Handler       = Default_Handler);
   PROVIDE(HardFault_Handler = Default_Handler);
   PROVIDE(SysTick_Handler   = Default_Handler);
   ```

   ```c
   __attribute__((weak)) void Default_Handler(void) { for (;;); }
   void SysTick_Handler(void) { tick_count++; }   /* overrides the default */
   ```

7. Check sizes and addresses after every layout change. `--print-memory-usage` (pass as `-Wl,--print-memory-usage`) prints region use at link time; `-Wl,-Map=firmware.map` writes the symbol map for the big-symbol hunt. Done when: every region is under 100 percent and `.data`'s LMA is inside flash.

   ```bash
   arm-none-eabi-size -A firmware.elf
   arm-none-eabi-objdump -h firmware.elf
   arm-none-eabi-readelf -S firmware.elf
   ```

   `references/linker-script-anatomy.md` has a complete STM32F407 script with the ARM unwind and `.init_array` sections and the table of built-in functions.

## Failure and recovery

| Error | Cause | Fix |
|---|---|---|
| ``region `FLASH' overflowed by N bytes`` | Image larger than flash | `-Os`, `-ffunction-sections -fdata-sections` with `-Wl,--gc-sections`, LTO; find the big symbols in the map file. |
| ``region `RAM' overflowed`` | `.data`, `.bss`, heap, and stack exceed RAM | Shrink buffers, cut `_stack_size` or the heap, move constants to `const` so they land in `.rodata`. |
| `undefined reference to '_estack'` | Startup expects a symbol the script does not define | Define `_estack = ORIGIN(RAM) + LENGTH(RAM);`. |
| `.data` reads garbage at boot | LMA equals VMA, or startup copies the wrong range | Add `AT > FLASH`; copy from `LOADADDR(.data)` to `_sdata` up to `_edata`. |
| Vector table missing from the image | `--gc-sections` removed it | Wrap it in `KEEP`. |
| `cannot open linker script file` | Wrong path | Pass `-T path/to/script.ld` or add `-L dir`. |

## Output

A linker script and startup symbols in the named directory that link the image into the datasheet's regions, with `readelf -S` and `objdump -h` output confirming `.data` LMA in flash and VMA in RAM and every region within its length.
