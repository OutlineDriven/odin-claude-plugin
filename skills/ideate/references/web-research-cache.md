# Web Research Cache

Read this when checking the cache before dispatching web research, or when appending fresh research to the cache after dispatch. The behavior here is conditional — most invocations either hit the cache or write to it once and move on.

## Cache file shape

```json
[
  {
    "key": {
      "mode": "repo",
      "focus_hint_normalized": "<lowercase, whitespace-collapsed focus hint or empty string>",
      "topic_surface_hash": "<short hash of the user-supplied topic surface>"
    },
    "result": "<web research output as plain text>",
    "ts": "<iso8601>"
  }
]
```

Files live under `/tmp/odin-ideate/<run-id>/web-research-cache.json`, resolved once in Phase 1.

## Reuse check

Before dispatching web research, check for existing cache files across sibling run-id directories under `/tmp/odin-ideate/`. Refinement loops within a session may legitimately reuse another run's cache by topic, not run-id. List all `web-research-cache.json` files under the scratch root. An empty listing is a valid first-run cache miss and must not abort the reuse-check step.

Read each matching file. If any entry's `key` matches the current dispatch (same mode, same case-insensitive normalized focus hint, same topic surface hash), skip the dispatch and pass the cached `result` to the consolidated grounding summary. Note in the summary: "Reusing prior web research from this session — say 're-research' to refresh."

On `re-research` override, delete the matching entry and dispatch fresh.

## Append after fresh dispatch

After a fresh dispatch, append the new result to the current run's cache file at `/tmp/odin-ideate/<run-id>/web-research-cache.json` using the absolute path from Phase 1 (create directory and file if needed). The next invocation in the session can reuse it.

## Topic surface hash

The topic surface is the user-supplied content the web research is grounded on: the focus hint plus a stable repo discriminator. This keeps the cache key meaningful when focus is empty — two bare-prompt invocations in the same repo legitimately share research, but the key still differentiates repos. Resolve the discriminator with this fallback chain and hash the result (first 8 hex chars of sha256 is sufficient):

1. `git remote get-url origin` — stable across machines, correct for collaborators on the same remote.
2. `git rev-parse --show-toplevel` — absolute repo path; machine-local but always available in a git checkout.
3. The current working directory's absolute path — last resort when not in a git repo.

Normalize before hashing: lowercase, collapse whitespace. (The repo discriminator hash is computed from the raw command output; only the focus hint and topic text are normalized.)

## Degradation

If the cache file is unreachable across invocations on the current platform (filesystem isolation, sandboxing, ephemeral working directory), degrade to "no reuse, dispatch every time." Surface the limitation in the consolidated grounding summary and proceed without reuse rather than inventing a capability the platform may not have.
