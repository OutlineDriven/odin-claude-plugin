# ELF inspection cheatsheet

Sources: readelf(1), objdump(1), nm(1) man pages.

## Quick reference

| Task | Command |
|------|---------|
| File type | `file prog` |
| Section sizes | `size prog` or `size --format=sysv prog` |
| Dynamic deps | `ldd prog` |
| All symbols | `nm prog` |
| Dynamic symbols | `nm -D lib.so` |
| Demangle C++ | `nm -C prog` |
| Undefined symbols | `nm -u prog` |
| ELF header | `readelf -h prog` |
| Sections | `readelf -S prog` |
| Segments | `readelf -l prog` |
| Dynamic section | `readelf -d prog` |
| Symbol table | `readelf -s prog` |
| Relocations | `readelf -r prog` |
| Notes, build ID | `readelf -n prog` |
| Disassemble | `objdump -d prog` |
| Intel syntax | `objdump -d -M intel prog` |
| Source and asm | `objdump -d -S prog` |
| Hex dump a section | `objdump -s -j .rodata prog` |

## nm symbol types

| Code | Meaning |
|------|---------|
| `T` | Global function, text |
| `t` | Local function, text |
| `D` | Global initialized data |
| `d` | Local initialized data |
| `B` | Global bss |
| `b` | Local bss |
| `R` | Global read-only data |
| `r` | Local read-only data |
| `U` | Undefined, external dependency |
| `W` | Weak global symbol |
| `w` | Weak local symbol |
| `V` | Weak object, C++ |
| `I` | Indirect reference |
| `A` | Absolute symbol |
| `C` | Common symbol |

## Common ELF sections

| Section | Content |
|---------|---------|
| `.text` | Executable code |
| `.data` | Initialized globals |
| `.bss` | Uninitialized globals, zero at startup |
| `.rodata` | Read-only data, string literals |
| `.plt` | Procedure linkage table, lazy binding |
| `.got` | Global offset table |
| `.got.plt` | GOT entries for PLT |
| `.dynsym` | Dynamic symbol table |
| `.dynstr` | Dynamic symbol names |
| `.rela.dyn` | Relocations for data and GOT |
| `.rela.plt` | Relocations for PLT |
| `.debug_*` | DWARF debug information |
| `.note.gnu.build-id` | Build ID |
| `.gnu.hash` | Symbol lookup hash |

## Hardening checks

```bash
readelf -h prog | grep 'Type:'      # ET_DYN with an entry point means PIE
readelf -l prog | grep 'GNU_RELRO'
readelf -d prog | grep BIND_NOW     # full RELRO needs BIND_NOW
readelf -l prog | grep 'GNU_STACK'  # RW, not RWE, means non-executable stack
nm prog | grep __stack_chk_fail     # stack protector
nm prog | grep __memcpy_chk         # FORTIFY_SOURCE in use
checksec --file=prog                # one-call check, separate install
```

## Shared library soname

```bash
readelf -d libfoo.so | grep SONAME
objdump -p libfoo.so | grep SONAME
ln -sf libfoo.so.1.2.3 libfoo.so.1
ln -sf libfoo.so.1     libfoo.so
```
