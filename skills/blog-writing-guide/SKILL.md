---
name: blog-writing-guide
description: 'Use when asked to write, review, or improve a Sentry engineering blog post, article, announcement, deep-dive, or postmortem. Produces blog copy with a real byline, no corporate fluff, real numbers, working code, and a shareable story. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Blog writing guide

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to write, review, or improve a Sentry engineering blog post, article, announcement, deep-dive, or postmortem. |
| Authority | Reversible local write: produce or edit blog copy in a local draft file. Roll back by discarding the draft or reverting the file to its prior state. |
| Side effect | Creates or edits a local blog draft file only. No publish, deploy, credential, paid, or remote mutation. |
| Done | Blog post with a real byline, no corporate fluff, real numbers for every performance claim, working code, and a shareable story. |

## Inputs

- Topic, post type, and intended audience. Required. Post type is one of: engineering deep dive, product launch, postmortem, data/research, tutorial/guide.
- Author name for the byline. Required before the post is done; no "The Sentry Team" bylines.
- Existing draft to review or improve. Optional; supply when editing rather than drafting from scratch.
- Supporting evidence for every claim the post makes: real numbers for performance claims, tested code samples, architecture details. Required for any claim present in the draft.

## Procedure

1. Confirm post type and byline. Map the type to its goal and byline rule: engineering deep dive (explain a technical system or decision so other engineers learn; byline the engineer who built it, always), product launch (explain what shipped, why it matters, how to use it; PM, engineer, or DevEx, not PMM unless marketing built it), postmortem (transparent failure analysis with timeline and fixes; engineering leadership), data/research (original insights from Sentry's data position; data team, engineering, or research), tutorial/guide (help a developer accomplish something specific; DevEx, engineer, or community contributor). Stop and request the author name if none is available.

2. Write the opening as one of two things: state the problem or state the conclusion. Never open with background, company history, or hype.

3. Structure the post around the reader's questions in order: what problem does this solve (1-2 paragraphs max), how does it actually work (the bulk of the post, be specific about the underlying technology not the buttons to click), what were the trade-offs or alternatives, and how do I use, try, or implement this. For engineering deep dives also address what was tried that didn't work and what the known limitations are.

4. Apply the Sentry voice throughout: a senior developer at a conference afterparty explaining something they are genuinely excited about. Technically precise, opinionated, direct. Use "we" for Sentry and "you" for the reader. Humor serves the content; one good joke per post is plenty. Keep the author's first-person voice through the whole post, not just the intro and closing.

5. Ban corporate fluff. Never use: "we're excited/thrilled to announce" (just announce it), "best-in-class"/"industry-leading"/"cutting-edge" (show, don't tell), "seamless"/"seamlessly", "empower"/"leverage"/"unlock" (say what you actually mean), "robust" (describe what makes it robust), "at [Company], we believe" (just state the belief), "streamline", filler transitions ("that being said," "it's worth noting that," "at the end of the day," "without further ado," "as you might know"), and "in this blog post, we will explore" (be direct, just start).

6. Flag and rewrite AI writing patterns: staccato dramatic fragments ("No errors. No warnings. Everything green."), bumper-sticker aphorisms ("You can't fix what you can't see."), three-beat reveals ("Not a config issue. Not a code bug. The deploy was stale."), smug simplicity (code block then "That's it. That's all you need."), parallel-structure ad copy ("Metrics tell you what's broken. Traces tell you why."), and personality only in the bookends (personal intro, impersonal clinical middle, CTA close). Rewrite each into plain connected prose.

7. Format for skimmability. Break paragraphs at contrast points: when a sentence introduces a "but," "however," or shifts perspective, start a new paragraph rather than burying the turn inside a block. One idea per paragraph; three-sentence and one-sentence paragraphs are fine. Use no em dashes; use commas, periods, or line breaks instead.

8. Make section headings convey information. Weak headings name a category ("Background," "Architecture," "Results," "Conclusion"). Strong headings name the specific mechanism or finding ("Why time-series pre-aggregation destroys debugging context").

9. Enforce technical quality. Numbers over adjectives: every performance claim includes the number (e.g., "reduced p99 error processing time from 340ms to 45ms, a 7.5x improvement"). Code must work: test every code sample, include imports and configuration, and let comments explain why, not what. Diagrams for systems: if the post describes a system with more than two interacting components, include a diagram labeled with real service names, not generic boxes. Honesty over hype: never overstate what a feature does, acknowledge limitations, say if something is in beta, and do not claim AI features are more capable than they are ("suggests a likely root cause" is not "finds the root cause").

10. Write a title that makes a specific claim, tells a story, or promises a specific payoff ("Your JavaScript bundle has 47% dead code. Here's how to find it."). Reject vague announcement titles ("Introducing our new metrics product").

11. Close with something useful: a link to docs, source code, a way to try it, or a call for feedback. Connect back to the story the post opened with. Never end with generic hype ("We can't wait to see what you build!"), recaps of what was just said, or product-page CTAs ("Try Sentry for free. Included on all plans.").

12. For SEO-targeted posts: lead with tool-agnostic educational content for the first 50-60% and introduce the product as an implementation example in the second half. Put keywords in H2s. Include a "What is X?" definitional section for any head term. Add a 3-4 question FAQ targeting long-tail keywords at the bottom.

13. Run the "would I share this?" test: would a developer share this post, and does it have a shot at Hacker News? A post worth sharing contains at least one of: a technical decision explained with trade-offs, original data or research not found elsewhere, a real-world debugging story with specific details, an honest accounting of something that went wrong, or a how-to that saves the reader real time. If none, the post needs more depth or belongs in the changelog.

14. Run the review checklists. Technical: all technical claims accurate, code samples work, architecture descriptions match reality, numbers and benchmarks correct, no oversimplifications an expert would cringe at. Editorial: opening hooks the reader within 2 sentences, passes the share test, no corporate language or filler, headings convey information, right length, title is specific and compelling. Final: author byline is a real person's name, links to docs or getting-started included, post does not duplicate what is in the changelog. When giving feedback, quote the weak passage, explain why it is weak, and rewrite it to show the standard.

## Failure and recovery
- Missing byline: stop and request the author name. Do not mark the post done with a "The Sentry Team" byline.
- Untested code: do not include code samples that have not been run. Mark the sample as untested and request the author test it, or remove it.
- Unsupported performance claim: if a real number cannot be supplied, remove the claim or mark it unverified. Do not state a number without evidence.
- Corporate fluff or AI pattern detected during review: rewrite the passage per the banned-language and AI-pattern rules. Keep the clean sections of a partial draft and flag the rest.
- Post duplicates changelog content: return the post as needs-more-depth and state what additional insight or story is required.
- No shareable element: return the post as needs-more-depth rather than padding it. State which shareable element is missing.
- Rollback: discard the draft file or revert it to its prior state. No publish, deploy, or remote action is taken, so no external rollback is needed.

## Output
A local blog draft file (Markdown) with a real byline, no corporate fluff, real numbers for every performance claim, tested code samples, a diagram for any system with more than two interacting components, information-conveying headings, a specific title, and a useful closing. For review tasks, a marked-up draft plus specific constructive feedback that quotes each weak passage and rewrites it to show the standard.

## Provenance

Origin: getsentry/skills, revision c2f99a5b04b4cd992ec3022d7c2c3e23e938d241, license Apache-2.0, source path skills/blog-writing-guide/SKILL.md. Clean-room adaptation: the Sentry blog writing standards (voice, banned language, opening rule, reader's-questions structure, skimmability formatting, developer-content SEO, AI-pattern detection, technical quality bar, title and closing rules, post-type byline rules, share test, and review checklists) are restated in self-contained procedural form; no third-party expression is copied.
