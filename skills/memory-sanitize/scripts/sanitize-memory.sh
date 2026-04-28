#!/usr/bin/env python3
"""
sanitize-memory.sh <memory_dir> <dst_dir>
Produces redacted copies of memory files under <dst_dir>.
Originals are never modified. Emits JSON report to stdout.

Report shape:
{
  "files": [
    {
      "source": "feedback_foo.md",
      "dest":   "/tmp/memory-sanitized-123/feedback_foo.md",
      "redactions": [{"tier": 1, "name": "...", "count": 1}],
      "credential_hits": ["OPENAI-KEY"]
    }
  ],
  "credential_sources": ["feedback_foo.md"],
  "total_redactions": 4
}

Exit 2 when any Tier-1 credential is present in a source file (copy is still
written so the caller can show the diff, but the skill MUST warn the user).
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


def sanitize_text(text: str):
    redactions = []
    credential_hits = []

    # Tier 1 — detect only (caller decides on abort)
    for name, pat in TIER1:
        hits = len(pat.findall(text))
        if hits:
            credential_hits.append(name)
            redactions.append({"tier": 1, "name": name, "count": hits})

    # Tier 2 — redact
    for entry in TIER2:
        name, pat, repl = entry
        if pat is None:
            # Date handled separately
            continue
        new_text, n = pat.subn(repl, text)
        if n:
            redactions.append({"tier": 2, "name": name, "count": n})
        text = new_text

    # Date redaction
    text, n = _redact_date(text)
    if n:
        redactions.append({"tier": 2, "name": "DATE", "count": n})

    return text, redactions, credential_hits


def main():
    if len(sys.argv) < 3:
        print("Usage: sanitize-memory.sh <memory_dir> <dst_dir>", file=sys.stderr)
        sys.exit(1)

    src_dir = Path(sys.argv[1])
    dst_dir = Path(sys.argv[2])

    if not src_dir.is_dir():
        print(f"ERROR: memory dir not found: {src_dir}", file=sys.stderr)
        sys.exit(1)

    if dst_dir.exists():
        print(f"ERROR: dst dir already exists: {dst_dir} (timestamp collision — retry)", file=sys.stderr)
        sys.exit(1)

    dst_dir.mkdir(parents=True)

    report = {"files": [], "credential_sources": [], "total_redactions": 0}
    exit_code = 0

    # Memory directories are flat by contract: only *.md at the top level.
    # Nested .md files are out of scope — warn if any are found.
    nested = [f for f in src_dir.rglob("*.md") if f.parent != src_dir]
    if nested:
        names = ", ".join(f.relative_to(src_dir).as_posix() for f in nested[:5])
        print(f"WARN: {len(nested)} nested .md file(s) found and skipped (out of scope): {names}", file=sys.stderr)

    for src_file in sorted(src_dir.glob("*.md")):
        text = src_file.read_text(encoding="utf-8", errors="replace")
        sanitized, redactions, cred_hits = sanitize_text(text)

        dst_file = dst_dir / src_file.name
        dst_file.write_text(sanitized, encoding="utf-8")

        entry = {
            "source":          src_file.name,
            "dest":            str(dst_file),
            "redactions":      redactions,
            "credential_hits": cred_hits,
        }
        report["files"].append(entry)
        report["total_redactions"] += sum(r["count"] for r in redactions)

        if cred_hits:
            report["credential_sources"].append(src_file.name)
            exit_code = 2  # signal: credential found in source

    print(json.dumps(report, indent=2))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
