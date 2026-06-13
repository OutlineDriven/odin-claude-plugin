# Grill-loop Orchestration

The authored core of `review-fix-grill-loop`: change-scope resolution, the severity-floor + confidence-guard + stall policy, the resolve-gate spec, and the double-loop semantics. The reviewer roster lives in `review-roster.md`; the adjudication contract lives in `false-positive-contract.md`.

## Phase 1 — Resolve the change-scope

The change-set is the only universe for every downstream phase. Build `changedFiles[]` as the **union of three sources** so nothing a developer would call a "current change" is missed.

### Base-ref ladder (mirrors `simplify`)

Resolve a base ref in order; first hit wins:

```text
git merge-base HEAD origin/main
git merge-base HEAD origin/master
git merge-base HEAD main
git merge-base HEAD master
git rev-parse @{upstream}        # tracking branch fallback
```

### Three-source union

1. **Tracked working-tree + unstaged + committed-vs-base:** `git --no-pager diff --name-only <base>` (no `..HEAD`, so unstaged edits to tracked files are included).
2. **Staged changes:** `git --no-pager diff --name-only --cached`.
3. **Untracked-not-ignored files:** `git ls-files --others --exclude-standard`. `git diff` is blind to brand-new files the developer has not `git add`ed yet; for a "grill my current changes" command those ARE current changes. Feed their full contents into review, resolve, fix, and re-review like any other changed file.

`changedFiles = unique(source1 ∪ source2 ∪ source3)`.

### Fallbacks (mirror `simplify` Check A / Check B)

- **Unborn HEAD** (no commits yet): no base resolves; the scope is sources 2 + 3 (staged + untracked) only.
- **Root commit / single commit, no upstream:** diff against the empty tree (`git diff --name-only $(git hash-object -t tree /dev/null)`), unioned with sources 2 + 3.
- **No base resolves but commits exist and no upstream:** stop and tell the user to set an upstream or pass `against <ref>`; do not silently audit the whole repo.
- **Empty union after all fallbacks:** exit pass-through ("no current changes to grill"); launch no agents.

`against <ref>` overrides the ladder with an explicit base. An explicit `scope` path/glob overrides the whole resolution (the skill then grills that path, still diff-aware where possible).

## Phase 2–4, 7 — delegated

- **Phase 2 (shape + signals):** compute `prioritySignals` and `HAS_DB/HAS_API/FRONTEND/BACKEND/CICD` flags over `changedFiles[]` only, then derive the scope-adaptive caps (below) and persist `caps` to the queue.
- **Phase 3 (review):** select ≤10 reviewers (4 core + conditional by diff surface), dispatch in one parallel batch with role prompts from `review-roster.md` and the mandatory JSON schema.
- **Phase 4 (consolidate):** apply `false-positive-contract.md` — normalize, blocked-ratio gate, below-floor extraction.
- **Phase 7 (targeted re-review):** re-review changed files only, per the contract's routing table.

## Severity floor, confidence guard, and stall policy

The terminating predicate is `openAtOrAboveFloor == 0`. A finding counts toward it only when it clears BOTH the floor and the confidence guard:

| Floor (`--severity-floor`) | Severities looped | Excluded → `belowFloor[]` |
|---|---|---|
| `critical` | critical | high, medium, low; any `confidence: low` |
| `high` | critical, high | medium, low; any `confidence: low` |
| `medium` (default) | critical, high, medium | low; any `confidence: low` |

**Confidence guard (load-bearing):** a finding at or above the floor severity but with `confidence: low` does NOT count toward the predicate and is never auto-fixed. It is reported in `belowFloor[]`. This is what stops "loop until no issue left" from thrashing on subjective, low-confidence nits — the floor bounds *severity*, the guard bounds *certainty*.

**Stall detection:** `findingsHash = sha256(sorted(open at/above-floor keys: pass:file:line:severity:description:suggestion))`. If the same hash appears in two consecutive outer iterations, set `stalled: true`; `continue-fixing` is no longer recommended at the decision gate. Stall is the second backstop (after the floor + guard) against an unbounded loop: a finding the loop cannot actually resolve repeats its hash and forces a user decision instead of spinning.

## Resolve gate (full `odin:resolve` form)

Runs on confirmed OPEN findings at or above the floor, after consolidation and before any fix. For each finding emit:

