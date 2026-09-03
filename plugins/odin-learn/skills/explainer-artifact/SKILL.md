---
name: explainer-artifact
description: 'Use when asked to create a durable local explainer document for a concept, diff reference, idea, or work recap. Classifies the input, gathers grounding material, offers a quiz, drafts and structurally verifies the artifact in a scratch directory, and presents it. Not for one-screen explanations — use explain-concept.'
---

# Explainer artifact

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for an explainer document for a concept, diff reference, idea, or work recap window, or invokes the skill bare. |
| Authority | Reversible local: write only to an isolated scratch run directory under `/tmp/odin-$(id -u)/explainer-artifact/`; rollback is deleting the run directory. No publishing, remote relocation, credential, or VCS mutation. |
| Side effect | Creates and structurally verifies a durable local explainer artifact under the scratch run directory, presents it to the user, and stops before publishing or remotely relocating it; a human performs any publication or remote relocation. |
| Done | A structurally verified explainer artifact exists in the scratch directory and is presented to the user; any publication or remote relocation remains an unexecuted human handoff. A run that correctly ends without an artifact — an operational question answered in chat, an empty recap window, a bare invocation the user did not answer — is equally done. |

## Inputs

- A concept, a diff ref, an idea, or a work-recap window, supplied in the invocation or present in the current prompt. Optional: an audience other than the user and an output format (`md` instead of the default HTML).
- Bare invocation (no input): the skill asks one blocking question rather than producing a default artifact. If the user does not answer, the run ends as done with no artifact.

## Procedure

1. Classify the request into one of four input shapes — concept, diff, idea, or work-recap window — plus its audience. Classify plain language with no token by meaning. Routing guards: a verdict question ("Should we adopt X?") is not taught; a request to document a solved problem for future work is not taught. Explain an idea input as given: its implications and trade-offs. Never expand it into options or a requirements dialogue. Apply the operational-question gate: answer a diagnostic question ("why is this failing?") in chat rather than teaching it. Concept-vs-diff tiebreak: when a phrase names both a concept and a repo path, prefer diff when a ref is supplied and concept otherwise. Done when: the request is classified into one input shape with audience, or the run stops on an operational question answered in chat.

2. Bare invocation: ask one blocking question — "What should I explain?" — offering a shortcut option for a recap of recent work in this repo alongside free-text. Do not produce a default artifact unprompted. If the user does not answer, the run ends as done with no artifact. Done when: the blocking question is asked or the run ends on no answer.

3. Create the run directory before any artifact exists. Run this block as written rather than improvising a mkdir, because the checks refuse a scratch root not owned by the agent or one reached through a symlink:
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
Done when: the run directory is created and its path is echoed.

4. Gather grounding material based on the input type. Sufficiency criteria for each shape:
   - Concept: at least one source citation per major claim, or the claim is explicitly marked unanchored. Gather from `CORPUS.md` when it exists, or ask once which source to ground in.
   - Diff: the ref resolves to one or more commits. Empty range (the ref resolves to no commits, e.g. `main..HEAD` with uncommitted work): do not silently explain something else; say what the ref resolved to, name the nearest real candidate (the working tree, the last commit), and use it only after the user agrees. When the user cannot be asked, use it and state the substitution in the artifact's `Subject`.
   - Idea: the idea is stated in the user's words. No external sourcing is required; the artifact explains implications and trade-offs as given.
   - Recap: the window resolves to repository activity. Do not pre-scan or characterize the window in the main conversation before the artifact is composed.
   In diff mode, gather silently — nothing learned while gathering is narrated to the user until the ordering rule in step 6 is satisfied. Done when: grounding material is gathered to the sufficiency criteria for the input shape, or an ambiguous diff range is resolved with the user.

5. Check-in gate, before anything is revealed. Judge whether the material warrants a check-in (a substantial change or concept the user is likely to need to recall). Offer it with the blocking question tool, recording the user's exact choice as Just the explainer or Quiz me. Only Quiz me enables the prediction and exercise mechanics; Just the explainer skips both but still composes and presents the report. If the warrant test skips the offer, proceed without either mechanic. Do not offer it again after the user declines. In diff mode, word the offer without describing the change's content or purpose, so the offer does not pre-leak the reveal. Done when: the check-in choice is recorded or the offer is skipped.

