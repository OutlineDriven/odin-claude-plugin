---
name: journey-trace-wizard
description: 'Use when asked to author a shell wizard for human-only provisioning steps; validates and hands it off for human execution. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Journey trace wizard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Human-only provisioning, credentials, dashboard, or cutover steps need guidance. |
| Authority | Write one wizard file locally; roll back on failure; never execute the wizard. |
| Side effect | Interactive shell wizard file authored at a named local path; never executed by the agent. |
| Done | Wizard passes syntax check, lint, and static journey trace; human is handed off. |

## Inputs

The human provides the provisioning context: target service or platform, credentials or configuration values to collect, and the starting system state. The wizard collects remaining values interactively at human-run time. The target wizard file path must be confirmed before any write.

## Procedure

1. **Confirm target path.** Agree with the human on the wizard file path. Fail if a file already exists at that path; do not overwrite. Done when: one unused wizard path is agreed.

2. **Author the wizard.** Write an interactive shell wizard to the agreed path covering every provisioning step in scope. For each prompt-read cycle:
   - Emit a clear prompt describing what is collected and why.
   - Read the value into a named variable.
   - Immediately validate or sanitize the value.
   - Route the value to its stated destination.
   - Handle errors with a named failure path that prints an error and exits non-zero.
   Done when: the wizard file is written and every provisioning step in scope has a prompt-read-validate-route cycle.

3. **Check syntax.** Run `bash -n "$wizard_path"`. Fail on non-zero exit. Done when: `bash -n` exits zero.

4. **Lint.** Run `shellcheck "$wizard_path"` if shellcheck is available. Record warnings; fail on errors. Done when: shellcheck reports no errors (or is absent and warnings are recorded).

5. **Static journey trace.** Parse the wizard script without executing it. For every read cycle confirm:
   - The read variable has a named destination.
   - Every destination is a writable path or a named env-var export.
   - The script terminates with a clear success message and exit 0.
   If any read cycle is untraced, fail. Done when: every read cycle is traced to a destination and the script terminates with exit 0.

6. **Set permissions.** Set the wizard file to owner-execute (chmod u+x). Done when: the wizard file is owner-executable.

7. **Hand off.** Tell the human the wizard path and how to run it. Do not execute the wizard. Done when: the human is told the path and run instruction.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Path collision | Fail before write; report the existing path; do not overwrite. |
| Syntax failure | Roll back wizard file; report `bash -n` error output. |
| Lint error | Roll back wizard file; report shellcheck error output. |
| Untraced read cycle | Roll back wizard file; report the untraced block and the missing destination. |

Roll back means delete the wizard file. On any failure the blocked result is: wizard file absent, human notified with failure class and error output. The agent never retries unfixable failures; the skill returns failure class and error output.

## Output

On success: the wizard file path with owner-execute permission, plus a human-readable summary of what the wizard does, the validated inputs, and how to run it. On failure: failure class name and the exact error output; no file is left behind.

## Provenance

Adapted from the wizard skill by Matt Pocock, origin mattpocock/skills at revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76. Licensed under MIT. Obligation: retain the copyright and permission notice in licenses/NOTICE. Adaptation for ODIN 2.0: ODIN create-advanced module; reversible-local authority; static journey trace validation; wizard authored but never executed. Clean-room adaptation: procedure, naming, and validation rules derived from the contract and provenance description, not from expression in the source repository.
