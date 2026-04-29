# Persona-based testing

A surface should survive five distinct user archetypes. Each persona exposes failure modes that a single design-director perspective would miss. Load this reference when auditing a surface against user archetypes — it is a *testing* framework that runs in parallel with direction-setting, not a substitute for it.

**How to use.** Select 2–3 personas most relevant to the surface being critiqued (see the selection matrix below). Walk through the primary user action as each persona. Report specific red flags, not generic concerns.

---

## 1. Impatient power user — "Alex"

**Profile.** Expert with similar products. Expects efficiency, hates hand-holding. Will find shortcuts or leave.

**Behaviors.**
- Skips all onboarding and instructions
- Looks for keyboard shortcuts immediately
- Tries to bulk-select, batch-edit, automate
- Frustrated by required steps that feel unnecessary
- Abandons if anything feels slow or patronizing

**Test questions.**
- Can Alex complete the core task in under 60 seconds?
- Are there keyboard shortcuts for common actions?
- Can onboarding be skipped entirely?
- Do modals have keyboard dismiss (Esc)?
- Is there a power-user path (shortcuts, bulk actions)?

**Red flags (report specifically).**
- Forced tutorials or unskippable onboarding
- No keyboard navigation for primary actions
- Slow animations that cannot be skipped
- One-item-at-a-time workflows where batch would be natural
- Redundant confirmation steps for low-risk actions

---

## 2. Confused first-timer — "Jordan"

**Profile.** Never used this type of product. Needs guidance at every step. Will abandon rather than figure it out.

**Behaviors.**
- Reads all instructions carefully
- Hesitates before clicking anything unfamiliar
- Looks for help or support constantly
- Misunderstands jargon and abbreviations
- Takes the most literal interpretation of any label

**Test questions.**
- Is the first action obviously clear within 5 seconds?
- Are all icons labeled with text?
- Is contextual help available at decision points?
- Does terminology assume prior knowledge?
- Is there a clear back / undo at every step?

**Red flags (report specifically).**
- Icon-only navigation with no labels
- Technical jargon without explanation
- No visible help option or guidance
- Ambiguous next steps after completing an action
- No confirmation that an action succeeded

---

## 3. Accessibility-dependent user — "Sam"

**Profile.** Uses a screen reader (VoiceOver / NVDA), keyboard-only navigation. May have low vision, motor impairment, or cognitive differences.

**Behaviors.**
- Tabs through the interface linearly
- Relies on ARIA labels and heading structure
- Cannot see hover states or visual-only indicators
- Needs WCAG-AA color contrast (4.5:1 minimum for body text)
- May use browser zoom up to 200%

**Test questions.**
- Can the entire primary flow be completed keyboard-only?
- Are all interactive elements focusable with visible focus indicators?
- Do images have meaningful alt text?
- Is color contrast WCAG-AA compliant?
- Does the screen reader announce state changes (loading, success, errors)?

**Red flags (report specifically).**
- Click-only interactions with no keyboard alternative
- Missing or invisible focus indicators
- Meaning conveyed by color alone (red = error, green = success)
- Unlabeled form fields or buttons
- Time-limited actions without an extension option
- Custom components that break screen-reader flow

---

## 4. Deliberate stress tester — "Riley"

**Profile.** Methodical user who pushes interfaces beyond the happy path. Tests edge cases, tries unexpected inputs, probes for gaps.

**Behaviors.**
- Tests edge cases intentionally (empty states, long strings, special characters)
- Submits forms with unexpected data (emoji, RTL text, very long values)
- Tries to break workflows by navigating backwards, refreshing mid-flow, opening multiple tabs
- Looks for inconsistencies between what the UI promises and what actually happens
- Documents problems methodically

**Test questions.**
- What happens at the edges (0 items, 1000 items, very long text)?
- Do error states recover gracefully or leave the UI in a broken state?
- What happens on refresh mid-workflow? Is state preserved?
- Are there features that appear to work but produce broken results?
- How does the UI handle unexpected input (emoji, special chars, paste from spreadsheets)?

**Red flags (report specifically).**
- Features that appear to work but silently fail or produce wrong results
- Error handling that exposes technical details or leaves the UI in a broken state
- Empty states that show nothing useful ("No results" with no guidance)
- Workflows that lose user data on refresh or navigation
- Inconsistent behavior between similar interactions in different parts of the UI

---

## 5. Distracted mobile user — "Casey"

**Profile.** Using phone one-handed on the go. Frequently interrupted. Possibly on a slow connection.

**Behaviors.**
- Uses thumb only — prefers bottom-of-screen actions
- Gets interrupted mid-flow and returns later
- Switches between apps frequently
- Limited attention span, low patience
- Types as little as possible; prefers taps and selections

**Test questions.**
- Are primary actions in the thumb zone (bottom half of screen)?
- Is state preserved if the user leaves and returns?
- Does it work on slow connections (3G)?
- Can forms leverage autocomplete and smart defaults?
- Are touch targets at least 44×44pt?

**Red flags (report specifically).**
- Important actions positioned at the top of the screen (unreachable by thumb)
- No state persistence — progress lost on tab switch or interruption
- Large text inputs required where selection would work
- Heavy assets loading on every page (no lazy loading)
- Tiny tap targets, or targets too close together

---

## Selecting personas

Choose based on the surface type.

| Surface type | Primary personas | Why |
|--------------|------------------|-----|
| Landing page / marketing | Jordan, Riley, Casey | First impressions, trust, mobile |
| Dashboard / admin | Alex, Sam | Power users, accessibility |
| E-commerce / checkout | Casey, Riley, Jordan | Mobile, edge cases, clarity |
| Onboarding flow | Jordan, Casey | Confusion, interruption |
| Data-heavy / analytics | Alex, Sam | Efficiency, keyboard nav |
| Form-heavy / wizard | Jordan, Sam, Casey | Clarity, accessibility, mobile |

---

## Project-specific personas

When the surface has a defined audience (PRD, user-research notes, brand brief, or similar artifact), derive 1–2 additional personas from that material:

1. Read the target audience description.
2. Identify the primary user archetype not covered by the five predefined personas.
3. Create a persona using this template:

```
### [Role] — "[Name]"

**Profile.** 2–3 key characteristics derived from the audience description.

**Behaviors.** 3–4 specific behaviors based on the described audience.

**Red flags.** 3–4 things that would alienate this specific user type.
```

Only generate project-specific personas when real audience data exists. Do not invent audience details — fall back to the five predefined personas when no context is available.

---

**Cross-refs.** See `interaction-design.md` for the keyboard and focus-management patterns Sam relies on; `cognitive-load.md` for the working-memory rule that surfaces fail under Jordan's testing; `web.md` and `react.md` for mobile / responsive patterns Casey requires.
