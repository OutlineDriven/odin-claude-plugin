---
name: contexts
description: Use when the user says "get context on X", "how does X work", or wants architectural orientation before coding.
---

# Context Command

Auto-router for pre-implementation context gathering. Classify the input as codebase-oriented, doc-oriented, or both; invoke the appropriate workflow; emit a `detected:` acknowledgement as the first output line.

## When to Apply / NOT

**Apply:**
- Any request for context, background, or orientation before implementing, fixing, or refactoring
- "How does X work", "get me context on Y", "what's the architecture of Z"

**NOT apply:**
- Bug reproduction or root-cause investigation: use a debugging workflow
- Already-in-progress implementation: gather context first, then proceed
- Analysis-only output with no pre-implementation intent

## Detected Mode Acknowledgement [LOAD-BEARING]

First output line before ANY work:

```
detected: <mode> — scope=<paths|libs|both> sources=<brief summary>
```

Mode values: `code-ref`, `doc-ref`, `both`, `ambiguous`.

For `both` mode, also append: `(sequential dispatch: codebase first, then external)`

## Input Classifier

First-match wins. Check in order: `both` must come before leaf modes so mixed-signal inputs are reachable.

| Priority | Mode | Minimum condition |
|----------|------|-------------------|
| 1 | `both` | Repo-local signal (path, glob, symbol, or module) AND external signal (library, framework, SDK, API, CLI, or service name) both present and non-trivial |
| 2 | `code-ref` | Repo-local signal present; no external signal |
| 3 | `doc-ref` | External signal present; no repo-local signal |
| 4 | `ambiguous` | Neither signal cleanly detected, OR signals present but neither dominant |

**Worked examples:**
- `"How does our /autoresearch skill use LangGraph's interrupt for HITL pauses?"` → repo signal + external signal → `both`
- `"Refactor claude/skills/contexts/SKILL.md"` → repo signal only → `code-ref`
- `"Latest Pydantic v2 model_validator signature"` → external signal only → `doc-ref`
- `"Give me context on routing"` → no concrete signal → `ambiguous` → gate fires

## Auto-Detect Gate

Fire `AskUserQuestion` (single-select, NEVER `multiSelect`) when classifier returns `ambiguous` OR when both signals are present but one is dominant and the mode is unclear:

- Options: `code-ref`, `doc-ref`, `both`
- Mark `(Recommended)` on the closest classifier match
- One question, one axis. No batching of unrelated axes.

## Hand-off & Integration

**`code-ref`:** Invoke codebase exploration workflow. Emit 8-section output (Task Understanding, Architecture Context, Pattern Context, Tooling Context, Dependency Map, Critical Files Summary, Constraints & Considerations, Recommended Next Steps).

**`doc-ref`:** Invoke external research workflow. Walk the 5-tier source ladder (Official docs → API refs → Books/papers → Tutorials → Community). Emit source-cited claims with confidence labels.

**`both` (sequential):**
1. Run codebase exploration first. Extract the symbols, modules, and interfaces that appear relevant to the external subject.
2. Feed the extracted symbol list as additional context into the external research workflow. This grounds the research in actual repo usage rather than generic library docs.
3. Emit both outputs in sequence. Label each section clearly.

Note: sequential dispatch roughly doubles wall-clock time versus a single mode. Emit `(sequential dispatch: codebase first, then external)` in the `detected:` line so the user can anticipate latency.

## Anti-Patterns

- Skipping the `detected:` acknowledgement line: it is LOAD-BEARING; downstream parsers and users depend on it.
- Writing or editing files during context gathering: this skill is read-only.
- Slash-arg override: `/contexts code-ref`, `/contexts doc-ref`, or `/contexts both` bypasses the classifier entirely and dispatches directly to that mode.
