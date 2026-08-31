#!/usr/bin/env python3
"""Validate-first / dry-run-first wrapper around the ast-grep CLI.

Two subcommands enforce a safety discipline for an agent skill:

  validate <pattern> --lang L
      Lint an ast-grep PATTERN without touching any file. Two layers:
        1. Pattern-parse check (AUTHORITATIVE): compile the pattern with
           `ast-grep run --debug-query=pattern` -- ast-grep's own pattern
           tree, built after metavariables are substituted -- and look for
           an ERROR node. ERROR present -> malformed -> exit 2. Clean parse
           -> valid -> exit 0, regardless of which metacharacters or `$`
           metavariables the pattern contains.
        2. Regex-smell warning (ADVISORY): if the pattern carries
           regex-only escapes (\\w \\d \\s \\b) or a bare .*/.+ quantifier,
           print a hint. This NEVER changes the exit code on its own.

  replace <pattern> <rewrite> --lang L [paths...] [--apply]
      Dry-run by DEFAULT. Validates the SEARCH pattern (pattern-parse
      authoritative),
      then runs a JSON dry-run that previews a compact diff + blast radius
      and mutates nothing. Only with --apply does a second pass write files
      via --update-all (the documented workaround for --json + --update-all
      not co-operating).

The `ast-grep` binary is invoked UNCONDITIONALLY -- never `sg`, which
collides with shadow-utils `setgroups` on Linux.

Exit codes: 0 ok, 2 validation/usage failure, other non-zero = ast-grep
runtime error.

Stdlib only.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

BINARY = "ast-grep"

# Canonical language name per accepted alias. ast-grep accepts both the
# short alias and the full name; we normalize to the full name for clarity.
LANG_ALIASES = {
    "ts": "typescript", "typescript": "typescript",
    "tsx": "tsx",
    "js": "javascript", "javascript": "javascript",
    "jsx": "jsx",
    "py": "python", "python": "python",
    "rs": "rust", "rust": "rust",
    "go": "go", "golang": "go",
    "java": "java",
    "kt": "kotlin", "kotlin": "kotlin",
    "c": "c",
    "cpp": "cpp", "c++": "cpp", "cxx": "cpp",
}

# Extension -> alias, for single-path language auto-detection.
EXT_TO_LANG = {
    ".ts": "ts", ".tsx": "tsx", ".js": "js", ".jsx": "jsx",
    ".mjs": "js", ".cjs": "js",
    ".py": "py", ".rs": "rs", ".go": "go", ".java": "java",
    ".kt": "kt", ".kts": "kt",
    ".c": "c", ".h": "c",
    ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".hpp": "cpp", ".hh": "cpp",
}

# Regex-only escapes / quantifiers that signal a misused regex where an
# ast-grep structural pattern was meant. `$`, `|`, `[`, `]`, `^` are legal
# in real patterns and are deliberately NOT flagged.
REGEX_ESCAPE_RE = re.compile(r"\\[wdsb]")
BARE_QUANTIFIER_RE = re.compile(r"\.[*+]")

def warn(msg):
    """Print an advisory line to stderr."""
    print(msg, file=sys.stderr)


def find_binary():
    """Absolute path to the ast-grep binary, or None if not on PATH."""
    return shutil.which(BINARY)


def run_ast_grep(args, *, capture=True):
    """Single funnel for every ast-grep invocation.

    Returns a CompletedProcess. Raises FileNotFoundError if the binary is
    absent (callers that require it must check find_binary() first).
    """
    cmd = [BINARY, *args]
    return subprocess.run(
        cmd,
        capture_output=capture,
        text=True,
    )


def normalize_lang(value):
    """Map an alias/full name to ast-grep's canonical language, or None."""
    if value is None:
        return None
    return LANG_ALIASES.get(value.strip().lower())


def detect_lang_from_paths(paths):
    """Infer a language alias from a single unambiguous path/glob extension.

    Returns an alias string, or None when detection is not unambiguous.
    """
    if not paths or len(paths) != 1:
        return None
    suffix = Path(paths[0]).suffix.lower()
    return EXT_TO_LANG.get(suffix)


def resolve_lang(explicit, paths, *, from_stdin):
    """Resolve the effective language alias or exit(2) with a clear message.

    Patterns from stdin always require an explicit --lang. Otherwise fall
    back to single-path extension auto-detection.
    """
    chosen = explicit
    if chosen is None and not from_stdin:
        chosen = detect_lang_from_paths(paths)
    if chosen is None:
        warn("error: --lang/-l is required "
             "(no unambiguous single-path extension to auto-detect from)")
        sys.exit(2)
    canonical = normalize_lang(chosen)
    if canonical is None:
        warn(f"error: unknown language {chosen!r}; accepted: "
             + ", ".join(sorted(LANG_ALIASES)))
        sys.exit(2)
    return canonical


