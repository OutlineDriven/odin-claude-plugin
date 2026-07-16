---
name: minimalism-driven
description: 'Build the smallest version that fully does the job and makes its intent obvious — the right amount, not the fewest lines. Reuse before adding, prefer delete and edit over add, and give every addition a reason you can state in one line. Use when scope creep, speculative abstraction, or unneeded surface is a risk; before adding a helper, wrapper, config key, or dependency; or when the user says "minimal", "bare minimum", "DRY this up", or "no gold-plating".'
---

# Minimalism-Driven Development

## Do this

1. Search for what already exists and reuse it before adding anything.
2. Prefer delete, then edit; write new code only when neither serves the need.
3. Give every addition a reason you can state in one line. If you can't, don't add it.
4. Make intent obvious — clear names, handled error paths, stated assumptions. No silent gaps.
5. Stop at the ask. Note an adjacent improvement in one line; don't build it uninvited.

## Verify

- [ ] Every addition has a one-line reason; delete and edit were tried first.
- [ ] Names, error paths, and assumptions make intent obvious without asking.
- [ ] Scope equals the ask; adjacent ideas are notes, not code.
