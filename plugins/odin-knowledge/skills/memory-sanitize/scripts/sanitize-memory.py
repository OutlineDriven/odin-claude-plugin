#!/usr/bin/env python3
"""
sanitize-memory.py [--scan-only] <memory_dir> [<dst_dir>]

--scan-only: scan for Tier-1 credentials only; do not generate copies.
             Exit 2 if any Tier-1 credential is found, 0 otherwise.
             Emits JSON report of credential sources to stdout.

Without --scan-only: produces redacted copies of memory files under <dst_dir>.
Originals are never modified. Emits JSON report to stdout.

Report shape:
{
  "files": [
    {
      "source": "feedback_foo.md",
      "dest":   "/tmp/memory-sanitized-123/feedback_foo.md",
      "redactions": [{"tier": 2, "name": "...", "count": 1}],
      "credential_hits": []
    }
  ],
  "credential_sources": [],
  "total_redactions": 4
}

Exit 2 when --scan-only finds any Tier-1 credential in a source file.
Exit 1 on usage or path errors.
"""
import sys, json, re, os
from pathlib import Path

# ---------------------------------------------------------------------------
# Compiled patterns — fail at import time if any regex is broken
# ---------------------------------------------------------------------------

TIER1 = [
    ("OPENAI-KEY",    re.compile(r'sk-[A-Za-z0-9]{20,}')),
    ("GITHUB-PAT",    re.compile(r'ghp_[A-Za-z0-9]{36,}')),
    ("AWS-KEY",       re.compile(r'AKIA[A-Z0-9]{16}')),
    ("SLACK-TOKEN",   re.compile(r'xoxb-[A-Za-z0-9-]+')),
    ("BEARER-TOKEN",  re.compile(r'(?i)Authorization:\s+Bearer\s+\S{20,}')),
    ("ECR-ENDPOINT",  re.compile(r'[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com')),
]

TIER2 = [
    ("HOME-PATH",     re.compile(r'/(?:home|Users)/[^/\s]+/'),         r'<HOME>/'),
    ("EMAIL",         re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'), r'<EMAIL>'),
    ("SESSION-ID",    re.compile(r'(?m)^(originSessionId:\s*)\S+'),    r'\g<1><SESSION-ID>'),
    ("DATE",          None,                                             r'<DATE>'),  # handled below
]

RE_DATE = re.compile(r'\b(\d{4}-\d{2}-\d{2})\b')

import datetime
CUTOFF = datetime.date.today() - datetime.timedelta(days=30)


def _redact_date(text: str):
    count = 0
    def _replace(m):
        nonlocal count
        try:
            d = datetime.date.fromisoformat(m.group(1))
        except ValueError:
            return m.group(0)
        if d < CUTOFF:
            count += 1
            return '<DATE>'
        return m.group(0)
    result = RE_DATE.sub(_replace, text)
    return result, count


def scan_tier1(text: str):
    """Return list of Tier-1 credential names found in text."""
    hits = []
    for name, pat in TIER1:
        if pat.findall(text):
            hits.append(name)
    return hits


def sanitize_text(text: str):
    redactions = []

    # Tier 2 — redact
    for entry in TIER2:
        name, pat, repl = entry
        if pat is None:
            continue
        new_text, n = pat.subn(repl, text)
        if n:
            redactions.append({"tier": 2, "name": name, "count": n})
        text = new_text

    # Date redaction
    text, n = _redact_date(text)
    if n:
        redactions.append({"tier": 2, "name": "DATE", "count": n})

    return text, redactions


def main():
    args = sys.argv[1:]
    scan_only = False
    if args and args[0] == "--scan-only":
        scan_only = True
        args = args[1:]

    if scan_only:
        if len(args) < 1:
            print("Usage: sanitize-memory.sh --scan-only <memory_dir>", file=sys.stderr)
            sys.exit(1)
    else:
        if len(args) < 2:
            print("Usage: sanitize-memory.sh <memory_dir> <dst_dir>", file=sys.stderr)
            sys.exit(1)

    src_dir = Path(args[0])

    if not src_dir.is_dir():
        print(f"ERROR: memory dir not found: {src_dir}", file=sys.stderr)
        sys.exit(1)

    # --- Scan-only mode: check for Tier-1 credentials, no copies ---
    if scan_only:
        report = {"credential_sources": [], "files": []}
        for src_file in sorted(src_dir.glob("*.md")):
            text = src_file.read_text(encoding="utf-8", errors="replace")
            cred_hits = scan_tier1(text)
            if cred_hits:
                report["credential_sources"].append(src_file.name)
                report["files"].append({
                    "source": src_file.name,
                    "credential_hits": cred_hits,
                })
        print(json.dumps(report, indent=2))
        sys.exit(2 if report["credential_sources"] else 0)

    # --- Full mode: generate redacted copies ---
    dst_dir = Path(args[1])

    if dst_dir.exists():
        print(f"ERROR: dst dir already exists: {dst_dir} (timestamp collision — retry)", file=sys.stderr)
        sys.exit(1)

    # Pre-scan for Tier-1 credentials before generating any copies
    tier1_sources = []
    for src_file in sorted(src_dir.glob("*.md")):
        text = src_file.read_text(encoding="utf-8", errors="replace")
        if scan_tier1(text):
            tier1_sources.append(src_file.name)

    if tier1_sources:
        report = {
            "credential_sources": tier1_sources,
            "files": [
                {"source": name, "credential_hits": scan_tier1(
                    (src_dir / name).read_text(encoding="utf-8", errors="replace"))}
                for name in tier1_sources
            ],
        }
        print(json.dumps(report, indent=2))
        sys.exit(2)

    dst_dir.mkdir(parents=True)

    report = {"files": [], "credential_sources": [], "total_redactions": 0}

    # Memory directories are flat by contract: only *.md at the top level.
    # Nested .md files are out of scope — warn if any are found.
    nested = [f for f in src_dir.rglob("*.md") if f.parent != src_dir]
    if nested:
        names = ", ".join(f.relative_to(src_dir).as_posix() for f in nested[:5])
        print(f"WARN: {len(nested)} nested .md file(s) found and skipped (out of scope): {names}", file=sys.stderr)

    for src_file in sorted(src_dir.glob("*.md")):
        text = src_file.read_text(encoding="utf-8", errors="replace")
        sanitized, redactions = sanitize_text(text)

        dst_file = dst_dir / src_file.name
        dst_file.write_text(sanitized, encoding="utf-8")

        entry = {
            "source":          src_file.name,
            "dest":            str(dst_file),
            "redactions":      redactions,
            "credential_hits": [],
        }
        report["files"].append(entry)
        report["total_redactions"] += sum(r["count"] for r in redactions)

    print(json.dumps(report, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
