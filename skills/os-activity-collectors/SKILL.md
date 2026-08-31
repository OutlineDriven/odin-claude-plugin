---
name: os-activity-collectors
description: 'Use when recording is active. Emits typed OS activity events into a correlated local timeline persisted as a session bundle. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# OS activity collectors

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Recording is active |
| Authority | Write only named local artifacts; state the rollback path |
| Side effect | Appends only to the local session events.jsonl; clipboard previews are short and hashed |
| Done | A correlated event timeline plus frames persisted as a session bundle that segments into host-level steps |

## Inputs

- **Recording session identifier** — required string; the run that requested activity collection.
- **Session directory** — required path; the working directory into which events.jsonl and session-meta.json are written. Must be writable.
- **Host metadata** — optional map; overrides for hostname, username, platform.

## Procedure

1. **Validate the recording session.** Confirm recording is active before any collector starts. If recording is not active, stop without emitting any event. Done when: recording is confirmed active or the skill stops without emitting.
2. **Initialize the event bus.** Create an empty in-memory event array. Done when: an empty in-memory event array is created.
3. **Append the session-begin frame.** Emit one `{ type: "session-begin", timestamp, sessionId }` object into the event array. Done when: the session-begin frame is in the event array.
4. **Load OS-specific collectors.** Probe the host platform and load the matching collector module implementations:
   - `windows-active-window`: active foreground window title, window ID, process name, and executable path.
   - `windows-url-provider`: URL history entries from the active browser.
   - `clipboard`: current clipboard text content.
   - `window-info`: window dimensions and workspace.
   Done when: the matching collector modules are loaded for the host platform.
5. **Stream events from all collectors.** Run collectors in parallel and pipe each collector's output into the shared event bus. Each emitted event is a plain object containing:
   - `type`: event kind string (`window-focused`, `process-started`, `clipboard-read`, `window-info`, `url-visited`).
   - `timestamp`: ISO 8601 microsecond-precise string.
   - `windowId`: host-OS window handle.
   - `processId`: numeric process identifier.
   - `processName`: string process or application name.
   - `title`: string window title or application label.
   - `metadata`: event-kind-specific extra fields.
   Done when: all collectors are streaming into the shared event bus in parallel.
6. **Hash clipboard content.** Before adding a clipboard event to the bus, compute SHA-256 of the raw text. Store only `{ type: "clipboard-read", hash: "<hex>", length: <byte-count>, timestamp }`. Do not persist raw clipboard text. Done when: clipboard events carry only hash and length, never raw text.
7. **Correlate events into frames.** Group the in-memory event stream by active window context using the correlation rules from `common/correlation.ts`. Emit one `frame` object per host-level step: `{ type: "frame", frameId, windowId, windowTitle, processName, startTime, endTime, eventCount }`. Done when: events are grouped into frames by active window context.
8. **Stop collectors on recording-end signal.** When recording transitions to inactive, flush the current frame and emit one `{ type: "session-end", timestamp }` into the event array. Done when: the current frame is flushed and session-end is emitted.
9. **Persist the event array.** Serialize the event array as newline-delimited JSON (`events.jsonl`) in the session directory. Write a companion `session-meta.json` containing `{ sessionId, startedAt, endedAt, host, eventCount, windowIds, collectorVersion }`. Done when: events.jsonl and session-meta.json are written to the session directory.
10. **Confirm written files exist.** Assert both `events.jsonl` and `session-meta.json` are present and non-empty in the session directory. Done when: both files are confirmed present and non-empty.

## Failure and recovery

- **Collector failure**: stop the failed collector; continue the remaining collectors; record the failure in the metadata file. Do not abort the session.
- **Write failure**: if `events.jsonl` or `session-meta.json` cannot be written, report `collection-failed` and do not emit a session-end frame.
- **Partial-result rule**: if recording stops before all collectors finish, flush and persist all events collected up to the stop signal; discard no event that entered the bus.
- **Rollback path**: on any unrecoverable error, leave no partial event file; the session directory is cleaned by the caller.

## Output

`events.jsonl` (typed activity events and frame boundary markers, one JSON object per line) and `session-meta.json` (session summary: identifier, start/end timestamps, host platform, event counts, collector version, captured window IDs). Terminal status: `collection-complete` with session directory path, or `collection-failed` with error class and last known event count.

## Provenance

- **Origin**: https://github.com/microsoft/skill-recorder
- **Revision**: c7f2fe4402527a0eb7f4fc1b653bf438229bac61
- **License**: MIT — Microsoft Corporation; retain copyright notice and permission notice in all copies. Modified versions must not cause confusion or imply Microsoft sponsorship.
- **Adaptation**: clean-room adaptation of the typed event vocabulary from `common/events.ts` and the correlation logic from `common/correlation.ts`. Pluggable per-OS collector interface from `electron/collectors/index.ts`. OS-specific implementations from `electron/collectors/active-window.ts`, `electron/collectors/clipboard.ts`, `electron/collectors/url-provider.ts`, and `electron/collectors/window-info.ts`. Frame correlation from `electron/frames/correlate.ts`. No expression copied directly; structure and semantics mapped to ODIN 2.0 event schema and local-write authority contract.
