# UX writing

Copy is design. Load this reference when drafting UI labels, error messages, empty states, and call-to-action text — wording carries meaning that visual hierarchy alone cannot.

---

## The button label problem

Never use "OK", "Submit", or "Yes / No". They are lazy and ambiguous. Use specific verb + object patterns.

| Bad | Good | Why |
|-----|------|-----|
| OK | Save changes | Says what will happen |
| Submit | Create account | Outcome-focused |
| Yes | Delete message | Confirms the action |
| Cancel | Keep editing | Clarifies what "cancel" means |
| Click here | Download PDF | Describes the destination |

For destructive actions, name the destruction:

- "Delete" not "Remove" (delete is permanent; remove implies recoverable)
- "Delete 5 items" not "Delete selected" (show the count)

---

## Error messages: the formula

Every error message answers three questions: (1) What happened? (2) Why? (3) How to fix it?

Bad: "Invalid input."
Good: "Email address isn't valid. Please include an @ symbol."

### Error message templates

| Situation | Template |
|-----------|----------|
| Format error | "[Field] needs to be [format]. Example: [example]" |
| Missing required | "Please enter [what's missing]" |
| Permission denied | "You don't have access to [thing]. [What to do instead]" |
| Network error | "We couldn't reach [thing]. Check your connection and [action]." |
| Server error | "Something went wrong on our end. We're looking into it. [Alternative action]" |

### Don't blame the user

Reframe errors:

- "Please enter a date in MM/DD/YYYY format" — not "You entered an invalid date".
- "This field needs at least 8 characters" — not "Your password is too short".

---

## Empty states are opportunities

Empty states are onboarding moments. Three beats: (1) acknowledge briefly, (2) explain the value of filling it, (3) provide a clear action.

Bad: "No items."
Good: "No projects yet. Create your first one to get started."

---

## Voice vs. tone

**Voice** is brand personality — consistent everywhere.
**Tone** adapts to the moment.

| Moment | Tone shift |
|--------|------------|
| Success | Celebratory, brief: "Done. Your changes are live." |
| Error | Empathetic, helpful: "That didn't work. Here's what to try…" |
| Loading | Reassuring: "Saving your work…" |
| Destructive confirm | Serious, clear: "Delete this project? This can't be undone." |

Never use humor for errors. The user is already frustrated; help, do not joke.

---

## Writing for accessibility

**Link text** must have standalone meaning — "View pricing plans", not "Click here".

**Alt text** describes information, not the image — "Revenue increased 40% in Q4", not "Chart". Use `alt=""` for decorative images.

**Icon buttons** need `aria-label` for screen-reader context.

---

## Writing for translation

### Plan for expansion

| Language | Expansion vs. English |
|----------|----------------------|
| German | +30% |
| French | +20% |
| Finnish | +30 to +40% |
| Chinese | −30% (fewer characters, similar visual width) |

### Translation-friendly patterns

- Keep numbers separate: "New messages: 3" not "You have 3 new messages".
- Use full sentences as single strings (word order varies by language).
- Avoid abbreviations: "5 minutes ago" not "5 mins ago".
- Give translators context about where strings appear.

---

## Consistency: the terminology problem

Pick one term and stick with it.

| Inconsistent | Consistent |
|--------------|------------|
| Delete / Remove / Trash | Delete |
| Settings / Preferences / Options | Settings |
| Sign in / Log in / Enter | Sign in |
| Create / Add / New | Create |

Build a terminology glossary and enforce it. Variety creates confusion.

---

## Avoid redundant copy

If the heading explains it, the intro is redundant. If the button is clear, do not explain it again. Say it once, say it well.

---

## Loading states

Be specific: "Saving your draft…", not "Loading…". For long waits, set expectations ("This usually takes 30 seconds") or show progress.

---

## Confirmation dialogs: use sparingly

Most confirmation dialogs are design failures — consider undo instead (see `interaction-design.md` "Destructive actions"). When you must confirm: name the action, explain consequences, use specific button labels.

- "Delete project" / "Keep project" — not "Yes" / "No".

---

## Form instructions

Show format with placeholders, not instructions. For non-obvious fields, explain *why* you are asking — not just *what* to enter.

---

**Avoid.** Jargon without explanation. Blaming users ("You made an error" → "This field is required"). Vague errors ("Something went wrong"). Varying terminology for variety. Humor for errors.

**Cross-refs.** See `interaction-design.md` for confirmation-dialog mechanics and undo patterns; `personas.md` Jordan and Sam for the audiences this guidance most directly serves; `anti-slop.md §1.4` for AI-slop prose smells in product copy.
