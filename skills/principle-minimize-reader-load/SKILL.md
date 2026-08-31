---
name: principle-minimize-reader-load
description: 'Use when code-reading burden must be reduced. Collapses pass-through layers and narrows scopes so state origin and mutation become quickly traceable. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Minimize reader load

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Reduce code-reading burden. |
| Authority | Reversible local edit: write only the named project source files. Roll back through version control or by restoring pre-edit file content. |
| Side effect | Simplifies code structure; behavior must not change and no file outside the named set is written. |
| Done | State origin and mutation become quickly traceable. |

## Inputs

- Required: the named file, function, or class set to simplify. No named target, no edit.
- Optional: a test, type-check, or build command that proves behavior preservation for the target. If none is supplied, verification is by reading the diff only.

## Procedure

1. Bound the scope before any mutation: write down the exact named files and symbols. Any edit that would need to touch a file outside this set stops the pass at that point.
2. Read the target and trace every piece of state: record where it originates and every point where it is mutated. This trace is the baseline the done predicate is measured against.
3. Collapse pass-throughs: delete any function, wrapper, parameter, variable, or layer whose only job is forwarding to another name, and point its callers at the real implementation. Keep a forwarder only when it adds behavior, guards a boundary, or carries a name the reader needs.
4. Narrow scopes: move each declaration to the smallest scope that still serves every use — shrink function bodies, lower visibility, shorten state lifetimes, and pull broad module-level state into the functions that use it.
5. Re-trace the state after each edit. A fresh reader must find where state originates and where it mutates in one pass; stop when this holds and do not keep editing past it.
6. Verify behavior preservation: run the supplied check when one exists; otherwise re-read the full diff and confirm every execution path is unchanged.

## Failure and recovery
- Boundary crossing: a collapse or narrowing needs edits outside the named set. Do not widen scope; stop, keep completed in-scope edits that passed checks, and report the exact boundary and the unapplied remainder.
- Load-bearing forwarder: the target carries behavior — validation, a side effect, or an intentional abstraction boundary. Do not collapse it; record it as retained.
- Behavior check fails after an edit: restore the file's pre-edit content immediately. Never keep a simplification that changes behavior.
- Scope cannot shrink without changing public interfaces: declare the pass blocked with that reason. Never claim the done predicate holds.
- No invented evidence: if a check cannot run and the diff cannot be read with confidence, classify the result as blocked rather than done.

## Output
- The edited named files with pass-throughs collapsed and scopes narrowed.
- A report listing each edit — what was collapsed or narrowed — and the final trace: where each piece of touched state now originates and where it mutates.
- Terminal classification: done (the one-pass trace holds) or blocked, with the named reason and the retained remainder.

## Provenance

Adapted from `pstack/skills/principle-minimize-reader-load/SKILL.md` in cursor/plugins at revision `68836ddaf5697224520f1847d90cdb90ca8babaa`, MIT licensed; pstack is authored by Lauren Tan (poteto), LICENSE blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`. Disposition is ADAPT: the pass-through-collapse and scope-narrowing mechanism is preserved while all expression is rewritten for this skill; no third-party text is copied verbatim.