6. Diff mode with Quiz me selected — hard ordering rule. No interpretive content — explanation, annotation, diagram, or surfaced opportunity — may be shown before the user's prediction turn ends. Show only the raw change reference (the diff or its stat summary), ask for the prediction ("What do you think this change does, and why was it made?"), and end the turn there. When no blocking tool exists, ask in chat and stop. Compose the explainer only after the prediction lands; the reveal names the gaps between the prediction and what the change actually does. Done when: the prediction is received before any interpretive content is shown.

7. Compose the explainer. Default format is a single self-contained HTML file; use Markdown only when intake resolved `output:md`. Voice is personal by default, adapted for another reader on request at unchanged depth. Write the artifact to `$RUN_DIR/explainer.html` (or `explainer.md`) before anything else happens with it. Then perform the structural and link check to establish the checked state:
   - Structural check: the file parses as valid HTML (or valid Markdown); no unresolved template placeholders remain; all internal section anchors resolve.
   - Link check: every external link in the artifact either resolves to a live URL or is marked `[unchecked]` next to the link text.
   If the structural check fails, fix the artifact and re-check once. If it still fails, report the structural error and do not present the artifact as checked. Done when: the artifact is written to `$RUN_DIR/explainer.html` (or `explainer.md`), passes the structural and link check, and is displayed to the user.

8. Exercises — only when the recorded exact choice was Quiz me. Pose exercises in chat, one at a time, using the blocking question tool where its option shape fits and free chat where the answer is narrative. Check each answer, correct it, and name the gap it exposed. Do not put exercises inside the artifact. When the choice was Just the explainer, skip this step. Done when: each exercise is posed, answered, checked, and gap-named, or skipped for Just the explainer.

9. Destination ask and close. Ask for the destination once with the blocking question tool. Never publish without human interaction or infer consent: a destination the user named up front is a choice of destination, not consent to publish. For any destination requiring publication or remote relocation, present the full warning, require explicit confirmation after the user has seen it, and stop. Hand publication or relocation to the human rather than executing it. If the consent sequence cannot be completed, do not publish; preserve the canonical artifact and report its local `$RUN_DIR/explainer.html` path. When no interaction is possible at this ask, do not hang or discard the artifact. It is already displayed and stable at its path; report the local path and end. Done when: the destination is resolved with explicit consent, or the local artifact path is reported with publication as an unexecuted human handoff.

## Failure and recovery

- Unsafe scratch root (symlink or not owned by the current user): the run-directory block exits with a named error and no artifact is written. Recovery: the user supplies or fixes the scratch root; the run is retried.
- Empty diff range or missing subject: report what the ref resolved to and the nearest candidate before explaining anything; never silently substitute. Recovery: the user agrees to the candidate or corrects the ref.
- Empty recap window: say so, offer to widen it, write no artifact, end after the user responds. This is a done run, not a failure.
- Bare invocation unanswered: stop; this is a done run, not a failure.
- Structural check fails after one retry: report the structural error, do not present the artifact as checked. The artifact file may still exist but is not presented as done.
- Non-interactive destination ask: report the local artifact path and end; do not hang, do not discard, do not publish.
- Partial-result rule: an artifact written to `$RUN_DIR` is a real partial result; a failed publish never deletes it. Rollback for any local write is deleting `$RUN_DIR`; no VCS, credential, paid, published, deployed, or remote mutation is performed, so no remote rollback is needed.
- Blocked result: when consent for a destination cannot be obtained, the terminal result is the local artifact path with publication reported as an unexecuted human handoff.

## Output

A structurally verified explainer artifact at `$RUN_DIR/explainer.html` (or `explainer.md`), displayed as an inline summary plus the file path, plus any check-in exercises run in chat when Quiz me was selected, with any publication or remote relocation reported as an unexecuted human handoff, or a done run with no artifact (operational question answered in chat, empty recap window, unanswered bare invocation).
