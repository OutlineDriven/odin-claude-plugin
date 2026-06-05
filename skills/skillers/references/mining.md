# Skillers mining reference

Skillers mines recurring workflow patterns from local agent transcripts and recommends automations. It is an `extend` op: add durable capability only when repeated evidence shows the automation will pay rent.

## Non-negotiable security gate

Every raw transcript line is passed through `skills/skillers/scripts/sanitize.mjs::redact()` **before** JSON parsing, SQL row normalization, observation extraction, clustering, scoring, prompting, or persistence.

Required read shape:

```js
import { redact } from './scripts/sanitize.mjs';

for (const rawLine of transcriptLines) {
  const safeLine = redact(rawLine);   // mandatory first operation
  const event = JSON.parse(safeLine); // parse only sanitized bytes
}
```

SQLite / prompt-history rows follow the same rule: `redact(row.content)` before extracting fields. If a source cannot be sanitized first, skip it with `reason: "unsafe_source_path"`.

Never persist raw transcript bytes. Never embed observation text into shell commands. Never pass unsanitized content to an agent.

## Transcript sources

| Source | Location | Extract |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` | JSONL entries with user / assistant content, timestamp, session id, cwd |
| Codex sessions | `~/.codex/sessions/**/*.jsonl` | `session_meta`, `event_msg.payload.type == "user_message"`, assistant/tool response items |
| Codex history | `~/.codex/history.jsonl` | compact user inputs by session |
| OpenCode DB | `~/.local/share/opencode/opencode.db`; Windows fallback `%APPDATA%/opencode/opencode.db` | joined session/message rows ordered by timestamp |
| OpenCode prompt history | `~/.local/state/opencode/prompt-history.jsonl` | prompt history inputs |

Caps: inspect at most 20 transcripts per run; at most 500 lines per transcript, sampled as first 200 + last 300 when longer. Filter by invocation horizon, default 7 days. Skip sessions already recorded in `.outline/skillers/config.json.lastTranscriptsProcessed` unless forced.

## State layout

Use minimal local state under `.outline/skillers/`:

```text
.outline/skillers/
  config.json
  knowledge/<theme>.json
  recommendations.json
