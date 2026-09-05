---
name: elf-inspection
description: 'Use when examining ELF binaries with readelf, objdump, nm, or ldd: dependencies, symbols, sections, relocations, build IDs, or hardening. Not for modifying binaries: use binutils.'
---

# ELF inspection

An ELF binary reports its own structure. Every question about dependencies, symbols, sections, or hardening is one `readelf`, `objdump`, `nm`, or `ldd` query away. This skill is read-only; transformation of binaries belongs to `binutils`.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task inspects what a binary depends on, why it is large, which symbols it exports or needs, whether it is PIE or RELRO-hardened, or why a symbol is undefined at link time or load time. |
| Authority | Read-only. The commands read the named binaries and print to stdout; no file is written, so no rollback applies. No remote mutation. |
| Side effect | None. Output goes to the chat or the terminal. |
| Done | The question about the binary is answered with the matching tool output quoted, and every quoted fact comes from the binary itself. |

## Inputs

- The binary or library to inspect: required.
- The question: required. Dependency, symbol, size, hardening, relocation, or build identity.
- A symbol name or address: optional, narrows the query.

## Procedure

1. Classify the file. `file` reports architecture, linkage, and stripped state; `size` reports text, data, and bss. Done when: the type and the stripped state are known, because they select the tools for later steps.

```bash
file prog
size --format=sysv prog
```

2. List dynamic dependencies with `ldd`. A `not found` row names the deployment gap. Done when: every `DT_NEEDED` entry resolves, or the missing one is named.

```bash
ldd ./prog
ldd -v ./prog          # include version requirements
```

`ldd` executes the loader against the binary. Never run it on an untrusted binary; use `readelf -d` for those.

3. Query symbols with `nm`. `-D` reads the dynamic table, `-C` demangles, `-u` lists what the binary needs. Done when: the symbol is found with its type, or its absence is proven.

```bash
nm -D ./libfoo.so            # exported dynamic symbols
nm -C prog                   # demangled
nm -u prog                   # undefined symbols
nm -S --defined-only prog    # with sizes
```

Type codes: `T`/`t` code, `D`/`d` initialized data, `B`/`b` bss, `R`/`r` read-only data, upper for global and lower for local, `U` undefined, `W`/`w` weak, `V` weak object.

4. Read structure with `readelf`. It needs no execution and parses every ELF. Done when: the requested section, segment, or table is printed.

```bash
readelf -h prog    # header: class, machine, type, entry
readelf -S prog    # sections
readelf -l prog    # program headers, segments
readelf -d prog    # dynamic section, raw form of ldd
readelf -s prog    # symbol tables
readelf -r prog    # relocations
readelf -n prog    # notes, build ID
readelf --debug-dump=info prog   # DWARF
```

5. Disassemble with `objdump`. `-S` interleaves source when the binary carries `-g`. Done when: the code around the address or symbol is shown in the requested syntax.

```bash
objdump -d -M intel prog
objdump -d -S prog
objdump -s -j .rodata prog   # hex dump of one section
objdump -p prog              # private headers, DT_NEEDED entries
```

6. Check hardening state. PIE means `ET_DYN` on an executable; full RELRO needs `GNU_RELRO` plus `BIND_NOW`; a non-executable stack means `GNU_STACK` flags `RW`, not `RWE`. Done when: each property is reported present or absent from the binary's own headers.

```bash
readelf -h prog | grep 'Type:'
readelf -l prog | grep GNU_RELRO
readelf -d prog | grep BIND_NOW
readelf -l prog | grep GNU_STACK
nm prog | grep __stack_chk_fail     # stack protector
```

`checksec --file=prog` runs the same checks in one call and is a separate install.

7. Analyze size. Rank symbols by size, then rank sections. For per-object contribution, rebuild the link with `-Wl,--print-map` or run `bloaty`, a separate install. Done when: the largest contributors are named with numbers.

```bash
size --format=sysv prog | sort -k2 -nr | head
nm -S --defined-only prog | sort -k2 -nr | head -20
```

8. Read the build ID. It identifies the exact build for `debuginfod` lookups and pairs the binary with its `.debug` file. Done when: the ID is quoted.

```bash
readelf -n prog | grep 'Build ID'
```

9. Run the diagnosis flows. Done when: the reported error traces to its cause in the binary.

- Undefined symbol at load time: `nm -D libfoo.so | grep mysymbol` to see whether the expected provider exports it, then `ldd ./prog | grep libfoo` to see whether the loader found that provider.
- Binary too large: steps 1 and 7, then decide between stripping debug info (`binutils`), removing sections, or restructuring data.
- Unexpected dependency: `readelf -d prog | grep NEEDED`, then trace who pulls it in with the link map.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `nm` prints `no symbols` | The binary is stripped. Inspect the dynamic table with `nm -D`, or point the tools at the `.debug` file or unstripped build. |
| `ldd` reports `not a dynamic executable` | The binary is static or for another architecture. Confirm with `file`, and use the triplet-prefixed tools for foreign objects. |
| Section names absent | The binary may be stripped of the section header table. Read it through program headers with `readelf -l`. |
| Two builds disagree | Compare build IDs from `readelf -n` before comparing anything else; a mismatch means the inputs differ. |

## Output

A quoted-answer report: the tool command, its relevant output lines, and the conclusion drawn from them. The command table, symbol type list, and section map are in `references/cheatsheet.md`.
