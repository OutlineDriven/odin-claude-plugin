# Auto-invoke trigger conditions per skill

Each skill that produces a verified non-trivial outcome should invoke `/autolearn` to evaluate whether a durable learning is warranted. The reject-by-default gate still applies.

| Skill | Trigger condition |
|---|---|
| `work` | After a shipped implementation slice |
| `resolve-pr-feedback` | After a resolved PR review thread |
| `commit-push-pr` | After a merged PR |
| `brainstorm` | After a brainstorm doc that surfaced non-obvious decisions |
| `pov` | After a verdict that changed a technology decision |
| `compound` | After writing a solution doc |
| `reviews` (deep mode) | After a deep review that surfaced non-obvious findings |
| `debug` | After a resolved bug with a non-trivial root cause |
| `simplify` | After a simplification that preserved behavior in a non-obvious way |
| `optimize` | After an optimization with measured improvement |
| `plans` | After a plan that revealed non-obvious architectural decisions |
| `strategy` | After a strategy doc that clarified non-obvious positioning |
| `ideate` | After an ideation that surfaced non-obvious directions |