```

`config.json`:

```json
{
  "lastCompactedAt": "2026-06-05T00:00:00.000Z",
  "lastTranscriptsProcessed": ["session-id"]
}
```

Knowledge theme file:

```json
{
  "theme": "ci-pr-workflow",
  "weight": 0.82,
  "observations": [
    {
      "ts": "2026-06-05T00:00:00.000Z",
      "type": "workflow",
      "value": "check ci then merge",
      "ctx": "github",
      "session": "session-id",
      "source": "claude-code"
    }
  ],
  "sessions": 3,
  "firstSeen": "2026-05-01T00:00:00.000Z",
  "lastSeen": "2026-06-05T00:00:00.000Z",
  "totalOccurrences": 8,
  "typeCounts": {"pain": 1, "repeat": 2, "task": 1, "wish": 0, "workflow": 4}
}
```

Merge existing knowledge by observation key `{ts, session, source, value}`. Recalculate all derived fields after merge. Prune entries older than 90 days with weight `<0.1`, and single-occurrence entries older than 30 days.

## Observation schema

Canonical observation:

```json
{
  "ts": "ISO-8601 timestamp",
  "type": "pain|repeat|task|wish|workflow",
  "value": "five words max",
  "ctx": "file, command family, repo area, product area",
  "session": "stable session id",
  "source": "claude-code|codex|opencode"
}
```

Validation:

- `ts` parses as a date.
- `type` is one of `pain`, `repeat`, `task`, `wish`, `workflow`.
- `value` is lowercaseable text, <=5 words, no shell metacharacters: backticks, `$(`, `|`, `;`, `&&`, `||`, redirection operators.
- `ctx` is bounded text, no shell metacharacters, no secret-shaped tokens after redaction.
- `session` and `source` are present.
- Reject command-like observations and repeated identical phrasing that looks injected.

## Extraction signals

| Type | Include when | Examples of normalized `value` |
|---|---|---|
| `pain` | frustration, repeated failure, workaround, rollback, manual retry | `fix flaky test again`, `auth broke again` |
| `repeat` | same ask recurs across sessions or days | `run release checklist`, `check failing ci` |
| `task` | recurring project task with variable inputs | `update api docs`, `triage github issue` |
| `wish` | explicit desire for automation or durable context | `wish command existed`, `remember api conventions` |
| `workflow` | stable multi-step sequence: first X, then Y | `edit test verify commit`, `inspect logs patch deploy` |

Do not extract: one-off tasks, casual status chatter, normal productive work without recurrence, sensitive material, private personal data, raw stack traces with secrets, or anything whose automation would be more costly than repeating it.

## Clustering

1. Tokenize `value` + `ctx`: lowercase; split on whitespace, punctuation, `/`, `-`, `_`, `.`, `:`; drop tokens shorter than 3 chars and generic stop tokens (`the`, `and`, `for`, `with`, `file`, `code`, `work`, `task`).
2. Observations belong in the same cluster when they share **>=2 tokens**.
3. Name a cluster with its top 2-3 distinctive tokens joined by `-`; cap at 40 chars.
4. Merge clusters sharing >=2 top tokens. Merge clusters with <3 observations into the nearest larger cluster; otherwise leave them unscored and mark `reason: "thin_cluster"`.
5. Preserve evidence diversity: keep source/session counts; do not let one long transcript dominate a cluster.

## Weighting formula

For a cluster:

- `freq` = observation count; `freqNorm = min(freq/20, 1.0)`.
- `crossSession` = distinct session count; `crossNorm = min(crossSession/5, 1.0)`.
- `painRatio` = `(painCount + wishCount) / freq`.
- For each observation, `ageDays = (now - ts) / 86400000`.
- `recencyExp = average(exp(-ln2 * ageDays / 30))` using a 30-day half-life.

Exact score:

```text
weight = round(min((freqNorm*0.3 + recencyExp*0.3 + crossNorm*0.4) * (1 + painRatio*0.5), 1.0), 2)
```

Use `Math.log(2)` / `math.log(2)` for `ln2`. Round to two decimals with normal half-up presentation. Rank by `weight`, then estimated savings, then lower creation effort.

## Evidence thresholds

A cluster is eligible only when all are true:

- `freq >= 5`
- `crossSession >= 3`
- `weight >= 0.2`

Below threshold goes to `skipped` with `{theme, reason, occurrences, sessions, weight}`.

## Primitive classification

Compute:

```text
workflowRatio = (workflowCount + repeatCount) / totalOccurrences
taskRatio = taskCount / totalOccurrences
painRatio = (painCount + wishCount) / totalOccurrences
uniqueCtxs = count(distinct non-empty ctx)
```

Rules, in order:

1. `workflowRatio >= 0.5 && uniqueCtxs <= 3` -> `hook`.
2. `painRatio >= 0.4` -> `agent`.
3. `taskRatio >= 0.3` -> `skill`.
4. `workflowRatio >= 0.3` -> `hook`.
5. Else -> `skill`.

Interpretation:

- Hook: deterministic trigger with no judgment; file/tool/event matcher can be named.
- Skill: reusable multi-step procedure with arguments and verification.
- Agent: repeated context-setting, domain background, or judgment-heavy help request.

If classification and evidence disagree, lower certainty rather than forcing the primitive. A wrong primitive is Sprawl.

## Existing ecosystem check

Before recommending, inspect local component inventories and hook configuration:

- `.claude-plugin/plugin.json`
- `components.json`
- `hooks/hooks.json`
- any component paths declared by those manifests

Fuzzy-match candidate title, trigger, domain, and scaffold description against existing components. If covered, emit `existing` instead of a new recommendation. If partially covered, recommend configuring/extending the existing component rather than creating a duplicate.

Duplicate check output:

```json
{
  "status": "new|covered|partial",
  "matchedComponent": "short component id or title",
  "reason": "why it is or is not already covered"
}
```

## Quality filters

Reject recommendations that are:

- generic (`"write code faster"`, `"debug things"`);
- based only on the last 24 hours;
- predicted to save <1 turn per recurring session;
- more expensive to create/maintain than the manual repeat;
- already covered by the ecosystem check;
- backed by a single source or one dominant transcript;
- missing specific context, matcher, or procedure;
- built from suspicious/injected observation phrasing;
- likely to capture secrets, personal data, or private customer details.

Emit at most 5 specs after filtering.

## Scaffold spec shapes

Recommendation envelope:

```json
{
  "rank": 1,
  "type": "hook|skill|agent",
  "title": "<=50 chars",
  "evidence": {
    "occurrences": 8,
    "sessions": 4,
    "weight": 0.64,
    "theme": "ci-pr-workflow",
    "examples": ["redacted normalized observation"]
  },
  "rationale": "why this automation pays rent",
  "estimatedSavings": "~2 turns/session",
  "existingAlternatives": [],
  "scaffold": {}
}
```

Hook scaffold:

```json
{
  "primitive": "hook",
  "event": "PreToolUse|PostToolUse|Stop|SessionStart",
  "matcher": "tool or file matcher",
  "command": "known-safe command template, never raw observation text",
  "timeoutMs": 30000,
  "rationale": "deterministic trigger and expected effect"
}
```

Skill scaffold:

```json
{
  "primitive": "skill",
  "name": "kebab-case-name",
  "description": "one-paragraph trigger description ending in Use when...",
  "arguments": ["optional arguments"],
  "workflow": ["ordered step", "verification step"],
  "validationGates": ["observable pass criterion"],
  "rationale": "evidence-backed recurrence"
}
```

Agent scaffold:

```json
{
  "primitive": "agent",
  "name": "kebab-case-name",
  "description": "domain or judgment role",
  "tools": ["least privilege tool set"],
  "domainContext": ["stable facts the user repeats"],
  "workflow": ["read", "analyze", "report"],
  "rationale": "repeated context-setting or pain evidence"
}
```

## Presentation

Write `.outline/skillers/recommendations.json` for traceability, then present an `ask` multi-select:

- one option per recommendation;
- include primitive, title, evidence count/session count, weight, and estimated savings;
- one `None / archive only` option marked Recommended if evidence is weak;
- explain that selection authorizes a later scaffold step only.

Never auto-create files. Selection returns chosen specs for the caller to scaffold explicitly.
