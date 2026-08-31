# fix — Input Mode Classifier

Classify incoming input before dispatching to a fix mode. Evaluate the table top-to-bottom; first match wins.

---

## Mode table (first-match priority)

| Priority | Mode | Minimum conditions | Dispatch target |
|----------|------|--------------------|-----------------|
| 1 | `gh-route` | GH-flavored input AND open PR exists AND `gh auth status` exits 0 | `gh-fix-ci` or `resolve-pr-feedback` (sub-routed) |
| 2 | `review-loop` | User runs `/review` on a branch (or asks for a pre-landing multi-specialist review with a scored report) | review-loop handler (`references/review-loop.md`) |
| 3 | `iterative-improve` | User asks to iteratively review and fix a target AND names a specific installed reviewer AND gives explicit scope | iterative-improve handler (`references/iterative-improve.md`) |
| 4 | `finder-fixer` | A review supplies a bounded set of blocking findings AND explicit file scope globs | finder-fixer handler (`references/finder-fixer.md`) |
| 5 | `findings` | Input is a structured findings artifact or findings-formatted text (without explicit scope globs) | findings handler |
| 6 | `verifier-failure` | Input is raw verifier stdout/stderr | verifier handler |
| 7 | `bug-spec` | Free-text bug description — catch-all fallback | bug-spec handler |

---

## Mode 1 — `gh-route`

### Required signals (all three must be present)

1. GH-flavored input — at least one of these must appear **in the user's message or pasted text**:
   - URL matching `github.com/.*/actions/runs/.*`
   - Phrase "CI red", "checks failing", "Actions", or "workflow" in user input
   - Explicit mention of a PR number or PR URL (`github.com/.*/pull/.*`, "#123", "PR #…")

   Note: the existence of an open PR on the current branch is NOT itself a GH-flavored input signal. It is a prerequisite checked separately in signal 2.

2. Open PR exists — `gh pr view` exits 0 on the current branch.

3. `gh auth status` exits 0.

If any signal is absent the mode degrades to `GH_PARTIAL` ambiguity (see Ambiguity flags).

### Sub-routing within `gh-route`

| Sub-target | Trigger language |
|------------|-----------------|
| `gh-fix-ci` | "CI", "Actions", "workflow", "checks", `github.com/.*/actions/runs/.*` |
| `resolve-pr-feedback` | "reviewer said", "address comment", "PR feedback", "requested changes" |

When both sets of language appear simultaneously, fire `AMBIGUOUS_GH_ROUTE` and ask which to address first (single-select AskUserQuestion: `gh-fix-ci`, `resolve-pr-feedback`).

---

## Mode 2 — `review-loop`

### Signals

- User runs `/review` on a branch, or asks for a "pre-landing review", "multi-specialist review", or a "scored review report"
- A branch ref and merge base are resolvable in the local working repository
- No verifier failure or findings artifact is the primary input — the diff itself is the subject

### Dispatch

Routes to `references/review-loop.md`: resolve branch and base, read the full diff, run checklists, dispatch eight specialist subagents, apply fix-clear-defects-first ordering, account for every finding, return a scored report.

---

## Mode 3 — `iterative-improve`

### Signals (all three required)

1. User asks to "iteratively review and fix" a target (or "review-and-fix loop", "improve iteratively")
2. A specific installed reviewer is named (agent or skill) — no default reviewer is assumed
3. Explicit scope globs are given or proposed and confirmed

If a reviewer is named but no scope is given, propose `<repo-relative-target>/**` and confirm before launching. If no reviewer is named, this mode does not fire — fall through to `findings` or `bug-spec`.

### Dispatch

Routes to `references/iterative-improve.md`: baseline snapshot, ledger initialization, reviewer probe, round loop with scope guard and oscillation detection, finalize pass, terminal result classification.

---

## Mode 4 — `finder-fixer`

### Signals

- A review supplies a bounded set of blocking findings, each with evidence and a cited location
- Explicit file scope globs naming the only files this mode may edit
- Distinguished from `findings` (priority 5) by the presence of scope globs and the expectation of verdict-per-finding output

If findings are supplied without scope globs, fall through to `findings` (priority 5).

### Dispatch

Routes to `references/finder-fixer.md`: verdict taxonomy (fixed/rejected/deferred), regression pins, scope guard, git-safety, minimal diff, no narration, no goalpost moving.

---

## Mode 5 — `findings`

### Signals

- File path argument matching any of:
  - `*/findings.md`
  - `*/review/*.md`
  - `*/debug/*.md`
- Text block whose first non-blank line starts with:
  - `## Findings`
  - `## Issues`
  - `### Comment:`
  - `**Status**: VALID ISSUE`
