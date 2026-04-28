#!/usr/bin/env python3
"""
audit-memory.sh <memory_dir> [session_history_glob]
Walks the memory directory and session history, emits a JSON audit report to stdout.
Diagnostics go to stderr. Exit 1 on fatal error.

Report shape:
{
  "orphans":         [{"file": "...", "severity": "warn"}],
  "dangling":        [{"entry": "...", "file": "...", "severity": "critical"}],
  "near_duplicates": [{"a": "...", "b": "...", "similarity": 0.82, "severity": "warn"}],
  "structural":      [{"file": "...", "issue": "...", "severity": "warn|critical|info"}],
  "staleness":       [{"file": "...", "evidence": [...], "severity": "warn|critical"}]
}
"""
import sys, json, re, os, glob as glob_module, datetime
from pathlib import Path

# --- Module-level compiled regexes (fail at import if broken) ---

RE_INDEX_LINK     = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
RE_CREDENTIAL     = re.compile(
    r'sk-[A-Za-z0-9]{20,}'
    r'|ghp_[A-Za-z0-9]{36,}'
    r'|AKIA[A-Z0-9]{16}'
    r'|xoxb-[A-Za-z0-9-]+'
    r'|Bearer [A-Za-z0-9._-]{20,}'
)
RE_FIX_RECIPE     = re.compile(
    r'\bthe fix is\b|\bto resolve this\b|\bthe bug was\b|\bthe error occurred because\b',
    re.IGNORECASE,
)
RE_PATH_PINNED    = re.compile(
    r'[a-zA-Z0-9_]+\.[a-z]{1,4}:[0-9]+|`[A-Z][a-zA-Z]+\(\)`|/[a-zA-Z0-9_/.-]{8,}'
)
RE_RELATIVE_DATE  = re.compile(
    r'\blast week\b|\byesterday\b'
    r'|\bnext (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|sprint)\b'
    r'|\bthis sprint\b',
    re.IGNORECASE,
)
RE_DATE           = re.compile(r'\b(\d{4}-\d{2}-\d{2})\b')
RE_ANCHOR_PHRASE  = re.compile(
    r'\b(as of|since|starting|started|decided on|decided|created|effective|from|began)\b',
    re.IGNORECASE,
)
RE_CORRECTION     = re.compile(r"\bstop\b|\bdon'?t\b|\bwrong\b|\bnot that\b", re.IGNORECASE)

VALID_TYPES  = {"user", "feedback", "project", "reference"}
TODAY        = datetime.date.today()

# ---------------------------------------------------------------------------

def parse_frontmatter(text: str):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, text
    fm, body_start = {}, 1
    for i, line in enumerate(lines[1:], 1):
        if line.strip() == "---":
            body_start = i + 1
            break
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip()
    return fm, "\n".join(lines[body_start:])


def body_line_set(mf: Path):
    _, body = parse_frontmatter(mf.read_text(encoding="utf-8", errors="replace"))
    return {l.strip() for l in body.splitlines() if l.strip()}


# ---------------------------------------------------------------------------
# Per-concern check functions — each returns List[dict]
# ---------------------------------------------------------------------------

def check_index_integrity(index_path: Path, mem_files):
    """Orphans + dangling refs + MEMORY.md structural checks."""
    issues = {"orphans": [], "dangling": [], "structural": []}
    if not index_path.exists():
        return issues

    raw = index_path.read_text(encoding="utf-8")
    index_entries = {}
    for line in raw.splitlines():
        m = RE_INDEX_LINK.search(line)
        if m:
            fname = m.group(2)
            index_entries[fname] = line
            if len(line) > 150:
                issues["structural"].append({
                    "file": "MEMORY.md",
                    "issue": f"index line > 150 chars: {line[:80]}…",
                    "severity": "info",
                })

    total_non_empty = sum(1 for l in raw.splitlines() if l.strip())
    if total_non_empty > 200:
        issues["structural"].append({
            "file": "MEMORY.md",
            "issue": f"MEMORY.md has {total_non_empty} lines (limit 200)",
            "severity": "warn",
        })

    mem_names = {mf.name for mf in mem_files}
    for fname, line in index_entries.items():
        if fname not in mem_names:
            issues["dangling"].append({"entry": line.strip(), "file": fname, "severity": "critical"})

    for mf in mem_files:
        if mf.name not in index_entries:
            issues["orphans"].append({"file": mf.name, "severity": "warn"})

    return issues


def check_file_schema(mem_files):
    """Frontmatter completeness, type validity, required sections, fix-recipe/path-pinned/relative-date checks."""
    entries = []
    for mf in mem_files:
        text = mf.read_text(encoding="utf-8", errors="replace")
        fm, body = parse_frontmatter(text)

        if fm is None:
            entries.append({"file": mf.name, "issue": "missing frontmatter", "severity": "critical"})
            continue

        missing_keys = [k for k in ("name", "description", "type") if k not in fm]
        if missing_keys:
            entries.append({"file": mf.name, "issue": f"missing frontmatter keys: {missing_keys}", "severity": "critical"})

        ftype = fm.get("type", "")
        if ftype and ftype not in VALID_TYPES:
            entries.append({"file": mf.name, "issue": f"unknown type: {ftype!r}", "severity": "warn"})

        if "originSessionId" not in fm:
            entries.append({"file": mf.name, "issue": "missing originSessionId", "severity": "info"})

        if ftype in ("feedback", "project"):
            if "**Why:**" not in body:
                entries.append({"file": mf.name, "issue": "missing **Why:** section", "severity": "warn"})
            if "**How to apply:**" not in body:
                entries.append({"file": mf.name, "issue": "missing **How to apply:** section", "severity": "warn"})

        if RE_FIX_RECIPE.search(body):
            entries.append({"file": mf.name, "issue": "fix-recipe content detected", "severity": "warn"})

        if RE_PATH_PINNED.search(body):
            entries.append({"file": mf.name, "issue": "possible path-pinned rule (file path or function name in body)", "severity": "warn"})

        if RE_RELATIVE_DATE.search(body):
            entries.append({"file": mf.name, "issue": "relative date in body — convert to absolute (YYYY-MM-DD)", "severity": "warn"})

    return entries


