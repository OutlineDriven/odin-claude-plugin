# Solution doc templates

Pick the template matching the `problem_type` track (see `references/schema.md`). Fill every bracket; delete sections that have no real content rather than leaving a placeholder.

---

## Bug track

For: `build_error`, `test_failure`, `runtime_error`, `performance_issue`, `database_issue`, `security_issue`, `ui_bug`, `integration_issue`, `logic_error`

<!-- YAML safety: array items (symptoms, applies_when, tags, related_components) that start with ` [ ] { } , * & ! | > % @ ? or contain ": " must be double-quoted. See references/schema.md > "YAML safety". -->

```markdown
---
title: [Clear problem title]
date: [YYYY-MM-DD]
category: [docs/solutions subdirectory]
module: [Module or area]
problem_type: [schema enum]
component: [component or subsystem]
symptoms:
  - [Observable symptom 1]
root_cause: [schema enum]
resolution_type: [schema enum]
severity: [schema enum]
tags: [keyword-one, keyword-two]
---

# [Clear problem title]

## Problem
[1-2 sentences: the issue and its user-visible impact]

## Symptoms
- [Observable symptom or error]

## What Didn't Work
- [Attempted fix and why it failed]

## Solution
[The fix that worked, with code snippets when they carry weight]

## Why This Works
[Root cause, and why the fix addresses it — the WHY, not a restatement of the diff]

## Prevention
- [Concrete practice, test, or guardrail that stops a recurrence]

## Related
- [Related docs or issues, if any]
```

---

## Knowledge track

For: `best_practice`, `documentation_gap`, `workflow_issue`, `developer_experience`, `architecture_pattern`, `design_pattern`, `tooling_decision`, `convention`

<!-- YAML safety: array items (symptoms, applies_when, tags, related_components) that start with ` [ ] { } , * & ! | > % @ ? or contain ": " must be double-quoted. See references/schema.md > "YAML safety". -->

```markdown
---
title: [Clear, descriptive title]
date: [YYYY-MM-DD]
category: [docs/solutions subdirectory]
module: [Module or area]
problem_type: [schema enum]
component: [component or subsystem]
severity: [schema enum]
applies_when:
  - [Condition where this applies]
tags: [keyword-one, keyword-two]
---

# [Clear, descriptive title]

## Context
[What situation, gap, or friction prompted this guidance]

## Guidance
[The practice or recommendation, with code examples when useful]

## Why This Matters
[Rationale and impact of following — or not following — this]

## When to Apply
- [Conditions or situations where this applies]

## Examples
[Concrete before/after or usage example showing the practice in action]

## Related
- [Related docs or issues, if any]
```
