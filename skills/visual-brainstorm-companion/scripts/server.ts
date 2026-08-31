import { randomBytes, timingSafeEqual } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath, rename, unlink } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { TextDecoder } from "node:util";

const MAX_BODY = 16 * 1024;
const MAX_FRAGMENT = 1024 * 1024;
const MAX_EVENTS = 256 * 1024;
const decoder = new TextDecoder("utf-8", { fatal: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function boundedInteger(name: string, minimum: number, maximum: number): number {
  const value = Number(required(name));
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} through ${maximum}`);
  }
  return value;
}

const sessionDir = await realpath(resolve(required("SESSION_DIR")));
const screenDir = await realpath(join(sessionDir, "screens"));
const stateDir = await realpath(join(sessionDir, "state"));
if (dirname(screenDir) !== sessionDir || basename(screenDir) !== "screens") throw new Error("invalid screen directory");
if (dirname(stateDir) !== sessionDir || basename(stateDir) !== "state") throw new Error("invalid state directory");
const processName = required("PROCESS_NAME");
if (!/^visual-brainstorm-companion-[0-9a-f]{24}$/.test(processName)) throw new Error("invalid process name");
const idleTimeoutMs = boundedInteger("IDLE_TIMEOUT_MS", 60_000, 86_400_000);
const key = randomBytes(32).toString("hex");
const eventsPath = join(stateDir, "events.jsonl");
const infoPath = join(stateDir, "server-info.json");
const stoppedPath = join(stateDir, "stopped.json");

async function writeAll(handle: Awaited<ReturnType<typeof open>>, bytes: Uint8Array, append = false): Promise<void> {
  let offset = 0;
  while (offset < bytes.byteLength) {
    const result = await handle.write(bytes, offset, bytes.byteLength - offset, append ? null : offset);
    if (result.bytesWritten < 1) throw new Error("short write");
    offset += result.bytesWritten;
  }
}

async function syncDirectory(path: string): Promise<void> {
  const handle = await open(path, constants.O_RDONLY | constants.O_DIRECTORY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function atomicWrite(path: string, text: string): Promise<void> {
  const temporary = join(dirname(path), `.${basename(path)}.${randomBytes(12).toString("hex")}.tmp`);
  const handle = await open(
    temporary,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  );
  let renamed = false;
  try {
    await writeAll(handle, Buffer.from(text, "utf8"));
    await handle.sync();
    await handle.close();
    await rename(temporary, path);
    renamed = true;
    await syncDirectory(dirname(path));
  } finally {
    await handle.close().catch(() => undefined);
    if (!renamed) await unlink(temporary).catch(() => undefined);
  }
}

const eventsHandle = await open(
  eventsPath,
  constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_APPEND | constants.O_NOFOLLOW,
  0o600,
);
const eventIdentity = await eventsHandle.stat({ bigint: true });
if (!eventIdentity.isFile() || eventIdentity.nlink !== 1n || eventIdentity.size !== 0n) {
  throw new Error("invalid event log");
}
let eventBytes = 0;
let lastActivity = Date.now();
let stopping = false;
let stateQueue: Promise<void> = Promise.resolve();
let current = { screen: "waiting", generation: 0, html: "<p>Waiting for the visual question.</p>" };
const publishedScreens = new Set<string>();

function serialize<T>(action: () => Promise<T>): Promise<T> {
  const result = stateQueue.then(action);
  stateQueue = result.then(() => undefined, () => undefined);
  return result;
}

function suppliedKey(request: Request, url: URL): string {
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) return authorization.slice(7);
  const query = url.searchParams.get("key");
  if (query) return query;
  for (const item of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, value = ""] = item.trim().split("=", 2);
    if (name === "visual_session") return value;
  }
  return "";
}

function keyMatches(candidate: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(candidate)) return false;
  return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(key, "hex"));
}

function exactOrigin(request: Request): boolean {
  return request.headers.get("origin") === origin;
}

class RequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function boundedBody(request: Request): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^[0-9]+$/.test(declared) || Number(declared) > MAX_BODY)) {
    throw new RequestError(413, "request too large");
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY) throw new RequestError(413, "request too large");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  return Buffer.concat(chunks, length);
}

async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = JSON.parse(decoder.decode(await boundedBody(request)));
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, "invalid JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(400, "invalid JSON object");
  return value as Record<string, unknown>;
}

function boundedString(value: unknown, maximum: number): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum) {
    throw new RequestError(400, "invalid string field");
  }
  return value;
}

function sameIdentity(left: Awaited<ReturnType<typeof lstat>>, right: Awaited<ReturnType<typeof lstat>>): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

async function readFragment(name: string): Promise<string> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,126}\.html$/.test(name) || basename(name) !== name) {
    throw new RequestError(400, "invalid screen name");
  }
  const path = join(screenDir, name);
  const listed = await lstat(path, { bigint: true });
  if (!listed.isFile() || listed.isSymbolicLink() || listed.nlink !== 1n || listed.size > BigInt(MAX_FRAGMENT)) {
    throw new RequestError(403, "fragment rejected");
  }
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat({ bigint: true });
    if (!before.isFile() || before.nlink !== 1n || before.size > BigInt(MAX_FRAGMENT) || !sameIdentity(listed, before)) {
      throw new RequestError(403, "fragment rejected");
    }
    const expected = Number(before.size);
    const bytes = Buffer.alloc(expected + 1);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const result = await handle.read(bytes, offset, bytes.byteLength - offset, offset);
      if (result.bytesRead === 0) break;
      offset += result.bytesRead;
    }
    const after = await handle.stat({ bigint: true });
    if (
      offset !== expected ||
      !after.isFile() ||
      after.nlink !== 1n ||
      !sameIdentity(before, after) ||
      after.size !== before.size ||
      after.mtimeNs !== before.mtimeNs ||
      after.ctimeNs !== before.ctimeNs
    ) {
      throw new RequestError(403, "fragment changed during read");
    }
    return decoder.decode(bytes.subarray(0, expected));
  } finally {
    await handle.close();
  }
}

async function appendEvent(input: Record<string, unknown>): Promise<Response> {
  const type = boundedString(input.type, 32);
  const choice = boundedString(input.choice, 256);
  const label = boundedString(input.label, 512);
  const screen = boundedString(input.screen, 132);
  const generation = input.generation;
  if (type !== "choice" || !Number.isSafeInteger(generation) || (generation as number) < 1) {
    throw new RequestError(400, "invalid event");
  }
  if (screen !== current.screen || generation !== current.generation) {
    throw new RequestError(409, "stale screen event");
  }
  const event = {
    event_id: randomBytes(16).toString("hex"),
    type,
    choice,
    label,
    screen,
    generation,
    timestamp: Date.now(),
  };
  const line = Buffer.from(`${JSON.stringify(event)}\n`, "utf8");
  const before = await eventsHandle.stat({ bigint: true });
  if (
    !before.isFile() ||
    before.nlink !== 1n ||
    before.dev !== eventIdentity.dev ||
    before.ino !== eventIdentity.ino ||
    before.size !== BigInt(eventBytes)
  ) {
    throw new Error("event log identity changed");
  }
  if (eventBytes + line.byteLength > MAX_EVENTS) throw new RequestError(413, "event log full");
  await writeAll(eventsHandle, line, true);
  eventBytes += line.byteLength;
  const after = await eventsHandle.stat({ bigint: true });
  if (
    !after.isFile() ||
    after.nlink !== 1n ||
    after.dev !== eventIdentity.dev ||
    after.ino !== eventIdentity.ino ||
    after.size !== BigInt(eventBytes)
  ) {
    throw new Error("event log changed during append");
  }
  lastActivity = Date.now();
  return new Response(null, { status: 204 });
}

function frame(): string {
  const nonce = randomBytes(18).toString("base64");
  const screen = JSON.stringify(current.screen).replaceAll("<", "\\u003c");
  const generation = JSON.stringify(current.generation);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Visual brainstorm</title><style nonce="${nonce}">:root{--font-body:Inter,"IBM Plex Sans",sans-serif;--page-max:1100px;--space-3:12px;--space-6:24px;--status-pad-y:6px;--status-pad-x:10px;--status-radius:999px;--status-ready:#285943;--status-paused:#8a451f;--status-text:#fff;--status-size:12px;color-scheme:light dark}html{font:16px var(--font-body)}body{max-width:var(--page-max);margin:auto;padding:var(--space-6)}#status{position:fixed;right:var(--space-3);bottom:var(--space-3);padding:var(--status-pad-y) var(--status-pad-x);border-radius:var(--status-radius);background:var(--status-ready);color:var(--status-text);font-size:var(--status-size)}.paused{background:var(--status-paused)!important}.v-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-3)}.v-row{display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap}.v-card,.v-frame{border:1px solid currentColor;border-radius:var(--space-3);padding:var(--space-3)}.v-choice{font:inherit;padding:var(--status-pad-y) var(--status-pad-x);border:1px solid currentColor;border-radius:var(--status-radius);background:transparent;color:inherit;cursor:pointer}.v-muted{opacity:.72}</style></head><body><main>${current.html}</main><div id="status">connected</div><script nonce="${nonce}">const status=document.querySelector('#status');const screen=${screen};const generation=${generation};let retry=500;function connect(){const ws=new WebSocket('ws://'+location.host+'/ws');ws.onopen=()=>{status.textContent='connected';status.className='';retry=500};ws.onmessage=e=>{if(e.data==='reload')location.reload()};ws.onclose=()=>{status.textContent='paused';status.className='paused';setTimeout(connect,retry);retry=Math.min(retry*2,10000)}}connect();document.addEventListener('click',async e=>{if(!(e.target instanceof Element))return;const target=e.target.closest('[data-choice]');if(!target)return;const choice=(target.getAttribute('data-choice')||'').slice(0,256);const label=(target.getAttribute('data-label')||target.textContent||choice).trim().slice(0,512);if(!choice)return;const response=await fetch('/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'choice',choice,label,screen,generation})}).catch(()=>null);if(!response||!response.ok){status.textContent='selection not recorded';status.className='paused'}});</script></body></html>`;
}

let origin = "";
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(request, serving) {
    const url = new URL(request.url);
    if (url.hostname !== "127.0.0.1" || url.port !== String(serving.port)) {
      return new Response("loopback host required", { status: 403 });
    }
    if (!keyMatches(suppliedKey(request, url))) return new Response("session key required", { status: 401 });

    if (url.pathname === "/ws") {
      if (request.method !== "GET" || !exactOrigin(request)) return new Response("forbidden", { status: 403 });
      lastActivity = Date.now();
      return serving.upgrade(request) ? undefined : new Response("upgrade required", { status: 426 });
    }

    lastActivity = Date.now();
    if (request.method === "GET" && url.pathname === "/" && url.searchParams.has("key")) {
      return new Response(null, {
        status: 303,
        headers: {
          location: "/",
          "set-cookie": `visual_session=${key}; HttpOnly; SameSite=Strict; Path=/`,
        },
      });
    }
    if (request.method === "GET" && url.pathname === "/") {
      const nonceMatch = frame();
      const nonce = /<script nonce="([^"]+)"/.exec(nonceMatch)?.[1];
      if (!nonce) throw new Error("nonce generation failed");
      return new Response(nonceMatch, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "content-security-policy": `default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; connect-src ${origin} ${origin.replace("http:", "ws:")}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'`,
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY",
          "referrer-policy": "no-referrer",
        },
      });
    }
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, screen: current.screen, generation: current.generation });
    }
    if (request.method === "POST" && (url.pathname === "/publish" || url.pathname === "/event")) {
      if (!exactOrigin(request) || request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
        return new Response("exact loopback origin and JSON required", { status: 403 });
      }
      try {
        const input = await jsonBody(request);
        if (url.pathname === "/event") return await serialize(() => appendEvent(input));
        const screen = boundedString(input.screen, 132);
        return await serialize(async () => {
          if (publishedScreens.has(screen)) throw new RequestError(409, "screen name already published");
          const html = await readFragment(screen);
          const generation = current.generation + 1;
          current = { screen, generation, html };
          publishedScreens.add(screen);
          lastActivity = Date.now();
          server.publish("reloads", "reload");
          return Response.json({ ok: true, screen, generation });
        });
      } catch (error) {
        if (error instanceof RequestError) return new Response(error.message, { status: error.status });
        throw error;
      }
    }
    return new Response("not found", { status: 404 });
  },
  websocket: {
    maxPayloadLength: MAX_BODY,
    open(socket) {
      socket.subscribe("reloads");
    },
    message(socket) {
      socket.close(1008, "client messages are not supported");
    },
  },
  error(error) {
    console.error(error instanceof Error ? error.message : "server error");
    return new Response("internal error", { status: 500 });
  },
});
origin = `http://127.0.0.1:${server.port}`;

