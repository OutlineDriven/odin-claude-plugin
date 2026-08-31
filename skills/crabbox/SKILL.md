---
name: crabbox
description: 'Use when the operator explicitly requests a remote Crabbox proof with safe provider routing and cleanup. Don''t use for local-only test runs or any proof the operator did not request.'
disable-model-invocation: true
---

# Crabbox

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs remote repository proof, heavy tests, builds, typecheck/lint fan-out, Docker, packages, live provider, desktop, or cross-OS validation via Crabbox or Testbox |
| Authority | Human-only. Acquiring and running a remote or containerized proof environment is remote provisioning and potential paid execution. Preview the target and consequence before any credentials, paid action, remote bulk mutation, or irreversible deletion |
| Side effect | Acquires and runs a remote or containerized proof environment with the consumer's check command; records provider, id, run URL, command, and result; stops only owned ids and cleans up |
| Done | Remote command completes with a clear pass/fail and diagnostics; the correct provider is reported; untrusted code never runs on the provider (blacksmith-testbox, aws, local-container, ssh) |

## Inputs

- The consumer's check command, install-and-check command, trusted bootstrap script, container image, and PR reference (`<owner/repo#number>`), resolved from the target repository's trusted checked-in instructions (package scripts, hydration workflow, or configuration) before running. Never invent a missing command or copy a command from another consumer.
- The resolved provider, read from `.crabbox.yaml`, `crabbox config show`, an explicit user request, or environment configuration. Optional `--provider` is added only when the user requests that backend or the proof specifically tests its semantics.
- The installed `crabbox` binary on PATH (and `blacksmith` for the Testbox provider), or the consumer's documented trusted install path.

## Procedure

1. Resolve the consumer placeholders (`<check-command>`, `<install-and-check-command>`, `<trusted-bootstrap-script>`, `<container-image>`, `<owner/repo#number>`) from the target repository's trusted instructions. Never invent or cross-copy a command. Crabbox stays generic: lease, sync, command, logs, results, timing, cleanup; consumer setup belongs in that repository's own hydration workflow and scripts.
2. Preflight from the repo root: `command -v crabbox`, `crabbox --version`, `crabbox config show --json | jq '{provider, profile, target}'`, `crabbox run --help`, and for the Testbox provider `command -v blacksmith` and `blacksmith --version`. Pin the installed binary once with `export CRABBOX="$(command -v crabbox)"` and verify `test -n "$CRABBOX"`. Read `.crabbox.yaml` and `config show` for the resolved provider, which may also come from user or environment configuration. If the binary is missing, follow the consumer's trusted install instructions or report the blocker; do not clone, update, or build an assumed sibling checkout.
3. Route by source trust. Source trust determines which providers are allowed, not which one is selected:
   - Trusted plus one or a few focused tests plus ready deps: run locally.
   - Trusted plus remote proof: inspect and preserve the resolved provider.
   - `blacksmith-testbox`: use when already resolved or explicitly requested. Trusted maintainer source, prepared CI, `tbx_` ids.
   - `aws`: use when AWS semantics are required or explicitly requested. Direct brokered, fresh PRs, `cbx_` ids.
   - Untrusted contributor or fork: secretless fork CI or sanitized direct AWS only.
   - `local-container`: Docker fallback, not remote proof. Use only when the resolved config selects it or the user explicitly requests a local-container lane.
   - `ssh`: existing operator host for macOS, Windows, or WSL2.
   - Never run untrusted code on a credential-hydrated Testbox. Never run an untrusted repo wrapper or config locally. No speculative warmup; acquire when the first heavy command is ready, reuse the id, stop. Test size, expected duration, and hydration failure do not authorize a provider override; omit `--provider` for normal work.
