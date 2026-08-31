---
name: release-promotion
description: 'Use when asked to use /ce-promote [what shipped and/or channels] to draft launch or promotion copy for a shipped feature across channels; every drafted channel is returned as a labeled copy-pasteable block with a revision offer. Don''t use for tasks that require source or remote-system changes.'
---

# Promotion copy

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /release-promotion [what shipped and/or channels] |
| Authority | Read-only; drafts copy only. It never posts, publishes, schedules, commits, or opens PRs. |
| Side effect | None. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Done | Every drafted channel is presented as a labeled copy-pasteable block and the user is offered a revision. |

## Inputs

The free-form argument is the source of truth for what shipped and which channels to draft. Both are optional: when omitted, derive what shipped from repository context and default channels to an X post (or short thread) plus a one-line changelog or release blurb. If the user named channels (LinkedIn, email, a blog intro, a demo script), draft those instead of or in addition to the defaults.

## Procedure

1. Determine what shipped. Prefer the argument when supplied. Otherwise derive from context, using what is available and blocking on no single source: `gh pr view --json title,body,url` for the merged or active PR; `git diff main...HEAD --stat` to skim notable changes; the top or `[Unreleased]` entry in `docs/changelog.md`, `CHANGELOG.md`, or similar; `git log --oneline -15` for the arc of the change.
2. Write a 1-3 sentence summary of the user-facing value: what a user can now do that they could not before, and why they would care. State outcome, not implementation. If what shipped cannot be told confidently, ask one short question rather than guessing.
3. Pick channels. Default to an X post or short thread plus a one-line changelog or release blurb. If the user named channels, draft those instead of or in addition to the defaults. Scale to the change: a small fix warrants one or two short drafts; a flagship feature warrants a cross-channel set.
4. Draft each channel following these shared rules: lead with the user-facing outcome, not how it was built; one idea per piece; cut windup, hedges, and throat-clearing; plain active language; strip AI tells ("thrilled/excited to announce", "game-changer", "in today's fast-paced world", "unlock/leverage/seamless", em-dash padding); read it back as if saying it to one user and rewrite if a person would not say it.
5. For distributed channels, make the first line the hook that earns the next line, since feeds truncate; match each channel's native shape and length; never reuse one draft verbatim across channels; include one clear CTA where the channel supports it; use 0-2 hashtags only where the channel expects them.
6. Apply per-channel shape: X — value in the first line, ~1-3 tight lines, thread only when there is more than one beat worth its own line; changelog or release blurb — one declarative line naming the new capability, plain not promotional; LinkedIn — a short paragraph with a human angle then the what, warmer than X; email — benefit-stating subject plus 2-4 sentence body plus one CTA; blog intro — one opening paragraph framing the problem and the new capability, leaving the deep-dive to the author; demo script — 3-6 spoken beats (hook, problem, action, payoff). Produce one strong draft per channel by default; produce more only when asked, capped at ~3.
7. Present every draft as a clean, copy-pasteable block labeled by channel, e.g. `### X post` followed by the copy. Offer to revise (tone, length, angle, more variations, another channel). Remind the user the drafts are theirs to ship; do not post, publish, schedule, commit, or open a PR.

## Failure and recovery
- Cannot determine what shipped: ask one short question; do not guess or fabricate a value claim.
- A context source is unavailable (no PR, no changelog, no git history): skip it and use the remaining sources; block only if no source yields a confident value summary.
- Partial result: present every channel that drafted successfully and name any channel that could not be drafted with the reason.
- Non-mutation: nothing is posted, published, scheduled, committed, or opened; a failed or partial run leaves the repository and any external account unchanged.

## Output
A set of labeled, copy-pasteable copy blocks, one or more per requested channel, each leading with the user-facing outcome and shaped to its channel. The user is offered a revision. No post, publish, schedule, commit, or PR action is taken.

## Provenance

Origin: https://github.com/EveryInc/compound-engineering-plugin, revision a1f601f17137f648be439965f8fdd9123303de5d, file skills/ce-promote/SKILL.md. License: MIT (Copyright (c) 2025 Every). Mechanisms extracted and rewritten in ODIN style, not copied verbatim; the optional Spiral CLI voice-matching integration was dropped to keep the skill self-contained with no runtime dependencies, preserving the core mechanism of channel-aware launch copy drafting from shipped-change evidence.
