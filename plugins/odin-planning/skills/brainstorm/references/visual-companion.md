# Visual companion (interactive)

Read this reference only in mode `visual` when the user approved a browser view and wants to pick by clicking inside the browser. For a display-only sketch whose feedback returns in chat, use `references/visual-probes.md` instead.

Invocation policy: `model+human`. Offer the browser once and start it only after the user approves.

Use Bun exactly `1.4.0`. The runtime files below use no package dependency.

## Procedure

1. **Bind the runtime and process authority.** Require `bun --version` to print exactly `1.4.0`. Require the host managed-process primitive to support launch, output/readiness, exit status, and stop by the same name. A shell background job, `nohup`, PID file, `/proc` inspection, or ad hoc signal is not a substitute. On either prerequisite failure, return `runtime-unavailable` without creating a session.

2. **Create the session directory.** Validate the idle timeout, then use one embedded Bun helper to create a never-reused project-local session. The helper canonicalizes the existing project root before its first write, creates `.odin` and `brainstorm` one component at a time, rejects symlinks and non-directories, verifies each canonical direct-parent relationship, creates the random session exclusively, and returns its canonical path. Any failure aborts before runtime files are written.

   ```sh
   IDLE_TIMEOUT_MINUTES="${IDLE_TIMEOUT_MINUTES:-240}"
   case "$IDLE_TIMEOUT_MINUTES" in
     ''|*[!0-9]*) printf '%s\n' 'idle timeout must be an integer from 1 through 1440' >&2; exit 1 ;;
   esac
   if [ "$IDLE_TIMEOUT_MINUTES" -lt 1 ] || [ "$IDLE_TIMEOUT_MINUTES" -gt 1440 ]; then
     printf '%s\n' 'idle timeout must be an integer from 1 through 1440' >&2
     exit 1
   fi
   SESSION_ID="$(bun -e 'import { randomBytes } from "node:crypto"; process.stdout.write(randomBytes(12).toString("hex"))')"
   case "$SESSION_ID" in (*[!0-9a-f]*|'') printf '%s\n' 'session ID generation failed' >&2; exit 1;; esac
   PROCESS_NAME="visual-brainstorm-companion-$SESSION_ID"
   IDLE_TIMEOUT_MS="$((IDLE_TIMEOUT_MINUTES * 60000))"
   umask 077
   if ! SESSION_DIR="$(PROJECT_DIR="$PROJECT_DIR" SESSION_ID="$SESSION_ID" bun -e '
     import { lstat, mkdir, realpath } from "node:fs/promises";
     import { basename, dirname, join, resolve } from "node:path";

     const projectInput = process.env.PROJECT_DIR;
     const sessionId = process.env.SESSION_ID;
     if (!projectInput) throw new Error("PROJECT_DIR is required");
     if (!sessionId || !/^[0-9a-f]{24}$/.test(sessionId)) throw new Error("invalid session ID");

     const projectDir = await realpath(resolve(projectInput));
     const projectStat = await lstat(projectDir);
     if (!projectStat.isDirectory() || projectStat.isSymbolicLink()) throw new Error("invalid project directory");

     async function secureContainer(parent: string, name: string): Promise<string> {
       const candidate = join(parent, name);
       try {
         await mkdir(candidate, { mode: 0o700 });
       } catch (error) {
         if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") throw error;
       }
       const stat = await lstat(candidate);
       if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${name} must be a real directory`);
       const canonical = await realpath(candidate);
       if (dirname(canonical) !== parent || basename(canonical) !== name) throw new Error(`${name} escapes its direct parent`);
       return canonical;
     }

    const odinDir = await secureContainer(projectDir, ".odin");
    const brainstormDir = await secureContainer(odinDir, "brainstorm");
     const sessionName = `session-${sessionId}`;
     const sessionDir = join(brainstormDir, sessionName);
     await mkdir(sessionDir, { mode: 0o700 });
     const canonicalSession = await realpath(sessionDir);
     if (dirname(canonicalSession) !== brainstormDir || basename(canonicalSession) !== sessionName) throw new Error("session escapes brainstorm directory");
     await mkdir(join(canonicalSession, "screens"), { mode: 0o700 });
     await mkdir(join(canonicalSession, "state"), { mode: 0o700 });
     process.stdout.write(canonicalSession);
   ')"; then
     printf '%s\n' 'secure project-local session creation failed' >&2
     exit 1
   fi

   ```

   Do not reuse a session or process name. The session directory and any container directories created for it are retained project-local state; never recursively delete `/tmp` or the project session.

3. **Resolve the server and materialize the two session helpers.** Resolve `scripts/visual-companion-server.ts` relative to the `SKILL.md` that named this reference. Run this exact zero-dependency Bun 1.4.0 server in place; do not copy or edit it. Use the file-creation tool, not shell interpolation, to write the exact `publish-fragment.ts` and `read-events.ts` helpers below into the session directory.

   `$SESSION_DIR/publish-fragment.ts`:

   ```ts
   import { constants } from "node:fs";
   import { lstat, open, realpath, rename } from "node:fs/promises";
   import { basename, dirname, join, resolve } from "node:path";
   import { TextDecoder } from "node:util";

   const MAX_INFO = 16 * 1024;
   const MAX_FRAGMENT = 1024 * 1024;
   const decoder = new TextDecoder("utf-8", { fatal: true });

   async function readBounded(path: string, maximum: number): Promise<string> {
     const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
     try {
       const before = await handle.stat({ bigint: true });
       if (!before.isFile() || before.nlink !== 1n || before.size > BigInt(maximum)) throw new Error("file rejected");
       const length = Number(before.size);
       const bytes = Buffer.alloc(length + 1);
       let offset = 0;
       while (offset < bytes.byteLength) {
         const result = await handle.read(bytes, offset, bytes.byteLength - offset, offset);
         if (result.bytesRead === 0) break;
         offset += result.bytesRead;
       }
       const after = await handle.stat({ bigint: true });
       if (
         offset !== length ||
         !after.isFile() ||
         after.nlink !== 1n ||
         after.dev !== before.dev ||
         after.ino !== before.ino ||
         after.size !== before.size ||
         after.mtimeNs !== before.mtimeNs ||
         after.ctimeNs !== before.ctimeNs
       ) throw new Error("file changed during read");
       return decoder.decode(bytes.subarray(0, length));
     } finally {
       await handle.close();
     }
   }

   const [sessionArgument, temporaryName, finalName] = process.argv.slice(2);
   if (!sessionArgument || !temporaryName || !finalName) {
     throw new Error("usage: bun publish-fragment.ts SESSION_DIR TEMP_NAME FINAL_NAME");
   }
   if (basename(temporaryName) !== temporaryName || basename(finalName) !== finalName) throw new Error("direct names required");
   if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,126}\.tmp$/.test(temporaryName)) throw new Error("invalid temporary name");
   if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,126}\.html$/.test(finalName)) throw new Error("invalid final name");
   if (temporaryName.slice(0, -4) !== finalName.slice(0, -5)) throw new Error("temporary and final names must share one fresh base");

   const sessionDir = await realpath(resolve(sessionArgument));
   const screenDir = await realpath(join(sessionDir, "screens"));
   const stateDir = await realpath(join(sessionDir, "state"));
   if (dirname(screenDir) !== sessionDir || dirname(stateDir) !== sessionDir) throw new Error("invalid session layout");
   const info = JSON.parse(await readBounded(join(stateDir, "server-info.json"), MAX_INFO)) as Record<string, unknown>;
   if (info.session_dir !== sessionDir || info.screen_dir !== screenDir || info.state_dir !== stateDir) throw new Error("server info does not match session");
   if (typeof info.origin !== "string" || typeof info.key !== "string" || !/^[0-9a-f]{64}$/.test(info.key)) throw new Error("invalid server info");
   const originUrl = new URL(info.origin);
   if (originUrl.protocol !== "http:" || originUrl.hostname !== "127.0.0.1" || !originUrl.port || originUrl.origin !== info.origin) {
     throw new Error("invalid loopback origin");
   }
   const authorization = `Bearer ${info.key}`;

   const health = await fetch(`${info.origin}/health`, { headers: { authorization } });
   if (!health.ok) throw new Error(`authenticated health failed: ${health.status}`);
   const healthValue = await health.json() as Record<string, unknown>;
   if (healthValue.ok !== true) throw new Error("authenticated health failed");

   const temporaryPath = join(screenDir, temporaryName);
   const finalPath = join(screenDir, finalName);
   try {
     await lstat(finalPath);
     throw new Error("final fragment already exists");
   } catch (error) {
     if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
   }
   const handle = await open(temporaryPath, constants.O_RDWR | constants.O_NOFOLLOW);
   try {
     const before = await handle.stat({ bigint: true });
     if (!before.isFile() || before.nlink !== 1n || before.size > BigInt(MAX_FRAGMENT)) throw new Error("temporary fragment rejected");
     await handle.chmod(0o600);
     await handle.sync();
     const after = await handle.stat({ bigint: true });
     if (
       !after.isFile() ||
       after.nlink !== 1n ||
       after.dev !== before.dev ||
       after.ino !== before.ino ||
       after.size !== before.size ||
       after.mtimeNs !== before.mtimeNs
     ) throw new Error("temporary fragment changed before publication");
   } finally {
     await handle.close();
   }
   await rename(temporaryPath, finalPath);
   const directory = await open(screenDir, constants.O_RDONLY | constants.O_DIRECTORY);
   try {
     await directory.sync();
   } finally {
     await directory.close();
   }

   const response = await fetch(`${info.origin}/publish`, {
     method: "POST",
     headers: {
       authorization,
       origin: info.origin,
       "content-type": "application/json",
     },
     body: JSON.stringify({ screen: finalName }),
   });
   if (!response.ok) throw new Error(`publish failed after atomic fragment publication: ${response.status} ${await response.text()}`);
   const result = await response.json() as Record<string, unknown>;
   if (result.ok !== true || result.screen !== finalName || !Number.isSafeInteger(result.generation)) {
     throw new Error("invalid publish response");
   }
   console.log(JSON.stringify(result));

   ```

   `$SESSION_DIR/read-events.ts`:

   ```ts
   import { randomBytes } from "node:crypto";
   import { constants } from "node:fs";
   import { open, realpath, rename, unlink } from "node:fs/promises";
   import { basename, dirname, join, resolve } from "node:path";
   import { TextDecoder } from "node:util";

   const MAX_EVENTS = 256 * 1024;
   const MAX_CURSOR = 64;
   const decoder = new TextDecoder("utf-8", { fatal: true });

   async function writeAll(handle: Awaited<ReturnType<typeof open>>, bytes: Uint8Array): Promise<void> {
     let offset = 0;
     while (offset < bytes.byteLength) {
       const result = await handle.write(bytes, offset, bytes.byteLength - offset, offset);
       if (result.bytesWritten < 1) throw new Error("short write");
       offset += result.bytesWritten;
     }
   }

   async function atomicCursor(path: string, cursor: number): Promise<void> {
     const temporary = join(dirname(path), `.${basename(path)}.${randomBytes(12).toString("hex")}.tmp`);
     const handle = await open(
       temporary,
       constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
       0o600,
     );
     let renamed = false;
     try {
       await writeAll(handle, Buffer.from(`${cursor}\n`, "utf8"));
       await handle.sync();
       await handle.close();
       await rename(temporary, path);
       renamed = true;
       const directory = await open(dirname(path), constants.O_RDONLY | constants.O_DIRECTORY);
       try {
         await directory.sync();
       } finally {
         await directory.close();
       }
     } finally {
       await handle.close().catch(() => undefined);
       if (!renamed) await unlink(temporary).catch(() => undefined);
     }
   }

   async function readCursor(path: string): Promise<number> {
     let handle: Awaited<ReturnType<typeof open>>;
     try {
       handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
     } catch (error) {
       if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
       throw error;
     }
     try {
       const before = await handle.stat({ bigint: true });
       if (!before.isFile() || before.nlink !== 1n || before.size > BigInt(MAX_CURSOR)) throw new Error("cursor rejected");
       const bytes = Buffer.alloc(Number(before.size) + 1);
       let offset = 0;
       while (offset < bytes.byteLength) {
         const result = await handle.read(bytes, offset, bytes.byteLength - offset, offset);
         if (result.bytesRead === 0) break;
         offset += result.bytesRead;
       }
       const after = await handle.stat({ bigint: true });
       if (
         offset !== Number(before.size) ||
         after.dev !== before.dev ||
         after.ino !== before.ino ||
         after.size !== before.size ||
         after.mtimeNs !== before.mtimeNs ||
         after.ctimeNs !== before.ctimeNs
       ) throw new Error("cursor changed during read");
       const text = decoder.decode(bytes.subarray(0, offset)).trim();
       if (!/^(0|[1-9][0-9]*)$/.test(text)) throw new Error("invalid cursor");
       const value = Number(text);
       if (!Number.isSafeInteger(value)) throw new Error("invalid cursor");
       return value;
     } finally {
       await handle.close();
     }
   }

   function validEvent(value: unknown): value is {
     event_id: string;
     type: "choice";
     choice: string;
     label: string;
     screen: string;
     generation: number;
     timestamp: number;
   } {
     if (!value || typeof value !== "object" || Array.isArray(value)) return false;
     const event = value as Record<string, unknown>;
     const keys = Object.keys(event).sort().join(",");
     return keys === "choice,event_id,generation,label,screen,timestamp,type" &&
       typeof event.event_id === "string" && /^[0-9a-f]{32}$/.test(event.event_id) &&
       event.type === "choice" &&
       typeof event.choice === "string" && event.choice.length > 0 && event.choice.length <= 256 &&
       typeof event.label === "string" && event.label.length > 0 && event.label.length <= 512 &&
       typeof event.screen === "string" && event.screen.length > 0 && event.screen.length <= 132 &&
       Number.isSafeInteger(event.generation) && (event.generation as number) >= 1 &&
       Number.isSafeInteger(event.timestamp) && (event.timestamp as number) >= 0;
   }

   const [stateArgument, expectedScreen, generationArgument] = process.argv.slice(2);
   if (!stateArgument || !expectedScreen || !generationArgument) {
     throw new Error("usage: bun read-events.ts STATE_DIR EXPECTED_SCREEN EXPECTED_GENERATION");
   }
   if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,126}\.html$/.test(expectedScreen)) throw new Error("invalid expected screen");
   const expectedGeneration = Number(generationArgument);
   if (!Number.isSafeInteger(expectedGeneration) || expectedGeneration < 1) throw new Error("invalid expected generation");

   const stateDir = await realpath(resolve(stateArgument));
   if (basename(stateDir) !== "state") throw new Error("invalid state directory");
   const eventsPath = join(stateDir, "events.jsonl");
   const cursorPath = join(stateDir, "events.cursor");
   const cursor = await readCursor(cursorPath);
   const handle = await open(eventsPath, constants.O_RDONLY | constants.O_NOFOLLOW);
   try {
     const before = await handle.stat({ bigint: true });
     if (!before.isFile() || before.nlink !== 1n || before.size > BigInt(MAX_EVENTS)) throw new Error("event log rejected");
     const snapshotSize = Number(before.size);
     if (cursor > snapshotSize) throw new Error("cursor exceeds event log");
     const bytes = Buffer.alloc(snapshotSize - cursor);
     let offset = 0;
     while (offset < bytes.byteLength) {
       const result = await handle.read(bytes, offset, bytes.byteLength - offset, cursor + offset);
       if (result.bytesRead === 0) throw new Error("event log truncated during read");
       offset += result.bytesRead;
     }
     const after = await handle.stat({ bigint: true });
     if (
       !after.isFile() ||
       after.nlink !== 1n ||
       after.dev !== before.dev ||
       after.ino !== before.ino ||
       after.size < before.size ||
       after.size > BigInt(MAX_EVENTS)
     ) throw new Error("event log changed unsafely during read");

     const lastNewline = bytes.lastIndexOf(0x0a);
     if (lastNewline < 0) {
       console.log("[]");
     } else {
       const complete = bytes.subarray(0, lastNewline + 1);
       const matches: unknown[] = [];
       for (const line of decoder.decode(complete).split("\n")) {
         if (!line) continue;
         try {
           const value: unknown = JSON.parse(line);
           if (validEvent(value) && value.screen === expectedScreen && value.generation === expectedGeneration) {
             matches.push(value);
           }
         } catch {
           throw new Error("malformed complete event record");
         }
       }
       await atomicCursor(cursorPath, cursor + lastNewline + 1);
       console.log(JSON.stringify(matches));
     }
   } finally {
     await handle.close();
   }

   ```

4. **Launch through the host manager and prove readiness.** Launch `bun "<skill-directory>/scripts/visual-companion-server.ts"` only through the managed-process primitive under the exact stable name in `$PROCESS_NAME`. Add only `SESSION_DIR`, `PROCESS_NAME`, and `IDLE_TIMEOUT_MS` to its environment. Use the primitive's output reader until it emits one complete `READY {…}` line. Treat process exit or no readiness line within 10 seconds as `server-start-failure`; read the managed output and stop there.

   Save the emitted `screen_dir`, `state_dir`, `origin`, and process name. After readiness, read the mode-0600 `$SESSION_DIR/state/server-info.json` with the host file reader. Validate that its `process_name`, `session_dir`, `screen_dir`, `state_dir`, and `origin` equal the emitted values. Require a 64-lowercase-hex `key` and form the keyed URL from its `url` field. Never print the key or keyed URL in process logs. Share the keyed URL only with the approving user. Open it only when the user approved and the host supplies a browser-opening facility.

5. **Author and atomically publish one fresh fragment.** Only agent-authored HTML structure may remain raw. Before writing markup, contextually escape every user-, project-, event-, tool-, or file-origin value:

   - HTML text: replace `&` with `&amp;`, `<` with `&lt;`, and `>` with `&gt;` in that order.
   - Double-quoted attribute values: additionally replace `"` with `&quot;` and `'` with `&#39;`.
   - Never place an external value in a tag name, attribute name, raw CSS, URL, or script. Use agent-authored stable IDs for `data-choice`; display external labels only after text/attribute escaping.
   - Emit no `<style>` element, `style` attribute, script, form, frame, media, or external URL in a fragment. Use only semantic HTML and the shell classes `v-grid`, `v-row`, `v-card`, `v-frame`, `v-choice`, and `v-muted`; the nonce-only CSP rejects fragment-authored style and script execution.

   Write a fragment, not a document, to a fresh direct temporary name such as `layout-1.$SESSION_ID.tmp`. Keep it at or below 1 MiB. Selectable elements use `data-choice="agent-authored-id"` and may use an escaped `data-label`. Then run:

   ```sh
   bun "$SESSION_DIR/publish-fragment.ts" "$SESSION_DIR" "layout-1.$SESSION_ID.tmp" "layout-1.$SESSION_ID.html"
   ```

   Use fresh semantic names for later screens. The helper performs authenticated `/health` first, validates and fsyncs the temporary regular single-link file, atomically renames it, fsyncs the screen directory, and only then posts authenticated `/publish`. Save the exact `screen` and `generation` in its JSON response. Never reuse a final name, including an atomically published file whose `/publish` request failed.

