---
name: session-viewer
description: 'Use when the user asks to view, export, or inspect a session transcript in a browser. Produces one local single-file searchable HTML viewer from the session JSONL with credential scrubbing and optional browser launch. Not for sharing a session — use session-share.'
---

# Session viewer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to view, export, inspect, or share a Codex, Claude Code, OpenClaw, or Pi session transcript in a browser. |
| Authority | Reversible local write. Create only the single HTML viewer file and one disposable generator script in the system temp directory; never modify the session file, never touch the network, never publish or upload. Rollback is deleting the generated HTML; the scratch script is deleted after the run. |
| Side effect | A single-file searchable HTML viewer embedding the (optionally raw) session JSONL is produced; it is opened in a browser only when the user asked to view it or passed `--open`. |
| Done | HTML file is generated; session is correctly detected and normalized; tool output is searchable; private/credential content is not exposed. The file opens in a browser only when the user passed `--open` or explicitly asked to view it. |

## Not for

- Beaming or publishing a session to a remote endpoint — use session-share.

## Inputs

- Required: the path to an existing, non-empty, at most 256 MiB session `.jsonl` file. A directory, a plain text log, or a URL is out of scope; stop and ask for the path instead of guessing.
- Optional flags: `--format claude|codex|pi|openclaw` to force detection, `--out PATH` for the output file, `--raw` to embed the original lines (only on explicit user opt-in), `--open` to launch the browser.
- The host needs Python 3 with its standard library. No other runtime, package, service, or skill is involved.

## Procedure

1. Validate the input path at the trust boundary before any mutation: the file must exist, be non-empty, and be at most 256 MiB; otherwise stop with no writes. **Done when:** the path is validated or the stop is reported.
2. Fix the privacy mode before writing: default mode embeds a normalized, credential-scrubbed projection. Embed raw lines only when the user explicitly opts in with `--raw`; raw mode changes fidelity, never the scrub or the local-only boundary. **Done when:** the privacy mode is fixed.
3. Write the generator script below exactly as given to a scratch file in the system temp directory (for example `/tmp/session_viewer_gen.py`). It uses only the Python 3 standard library. Do not edit it. **Done when:** the scratch script is written.
4. Run `python3 <scratch> <session.jsonl>` with any optional flags. The script detects the format from structural signatures with a path-hint tiebreak, parses the JSONL line by line, and normalizes each line into unified records (index, timestamp, kind: user, assistant, system, summary, thinking, tool-call, tool-result, other; role, tool name, text). It scrubs credential-shaped strings (sk- tokens, ghp_ tokens, AKIA keys, xox tokens, bearer headers, key/token/password assignments). It renders one self-contained HTML viewer with an embedded JSON payload, substring search across message text, tool names, roles, and tool output, role filter chips, collapsible raw lines in raw mode, a metadata header, no external assets, and no network access. Every record is rendered through textContent so session content cannot inject markup. **Done when:** the HTML viewer is generated and the script report is captured.
5. Read the script report: format and how it was chosen, line, record, and skipped counts, masked-string count, raw mode, output path, and size. To prove the done predicate, open the file when the user asked to view it (or run with `--open`) and confirm it renders and that searching returns tool output. **Done when:** the report is read and the done predicate is proven or disproven.
6. Delete the scratch script. The HTML file is the only remaining artifact; deleting it is the complete rollback. **Done when:** the scratch script is deleted and only the HTML file remains.