def scan_credentials(mem_files):
    """Credential pattern scan across all memory files."""
    entries = []
    for mf in mem_files:
        text = mf.read_text(encoding="utf-8", errors="replace")
        if RE_CREDENTIAL.search(text):
            entries.append({"file": mf.name, "issue": "suspected credential — run memory-sanitize", "severity": "critical"})
    return entries


def check_near_duplicates(mem_files):
    """Jaccard similarity on body lines; flag pairs > 0.70."""
    entries = []
    files_list = list(mem_files)
    sets = {mf: body_line_set(mf) for mf in files_list}
    for i in range(len(files_list)):
        for j in range(i + 1, len(files_list)):
            a, b = files_list[i], files_list[j]
            sa, sb = sets[a], sets[b]
            union = sa | sb
            if not union:
                continue
            sim = len(sa & sb) / len(union)
            if sim > 0.70:
                entries.append({"a": a.name, "b": b.name, "similarity": round(sim, 2), "severity": "warn"})
    return entries


def check_staleness(mem_files, session_glob: str):
    """Past-date flags for project; dead-path flags for reference; session contradiction for feedback."""
    entries = []

    for mf in mem_files:
        text = mf.read_text(encoding="utf-8", errors="replace")
        fm, body = parse_frontmatter(text)
        if not fm:
            continue
        ftype = fm.get("type", "")

        if ftype == "project":
            for m in RE_DATE.finditer(body):
                try:
                    d = datetime.date.fromisoformat(m.group(1))
                except ValueError:
                    continue
                if d >= TODAY:
                    continue
                prefix = body[max(0, m.start() - 60):m.start()]
                if RE_ANCHOR_PHRASE.search(prefix):
                    continue
                entries.append({
                    "file": mf.name,
                    "issue": f"past date {m.group(1)} may be expired commitment",
                    "context": body[max(0, m.start() - 80):m.end() + 40].strip(),
                    "severity": "warn",
                })

        if ftype == "reference":
            for line in body.splitlines():
                stripped = line.strip()
                if stripped.startswith("path:"):
                    target = stripped.split(":", 1)[1].strip()
                    if target and not os.path.exists(target):
                        entries.append({"file": mf.name, "issue": f"reference target missing: {target}", "severity": "warn"})
                elif stripped.startswith("url:"):
                    entries.append({"file": mf.name, "issue": "url target not verified (HTTP checks out of scope)", "severity": "info"})

        if ftype == "feedback" and session_glob:
            entries.extend(_feedback_session_check(mf, body, session_glob))

    return entries


def _feedback_session_check(mf: Path, body: str, session_glob: str):
    session_files = sorted(glob_module.glob(session_glob))
    first_line = next(
        (l.strip() for l in body.splitlines() if l.strip() and not l.startswith("#") and not l.startswith("**")),
        "",
    )
    if not first_line:
        return []
    keywords = re.findall(r'\b[a-zA-Z]{4,}\b', first_line)[:5]
    if not keywords:
        return []

    kw_pattern = re.compile("|".join(re.escape(k) for k in keywords), re.IGNORECASE)
    contradictions = []

    for sf in session_files[:50]:
        try:
            texts = []
            with open(sf, encoding="utf-8", errors="replace") as fh:
                for raw in fh:
                    raw = raw.strip()
                    if not raw:
                        continue
                    try:
                        obj = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    if obj.get("type") in ("user", "assistant"):
                        content = obj.get("message", {}).get("content", "")
                        text = (
                            content if isinstance(content, str)
                            else " ".join(
                                c.get("text", "") for c in content
                                if isinstance(c, dict) and c.get("type") == "text"
                            )
                        )
                        texts.append(text)
            session_text = " ".join(texts)
            if kw_pattern.search(session_text) and not RE_CORRECTION.search(session_text):
                contradictions.append({"session": os.path.basename(sf)})
        except Exception:
            continue

    if len(contradictions) >= 3:
        severity = "critical" if len(contradictions) >= 5 else "warn"
        return [{
            "file": mf.name,
            "issue": f"rule may be stale — keywords absent from correction turns in {len(contradictions)} sessions",
            "sessions": [c["session"] for c in contradictions[:5]],
            "severity": severity,
        }]
    return []


# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print("Usage: audit-memory.sh <memory_dir> [session_history_glob]", file=sys.stderr)
        sys.exit(1)

    memory_dir   = Path(sys.argv[1])
    session_glob = sys.argv[2] if len(sys.argv) > 2 else ""

    if not memory_dir.is_dir():
        print(f"ERROR: memory dir not found: {memory_dir}", file=sys.stderr)
        sys.exit(1)

    mem_files  = [f for f in memory_dir.glob("*.md") if f.name != "MEMORY.md"]
    index_path = memory_dir / "MEMORY.md"

    idx       = check_index_integrity(index_path, mem_files)
    schema    = check_file_schema(mem_files)
    creds     = scan_credentials(mem_files)
    near_dups = check_near_duplicates(mem_files)
    staleness = check_staleness(mem_files, session_glob)

    report = {
        "orphans":         idx["orphans"],
        "dangling":        idx["dangling"],
        "near_duplicates": near_dups,
        "structural":      idx["structural"] + schema + creds,
        "staleness":       staleness,
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
