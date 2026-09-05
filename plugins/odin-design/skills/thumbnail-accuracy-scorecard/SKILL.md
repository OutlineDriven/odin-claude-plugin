---
name: thumbnail-accuracy-scorecard
description: 'Use when thumbnail concepts need real-size, accuracy-first scoring without misleading claims. Not for generating thumbnails or declaring winners that fail the accuracy rubric.'
---

# Thumbnail accuracy scorecard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Thumbnail concepts need real-size, accuracy-first scoring without misleading claims. |
| Authority | Human-gated: asks for asset approval before rendering approved assets; otherwise reversible local: writes only named local artifacts; rollback is undo. No remote mutation. |
| Side effect | Accuracy-gated thumbnail scorecard with per-dimension scores and an immutable receipt. |
| Done | One accurate winner and two accurate runners-up clear the fixed rubric threshold. |
| Stop | No accurate winner; approval blocked; budget exhausted. Bound: platform, audience, rubric, assets, round cap. |

## Inputs

- Bound (required): platform (YouTube, Twitter/X, LinkedIn, etc.), audience, rubric definition, assets to score, and round cap.
- Fixed rubric definition (required): the accuracy dimensions, their weights, the per-dimension scale, the aggregate threshold, and the tie-breaking rule. Frozen before any scoring.
- Platform dimensions (required): the exact pixel dimensions at which thumbnails are rendered for the target platform (for example, 1280x720 for YouTube). Sourced from the platform's published thumbnail specification, not guessed.

## Fixed rubric

| Dimension | Weight | Criterion (0 to 10 scale) |
|---|---|---|
| Claim accuracy | 0.30 | The thumbnail text and imagery accurately represent the content. No exaggerated claims, misleading titles, or false implications. |
| Visual clarity | 0.25 | The subject is recognizable at the target platform's display size. Text is legible at thumbnail dimensions, not just at full resolution. |
| Composition fidelity | 0.20 | The layout matches the platform's safe-zone constraints. No critical elements are cropped or obscured by platform UI overlays. |
| Color and contrast | 0.15 | The color palette and contrast are appropriate for the platform and do not mislead about the content tone. |
| Brand consistency | 0.10 | The thumbnail aligns with the creator or product brand identity. |

The aggregate score is the weighted sum. The threshold is 7.0. A thumbnail that scores below 5.0 on claim accuracy cannot pass regardless of aggregate, because misleading claims are disqualifying.

Tie-breaking: if two thumbnails tie on aggregate, the higher claim-accuracy score wins. If still tied, the higher visual-clarity score wins. If still tied, both are declared runners-up and no winner is selected.

## Procedure

1. Bind the declared bound and freeze it. Record the platform, audience, rubric, assets, and round cap. Done when: the bound is recorded and no mutation has begun.
2. Render each asset at the real platform dimensions. Source the dimensions from the platform's published specification. Do not score at non-standard sizes. Obtain asset approval before rendering. Done when: every asset is rendered at the target platform dimensions.
3. Score each render against the fixed rubric. Score each dimension independently on the 0 to 10 scale. Record the per-dimension score, the aggregate, and whether the aggregate clears the threshold. Apply the disqualification rule: a claim-accuracy score below 5.0 disqualifies regardless of aggregate. Done when: every render has a complete scorecard.
4. Rank the thumbnails by aggregate score. Apply tie-breaking if needed. Select the winner (highest aggregate, threshold cleared, not disqualified) and two runners-up. Done when: the winner and runners-up are selected, or no accurate winner exists.
5. Stop at outcome.success (one winner and two runners-up clear the threshold), outcome.non_success (no accurate winner), or outcome.bound (round cap or budget reached). Done when: a terminal class is assigned.
6. Persist per profiles.persistence.P1 (durable_location `.outline/loops/thumbnail-accuracy-scorecard/<run_id>/` when durable). Write an immutable K11 receipt with every K11 field. Done when: the receipt is written with the terminal class, bound, and scorecard evidence.

## Failure and recovery

- No accurate winner: no thumbnail clears the threshold or all remaining thumbnails are disqualified on claim accuracy. Terminal `no_accurate_winner`; report the best scores and the disqualification reasons.
- Approval blocked: asset approval is denied or not collected. Terminal `approval_blocked`; report what approval is missing.
- Budget exhausted: the round cap or budget is reached before a winner is selected. Terminal `budget_exhausted`; report the best scores obtained. Budget exhaustion is never success unless it is the predeclared success predicate.
- Platform dimensions unavailable: the platform's published thumbnail specification cannot be found. Stop; do not guess dimensions. Report the missing specification.

## Output

A `receipt.json` with the terminal class, bound, per-thumbnail scorecard evidence (per-dimension scores, aggregate, threshold, disqualification status, rank), the winner and runners-up or the non-success terminal, persisted at `.outline/loops/thumbnail-accuracy-scorecard/<run_id>/`.