```python
#!/usr/bin/env python3
"""Generate a single-file searchable HTML viewer from an agent session JSONL.

Supported session formats: claude, codex, pi, openclaw.
Usage:
  python3 session_viewer_gen.py SESSION.jsonl [--format auto|claude|codex|pi|openclaw]
      [--out PATH] [--raw] [--open]
Exit codes: 0 success, 2 input or parse failure, 3 ambiguous format.
Standard library only; no network access.
"""
import argparse
import html
import json
import re
import sys
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

FORMATS = ("claude", "codex", "pi", "openclaw")
MAX_INPUT_BYTES = 256 * 1024 * 1024
MASK = "[redacted]"

SCRUBBERS = (
    (re.compile(r"\bsk-[A-Za-z0-9_-]{16,}"), MASK),
    (re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}"), MASK),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), MASK),
    (re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}"), MASK),
    (re.compile(r"(?i)authorization[\s\"':=]+bearer\s+\S{16,}"), MASK),
    (re.compile(r"(?i)\b(?:api[_-]?key|secret|token|password)[\"'\s:=]{1,4}\S{16,}"), MASK),
)

masked_hits = [0]

def scrub(text):
    if not isinstance(text, str):
        return text
    for pattern, replacement in SCRUBBERS:
        text, count = pattern.subn(replacement, text)
        masked_hits[0] += count
    return text

def record(index, kind, role, text, tool="", ts="", raw=None):
    return {
        "i": index,
        "kind": kind,
        "role": role,
        "tool": tool,
        "ts": ts,
        "text": scrub(text) if isinstance(text, str) else "",
        "raw": raw,
    }

def text_of(content):
    if isinstance(content, str):
        return content
    parts = []
    if isinstance(content, list):
        for block in content:
            parts.append(text_of(block))
    elif isinstance(content, dict):
        for key in ("text", "thinking", "input_text", "output_text", "summary_text", "query", "content", "output"):
            if key in content:
                parts.append(text_of(content[key]))
    elif content is not None:
        parts.append(str(content))
    return chr(10).join(part for part in parts if part)

def detect_format(path, lines):
    scores = dict.fromkeys(FORMATS, 0)
    for line in lines:
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if not isinstance(obj, dict):
            continue
        t = obj.get("type")
        if t in ("session_meta", "response_item", "turn_context", "event_msg"):
            scores["codex"] += 2
        if t in ("user", "assistant", "system", "summary", "progress"):
            scores["claude"] += 2
        if t == "session":
            scores["pi"] += 1
            scores["openclaw"] += 1
        if t == "message" and isinstance(obj.get("message"), dict):
            scores["pi"] += 2
        if "role" in obj and "type" not in obj:
            scores["openclaw"] += 2
        if "parentUuid" in obj or "sessionId" in obj:
            scores["claude"] += 1
    marker = path.as_posix().lower()
    if "/.claude/" in marker:
        scores["claude"] += 1
    if "/.codex/" in marker:
        scores["codex"] += 1
    if "/openclaw/" in marker:
        scores["openclaw"] += 1
    if "/.pi/" in marker or "/.omp/" in marker or "/pi/agent/sessions" in marker:
        scores["pi"] += 1
    top = max(scores.values())
    if top == 0:
        return None, scores
    winners = [name for name in FORMATS if scores[name] == top]
    if len(winners) != 1:
        return None, scores
    return winners[0], scores

def parse_claude(obj, recs, raw):
    t = obj.get("type")
    ts = obj.get("timestamp", "")
    if t == "summary":
        recs.append(record(len(recs), "summary", "system", str(obj.get("summary", "")), ts=ts, raw=raw))
        return True
    if t == "progress":
        return True
    msg = obj.get("message")
    if not isinstance(msg, dict):
        return False
    role = str(msg.get("role", t or "other"))
    kind = role if role in ("user", "assistant", "system") else "other"
    content = msg.get("content")
    if isinstance(content, str):
        recs.append(record(len(recs), kind, role, content, ts=ts, raw=raw))
        return True
    if isinstance(content, list):
        for block in content:
            if isinstance(block, str):
                recs.append(record(len(recs), kind, role, block, ts=ts, raw=raw))
                continue
            if not isinstance(block, dict):
                recs.append(record(len(recs), "other", role, str(block), ts=ts, raw=raw))
                continue
            bt = block.get("type")
            if bt == "text":
                recs.append(record(len(recs), kind, role, str(block.get("text", "")), ts=ts, raw=raw))
            elif bt == "thinking":
                recs.append(record(len(recs), "thinking", role, str(block.get("thinking", "")), ts=ts, raw=raw))
            elif bt == "tool_use":
                recs.append(record(len(recs), "tool-call", role, json.dumps(block.get("input", {}), ensure_ascii=False, sort_keys=True), tool=str(block.get("name", "")), ts=ts, raw=raw))
            elif bt == "tool_result":
                recs.append(record(len(recs), "tool-result", role, text_of(block.get("content")), tool=str(block.get("tool_use_id", "")), ts=ts, raw=raw))
            else:
                recs.append(record(len(recs), "other", role, text_of(block), ts=ts, raw=raw))
        return True
    return False

def parse_codex(obj, recs, meta, raw):
    t = obj.get("type")
    ts = obj.get("timestamp", "")
    if t == "session_meta" or t == "turn_context":
        payload = obj.get("payload")
        if not isinstance(payload, dict):
            payload = obj
        meta.setdefault("session", {})
        for key in ("id", "cwd", "cli_version", "originator", "instructions", "model"):
            if key in payload and key not in meta["session"]:
                meta["session"][key] = payload[key]
        return True
    if t == "event_msg":
        return True
    if t != "response_item":
        return False
    payload = obj.get("payload")
    if not isinstance(payload, dict):
        return False
    pt = payload.get("type")
    if pt == "message":
        role = str(payload.get("role", "other"))
        recs.append(record(len(recs), role if role in ("user", "assistant", "system") else "other", role, text_of(payload.get("content")), ts=ts, raw=raw))
        return True
    if pt in ("function_call", "custom_tool_call"):
        args = payload.get("arguments")
        recs.append(record(len(recs), "tool-call", "assistant", args if isinstance(args, str) else json.dumps(args if args is not None else {}, ensure_ascii=False, sort_keys=True), tool=str(payload.get("name", "")), ts=ts, raw=raw))
        return True
    if pt == "function_call_output":
        recs.append(record(len(recs), "tool-result", "user", text_of(payload.get("output")), tool=str(payload.get("call_id", "")), ts=ts, raw=raw))
        return True
    if pt == "reasoning":
        recs.append(record(len(recs), "thinking", "assistant", text_of(payload.get("summary") or payload.get("content")), ts=ts, raw=raw))
        return True
    if pt == "web_search_call":
        recs.append(record(len(recs), "tool-call", "assistant", text_of(payload.get("action")), tool="web_search", ts=ts, raw=raw))
        return True
    recs.append(record(len(recs), "other", "other", text_of(payload), ts=ts, raw=raw))
    return True

def parse_messageish(obj, recs, meta, raw):
    t = obj.get("type")
    ts = obj.get("timestamp", "")
    if t == "session":
        meta.setdefault("session", {})
        for key in ("id", "sessionId", "cwd", "model", "modelId", "provider", "version", "path"):
            if key in obj and key not in meta["session"]:
                meta["session"][key] = obj[key]
        return True
    msg = obj.get("message") if isinstance(obj.get("message"), dict) else obj
    role = msg.get("role")
    if not isinstance(role, str):
        return False
    if role in ("toolResult", "tool"):
        out = msg.get("output")
        if out is None:
            out = msg.get("content")
        tool = msg.get("toolName") or msg.get("name") or msg.get("toolCallId") or msg.get("tool_use_id") or ""
        recs.append(record(len(recs), "tool-result", role, text_of(out), tool=str(tool), ts=ts, raw=raw))
        return True
    kind = role if role in ("user", "assistant", "system") else "other"
    content = msg.get("content")
    if isinstance(content, str):
        recs.append(record(len(recs), kind, role, content, ts=ts, raw=raw))
        return True
    if isinstance(content, list):
        for block in content:
            if isinstance(block, str):
                recs.append(record(len(recs), kind, role, block, ts=ts, raw=raw))
                continue
            if not isinstance(block, dict):
                recs.append(record(len(recs), "other", role, str(block), ts=ts, raw=raw))
                continue
            bt = block.get("type")
            if bt == "text":
                recs.append(record(len(recs), kind, role, str(block.get("text", "")), ts=ts, raw=raw))
            elif bt == "thinking":
                recs.append(record(len(recs), "thinking", role, str(block.get("thinking", block.get("text", ""))), ts=ts, raw=raw))
            elif bt in ("toolCall", "tool_use", "tool_call"):
                args = block.get("arguments") if "arguments" in block else block.get("input")
                recs.append(record(len(recs), "tool-call", role, args if isinstance(args, str) else json.dumps(args if args is not None else {}, ensure_ascii=False, sort_keys=True), tool=str(block.get("name", block.get("toolName", ""))), ts=ts, raw=raw))
            elif bt == "tool_result":
                recs.append(record(len(recs), "tool-result", role, text_of(block.get("content")), tool=str(block.get("tool_use_id", "")), ts=ts, raw=raw))
            else:
                recs.append(record(len(recs), "other", role, text_of(block), ts=ts, raw=raw))
        return True
    if isinstance(content, dict):
        recs.append(record(len(recs), kind, role, text_of(content), ts=ts, raw=raw))
        return True
    return False

HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Session viewer — @@TITLE@@</title>
<style>
body{margin:0;font:14px/1.5 system-ui,sans-serif;background:#fff;color:#111}
header{position:sticky;top:0;z-index:1;background:#fff;border-bottom:1px solid #ddd;padding:10px 14px}
#q{width:min(560px,90vw);padding:6px 10px;font:inherit}
.chip{display:inline-block;margin:6px 6px 0 0;padding:2px 10px;border:1px solid #bbb;border-radius:999px;cursor:pointer;user-select:none}
.chip.on{background:#111;color:#fff;border-color:#111}
#meta{color:#555;font-size:12px;margin-top:4px;white-space:pre-wrap}
main{padding:10px 14px 60px}
.rec{border:1px solid #e3e3e3;border-radius:8px;margin:8px 0;padding:8px 10px}
.rec .hd{display:flex;gap:8px;align-items:baseline;color:#666;font-size:12px;flex-wrap:wrap}
.badge{font-size:11px;padding:1px 8px;border-radius:999px;border:1px solid currentColor}
pre{white-space:pre-wrap;word-break:break-word;margin:6px 0 0;font:inherit}
details{margin-top:6px}
details pre{font:12px/1.4 ui-monospace,monospace;background:#f6f6f6;border-radius:6px;padding:6px 8px;max-height:320px;overflow:auto}
#count{font-size:12px;color:#666;margin-left:10px}
@media (prefers-color-scheme: dark){body{background:#111;color:#eee}header{background:#111;border-color:#333}.rec{border-color:#333}details pre{background:#1d1d1d}#meta,#count{color:#aaa}}
</style>
</head>
<body>
<header>
  <h1 style="font-size:16px;margin:0 0 6px">Session viewer — @@TITLE@@</h1>
  <input id="q" type="search" placeholder="Search messages, tool names, and tool output" autofocus>
  <span id="count"></span>
  <div id="chips"></div>
  <div id="meta"></div>
</header>
<main id="list"></main>
<script id="payload" type="application/json">@@PAYLOAD@@</script>
<script>
"use strict";
var DATA = JSON.parse(document.getElementById("payload").textContent);
var KINDS = ["all", "user", "assistant", "system", "summary", "thinking", "tool-call", "tool-result", "other"];
var state = { q: "", kind: "all" };
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function metaLine(m) {
  var bits = ["format: " + m.format, "records: " + m.records, "skipped lines: " + m.skipped, "masked: " + m.masked, "raw: " + (m.raw ? "on" : "off"), "generated: " + m.generated, "source: " + m.source];
  var s = m.session ? Object.keys(m.session).map(function (k) { return k + ": " + m.session[k]; }).join("  ") : "";
  return bits.join("  ") + (s ? "\\n" + s : "");
}
function match(r) {
  if (state.kind !== "all" && r.kind !== state.kind) return false;
  if (!state.q) return true;
  var hay = (r.text + " " + r.tool + " " + r.role + " " + (r.raw || "")).toLowerCase();
  return hay.indexOf(state.q.toLowerCase()) !== -1;
}
function render() {
  var list = document.getElementById("list");
  list.textContent = "";
  var shown = 0;
  for (var i = 0; i < DATA.records.length; i++) {
    var r = DATA.records[i];
    if (!match(r)) continue;
    shown++;
    var box = el("div", "rec");
    var hd = el("div", "hd");
    hd.appendChild(el("span", null, "#" + (r.i + 1)));
    hd.appendChild(el("span", "badge " + r.kind, r.kind));
    if (r.tool) hd.appendChild(el("span", null, r.tool));
    if (r.ts) hd.appendChild(el("span", null, r.ts));
    box.appendChild(hd);
    box.appendChild(el("pre", null, r.text));
    if (r.raw) {
      var d = el("details");
      d.appendChild(el("summary", null, "raw line"));
      d.appendChild(el("pre", null, r.raw));
      box.appendChild(d);
    }
    list.appendChild(box);
  }
  document.getElementById("count").textContent = shown + " / " + DATA.records.length + " records";
  if (!shown) list.appendChild(el("p", null, "No records match."));
}
function buildChips() {
  var wrap = document.getElementById("chips");
  KINDS.forEach(function (k) {
    var c = el("span", "chip" + (k === "all" ? " on" : ""), k);
    c.onclick = function () {
      state.kind = k;
      Array.prototype.forEach.call(wrap.children, function (ch) { ch.classList.remove("on"); });
      c.classList.add("on");
      render();
    };
    wrap.appendChild(c);
  });
}
document.getElementById("q").addEventListener("input", function (e) { state.q = e.target.value; render(); });
document.getElementById("meta").textContent = metaLine(DATA.meta);
buildChips();
render();
</script>
</body>
</html>
"""

def main(argv=None):
    ap = argparse.ArgumentParser(description="Render an agent session JSONL as one searchable HTML file.")
    ap.add_argument("session", help="path to the session .jsonl file")
    ap.add_argument("--format", choices=("auto",) + FORMATS, default="auto", help="force the session format instead of auto-detection")
    ap.add_argument("--out", default=None, help="output HTML path")
    ap.add_argument("--raw", action="store_true", help="embed the original credential-scrubbed JSONL lines")
    ap.add_argument("--open", action="store_true", help="open the viewer in the default browser after writing")
    args = ap.parse_args(argv)

    src = Path(args.session)
    if not src.is_file():
        print("error: input file not found: %s" % src, file=sys.stderr)
        return 2
    size = src.stat().st_size
    if size == 0:
        print("error: input file is empty", file=sys.stderr)
        return 2
    if size > MAX_INPUT_BYTES:
        print("error: input is %d bytes; the limit is %d. Split the session or view a line range." % (size, MAX_INPUT_BYTES), file=sys.stderr)
        return 2

    fmt = args.format
    if fmt == "auto":
        sample = []
        with src.open("r", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                if line.strip():
                    sample.append(line)
                if len(sample) >= 200:
                    break
        fmt, scores = detect_format(src, sample)
        if fmt is None:
            print("error: could not determine the session format; evidence: " + ", ".join("%s=%d" % (name, scores[name]) for name in FORMATS), file=sys.stderr)
            print("re-run with --format claude|codex|pi|openclaw", file=sys.stderr)
            return 3

    recs = []
    meta = {"format": fmt, "source": str(src), "raw": bool(args.raw)}
    skipped = 0
    total = 0
    with src.open("r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if not line.strip():
                continue
            total += 1
            try:
                obj = json.loads(line)
            except ValueError:
                skipped += 1
                continue
            if not isinstance(obj, dict):
                skipped += 1
                continue
            raw = scrub(line) if args.raw else None
            if fmt == "claude":
                handled = parse_claude(obj, recs, raw)
            elif fmt == "codex":
                handled = parse_codex(obj, recs, meta, raw)
            else:
                handled = parse_messageish(obj, recs, meta, raw)
            if not handled:
                skipped += 1

    if not recs:
        print("error: parsed 0 records from %d lines (%d skipped); no HTML written" % (total, skipped), file=sys.stderr)
        return 2

    meta["lines"] = total
    meta["records"] = len(recs)
    meta["skipped"] = skipped
    meta["masked"] = masked_hits[0]
    meta["generated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stem = src.stem or "session"
    if args.out:
        out = Path(args.out)
    else:
        out = Path("session-viewer-%s-%s.html" % (stem, datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")))
    payload = json.dumps({"meta": meta, "records": recs}, ensure_ascii=False).replace("</", "<" + chr(92) + "/")
    title = html.escape(stem, quote=True).replace("@@PAYLOAD@@", "")
    page = HTML.replace("@@TITLE@@", title).replace("@@PAYLOAD@@", payload)
    out.write_text(page, encoding="utf-8")

    print("format: %s (%s)" % (fmt, "forced" if args.format != "auto" else "auto-detected"))
    print("lines: %d  records: %d  skipped: %d" % (total, len(recs), skipped))
    print("masked: %d credential-shaped string(s)" % masked_hits[0])
    print("raw embed: %s" % ("on" if args.raw else "off"))
    print("out: %s (%d bytes)" % (out, out.stat().st_size))
    if args.open:
        webbrowser.open(out.resolve().as_uri())
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

## Failure and recovery
- Missing, empty, oversized, or non-JSONL input: the script exits 2 before writing anything; nothing is mutated.
- Undetectable or tied format: the script exits 3 with the per-format evidence counts; re-run once with an explicit `--format`. If the forced format still parses zero records, report blocked with that output; do not try other formats silently.
- Unparsable lines are skipped and counted, and the viewer opens on the valid remainder with the skipped count in its header. Zero valid records means exit 2 with no HTML file. Never present a partial render as done.
- Python 3 missing or the output directory unwritable: stop and report the exact error; do not substitute another mechanism.
- The script never uploads, publishes, or opens a network connection. Never swallow errors or claim the done predicate holds while detection was forced-and-failed, the file did not open, or the report shows zero records.

## Output
The HTML viewer at the resolved path plus the stdout report (format, counts, masked hits, raw mode, path, size); the viewer is local-only, sharing happens only when the user copies the file; terminal states: done (file generated, opens and searches when `--open` was passed) or blocked (exit 2 or 3 after the single explicit-format retry).