```text
### Finding: [description]   (pass / file:line / severity / confidence)
**Status**: VALID ISSUE | NOT AN ISSUE | NEEDS CLARIFICATION
**Solution 1**: … — Trade-offs: …
**Solution 2**: … — Trade-offs: …
**Solution 3**: … — Trade-offs: …
**Recommended**: Solution N because …
**Scope**: in-scope | out-of-scope
```

Rules:

- **Validity first.** `NOT AN ISSUE` removes the finding from the fix queue with a recorded reason (this is the architectural second opinion on top of the reviewer's own `falsePositive` self-report).
- **Three solutions, one recommendation.** For `VALID ISSUE`, propose three genuinely distinct approaches with trade-offs, then recommend one. The recommended solution becomes the fix queue's approach annotation for that finding. (This is the heavier, interactive form the user chose over a one-line approach note.)
- **Scope honesty.** `out-of-scope` = the only sensible fix would materially edit files outside `changedFiles[]`. The skill is diff-scoped by contract; it must not silently widen the diff.
- **Escalation.** `NEEDS CLARIFICATION` and `out-of-scope` findings escalate to `AskUserQuestion` (with the three solutions as context) rather than auto-fixing. The user can authorize an out-of-scope fix, defer it, or drop it.
- **Persist.** Write each decision to `resolveDecisions[]` in the queue (`id`, `status`, `recommended`, `scope`).
- **Weak-location rows** (`locationWeak: true`) always route through the resolve gate, never directly to the fix queue.

## Scope-adaptive caps

The three caps scale with the change-set's complexity instead of being flat. A 1-file typo and a 40-file cross-surface branch do not deserve the same budget. Derive them in Phase 2 from two signals already computed over `changedFiles[]`:

- `F` = number of changed files (`len(changedFiles[])`).
- `S` = number of true surface flags among `{HAS_DB, HAS_API, FRONTEND, BACKEND, CICD}` — the breadth of the change.

`scopeTier = max(fileTier(F), surfaceTier(S))` — the higher of the two wins, so a wide-but-small or narrow-but-large diff both escalate. Surfaces alone never force `xl`.

| | `small` | `medium` | `large` | `xl` |
|---|---|---|---|---|
| fileTier (`F`) | ≤3 | 4–15 | 16–40 | >40 |
| surfaceTier (`S`) | ≤1 | 2 | ≥3 | — |

The tier maps to the three caps. `small` reproduces the prior fixed defaults, so the tier is a **floor**: caps only ever grow with scope, never drop below earlier behavior.

| `scopeTier` | `maxIterations` | `fixAttemptCap` | `attemptsPerItem` |
|---|---|---|---|
| `small` | 5 | 20 | 3 |
| `medium` | 8 | 30 | 3 |
| `large` | 12 | 50 | 4 |
| `xl` | 15 | 80 | 5 |

Persist `{scopeTier, maxIterations, fixAttemptCap, attemptsPerItem}` to `queue.caps`. An explicit `--max-iterations N` overrides the derived outer cap; `fixAttemptCap` and `attemptsPerItem` are adaptive-only (no flags).

## Double-loop semantics

Two nested loops with separate caps — spell this out in any progress output so the two counters are not conflated:

- **Outer loop** (this skill, `caps.maxIterations`, adaptive `5–15`; `--max-iterations` overrides): counts review → resolve → fix-batch → targeted-re-review cycles. Bounded by the terminating predicate, the decision gate, the iteration cap, or a stall.
- **Inner loop** (the reused `fix` loop, adaptive `caps.fixAttemptCap`, `20–80`): counts individual fix *attempts* within one fix batch — one minimal patch per attempt, checkpoint commit, verifier + guard, KEEP on green / `git revert HEAD --no-edit` on red, up to `caps.attemptsPerItem` attempts per item (adaptive `3–5`, = initial + reworks) before SKIP.

Outer iteration `i` of `caps.maxIterations` does not mean fix attempt `i`; a single outer iteration may spend several inner attempts landing one batch.

## State

- `.outline/review-fix-grill/queue.json` — schema in `false-positive-contract.md`, including the `caps` object derived in Phase 2. Distinct directory from `.outline/audit/` so `--resume` never cross-reads `audit-project`'s queue. A queue written before scope-adaptive caps has no `caps` key; on `--resume` re-derive it from `changedFiles[]` rather than assuming a scalar `maxIterations`.
- `.outline/review-fix-grill/iterations/<n>.json` — per outer iteration: changed files, fix batches, verifier command + output summary, re-review result hash.
