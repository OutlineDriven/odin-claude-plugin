---
name: explainer-artifact
description: 'Use when asked to invoke /explainer-artifact with a concept, diff ref, idea, or recap window — or bare — to teach one thing well; the run ends with a durable local explainer artifact the user has seen, while any publication remains an unexecuted human handoff. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Explain it to me

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /explainer-artifact [concept, diff ref, idea, or recap window] — or bare |
| Authority | Reversible-local: write only the named local run-directory artifact; rollback is deleting the run directory. No publishing, remote relocation, credential, or VCS mutation. |
| Side effect | Creates and checks a durable local explainer artifact under a scratch run directory, presents it to the user, and stops before publishing or remotely relocating it; a human performs any publication or remote relocation. |
| Done | The checked explainer artifact exists locally and the user has seen it; any publication or remote relocation remains an unexecuted human handoff. A run that correctly ends without an artifact — an operational question answered in chat, an empty window, a bare invocation the user did not answer — is equally done. |

## Inputs

- A concept, a diff ref, an idea, or a work-recap window, supplied in the invocation or present in the current prompt. Optional: an audience other than the user and an output format (`md` instead of the default HTML).
- Bare invocation (no input): the skill asks one blocking question rather than producing a default artifact.

## Procedure

1. Classify the request into one of four input shapes — concept, diff, idea, or work-recap window — plus its audience. Classify plain language with no token by meaning. Routing guards: a verdict question ("Should we adopt X?") is not taught; a request to document a solved problem for future work is not taught; an idea input is explained as given — implications and trade-offs — never expanded into options or a requirements dialogue. Apply the operational-question gate: a diagnostic question ("why is this failing?") is answered in chat, not taught. Concept-vs-diff tiebreak: when a phrase names both a concept and a repo path, prefer diff when a ref is supplied and concept otherwise.
2. Bare invocation: ask one blocking question — "What should I explain?" — offering a shortcut option for a recap of recent work in this repo alongside free-text. Do not produce a default artifact unprompted. Stop if the user does not answer.
3. Create the run directory before any artifact exists. It holds the explainer and recap evidence; run this block as written rather than improvising a mkdir, because the checks refuse a scratch root not owned by the agent or one reached through a symlink:
```bash
SCRATCH_ROOT="/tmp/odin-$(id -u)";
[ ! -L "$SCRATCH_ROOT" ] && (umask 077; mkdir -p "$SCRATCH_ROOT") 2>/dev/null && [ ! -L "$SCRATCH_ROOT" ] && [ -O "$SCRATCH_ROOT" ] && [ -w "$SCRATCH_ROOT" ] || SCRATCH_ROOT="${TMPDIR:-/tmp}/odin-$(id -u)";
if [ -L "$SCRATCH_ROOT" ]; then echo "unsafe scratch root symlink: $SCRATCH_ROOT" >&2; exit 1; fi;
(umask 077; mkdir -p "$SCRATCH_ROOT") || exit 1;
if [ -L "$SCRATCH_ROOT" ] || [ ! -O "$SCRATCH_ROOT" ]; then echo "scratch root is not owned by the current user: $SCRATCH_ROOT" >&2; exit 1; fi;
chmod 700 "$SCRATCH_ROOT" || exit 1;
RUN_DIR="$SCRATCH_ROOT/explainer-artifact/$(date +%Y%m%d)-$(openssl rand -hex 3)";
(umask 077; mkdir -p "$RUN_DIR") || exit 1; chmod 700 "$RUN_DIR" || exit 1;
echo "$RUN_DIR";
```
4. Ground per input shape. Diff mode: gather silently — nothing learned while gathering is narrated to the user until step 6's ordering rule is satisfied. Empty range (the ref resolves to no commits, e.g. `main..HEAD` with uncommitted work): do not silently explain something else; say what the ref resolved to, name the nearest real candidate (the working tree, the last commit), and use it only after the user agrees — or, when they cannot be asked, use it and state the substitution in the artifact's `Subject`. Apply the same rule when the named subject does not exist in this repo. Recap mode: do not pre-scan, count, or characterize the window in the main conversation — an early `git --all` summary seeds a false branch or activity model. Dispatch a generic subagent at the extraction tier, seeded with the work-recap scout task and passed the resolved window, the repo root, and `$RUN_DIR`; it writes `recap-evidence.md`. When the harness exposes no subagent primitive, run the scout's evidence pass inline against the same sources and budgets and still write `recap-evidence.md`; form no view of the window until that pass is done. Empty window (no git activity, no doc changes): say so, offer to widen it, write no artifact, and end after the user responds.
5. Check-in gate, before anything is revealed. Judge whether the material warrants a check-in (a substantial change or concept the user is likely to need to recall). Offer it with the blocking question tool, recording the user's exact choice as **Just the explainer** or **Quiz me** — do not collapse both into an "accepted" boolean. Only **Quiz me** enables the prediction and exercise mechanics; **Just the explainer** skips both but still composes and presents the report. If the warrant test skips the offer, proceed without either mechanic; declining is never re-litigated. In diff mode, word the offer without describing the change's content or purpose, so the offer does not pre-leak the reveal. The check-in is never headless: it exists to exercise the human, and automating the answers deletes the product.
6. Diff mode with **Quiz me** selected — hard ordering rule. No interpretive content — explanation, annotation, diagram, or surfaced opportunity — may be shown before the user's prediction turn ends. Show only the raw change reference (the diff or its stat summary), ask for the prediction ("What do you think this change does, and why was it made?"), and end the turn there. When no blocking tool exists, ask in chat and stop — never print the reveal in the same message as the prediction prompt. Compose the explainer only after the prediction lands; the reveal names the gaps between the prediction and what the change actually does.
7. Compose the explainer. Default format is a single self-contained HTML file; use Markdown only when intake resolved `output:md`. Voice is personal by default, adapted for another reader on request at unchanged depth. Write the artifact to `$RUN_DIR/explainer.html` (or `explainer.md`) before anything else happens with it, then display it (inline summary plus the file path). The artifact exists at that stable path from this moment — a declined destination ask never loses it.
8. Exercises — only when the recorded exact choice was **Quiz me**. Pose exercises in chat, one at a time, using the blocking question tool where its option shape fits and free chat where the answer is narrative. Check each answer, correct it, and name the gap it exposed. Do not put exercises inside the artifact. When the choice was **Just the explainer**, skip this step.
9. Destination ask and close. Ask for the destination once with the blocking question tool. Publishing is never headless and never inferred: a destination the user named up front is a choice of destination, not consent to publish. For any destination requiring publication or remote relocation, present the full warning, require explicit confirmation after the user has seen it, and stop — hand the publication or relocation to the human rather than executing it. If the consent sequence cannot be completed, do not publish; preserve the canonical artifact and report its local `$RUN_DIR/explainer.html` path. Non-interactive degradation: when no interaction is possible at this ask (no blocking tool and no reply), do not hang and do not discard — the artifact is already at `$RUN_DIR`; report that path and end.

