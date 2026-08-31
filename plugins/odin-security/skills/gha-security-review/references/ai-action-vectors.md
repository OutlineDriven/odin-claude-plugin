# AI action injection vectors

AI action identification, security context capture, and attack vectors for
GitHub Actions workflows that use AI coding agents. Load this reference when
the workflow contains AI action steps.

## AI action references

| Action reference (prefix before `@`) | Action type |
|---|---|
| `anthropics/claude-code-action` | Claude Code Action |
| `google-github-actions/run-gemini-cli` | Gemini CLI |
| `google-gemini/gemini-cli-action` | Gemini CLI (legacy) |
| `openai/codex-action` | OpenAI Codex |
| `actions/ai-inference` | GitHub AI Inference |

Match the `uses:` value as a prefix before `@`; ignore the version ref after
`@`. Distinguish step-level `uses:` (inside a `steps:` array item) from
job-level `uses:` (at the same indentation as `runs-on:`, indicating a
reusable workflow call).

## Step-level input fields by action type

- Claude Code Action: `prompt`, `claude_args` (may contain `--allowedTools`,
  `--disallowedTools`), `allowed_non_write_users`, `allowed_bots`, `settings`,
  `trigger_phrase`.
- Gemini CLI: `prompt`, `settings` (JSON string, may contain sandbox/tool
  settings), `gemini_model`, `extensions`.
- OpenAI Codex: `prompt`, `prompt-file`, `sandbox` (`workspace-write`,
  `read-only`, `danger-full-access`), `safety-strategy` (`drop-sudo`,
  `unprivileged-user`, `read-only`, `unsafe`), `allow-users`, `allow-bots`,
  `codex-args`.
- GitHub AI Inference: `prompt`, `model`, `token` (check scope).

## Attack vectors

| Vector | Name | Detection heuristic |
|---|---|---|
| A | Env var intermediary | An `env:` block assigns `${{ github.event.* }}` to a variable; the AI action's `prompt` field references that env var name. No visible `${{ }}` in the prompt itself. |
| B | Direct expression injection | `${{ github.event.* }}` appears directly inside the `prompt` or system-prompt field. |
| C | CLI data fetch | Prompt text contains `gh issue view`, `gh pr view`, or `gh api` commands that fetch attacker-controlled content at runtime. |
| D | PR target plus checkout | `pull_request_target` trigger combined with a checkout step whose `ref:` points to PR head, plus an AI action step in the same workflow. |
| E | Error log injection | CI logs, build output, or `workflow_dispatch` inputs are passed into the AI prompt field. |
| F | Subshell expansion | Tool restriction or allowlist includes commands supporting `$()` expansion (e.g. `echo`, `cat`, `printf`), enabling data exfiltration. |
| G | Eval of AI output | A `run:` step uses `eval`, `exec`, or `$()` consuming `steps.*.outputs.*` from an AI action step. |
| H | Dangerous sandbox configs | `danger-full-access`, `Bash(*)`, `--yolo`, `safety-strategy: unsafe`, or equivalent settings that disable sandbox protections. |
| I | Wildcard allowlists | `allowed_non_write_users: "*"`, `allow-users: "*"`, or equivalent wildcard user/bot allowlists. |

Vectors H and I are configuration weaknesses that amplify co-occurring
injection vectors (A through G). They are not standalone injection paths.
Vector H or I without any co-occurring injection vector is Info or Low.

## Audit rationalizations to reject

Each shortcut causes missed findings:

1. "It only runs on PRs from maintainers" ignores `pull_request_target`,
   `issue_comment`, and other triggers that expose actions to external input
   without write access.
2. "We use allowed_tools to restrict what it can do" misses that restricted
   tools like `echo` can exfiltrate data via subshell expansion (`echo $(env)`).
   Limited tools do not equal safe tools.
3. "There is no ${{ }} in the prompt, so it is safe" misses the env var
   intermediary pattern that flows data through `env:` blocks with zero
   visible expressions in the prompt field.
4. "The sandbox prevents any real damage" misses misconfigurations
   (`danger-full-access`, `Bash(*)`, `--yolo`) that disable protections; even
   correct sandboxes leak secrets if the agent can read env vars or mounted
   files.

## Remediation by action type

- Claude Code Action: avoid `allowed_non_write_users: "*"`, restrict
  `allowedTools`.
- Gemini CLI: scrutinize `settings` JSON for sandbox and tool exposure.
- OpenAI Codex: never use `sandbox: danger-full-access` or
  `safety-strategy: unsafe`, avoid `allow-users: "*"`.
- GitHub AI Inference: scope `token` minimally.
