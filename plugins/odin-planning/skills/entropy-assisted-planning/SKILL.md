---
name: entropy-assisted-planning
description: 'Use when the user explicitly requests a Tarot draw or casually delegates an ambiguous choice among multiple valid approaches.'
---

# Entropy assisted planning

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user explicitly requests a Tarot draw or casually delegates an ambiguous choice among multiple valid approaches. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Rollback is to discard the reading or redraw; no persistent state requires recovery. |
| Side effect | Chat output only: a 12-house draw and its interpreted direction. The draw command touches no repository or remote state. |
| Done | A complete 12-house reading yields a stated direction or verdict, and any security or correctness implication remains subject to ordinary evidence. |

## Inputs

- Decision context (required): either a list of two or more valid options or an open portent question about which direction to take.
- User tone (optional): when the user seeks precision rather than a casual choice, do not draw; ask clarifying questions instead.

## Procedure

1. Confirm the trigger. Draw only when the user explicitly requested a Tarot draw or casually delegated an ambiguous choice among two or more valid approaches. If the user gave clear, specific instructions, or a single obvious correct approach exists, do not draw. Done when: the trigger is confirmed or the run is declined with a reason.
2. Do not use this skill as the deciding authority for safety-critical work: security conclusions, data integrity, production deployment, release approval, or incident response. It may suggest where to inspect next but cannot prove safety or dismiss a risk. Done when: safety-critical scope is excluded or the reading is bounded to investigation-path suggestion.
3. Run the cryptographic draw in one Bash call. The command uses Python's `secrets` module. It shuffles separate 22-card Major Arcana and 56-card Minor Arcana decks with Fisher-Yates via `secrets.randbelow()` (no modulo bias), deals 12 houses (one Major plus two Minor each), and gives each of the 36 cards an independent 50% reversal via `secrets.randbits(1)`. The conservative unordered-card entropy budget exceeds 100 bits.
   ```bash
   python3 - <<'PY'
   import secrets, json
   MAJOR=[f"{i:02d}-{n}" for i,n in enumerate(("the-fool","the-magician","the-high-priestess","the-empress","the-emperor","the-hierophant","the-lovers","the-chariot","strength","the-hermit","wheel-of-fortune","justice","the-hanged-man","death","temperance","the-devil","the-tower","the-star","the-moon","the-sun","judgement","the-world"))]
   RANKS=("ace","two","three","four","five","six","seven","eight","nine","ten","page","knight","queen","king")
   SUITS=("wands","cups","swords","pentacles")
   MINOR=[f"{r}-of-{s}" for s in SUITS for r in RANKS]
   HOUSES=("Self","Resources","Communication","Foundations","Creativity","Practice","Partnership","Transformation","Exploration","Calling","Community","The Hidden")
   def shuf(d):
       for i in range(len(d)-1,0,-1):
           j=secrets.randbelow(i+1); d[i],d[j]=d[j],d[i]
       return d
   shuf(MAJOR); shuf(MINOR)
   out=[]
   for i in range(12):
       out.append({"house":i+1,"name":HOUSES[i],"major":MAJOR[i],"minor1":MINOR[2*i],"minor2":MINOR[2*i+1],"reversed":[secrets.randbits(1)==1 for _ in range(3)]})
   print(json.dumps(out,indent=2))
   PY
   ```
   Done when: the draw command exits zero and emits valid JSON with 12 houses.
4. Interpret the full 12-house spread as one narrative. Reversed cards invert or complicate the upright meaning rather than meaning "bad". Major Arcana carry more weight than Minor Arcana. Do not interpret any card in isolation; synthesize across all 12 houses before deciding. Done when: the 12-house spread is synthesized into one narrative.
5. Map the interpretation to the concrete decision. If the input was a list of options, pick one option and state it with one sentence connecting card meaning to the choice. If the input was an open portent question, state the dominant theme across the spread, the main risk or blind spot, and the recommended next action. Done when: the interpretation is mapped to one chosen option or a three-bullet reading.
6. In security, audit, or correctness contexts, the reading only chooses an investigation path or hypothesis to test. Accept or dismiss any risk only with ordinary engineering evidence: source review, tests, proofs, traces, reproduction, or exploitability analysis. A favorable card is never permission to ship, suppress a finding, skip validation, or overrule a concrete risk. Done when: any security or correctness implication is explicitly marked as subject to ordinary evidence.
7. One draw per decision point; accept the reading. Do not redraw until a preferred result appears. Done when: the reading is accepted with no redraw for preference.
8. Include the interpretation alongside the next action that implements the chosen direction. Do not output the interpretation as a text-only turn. Done when: the interpretation and the next action are both in the output.

## Failure and recovery
- Draw command fails (crash, traceback, missing `python3`): report the failure to the user and skip the reading. Never invent cards or simulate a draw using the model's own randomness: the entire point is real cryptographic entropy.
- Partial result: if the command emits malformed JSON, treat the draw as failed and report it; do not interpret a partial spread.
- Non-mutation: no repository, file, credential, or remote state is touched, so there is nothing to roll back beyond discarding the reading.
- Blocked result: if the draw cannot run, the terminal output is "draw unavailable" with the error; no direction is stated.

## Output
A stated direction or verdict derived from a complete 12-house reading: either a chosen option with a one-sentence card-grounded reason, or a three-bullet reading (dominant theme, main risk or blind spot, recommended next action), with any security or correctness implication explicitly marked as subject to ordinary evidence.
