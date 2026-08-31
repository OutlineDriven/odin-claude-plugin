---
name: unslop-detool
description: 'Use when a durable artifact claims portability or tool-neutrality while carrying stack-specific nouns. Rewrites incidental couplings to mechanisms; provenance and tool-subject claims stay concrete. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Unslop detool

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Durable artifact claims portability/tool-neutrality/cross-stack durability while carrying stack-specific nouns |
| Authority | Reversible local write; rollback restores the original from VCS or the pre-edit backup |
| Side effect | Rewrites incidental couplings to mechanisms in durable content; provenance and tool-subject claims stay concrete |
| Done | Every changed hit was durable content, every rewrite preserved the actionable mechanism, every kept noun is provenance/operational/subject |

## Inputs

- **Target artifact** (required): file path or content block to audit.
- **Section granularity** (optional): classify per section rather than whole-document when the artifact mixes durable and provenance content.

## Procedure

1. Read the target artifact end to end.
2. **Role classification**: classify the whole artifact, or each section if mixed, into one of three roles. Record the classification before any edit:
   - **Durable/portable content**: meant to travel across stacks; subject to detool.
   - **Provenance/operational record**: build logs, install guides, runbooks, command transcripts, reproduction steps; keeps concrete stack nouns.
   - **Tool-subject claim**: the named tool, vendor, model, bug, or measured limit is the subject of the sentence; keeps the name.
3. Sweep durable-content sections for incidental coupling: harness paths, vendor CLIs and flags, model or product brands used as mechanisms, tool-specific environment variables, quotas, UI steps, cache homes, session files, and version-pinned behavior stated as timeless truth.
4. For each hit in durable content, replace with the neutral mechanism that preserves the action. If neutral wording would lose the action, keep the concrete detail as an example of the mechanism instead of pretending it generalizes.
5. Protect provenance and operational content: build records, capsules, benchmark logs, install guides, runbooks, tool-targeted how-tos, command transcripts, and exact reproduction steps keep the stack name.
6. Protect comparative and tool-subject claims: if the sentence is about a named tool, vendor, model, bug, prior-art source, or measured limit, the name is the subject, not incidental coupling.
7. Re-read as a reader on a different stack: the artifact should still be true, portable, and executable where it promised action.
8. Report what was neutralized, what was deliberately kept, and the role classification behind each decision.

## Failure and recovery
- **Artifact not found or unreadable**: stop immediately; report the miss. Do not fabricate content.
- **Ambiguous role classification**: default to durable content and flag the judgment call in the report.
- **Neutral wording loses the mechanism**: keep the concrete detail as an example; note the decision in the report.
- **No incidental coupling found**: report that nothing was changed and why.
- **Edit would alter the mechanism or evidence itself**: abort that edit; report the conflict.

## Output
The rewritten artifact with a report section appended. The report lists: neutralized couplings with before/after pairs, deliberate keeps with their assigned role, and any judgment calls made during classification.

## Provenance

- **Origin**: `skills/depth/detool/SKILL.md` from LilMGenius/paperthin.
- **Pinned revision**: `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`.
- **License**: MIT (c) 2026 LilMGenius.
- **Adaptation**: Clean-room restructure into self-contained ODIN 2.0 skill. No third-party expression copied. Peer-skill runtime routing removed; role-classification and edit-decision tracking inlined into the procedure.
