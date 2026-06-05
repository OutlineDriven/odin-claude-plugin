# Interest Routing Contract

Use this reference as the deterministic routing layer after base context and contribution signals have been collected. It is intentionally self-contained: no external cache, no plugin state, no sibling skill dependency.

## Signal Shapes

Normalize every collector result before matching:

```json
{
  "kind": "test-gap | doc-drift | stale-doc | bugspot | issue | good-first | cleanup",
  "file": "src/parser/expr.ts",
  "line": 42,
  "symbol": "parseExpr",
  "metric": "bug-fix rate 38%",
  "confidence": "HIGH | MEDIUM | LOW",
  "evidence": ["git fix_touches=5 total_touches=13", "no co-changing test file"],
  "firstStep": "bat -P -p -n src/parser/expr.ts"
}
```

Missing optional fields are acceptable; missing `kind`, `file` for file-backed work, or `evidence` downgrades the candidate to LOW and usually excludes it from the final list.

## Interest → Signal Map

| Developer interest | Primary signals | Secondary signals | Ranking rule | Degradation |
|---|---|---|---|---|
| New to the stack | `good-first` areas: low dependents, clear sibling patterns, nearby tests/docs | verified commented-out-code cleanup; verified orphan exports; `good first issue` / `help wanted` labels | prefer one-file tasks with examples nearby and low blast radius | if no good-first signal, offer docs or quick cleanup with verification-first wording |
| Experienced | bugspots; high-impact open issues; needs-help areas with repeated churn | suspicious always-true/false conditions; architectural issue labels | prefer repeated bug-fix rate + open issue overlap; avoid easy chores unless asked | if only LOW issue labels exist, say hard-problem evidence is weak and offer bugspot exploration |
| Want to write tests | test gaps; test-gap ∩ bugspot | open issues labelled `test`, `testing`, `coverage`; nearby test templates | sort by `(hotness + bug_fix_rate)` and availability of a test pattern | if test gaps empty, say hot files appear covered and pivot to bug or docs |
| Want to fix bugs | open issues labelled `bug`, `regression`, `crash`; bugspots | always-true/false conditions; flaky-test labels; recent revert commits | issue + bugspot overlap first; otherwise bugspot with clear local entry point | if `gh` unavailable, use bugspots only and state issue tracker unavailable |
| Want to improve docs | stale inline symbols/import paths; docs with zero code coupling | open issues labelled `documentation`; README examples that fail lookup | broken symbol/path beats coarse zero-coupling; docs issue + stale reference beats both | if docs signal empty, say no stale docs found and offer tests or cleanup |
| Want quick cleanup | verified commented-out code; verified orphan exports | passthrough wrappers with visible call sites; redundant always-true branches as bug investigation | pure deletion HIGH before contained refactor MEDIUM; never start with exported public surface | if all cleanup counts zero, say no safe cleanup candidates detected and offer docs/tests |

## Candidate Scoring

Use scoring to order candidates within the selected interest; do not show raw scores unless useful.

```text
base = confidence(HIGH=3, MEDIUM=2, LOW=1)
overlap_bonus = 2 if candidate matches two primary signals else 0
locality_bonus = 1 if one file and nearby examples exist else 0
issue_bonus = 1 if matching open issue label exists else 0
risk_penalty = 2 if exported/public/entrypoint; 1 if generated-looking; 3 if no file read yet
score = base + overlap_bonus + locality_bonus + issue_bonus - risk_penalty
```

Suppress candidates with `score <= 1` unless every signal is weak; in that case disclose LOW certainty and ask whether to inspect deeper.

## Four-field Recommendation Template

Every recommendation uses this exact shape.

```markdown
### <N>. <imperative contribution title>

**What**: `<file>:<line-range>` — <symbol/section/issue>. If issue-backed, include `#<number>` and still name the file once known.

**Why**: <data-backed evidence>. Examples: `bug-fix rate 38% (5 fix commits / 13 touches)`, `test gap: 11 source touches, zero co-changing test file`, `0.75 orphan-export confidence plus zero references`, `zero doc coupling across 365 days`, `open issue #42 labelled bug + touches src/auth.ts`.

**How**: <2–3 sentences based on reading the file>. Explain the local pattern, what would change, and why this is a bounded contribution. For tests, name the branch/case to cover. For docs, name the stale claim and the current code truth. For cleanup, state whether it is pure deletion, contained refactor, or bug investigation.

