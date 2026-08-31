---
name: git-guardrails
description: 'Use when a repository needs a tool-time safety net against force-push, hard reset, forced clean, forced branch deletion, or working-tree discard. Installing it copies a quoting-aware block script and registers a PreToolUse hook that exits 2 on those commands while plain git push stays allowed. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Set up Git guardrails

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository needs a tool-time safety net against force-push/reset/clean/branch-delete/discard. |
| Authority | Reversible-local: write only the hook copy under the chosen `.claude/hooks/` or `~/.claude/hooks/` directory and one merged `hooks.PreToolUse` entry in the matching `.claude/settings.json` or `~/.claude/settings.json`. No VCS, remote, credential, or other file change. Rollback: delete the copied script and remove the registered entry. |
| Side effect | Copies `block-dangerous-git.py` and registers it in the chosen settings file `PreToolUse`; net effect removes destructive capability. |
| Done | All 11 verification payloads exit as expected, the hook is registered, and plain `git push` still exits 0. |

## Inputs

- Scope (required, chosen by the user): project (`.claude/settings.json` plus `.claude/hooks/`) or global (`~/.claude/settings.json` plus `~/.claude/hooks/`).
- Hook source: `scripts/block-dangerous-git.py` shipped beside this SKILL.md.
- Optional: rule additions or removals, decided before installation.

## Procedure

1. Ask the user to choose project or global scope. Mutate nothing before the choice.
2. Copy `scripts/block-dangerous-git.py` to the chosen location — project: `.claude/hooks/block-dangerous-git.py`; global: `~/.claude/hooks/block-dangerous-git.py` — and run `chmod +x` on the copy. Leave the skill's source copy untouched.
3. Show the default blocked operations — forced pushes and forced refspecs; `reset --hard`; forced `clean`; forced branch deletion; `checkout .` and `restore .`; `stash drop` and `stash clear`; `reflog expire`; `gc --prune=now` — and ask whether to add or remove a rule. On approval, edit only the installed copy.
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

   Must exit 0:

   9. `{"tool_input":{"command":"git push origin main"}}`
   10. `{"tool_input":{"command":"git commit -m \"oops; git reset --hard\""}}`
   11. `{"tool_input":{"command":"git --git-dir=.git status"}}`

   All eleven cases must match before registration. A blocked command prints this to stderr and exits 2:

   ```text
   BLOCKED: '<command>' matches dangerous pattern '<pattern>'. The user has prevented you from doing this.
   ```

5. After all eleven cases pass, merge the entry into the existing `hooks.PreToolUse` array of the chosen settings file. Never overwrite the settings file or discard existing hooks.

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

- Payload mismatch: any of the eleven cases exits other than expected. Do not register; report the payload with expected versus actual exit and classify blocked.
- Script not runnable: missing `python3`, failed copy, or failed `chmod +x`. Stop before verification; make no settings change.
- Settings unreadable or invalid JSON: stop without writing, report the parse failure, and never overwrite the file or discard existing hooks.

Partial-result rule: a copied but unregistered script is inert; either complete registration only after all eleven cases pass or delete the copy.

Rollback: delete the installed hook copy and remove the registered `hooks.PreToolUse` entry from the chosen settings file.

Blocked result: report `BLOCKED: git-guardrails <exact reason>` with no settings change made. Never swallow an error; never claim done while any check failed.

## Output
- Executable hook at the chosen hooks path.
- One merged `hooks.PreToolUse` entry in the chosen settings file.
- The verification transcript: eleven `exit=<n>` lines, one per payload.
- Terminal classification: `installed (project)`, `installed (global)`, or `blocked: <reason>`.

## Provenance

Origin: `odin-current`, source path `skills/setup-git-guardrails/SKILL.md`, candidate `current:current-c:current:setup-git-guardrails`. No pinned upstream revision. License: project-owned; no third-party license applies. Adapted from the odin-current skill body into this section order; `scripts/block-dangerous-git.py` is retained verbatim from the same candidate.
