---
name: explain-concept
description: 'Use when a concept needs making clear rather than practising: explain simply, why does this exist, draw it, or simplify for a beginner. Not for scaffolded practice: use drill.'
---

# Explain concept

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A concept needs making clear not practising; explain simply, why does this exist, draw it, what is the difference, or simplify for a beginner (ELI5). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Reading files, one web citation search for the origin angle, and a transient diagram render that leaves no artifact are the only outward operations. |
| Side effect | Chat output only: a one-screen explanation for the chosen angle, one authored diagram for the picture angle, one citation search for the origin angle. Nothing is written to any file or repository. |
| Done | A single-angle explanation is presented in chat, grounded in sources or with unanchored claims marked, and the user is prompted to restate or verify where the angle requires it. |

## Inputs

The concept to explain must be supplied. An explicit angle argument (`intuition`, `motivation`, `origin`, `picture`, `contrast`, or `simplify`) is optional; the request wording selects the angle when the argument is absent. The grounding source is `CORPUS.md` when it exists; otherwise, use the source named in answer to the one-time grounding question in the procedure.

## Procedure

1. Pick the one angle for this run. An explicit argument overrides the table; no match means intuition.

   | The learner asks | Angle |
   |---|---|
   | "what is really going on", "I don't get it", "explain it simply" | intuition |
   | "why does this exist", "what problem does it solve", "why not just X" | motivation |
   | "where did this come from", "who came up with it", "what did it replace" | origin |
   | "draw it", "what does it look like" | picture |
   | "what is the difference", "when do I use X instead of Y" | contrast |
   | "ELI5", "explain like I am five", "simplify this", "plain language" | simplify |

   Done when: one angle is picked and stated.

2. Ground every claim about the concept. When `CORPUS.md` exists, cite its anchor for each claim; when a claim is not in the corpus, say so in the sentence that makes it. With no `CORPUS.md`, ask once which source to ground in, then proceed and mark unanchored claims the same way in the sentence that makes them. Done when: every claim is grounded or marked unanchored in its own sentence.

3. For the intuition angle, ask the learner to explain a step before revealing the reason. The subject of the ask is the next step in the explanation, not the concept as a whole: pose "why do you think the next step is done this way?" and wait for the learner's answer before continuing. Done when: the learner is asked to explain the next step before the reason is revealed.

4. Run exactly the chosen angle:
   - intuition: one analogy drawn from something the learner already owns, the smallest example showing the behaviour, and the one sentence that survives when they forget the rest. One screen.
   - motivation: what people did before this existed, where that broke, what this buys, what it costs. Leave history to the origin angle. One screen.
   - origin: who, when, what it displaced, one citation the learner can go read. Follow `references/ORIGIN-SEARCH.md` for the search query, candidate table, and acceptance rules. Nothing is written until the user accepts a candidate. Fifteen lines.
   - picture: one diagram: nomnoml for structure and flow, D2 for architecture, house palette. Render it, require the render to exit zero, and place the SVG in the reply with alt text and a caption. A concept with no structure, flow, or architecture worth drawing gets one line saying so instead.
   - contrast: a table whose rows are the properties where the items differ, plus one line per item saying when to reach for it. Every row separates rather than shares and at least one row is a difference with a consequence the learner can act on.
   - simplify: one gist sentence stating what the concept is, using only words a beginner would know. One analogy connecting the concept to an everyday object or experience. Lead with the next action the reader should take, then the gist, then the analogy. Strip hedging, motivational framing, list ceremony, and filler connectives; keep only sentences that carry meaning. One screen.

   Done when: the chosen angle's output is produced in the format above.

5. For intuition, ask the learner to restate the concept in their own words to verify understanding. Done when: the restatement is received and confirmed or corrected, or the angle does not require restatement.

6. One angle per run. Another angle is another run. Done when: exactly one angle is run and the run stops.

## Failure and recovery

- No restatement (intuition): re-analogize once from a different thing the learner owns. If no restatement exists after that, end the run with the done condition explicitly unmet; never claim it met.
- Render exits non-zero (picture): fix the diagram source and re-render once. If it still exits non-zero, end the angle stating the render failed; never embed a diagram whose render did not succeed.
- No usable citation (origin): state the absence on the page; that satisfies the origin done condition. On learner decline of all candidates, give the origin from model knowledge explicitly marked unverified.
- No grounding source and no answer to the grounding question: proceed, with every unanchored claim marked ungrounded in its own sentence.
- Concept too technical to simplify without distortion (simplify): simplify the nearest accessible layer, state plainly what was omitted, and do not fabricate detail.
- Partial result: deliver what the completed steps produced, name the angle, and list exactly which done conditions are unmet. The run is read-only, so there is nothing to roll back; a blocked run reports the angle, the failed step, and the unmet condition.

## Output

The explanation in the chat reply: one screen per angle, fifteen lines for origin, the rendered SVG with alt text and caption for picture, the contrast table with its per-item reach-for lines, the next-action-gist-analogy for simplify, closing with the terminal classification of the chosen angle's done condition met or exactly which condition remains unmet.
