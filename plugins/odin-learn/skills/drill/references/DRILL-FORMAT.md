# Drill format

## Template

```md
## Exercise: {concept} — {rung}

**Problem:** {what the learner must produce, one paragraph}

**Hints:**
1. nudge: {concept name only}
2. strategy: {shape of the solution}
3. bottom out: {the step itself}

**Rubric:** {criterion}: {what full credit looks like}

**Known misconceptions:**
- {symptom} → reveals {misconception} → {correction}
```

## Example

```md
## Exercise: deadlock — faded

**Problem:** Two threads lock A then B in opposite order. Show the cycle and the one-line fix.

**Hints:**
1. nudge: deadlock
2. strategy: name the hold-and-wait cycle
3. bottom out: reorder the locks so both acquire A before B

**Rubric:** cycle stated: names the two threads and the two locks they hold and wait for.

**Known misconceptions:**
- "deadlock is just slow" → reveals conflation with starvation → name the cycle vs delay distinction
```

## Rules

- One exercise per block. Mixed-concept quizzes get one block per item.
- The rubric criterion must be checkable: a named condition the attempt either meets or misses.
- Each misconception entry must include the symptom, what it reveals, and the correction; never just "wrong".
- Keep the hint tiers in order; never combine nudge and strategy into one line.
- Record the attempt in `PROGRESS.md` before revealing the next rung.
