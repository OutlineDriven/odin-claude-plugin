# CTA playbook

Reference for `Mode cta` in the copywriting skill: the archetype decision tree, the recommendation structure, and the operating principles.

## Archetype decision tree

```
context = INDEPENDENT / PERSONAL
├── objective = newsletter / email      → A: Author-signature subscribe
├── objective = try-it / direct action  → B: Inline action + source link
├── objective = reader support / tip    → C: Reader-supported funding link
├── objective = community               → D: Proof-counted community invite
├── objective = social follow           → A (variant: lead with social links)
├── objective = engagement              → E: Specific reply prompt
└── objective = product / demo          → FLAG. Valid only where the author IS
    the product (consultants, solo founders, indie devs). Frame as "if you hit
    this, here's how I help", never "Book a Demo" verbatim.

context = NEWSLETTER PUBLICATION
├── objective = growth / subs           → F: Share/restack + native widget
├── objective = engagement              → E: Specific reply prompt
├── objective = paid conversion         → G: Value-gap tease
├── objective = monetization / sponsor  → H: Inline sponsor block (not bottom)
├── objective = community               → D
└── objective = direct purchase         → K (rare; BOFU only)

context = BRAND / CONTENT MARKETING
├── stage = TOFU                        → I: Transitional asset (lead magnet)
├── stage = MOFU                        → J: Direct + transitional pair
├── stage = BOFU                        → K: Direct CTA + risk reversal
├── stage = Not applicable              → L: Value-statement subscribe (fallback)
└── objective = engagement              → E (rarely right here)
```

## Recommendation structure

Compose the recommendation in this exact structure:

```markdown
## Recommended CTA

**Archetype:** [letter + name] **Why this fits:** [1-2 sentences naming the input combination]

### Content (copy)
**Headline / value line:** > [exact text]
**Body / proof line (1-2 lines):** > [exact text]
**Button copy:** > [exact text]
**Risk reversal / subtext (if applicable):** > [exact text, or "Omit: would feel forced"]

### Form (structure)
- **Placement:** [end-only / end + sticky / end + mid-article repeat]
- **Visual weight:** [low / medium / high, with justification]
- **Layout:** [single button / button + text link / native widget cluster / one-line signature]
- **Proof to co-locate:** [subscriber count / star count / testimonial / named recommenders / logo wall / none]

### Mechanism
[Named mechanism + 1 sentence on why appropriate, OR "None: value statement carries it. Mechanisms would erode trust for this audience."]

### A/B test plan
- **First test:** [single variable]
- **Why this one first:** [1 sentence]
- **Sample size consideration:** [qualitative volume check, or skip A/B - traffic too low]

### Accessibility check
- **Color contrast:** [target ratio + concrete pairing if colors known]
- **Touch target:** [size requirement]
- **Semantic markup:** [<button> vs. <a> vs. form]
- **ARIA:** [only if non-obvious]
- **Keyboard / focus:** [requirement]
- **Color-independence:** [non-color affordance]
```

## Operating principles

- One primary CTA per post. Multiple competing CTAs is the dominant failure mode.
- Match the voice of the publication. A personal-essay footer that reads like a SaaS landing page collapses credibility.
- Specificity beats cleverness. "Get one essay a week on indie filmmaking" beats "Subscribe to our awesome newsletter." The "I want to ___" completion test is the cleanest filter for button copy.
- Proof co-located with the ask. Place the honest signal (subscriber count, testimonial, logos, star count) inside or adjacent to the CTA block.
- Mechanisms are tools, not garnish. Add urgency, scarcity, FOMO, or discount only when the context genuinely supports them; theatrical mechanisms erode trust.
- Push back on bad asks. If the user wants a CTA that will fail (e.g., "Book a Demo" at the bottom of a beginner tutorial for first-time visitors), say so, propose the alternative, explain why, then deliver the original only with the failure mode flagged.
