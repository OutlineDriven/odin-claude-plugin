# Ask Me Command

Before proceeding to ask planning questions, you must *proactively and critically* execute both Verbalized Sampling (VS) and exploration:

- For Verbalized Sampling, generate and *sample* multiple (at least 5) distinct, diverse candidates that represent different possible user intents or directions. Explicitly choose from the tails of the response probability distribution (probability < 0.10 for each), and include both the <text> and its <probability> for each sample. Critically assess each VS sample: point out potential weaknesses, contradictions, or oversights.

**Required VS Output Format:**
```
Sample 1: <text>hypothesis here</text> <probability>0.05</probability>
  - Weakness: [potential flaw]
  - Contradiction: [logical conflict if any]
  - Oversight: [what this misses]

Sample 2: <text>alternative hypothesis</text> <probability>0.08</probability>
  ...
```

- For exploration, deliberately seek out unconventional, underexplored, and edge-case possibilities relating to the user's objective, drawing on both the provided context and plausible but non-obvious requirements.

Only after completing *both* critical VS and exploration steps, proceed to use the question tool to ask the *maximum possible number* of precise, clarifying, and challenging planning questions that holistically address the problem space, taking into account uncertainty, gaps, and ambiguous requirements.
