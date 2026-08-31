---
name: strict-validation-setup
description: 'Use when a user invokes a strict-mode validation or verifiable-goals loop setup. Bootstraps strict-mode tooling and per-task GOALS.md scaffolding so an agentic loop can self-verify. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Strict validation setup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User invokes a strict-mode validation or verifiable-goals loop setup. |
| Authority | Reversible local write: idempotent tooling-config merge, per-task GOALS.md scaffold, and failing-test authoring; no remote, credential, or deployed mutation. |
| Side effect | Merges strict-mode tooling configs idempotently, ensures AGENTS.md points to per-task GOALS.md, scaffolds `.agent-tasks/<id>/GOALS.md`, and writes failing tests; one-shot bootstrap. |
| Done | Strict configs are merged idempotently and per-task GOALS.md plus failing tests are in place, with task goals kept out of AGENTS.md. |

## Inputs

- User goal (required): enough observable behavior to derive at least one pass/fail success criterion. If not observable, stop before writing and ask for the missing outcome.
- Task ID (optional): must match `^[a-z0-9][a-z0-9-]{0,63}$`. If absent, use `task-` followed by the first 12 lowercase hexadecimal characters of SHA-256 over the exact UTF-8 user-goal text.
- Overwrite authorization (optional): permits replacement of a named conflicting non-strict config value. It does not permit replacing unrelated configuration or whole files.
- Project root (required): contains exactly one supported primary ecosystem: TypeScript, Python, Rust, Go, or OCaml. A TypeScript project may also contain `package.json`; that pair is one ecosystem.

This skill reads or creates `AGENTS.md` only to ensure one stable pointer: `Per-task goals live in .agent-tasks/<task-id>/GOALS.md.` It never writes task-specific criteria there and never reads or edits `CLAUDE.md`.

## Refusal

- `no-supported-manifest`: name the supported manifests; write nothing.
- `multiple-ecosystems`: name all detected primary manifests; require one explicit project scope; write nothing.
- `unsupported-ecosystem`: name the detected ecosystem and stop without a false reference claim. C++, Java, Kotlin, Spring Boot, Nest-specific, and React-specific setup are unsupported.
- `config-conflict`: name the path, key, current value, and required value; require explicit overwrite authorization for that key.
- `config-shape-unsupported`: name the manifest/config shape that cannot be merged without a partial or destructive rewrite; write nothing.
- `goal-not-observable`: ask for the missing observable outcome before writing.
- `test-framework-missing`: name the supported frameworks for the ecosystem; do not add dependencies or generic tests.
- `task-test-location-unsupported`: explain why the existing runner cannot execute `.agent-tasks/<id>/tests`; write nothing rather than claiming failing tests are in place.
- `agents-task-content`: name the task-specific AGENTS.md lines; write nothing until the user chooses how to separate them.
- `task-path-conflict`: name each existing unrelated or conflicting task file; overwrite nothing.
- `write-failed`: restore every prior target byte-for-byte and remove only newly created files.
- `verification-mismatch`: restore the complete write set; report expected and actual path/key or criterion.

No partial config-only or GOALS-only result satisfies the contract.

## Procedure

1. **Detect one supported ecosystem.** At the project root, detect TypeScript from `tsconfig.json`; Python from `pyproject.toml`; Rust from `Cargo.toml`; Go from `go.mod`; OCaml from `dune-project` or root `*.opam`. Treat `package.json` without `tsconfig.json` as unsupported JavaScript, not TypeScript. If none or more than one primary ecosystem is detected, stop before writing and report the exact manifests. Done when: exactly one ecosystem is detected or a stop condition is reported.
2. **Select and merge the exact strict configuration.** Parse the existing format; never append text blindly. Preserve unrelated keys and formatting where the parser/editor permits. A required key already set to the required value is unchanged. A missing key is inserted. A conflicting value is `config-conflict` unless overwrite authorization names that key. Load `references/<ecosystem>.md` (`typescript.md`, `python.md`, `rust.md`, `go.md`, or `ocaml.md`) for the exact config keys, values, and merge shape for the detected ecosystem. Done when: the config is merged idempotently at the exact path.
3. **Ensure the stable goal-location pointer.** Read `AGENTS.md` if it exists. If absent, create it with the single line `Per-task goals live in .agent-tasks/<task-id>/GOALS.md.` If it already contains an equivalent stable pointer, leave it unchanged. If it contains task-specific goals or success criteria, stop with `agents-task-content` and name the lines; do not move or delete them without explicit user direction. Never read or edit `CLAUDE.md`. Done when: `AGENTS.md` contains the stable pointer and no task-specific content from this run.
4. **Derive complete criteria before scaffolding.** Translate the user goal into the smallest ordered list of observable criteria, numbered `SC-01`, `SC-02`, and so on. Each criterion names an input or setup, observable behavior, and expected result. Reject subjective, circular, or implementation-only criteria. Determine one existing project test framework before writing: TypeScript supports `vitest`, `jest`, or `node:test`; Python supports `pytest` or `unittest`; Rust and Go use their built-in test harnesses; OCaml supports `alcotest`, `ounit2`, or Dune cram tests. Infer the framework only from existing manifest dependencies/configuration or existing tests. Done when: an ordered criteria list is derived and a supported framework is confirmed.
5. **Write the exact GOALS.md layout.** Create `.agent-tasks/<task-id>/GOALS.md` with no placeholders:

   ```markdown
   # <task-id>

   ## Goal
   <exact user goal>

   ## Success criteria
   - [ ] SC-01: <observable criterion>
   - [ ] SC-02: <observable criterion, if any>

   ## Verification
   - SC-01: `.agent-tasks/<task-id>/tests/sc-01.<language extension>` — `<existing targeted test command>`
   - SC-02: `.agent-tasks/<task-id>/tests/sc-02.<language extension>` — `<existing targeted test command>`

   ## Boundaries
   - Project-stable rules remain in project configuration.
   - Task-specific goals and criteria remain under `.agent-tasks/<task-id>/`.
   ```

   Substitute every angle-bracket form with the resolved value and emit only as many criterion and verification lines as exist. Preserve the user's goal verbatim under Goal. Do not mention or point from AGENTS.md. Done when: `GOALS.md` is written with no placeholders.