- Inline prefix: `From review:`, `From resolve:`
- Content structured as a numbered or bulleted list of issues annotated with severity or priority labels (e.g. `**severity**: high`, `P0`, `[CRITICAL]`)

---

## Mode 6 — `verifier-failure`

### Signals

Match one or more lines against these patterns (use `git grep` / `fd` for file-based input):

| Pattern | Verifier |
|---------|---------|
| `FAILED` (pytest line summary) | pytest |
| `Error:` at start of line | tsc, node |
| `error TS[0-9]+:` | tsc |
| `ERROR` (uppercase) | eslint, ruff, mypy |
| `^--- FAIL` | go test |
| `^assertion error` | node assert / chai |
| `^error\[E[0-9]+\]:` | rustc / cargo |
| `^error: could not compile` | cargo (build summary line) |
| `^FAILED tests/` or `^FAILED .*::` | pytest |
| Stack trace block (3+ consecutive lines with `file:line` or `at .* \(.*:\d+:\d+\)` patterns) | any |
| Exit-code marker with no natural-language framing | any |

Input must arrive without surrounding natural-language framing. If the verifier output is embedded inside a prose description, lean toward `bug-spec` unless the signal density is high (>50% structured lines).

---

## Mode 7 — `bug-spec`

Catch-all. No artifact path, no structured findings format, no GH context, no raw verifier output.

### Signals

- Natural-language bug description
- Phrases: "doesn't work", "broken", "wrong behavior", "crashes when", "buttons don't render", "throws an error when I…"
- No file path argument, no structured format, no open-PR context

---

## Ambiguity flags

Ambiguity fires `AskUserQuestion` in single-select mode (`never multiSelect`). One question per axis.

| Flag | Condition | Question |
|------|-----------|---------|
| `MIXED_MODE` | Both a findings artifact AND verifier-failure output are present | "Which should I address first?" — options: `findings`, `verifier-failure` |
| `GH_PARTIAL` | GH-flavored input but no open PR, OR open PR present but `gh auth status` fails | "Authenticate gh and auto-route, or proceed local?" — options: `authenticate gh`, `proceed local` |
| `LANG_UNKNOWN` | Verifier-failure mode detected but no recognizable language or framework signals | "What verifier should I run?" — options: surface detected candidates or free entry |
| `SCOPE_AMBIGUOUS` | `bug-spec` mode with no file path, module name, or component reference | "Which files or modules does this affect?" — options: free entry or repo-root list via `fd` |

---

## Worked examples

### Example 1 — `gh-route` → `gh-fix-ci`

```
Input: "CI is red on my branch — https://github.com/acme/app/actions/runs/12345678"
```

Evaluation:
- GH-flavored input: YES (Actions URL present)
- Open PR: YES (`gh pr view` exits 0 on current branch)
- `gh auth status`: YES (exits 0)
- Sub-route: Actions URL → `gh-fix-ci`

```
detected: gh-route — target=gh-fix-ci guard="gh auth status && gh pr view" scope=* cap=20
```

---

### Example 2 — `findings`

```
Input: "/home/alpha/project/.claude/review/2026-04-28/findings.md"
```

Evaluation:
- Path matches `*/review/*.md`: YES
- No GH context, no verifier output

```
detected: findings — target=/home/alpha/project/.claude/review/2026-04-28/findings.md guard=none scope=* cap=20
```

---

### Example 3 — `verifier-failure`

```
Input:
  FAILED tests/test_api.py::test_create_user - AssertionError: 422 != 201
  FAILED tests/test_api.py::test_delete_user - AssertionError: 404 != 200
  2 failed, 18 passed in 1.43s
```

Evaluation:
- Multiple `FAILED` lines with `file::function` format: YES
- No natural-language framing: YES
- Framework signal: pytest

```
detected: verifier-failure — target=pytest guard="python -m pytest" scope=tests/** cap=20
```

---

### Example 4 — `bug-spec`

```
Input: "The login button doesn't render on mobile when the user is already authenticated."
```

Evaluation:
- No artifact path: YES
- No GH context: YES
- No verifier output: YES
- Natural-language bug description: YES

```
detected: bug-spec — target=none guard=none scope=* cap=20
```

---

## Detection line format

Every classification emits a single detection line before dispatching:

```
detected: <mode> — target=TARGET guard=GUARD scope=SCOPE cap=20
```

Where `TARGET`, `GUARD`, `SCOPE` are literal values — use bare `none` (not `<none>`) when the field has no value:

- `target`: verifier binary, artifact file path, reviewer name, or `none`
- `guard`: shell command used to confirm readiness (e.g. `gh auth status`), or `none`
- `scope`: glob passed to `fd` to constrain file search, or `*` for repo-wide
- `cap`: iteration ceiling for the fix loop (default 20; see `references/loop.md`)
