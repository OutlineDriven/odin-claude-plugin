---
name: contexts
description: 'Use when the user says "get context on X", "how does X work", or wants architectural orientation before coding. Returns a detected-mode acknowledgement, mapped architecture and cited sources, and implementation-ready next steps without editing files. Don''t use for tasks that require source or remote-system changes.'
---

# Contexts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "get context on X", "how does X work", or requests architectural orientation before coding. |
| Authority | Read-only; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None; returns architectural and/or cited external context. |
| Done | Mode is explicit, relevant architecture and sources are mapped, and implementation-ready next steps are identified without editing files. |

## Inputs

- Subject phrase (the "X" in "get context on X"). Required.
- Optional slash-arg override: `code-ref`, `doc-ref`, or `both` bypasses the classifier and dispatches directly.
- Repo-local signal (path, glob, symbol, or module name) and external signal (library, framework, SDK, API, CLI, or service name) are detected from the subject, not supplied separately.

## Procedure

1. If a slash-arg override (`code-ref`, `doc-ref`, or `both`) is supplied, skip classification and dispatch directly to that mode.
2. Emit the detected-mode acknowledgement as the first output line before any work: `detected: <mode> — scope=<paths|libs|both> sources=<brief summary>`. For `both`, append `(sequential dispatch: codebase first, then external)`.
3. Classify the subject by first-match-wins priority, checking `both` before leaf modes so mixed-signal inputs are reachable: (1) `both` when repo-local signal and external signal are both present and non-trivial; (2) `code-ref` when repo-local signal is present and no external signal; (3) `doc-ref` when external signal is present and no repo-local signal; (4) `ambiguous` when neither signal is cleanly detected or neither is dominant.
4. If the classifier returns `ambiguous`, or both signals are present but one is dominant and the mode is unclear, ask the user a single-select question (never multi-select) with options `code-ref`, `doc-ref`, `both`, marking `(Recommended)` on the closest classifier match. Ask one question on one axis; do not batch unrelated axes.
5. For `code-ref`: explore the repo and emit an 8-section report — Task Understanding, Architecture Context, Pattern Context, Tooling Context, Dependency Map, Critical Files Summary, Constraints & Considerations, Recommended Next Steps.
6. For `doc-ref`: walk the 5-tier source ladder (Official docs → API refs → Books/papers → Tutorials → Community) and emit source-cited claims with confidence labels.
7. For `both`: run `code-ref` first, extract the symbols, modules, and interfaces relevant to the external subject, feed that symbol list as context into `doc-ref`, then emit both outputs in sequence with each section labeled. Sequential dispatch roughly doubles wall-clock time; the `detected:` line warns the user.
8. Do not write or edit any file during context gathering.

## Failure and recovery
- Ambiguous mode with no override and no user answer: stop and report `ambiguous`; do not guess a mode.
- No repo-local signal matched for `code-ref`: report which paths and symbols were searched and that none matched; do not fabricate architecture.
- No citable external source found for `doc-ref`: report the tiers searched and that none returned evidence; do not invent claims or confidence labels.
- Partial result in `both`: if `code-ref` succeeds but `doc-ref` finds no sources, emit the codebase report and mark the external section no-evidence; never pretend the done predicate holds.
- Non-mutation: any error leaves the working tree unchanged; this skill never edits files, so no rollback is needed.

## Output
- First line: `detected: <mode> — scope=<paths|libs|both> sources=<brief summary>`.
- `code-ref`: the 8-section architecture report.
- `doc-ref`: source-cited claims with confidence labels from the 5-tier ladder.
- `both`: both reports in sequence, each section labeled.
- Terminal classification `ambiguous` when the gate is unanswered.

## Provenance

- Origin: ODIN 1.x current skill `skills/contexts/SKILL.md`.
- Revision: unpinned (current).
- License: project-owned.
- Adaptation: restructured into the ODIN 2.0 contract section order and inlined the codebase-exploration and external-research workflows as concrete procedure steps so the skill is self-contained with no dependency on other skills or modules.
