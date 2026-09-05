# GNU binutils cheatsheet

Sources: <https://sourceware.org/binutils/docs/binutils/> and the binutils man pages.

## ar: static archives

```bash
ar rcs libfoo.a foo.o bar.o baz.o   # insert, create, index
ar t libfoo.a                       # list members
ar tv libfoo.a                      # verbose: sizes and dates
ar x libfoo.a foo.o                 # extract one member
ar r libfoo.a new.o                 # insert or replace
ar d libfoo.a old.o                 # delete
ar m libfoo.a foo.o                 # move member to end
ar p libfoo.a foo.o                 # print member to stdout
ar s libfoo.a                       # rebuild index, same as ranlib
nm libfoo.a                         # symbols across all members
```

Operation codes:

| Code | Meaning |
|------|---------|
| `r` | Insert or replace members |
| `d` | Delete members |
| `t` | List contents |
| `x` | Extract members |
| `p` | Print a member to stdout |
| `m` | Move members |
| `s` | Write the symbol index |

Modifiers appended to the operation:

| Modifier | Meaning |
|----------|---------|
| `c` | Create the archive if absent |
| `s` | Write the index |
| `v` | Verbose |
| `u` | Copy only files newer than the archive copy |
| `D` | Deterministic mode: zero timestamps and UIDs, reproducible builds |

LTO archives need the toolchain driver: `gcc-ar`, `gcc-ranlib`, or `llvm-ar`.

## strip: remove symbols

```bash
strip --strip-all prog        # smallest output
strip --strip-debug prog      # keep the symbol table
strip --strip-unneeded prog   # keep dynamic symbols for shared libraries
strip -o prog.stripped prog   # write a copy, keep the input
strip --remove-section=.comment prog
strip -v prog                 # report what was removed
```

Distribution split:

```bash
gcc -g -O2 -o prog main.c
objcopy --only-keep-debug prog prog.debug
strip --strip-debug prog
objcopy --add-gnu-debuglink=prog.debug prog
```

## objcopy: binary transformation

```bash
objcopy --only-keep-debug prog prog.debug
objcopy --strip-debug prog
objcopy --add-gnu-debuglink=prog.debug prog
objcopy -O binary prog prog.bin     # raw binary
objcopy -O ihex prog prog.hex       # Intel HEX
objcopy -O srec prog prog.srec      # Motorola S-record
objcopy --add-section .firmware=firmware.bin \
        --set-section-flags .firmware=alloc,load,readonly,contents prog
objcopy --remove-section .comment prog
objcopy --rename-section .text=.boot_text prog
objcopy --compress-debug-sections prog
objcopy --change-start 0x1000 prog  # shift the entry address
```

Embed a blob as linkable symbols:

```bash
objcopy -I binary -O elf64-x86-64 \
        --rename-section .data=.rodata,alloc,load,readonly,data,contents \
        data.bin data_blob.o
# defines _binary_data_bin_start, _binary_data_bin_end, _binary_data_bin_size
```

Format flags:

| Flag | Meaning |
|------|---------|
| `-I binary` | Input is a raw binary |
| `-I elf64-x86-64` | Input is 64-bit ELF |
| `-O binary` | Output raw binary |
| `-O ihex` | Output Intel HEX |
| `-O srec` | Output Motorola S-record |
| `-O elf32-littlearm` | Output 32-bit little-endian ARM ELF |
| `-B i386:x86-64` | Set the architecture |

## addr2line: address to source

```bash
addr2line -e prog 0x400a12            # file:line
addr2line -e prog -f 0x400a12         # add the function name
addr2line -e prog -f 0x400a12 0x400b34 0x401000
addr2line -e prog -f -i 0x400a12      # unwind inline frames
addr2line -e prog -p -f -i 0x400a12   # one readable line per frame
grep -o '0x[0-9a-f]*' crash.log | addr2line -e prog -f -i
```

The binary needs `-g`. For a stripped binary, point `-e` at the debug build or `.debug` file.

## strings: extract text

```bash
strings prog              # minimum length 4
strings -n 8 prog         # minimum length 8
strings -t x prog         # offsets in hex
strings -t d prog         # offsets in decimal
strings -d prog           # scan data sections only
strings prog | grep -i version
objdump -s -j .rodata prog   # dump a section; strings has no section filter
```

## c++filt: demangle symbols

```bash
c++filt _ZN3foo3barEv
echo _ZN3foo3barEv | c++filt
nm prog | c++filt
nm -C prog                # demangle inside nm
```

## ranlib: archive index

```bash
ranlib libfoo.a           # same as: ar s libfoo.a
gcc-ranlib libfoo.a       # GCC LTO archives
llvm-ranlib libfoo.a      # LLVM LTO archives
```

## Cross-binutils naming

Prefix every tool with the target triplet:

```bash
aarch64-linux-gnu-ar rcs libfoo.a foo.o
aarch64-linux-gnu-strip prog
aarch64-linux-gnu-objcopy -O binary prog prog.bin
aarch64-linux-gnu-addr2line -e prog -f 0x400a12
aarch64-linux-gnu-nm libfoo.a
aarch64-linux-gnu-strings prog

arm-none-eabi-objcopy -O binary firmware.elf firmware.bin
arm-none-eabi-size firmware.elf
```
