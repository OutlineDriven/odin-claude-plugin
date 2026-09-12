#!/usr/bin/env python3
# gate_check.py : run the CHECK commands in gate files, flip boxes, record evidence.
# Zero dependencies. Python 3.10+.
# Python re-implementation of the upstream Node gate-checker from
# https://github.com/Leonxlnx/unlazy (MIT, (c) 2026 Leonxlnx),
# pinned commit ed9e8d2b5919698cf2c54bda270d507e10b69617.
#
# Usage:
#   python3 gate_check.py [file ...]          run unmet gates' checks, update files
#   python3 gate_check.py --status [file ...] report only, change nothing
#   python3 gate_check.py --timeout 60 ...    per-check timeout in seconds (default 120)
#
# Files default to .outline/GATES.md plus .outline/gates/*.md in the current directory.
# Exit codes: 0 = all gates met (or honestly abandoned), 1 = unmet gates remain,
#             2 = usage or parse error.
from pathlib import Path
import re
import subprocess
import sys

GATE_RE = re.compile(r"^- \[( |x|X)\] (.*)$")
ATTR_RE = re.compile(r"^\s+(CHECK|EXPECT|EVIDENCE):\s?(.*)$")
ABANDON_RE = re.compile(r"^ABANDON:\s*(\S+)\s*(.*)$")

# JavaScript regex flags understood by EXPECT bodies; other letters are ignored.
JS_FLAG_MAP = {"i": re.IGNORECASE, "s": re.DOTALL, "m": re.MULTILINE}
# 'g' is a valid JS flag that means nothing to a one-shot search.
JS_NEUTRAL_FLAGS = {"g"}

def default_files(cwd):
    found = []
    top = Path(cwd) / ".outline" / "GATES.md"
    if top.exists():
        found.append(top)
    gdir = Path(cwd) / ".outline" / "gates"
    if gdir.is_dir():
        for entry in sorted(gdir.iterdir()):
            if entry.name.endswith(".md"):
                found.append(gdir / entry.name)
    return found


def usage_error(msg):
    print(f"gate-check: {msg}", file=sys.stderr)
    print("usage: gate_check.py [--status] [--timeout N] [file ...]", file=sys.stderr)
    sys.exit(2)


def parse_args(argv):
    status_only = False
    timeout_sec = 120
    files = []
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--status":
            status_only = True
        elif arg == "--timeout":
            val = argv[i + 1] if i + 1 < len(argv) else None
            try:
                parsed = float(val)
            except (TypeError, ValueError):
                parsed = 0
            timeout_sec = parsed or 120  # Number(x) || 120: bad or zero -> 120
            i += 1  # consume the value token
        elif arg.startswith("--"):
            usage_error(f"unknown option: {arg}")
        else:
            files.append(arg)
        i += 1
    return status_only, timeout_sec, files


def parse(lines):
    gates = []
    abandoned = {}  # id -> reason
    cur = None
    for i, line in enumerate(lines):
        g = GATE_RE.match(line)
        if g:
            idm = re.match(r"^(\S+?):", g.group(2))
            cur = {
                "line": i,
                "checked": g.group(1).lower() == "x",
                "title": re.sub(r"^\S+?:\s*", "", g.group(2).strip(), count=1),
                "id": idm.group(1) if idm else f"line{i + 1}",
                "check": None,
                "expect": None,
                "evidence": None,
                "evidence_line": -1,
            }
            gates.append(cur)
            continue
        if cur is not None:
            a = ATTR_RE.match(line)
            if a:
                key = a.group(1).lower()
                cur[key] = a.group(2).strip()
                if key == "evidence":
                    cur["evidence_line"] = i
                continue
        ab = ABANDON_RE.match(line)
        if ab:
            gid = ab.group(1)
            if gid.endswith(":"):
                gid = gid[:-1]
            abandoned[gid] = ab.group(2) or "(no reason)"
        # A header or stray list item ends attribute attachment to the gate above.
        if line.startswith("#") or line.startswith("- "):
            cur = None
    return gates, abandoned


def expect_matches(expect, output):
    rx = re.match(r"^/(.+)/([a-z]*)$", expect)
    # Only a delimited pattern whose trailing group is empty or valid JS flags
    # is a regex. Anything else (a literal path such as /api/v1/health) must
    # fall through to the substring check, or its tail is read as flags and
    # the wrong fragment is searched.
    if rx and (rx.group(2) == "" or set(rx.group(2)) <= set(JS_FLAG_MAP) | JS_NEUTRAL_FLAGS):
        flags = 0
        for ch in rx.group(2):
            flags |= JS_FLAG_MAP.get(ch, 0)
        try:
            return re.search(rx.group(1), output, flags) is not None
        except re.error:
            return False
    return expect in output


