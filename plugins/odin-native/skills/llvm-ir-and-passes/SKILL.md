---
name: llvm-ir-and-passes
description: 'Use when reading LLVM IR, explaining SSA and PHI nodes, finding what -O2 changed, or running opt on a .ll or .bc file. Not for writing a pass plugin: use llvm-passes.'
---

# LLVM IR and passes

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user wants to know what `-O2` did to a function, which pass created an instruction or PHI, why a pass name is not found, why IR differs between two Clang versions, or how to read SSA, dominance, `undef`, and `poison` before writing a pass. |
| Authority | Reversible local: writes only `.ll` and `.bc` files under a scratch directory named in the report; rollback is deleting that directory. No remote mutation. |
| Side effect | Runs `clang`, `opt`, and `llvm-dis` on the supplied input and diffs the results. Project files are not modified. |
| Done | The IR question is answered with the IR itself as evidence: the instruction or block is quoted, the pass that produced or removed it is named from an `opt` run, and any version mismatch is stated. |

## Inputs

1. Source, `.ll`, or `.bc` input (required).
2. The question (required): a region of IR, a pass name, or a before-and-after comparison.
3. Installed LLVM version (gathered by the skill): `opt --version` and `clang --version` must match the major. Grounded current stable is LLVM 23.1.0; flags and pass names below are confirmed against it.

## Procedure

1. Emit IR at the level the question needs. `-O0` keeps the source structure but marks every function `optnone`, which blocks later `opt` runs on that file; `-O2` gives the optimized form.

   ```bash
   clang -S -emit-llvm -O0 -Xclang -disable-O0-optnone -o foo.ll foo.c
   clang -c -emit-llvm -O2 -o foo.bc foo.c
   llvm-dis foo.bc -o foo-O2.ll
   ```

   Release builds of Clang discard value names; `-fno-discard-value-names` keeps `%sum`-style names, which makes the IR readable. Done when: a `.ll` file exists for the level the question is about.
2. Read the IR as SSA. Every value is defined once; a function is a list of basic blocks; each block ends in a terminator (`ret`, `br`, `switch`, `unreachable`); values are typed (`i32`, `ptr`, `<4 x float>`). At a control-flow merge, a `phi` selects the incoming value by predecessor block:

   ```llvm
   define i32 @add(i32 %a, i32 %b) {
   entry:
     %sum = add i32 %a, %b
     ret i32 %sum
   }

   merge:
     %v = phi i32 [ %a, %then ], [ %b, %else ]
   ```

   A `phi` exists because two definitions of one source variable reach the merge; the pass that promotes stack slots to registers (`mem2reg` at `-O0` plus a single pass, `sroa` inside the pipeline) is the usual creator. Done when: each instruction in the region is read as definition, use, or terminator and each `phi` is tied to its predecessor blocks.
3. Read `undef` and `poison` as IR semantics, not as C undefined behaviour. `poison` is the result of an operation whose preconditions failed (`add nsw` overflow, an out-of-range shift); using it in a branch or memory operation is immediate undefined behaviour, and passes may fold it freely. `undef` is an arbitrary value chosen per use and is being replaced by `poison` across the optimizer. A C source construct with undefined behaviour usually reaches IR as one of these, which is why a pass "deleted" code the source relied on. Done when: each `undef` or `poison` in the region is traced to the operation that produced it.
4. Run the standard pipeline through `opt` with the new pass manager syntax and inspect the changes:

   ```bash
   opt -passes='default<O2>' -S foo.ll -o foo-opt.ll
   opt -passes='default<O2>' -print-changed -S foo.ll -o /dev/null
   opt --print-passes | grep -i <name>
   ```

   `--print-passes` lists every pass name the installed `opt` accepts and exits; use it whenever a pass name is rejected. `-print-changed` prints the IR after each pass that changed it, which locates the pass that created or removed the instruction in question. Done when: the pass that made the change is named from the `-print-changed` output.
5. Run a single pass or a short pipeline to isolate an effect, and diff against the input:

   ```bash
   opt -passes='instcombine,simplifycfg' -S foo.ll -o - | diff -u foo.ll -
   ```

   Done when: the diff shows only the effect of the passes named.
6. Print an analysis when a question is about structure rather than a transform:

   ```bash
   opt -passes='print<domtree>' -disable-output foo.ll
   opt -passes='print<loops>' -disable-output foo.ll
   ```

   Dominance decides where a value may be used and where code may be hoisted; loop info shows the nest the loop passes operate on. Done when: the printed structure answers the question or shows why a transform was illegal.
7. For a miscompile suspected between Clang versions, emit IR from both at the same level and diff. Bitcode is not stable across majors, so regenerate from source with each toolchain rather than feeding one version's `.bc` to the other's `opt`. Done when: the first diverging instruction is quoted with both versions named.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Pass name not found | The name changed between releases. Run `opt --print-passes` on the installed build and use the listed name. |
| `opt` changes nothing at `-O0` input | Functions carry `optnone`. Re-emit with `-Xclang -disable-O0-optnone`, or emit at `-O1` and above. |
| IR parse error on a `.ll` from another machine | LLVM major mismatch. Match `clang` and `opt` majors; regenerate from source. |
| IR too large to read | Inlined headers. Emit with `-fno-discard-value-names` and filter to the function under study with `llvm-extract -func=<name>`. |
| Pipeline string rejected | Legacy `-instcombine` style flags. Use `-passes=` syntax only. |

No partial result is claimed complete. If a step cannot finish, the report states which steps ran and which are blocked.

## Output

An IR report containing:
1. The IR region under question, quoted at the requested level.
2. Pass attribution: the pass that created, changed, or removed each instruction asked about, from `-print-changed` output.
3. Semantics notes: each `phi`, `undef`, or `poison` in the region explained by its predecessors or producing operation.
4. Versions: the `clang` and `opt` versions used and any mismatch found.
5. Scratch location: the directory holding the generated `.ll` and `.bc` files.
