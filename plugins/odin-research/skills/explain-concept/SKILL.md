---
name: explain-concept
description: 'Use when a concept needs making clear rather than practising: explain it simply, why does this exist, draw it, or what is the difference. Delivers a one-screen explanation from one chosen angle. Not for scaffolded practice — use drill; not for ELI5 simplification — use eli5.'
---

# Explain concept

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A concept needs making clear not practising; explain simply, why does this exist, draw it, what's the difference |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. Reading files, one web citation search, and a transient diagram render that leaves no artifact are the only outward operations. |
| Side effect | Chat output only: a one-screen explanation for the chosen angle, one authored diagram for the picture angle, one citation search for the origin angle. Nothing is written to any file or repository. |
| Done | The chosen angle's done condition is met: learner restates in their own words for intuition; corpus anchors cited or absence stated |

## Inputs

The concept to explain must be supplied. An explicit angle argument (`intuition`, `motivation`, `origin`, `picture`, or `contrast`) is optional; the request wording selects the angle when the argument is absent. The grounding source is `CORPUS.md` when it exists; otherwise, use the source named in answer to the one-time grounding question in the procedure.

## Procedure

1. Pick the one angle for this run. An explicit argument overrides the table; no match means **intuition**.

   | The learner asks | Angle |
   |---|---|
   | "what is really going on", "I don't get it", "explain it simply" | intuition |
   | "why does this exist", "what problem does it solve", "why not just X" | motivation |
   | "where did this come from", "who came up with it", "what did it replace" | origin |
   | "draw it", "what does it look like" | picture |
   | "what is the difference", "when do I use X instead of Y" | contrast |

   Done when: one angle is picked and stated.

2. Ground every claim about the concept. When `CORPUS.md` exists, cite its anchor for each claim; when a claim is not in the corpus, say so in the sentence that makes it. With no `CORPUS.md`, ask once which source to ground in, then proceed and mark unanchored claims the same way in the sentence that makes them. Done when: every claim is grounded or marked unanchored in its own sentence.
3. Ask the learner to say why a step is taken before revealing the reason. Done when: the learner is asked to explain the step before the reason is revealed.
4. Run exactly the chosen angle:
   - **intuition** — one analogy drawn from something the learner already owns, the smallest example showing the behaviour, and the one sentence that survives when they forget the rest. Then stop and ask them to restate it in their own words. Done when the restatement exists and has been confirmed or corrected. One screen.
   - **motivation** — what people did before this existed, where that broke, what this buys, what it costs. Leave history to the origin angle. Done when all four are on the page and the cost is real rather than a token concession. One screen.
   - **origin** — who, when, what it displaced, one citation the learner can go read. Fifteen lines. Search and approval: state in one line what will be searched and run the search only on learner approval; search primary sources (original publication, first release notes, project history) and put one readable citation on the page with a clause on what it establishes. Done when a citation is on the page or the learner declined the search. Asked for alongside intuition, run the intuition first and say so on entry: the evidence history teaches is thin, so this is a hook rather than a prerequisite.
   - **picture** — one diagram: nomnoml for structure and flow, D2 for architecture, house palette. Render it, require the render to exit zero, and place the SVG in the reply with alt text and a caption. Done when the render exits zero and the embed carries its alt text and caption. A concept with no structure, flow, or architecture worth drawing gets one line saying so instead; a box drawn around a definition costs attention and returns nothing.
   - **contrast** — a table whose rows are the properties where the items differ, plus one line per item saying when to reach for it. Done when every row separates rather than shares and at least one row is a difference with a consequence the learner can act on.
5. One angle per run. Another angle is another run. Done when: exactly one angle is run and the run stops.

## Failure and recovery
- **No restatement (intuition):** re-analogize once from a different thing the learner owns. If no restatement exists after that, end the run with the done condition explicitly unmet; never claim it met.
- **Render exits non-zero (picture):** fix the diagram source and re-render once. If it still exits non-zero, end the angle stating the render failed; never embed a diagram whose render did not succeed.
- **No usable citation (origin):** state the absence on the page; that satisfies the origin done condition. On learner decline, give the origin from model knowledge explicitly marked unverified.
- **No grounding source and no answer to the grounding question:** proceed, with every unanchored claim marked ungrounded in its own sentence.
- **Partial result:** deliver what the completed steps produced, name the angle, and list exactly which done conditions are unmet. The run is read-only, so there is nothing to roll back; a blocked run reports the angle, the failed step, and the unmet condition.

## Output
The explanation in the chat reply: one screen per angle, fifteen lines for origin, the rendered SVG with alt text and caption for picture, the contrast table with its per-item reach-for lines, closing with the terminal classification of the chosen angle's done condition met or exactly which condition remains unmet.