def tail(output, max_len=200):
    parts = [s.strip() for s in re.split(r"\r?\n", output) if s.strip()]
    last = " | ".join(parts[-2:])
    return (last or "(no output)")[:max_len]


def main():
    status_only, timeout_sec, file_args = parse_args(sys.argv[1:])
    files = file_args if file_args else default_files(Path.cwd())
    if not files:
        print(
            "gate-check: no gate files found (.outline/GATES.md or .outline/gates/*.md)",
            file=sys.stderr,
        )
        sys.exit(2)

    total_unmet = 0
    total_met = 0
    total_abandoned = 0

    for path in files:
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as fh:
                text = fh.read()
        except OSError as e:
            print(f"gate-check: cannot read {path}: {e}", file=sys.stderr)
            sys.exit(2)
        lines = re.split(r"\r?\n", text)
        gates, abandoned = parse(lines)
        if not gates:
            print(f"{path}: no gates found")
            continue
        changed = False

        for gate in gates:
            if gate["id"] in abandoned:
                total_abandoned += 1
                continue

            pending_evidence = not gate["evidence"] or gate["evidence"].lower() == "pending"

            # Run checks for gates that are unchecked, or checked but missing evidence.
            needs_run = not status_only and gate["check"] and (not gate["checked"] or pending_evidence)
            if needs_run:
                error_msg = None
                try:
                    res = subprocess.run(
                        gate["check"],
                        shell=True,
                        capture_output=True,
                        text=True,
                        errors="replace",
                        timeout=timeout_sec,
                    )
                    output = (res.stdout or "") + "\n" + (res.stderr or "")
                    # With an EXPECT, the match decides (a check may exit non-zero
                    # by design); without one, the exit code decides.
                    ok = expect_matches(gate["expect"], output) if gate["expect"] else res.returncode == 0
                except subprocess.TimeoutExpired as e:
                    output = ""
                    ok = False
                    error_msg = str(e)
                except OSError as e:
                    output = ""
                    ok = False
                    error_msg = str(e)
                if ok:
                    lines[gate["line"]] = re.sub(r"^- \[ \]", "- [x]", lines[gate["line"]], count=1)
                    if gate["evidence_line"] != -1:
                        indent = re.match(r"\s*", lines[gate["evidence_line"]]).group(0)
                        lines[gate["evidence_line"]] = f"{indent}EVIDENCE: {tail(output)}"
                    else:
                        # A gate authored without an EVIDENCE line never gained
                        # one on disk, so the box flipped but the evidence
                        # stayed pending and every later run re-executed the
                        # CHECK. Insert the record and shift the gates below.
                        insert_at = gate["line"] + 1
                        indent = re.match(r"\s*", lines[gate["line"]]).group(0)
                        lines.insert(insert_at, f"{indent}  EVIDENCE: {tail(output)}")
                        for other in gates:
                            if other is gate:
                                continue
                            if other["line"] >= insert_at:
                                other["line"] += 1
                            if other["evidence_line"] >= insert_at:
                                other["evidence_line"] += 1
                        gate["evidence_line"] = insert_at
                    gate["checked"] = True
                    gate["evidence"] = tail(output)
                    changed = True
                    print(f"  PASS {gate['id']}: {gate['title']}")
                else:
                    why = error_msg if error_msg is not None else tail(output)
                    print(f"  FAIL {gate['id']}: {gate['title']}")
                    print(f"       {why}")

            evidence_now = gate["evidence"] and gate["evidence"].lower() != "pending"
            if gate["checked"] and evidence_now:
                total_met += 1
            else:
                total_unmet += 1
                if status_only:
                    why = "unchecked" if not gate["checked"] else "checked but EVIDENCE pending"
                    print(f"  UNMET {gate['id']} ({why}): {gate['title']}")

        if changed:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write("\n".join(lines))
        print(f"{path}: {len(gates)} gates")

    if total_unmet == 0:
        suffix = f", {total_abandoned} abandoned" if total_abandoned else ""
        print(f"ALL MET ({total_met} met{suffix})")
        sys.exit(0)
    else:
        suffix = f", abandoned: {total_abandoned}" if total_abandoned else ""
        print(f"UNMET: {total_unmet} (met: {total_met}{suffix})")
        sys.exit(1)


if __name__ == "__main__":
    main()
