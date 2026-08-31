---
name: principle-guard-the-context-window
description: 'Use when context fills with raw file or search payload. Delegates heavy reading to subagents or reads selectively so the main context carries decisions, not raw payload. Don''t use for tasks that require source or remote-system changes.'
---

# Principle guard the context window

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Keep large work within usable context. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Changes delegation and reading strategy only. No state mutation. |
| Done | Main context carries decisions, not raw payload. |

## Inputs

- Current task or question driving the work.
- Codebase or document set that may exceed context capacity.

## Procedure

1. Assess whether the full material needed for the task fits in context without crowding out room for reasoning and response.
2. If context pressure is absent, proceed normally. Stop this skill.
3. When context pressure exists, identify which material is payload (full file contents, large search results, bulk data) and which is decision-relevant (approaches, confirmed facts, resolved ambiguities, constraints).
4. Delegate bulk reading to subagents or background tasks that return summaries, key excerpts, or structured findings rather than raw content.
5. If delegation is unavailable, read files selectively using line offsets and targeted searches instead of full-file reads.
6. Carry forward only distilled decisions, constraints, and confirmed facts into the main context.
7. Before reporting results, verify that the main context holds decisions and not raw payload. If raw payload remains, distill it before proceeding.

## Failure and recovery
| Failure class | Recovery |
|---|---|
| Context fills despite delegation | Stop. Offload further reading before continuing. Do not proceed with a saturated context. |
| Subagent or delegation unavailable | Fall back to selective reads with line offsets and targeted grep. Accept reduced coverage rather than loading full files. |
| Payload cannot be distilled into decisions | Report the undistilled material explicitly. Do not pretend the done predicate holds. |
| Scope widens beyond the original task | Stop. Bound scope to the original task before reading additional material. |

## Output
A set of concrete decisions, confirmed facts, and resolved constraints that fit in main context. Each decision traces to evidence but does not carry the raw evidence payload.

## Provenance

Adapted from pstack/skills/principle-guard-the-context-window/SKILL.md (cursor/plugins, revision 68836ddaf5697224520f1847d90cdb90ca8babaa). Original authored by Lauren Tan (poteto) under MIT license (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25). Clean-room adaptation for ODIN 2.0; no third-party expression copied.
