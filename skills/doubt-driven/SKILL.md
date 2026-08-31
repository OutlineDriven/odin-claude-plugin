---
name: doubt-driven
description: 'Use when a non-trivial decision sits under uncertainty and correctness matters more than speed; returns fresh-context adversarial review findings with classified reconciliation and a met stop condition. Don''t use for tasks that require source or remote-system changes.'
---

# Doubt-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Non-trivial decision under uncertainty; correctness matters more than speed; a claim not checkable by the type system or compiler; before committing non-trivial code |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. An external CLI (Gemini/Codex) may be invoked only with explicit per-call user authorization |
| Side effect | Chat output: fresh-context adversarial review findings and reconciliation. External CLI invocation requires explicit per-call user authorization |
| Done | Every non-trivial decision named as a CLAIM and fresh-context reviewed; findings classified; a stop condition met; cross-model offered (interactive) or skip announced (non-interactive) |

## Inputs

- **Artifact** (required): the unit under scrutiny: a code diff, function, decision proposal, or assertion plus its supporting evidence.
- **Contract** (required): the constraint the artifact must satisfy.
- **External reviewer CLI** (optional): Gemini or Codex, named by the user; invoked only after explicit per-call authorization.

## Procedure

1. **CLAIM.** Name the non-trivial decision compactly as `CLAIM: "<statement>"` plus `WHY THIS MATTERS: <consequence>`. A decision that cannot be stated that compactly is a vibe, not a decision; surface it before scrutinizing.
2. **EXTRACT.** Isolate the smallest reviewable unit: the artifact and the contract, stripped of the reviewer's reasoning. Handing over conclusions yields back validation of those conclusions. A 500-line PR decomposes first; the unit must fit one read.
3. **DOUBT.** Spawn a fresh-context subagent with isolated context using this adversarial prompt verbatim so it overrides any default balanced response shape:

   ```
   Adversarial review. Find what is wrong with this artifact.
   Assume the author is overconfident. Look for:
   - Unstated assumptions
   - Edge cases not handled
   - Hidden coupling or shared state
   - Ways the contract could be violated
   - Existing conventions this might break
   - Failure modes under unexpected input

   Do NOT validate. Do NOT summarize. Find issues, or state
   explicitly that none could be found after thorough examination.

   ARTIFACT: <paste artifact>
   CONTRACT: <paste contract>
   ```

   Pass ARTIFACT + CONTRACT only. Do NOT pass the CLAIM: handing the reviewer a conclusion biases it toward agreement. If a reviewer's default shape cannot be overridden to issues-only, fall back to a generic subagent with the adversarial prompt.
4. **Cross-model.** In interactive sessions, after the single-model review and before reconcile, always offer the user a cross-model second opinion (Gemini CLI, Codex CLI, manual external review, or skip); never silently skip, even on low-stakes artifacts. If the user picks a CLI: verify PATH/version and the working binary, write the full prompt to a file and pipe it through stdin (never interpolate the artifact into a shell-quoted argument; embedded backticks and `$(...)` would truncate or execute), confirm the exact command with the user, and run only after explicit per-call authorization. If the CLI is unavailable or fails, surface the failure and offer manual retry, a different tool, or skip. If the user skips, acknowledge the skip in the output. In non-interactive contexts, skip cross-model and announce the skip in the output; never invoke an external CLI without explicit user authorization.
5. **RECONCILE.** Re-read the artifact text against each finding before classifying; rubber-stamping the reviewer is the same failure as ignoring it. Classify each finding in this precedence order, first match wins: (a) **contract misread**: the CONTRACT was unclear or incomplete, fix it and re-classify next cycle; (b) **valid + actionable**: real issue, change the artifact and re-loop; (c) **valid trade-off**: real but fixing costs more than accepting, document the trade-off; (d) **noise**: correct under context the reviewer lacked, note it and consider adding that context to the contract.
6. **STOP.** Stop when the next iteration returns only trivial or already-considered findings, or 3 cycles are completed (escalate to the user, do not grind a fourth alone), or the user explicitly says to ship. If 3 cycles still surface substantive issues, the artifact may not be ready; surface this to the user. Three unresolved cycles is information about the artifact, not a reason to keep looping. If 3 cycles is obviously insufficient because the artifact is large, the artifact is too big: return to Step 2 and decompose; do not lift the bound.

**Nested-subagent fallback.** This skill runs in the main session, where Step 3 can spawn a fresh-context reviewer. Do not run it from inside a subagent, where spawning another subagent is blocked. If that happens, surface to the user that doubt-driven cannot run nested and let the main session handle it. As a last resort only, a degraded self-questioning fallback exists: rewrite ARTIFACT + CONTRACT as a fresh self-prompt with a hard mental separator from the prior reasoning and walk Steps 1–6. This is not fresh-context review, so flag the result as degraded.

**Doubt theater.** Across 2 or more cycles where the reviewer surfaced substantive findings, zero findings classified as actionable means the reviewer is validating, not doubting. Stop and escalate.

## Failure and recovery
- **CLAIM not writable:** the decision is still a vibe; return to Step 1, do not proceed to review.
- **Reviewer received the CLAIM or reasoning:** biased review; re-spawn passing ARTIFACT + CONTRACT only.
- **External CLI invoked without explicit per-call authorization:** safety violation; abort and surface to the user.
- **External CLI unavailable or fails:** surface the failure explicitly; offer manual retry, a different tool, or skip; never silently fall back to single-model.
- **Nested subagent blocks fresh-context spawn:** surface to the user; use the degraded self-questioning fallback only as a last resort and flag the result degraded.
- **Doubt theater (2+ substantive cycles, zero actionable classifications):** stop and escalate to the user.
- **3 unresolved cycles:** surface that the artifact may not be ready; do not grind a fourth alone.
- **Partial-result rule:** a stopped cycle with every finding classified is a valid partial result; unclassified or rubber-stamped findings are not.
- **Non-mutation rule:** read-only; no file, VCS, credential, paid, published, deployed, or remote mutation. Re-loop changes are recommendations in chat output, not applied edits.

## Output
A report listing each non-trivial decision named as a CLAIM, the fresh-context review findings, the classification of each finding (contract misread / valid + actionable / valid trade-off / noise), the stop condition met, and the cross-model disposition (offered and acknowledged, or skip announced). Actionable findings carry a recommended artifact change stated as a recommendation, not an applied edit.

## Provenance

Adapted from the odin-1.x current skill `skills/doubt-driven/SKILL.md` (project-owned, no third-party license). Merged source: `addyosmani/agent-skills`, revision `d2c37ef6225dd8726cdd369a8030307f48592d26`, MIT license, Copyright (c) 2025 Addy Osmani — an exact four-field contract duplicate absorbed into this survivor with no surviving alias. Clean-room adaptation; no third-party expression copied. MIT obligation: retain the copyright notice and permission text in derived distributions.
