---
name: unslop-dedash
description: 'Use when a user asks to remove em-dashes and look-alikes from a named scope. Replaces each by grammatical role while preserving ranges, code, and deliberate marks. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Unslop dedash

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to remove em-dashes (and look-alikes) from a named scope |
| Authority | Reversible local write only; rollback by restoring original punctuation from the pre-edit snapshot |
| Side effect | Per-occurrence punctuation/wording replacement within the user-owned scope only |
| Done | Every replacement selected per occurrence by grammatical role; leave-alone classes (ranges, code, deliberate marks) untouched or surfaced as judgment calls; report includes counts |

## Inputs

1. **Scope** (required): file path, directory, or glob identifying the user-owned text to process.
2. **Strictness** (optional): `default` replaces only clear-cut cases; `strict` surfaces every occurrence as a judgment call. Default is `default`.

## Procedure

1. Enumerate all files in the named scope. If the scope is empty or does not exist, stop and report `scope-empty`.
2. For each file, scan for em-dashes (`—`, `---`, `--`), en-dashes used as em-dashes, and Unicode em-dash variants (`—`, `–` when parenthetical).
3. Classify every occurrence by its grammatical role:
   a. **Parenthetical aside** (em-dash pair or single em-dash setting off a clause) → replace with commas.
   b. **Sentence-break pause** (single em-dash mid-sentence replacing a colon or semicolon) → replace with a colon or semicolon matching the sentence structure.
   c. **Trailing interruption** (em-dash at end of dialogue or abrupt stop) → leave as-is; surface as judgment call.
   d. **Leave-alone class**: numeric ranges (`2020–2025`), code spans, mathematical notation, proper-name hyphens, and deliberate typographic marks. Do not replace; log as `skipped-range`, `skipped-code`, or `skipped-deliberate`.
4. Apply each replacement in-place. Preserve surrounding whitespace and line structure.
5. After all replacements, produce a report: total occurrences found, replaced by role class, skipped by leave-alone class, and judgment calls surfaced.

## Failure and recovery
- **scope-empty**: no files matched the scope. Report the condition; perform no writes.
- **ambiguous-role**: an occurrence fits neither a clear replacement class nor a leave-alone class. Surface it as a judgment call with the surrounding sentence. Do not guess.
- **partial-completion**: if a file write fails mid-batch, stop processing that file, report the partial state, and continue with remaining files. Every completed file retains its replacements; the failed file is unchanged.
- Rollback: the caller can restore original text from the pre-edit snapshot. The skill does not auto-rollback.

## Output
A report containing:
- Per-file counts: occurrences found, replaced (broken down by role class), skipped (broken down by leave-alone class), judgment calls.
- Aggregate totals across the scope.
- List of judgment-call occurrences with file path, line number, surrounding context, and suggested classification.

## Provenance

- Origin: `https://github.com/LilMGenius/paperthin`, path `skills/depth/dedash/SKILL.md`.
- Pinned revision: `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`.
- License: MIT (c) 2026 LilMGenius. NOTICE additionally vendors verbatim material from mattpocock/skills (MIT, (c) 2026 Matt Pocock) with per-source attribution. Retain the MIT copyright+permission notice for substantial reuse; per-source attribution obligation binds only verbatim vendor material, which the foundry does not copy.
- Adaptation: clean-room rewrite for ODIN 2.0 module odin-create. No third-party expression copied.
