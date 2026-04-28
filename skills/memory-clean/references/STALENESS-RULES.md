# Staleness Detection Rules

How to cross-reference memory files against session-history transcripts to identify outdated rules.

## Core question

For each `feedback` memory: does the session corpus contain evidence that the user's actual behavior or preference has diverged from what the memory says?

## Input

- Memory file body (the rule text)
- `SESSION_HISTORY_GLOB` — JSONL files for recent sessions
- Session JSONL format: each line is `{ type, uuid, timestamp, message: { role, content } }`

## Algorithm

### Step 1: Extract the memory's claim

From the feedback memory body, extract the core rule as a short phrase. Examples:
- "use single-select per axis, not multiSelect" → key terms: `single-select`, `multiSelect`
- "never use HTML comments in config files" → key terms: `<!--`, `-->`
- "always bump minor version on behavior changes" → key terms: `bump`, `minor`, `version`

### Step 2: Search sessions for contradictions

For each session file matching the glob:
1. Load all user and assistant turns
2. Look for turns where:
   - The assistant produced output that violates the rule (produced `<!--` in a config file after being told not to)
   - AND the user accepted it (no correction, or explicitly affirmed)
3. Count distinct sessions (not turns) where this pattern occurs

### Step 3: Threshold

- 0–2 contradicting sessions → not stale; skip
- 3–4 contradicting sessions → `warn` (stale candidate)
- 5+ contradicting sessions → `critical` (rule appears abandoned)

### Step 4: Evidence report

For each stale memory, report:
```
STALE: feedback_foo.md
  Rule: "never use multiSelect for per-axis questions"
  Contradicted in 4 sessions:
    uuid-aaa (2026-04-10): assistant used multiSelect, user accepted
    uuid-bbb (2026-04-12): ...
    uuid-ccc (2026-04-14): ...
    uuid-ddd (2026-04-15): ...
```

## Negative signals (not staleness)

- A single off-turn contradiction (user was tired, or context was different): NOT stale
- An exception that the user explicitly carved out ("in this case it's OK"): NOT stale
- An assistant mistake that was immediately corrected: NOT stale (the correction reinforces the rule)
- The rule mentions a specific file path and that file was renamed: likely path-pinned (use the path-pinned audit check, not staleness)

## Project memory staleness

**Default rule:** any `YYYY-MM-DD` date found in a project memory body that is earlier than today is a staleness candidate. This catches commitment phrasing in any wording without relying on a narrow phrase whitelist.

**Suppression (historical-anchor phrases):** if a past date is immediately preceded (within 5 tokens) by one of these historical-anchor words, it is a historical evidence date — suppress the flag:

> `as of`, `since`, `starting`, `started`, `decided on`, `decided`, `created`, `effective`, `from`, `began`

Bare `on` is excluded: it is too short to be a reliable anchor ("freeze on 2025-11-15" contains `on` but is a commitment, not historical).

Examples:
- "merge freeze begins 2025-12-01" → past date, no suppression phrase → **flag**
- "ship by 2025-11-15" → past date, no suppression phrase → **flag**
- "freeze on 2025-11-15" → `on` not in anchor list → **flag**
- "as of 2025-10-01, we moved to Rust" → suppressed (`as of`) → **skip**
- "we decided on 2025-09-20 to …" → suppressed (`decided on`) → **skip**
- "started 2025-09-01" → suppressed (`started`) → **skip**

Severity: `warn`. Show the flagged sentence to the user with: "This project memory contains a past date that may be expired — verify whether it is still relevant."

## Reference memory staleness

A `reference` memory is stale when the target resource no longer exists. Heuristic path extraction from free-form body text is unreliable (false positives from code snippets, config examples, etc.) — use explicit field detection only.

**Explicit check:** if the memory body contains a line starting with `path:` or `url:`, extract that value and check existence:
- `path: /absolute/path` → `stat` the path; flag if missing
- `url: https://...` → do NOT check (HTTP requests are out of scope); annotate as "URL not verified"

**No check** when no explicit `path:` / `url:` line is present. In that case, surface the memory body to the user with a note: "This reference memory has no structured target — verify manually that the resource still exists." Severity: info.
