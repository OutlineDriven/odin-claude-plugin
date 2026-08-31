---
name: automation-plan-first-builder
description: 'Use when the user requests a scheduled or triggered automation from an approved task analysis. Produces an exportable artifact that reproduces the approved procedure without re-derivation. Not for analyzing the task or deploying the automation.'
---

# Automation plan first builder

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user requests a scheduled or triggered automation built from an approved analysis of a recorded task. |
| Authority | Reversible local write: export only a named automation JSON bundle into a fresh, non-colliding local directory. Roll back by deleting the written bundle. |
| Side effect | Renders deterministic automation JSON; step prompts self-resolve their values at unattended run time. No remote, credential, paid, published, or deployed mutation. |
| Done | An exportable automation artifact exists that reproduces the approved procedure on a schedule without re-derivation. |

## Inputs

Required: an approved analysis of one recorded task: a stated intent plus an ordered list of steps. Without it the contract cannot run.

Optional: a target-architecture native-tool catalogue for mapping recorded actions to native capabilities; natural-language feedback that refines a previously proposed plan; and a per-automation model override.

## Procedure

1. Read the approved analysis (intent plus ordered steps). Where the native-tool mapping or the proposed schedule needs evidence, read the deterministic timeline behind those steps (apps, URLs, hosts, commands) and ground the mapping and schedule in it. Done when: the analysis is read and the mapping and schedule are grounded in the deterministic timeline.
2. Generalize from the intent: separate the essential procedure from the incidental specifics of the one recording. If the user acted on a specific set (for example processed three rows), the steps must iterate over every item of the whole collection rather than hardcode the examples. Keep what is essential; drop exact values, window positions, and timing that were incidental to the one run. Done when: the essential procedure is separated from incidental specifics and generalized over the whole collection.
3. Propose the trigger. A recording captures one run and carries no "when to run" signal, so propose a sensible default schedule and state the assumption for the user to correct in plain language. Pick the schedule shape that fits the task: single (one time of day), interval (every N minutes where N divides 1440 evenly), or multi (a few fixed times a day). Set both the human phrasing and the structured fields (kind, days, time or anchor or times). Choose a condition trigger only when the recording clearly implies an event ("when a new file appears"); then give the condition and a check interval. Done when: the trigger is proposed with schedule shape, human phrasing, and structured fields.
4. Extract fixed values as tokens. Pull every literal that is the same on every run (a canonical URL, a file path, a repo slug, an API constant) into the plan's values as { id, name, value } with a short snake_case id, a human label, and the exact literal. Reference each from a step prompt by its {{id}} token instead of writing the literal. Do not create a value for anything discovered at run time or that varies run to run; do not create a value for anything a human would have to provide. Done when: every fixed literal is extracted as a token and referenced by {{id}} in step prompts.
5. Write the ordered steps (roughly two to six). Each step is a short label plus an imperative prompt to the agent. Generalize each prompt over the whole collection and the shape of the data, never the specific values from the recording. Map each recorded action to the target's native capability and prefer a first-class CLI on the device over the browser: use the gh CLI for GitHub, plus git and cloud CLIs. Fall back to the browser only for genuine UI-only steps with no API and no CLI. Make each prompt self-resolving: an automation runs unattended and cannot stop to ask a human, so reference a fixed literal by its {{id}} token and, for anything that varies, instruct the agent to locate it on the device or read it from the system. Never depend on a value a human must supply at run time. Done when: the ordered steps are written with self-resolving prompts mapped to native capabilities.
6. Propose the plan for review and stop. Present the name, title, description, generalization, trigger, values, and steps. Issue only one proposal per turn. If the user replies with natural-language changes, revise and re-propose; do not build until the user approves. Done when: the plan is proposed for review and the skill stops.
7. On approval, build deterministically: the reviewed plan is the whole automation; there is no second derivation pass. Validate that the plan has at least one step. Carry the trigger, schedule, name, description, model, and values verbatim from the reviewed plan. Substitute every {{id}} token in the step labels and prompts for its literal value. Render the automation JSON with the schedule's redundant top-level hour and minute mirror filled from the schedule's primary time. Write the JSON as automation.json into a fresh, non-colliding bundle directory; if this session already exported one, re-export to that same folder. Persist a built-automation record alongside it. Done when: the automation.json is written with all tokens substituted and the built-automation record is persisted.

## Failure and recovery
- No approved analysis: blocked. State that an approved analysis is a prerequisite and stop; do not invent one.
- Zero steps on approval: blocked. Require at least one step before building; do not export an empty bundle.
- Schema mismatch on a proposal: report the failing fields, correct them, and re-propose. No artifact is written for a rejected proposal.
- Non-convergent refinement: if the user never approves after repeated refinement, return the last proposed plan as a non-converged draft and do not export. Never pretend the done predicate holds.
- Rollback: export writes only to a fresh non-colliding directory (or the session's prior export folder) and never clobbers an unrelated automation. To revert, delete the written automation.json and its bundle directory.

## Output
An automation.json artifact in a bundle directory containing kebab-case name, description, triggerType, schedule (with top-level hour/minute mirror), ordered steps (each a label and prompt with {{id}} tokens substituted for literals), and when set the condition, condition check interval, and model — plus a persisted built-automation record for re-export.

## Provenance

Adapted from microsoft/skill-recorder (MIT, revision c7f2fe4402527a0eb7f4fc1b653bf438229bac61), files electron/automationbuilder/instructions.ts, electron/automationbuilder/builder.ts, electron/automationbuilder/tools.ts, and common/automation.ts. Clean-room adaptation: the plan-first propose-then-build-deterministically workflow, the self-resolving {{id}} token substitution, and the schedule-inference rule are re-expressed as a self-contained ODIN procedure; no Microsoft source expression is copied. MIT notice retained — copyright (c) Microsoft Corporation.
