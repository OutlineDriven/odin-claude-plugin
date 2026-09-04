---
name: buzzword-hijack
description: 'Use when a user wants to choose and execute a bounded positioning move that rides a jargon wave. Not for describing the jargon weather of a domain: use buzzword-analysis.'
---

# Buzzword hijack

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to choose and execute a bounded positioning move that rides a jargon wave without confusing trend with truth. |
| Authority | Reversible local: writes only the named local positioning artifact (copy, landing, or messaging); rollback is undo (delete or revert the written artifact). No remote mutation. |
| Side effect | A bounded positioning move/artifact is written to a local file. No publish, deploy, or remote mutation. |
| Done | A bounded positioning move is executed and the artifact is written without confusing trend with truth. |

## Inputs

- The product, project, or message to position. Required.
- The target surface for the positioning move: copy, landing page, or messaging. Required; state it before writing.
- The jargon wave to ride: the trending term or terms the user wants to use. Required; name the specific term(s).
- The output file path. Required.

## Procedure

1. Name the jargon wave: identify the specific trending term(s) the user wants to ride and the space they belong to. **Done when:** the jargon wave and its space are named.
2. Separate trend from truth: list every factual claim about the product. Mark each claim that holds independently of the jargon. Any claim that only holds because of the jargon is a truth-substitution and must be removed or re-grounded. **Done when:** every factual claim is marked as holding independently or flagged as truth-substitution.
3. Choose the bounded positioning move: pick which surface (copy, landing, or messaging) the jargon enters and where it stops. State the boundary explicitly: the jargon appears in positioning language, not in factual assertions. **Done when:** the surface and boundary are chosen and stated.
4. Draft the positioning artifact: write the chosen surface so the jargon appears in the framing, headline, or hook while every factual claim stands on its own without the jargon. **Done when:** the artifact is drafted with jargon in framing and facts standing independently.
5. Verify the trend-truth separation: re-read the artifact and confirm that no factual claim depends on the jargon. If a claim would be false or empty without the jargon, rewrite or remove it. **Done when:** no factual claim depends on the jargon.
6. Write the artifact to the named local file. Report the file path, the chosen surface, the jargon term(s) used, and the boundary where the jargon stops. **Done when:** the artifact is written and the report is delivered.

## Failure and recovery
- Truth-substitution detected: a factual claim depends on the jargon. Rewrite the claim to stand without the jargon, or remove it. Do not ship an artifact where trend stands in for truth.
- No factual claims supplied and none can be grounded: stop and report the blocker rather than inventing claims.
- Jargon wave not named: stop and ask the user for the specific term(s). Do not guess a wave.
- Partial result: if the artifact is drafted but the trend-truth check fails on one or more claims, keep the passing claims, report the failing ones, and do not write the final artifact until every claim is re-grounded or removed.
- Rollback: delete or revert the written artifact file. No external publication occurs, so no external rollback is needed.

## Output
A written local positioning artifact (copy, landing, or messaging) that rides the named jargon wave, plus a report naming the file path, the chosen surface, the jargon term(s), the boundary where the jargon stops, and the list of factual claims confirmed to stand without the jargon.
