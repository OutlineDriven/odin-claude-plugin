---
name: handoff
description: 'Use when the user asks to continue current work in a different agent or session: packages live context into a bounded typed brief a receiving agent can resume. Not for clipboard-ready prompts — use handoff-prompt; never remote, credential, publish, deploy, or irreversible.'
---

# History handoff

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly asks to continue current work in a different agent or session. |
| Authority | Reversible local write: produce one bounded handoff file or stdout only. Launching the target agent is a separate explicit human action and is never performed here. |
| Side effect | Writes at most one handoff file under the current project, or emits the brief to stdout. No remote, credential, VCS, or deployed mutation. |
| Done | A <=6KB typed brief uses handles and shows a source receipt, a staleness warning after seven days, exclusion refusal, and wrong-project visibility; no raw transcript appears. |

## Inputs

Required: the current conversation or session context being handed off — its problem statements, the conclusions reached, and where the work stopped.

Optional: an explicit session or project handle to package when the user names one; otherwise package the current work in scope. An exclude list of project patterns the user has declared private, used only to refuse.

## Procedure

1. Resolve what is being handed off. If the user named a session or project handle, use it; otherwise use the current work in scope. Apply strict project scope so a directory-name match does not package a different project's work. If more than one distinct session matches the current scope, pick the newest and state that an explicit handle would choose otherwise. Done when: the stated action, evidence, and guard all hold.

2. Print a source receipt before producing the brief: the session or harness kind, the project name, a short handle for the session id, and the age of the work. The user must always see what is being handed off so a wrong-project or stale handoff is obvious before it lands. Done when: the stated action, evidence, and guard all hold.

3. If the work is older than seven days, emit a staleness warning naming the age and suggesting the user pass an explicit handle for newer work. Treat a timestamp ahead of the clock as unknown age rather than a number that cannot be true. Done when: the stated action, evidence, and guard all hold.

4. Refuse to hand off context from a project the exclude list covers. An index built before the pattern was added can still hold the session, so refusal is the privacy control; tell the user to rebuild without the pattern or remove the pattern to hand it off. Done when: the stated action, evidence, and guard all hold.

5. If newer work in the same project is withheld by a trust or visibility policy, say so and state that the packaged session is the newest the policy allows. Done when: the stated action, evidence, and guard all hold.

6. Build the brief within a 6KB budget. Spend three quarters of the budget on the packaged body and reserve the rest for the tail. The body opens with a framing header using handles — session kind, project, date — then noise-filtered user problem statements and key conclusions. Drop raw transcript: filter out tool output, command dumps, JSON and CLI walls, system reminders, and passages with long unbroken token runs; keep only prose a person or agent wrote. Select conclusions as the assistant lines that carry a decision marker plus the final outcome line, in transcript order. When a passage is cut to fit the budget, end it with a cut marker and write nothing after the marker; never leave a section header standing with nothing under it. Done when: the stated action, evidence, and guard all hold.

7. Append a "Where it stopped" tail: the last few substantive exchanges, verbatim and noise-filtered, so the receiving agent sees the live state and not only conclusions. The tail is paid out of the reserved budget. Done when: the stated action, evidence, and guard all hold.

8. End the brief by telling the receiving agent this is a compact slice and that it should continue from the packaged context instead of re-deriving what is already done. Done when: the stated action, evidence, and guard all hold.

9. Emit the brief to stdout or write it to one handoff file under the current project. Do not launch any target agent. State that launching is a separate explicit human action. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- Wrong-project match: stop and report which project the match came from; do not package it. Recovery is an explicit handle from the user.
- Excluded project: refuse and name the project; do not produce a brief. Recovery is rebuilding without the pattern or removing the pattern.
- Stale work: produce the brief with the staleness warning; do not silently hand over older work when newer work is withheld.
- Budget overflow: cut with a marker and stop the block; never write past a cut marker or let a section header stand empty.
- Ambiguous handle: report the ambiguity and stop; do not pick silently among distinct sessions.
- No session in scope: stop and ask for an explicit handle; do not invent a session.
- Partial result: a brief that fails the done predicate is not emitted as complete; report what failed and stop. Never swallow an error or pretend the done predicate holds.

## Output
One <=6KB typed handoff brief, to stdout or a single file under the current project. The brief contains a handle-bearing framing header, noise-filtered problem statements, key conclusions, and a "Where it stopped" tail; a source receipt is printed before it; and the applicable staleness warning, exclusion refusal, or wrong-project notice is shown. No raw transcript appears. No target agent is launched.
