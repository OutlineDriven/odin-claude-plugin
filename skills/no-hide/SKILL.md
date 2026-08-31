---
name: no-hide
description: 'Use when the user asks, detect clever-concealment patterns that obscure real code structure and flag each one with location and severity. Don''t use for tasks that require source or remote-system changes.'
---

# No hide

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to fail clever concealment that obscures real structure. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A report identifying concealment that obscures real structure. |
| Done | Clever concealment that obscures real structure is identified and flagged. |

## Inputs

- **Target scope** (required): file path, directory path, module name, or diff range to inspect.
- **Concealment form** (optional): if the user names a specific form, restrict detection to that form. If omitted, detect all forms.

## Procedure

1. **Resolve the target.** Locate the supplied scope. If the target does not exist or cannot be read, stop and return `target-missing`.

2. **Parse each target file.** Read the full text of every reachable source file within the scope.

3. **Detect concealment patterns.** Apply every applicable form. Stop scanning a file once any pattern is confirmed at high severity.

   | Form | What to flag |
   |---|---|  
   | Abstraction layering | Classes of indirection that add no behavior and require the reader to mentally reconstruct what a direct implementation would look like. One forwarding or delegation layer is allowed; two or more on the same call chain is concealment. |
   | Obscured naming | Names that describe implementation technique instead of domain concept, or names that invert the polarity of the operation (e.g., `disableSecurity()` that enables it, `close()` that opens a resource). |
   | Implicit control flow | Conditional logic encoded in naming conventions, comment conventions, or ordering rather than explicit if/else/switch. Loops whose termination depends on a mutable global or a side effect not visible at the call site. |
   | Indirection masking dependencies | Static calls, eager imports, or compile-time instantiation that make the runtime dependency graph invisible. Singleton accessors that bypass injection. Global mutable state accessed without an explicit reference. |
   | Structure serving author taste | File and module organization chosen for the author's sense of elegance rather than the reader's navigation. Depth-first directory trees where breadth-first would match the mental model. |

4. **Classify severity.**

   - **High**: actively misleads or inverts meaning. The reader will reach a wrong conclusion.
   - **Medium**: requires extra effort to decode; no active falsehood.
   - **Low**: friction without meaningful misdirection.

5. **Return the report.** If no pattern is found, report that explicitly. If patterns are found, include every confirmed instance with file, line or range, pattern form, and severity.

## Failure and recovery
- **target-missing**: the supplied scope does not exist or cannot be read. Do not proceed. Return `{status: "target-missing", scope: <supplied>}`.
- **context-insufficient**: the scope is too large to inspect within available context budget. Return partial results for confirmed findings; mark unscanned remainder as `incomplete`.
- **out-of-scope form**: the user named a concealment form this skill does not detect. Return `{status: "form-unknown", forms: <list of supported forms>}`.
- **stop rather than widen**: if the target scope contains items that are not source code, ignore them. Do not scan configuration, documentation, or generated artifacts unless the user explicitly names them.

## Output
A structured report with:
- `status`: `clean` (no concealment found) or `found` (one or more instances found).
- `findings[]`: each entry has `file`, `location`, `form`, `severity`, and `description`.
- `summary`: count of findings per severity.
- `done`: `true` when the scan of the named scope is complete, even if findings is empty.

## Provenance

Origin: ODIN portal conversation, clean-room adaptation per `curated:curated-ideas:curated-043`. Adapted from "복잡성을 지나치게 똑똑하게 가리지마라, 헛똑똑이 밴" (avoid overly clever complexity concealment — half-smart bans). Distinct from `unleash-abstraction`, which performs a refactor; `no-hide` only reports.
