---
name: source-driven
description: Use when writing code against a specific framework or library version, building boilerplate, implementing a framework's recommended pattern (auth, routing, forms, data fetching, state), verifying an API signature before writing framework-specific code from memory, or the user asks for a documented, verified, or "correct" implementation.
---

# Source-Driven Development

## Three principles

1. **Memory is not evidence.** Training data ages — APIs deprecate and recommended patterns shift between versions. Code written from recall can look correct and break against the installed version.
2. **Detect the version, fetch the primary source, implement what it documents, cite it.** Every framework-specific pattern traces to an authoritative source the user can open and check for themselves.
3. **Flag what you couldn't verify.** Honesty about the gap beats a confident guess dressed as a fact.

## Overview

Back every framework-specific decision with official documentation. Verify the pattern, cite the source, and leave the user a link they can open.

## When to Use

- The user wants code that follows current best practices for a given framework
- Building boilerplate, starter code, or patterns that get copied across a project
- The user explicitly asks for documented, verified, or "correct" implementation
- Implementing features where the framework's recommended approach matters (forms, routing, data fetching, state management, auth)
- Reviewing or improving code that uses framework-specific patterns
- Any time you are about to write framework-specific code from memory

**When NOT to use:**

- Correctness does not depend on a specific version (renaming variables, fixing typos, moving files)
- Pure logic that behaves the same across all versions (loops, conditionals, data structures)
- The user explicitly wants speed over verification ("just do it quickly")

## The Process

```
DETECT ──→ FETCH ──→ IMPLEMENT ──→ CITE
  │          │           │            │
  ▼          ▼           ▼            ▼
 What       Get the    Follow the   Show your
 stack?     relevant   documented   sources
            docs       patterns
```

### Step 1: Detect Stack and Versions

Read the project's dependency file and pin the exact versions:

```
package.json    → Node/React/Vue/Angular/Svelte
composer.json   → PHP/Symfony/Laravel
requirements.txt / pyproject.toml → Python/Django/Flask
go.mod          → Go
Cargo.toml      → Rust
Gemfile         → Ruby/Rails
```

State the result before writing anything. The procedure is language-agnostic; the report shape is the same across families:

Worked STACK DETECTED examples (React/Vite, Django/Python) live in `references/stack-examples.md` — two illustrations of the one report shape; read either and follow that shape for whatever stack you detected.

If versions are missing or ambiguous, **ask the user**. Do not guess: the version selects which patterns are correct.

### Step 2: Fetch Official Documentation

Fetch the documentation page for the exact feature you are implementing (the page that covers the pattern, not the homepage or the full docs tree).

**Source hierarchy (in order of authority):**

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Official documentation | react.dev, docs.djangoproject.com, symfony.com/doc |
| 2 | Official blog / changelog | react.dev/blog, nextjs.org/blog |
| 3 | Web standards references | MDN, web.dev, html.spec.whatwg.org |
| 4 | Browser/runtime compatibility | caniuse.com, node.green |

**Not authoritative (never cite as a primary source):**

- Stack Overflow answers
- Blog posts or tutorials (even popular ones)
- AI-generated documentation or summaries
- Your own training data (verifying it is the entire point)

**Fetch precisely:**

Worked BAD/GOOD fetch examples (React, Django) live in `references/stack-examples.md` — two illustrations of the one fetch-precisely shape; read either and apply it to your stack's docs.

After fetching, extract the patterns that apply and record any deprecation warnings or migration guidance on the page.

When official sources contradict each other (a migration guide against the API reference, for instance), surface the discrepancy to the user and verify which pattern actually holds against the detected version.

### Step 3: Implement Following Documented Patterns

Write code that matches what the documentation shows:

- Use the API signatures from the docs, not from memory
- If the docs show a newer approach, use the newer approach
- If the docs deprecate a pattern, do not use the deprecated form
- If the docs do not cover something, flag it as unverified

**When the docs conflict with existing project code:**

Worked CONFLICT DETECTED dialogues (React useState/useActionState, Django sync_to_async/async ORM) live in `references/stack-examples.md` — read either; both illustrate the same conflict shape, which applies in any stack.

Surface the conflict. Do not silently pick one.

### Step 4: Cite Your Sources

Every framework-specific pattern gets a citation. The user must be able to verify each decision. Citations carry across languages:

Worked citation examples (TypeScript code-comment, Go code-comment, and an in-conversation citation) live in `references/stack-examples.md` — read whichever matches your citation context; the two code-comment examples illustrate one format, not a per-language partition.

**Citation rules:**

- Full URLs, not shortened
- Prefer deep links with anchors (`/useActionState#usage` over `/useActionState`); anchors survive doc restructuring better than top-level pages
- Quote the relevant passage when it supports a non-obvious decision
- Include browser/runtime support data when recommending platform features
- If you cannot find documentation for a pattern, say so:

```
UNVERIFIED: I could not find official documentation for this
pattern. This is based on training data and may be outdated.
Verify before using in production.
```

Honesty about what you could not verify beats false confidence.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'm confident about this API" | Confidence is not evidence. Training data carries outdated patterns that look correct and break against current versions. Verify. |
| "Fetching docs wastes tokens" | Hallucinating an API wastes more. The user debugs for an hour, then finds the signature changed. One fetch prevents the rework. |
| "The docs won't have what I need" | If the docs do not cover it, that is a signal: the pattern may not be officially recommended. |
| "I'll just mention it might be outdated" | A disclaimer does not help. Either verify and cite, or flag it as unverified. Hedging is the worst option. |
| "This is a simple task, no need to check" | Simple tasks with wrong patterns become templates. The user copies a deprecated handler into ten call sites before the modern approach surfaces. |

## Red Flags

- Writing framework-specific code without checking the docs for that version
- Saying "I believe" or "I think" about an API instead of citing the source
- Implementing a pattern without knowing which version it applies to
- Using deprecated APIs because they appear in training data
- Not reading `package.json` / the dependency file before implementing
- Fetching an entire docs site when one page is relevant

## Verification

After implementing with source-driven development:

- [ ] All sources are official documentation, not blog posts or training data
- [ ] Code follows the patterns shown in the current version's documentation
- [ ] Non-trivial decisions include source citations with full URLs
- [ ] No deprecated APIs are used (checked against migration guides)
- [ ] Anything that could not be verified is explicitly flagged as unverified
