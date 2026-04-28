# Session Signal Heuristics

Rules for deciding which transcript turns yield save-worthy memory proposals.
`scan-session.sh` applies these patterns to JSONL session files.

## Turn structure (Claude Code JSONL)

Each line is a JSON object. Relevant fields:

```json
{
  "type": "user" | "assistant" | "tool_result" | ...,
  "uuid": "<turn-id>",
  "message": {
    "role": "user" | "assistant",
    "content": "<string>" | [{"type": "text", "text": "..."}, ...]
  }
}
```

Extract text from content: if content is a list, join `text` fields of `type=text` blocks.

## Positive signals (propose a memory)

### feedback — user correction

User message text matches any of:
- `"don't"`, `"stop"`, `"never"`, `"avoid"` followed by an action phrase
- `"not that"`, `"not like that"`, `"wrong"` in a short correction
- `"I said"`, `"I told you"` (implies prior rule was forgotten)
- `"no,"` as the first word followed by a correction
- Rejected tool use in the turn immediately before (type contains tool_result with error/denial)

Proposed type: **feedback**

### feedback — user confirmation of non-obvious approach

User message text matches:
- `"yes, exactly"`, `"perfect"`, `"keep doing that"`, `"that's right"`
- Short affirmations immediately following an assistant turn that made an unusual or non-default choice

Only propose if the assistant's immediately preceding turn contained a decision or approach word (`"chose"`, `"instead"`, `"rather than"`, `"prefer"`).

Proposed type: **feedback**

### user — preference or role revealed

User message reveals role, expertise, or preference not already in a user memory:
- `"I'm a"`, `"I work as"`, `"I've been using X for N years"`
- `"I prefer"`, `"I like"`, `"I always"`

Proposed type: **user**

### project — work decision or deadline

User message states a decision or time-bounded context:
- `"we're doing X because"`, `"the reason we"`, `"we decided to"`
- Date-anchored facts: `"by Thursday"`, `"before the release"`, `"this sprint"`
- `"freeze"`, `"deadline"`, `"cut a branch"`, `"ship"` paired with a date or event

Convert any relative date to absolute (resolve against the session's timestamp in `cwd`/`timestamp` fields).

Proposed type: **project**

### reference — external system pointer

User message points to an external resource by name or URL:
- `"check"` / `"look at"` / `"tracked in"` followed by a system name (Linear, Jira, Grafana, Slack)
- A URL that is not a code reference (no `github.com/<repo>/blob`)
- `"the board at"`, `"the channel"`, `"the dashboard"`

Proposed type: **reference**

### Explicit marker

Any content in either role containing:
```
[saves <type> memory: ...]
```

Extract the type and the bracketed description as the basis for the proposal.

Proposed type: whatever `<type>` is.

## Negative signals (skip — do not propose)

- Turns that are pure code, shell commands, or tool output with no explanatory text
- Questions from the user (ends with `?`) — these are inquiries, not rules
- Transient task state: `"now do X"`, `"next step is"`, `"let's also add"`
- Single-word responses: `"ok"`, `"sure"`, `"thanks"`, `"yes"` without follow-up context
- Code review or debugging back-and-forth without any stated preference
- Any turn that simply restates something already captured in an existing memory (check `rg -l -F` first)

## Confidence threshold

Propose only when the signal is clear enough that the user would say "yes, that's right" to the draft without editing more than a sentence. When ambiguous, surface the turn to the user with a note: "I'm less certain about this one — does it deserve a memory?"
