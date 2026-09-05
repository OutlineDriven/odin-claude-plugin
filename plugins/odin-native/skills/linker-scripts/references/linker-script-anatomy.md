# Linker script anatomy

Syntax and built-in function names follow the GNU ld manual, "Linker Scripts" chapter (`https://sourceware.org/binutils/docs/ld/Scripts.html`). Flags checked against `ld --help` from binutils on 2026-09-05.

## Complete STM32F407 example

1 MiB flash, 128 KiB SRAM, 64 KiB CCM.

```ld
ENTRY(Reset_Handler)

_Min_Heap_Size  = 0x800;
_Min_Stack_Size = 0x400;

MEMORY
{
    FLASH  (rx)  : ORIGIN = 0x08000000, LENGTH = 1024K
    RAM    (xrw) : ORIGIN = 0x20000000, LENGTH = 128K
    CCMRAM (xrw) : ORIGIN = 0x10000000, LENGTH = 64K
}

SECTIONS
{
    .isr_vector :
    {
        . = ALIGN(4);
        KEEP(*(.isr_vector))
        . = ALIGN(4);
    } > FLASH

    .text :
    {
        . = ALIGN(4);
        *(.text .text*)
        *(.glue_7 .glue_7t)
        *(.eh_frame)
        KEEP(*(.init))
        KEEP(*(.fini))
        . = ALIGN(4);
        _etext = .;
    } > FLASH

    .rodata : { . = ALIGN(4); *(.rodata .rodata*) . = ALIGN(4); } > FLASH

    /* ARM exception unwinding tables */
    .ARM.extab : { *(.ARM.extab* .gnu.linkonce.armextab.*) } > FLASH
    .ARM :
    {
        __exidx_start = .;
        *(.ARM.exidx*)
        __exidx_end = .;
    } > FLASH

    /* C++ constructors and destructors, run by __libc_init_array */
    .preinit_array :
    {
        PROVIDE_HIDDEN(__preinit_array_start = .);
        KEEP(*(.preinit_array*))
        PROVIDE_HIDDEN(__preinit_array_end = .);
    } > FLASH

    .init_array :
    {
        PROVIDE_HIDDEN(__init_array_start = .);
        KEEP(*(SORT(.init_array.*)))
        KEEP(*(.init_array*))
        PROVIDE_HIDDEN(__init_array_end = .);
    } > FLASH

    .fini_array :
    {
        PROVIDE_HIDDEN(__fini_array_start = .);
        KEEP(*(SORT(.fini_array.*)))
        KEEP(*(.fini_array*))
        PROVIDE_HIDDEN(__fini_array_end = .);
    } > FLASH

    _sidata = LOADADDR(.data);

    .data :
    {
        . = ALIGN(4);
        _sdata = .;
        *(.data .data*)
        *(.RamFunc .RamFunc*)      /* functions that run from RAM */
        . = ALIGN(4);
        _edata = .;
    } > RAM AT > FLASH

    /* CCM has its own copy loop in startup; nothing zeroes or copies it otherwise */
    .ccmram :
    {
        . = ALIGN(4);
        _sccmram = .;
        *(.ccmram .ccmram*)
        . = ALIGN(4);
        _eccmram = .;
    } > CCMRAM AT > FLASH

    .bss :
    {
        _sbss = .;
        __bss_start__ = _sbss;
        *(.bss .bss*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
        __bss_end__ = _ebss;
    } > RAM

    ._user_heap_stack :
    {
        . = ALIGN(8);
        PROVIDE(end = .);
        PROVIDE(_end = .);
        . = . + _Min_Heap_Size;
        . = . + _Min_Stack_Size;
        . = ALIGN(8);
    } > RAM

    _estack = ORIGIN(RAM) + LENGTH(RAM);

    /DISCARD/ :
    {
        libc.a ( * )
        libm.a ( * )
        libgcc.a ( * )
    }
}
```

The `._user_heap_stack` section exists to make the link fail when the heap and stack minimums do not fit after `.bss`.

## Location counter

```ld
. = 0x08000000;          /* set an absolute address */
. = ALIGN(4);            /* round up */
. += 256;                /* reserve bytes */

_stack_top = ORIGIN(RAM) + LENGTH(RAM);
_flash_end = ORIGIN(FLASH) + LENGTH(FLASH);
```

## Output section description

```ld
section [address] [(type)] :
    [AT(lma)]
    [ALIGN(section_align) | ALIGN_WITH_INPUT]
    [SUBALIGN(subsection_align)]
    [constraint]
{
    output-section-command
    ...
} [>region] [AT>lma_region] [:phdr :phdr ...] [=fillexp]
```

| Type | Meaning |
|---|---|
| `NOLOAD` | Occupies address space but is not loaded; use for `.noinit` and the stack |
| `DSECT`, `COPY`, `INFO`, `OVERLAY` | Accepted for compatibility; mark the section as not allocated |

```ld
.noinit (NOLOAD) : { *(.noinit .noinit*) } > RAM
```

## Built-in functions

| Function | Returns |
|---|---|
| `ADDR(section)` | VMA of the section |
| `LOADADDR(section)` | LMA of the section |
| `SIZEOF(section)` | Size in bytes |
| `ALIGNOF(section)` | Alignment in bytes |
| `DEFINED(symbol)` | 1 if the symbol is defined, else 0 |
| `MAX(a, b)`, `MIN(a, b)` | Larger or smaller value |
| `ALIGN(exp, align)` | `exp` rounded up to `align` |
| `ABSOLUTE(expr)` | The expression as an absolute value |
| `ORIGIN(region)`, `LENGTH(region)` | Start and size of a `MEMORY` region |
| `DATA_SEGMENT_ALIGN(maxpagesize, commonpagesize)` | Page-aligned data segment start, for hosted executables |

Commands that look like functions:

| Command | Effect |
|---|---|
| `PROVIDE(sym = expr)` | Define `sym` only if no input object defines it |
| `PROVIDE_HIDDEN(sym = expr)` | The same, with hidden visibility |
| `KEEP(pattern)` | Keep the matched input sections under `--gc-sections` |
| `SORT_BY_NAME(pattern)`, alias `SORT` | Sort matched sections by name |
| `SORT_BY_ALIGNMENT(pattern)` | Sort by alignment, largest first |

## Diagnostics at link time

```bash
arm-none-eabi-gcc ... -Wl,--print-memory-usage -Wl,-Map=firmware.map -Wl,--gc-sections
```

`--print-memory-usage` prints each `MEMORY` region with used bytes and percentage. The map file lists which object contributed each symbol, which is how to find what overflowed a region.
