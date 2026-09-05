---
name: reverse-engineering
description: 'Use when triaging an unknown binary, decompiling with Ghidra, scripting radare2, or diffing two builds for patched functions. Not for ELF structure basics: use elf-inspection.'
---

# Reverse engineering

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user must understand a binary without source: triage an unknown file, recover logic with a decompiler, script an analysis, identify C++ patterns or the entry point in a stripped binary, patch a copy, or find which functions changed between two builds. |
| Authority | Reversible local: writes only analysis notes, scripts, and patched binary copies under a scratch directory named in the report; rollback is deleting that directory. The original binary is never modified in place. No remote mutation. |
| Side effect | Runs triage and analysis tools on copies of the binary and records findings. |
| Done | Each question about the binary is answered with the tool output as evidence: the file type, the protections, the decompiled region or disassembly, and, for diffs, the list of changed functions. |

## Inputs

1. The binary (required): a path to the file. Work on a copy in a scratch directory. Untrusted binaries are analyzed in an isolated lab machine or VM, never on a workstation with credentials.
2. The question (required): file identity, a function's logic, a patch location, or a between-builds comparison.
3. The toolchain present (gathered by the skill): `file`, `strings`, `readelf`, `objdump`, `checksec`, Ghidra, radare2 6.2.0 (flags below confirmed against the installed build).

## Procedure

1. Triage first, before opening a disassembler. Identify the format, protections, and readable content:

   ```bash
   file suspicious_binary
   strings -n 8 suspicious_binary | head -50
   strings -el suspicious_binary | head -20
   xxd suspicious_binary | head -20
   readelf -h suspicious_binary
   nm -D suspicious_binary | head
   checksec --file=suspicious_binary
   ```

   | Output | Meaning |
   |---|---|
   | `file` fields | Architecture, static or dynamic, stripped or not |
   | `strings` | URLs, paths, error messages, key material |
   | `readelf -s` | Symbol table, when not stripped |
   | `checksec` | RELRO, stack canary, NX, PIE, RPATH |

   Done when: architecture, stripped state, and protections are recorded.
2. For full understanding, analyze headlessly with Ghidra, then read the decompiler. A custom script needs `-scriptPath`; `-import` adds new files while `-process` runs against a file already in the project:

   ```bash
   analyzeHeadless /tmp/ghidra_projects MyProject -import suspicious_binary
   analyzeHeadless /tmp/ghidra_projects MyProject -process suspicious_binary \
     -scriptPath /tmp/scripts -postScript ListLargeFunctions.java
   ```

   In the GUI the order is: let auto-analysis finish, press `F` to define a function at a missed entry, open the decompiler for C-like output, rename with `L`, and search cross-references with `Ctrl+Shift+F`. A script lists the functions worth reading first:

   ```java
   import ghidra.program.model.listing.*;
   FunctionManager fm = currentProgram.getFunctionManager();
   for (Function f : fm.getFunctions(true)) {
       if (f.getBody().getNumAddresses() > 100)
           println(f.getName() + " @ " + f.getEntryPoint());
   }
   ```

   Jython (Python 2.7 syntax) works for the same API; for Python 3 automation use `ghidra-bridge` against a running instance. Done when: the target function is decompiled and renamed identifiers record the analyst's reading.
3. For scripted or terminal-driven analysis, use radare2. Open writable only when patching, with `r2 -w`:

   ```
   [0x00001000]> aaa          # analyze all (imports, entry, symbols, calls)
   [0x00001000]> afl          # list functions
   [0x00001000]> s main; pdf  # seek to main, disassemble it
   [0x00001000]> iz           # strings in data sections with xrefs
   [0x00001000]> VV           # visual graph mode
   ```

   ```bash
   r2 -qc 'aaa; afl' suspicious_binary
   r2 -i analysis.r2 suspicious_binary
   ```

   Patching writes to the opened copy:

   ```
   [0x00001000]> wx 9090 @ 0x401234   # write two NOPs at the address
   [0x00001000]> wt patched_binary    # write the modified copy out
   ```

   Done when: the question is answered from `pdf`/graph output or the patched copy is written out under the scratch directory.
4. Read C++ binaries through their patterns. A virtual call loads the vtable pointer from the object and calls through a slot (`mov rax, [rdi]` then `call [rax+0x10]`); constructors store the vtable address first; templates appear as mangled `_Z` names with duplicated logic per type; `std::string` shows either an inline buffer or a heap pointer at offset 0. Demangle with `c++filt _ZN4Math3addEii`. Done when: each virtual call target in the region is resolved to a vtable slot.
5. For a stripped binary, find `main` through the C runtime: `readelf -s binary | grep -E 'main|__libc_start_main'`, or `afl~entry` in radare2 and follow the argument passed as the first function pointer. Then anchor on string cross-references to error handlers and on `syscall` instructions for the binary's real behavior. FLIRT-style library signatures in Ghidra or Binary Ninja label the libc functions so only application code remains unknown. Done when: `main` and the string-referenced handlers are identified.
6. For firmware, extract before analysis: `binwalk -e firmware.bin`, then open the extracted ELF for its architecture in Ghidra with the matching language (ARM versus Thumb matters; a wrong choice decodes garbage). For packed executables, unpack first (`upx -d` for UPX) and analyze the unpacked copy. Done when: the extracted executable parses as the architecture stated in its header.
7. For a between-builds comparison, diff at the function level: `sha256sum` both files to confirm they differ, then `diff <(objdump -d v1) <(objdump -d v2)` to list changed functions, or use Diaphora or BinDiff for matched-function diffing. The changed functions are the patch; read those first when hunting a fixed vulnerability. Done when: the changed function list is reported with the differing disassembly quoted.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Ghidra decompiler output is wrong | Indirect jumps or bad types. Fix the function signature and define structs for the parameters; re-decompile. |
| radare2 analysis is incomplete | Large binary. Run `aaa`, then broaden with `-AA`, and raise analysis depth before concluding a function is absent. |
| Wrong instruction decoding | Architecture or mode mismatch (ARM versus Thumb, MIPS variant). Set the arch (`-a arm`) or the Ghidra language and re-analyze. |
| Patching refuses to write | The file was opened read-only. Reopen with `r2 -w` on a copy, never on the original. |
| No cross-reference to a string | Position-independent code reaches it through the GOT. Follow the GOT entry or analyze at runtime with `gdb`. For dynamic behavior, use `gdb`. |
| Packed binary shows no code | Unpack first and analyze the unpacked copy; entropy spikes mark encrypted sections. |

No partial result is claimed complete. If a step cannot finish, the report states which steps ran and which are blocked.

## Output

An analysis report containing:
1. Triage: format, architecture, stripped state, and protections with the tool output.
2. Findings: each question answered with the decompiled or disassembled evidence quoted.
3. Patched copies: paths under the scratch directory, with the addresses and bytes changed.
4. Diff results: the changed function list for comparisons, with the differing disassembly.