def regex_smells(pattern):
    """List human-readable regex-smell findings for a pattern (advisory)."""
    findings = []
    if REGEX_ESCAPE_RE.search(pattern):
        findings.append(r"regex-only escape (\w \d \s \b)")
    if BARE_QUANTIFIER_RE.search(pattern):
        findings.append("bare .*/.+ quantifier")
    return findings


def emit_regex_smell(pattern, label):
    """Print the non-blocking regex-smell hint if the pattern looks regexy."""
    findings = regex_smells(pattern)
    if not findings:
        return
    warn(f"hint: {label} looks like regex ({'; '.join(findings)}); "
         "did you mean $VAR / $$$, or switch to rg?")


def pattern_has_error(pattern, lang):
    """Parse pattern via --debug-query=pattern; True if it contains an ERROR.

    `--debug-query=pattern` dumps ast-grep's OWN pattern tree -- the view
    built AFTER metavariables ($A, $$V, $$$, $_) are substituted internally.
    A `$` therefore never raises a spurious tree-sitter ERROR node in
    languages where it is not a legal identifier char (Go, Python, C); only a
    genuinely malformed pattern (regex misuse like `\\w+`, an incomplete form
    like `def FN(`) yields an ERROR node. This is ast-grep's authoritative
    judgement of whether the pattern compiles, not a raw-CST heuristic.

    The debug tree is written to stderr and labels error nodes on their own
    line (`ERROR (...)`), with an incidental "contains an ERROR node" warning
    alongside. We scan combined output for an ERROR node label. Returns
    (has_error: bool, raw_tree: str).
    """
    proc = run_ast_grep(
        ["run", "-p", pattern, "-l", lang, "--debug-query=pattern", "--stdin"],
        capture=True,
    )
    raw = (proc.stdout or "") + (proc.stderr or "")
    has_error = re.search(r"(?:\(ERROR\b|\bERROR\b)", raw) is not None
    return has_error, raw


def validate_pattern(pattern, lang, *, role="pattern"):
    """Run advisory regex-smell + authoritative pattern-parse check.

    Returns one of: "ok", "error" (parse ERROR found), "skipped" (binary
    absent). Prints findings. Attaches the raw pattern tree on error.
    """
    emit_regex_smell(pattern, role)
    if find_binary() is None:
        warn(f"warning: {BINARY} not found on PATH; "
             "pattern-parse validation skipped (regex-smell check only).")
        return "skipped"
    has_error, raw = pattern_has_error(pattern, lang)
    if has_error:
        warn(f"verdict: {role} is MALFORMED -- ERROR node in ast-grep's "
             "parsed pattern tree.")
        warn("--- pattern debug tree ---")
        warn(raw.rstrip("\n"))
        warn("--- end pattern tree ---")
        return "error"
    return "ok"


def cmd_validate(ns):
    """`validate` subcommand: lint a pattern, never touch files."""
    from_stdin = ns.pattern == "-"
    pattern = sys.stdin.read().strip() if from_stdin else ns.pattern
    lang = resolve_lang(ns.lang, ns.paths, from_stdin=from_stdin)
    outcome = validate_pattern(pattern, lang, role="pattern")
    if outcome == "error":
        return 2
    if outcome == "skipped":
        print("pattern: parse check skipped (ast-grep unavailable); "
              "regex-smell layer ran.")
        return 0
    print("verdict: pattern is VALID (ast-grep parses it cleanly).")
    return 0


def build_globs_args(globs):
    """Flatten repeatable --globs values into ast-grep CLI args.

    A value prefixed with `!` is passed through verbatim as an exclude.
    """
    out = []
    for g in globs or []:
        out += ["--globs", g]
    return out


def base_run_args(pattern, rewrite, lang, paths, ns):
    """Common positional/flag args shared by dry-run and apply passes."""
    args = ["run", "-p", pattern, "-r", rewrite, "-l", lang]
    args += build_globs_args(ns.globs)
    if ns.context is not None:
        args += ["-C", str(ns.context)]
    args += list(paths)
    return args


def render_diff(matches, context):
    """Render a compact unified-style diff + blast-radius summary line."""
    files = set()
    lines_out = []
    for m in matches:
        path = m.get("file", "<unknown>")
        files.add(path)
        old = m.get("lines", "")
        new = m.get("replacement", "")
        start = m.get("range", {}).get("start", {}).get("line", 0) + 1
        lines_out.append(f"@@ {path}:{start} @@")
        for line in old.splitlines() or [old]:
            lines_out.append(f"- {line}")
        for line in new.splitlines() or [new]:
            lines_out.append(f"+ {line}")
    summary = f"{len(matches)} matches across {len(files)} files"
    return "\n".join(lines_out), summary


def replace_dry_run(pattern, rewrite, lang, paths, ns):
    """Pass 1: JSON dry-run. Returns (matches, proc). Mutates nothing."""
    args = base_run_args(pattern, rewrite, lang, paths, ns) + ["--json=compact"]
    proc = run_ast_grep(args, capture=True)
    raw = (proc.stdout or "").strip()
    try:
        matches = json.loads(raw) if raw else []
    except json.JSONDecodeError:
        matches = None
    return matches, proc


