# Charter

The two-sided ban list. Side A is the centroid-AI default. Side B is decoration covering thin ideas. Both come from refusing to commit. `/taste` rejects both, equally.

## Side A — slop (centroid-AI default convergence)

Slop is what an under-trained model emits when it has no point of view. It hedges, it averages, it picks the medians and presents them as choices.

| Ban | Why | Where it shows |
|---|---|---|
| Generic openers ("Sure!", "Of course", "Happy to help!") | Performs warmth without committing to anything that follows. | Prose: opening lines. Code: PR descriptions. |
| Hedge-stacks ("perhaps it might possibly help if...") | Layered modal verbs paid by reader attention. The author paid nothing. | Prose: every paragraph. Decision: every recommendation. |
| Validation phrases ("you're absolutely right!") | Substitutes flattery for analysis. The reader's argument did not become more true. | Prose. Conversation. Code review comments. |
| AI-flat prose | Equal-weighted sentences in a row. No rhythm, no emphasis, no shape. | Prose. Documentation. |
| Default palettes | Bootstrap-blue, Material-purple, Stripe-teal. Recognizable as "I picked the first preset." | Design. |
| 50/50 decision hedges | "Both options have merit, so consider your priorities." Picks nothing. | Decision docs. ADRs. |
| Defensive nil-checks where impossible | `if (x !== null)` after a constructor that cannot return null. Performs caution; signals "I do not know what is invariant." | Code. |
| Bullet-point lists where prose would be clearer | Disguises absent reasoning as structured thought. | Prose. Slides. |

## Side B — overkill (decoration covering thin ideas)

Overkill is what an author emits to perform depth they have not delivered. The decoration is the tell.

| Ban | Why | Where it shows |
|---|---|---|
| Thesaurus-soup prose ("orchestrate the holistic synthesis of...") | Long Latin words doing the work of short Saxon ones. Volume substitutes for content. | Prose. Marketing copy. |
| Abstraction towers (4 layers where 1 suffices) | `Factory<Builder<Strategy<T>>>` for a single call site. Performs architectural sophistication; signals "I did not know what was actually needed." | Code. |
| Gradient stacks on every section | Ten gradients, no hierarchy. Decoration becomes the design. | Design. |
| 12-criterion weighted scoring matrix | Spreadsheet for a 2-option decision. The math is the alibi for not committing. | Decision docs. RFCs. |
| Ceremony that performs depth without delivering it | Long preamble, hedged framing, throat-clearing. Reader does the work. | Prose. Meeting notes. |
| Glow + glass + drop-shadow + gradient on one button | Maximum visual stack on a non-hero element. | Design. |
| Excessive parameterization | 14 config flags for 14 hypothetical use cases. YAGNI applied in reverse. | Code APIs. |
| Manifesto framing on a 3-line tweak | Prelude bigger than the substance. | Prose. Internal memos. |

## Reciprocity

Slop and overkill are not opposites. They are siblings:

- Both refuse to commit. Slop refuses by averaging into the default; overkill refuses by piling decoration on top of nothing.
- The fix in both cases is identical: pick one direction and let it carry the work.
- An artifact can fail BOTH at once — slop framing wrapped around an overkill core, or vice versa.

## Closing

Centroid-AI != unique taste. Over-decoration != depth. The skill is to commit, not to hedge in either direction.
