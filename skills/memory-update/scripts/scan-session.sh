#!/usr/bin/env python3
"""
scan-session.sh <session-history-glob>
Scans Claude Code JSONL session files for save-worthy memory signals.
Outputs a JSON array of candidate proposals to stdout.
Diagnostics go to stderr.
Exit 1 if glob matches no files.
"""
import sys
import json
import re
import glob as glob_module
from pathlib import Path

GLOB = sys.argv[1] if len(sys.argv) > 1 else ""
if not GLOB:
    print("Usage: scan-session.sh <session-history-glob>", file=sys.stderr)
    sys.exit(1)

files = sorted(glob_module.glob(GLOB))
if not files:
    print(f"ERROR: no session files matched: {GLOB}", file=sys.stderr)
    sys.exit(1)

# --- Signal patterns ---
CORRECTION_PHRASES = re.compile(
    r"\b(don't|stop|never|avoid|not that|wrong|I said|I told you)\b",
    re.IGNORECASE
)
CONFIRMATION_PHRASES = re.compile(
    r"\b(yes,?\s+exactly|perfect|keep doing that|that'?s right)\b",
    re.IGNORECASE
)
DECISION_PHRASES = re.compile(
    r"\b(we'?re doing|the reason we|we decided|freeze|deadline|cut a branch|ship)\b",
    re.IGNORECASE
)
ROLE_PHRASES = re.compile(
    r"\b(I'?m a|I work as|I'?ve been using|I prefer|I like|I always)\b",
    re.IGNORECASE
)
REFERENCE_PHRASES = re.compile(
    r"\b(check|look at|tracked in|the board at|the channel|the dashboard)\b",
    re.IGNORECASE
)
EXPLICIT_MARKER = re.compile(
    r"\[saves\s+(user|feedback|project|reference)\s+memory:\s*([^\]]+)\]",
    re.IGNORECASE
)

# --- Helpers ---
def extract_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            c.get("text", "") for c in content
            if isinstance(c, dict) and c.get("type") == "text"
        )
    return ""

def load_turns(path):
    turns = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            t = obj.get("type", "")
            if t in ("user", "assistant"):
                text = extract_text(obj.get("message", {}).get("content", ""))
                turns.append({
                    "uuid": obj.get("uuid", ""),
                    "type": t,
                    "text": text,
                    "timestamp": obj.get("timestamp", ""),
                })
    return turns

# --- Proposal builder ---
proposals = []

def add(ptype, slug, evidence_ids, draft_body, draft_index):
    proposals.append({
        "type": ptype,
        "slug": slug,
        "evidence_turn_ids": evidence_ids,
        "draft_body": draft_body,
        "draft_index_entry": draft_index,
    })

for fpath in files:
    turns = load_turns(fpath)
    for i, turn in enumerate(turns):
        text = turn["text"]
        uid = turn["uuid"]
        if not text.strip():
            continue

        # Explicit marker takes priority
        m = EXPLICIT_MARKER.search(text)
        if m:
            mtype = m.group(1).lower()
            desc = m.group(2).strip()
            slug = re.sub(r"[^a-z0-9]+", "-", desc.lower())[:40].strip("-")
            add(mtype, slug, [uid],
                f"{desc}.\n\n**Why:** (fill in from context)\n**How to apply:** (fill in from context)",
                f"- [{desc[:60]}]({mtype}_{slug}.md) — (add hook)")
            continue

        # User turn signals
        if turn["type"] == "user":
            if CORRECTION_PHRASES.search(text) and len(text) < 400:
                slug = re.sub(r"[^a-z0-9]+", "-", text[:40].lower()).strip("-")
                add("feedback", slug, [uid],
                    f"(draft from correction) {text[:200]}\n\n**Why:** User corrected this behavior.\n**How to apply:** Always apply when this pattern arises.",
                    f"- [(draft) {text[:50]}](feedback_{slug}.md) — correction from session")

            elif ROLE_PHRASES.search(text) and len(text) < 300:
                slug = re.sub(r"[^a-z0-9]+", "-", text[:40].lower()).strip("-")
                add("user", slug, [uid],
                    f"(draft from role signal) {text[:200]}",
                    f"- [(draft) {text[:50]}](user_{slug}.md) — user profile signal")

            elif DECISION_PHRASES.search(text) and len(text) < 500:
                slug = re.sub(r"[^a-z0-9]+", "-", text[:40].lower()).strip("-")
                add("project", slug, [uid],
                    f"(draft from decision) {text[:300]}\n\n**Why:** (fill in)\n**How to apply:** (fill in)",
                    f"- [(draft) {text[:50]}](project_{slug}.md) — project decision")

            elif REFERENCE_PHRASES.search(text) and len(text) < 400:
                slug = re.sub(r"[^a-z0-9]+", "-", text[:40].lower()).strip("-")
                add("reference", slug, [uid],
                    f"(draft from reference signal) {text[:200]}",
                    f"- [(draft) {text[:50]}](reference_{slug}.md) — external reference")

        # Confirmation of non-obvious approach
        if turn["type"] == "user" and CONFIRMATION_PHRASES.search(text) and i > 0:
            prev = turns[i - 1]
            if prev["type"] == "assistant" and re.search(
                r"\b(chose|instead|rather than|prefer)\b", prev["text"], re.IGNORECASE
            ):
                slug = re.sub(r"[^a-z0-9]+", "-", text[:40].lower()).strip("-")
                add("feedback", f"confirmed-{slug}", [prev["uuid"], uid],
                    f"(draft from confirmation) User confirmed: {text[:150]}\nApproach used: {prev['text'][:200]}\n\n**Why:** User explicitly validated this approach.\n**How to apply:** Continue using when applicable.",
                    f"- [(draft) confirmed approach](feedback_confirmed-{slug}.md) — validation from session")

print(json.dumps(proposals, indent=2))
