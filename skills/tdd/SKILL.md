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

## Refusal

- Test cannot be written: stop. Report the missing prerequisite (unclear requirement, untestable coupling, missing framework). Do not proceed to implementation.
- Test framework unavailable and not discoverable: stop. Report the missing dependency. Do not install or assume a framework.
- Implementation breaks existing tests: revert the implementation. Narrow the change to affect only the new test's assertion. Re-run the full suite.

## Procedure

1. **Read the target code** and identify the smallest observable behavior that the requirement describes. Done when: one observable behavior is named.
2. **Write a single focused test** that asserts the expected behavior. Name it to describe the behavior, not the implementation. Done when: one test is written.
3. **Run the test suite.** Record the exact failing output including the test name and assertion message. This is the failing-before evidence. Done when: failing output is recorded.
4. **Implement the minimal change** in the target code that makes the new test pass. Do not refactor unrelated code. Done when: the test passes.
5. **Run the test suite again.** Record the exact passing output. This is the passing-after evidence. Done when: passing output is recorded.
6. **Check for false green.** If the test passes on first run without any implementation change, the test is not exercising the intended behavior. Rewrite the test to fail against the current implementation, then return to step 3. Done when: the test genuinely fails before implementation and passes after.
7. **Commit the test and implementation together** with a message that names the behavior tested. Done when: one commit contains both files.

## Failure modes

- Partial result (test written and fails but implementation incomplete): the artifact is the failing test and its output. Do not claim the done predicate.
- Rollback: revert the implementation commit. The test file may remain if it documents a valid future behavior.

## Output

Test file path, failing-before run output (test name, assertion, expected vs actual), passing-after run output, implementation commit SHA — in that order.

## Provenance

Origin: cursor/plugins pstack/skills/tdd/SKILL.md at revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25, authored by Lauren Tan). Adapted for ODIN 2.0 skill format; procedure rewritten to enforce named evidence and failure-stop semantics.
