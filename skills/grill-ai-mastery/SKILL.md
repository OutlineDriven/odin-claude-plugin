---
name: grill-ai-mastery
description: Hybrid interview that probes AI-engineering mastery by tip-vocabulary depth — entity referencing, loop closure, observability, harness improvement — not by token usage or LOC. Start collaborative (two-way tip exchange), escalate to adversarial probing when depth is lacking. Trigger when the user says "interview me on AI", "stress-test my Claude usage", "evaluate this candidate's AI engineering", or otherwise asks for an AI-collab skill assessment. User-only — never auto-invoke.
disable-model-invocation: true
---

Probe AI mastery by what the subject *names*, not by how much they *generate*. The premise from the chat that prompted this skill: token usage and LOC are noise; concrete tip vocabulary (URL-as-entity-ref, loop closure, observability) is signal.

## Mode disambiguation

| Skill                    | Anchor                                         | Posture                                         |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------- |
| **`grill-ai-mastery`**   | AI-collab tip vocabulary tree (this file)      | Hybrid: collaborative → adversarial             |
| `grill-me`               | Any plan/design under test                     | Linear adversarial, one question at a time     |
| `request-refactor-plan`  | A refactor in particular                       | Adversarial interview specific to refactoring   |

This skill is the AI-mastery anchor; `grill-me` is the domain-agnostic version. Pick by what's being assessed.

## Phase 1 — Collaborative tip-sharing

Open by asking the subject to *name* a tip they actually use when collaborating with an LLM. Two-way: surface one of yours back as a counter-tip. The exchange is the assessment, not a quiz. Watch for:

- Concrete protocol names (URL-as-entity-ref, AGENTS.md, MCP resources, structured outputs) versus generic platitudes ("I write good prompts").
- Direction-of-travel signals — does the subject describe loops, observability, anchored references? Or do they describe vibes, screenshots, "the function we discussed"?
- Self-correction — when the subject reaches for a vague handle, do they catch themselves and produce a URL?

Stay collaborative as long as the depth matches the level the assessment is calibrated to.

## Phase 2 — Adversarial probe (escalation)

Promote to adversarial questioning when **any** of these signals fire:

- **Vague answers** — "I just use it normally" / "good prompts" / "I check the output" with no protocol name attached.
- **Token-usage / LOC framing** — the explicit anti-pattern from the chat that prompted this skill. Surface the rejection: "those measure quantity, not capability. What do you actually do that someone less skilled does not?"
- **Inability to name three protocols** — when prompted directly, cannot produce three concrete tactics with a why for each.
- **Unanchored entity references** in the conversation itself — the subject says "the PR" / "that bug" without offering a URL.

In adversarial mode, walk the tip-vocabulary tree:

1. **Entity referencing** — how do you point at an entity so a future session can find it? (Looking for: URL permalinks, MCP resources, file:line, symbol paths.)
2. **Durable references** — where does the next session start? (Looking for: PR comment threads, AGENTS.md, structured logs — not chat memory.)
3. **Loop closure** — when work needs N iterations, what does the inner loop look like and where is the human? (Looking for: CLI triggers, file outputs, contract assertions, human at the outer loop only.)
4. **Harness improvement** — what do you do when the loop cannot close? (Looking for: trap-or-abandon — improve the harness, do not babysit.)

One question at a time, recommend the answer in a sentence after the subject responds. The recommendation gives the subject a calibration point without grading on a hidden rubric.

## Stop conditions

- Tree is walked end-to-end with substantive answers per fork.
- A blocking gap surfaces — the subject lacks a basic protocol vocabulary; halt and recommend `ai-collab-protocols` as a starting point rather than continuing the probe.
- Subject converges with the assessor — depth matches; no further probing changes the verdict.

## Anti-patterns to flag in the subject

- **Token usage as a proxy for skill** — already named above; reject and redirect.
- **LOC as productivity** — comments-as-LOC is the running joke of the source chat; treat as the tell that the subject does not yet think in protocols.
- **"Mindless automation eats the most tokens"** — paraphrase from the chat. If the subject argues automation is the high-skill move, probe whether they distinguish *open-observability autonomous loops* from *babysat scripts*.

## Tab-complete note

`grill-ai-mastery` and `grill-me` share the `grill-` prefix and will tab-complete adjacent. Both exist intentionally: `grill-me` for general design grilling, this skill for AI-collab assessment specifically. Confirm with the user which they meant when invocation is ambiguous.
