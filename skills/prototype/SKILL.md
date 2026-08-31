---
name: prototype
description: 'Use when asked to prototype one design question through a cheap logic or UI experiment. Builds a throwaway artifact, records the one-line verdict, and folds the decision into real work without polluting main. Not for interactive state-model demos — use prototype-logic.'
---

# Prototype

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit model invocation: one design question needs a cheap logic or UI experiment. |
| Authority | Reversible-local: no VCS mutation of tracked branches, no credentials, no remote writes. |
| Side effect | Write one throwaway prototype artifact and its verdict off the main branch; that branch is the evidence, not a delivery target. |
| Done | The question is answered in one line and the decision is folded into the real work. |

## Inputs

- **Question** (required): the design question being answered, drawn from the user's prompt or surrounding code. If the question is genuinely ambiguous and the user is reachable, ask before routing.
- **Context** (required): the surrounding code or page that frames the question. Determines whether to route to LOGIC or UI.

## Procedure

### Route

Route before writing because LOGIC and UI variants require different artifact structures.

1. Classify the question: Done when: the stated outcome holds.
   - **Logic** — state machine, edge case, data shape, reducer, API contract, or "does this feel right" → use the **LOGIC procedure** below.
   - **UI** — what something should look like, layout, information hierarchy, or "what should this look like" → use the **UI procedure** below.
2. If ambiguous and the user is not reachable, default: backend module → LOGIC; page or component → UI. State the assumption at the top of the artifact. Done when: the stated outcome holds.

---

### LOGIC procedure

*When the question is about business logic, state transitions, or data shape.*

1. **State the question.** Write one paragraph at the top of the demo stating the exact question and the state model being tested. This checkpoint prevents the prototype from answering the wrong question. Done when: the stated outcome holds.
2. **Isolate the logic.** Put the answerable logic in a single `<script>` block as a small pure module. Pick the shape that fits the question: Done when: the stated outcome holds.
   - **Pure reducer**: `(state, action) => state` — for discrete events and a single state value.
   - **State machine**: explicit states and transitions — when legality of actions depends on current state.
   - **Pure functions over a plain data type** — when there is no implicit current state.
   - **Class or module with a clear method surface** — when logic genuinely owns ongoing internal state.
   Keep it pure: no DOM, no `document`, no button handlers reaching inside it. This module must be liftable into the real codebase after the question is answered.
3. **Build the shareable HTML file.** One file, plain HTML/CSS/JS, everything inline, opens by double-click. No framework, no bundler, no server. Done when: the stated outcome holds.
   Layout, top to bottom:
   - Title and one-line explanation of the question.
   - **Current state panel**: full relevant state rendered in domain language (not raw JSON), re-rendered after every click so the change is visible. Call out what just changed where it helps a non-developer follow.
   - **Free-play buttons**: one button per action, always available. Each click dispatches its action and re-renders the state.
   - **Guided walkthroughs**: tabs, each containing a plain-language description of the scenario and the ordered buttons to press. Clicking a step button performs that action and advances. Each walkthrough resets to a known initial state before running. Choose scenarios that demonstrate the awkward cases: the happy path, a tricky edge case, and an attempt at something that should be illegal.
   Write every label in domain language, not code. Keep it clean: one accent colour, generous spacing, no animations, no gimmicks.
4. **Hand it over.** Surface the file. Non-developers (designer, PM, domain expert) should be able to drive it without assistance. Done when: the stated outcome holds.
5. **Capture.** When the prototype answers the question: fold the validated reducer/machine/function set into the real module; commit the HTML file and the verdict to a throwaway branch off main. The main branch keeps only the folded decision. Done when: the stated outcome holds.

---

### UI procedure

*When the question is about what something should look like.*

