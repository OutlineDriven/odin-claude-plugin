# Cognitive load

The total mental effort required to use a surface. Overloaded users misclick, abandon, or build wrong mental models. Load this reference when auditing a surface for cognitive overhead — direction-setting (`paradigms.md`, `soul.md`) commits to a posture; this reference catches the failure modes of that posture.

---

## Three types of load

**Intrinsic — the task itself.** Complexity inherent to what the user is trying to do. You cannot eliminate this; you can structure it.

Manage by: breaking complex tasks into discrete steps; providing scaffolding (templates, defaults, examples); progressive disclosure (show what's needed now, hide the rest); grouping related decisions together.

**Extraneous — bad design.** Mental effort caused by poor design choices. Eliminate ruthlessly; this is pure waste.

Common sources: confusing navigation that requires mental mapping; unclear labels that force users to guess meaning; visual clutter competing for attention; inconsistent patterns that prevent learning; unnecessary steps between user intent and result.

**Germane — learning effort.** Mental effort spent building understanding. This is the *good* load — it leads to mastery.

Support by: progressive disclosure that reveals complexity gradually; consistent patterns that reward learning; feedback that confirms correct understanding; onboarding that teaches through action, not walls of text.

---

## Cognitive load checklist

Evaluate the surface against these eight items.

- [ ] **Single focus** — can the user complete the primary task without distraction from competing elements?
- [ ] **Chunking** — is information presented in digestible groups (≤4 items per group)?
- [ ] **Grouping** — are related items visually grouped (proximity, borders, shared background)?
- [ ] **Visual hierarchy** — is it immediately clear what is most important on screen?
- [ ] **One thing at a time** — can the user focus on a single decision before moving to the next?
- [ ] **Minimal choices** — are decisions simplified (≤4 visible options at any decision point)?
- [ ] **Working memory** — does the user need to remember information from a previous screen to act on the current one?
- [ ] **Progressive disclosure** — is complexity revealed only when the user needs it?

**Scoring:** 0–1 failures = low cognitive load (good). 2–3 = moderate (address soon). 4+ = critical fix needed.

---

## The working memory rule

Humans hold ≤4 items in working memory at once (Miller's law as revised by Cowan, 2001).

At any decision point, count the distinct options, actions, or pieces of information the user must simultaneously consider.

| Item count | Posture |
|-----------|---------|
| ≤4 | Within working memory — manageable |
| 5–7 | Pushing the boundary — group or progressive-disclose |
| 8+ | Overloaded — users will skip, misclick, or abandon |

**Practical applications:**
- Navigation menus: ≤5 top-level items (named exception — nav is a persistent wayfinding landmark, not an in-the-moment decision point; users scan and pick rather than hold all items in working memory). Group anything beyond 5 under clear categories.
- Form sections: ≤4 fields visible per group before a visual break
- Action buttons: 1 primary, 1–2 secondary, group the rest in a menu
- Dashboard widgets: ≤4 key metrics visible without scroll
- Pricing tiers: ≤3 options (more causes analysis paralysis)

---

## Eight common violations

### 1. The wall of options
**Problem:** presenting 10+ choices at once with no hierarchy.
**Fix:** group into categories, highlight a recommended choice, use progressive disclosure.

### 2. The memory bridge
**Problem:** user must remember info from step 1 to complete step 3.
**Fix:** keep relevant context visible, or repeat it where it's needed.

### 3. The hidden navigation
**Problem:** user must build a mental map of where things are.
**Fix:** always show current location (breadcrumbs, active states, progress indicators).

### 4. The jargon barrier
**Problem:** technical or domain language forces translation effort.
**Fix:** use plain language. If domain terms are unavoidable, define them inline.

### 5. The visual noise floor
**Problem:** every element has the same visual weight — nothing stands out.
**Fix:** establish a clear hierarchy — one primary element, 2–3 secondary, everything else muted.

### 6. The inconsistent pattern
**Problem:** similar actions work differently in different places.
**Fix:** standardize interaction patterns. Same type of action = same type of UI.

### 7. The multi-task demand
**Problem:** interface requires processing multiple simultaneous inputs (reading + deciding + navigating).
**Fix:** sequence the steps. Let the user do one thing at a time.

### 8. The context switch
**Problem:** user must jump between screens / tabs / modals to gather info for a single decision.
**Fix:** co-locate the information needed for each decision. Reduce back-and-forth.

---

**Cross-refs.** See `anti-slop.md §1` for design slop tells that compound cognitive load; `paradigms.md §0` for how each paradigm trades density for hierarchy; `interaction-design.md` for the per-element state grammar that keeps single-element interactions readable.
