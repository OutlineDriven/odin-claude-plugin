# Step 2: If the user picks a CLI: verify, then invoke

1. Check the tool is in PATH (`which gemini`, `which codex`).
2. Test it works (`gemini --version` or equivalent) before passing the full prompt; a stale or broken binary may pass `which` but fail on real input.
3. Confirm the exact invocation with the user, including required flags, auth, and env vars (e.g., API keys). Implementations vary; never assume.
4. Pass ARTIFACT + CONTRACT + the adversarial prompt **only**. No session context, no CLAIM.
5. Mind shell escaping. If the artifact contains quotes, `$(...)`, or backticks, prefer stdin or a heredoc over inline `-p "…"`. When in doubt, ask the user to confirm the invocation before running it.
6. Take the output into Step 4 (RECONCILE).

Example shapes (verify flags against your installed tool; syntax differs across implementations and versions):

```bash
# Write the adversarial prompt + ARTIFACT + CONTRACT to a temp file first
# ('mktemp' gives an unpredictable path, avoiding a fixed-name temp-file race;
# the trap removes the file even if the CLI fails). The quoted heredoc and the
# stdin pipe keep shell metacharacters in the artifact inert.
prompt=$(mktemp)
trap 'rm -f "$prompt"' EXIT
cat > "$prompt" <<'EOF'
<adversarial prompt + ARTIFACT + CONTRACT here>
EOF

# Codex (read-only sandbox keeps the CLI from writing to your workspace):
codex exec --sandbox read-only -C <repo-path> - < "$prompt"

# Gemini ('--approval-mode plan' is read-only; '-p ""' triggers non-interactive
# mode and the prompt is read from stdin):
gemini --approval-mode plan -p "" < "$prompt"
```

A read-only sandbox is the load-bearing detail: a doubt artifact may itself contain instructions (intentional or accidental prompt injection) that the cross-model CLI would otherwise execute against your workspace.
