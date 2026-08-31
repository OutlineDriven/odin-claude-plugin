---
name: x-api-mcp-guide
description: 'Use when calling or troubleshooting the X MCP integration. Read this before any X call and on any X error. Return correct bounded X calls without futile retry. Don''t use for tasks that require source or remote-system changes.'
---

# X API MCP guide

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Use or troubleshoot the X MCP integration |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation; no secrets; no app or project creation |
| Side effect | Chat output only: guidance and error messages |
| Done | Correct bounded X calls without futile retry |

## Inputs

- **Required**: the user's X ask (post, handle, topic, timeline, bookmarks, news, trends, user lookup, or a link/ID to parse)
- **Optional**: `references/pricing.md` (inline below; live pricing from https://console.x.com/api/credits/pricing wins)
- **Optional**: `session_state.capabilities_sent` (omit for first turn)

## Procedure

1. **First turn only.** If `session_state.capabilities_sent` is absent or false, send the capabilities message below once, set `session_state.capabilities_sent = true`, then continue.

   > You're connected to X. Here's what I can do:
   >
   > - **Your account** — your profile, home timeline, your posts, and mentions
   > - **Posts** — open any post from a link, and see who liked, reposted, or quoted it
   > - **Users** — look up any account by handle, search for users, and read their posts
   > - **Search** — search posts across X and count post volume on a topic
   > - **News & trends** — search X news stories and get trends by location
   > - **Bookmarks** — list, add, and remove bookmarks, and organize them into folders
   >
   > Requests use credits: you'll need to purchase credits at https://console.x.com for this to work. I'll show you a cost estimate before anything expensive.

2. **Resolve the current user.** Call `xd://mcp__x_get_users_me` with `user.fields=id,name,username,description,public_metrics`. Match the result:

   | Result | Next |
   |---|---|
   | Success | Cache `id` as `{me}`. Proceed to step 3. |
   | Error with `type` / `reason` matching Error 1, 2, or 3 below | Stop. Return that error's fixed message. Do not search or call any other X tool. |
   | 200 with `errors[]` in body | Ignore `errors[]`. Keep `data`. Proceed with `{me}`. |

3. **Parse the user's ask.**

   | Input | Action |
   |---|---|
   | `@handle` | User search for that handle; one match → use that `id` |
   | Post URL or `/status/{id}` | Parse the status ID |
   | Bookmarks, timeline, or mentions | Use `{me}` as the user id |
   | Bookmark folder | List folders on `{me}`; if none provided, ask which folder |
   | News | Execute news search; if no topic, ask |
   | Topic search | Rewrite as X search query; if no query, ask |
   | Any other ask | Handle directly; fall back to asking for a link or handle |

4. **Estimate cost before any X MCP call.** Read `references/pricing.md` below. For live prices: https://console.x.com/api/credits/pricing wins over the pinned reference.

   Estimate = (resources requested × per-resource price) + per-request price. Each pagination page is billed again. Expanded returned objects are billed. Failed requests are not billed.

   | Threshold | Action |
   |---|---|
   | Under $0.25 | Proceed with `max_results` of 10–25 unless the user asked for more |
   | $0.25 or over, pagination loop, or bulk lookup | Stop. Give a one-line dollar estimate and ask for confirmation before proceeding. If cumulative spend will roughly double the estimate, stop and reconfirm |

5. **Call the X MCP tool.** Use `xd://mcp__x_*` device routes. Set appropriate `max_results` and request these fields:

   - Tweet fields: `created_at,public_metrics,author_id,lang,conversation_id`
   - User fields: `created_at,description,public_metrics,verified,location`
   - Expansions: `author_id,referenced_tweets.id`

   Use `meta.next_token` → `pagination_token` for pagination. Stop when `meta.next_token` is absent.

   Prefer recent data (7-day window), then `{me}` reads, then small full-archive pages. Do not paginate unless the user asked for it.

6. **Handle the response.**

   | Condition | Action |
   |---|---|
   | Tool call success | Return the parsed data to the user |
   | 401 / `login-failed` / `token-refresh-failed` | Return Error 1 message below. Stop. Do not retry. |
   | 403 with `client-forbidden`, `user-not-enrolled`, or `client-not-enrolled` | Return Error 2 message below. Stop. Do not retry. |
   | Credits exhausted / balance zero or negative / `credits-blocked` | Return Error 3 message below. Stop. Do not retry. |
   | `usage-capped` (no enrollment reason) | Return "You hit a limit. Try again later." |
   | `not-authorized-for-resource` | Return Error 4 message below. Stop. |
   | `resource-not-found` | Ask the user for a handle, profile link, or post link. Do not retry the same id. |
   | 429 `rate-limit-exceeded` | Wait for `x-rate-limit-reset`. Reduce `max_results`. Retry once. |
   | 400 `invalid-request` | Report the error to the user. Do not retry unchanged. |
   | 5xx | Back off. If it keeps failing, direct to https://developer.x.com/status |
   | 200 with `errors[]` | Keep `data`; ignore `errors[]` |

## Failure and recovery
**Failure class: unresolved error.** The skill did not achieve the done predicate. The user receives a fixed message and the session stops making X calls for this ask.

**Partial-result rule:** If a tool returns 200 with partial data and no error type, return the data. Do not treat partial success as failure.

**Non-retry rule for specific errors:** 401 / 403 enrollment / credits-blocked: never retry unchanged. Rate-limit 429: retry once with reduced scope only.

**Blocked result:** Futile retry loops on auth, enrollment, or quota errors are not a valid completion. The skill is done only when the user either gets their data or receives a fixed error message with a clear next step.

## Output
- The requested X data (posts, user profiles, timeline, bookmarks, search results, news, trends, counts, or parsed IDs), or
- One of the fixed error messages below, followed by a suggested next step that does not involve retrying the same failed call, or
- A confirmation prompt for estimated cost over $0.25.

Fixed error messages:

1. **Sign-in failed (401):** "You're not signed in to X. Reconnect the X plugin in this chat. Don't paste keys or passwords. Then I'll retry."

2. **Not onboarded (403):** "This X account isn't set up yet. Go to https://console.x.com, register and onboard with this same X account, then come back and I'll retry."

3. **Out of credits:** "You're out of credits. Go to https://console.x.com and add credits, then I'll retry."

4. **Private account:** "I can't open that. If it's yours, reconnect X. If it's someone else's private account, I don't have access."

## Provenance

- **Origin:** cursor/plugins `third_party/x` skill blob — outside the 63 manifest-backed marketplace plugins
- **Source paths:** `third_party/x/skills/x-api-mcp-guide/SKILL.md`, `third_party/x/skills/x-api-mcp-guide/references/pricing.md`
- **Pinned revision:** `68836ddaf5697224520f1847d90cdb90ca8babaa`
- **License:** MIT — inherited from the cursor/plugins root README declaration
- **Adaptation:** ODIN voice, contract table, ODIN section order, ODIN failure taxonomy, authority translated to operational language, pricing reference inlined as support content, model+human invocation flag applied.

### references/pricing.md

Live pricing from `https://console.x.com/api/credits/pricing` wins. Pinned reference prices at `68836ddaf5697224520f1847d90cdb90ca8babaa`:

| Tool class | Cost |
|---|---|
| `get_users_me` | free |
| user lookup/search | $0.01 per user |
| post lookup/search | $0.005 per post |
| own timelines/bookmarks | $0.001 per post |
| reposting-user lookup | $0.01 per user |
| liking-user lookup | free |
| recent post count | $0.005 per call |
| bookmark write/delete | $0.005 per call |
| bookmark folders | free |
| news | $0.005 per story |
| trends | $0.01 per call |

Writes: standard post $0.015; post containing URL $0.20; summoned reply/quote $0.01; post delete $0.005; like $0.015; unlike $0.01; repost $0.015; undo repost $0.005; follow $0.015; unfollow $0.01; mute $0.01; unmute $0.005. Failed requests are not billed. Expanded returned objects are billed. Keep requested object counts and expansions bounded.
