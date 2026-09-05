---
name: rust-unsafe
description: 'Use when writing, reviewing, or auditing unsafe Rust, or understanding raw pointers, transmute, UnsafeCell, and safe abstractions over unsafe code.'
---

# Rust unsafe

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Unsafe Rust code is being written, reviewed, or audited, or a user asks what requires `unsafe`, how to write safe wrappers, or how to use raw pointers, transmute, `UnsafeCell`, or `extern` functions. |
| Authority | Read-only. Chat output only. No remote mutation. |
| Side effect | Emits a structured guidance report and pointers to `references/unsafe-patterns.md`. |
| Done | A report is emitted that identifies the unsafe operations, invariants, audit checks, and recommended safe alternatives. |

## Inputs

1. **Code or diff** (required): the unsafe Rust to review.
2. **Audit focus** (optional): raw pointers, transmute, `UnsafeCell`, FFI, `Send`/`Sync`, or safe abstraction.
3. **Test plan** (optional): whether to run the code under Miri.

## Procedure

The `unsafe` keyword enables five capabilities. Match the code against the table before auditing each one.

| Capability | Example |
|---|---|
| Dereference raw pointers | `*const T`, `*mut T` |
| Call unsafe functions | `extern "C"` functions and `unsafe fn` |
| Access or modify mutable statics | `static mut X` |
| Implement unsafe traits | `unsafe impl Send for MyType` |
| Access union fields | `union` field access |

1. **Identify the unsafe capabilities used.** List which capabilities from the table the code uses. Done when: every `unsafe` capability in the code is named.
2. **Check raw pointer invariants.** For each raw pointer dereference, confirm it is non-null, aligned, points to initialized memory, does not violate aliasing, and is valid for the reference lifetime. Done when: all dereferences have documented invariants.
3. **Check unsafe functions and traits.** Verify each `unsafe fn` has a `/// # Safety` contract, each `unsafe trait` impl upholds the trait invariants, and each `unsafe impl Send`/`Sync` is justified by thread safety. Done when: all unsafe items have documented contracts.
4. **Check transmute and `UnsafeCell`.** Confirm the source and target types have the same size, the value is valid for the target type, and `UnsafeCell` uses are protected against concurrent mutation. Done when: transmute and interior-mutability uses are justified.
5. **Apply the audit checklist.** Use the checklist from `references/unsafe-patterns.md` and mark each item. Done when: the checklist is complete for every `unsafe` block.
6. **Recommend Miri tests.** Suggest `cargo +nightly miri test` for the unsafe code and `MIRIFLAGS="-Zmiri-strict-provenance"` for pointer-heavy code. Done when: a test plan is documented.
7. **Emit the report.** List findings, the relevant invariant, and the fix. Done when: the report is complete.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Missing `// Safety:` comment | Add one that lists every precondition the caller or caller-side code must uphold. |
| Raw pointer violates aliasing | Restructure to avoid simultaneous `&` and `&mut`, or use `UnsafeCell` with a documented ownership scheme. |
| Transmute creates an invalid value | Use safe conversions such as `TryFrom`, `f32::from_bits`, or `u32::from_ne_bytes`. |
| Manual `Send`/`Sync` impl is unsound | Remove the impl or prove thread safety with a Miri or concurrency test. |
| `unsafe` block is too large | Split it so that each `unsafe` operation has its own safety comment. |

## Output

1. A structured report naming each unsafe operation, its invariants, and any missing documentation.
2. A checklist result for each `unsafe` block.
3. A test plan that names Miri or sanitizer commands.
4. Pointers to `references/unsafe-patterns.md` for raw pointer, `NonNull`, transmute, and stacked borrows patterns.