def replace_apply(pattern, rewrite, lang, paths, ns):
    """Pass 2: write changes via --update-all. Returns CompletedProcess."""
    args = base_run_args(pattern, rewrite, lang, paths, ns) + ["--update-all"]
    return run_ast_grep(args, capture=True)


def cmd_replace(ns):
    """`replace` subcommand: dry-run by default; --apply to write."""
    if find_binary() is None:
        warn(f"error: {BINARY} not found on PATH; replace cannot run "
             "(pattern validation and rewrite both require the binary).")
        return 2

    from_stdin = ns.pattern == "-"
    pattern = sys.stdin.read().strip() if from_stdin else ns.pattern
    lang = resolve_lang(ns.lang, ns.paths, from_stdin=from_stdin)

    # Validate the SEARCH pattern only (pattern-parse authoritative). The
    # rewrite is frequently a non-standalone fragment, so it gets an advisory
    # smell warning but is NEVER parse-checked.
    outcome = validate_pattern(pattern, lang, role="search pattern")
    if outcome == "error":
        return 2
    emit_regex_smell(ns.rewrite, "rewrite")

    paths = ns.paths or ["."]
    matches, proc = replace_dry_run(pattern, ns.rewrite, lang, paths, ns)
    if matches is None:
        warn("error: ast-grep failed during dry-run (malformed rewrite?).")
        if proc.stderr:
            warn(proc.stderr.rstrip("\n"))
        return proc.returncode or 1

    if ns.json_out:
        print(json.dumps(matches, indent=2))
    else:
        if not matches:
            print("0 matches across 0 files (nothing to rewrite).")
        else:
            diff, summary = render_diff(matches, ns.context)
            print(diff)
            print(summary)

    if not ns.apply:
        if matches and not ns.json_out:
            print("(dry-run: no files modified; re-run with --apply to write)")
        return 0

    if not matches:
        return 0
    apply_proc = replace_apply(pattern, ns.rewrite, lang, paths, ns)
    if apply_proc.returncode != 0:
        warn("error: ast-grep failed during apply pass.")
        if apply_proc.stderr:
            warn(apply_proc.stderr.rstrip("\n"))
        return apply_proc.returncode
    out = (apply_proc.stdout or "").strip()
    if out:
        print(out)
    print("(applied: files updated via --update-all)")
    return 0


def add_shared_flags(p):
    """Attach flags common to both subcommands."""
    p.add_argument("-l", "--lang",
                   help="language: ts/tsx/js/jsx/py/rs/go/java/kt/c/cpp "
                        "or a full name. Auto-detected from a single path's "
                        "extension when omitted; required for stdin patterns.")
    p.add_argument("--globs", action="append", metavar="GLOB",
                   help="include/exclude glob (repeatable); prefix with ! "
                        "to exclude.")
    p.add_argument("-C", "--context", type=int, metavar="N",
                   help="context lines around each match.")
    p.add_argument("--json-out", action="store_true",
                   help="machine mode: emit raw JSON instead of human text.")


def build_parser():
    parser = argparse.ArgumentParser(
        prog="ast_grep_helper.py",
        description="Validate-first / dry-run-first wrapper around ast-grep.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    pv = sub.add_parser(
        "validate",
        help="lint an ast-grep pattern (parse authoritative; no file access).",
        description="Validate an ast-grep PATTERN. Parse ERROR -> exit 2; "
                    "clean -> exit 0. Regex-smell hints are advisory only. "
                    "Use '-' as the pattern to read it from stdin.",
    )
    pv.add_argument("pattern", help="the ast-grep pattern (or '-' for stdin).")
    pv.add_argument("paths", nargs="*",
                    help="optional path(s) used only for language "
                         "auto-detection.")
    add_shared_flags(pv)
    pv.set_defaults(func=cmd_validate)

    pr = sub.add_parser(
        "replace",
        help="dry-run a rewrite (default); --apply to write files.",
        description="Preview an ast-grep rewrite as a compact diff + blast "
                    "radius. Dry-run by default (no mutation). Pass --apply "
                    "to write via --update-all. The search pattern is parse "
                    "validated; the rewrite is not. Use '-' as the pattern "
                    "to read it from stdin.",
    )
    pr.add_argument("pattern", help="the search pattern (or '-' for stdin).")
    pr.add_argument("rewrite", help="the rewrite template.")
    pr.add_argument("paths", nargs="*",
                    help="path(s) to search; defaults to current directory.")
    pr.add_argument("--apply", action="store_true",
                    help="write changes (second pass via --update-all). "
                         "Without it, nothing is mutated.")
    add_shared_flags(pr)
    pr.set_defaults(func=cmd_replace)

    return parser


def main(argv=None):
    parser = build_parser()
    ns = parser.parse_args(argv)
    return ns.func(ns)


if __name__ == "__main__":
    sys.exit(main())
