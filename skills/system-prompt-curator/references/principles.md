# Research-backed core principles

Use this table as the invariant checklist for created and improved autonomous-agent prompts. Each principle protects against a known failure mode from production coding-agent prompts: early bailout, analysis-as-completion, tool confusion, verification skip, or brittle recovery.

| # | Principle | Essence | Protected Invariant | Failure if Missing |
|---|---|---|---|---|
| 1 | Identity matches the task | Name the agent by the work it performs: software engineer for code, technical analyst for research, reviewer for review. Avoid abstract labels. | The model adopts the behavior and obligations of the role. | Generic "assistant" or "focused agent" answers politely instead of owning the task. |
| 2 | Autonomous completion mandate | For autonomous work, require continuation until the deliverable exists or a named blocker is proven. | The agent treats the task as end-to-end execution, not advice. | Agent stops after a plausible explanation or partial plan. |
| 3 | Structured workflow phases | Use explicit ordered phases. Coding default: Explore → Plan → Implement → Verify → Deliver. Research default: Scope → Investigate → Analyze → Report. | Analysis and planning are intermediate states, not exit states. | Agent reads, understands, and completes without acting. |
| 4 | Completion requires evidence | Gate finish on concrete fields: files changed, tests run, citations, commit/PR/report, blockers tried, summary. | Completion is impossible without observable artifacts. | `complete_run` or final answer can be called with zero work done. |
| 5 | Tools listed upfront | Declare every available tool, what it does, and when to use it. Do not rely on dynamic discovery. | The model can plan with the real action surface from turn one. | Agent wastes turns discovering tools or avoids tool use entirely. |
| 6 | Worked demonstration | Include at least one complete successful trajectory. It must show a failure and changed recovery path. | The model sees the desired control loop: act, observe, adapt, verify. | Agent gives up on the first tool failure or imitates only happy-path analysis. |
| 7 | Think-before-act transitions | Require deliberate reasoning at high-risk transitions: after exploration, before code edits, before git operations, before completion. | The agent checks assumptions before irreversible or expensive actions. | Agent jumps from shallow context to edits, branch operations, or finish. |
| 8 | Collaborative firm tone | Use normal imperative language, phase contracts, and checklists. Avoid panic language and threat blocks. | Instructions stay legible and enforceable without overtriggering. | All-caps rules and threats produce brittle, performative compliance. |
| 9 | Convention discovery before coding | Require the agent to inspect nearby code, manifests, tests, and existing patterns before writing. | New work fits the repository instead of inventing a parallel convention. | Agent imports unavailable libraries, creates incompatible structure, or breaks style. |
| 10 | Verification gate before completion | Name verification commands or evidence substitutes. Require fixing failures or reporting why verification is impossible. | The final answer is grounded in observed checks. | Agent claims success without compiling, testing, linting, reproducing, or citing. |

## Principle application notes

- **Minimal prompts still need gates.** A compact prompt may shorten examples and tips, but cannot remove identity, workflow, tools, verification, and completion evidence.
- **Read-only agents still need completion evidence.** Replace `files_modified` with cited sources, answered questions, unresolved uncertainties, and confidence.
- **Review agents still need a workflow.** Use Scope → Inspect → Validate → Report. Require file/line evidence and severity definitions.
- **No-human-in-loop agents need stricter gates.** Require separate help/blocker path, validated finish payload, and concrete artifact checks.
- **Human-in-the-loop agents need ask boundaries.** They may ask only at specified decision points; they still must use tools for answerable facts.

## Self-evaluation shape

Use this before returning a created or improved prompt:

| Principle | Status | Evidence in Prompt | Fix if PARTIAL/FAIL |
|---|---|---|---|
| Identity matches task | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Autonomous mandate | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Workflow phases | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Completion evidence | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Tools upfront | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Worked demonstration | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Think transitions | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Tone | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Convention discovery | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |
| Verification gate | PASS/PARTIAL/FAIL | Section/phrase | Concrete edit |

A returned prompt with any unaddressed FAIL is not complete. PARTIAL is allowed only when the user explicitly requested a constrained prompt and the limitation is stated in design notes.