**First step**: `<exact command or action>`. Prefer `bat -P -p -n <file>`, `rg -n '<symbol>' <paths>`, `gh issue view <number>`, or a concrete edit after verification.
```

Do not include a recommendation that cannot fill all four fields. If line numbers are unavailable, the First step must produce them (`rg -n` or `bat -P -p -n`).

## Slop Verification Rules

Cleanup recommendations require a separate verification pass before any zero-behavior wording.

### Commented-out code

HIGH when all hold:
- The comment block parses as old code or contains obvious disabled code syntax.
- Surrounding code has a live replacement or no reference to the commented names.
- The block is not explanatory pseudocode, generated docs, license text, or deliberate sample code.

First step template:

```text
bat -P -p -n <file> | inspect lines <start>-<end>, then delete only that comment block and run the repo's normal test command.
```

### Orphan exports

HIGH only after caller/reachability checks:
- Codegraph callers/search returns no importers; fallback `rg -n '<symbol>' <repo>` finds only definition/export sites.
- The symbol is not framework-discovered by filename, decorator, route table, plugin registry, CLI command table, config export, migration hook, serialization name, or public package API.
- Package manifest / module export maps do not expose it as an external API, or the project accepts breaking removal.

If any doubt remains, downgrade to MEDIUM and phrase the First step as verification:

```text
rg -n '<symbol>' . && inspect package export maps before deleting <file>:<line>.
```

### Passthrough wrappers

MEDIUM by default. They are rarely deletion-only because call sites must be updated.

Require:
- Wrapper only forwards arguments to one callee.
- No validation, logging, metrics, auth, error translation, type narrowing, memoization, or public API compatibility role.
- All call sites are visible.

First step:

```text
rg -n '<wrapperName>' <repo> to inventory call sites; inline one call site only after confirming behavior is identical.
```

### Always-true / always-false conditions

Never call these cleanup. Treat as bug-investigation candidates.

Examples:
- `if (x === x)`
- `if (count >= 0 || count < 0)`
- Rust/Go/Python equivalents where the predicate is tautological or impossible.

First step:

```text
bat -P -p -n <file> and read the variables feeding the predicate; infer the intended comparison from adjacent branches/tests before editing.
```

## Native Signal Recipes

These recipes are runnable and replace external analyzers with local evidence.

### Bugspots

```bash
git --no-pager log --since='365 days ago' --regexp-ignore-case \
  --grep='fix|bug|regression|crash|panic|race|leak|broken' \
  --name-only --format='commit:%H' -- <repo>

git --no-pager log --since='365 days ago' --name-only --format='commit:%H' -- <repo>
```

Count file appearances in fix commits and all commits. Report `bug-fix rate = fix_touches / max(total_touches, 1)`. HIGH when `fix_touches >= 3` and rate `>= 0.25`; MEDIUM when only one threshold holds.

### Test gaps

```bash
git --no-pager log --since='180 days ago' --name-only --format='commit:%H' -- <src-paths>
fd '(^test$|^tests$|__tests__|spec$|\.test\.|\.spec\.)' <repo>
```

A file is a test gap when it is a hot source file and commits touching it do not also touch a likely test file. HIGH when source touches `>= 5`, no co-changing test path, and no nearby test file exists.

### Doc drift / stale docs

```bash
git --no-pager log --since='365 days ago' --name-only --format='commit:%H' -- docs README* CONTRIBUTING*
rg -n '`[^`]+`|from ["'"'][^"'"']+["'"']|require\(["'"'][^"'"']+["'"']\)' docs README* CONTRIBUTING*
```

For each backticked symbol or import path, use codegraph search when indexed. Fallback:

```bash
rg -n '<identifier-or-import-path>' <repo>
```

HIGH for broken import path or vanished symbol; MEDIUM for docs with zero source co-change over the window.

### Good-first areas

Collect candidates from:
- source files with tests nearby,
- low bug-fix rate,
- low dependent count,
- recent maintainer edits,
- open issues labelled `good first issue` or `help wanted`.

Codegraph route:
- `codegraph_impact` for candidate symbols/files.
- `codegraph_callers` for entrypoint risk.
- `codegraph_files` for neighborhood shape.

Fallback route:

```bash
rg -n 'import .*<module>|from .*<module>|require\(.*<module>|use .*<module>' <repo>
fd '<module-or-basename>.*(test|spec)' <repo>
git --no-pager log --since='180 days ago' --format='%an' -- <file>
```

Prefer candidates with few dependents, visible examples, and active ownership.

### Open issues

```bash
gh issue list --state open --limit 15 --json number,title,labels
```

Label routing:
- `bug`, `regression`, `crash` → bugs.
- `good first issue`, `help wanted` → newcomer.
- `documentation`, `docs` → docs.
- `test`, `testing`, `coverage` → tests.
- `cleanup`, `refactor`, `chore` → cleanup only after repo verification.

## Error / Degradation Table

| Situation | Response | Fallback |
|---|---|---|
| Target is not a git repo | Say history-backed signals are unavailable | Use file structure, tests/docs presence, and open issues if available |
| `gh` unavailable or unauthenticated | Say open issues unavailable | Use local bugspots/test gaps/docs/cleanup signals |
| No manifests found | Mark stack certainty LOW | Infer from extensions only after reading representative files |
| No test root found | Do not claim absent tests globally | Treat test-gap confidence as MEDIUM until conventions are known |
| Churn history too shallow | Avoid bug-fix-rate percentages | Use current issue labels and code reads |
| Developer picks interest with no signal | Name the empty signal explicitly | Pivot to the nearest adjacent interest with non-empty evidence |
| Cleanup candidate touches public/exported surface | Downgrade safety claim | Make caller/reachability verification the First step |
| Candidate file is generated/vendor/lock/snapshot | Exclude | Choose the next candidate |
| Only LOW-certainty candidates exist | Present at most two with LOW label | Ask whether to inspect deeper before editing |
| No contribution opportunities survive | Report that no safe, data-backed recommendation was found | Offer to broaden scope to issues, docs, or tests after more context |
