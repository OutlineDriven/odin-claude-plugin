# Handoff

This content is loaded when Phase 4 begins — after the requirements-only plan is written.

## 4.1 Present Next-Step Options

The Phase 4 menu's visible option count varies by state: no plan artifact hides the review option, `OUTPUT_FORMAT=html` also hides the review option (`/doc-review` is markdown-only), unresolved `Resolve Before Planning` hides both `Create the implementation plan` and `Ship it autonomously`, and the ship option is hidden for non-software brainstorms (`execution` other than `code`). Count the visible options and choose the rendering mode:

- **Visible count fits the current platform's option cap:** use the platform's blocking question tool (`AskUserQuestion` in Claude Code — call `ToolSearch` with `select:AskUserQuestion` first if its schema is not loaded; `request_user_input` in Codex; `ask_question` in Antigravity CLI (`agy`); `ask_user` in Pi).
- **Visible count exceeds the current platform's option cap:** render as a numbered list in chat. Include a hint that free-form input is accepted ("Pick a number or describe what you want.") so the numbered list retains the blocking tool's open-endedness.

Never silently skip the question.

If `Resolve Before Planning` contains any items:
- Ask the blocking questions now, one at a time, by default.
- If the user explicitly wants to proceed anyway, first convert each remaining item into an explicit decision, assumption, or `Deferred to Planning` question.
- If the user chooses to pause instead, present the handoff as paused or blocked rather than complete.
- Do not offer `Create the implementation plan` or `Ship it autonomously` while `Resolve Before Planning` remains non-empty.

**Path format:** Use absolute paths for chat-output file references — relative paths are not auto-linked as clickable in most terminals.

**Preamble when no blocking questions remain:**

```
Brainstorm complete.

Plan artifact: <absolute path to requirements-only plan>  # omit line if no artifact was created

What would you like to do next? (Pick a number or describe what you want.)
```

**Preamble when blocking questions remain and user wants to pause:**

```
Brainstorm paused. Planning is blocked until the remaining questions are resolved.

Plan artifact: <absolute path to requirements-only plan>  # omit line if no artifact was created

What would you like to do next? (Pick a number or describe what you want.)
```

Present only the options that apply. Renumber so visible options stay contiguous starting at 1.

1. **Create the implementation plan** *(recommended)* — continue with `/plan` and sharpen the requirements into a complete, testable plan. Shown only when `Resolve Before Planning` is empty.
2. **Ship it autonomously** — hand the requirements to `/work` for implementation. Shown only for software brainstorms (`execution: code`) with `Resolve Before Planning` empty **and a plan artifact was created**. For a plan-then-decide flow, pick option 1 instead.
3. **Pressure-test the requirements** — dispatch `/doc-review` to find gaps, conflicts, weak premises, and scope issues in the requirements; auto-apply safe fixes; route the rest interactively. Shown only when a markdown plan exists **and `OUTPUT_FORMAT=md`** — `/doc-review` applies markdown-only mutations and would corrupt an HTML artifact. Under HTML mode, surface a one-line note above the menu: `Requirements review unavailable in output:html mode — /doc-review is markdown-only today. Switch to output:md if you want a review pass.`
4. **Open in browser** — open the HTML plan locally for review and sharing. Shown only when an HTML plan exists.
5. **More clarifying questions to sharpen the doc** — keep refining scope, edge cases, constraints, and preferences through further dialogue. Always shown.
6. **Done** — the conversation was the value; no artifact or handoff needed. Always shown.

**Post-review nudge (subsequent rounds only):** If the user has already run `/doc-review` this session and residual P0/P1 findings remain unaddressed, add a one-line prose nudge adjacent to the menu (e.g., "Document review flagged 2 P1 findings you may want to address — pick \"Pressure-test the requirements\" to run another pass."). Reference the option by label, not number. Suppress this nudge when `OUTPUT_FORMAT=html`.

## 4.2 Handle the Selected Option

Selections may be the literal option label or the option number. Match numbers against the currently-rendered (post-trim) list. Free-form input that does not match an option or describe an alternative action should be treated as clarification — ask a follow-up rather than guessing.

**If user selects "Create the implementation plan":**

Immediately load `/plan` in the current session. Pass the plan artifact path when one exists; otherwise pass a concise summary of the finalized brainstorm decisions. When the Phase 1.1 grounding scout produced a dossier and the file still exists, also pass its path (`/tmp/odin/brainstorm/<run-id>/grounding.md`). Do not print the closing summary first.

**If user selects "Ship it autonomously":**

Immediately load `/work` in the current session, passing the plan artifact path as its input. `/work` then owns implementation. Do not also start another implementation skill directly.

Where the host exposes no skill-invocation primitive, print the `/work <plan-path>` invocation for the user to run.

Do not print the closing summary first.

**If user selects "Pressure-test the requirements":**

Load `/doc-review`, passing the plan path as the argument. When `/doc-review` returns "Review complete", return to the Phase 4 options and re-render the menu. If residual P0/P1 findings remain unaddressed, include the post-review nudge above the menu. Do not show the closing summary yet.

**If user selects "More clarifying questions to sharpen the doc":**

Return to Phase 1.3 (Collaborative Dialogue) and continue asking the user clarifying questions one at a time to further refine scope, edge cases, constraints, and preferences. Continue until the user is satisfied, then return to Phase 4. Do not show the closing summary yet.

**If user selects "Open in browser":**

Display the absolute path to the `.html` plan so the user can open it locally. Where the platform exposes a browser-opening primitive (e.g., `open` on macOS, `xdg-open` on Linux, `start` on Windows), the agent may invoke it directly; otherwise print the absolute path and let the user open it. After the path is displayed or the browser is opened, return to the Phase 4 options.

**If user selects "Done" or indicates they are finished** (says "done"/"that's all", or dismisses the menu without picking an option): display the closing summary and end the turn.

## 4.3 Closing Summary

Use the closing summary only when this run is ending or handing off, not when returning to the Phase 4 options.

In both templates below, substitute `<absolute path to plan>` with the actual file path written this run — `.md` for `OUTPUT_FORMAT=md`, `.html` for `OUTPUT_FORMAT=html`. Do not emit a hardcoded `.md` path when the artifact is HTML.

When complete and ready for planning, display:

```text
Brainstorm complete!

Plan artifact: <absolute path to plan>  # omit line if no artifact was created

Key decisions:
- [Decision 1]
- [Decision 2]

Recommended next step: `/plan <plan artifact path>`
```

If the user pauses with `Resolve Before Planning` still populated, display:

```text
Brainstorm paused.

Plan artifact: <absolute path to plan>  # omit line if no artifact was created

Planning is blocked by:
- [Blocking question 1]
- [Blocking question 2]

Resume with `/brainstorm` when ready to resolve these before planning.
```