6. **Write one deliberately failing test per criterion using the established framework.** Each file name is `sc-NN` plus the framework extension. Each test name begins `SC-NN:` and quotes the criterion. The deliberate failure must execute unconditionally when that test runs; it is replaced by the task implementation, not hidden behind skip/xfail/todo. Per-framework patterns:
   - TypeScript: Vitest: `import { expect, test } from "vitest"; test("SC-NN: criterion", () => { expect.fail("SC-NN unmet: criterion"); });`. Jest: `test("SC-NN: criterion", () => { throw new Error("SC-NN unmet: criterion"); });`. `node:test`: `import test from "node:test"; test("SC-NN: criterion", () => { throw new Error("SC-NN unmet: criterion"); });`. Use `.test.ts` for Vitest/Jest and `.test.ts` for `node:test` only when the existing runner transpiles TypeScript; otherwise use `.test.mjs`.
   - Python: pytest: `def test_sc_nn() -> None:\n    raise AssertionError("SC-NN unmet: criterion")`. unittest: a `unittest.TestCase` method calling `self.fail("SC-NN unmet: criterion")`. Use `test_sc_nn.py`.
   - Rust: `sc_nn.rs` with `#[test]\nfn sc_nn() { panic!("SC-NN unmet: criterion"); }`. Place under `.agent-tasks/<task-id>/tests/`. If the project has no mechanism that compiles tests from that directory, stop with `task-test-location-unsupported`.
   - Go: `sc_nn_test.go` in package `tests` only if the existing module/test command includes `.agent-tasks`; otherwise stop with `task-test-location-unsupported`. Body: `func TestSCNN(t *testing.T) { t.Fatal("SC-NN unmet: criterion") }`.
   - OCaml: Alcotest: a case calling `Alcotest.fail "SC-NN unmet: criterion"`. OUnit2: `assert_failure "SC-NN unmet: criterion"`. Cram: `sc-nn.t` with the established project command followed by an intentionally mismatched expected output line `[SC-NN unmet: criterion]`. Require an existing Dune stanza or cram directory rule; otherwise stop with `task-test-location-unsupported`.
   Escape criterion text according to the target language's string-literal rules. Never leave `TODO`, `pass`, skipped tests, empty bodies, or generic assertions. Done when: one failing test per criterion is written.
7. **Commit the local write set atomically.** Before changing files, retain exact bytes of every existing target config, GOALS file, and criterion-test path. Require the task directory not to contain unrelated files that would be overwritten. Apply the config merge, GOALS.md, and all tests as one reversible set. On any write failure, restore prior bytes and remove only files created by this run. Done when: the write set is applied atomically or restored on failure.
8. **Verify the frozen done predicate.** Parse the written config and require every strict key/value from step 2. Recompute the merge and require byte-identical output. Re-read GOALS.md and require the exact layout, goal, criteria, and test links. Re-read every test and require its SC identifier, quoted criterion, and unconditional deliberate failure. Confirm `AGENTS.md` contains the stable pointer and no task-specific content added by this run; confirm this run did not read or modify `CLAUDE.md`. Stop after this one-shot verification; do not remain resident or run project-wide commands. Done when: every verification check passes.

## Output

Detected ecosystem's strict-mode config merged idempotently at the exact path; `AGENTS.md` with the stable GOALS.md pointer and no task-specific criteria; `.agent-tasks/<task-id>/GOALS.md` with complete goal, observable criteria, and test links; `.agent-tasks/<task-id>/tests/` with one executable deliberately failing test per criterion. No `CLAUDE.md`, support reference, compatibility alias, or unlisted file is created.
