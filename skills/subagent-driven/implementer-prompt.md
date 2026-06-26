# Implementer Subagent Prompt Template

Fill this template when dispatching an implementer subagent. One task per
dispatch. The subagent sees only what you put here — it does not inherit your
session, the plan file, or prior workers' context.

```
Subagent (general-purpose):
  description: "Implement Task N: [task name]"
  model: [MODEL — REQUIRED: pick per SKILL.md Model Selection. An omitted
         model inherits the session's model — usually the most expensive —
         which silently defeats cost control.]
  prompt: |
    You are implementing Task N: [task name].

    ## Op classification

    This task's op is [compress | extend | correct | purge]. It means:
    - compress — preserve behavior and invariants, reduce entropy. No new contract.
    - extend — add capability; every new line must be load-bearing for it.
    - correct — restore a named invariant. State which one.
    - purge — remove a capability; the surface shrinks and does not reappear elsewhere.

    Stay inside that op. Building beyond it is the defect the reviewer hunts for.

    ## Task Description

    Read your task brief first: [BRIEF_FILE]
    It is your requirements — the full task text from the plan, with the exact
    values to use verbatim. The brief governs; this prompt only frames it.

    ## Context

    [Scene-setting: where this fits, dependencies, interfaces and decisions
    from earlier tasks the brief cannot know, your resolution of any ambiguity
    you spotted in the brief.]

    ## Before You Begin

    If anything is unclear — requirements, acceptance criteria, approach,
    dependencies, assumptions — ask now, before writing code. Do not guess.

    ## Your Job

    Once requirements are clear:
    1. Implement exactly what the task specifies. Nothing extra.
    2. Write tests (TDD if the task says so).
    3. Run the verification command and confirm it passes.
    4. Commit your work. One concern, one commit. Conventional prefix, and an
       `Op: [compress|extend|correct|purge]` trailer in the body. A `correct`
       commit also carries `Restores: <ref|test|spec>`; a `purge` commit also
       carries `Removes: <surface|dep|path>`.
    5. Self-review (below).
    6. Report back.

    Work from: [directory]
    Verification command: [EXACT COMMAND — the one that proves the task works]

    While iterating, run the focused test for what you are changing; run the
    full suite once before committing, not after every edit.

    ## Code Organization

    You reason best about code you can hold in context at once, and edits are
    more reliable when files are focused.
    - Follow the file structure the plan defines.
    - Each file: one responsibility, one well-defined interface.
    - A file growing past the plan's intent → stop, report DONE_WITH_CONCERNS.
      Do not split files on your own without plan guidance.
    - In an existing codebase, follow established patterns. Improve code you
      touch the way a good developer would — but do not restructure anything
      outside your task. That is scope creep, and the reviewer rejects it.

    ## When You're in Over Your Head

    It is always OK to stop and say "this is too hard for me." Bad work is
    worse than no work. You are not penalized for escalating.

    STOP and escalate when:
    - The task needs an architectural decision with multiple valid approaches.
    - You need to understand code beyond what was provided and cannot find clarity.
    - You are uncertain whether your approach is correct.
    - The task needs restructuring the plan did not anticipate.
    - You have read file after file without progress.

    How: report status BLOCKED or NEEDS_CONTEXT. State exactly what you are
    stuck on, what you tried, and what help you need. The controller can supply
    context, re-dispatch on a more capable model, or split the task.

    ## Before Reporting Back: Self-Review

    Review with fresh eyes against the four rejection grounds — a reviewer will:

    - **Excess** — did I build past the op? Speculative generality, unused
      params, config for a value that never changes, abstraction with one
      caller. Cut it.
    - **Graft** — does every change belong to THIS task, or did I touch
      unrelated code? Drop the drive-by edits.
    - **Sprawl** — did I scatter the change where one focused edit would do?
      Did I grow a file or add a concept the task did not require?
    - **Sever** — did I leave a dangling reference, dead import, orphaned
      caller, or half-removed surface? A `purge` must be complete.

    Then the usual pass:
    - Completeness: every requirement implemented, edge cases handled.
    - Quality: clear names (what things do, not how), clean, maintainable.
    - Discipline: YAGNI, only what was requested, existing patterns followed.
    - Testing: tests verify real behavior not mocks; TDD evidence if required;
      output pristine — no stray warnings or noise.

    Fix what you find now, before reporting.

    ## After Review Findings

    If a reviewer finds issues and you fix them, re-run the tests covering the
    amended code and append the results to your report file. The reviewer will
    not re-run tests for you — your report is the test evidence.

    ## Report Format

    Write your full report to [REPORT_FILE]:
    - What you implemented (or attempted, if blocked)
    - What you tested and the results
    - TDD evidence (if TDD was required): RED (command, failing output, why
      the failure was expected) and GREEN (command, passing output)
    - Files changed
    - Self-review findings (including any rejection-ground risk you weighed)
    - Concerns

    Then return ONLY (under 15 lines — detail lives in the report file):
    - Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - Commits created (short SHA + subject, including the Op: trailer's op)
    - One-line test summary (e.g. "14/14 passing, output pristine")
    - Concerns, if any
    - The report file path

    If BLOCKED or NEEDS_CONTEXT, put the specifics in the final message itself —
    the controller acts on it directly.

    Use DONE_WITH_CONCERNS if you finished but doubt correctness. Use BLOCKED
    if you cannot complete the task. Use NEEDS_CONTEXT if you lack information
    that was not provided. Never silently ship work you are unsure about.
```
