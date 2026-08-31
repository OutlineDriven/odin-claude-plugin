---
name: contexts
description: 'Use when the user says "get context on X", "how does X work", or wants architectural orientation before coding. Returns a detected-mode acknowledgement, an architecture map with cited sources, and implementation-ready next steps. Read-only; no source or remote mutation.'
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
- The skill detects repo-local signals (paths, globs, symbols, or module names) and external signals (libraries, frameworks, SDKs, APIs, CLIs, or service names) from the subject; users do not supply them separately.

## Procedure

1. If a slash-arg override (`code-ref`, `doc-ref`, or `both`) is supplied, skip classification and dispatch directly to that mode. Done when: the override is dispatched or no override is present.
2. Emit the detected-mode acknowledgement as the first output line before any work: `detected: <mode> — scope=<paths|libs|both> sources=<brief summary>`. For `both`, append `(sequential dispatch: codebase first, then external)`. Done when: the `detected:` line is emitted before any work.
3. Classify the subject by first-match-wins priority, checking `both` before leaf modes so mixed-signal inputs are reachable: (1) `both` when repo-local signal and external signal are both present and non-trivial; (2) `code-ref` when repo-local signal is present and no external signal; (3) `doc-ref` when external signal is present and no repo-local signal; (4) `ambiguous` when neither signal is cleanly detected or neither is dominant. Done when: a mode is classified or `ambiguous` is returned.
4. If the classifier returns `ambiguous`, or both signals are present but one is dominant and the mode is unclear, ask the user a single-select question (never multi-select) with options `code-ref`, `doc-ref`, `both`, marking `(Recommended)` on the closest classifier match. Ask one question on one axis; do not batch unrelated axes. Done when: the user answers the single-select or the question is asked.
5. For `code-ref`: explore the repo and emit an 8-section report — Task Understanding, Architecture Context, Pattern Context, Tooling Context, Dependency Map, Critical Files Summary, Constraints & Considerations, Recommended Next Steps. Done when: the 8-section codebase report is emitted.
6. For `doc-ref`: walk the 5-tier source ladder (Official docs → API refs → Books/papers → Tutorials → Community) and emit source-cited claims with confidence labels. Done when: source-cited claims with confidence labels are emitted from the 5-tier ladder.
7. For `both`: run `code-ref` first, extract the symbols, modules, and interfaces relevant to the external subject, feed that symbol list as context into `doc-ref`, then emit both outputs in sequence with each section labeled. Sequential dispatch roughly doubles wall-clock time; the `detected:` line warns the user. Done when: both reports are emitted in sequence with labeled sections.
8. Do not write or edit any file during context gathering. Done when: context gathering is complete and no file was written or edited.

## Failure and recovery
- Ambiguous mode with no override and no user answer: stop and report `ambiguous`; do not guess a mode.
- No repo-local signal matched for `code-ref`: report which paths and symbols were searched and that none matched; do not fabricate architecture.
- No citable external source found for `doc-ref`: report the tiers searched and that none returned evidence; do not invent claims or confidence labels.
- Partial result in `both`: if `code-ref` succeeds but `doc-ref` finds no sources, emit the codebase report and mark the external section no-evidence; never pretend the done predicate holds.
- Non-mutation: any error leaves the working tree unchanged; this skill never edits files, so no rollback is needed.

## Output
First line `detected: <mode> — scope=<paths|libs|both> sources=<brief summary>`, then `code-ref` (8-section architecture report), `doc-ref` (source-cited claims with confidence labels), or `both` (both reports in sequence, each section labeled). Terminal classification `ambiguous` when the gate is unanswered.
