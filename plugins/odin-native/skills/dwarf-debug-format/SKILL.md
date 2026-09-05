---
name: dwarf-debug-format
description: 'Use when inspecting .debug_info or .debug_line sections with dwarfdump or readelf, working with split-DWARF .dwo files, setting up debuginfod, or checking how LTO and stripping affect debug info.'
---

# DWARF debug format

## Contract

| Field | Bound contract |
|---|---|
| Trigger | DWARF sections in an ELF binary need listing or reading, `.dwo` split files need producing or packaging, debuginfod needs configuring, or LTO and stripping change what debug info survives. |
| Authority | Read-only. Emits analysis and commands for the operator to run on the target; no file writes, no rollback needed. No remote mutation. |
| Side effect | Inspection commands and a verdict in chat. Nothing is written. |
| Done | The debug info question is answered from the binary's own sections, or the missing piece (`.dwo`, debug package, build ID) is named. |

## Inputs

1. Binary or object file (required): the ELF file whose debug info is in question.
2. Toolchain (optional): `readelf` and `llvm-dwarfdump` cover most queries; `dwarfdump` and `eu-strip` come from libdwarf and elfutils packages.
3. Build ID (optional): needed for debuginfod lookups.

## Procedure

1. List the DWARF sections.

   ```bash
   readelf -S prog | grep "\.debug"
   ```

   | Section | Contents |
   |---|---|
   | `.debug_info` | DIEs: types, variables, functions |
   | `.debug_abbrev` | Abbreviation table for `.debug_info` |
   | `.debug_line` | Source line to address mapping |
   | `.debug_str` | Identifier strings |
   | `.debug_loc` / `.debug_loclists` | Variable location expressions (DWARF 4 / DWARF 5) |
   | `.debug_ranges` / `.debug_rnglists` | Non-contiguous address ranges (DWARF 4 / DWARF 5) |
   | `.debug_aranges` | Address to compilation unit lookup |
   | `.debug_pubnames` / `.debug_names` | Global name index (DWARF 4 / DWARF 5) |
   | `.debug_frame` | DWARF call frame information; `.eh_frame` is the runtime unwinding variant |
   | `.debug_addr` | Address table (DWARF 5) |
   | `.debug_line_str` | Line-table strings (DWARF 5) |

   Done when: the present sections are listed and named.
2. Inspect the contents.

   ```bash
   readelf --debug-dump=info prog      # DIEs
   readelf --debug-dump=lines prog     # line table
   llvm-dwarfdump --debug-info prog    # more readable DIE dump
   llvm-dwarfdump --statistics prog    # debug info size and quality metrics
   dwarfdump prog                      # full dump, when libdwarf's dwarfdump is installed
   ```

   Done when: the target section's contents are on screen.
3. Read the DIE structure. Debug info is a tree of Debug Information Entries. Each DIE has a tag (`DW_TAG_*`) and attributes (`DW_AT_*`).

   ```text
   DW_TAG_compile_unit
     DW_AT_producer  : "GNU C17 13.2.0"
     DW_AT_name      : "main.c"
     DW_AT_comp_dir  : "/home/user/project"
     DW_TAG_subprogram
       DW_AT_name    : "add"
       DW_AT_low_pc  : 0x401130        # function start
       DW_AT_high_pc : 0x401150        # function end
       DW_TAG_formal_parameter
         DW_AT_name     : "a"
         DW_AT_location : DW_OP_reg5   # x86-64 register rdi
   ```

   Common tags: `compile_unit`, `subprogram`, `variable`, `formal_parameter`, `typedef`, `structure_type`, `member`, `array_type`, `pointer_type`, `base_type`. Common attributes: `name`, `type`, `location`, `low_pc`, `high_pc`, `byte_size`, `encoding`, `file`, `line`. Done when: the DIE of interest is located and its attributes are read.
4. Work with split DWARF. `-gsplit-dwarf` writes debug info to `.dwo` sidecars so the linker never processes it.

   ```bash
   gcc -g -gsplit-dwarf -O2 -c main.c -o main.o   # main.o plus main.dwo
   gcc main.o -o prog                             # prog references main.dwo
   dwarfdump prog | grep dwo_name                 # DW_AT_GNU_dwo_name holds the path
   dwp -o prog.dwp prog                           # GNU: pack .dwo files into one .dwp
   llvm-dwp -o prog.dwp prog                      # LLVM equivalent
   ```

   GDB resolves `.dwo` and `.dwp` files placed next to the binary. Done when: the binary links without debug input and GDB still resolves symbols.
5. Configure debuginfod for remote symbols.

   ```bash
   export DEBUGINFOD_URLS="https://debuginfod.elfutils.org/"
   gdb /usr/bin/git                     # fetches missing debug info over HTTP
   debuginfod-find debuginfo <build-id-or-path>
   debuginfod-find source <build-id> /path/to/source.c
   ```

   ```gdb
   (gdb) set debuginfod enabled on
   (gdb) set debuginfod verbose 1
   ```

   Run a private server with `debuginfod -d /var/cache/debuginfod -p 8002 /path/to/binaries/` and point `DEBUGINFOD_URLS` at `http://localhost:8002`. Done when: GDB fetches symbols for a stripped system binary.
6. Judge LTO's effect. `-flto` generates DWARF after link-time optimization, so merged, inlined, or eliminated entities lose their debug entries. `-flto=thin` (Clang) keeps more. For maximum debug info, build a separate `-Og -g` binary without LTO. In Rust, the dev profile already defaults to `lto = "off"`; enabling `lto` in a release profile trades debug detail for optimization. Done when: the LTO/debug tradeoff is stated for the build in question.
7. Strip binaries while keeping symbols.

   ```bash
   objcopy --only-keep-debug prog prog.debug
   strip --strip-debug prog
   objcopy --add-gnu-debuglink=prog.debug prog   # GDB finds prog.debug automatically
   eu-strip -f prog.debug prog                   # elfutils: split in one step
   readelf -n prog | grep -i debug               # verify the link
   llvm-dwarfdump --statistics prog              # check what debug info remains
   size --format=SysV prog                       # section sizes
   ```

   Done when: the stripped binary resolves symbols through its debug link or a symbol store.

## Failure and recovery

- `readelf -S` shows no `.debug_*` sections: the binary was built without `-g` or was stripped. Rebuild with `-g` or locate the matching debug file by build ID.
- `.dwo` files not found: they must sit next to the objects or be packed into a `.dwp`. Check `DW_AT_GNU_dwo_name` for the expected path.
- debuginfod fetch fails: confirm `DEBUGINFOD_URLS` is set in the environment GDB inherits, and that the distro runs a server for that package.
- LTO build loses the variable being chased: rebuild that translation unit without `-flto`, or debug the `-Og` build instead.
- DWARF version mismatch: older tools cannot parse DWARF 5 sections. Use a current `readelf` or `llvm-dwarfdump`, or rebuild with `-gdwarf-4`.

## Output

An answer grounded in the binary's own sections: the DIE or line-table entry found, the `.dwo`/debuginfod path configured, or the named reason the debug info is absent.
