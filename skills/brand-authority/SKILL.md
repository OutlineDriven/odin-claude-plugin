---
name: brand-authority
description: 'Use when the user asks for branded or style-governed output. Produces a deliverable that follows a fetched brand authority and states the material constraints that shaped it. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Brand authority

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for branded or style-governed output. |
| Authority | reversible-local — write only the named local deliverable file(s); the brand authority itself is read, never mutated. Rollback is deleting or overwriting the local deliverable file(s). |
| Side effect | Local deliverable file(s) written under the working directory; no publish, deploy, remote, credential, or hosted-authority mutation. |
| Done | The deliverable follows the fetched brand authority and states the material constraints that shaped it. |

## Inputs

- The deliverable request: what to create, revise, or review (e.g., launch page, doc, HTML/CSS component, UI mockup, prompt, social asset, copy, presentation).
- The brand authority source: a URL or local file path to the canonical brand/style guidance. If the user did not name one, ask for it before producing any output; do not proceed from memory.

## Procedure

1. Confirm the deliverable request and the brand authority source. If either is missing or ambiguous, ask the user before mutating any file.
2. Fetch the brand authority from the supplied URL, or read it from the supplied local path. Do not rely on recalled brand rules when a fetchable authority exists.
3. If the fetch returns usable guidance, extract the rules relevant to this deliverable: visual style, color usage, typography, voice and tone, component rules, naming and capitalization, and implementation guidance.
4. Apply the extracted rules to produce, revise, or review the deliverable. Write only the named local deliverable file(s); never write to the authority source or any remote target.
5. In the delivered result, state the material brand constraints that shaped the output (e.g., a specific palette, type scale, voice rule, or naming convention that determined a choice).

## Failure and recovery
- Authority unreachable or empty: state that the canonical brand authority was unavailable and ask the user whether to proceed with best-effort guidance or to retry the fetch. Do not fabricate brand rules and present them as authoritative.
- Ambiguous deliverable request: ask for clarification before writing; do not guess scope.
- Partial result: never ship a deliverable that claims brand authority it did not actually fetch. If only some guidance extracted, apply only that and note the gap.
- Non-mutation: the hosted or local authority is read-only; recovery from a wrong local deliverable is overwrite or delete of that local file only.

## Output
One or more local deliverable file(s) conforming to the fetched authority, plus a short note of the material brand constraints that shaped the result. If the authority was unavailable, the output is the unavailability notice and the user prompt described above — no branded artifact.

## Provenance

Origin: github.com/warpdotdev/common-skills, revision f589e224907eda566c13755529f59db563090d14, file .agents/skills/brandalf/SKILL.md. License: MIT (Copyright (c) 2026 Denver Technologies, Inc.). Adaptation: clean-room rewrite of the fetch-authority-then-apply mechanism in ODIN style; no third-party expression copied, attribution retained in this module provenance ledger. The vendored pierre-diffs.js bundle noted in the source license is not carried over.
