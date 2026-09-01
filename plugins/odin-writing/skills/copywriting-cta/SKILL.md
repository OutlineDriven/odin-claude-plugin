---
name: copywriting-cta
description: 'Use when a user asks to design or review a bottom-of-article call-to-action. Maps article context, audience, and funnel stage to a CTA archetype with copy, form, mechanism, A/B test plan, and accessibility check. For general copywriting use copywriting; for hooks or ledes use copywriting-hooks.'
---

# End-of-article CTA designer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to design or review a bottom-of-article CTA. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Produces a recommendation in the conversation only. |
| Side effect | No state outside the conversation. |
| Done | Complete CTA recommendation (copy, form, mechanism, tests, a11y) with anti-pattern warnings. |

## Inputs

Required from the user (ask one question at a time with 2-4 tappable options; skip any already answered; fall back to free text only if the answer cannot be enumerated):

1. **Article context:** Personal/independent blog or essay · Newsletter/paid publication · Brand/company/content-marketing blog · Other.
2. **Primary objective:** Newsletter/email subscription · Social follow · Lead generation (gated asset) · Product/service signup or free trial · Demo or sales call booking · Direct purchase · Community join · Engagement (reply/comment/share) · Reader support (paid sub/tip) · Try-it/direct action · Other. If the user lists more than one, ask which is primary; choosing multiple objectives is the dominant cause of CTA failure.
3. **Audience and relationship:** First-time visitor · Returning reader, not subscribed · Existing subscriber/customer · Mixed/unknown.
4. **Funnel stage:** TOFU (discovery, no buying intent) · MOFU (evaluating, comparing) · BOFU (ready to act) · Not applicable.
5. **Mechanism preference** (ask only if a mechanism could legitimately help; for skeptical or repeat-reader audiences default to "None / value-only" without asking): None/value-only · Curiosity gap · Reciprocity (free asset first) · Discount/offer · Urgency (real deadline) · Scarcity/FOMO · Social proof.

Optional: free-text constraints the user volunteers (length limit, brand voice, no popups, language, formality).

## Procedure

1. **Interview.** Ask the five inputs above in order, one at a time, skipping any already supplied. Capture volunteered constraints. Done when: all five inputs are collected or reported missing.

2. **Diagnose.** Map the inputs to one archetype via this decision tree: Done when: the inputs are mapped to one archetype via the decision tree.

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

3. **Compose the recommendation** in this exact structure: Done when: the recommendation is composed in the exact structure with all sections filled.

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

4. **Anti-pattern warnings.** After the recommendation, list 2-3 anti-patterns the user is at risk of given their inputs, as a contrarian check. Failure modes to call out by name: multiple competing CTAs, generic "Subscribe for more" / "Learn More", mechanism mismatch (urgency/scarcity where none exists), SaaS landing-page voice on a personal essay, proofless ask, "Book a Demo" on TOFU content, open-ended reply questions on social. Done when: 2-3 anti-patterns are listed as a contrarian check.

5. **Enforce operating principles during composition:** Done when: operating principles are enforced during composition.
   - One primary CTA per post. Multiple competing CTAs is the dominant failure mode.
   - Match the voice of the publication. A personal-essay footer that reads like a SaaS landing page collapses credibility.
   - Specificity beats cleverness. "Get one essay a week on indie filmmaking" beats "Subscribe to our awesome newsletter." The "I want to ___" completion test is the cleanest filter for button copy.
   - Proof co-located with the ask. Place the honest signal (subscriber count, testimonial, logos, star count) inside or adjacent to the CTA block.
   - Mechanisms are tools, not garnish. Add urgency, scarcity, FOMO, or discount only when the context genuinely supports them; theatrical mechanisms erode trust.
   - Push back on bad asks. If the user wants a CTA that will fail (e.g., "Book a Demo" at the bottom of a beginner tutorial for first-time visitors), say so, propose the alternative, explain why, then deliver the original only with the failure mode flagged.

6. **Language and style.** Adapt copy to the user's stated brand voice, the article's language (never default to English), the publication's existing cadence, and the reader's expertise level. Honor formality cues (tu/vous, du/Sie) and flag the choice. If non-English, translate the content section but keep structure headings in English. Done when: copy is adapted to brand voice, language, cadence, and expertise level with formality cues flagged.

7. **Offer next moves.** Suggest 2-3 follow-ups: steelman the opposite CTA, variant for a different audience or platform, or end-to-end article review for CTA-supporting signals. Done when: 2-3 follow-ups are suggested.

## Failure and recovery
- Missing inputs. If any of the five required inputs cannot be obtained, stop and report which input is missing rather than guessing. A CTA designed on assumed inputs produces the universal failure mode (generic "Subscribe for more").
- Multiple primary objectives. If the user insists on more than one primary objective after pushback, flag it as a failure mode, deliver the strongest single-primary recommendation, and note the competing objectives as anti-patterns.
- No valid archetype. If the input combination maps to no archetype (e.g., product/demo on a personal blog where the author is not the product), report the conflict and propose the closest valid alternative. Do not fabricate an archetype.
- Partial-result rule. No partial recommendation is returned. Either the full structure is composed or the blocked result is returned naming the missing input.
- Non-mutation. This skill writes nothing outside the conversation. There is no rollback; recovery is re-running the interview with corrected inputs.

## Output
A single in-conversation recommendation containing: archetype selection with rationale, copy (headline, body, button, risk reversal), form (placement, visual weight, layout, proof), mechanism, A/B test plan, WCAG 2.2 accessibility check, 2-3 anti-pattern warnings, and 2-3 suggested next moves.