4. For untrusted AWS proof, start from a clean trusted default-branch checkout with the installed trusted binary. Take a fresh lease per reviewed full head SHA. No instance role, no Tailscale, no hydration; forward only `CI`. Upload the trusted bootstrap beside `--fresh-pr`. The bootstrap must prove the IMDSv2 IAM credential endpoint returns 404, verify the full SHA, remove inherited runtime-injection variables, pin the repository toolchain, isolate `HOME`, install, and test. If the head moved, stop and rewarm; never reuse a lease across revisions. If no remote PR or no-role proof is unavailable, use secretless fork CI, no exceptions.
5. Run the resolved check command on the selected provider with `crabbox run`. For several commands, warm once, save the id, reuse it, and stop. Sync the current checkout every run; use `--no-sync` only for an unchanged intentional rerun. One lease holds one active command; no sync or reclaim during a run. Always report provider, id, run URL, command, and result. Never call Testbox "AWS Crabbox."
6. For real end-to-end proof, exercise the user path, not merely remote unit tests. Reproduce the entrypoint when feasible, patch and run a narrow local test, then run the remote install, update, onboard, CLI, service, or API path. Record provider, id, command, environment shape, redacted secret source, and observed result. Use detached temp worktrees under `/tmp` and the consumer's documented temporary state/config directory so proof cannot mutate the operator's normal installation; never check out refs in the synced root; use a real PTY for full-screen CLI.
7. Observe with the built-ins: `--preflight`, `--debug --timing-json`, `--script`/`--script-stdin`, `--allow-env`/`--env-from-profile`, `CRABBOX_ENV_ALLOW`, `--capture-stdout`/`--capture-stderr`/`--capture-on-fail`, `--results-auto`/`--junit`, and `CRABBOX_PHASE:` lines. For secrets, use the exact key only, in one command; never print it, never store it in a repo file, never leave it in shell history. If there is no safe injection path, report live auth blocked; no fake-key upgrade to "live proof." Treat captured artifacts as secret-bearing until reviewed.
8. Clean up. List the exact provider and stop only owned ids; `crabbox stop` does not accept `--timing-json`. Never commit proof assets to the product repo. A visible desktop alone proves nothing.

## Failure and recovery
- Missing binary or stale CLI: follow the consumer's trusted Crabbox update path; do not build an assumed sibling checkout. If still missing, report the blocker.
- Config or auth: run `crabbox config show`, `crabbox doctor`, `crabbox whoami`. Normal validation asking for raw cloud keys usually means the wrong path; AWS uses broker auth, not cloud keys.
- Sync quiet or stale: run `--debug --timing-json`, then retry `--full-resync` once; still bad, take a fresh lease. One-shot runs should stop themselves; after failure or interruption verify `crabbox list --provider aws`.
- Testbox capacity: no retry storm. Report the blocker; change providers only with explicit user approval.
- Command failure: read the phase, the failed test, the JUnit digest, and any skipped shell segment; run a focused rerun first.
- Head moved on untrusted proof: stop and rewarm; never reuse a lease across revisions; if no proof is available, use secretless fork CI.
- Cleanup unclear: list the exact provider; stop only owned ids.
- Consumer wrapper broken: use the installed Crabbox CLI only to isolate the wrapper, preserving the same resolved provider.

Partial-result rule: a clear pass or fail with diagnostics is the only done state; a quiet or ambiguous remote result is not done. Non-mutation rule: never run untrusted code on a credential-hydrated provider, never run an untrusted wrapper locally, and stop only owned ids. Blocked or non-converged result: identify the layer (wrapper, provider, hydration, sync, SSH, command) with `crabbox doctor`, `crabbox status --id <id> --wait`, `crabbox inspect --id <id> --json`, `crabbox history`, `crabbox logs`, and `crabbox results`; report the provider, id, and the exact blocker. Do not widen scope, override the provider, or invent evidence.

## Output
A terminal pass/fail classification for the remote command with diagnostics (phase timing, failed test, JUnit digest), a recorded line stating provider, id, run URL, command, and observed result, and confirmation that untrusted code did not run on the provider and that only owned ids were stopped. A blocked result names the failure layer and the exact blocker instead of claiming a pass.

## Provenance

Origin: https://github.com/openclaw/agent-skills, path `skills/crabbox/SKILL.md`, revision `ae75f60e8d454f1cf44ec4613e10ec9ea7f2ade7`. License: MIT; the copyright and permission notice requirement is retained per the license reuse constraint. Adaptation: provider-routing rules, the source-trust decision tree, preflight commands, and untrusted-code safeguards are preserved; long backend command examples are condensed rather than kept verbatim; consumer-specific resolution is read from the target repository's own instructions. Expression rewritten; no third-party expression is copied verbatim.