const info = {
  process_name: processName,
  session_dir: sessionDir,
  screen_dir: screenDir,
  state_dir: stateDir,
  origin,
  key,
  url: `${origin}/?key=${key}`,
  idle_timeout_ms: idleTimeoutMs,
  event_dev: eventIdentity.dev.toString(),
  event_ino: eventIdentity.ino.toString(),
};
await atomicWrite(infoPath, `${JSON.stringify(info)}\n`);
console.log(`READY ${JSON.stringify({ process_name: processName, session_dir: sessionDir, screen_dir: screenDir, state_dir: stateDir, origin })}`);

let idleTimer: ReturnType<typeof setInterval>;
async function shutdown(reason: string, exitCode: number): Promise<never> {
  if (stopping) await new Promise<never>(() => undefined);
  stopping = true;
  clearInterval(idleTimer);
  await server.stop(true);
  await stateQueue;
  await eventsHandle.sync();
  await eventsHandle.close();
  await unlink(infoPath).catch(error => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
  await atomicWrite(stoppedPath, `${JSON.stringify({ reason, timestamp: Date.now() })}\n`);
  console.log(`STOPPED ${reason}`);
  process.exit(exitCode);
}

idleTimer = setInterval(() => {
  if (Date.now() - lastActivity >= idleTimeoutMs) void shutdown("idle-timeout", 0);
}, 5_000);
process.on("SIGTERM", () => void shutdown("managed-stop", 0));
process.on("SIGINT", () => void shutdown("managed-stop", 0));
process.on("uncaughtException", error => {
  console.error(error instanceof Error ? error.message : "uncaught exception");
  void shutdown("uncaught-exception", 1);
});
process.on("unhandledRejection", error => {
  console.error(error instanceof Error ? error.message : "unhandled rejection");
  void shutdown("unhandled-rejection", 1);
});
