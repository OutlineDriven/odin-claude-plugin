---
name: tdd
description: 'Use when asked to develop a fix or feature test-first. Produces a focused test that fails before the change and passes after. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Test-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Develop a fix or feature test-first. |
| Authority | Reversible-local: write only named test and source files; rollback via VCS revert of the implementation commit. |
| Side effect | Adds a focused test file and the minimal implementation that makes it pass. |
| Done | Named failing-before and passing-after evidence: the test file path, the failing run output, and the passing run output. |

## Inputs

- **Target**: the file, function, module, or behavior to change. Required.
- **Bug description or feature requirement**: a concrete statement of what the test must assert. Required.
- **Test framework**: the project's existing test runner and assertion library. Optional if discoverable from the project; required if the project has no tests yet.

## Procedure

1. Read the target code and identify the smallest observable behavior that the requirement describes.
2. Write a single focused test that asserts the expected behavior. Name it to describe the behavior, not the implementation.
3. Run the test suite. Record the exact failing output including the test name and assertion message. This is the failing-before evidence.
4. Implement the minimal change in the target code that makes the new test pass. Do not refactor unrelated code.
5. Run the test suite again. Record the exact passing output. This is the passing-after evidence.
6. If the test passes on first run without any implementation change, the test is not exercising the intended behavior. Rewrite the test to fail against the current implementation, then return to step 3.
7. Commit the test and implementation together with a message that names the behavior tested.

## Failure and recovery
| Failure class | Response |
|---|---|
| Test cannot be written | Stop. Report the missing prerequisite (unclear requirement, untestable coupling, missing framework). Do not proceed to implementation. |
| Test passes without implementation change | Rewrite the test to assert the unmet behavior. Do not skip to step 5. |
| Implementation breaks existing tests | Revert the implementation. Narrow the change to affect only the new test's assertion. Re-run the full suite. |
| Test framework unavailable and not discoverable | Stop. Report the missing dependency. Do not install or assume a framework. |

Partial result rule: if the test is written and fails but implementation is incomplete, the artifact is the failing test and its output. Do not claim the done predicate.

Rollback: revert the implementation commit. The test file may remain if it documents a valid future behavior.

## Output
- The test file path.
- The failing-before run output (test name, assertion, expected vs actual).
- The passing-after run output.
- The implementation commit SHA.

## Provenance

Origin: cursor/plugins pstack/skills/tdd/SKILL.md at revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25, authored by Lauren Tan). Adapted for ODIN 2.0 skill format; procedure rewritten to enforce named evidence and failure-stop semantics.
