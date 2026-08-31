---
name: primary-source-research
description: 'Use when a task needs primary-source reading. Produces one durable research file in which every claim links to its owning primary source. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Primary source research

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A task needs primary-source reading. |
| Authority | Write one named local artifact; rollback deletes it on failure before completion. |
| Side effect | One cited durable research file. |
| Done | One cited durable research file exists and every claim links to its owning primary source. |

## Inputs

- **Subject**: required. The library, framework, SDK, API, CLI tool, or service named in the request.
- **Version**: optional. A pinned version string (e.g., `pydantic@2.7`). If absent, resolve latest stable from Tier 1.
- **Target path**: required. The durable file path for the cited research artifact. Must be a single file.

## Procedure

1. Confirm the subject is a named library, framework, SDK, API, CLI tool, or service. If it is a question about local repository code, stop.
2. Extract the canonical identifier and version. If version is unstated, look up latest stable from official documentation.
3. Search only authoritative primary sources: official documentation, official API reference pages, official repository README or docs folders, or source code. Stop after first authoritative match; do not iterate a ladder.
4. Record every factual claim with a citation to its primary source URL or file path. Each citation must uniquely own the claim it annotates.
5. If a claim cannot be sourced from a primary source, write it with the label `[Unverified — no primary source available]` and stop without filling the gap.
6. Write all verified findings into a single Markdown file at the target path. Each claim in the file must have at least one primary-source citation inline.
7. Return the artifact path.

## Failure and recovery
| Failure class | Result |
|---|---|
| Ambiguous subject | Stop; surface ambiguity. |
| No primary source found | Stop; emit `[Unverified — no primary source available]` for each unresolvable claim. |
| Non-primary-source-only search | Stop; do not widen to community, tutorial, or non-authoritative sources. |
| Primary source unreachable | Stop after one retry; do not substitute a lower-tier source. |
| Target write fails | Rollback: delete any partial file. |

Partial-result rule: if the artifact was partially written before a failure, it must be deleted before reporting completion. The done predicate does not hold until the complete artifact exists.

## Output
A single Markdown file at the target path containing:
- Canonical subject name and version
- Every verified claim with an inline primary-source citation
- Each unverifiable claim explicitly labeled `[Unverified — no primary source available]`
- No claims derived solely from training data without citation

## Provenance

Origin: `mattpocock/skills` (https://github.com/mattpocock/skills), `skills/engineering/research/SKILL.md`.
Pinned revision: `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`.
License: MIT (SPDX). Copyright © 2026 Matt Pocock.
Adaptation: ADAPT into `odin-research`. Distinguishing mechanism is primary-source-only reading: every claim links to its owning primary source in one cited durable file, without a multi-tier ladder or subagent fan-out.