1. **State the plan.** Write one line stating the variants, the `?variant=` switcher key, and the route or page. Place it in the prototype's location or as a top-of-file comment. Done when: the stated outcome holds.
2. **Default to 3 variants.** Cap at 5. More than 5 stops producing radically different variants and starts producing noise. Done when: the stated outcome holds.
3. **Draft each variant.** Hold each to the page's purpose and data, the project's component library or styling system, and a clear exported component name (`VariantA`, `VariantB`, `VariantC`). Variants must differ structurally in layout, information hierarchy, and primary affordance. Different colours or copy alone do not count. If two drafts are too similar, redo one with explicit "do not use a card grid" guidance. Done when: the stated outcome holds.
4. **Choose sub-shape:** Done when: the stated outcome holds.
   - **Sub-shape A (preferred)**: the route already exists. Render variants on the same route gated by `?variant=`. Keep all existing data fetching, params, and auth above the switcher; only the rendered subtree changes per variant.
   - **Sub-shape B (last resort)**: only when the thing being prototyped genuinely has no existing page to host it. Create a throwaway route following the project's routing convention, name it to be obviously a prototype (include `prototype` in the path), and use the same `?variant=` pattern.
5. **Wire the switcher.** On the route, render all variants conditionally and add the floating switcher: Done when: the stated outcome holds.
   ```tsx
   const variant = searchParams.get('variant') ?? 'A';
   return (
     <>
       {variant === 'A' && <VariantA {...data} />}
       {variant === 'B' && <VariantB {...data} />}
       {variant === 'C' && <VariantC {...data} />}
       <PrototypeSwitcher variants={['A','B','C']} current={variant} />
     </>
   );
   ```
6. **Build the floating switcher.** Small fixed-position bar at bottom-centre with left arrow, variant label, and right arrow. Clicking an arrow updates the URL search param so the variant is shareable and reload-stable. Keyboard `←` and `→` also cycle; do not intercept when an `<input>`, `<textarea>`, or `[contenteditable]` is focused. Gate on `process.env.NODE_ENV !== 'production'` so the bar never ships to users. Done when: the stated outcome holds.
7. **Hand it over.** Surface the URL and the `?variant=` keys. Done when: the stated outcome holds.
8. **Capture.** When a variant wins: fold the winner into the real code. On sub-shape A, drop the losing variants and the switcher from main. On sub-shape B, promote the winning variant to a real route. Commit all variants and the verdict to a throwaway branch off main. Done when: the stated outcome holds.

---

### Shared rules (apply to both LOGIC and UI)

1. **Mark it throwaway from day one.** Name it and locate it so a casual reader immediately knows it is not production code. Done when: the stated outcome holds.
2. **Trivial to run.** Start a UI prototype with one project command (`pnpm <name>`, `python <path>`, `bun <path>`). Open a logic prototype by double-clicking its single HTML file. Done when: the stated outcome holds.
3. **No persistence by default.** State lives in memory. If the question explicitly involves a database, use a scratch DB or local file with a clear "PROTOTYPE, wipe me" name. Done when: the stated outcome holds.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype runnable. Done when: the stated outcome holds.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), display the full relevant state so the user can see what changed. Done when: the stated outcome holds.
6. **Capture the evidence off main.** Commit the prototype to a throwaway branch. The main branch keeps only the validated decision. Done when: the stated outcome holds.

## Failure and recovery
| Failure | Response |
|---|---|
| Question is ambiguous or absent | Do not proceed. Ask the user to state the question before routing. |
| Logic prototype needs a test to run | The logic is not isolated enough; extract the pure module before continuing. |
| Variant fails to render | Remove the broken variant; document the failure in the verdict and continue with the remaining variants. |
| User rejects all variants | Treat as unresolved; do not fold any variant into the main branch. |
| Prototype code lands in main | Revert immediately. Prototype constraints (no tests, no error handling) are not safe for production. |

## Output
- **Decision**: one line answering the question. - **Evidence**: the prototype HTML file (LOGIC) or variant components and switcher (UI), committed to a throwaway branch off main. - **Verdict record**: the question, the answer, and the chosen path recorded in the issue or commit message on the throwaway branch.