## Failure and recovery
- Unsafe scratch root (symlink or not owner-owned): the run-directory block exits with a named error and no artifact is written. Recovery: the user supplies or fixes the scratch root; the run is retried.
- Empty diff range or missing subject: report what the ref resolved to and the nearest candidate before explaining anything; never silently substitute. Recovery: the user agrees to the candidate or corrects the ref.
- Empty recap window: say so, offer to widen it, write no artifact, end after the user responds. This is a done run, not a failure.
- Bare invocation unanswered: stop; this is a done run, not a failure.
- Non-interactive destination ask: report the local artifact path and end; do not hang, do not discard, do not publish.
- Partial-result rule: an artifact written to `$RUN_DIR` is a real partial result; a failed publish never deletes it. Rollback for any local write is deleting `$RUN_DIR`; no VCS, credential, paid, published, deployed, or remote mutation is performed, so no remote rollback is needed.
- Blocked/non-converged result: when consent for a destination cannot be obtained, the terminal result is the local artifact path with publication reported as an unexecuted human handoff.

## Output
A durable explainer artifact at `$RUN_DIR/explainer.html` (or `explainer.md`), displayed to the user as an inline summary plus the file path, plus any check-in exercises run in chat when **Quiz me** was selected. Any publication or remote relocation is reported as an unexecuted human handoff. A run may instead end done with no artifact (operational question answered in chat, empty window, unanswered bare invocation).

## Provenance

Origin: https://github.com/EveryInc/compound-engineering-plugin, revision a1f601f17137f648be439965f8fdd9123303de5d, file skills/ce-explain/SKILL.md. License: MIT (Copyright (c) 2025 Every). Mechanisms extracted and rewritten in ODIN style, not copied verbatim; attribution is preserved in this ledger. Adaptation: remapped to odin-research as on-demand explanation work; publication converted from an automated destination flow to an explicit stop-and-handoff boundary so artifact creation remains the model-invokable mechanism.