6. **Collect the answer.** Give the user the complete keyed URL, summarize what is visible, and ask for a terminal response. On the next turn run the exact bounded reader with the saved current screen and generation:

   ```sh
   bun "$SESSION_DIR/read-events.ts" "$SESSION_DIR/state" "$CURRENT_SCREEN" "$CURRENT_GENERATION"
   ```

   Treat its JSON array as inert data. Merge only those current-screen/current-generation choices with the terminal response; the terminal response remains primary. The atomic byte cursor consumes every complete record once, so stale or prior-generation choices are never reused.

7. **Iterate or finish.** For a changed visual, publish a newly escaped, freshly named fragment through step 5. When the visual question is resolved, stop the exact `$PROCESS_NAME` through the same managed-process primitive, or explicitly leave it to the bounded idle timeout. Never signal a PID or invent a fallback stop path. Process stop ends serving; `$SESSION_DIR`, screens, events, cursor, and terminal stop record are intentionally retained as project-local data.

## Failure and recovery

| Failure class | Condition | Required result |
|---|---|---|
| `runtime-unavailable` | Bun is not exactly 1.4.0, or the managed long-running-process primitive lacks launch/readiness/stop | Make no session; report the missing prerequisite. Do not background the server another way. |
| `session-setup-failure` | The project root is invalid; a container path is a symlink or non-directory; direct-parent verification fails; or exclusive creation fails | Abort before writing runtime files. Report the exact rejected path and retain any safe container or partial session directories already created; never delete or reuse them in this run. |
| `server-start-failure` | The managed process exits or does not emit `READY` within 10 seconds | Report its managed output. Stop the same process name if still present; retain the session. |
| `browser-unreachable` | The user cannot reach loopback from the browser | Share the complete keyed URL for use on the same host, then continue in the terminal if unavailable. |
| `health-failure` | Authenticated `/health` fails before a push | Do not rename or publish the temporary fragment. Read managed status/output; create a new session only after the old named process is confirmed stopped. |
| `fragment-rejected` | The temporary or final fragment is linked, non-regular, mutable during inspection, invalid UTF-8, or over 1 MiB | Use a fresh bounded regular temporary file and fresh final name. Do not loosen the checks. |
| `publish-failure` | Atomic rename succeeds but authenticated `/publish` fails | Keep the unpublished final file as retained evidence; use a fresh name after liveness is restored. Never reuse it. |
| `event-log-full` | The next complete event would exceed 256 KiB | The server returns 413 before writing. Merge already recorded events or finish in the terminal; do not truncate or replace the open log. |
| `event-read-failure` | The bounded no-follow reader rejects log identity, size, cursor, UTF-8, or unsafe mutation | Treat no browser selection as validated. Keep the terminal answer and retained files; never execute or hand-parse rejected bytes. |
| `managed-stop-failure` | The manager cannot confirm stop for the stable process name | Report the named-process failure and leave all data intact; the server's idle timeout remains armed if it is still running. Never fall back to PID signaling. |

Partial-result rule: after readiness, any failed push or read leaves the named process and retained session explicit. Stop only through the managed primitive. A successful process stop does not delete retained session data, and retained data does not imply the process is still running.

## Output

The keyed loopback URL, retained session/screen/state dirs, current screen and generation, the resolved visual answer with validated browser events merged, process stop/timeout status, and retention notice for project-local data.
