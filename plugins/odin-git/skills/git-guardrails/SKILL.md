---
name: git-guardrails
description: 'Use when a repository needs a safety net against force-push, forced refspec, hard reset, forced clean, forced branch deletion, working-tree discard, stash drop/clear, reflog expire, or gc prune; installs a PreToolUse hook exiting 2 on them; plain git push allowed. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Set up Git guardrails

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository needs a tool-time safety net against force-push/reset/clean/branch-delete/discard. |
| Authority | Reversible-local: write only the hook copy under the chosen `.claude/hooks/` or `~/.claude/hooks/` directory and one merged `hooks.PreToolUse` entry in the matching `.claude/settings.json` or `~/.claude/settings.json`. No VCS, remote, credential, or other file change. Rollback: delete the copied script and remove the registered entry. |
| Side effect | Copies `block-dangerous-git.py` and registers it in the chosen settings file `PreToolUse`; net effect removes destructive capability. |
| Done | All 16 verification payloads exit as expected, the hook is registered, and plain `git push` still exits 0. |

## Inputs

- Scope (required, chosen by the user): project (`.claude/settings.json` plus `.claude/hooks/`) or global (`~/.claude/settings.json` plus `~/.claude/hooks/`).
- Hook source: `scripts/block-dangerous-git.py` shipped beside this SKILL.md.
- Optional: rule additions or removals, decided before installation.

## Procedure

1. Ask the user to choose project or global scope. Mutate nothing before the choice. Done when: the user has chosen project or global scope, with no mutation made.
2. Copy `scripts/block-dangerous-git.py` to the chosen location — project: `.claude/hooks/block-dangerous-git.py`; global: `~/.claude/hooks/block-dangerous-git.py` — and run `chmod +x` on the copy. Leave the skill's source copy untouched. Done when: the hook copy exists at the chosen path, is executable, and the source copy is unchanged.
3. Show the default blocked operations — forced pushes and forced refspecs; `reset --hard`; forced `clean`; forced branch deletion; `checkout .` and `restore .`; `stash drop` and `stash clear`; `reflog expire`; `gc --prune=now` — and ask whether to add or remove a rule. On approval, edit only the installed copy. When a rule is added or removed, add or remove the corresponding test case in the Step 4 verification matrix so the gate covers the modified policy. Done when: the blocked-operations list is shown, any approved rule change is applied to the installed copy only, and the verification matrix is updated to match.
4. Verify before registration. For each payload below, run:

   ```bash
   printf '%s\n' '<payload>' | <path-to-hook>
   printf 'exit=%s\n' "$?"
   ```

   Must exit 2:

   1. `{"tool_input":{"command":"git push --force origin main"}}`
   2. `{"tool_input":{"command":"ok && git reset --hard"}}`
   3. `{"tool_input":{"command":"echo ok\ngit reset --hard"}}`
   4. `{"tool_input":{"command":"bash -c \"git reset --hard\""}}`
   5. `{"tool_input":{"command":"bash -lc \"git reset --hard\""}}`
   6. `{"tool_input":{"command":"eval \"git reset\" --hard"}}`
   7. `{"tool_input":{"command":"git clean --force"}}`
   8. `{"tool_input":{"command":"git branch --delete --force"}}`
   9. `{"tool_input":{"command":"git checkout ."}}`
   10. `{"tool_input":{"command":"git stash clear"}}`
   11. `{"tool_input":{"command":"git reflog expire --all"}}`
   12. `{"tool_input":{"command":"git gc --prune=now"}}`
   13. `{"tool_input":{"command":"git push origin +main"}}`

   Must exit 0:

   14. `{"tool_input":{"command":"git push origin main"}}`
   15. `{"tool_input":{"command":"git commit -m \"oops; git reset --hard\""}}`
   16. `{"tool_input":{"command":"git --git-dir=.git status"}}`

   All sixteen cases must match before registration. A blocked command prints this to stderr and exits 2:

   ```text
   BLOCKED: '<command>' matches dangerous pattern '<pattern>'. The user has prevented you from doing this.
   ```
   Done when: all sixteen payloads exit as expected — the thirteen dangerous commands exit 2 and the three safe ones exit 0 — and the BLOCKED stderr message is confirmed.

5. After all sixteen cases pass, merge the entry into the existing `hooks.PreToolUse` array of the chosen settings file. Never overwrite the settings file or discard existing hooks. Done when: the entry is merged into the existing `hooks.PreToolUse` array with all prior hooks preserved.

   Project fragment:

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Bash",
           "hooks": [
             {
               "type": "command",
               "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.py"
             }
           ]
         }
       ]
     }
   }
   ```

   Global fragment:

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Bash",
           "hooks": [
             {
               "type": "command",
               "command": "~/.claude/hooks/block-dangerous-git.py"
             }
           ]
         }
       ]
     }
   }
   ```

The hook parses shell quoting, scans every Git invocation, and follows code passed to common shells (`bash -c`, `bash -lc`) and `eval`. It is a guardrail, not a sandbox: a determined caller can still hide Git behind runtime indirection. Do not widen rules or scope beyond what the user approved.

## Failure and recovery
Failure classes:

- Payload mismatch: any of the sixteen cases exits other than expected. Do not register; report the payload with expected versus actual exit and classify blocked.
- Script not runnable: missing `python3`, failed copy, or failed `chmod +x`. Stop before verification; make no settings change.
- Settings unreadable or invalid JSON: stop without writing, report the parse failure, and never overwrite the file or discard existing hooks.

Partial-result rule: a copied but unregistered script is inert; either complete registration only after all sixteen cases pass or delete the copy.

Rollback: delete the installed hook copy and remove the registered `hooks.PreToolUse` entry from the chosen settings file.

Blocked result: report `BLOCKED: git-guardrails <exact reason>` with no settings change made. Never swallow an error; never claim done while any check failed.

## Output
An executable hook at the chosen path, then one merged `hooks.PreToolUse` entry, then the sixteen-line verification transcript, then terminal classification `installed (project)`, `installed (global)`, or `blocked: <reason>`.
