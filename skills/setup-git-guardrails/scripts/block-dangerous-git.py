#!/usr/bin/env python3
"""Block accidental destructive Git commands in Claude Code hooks."""

from __future__ import annotations

import json
import shlex
import sys

# This guard blocks accidental destructive commands. It is not a sandbox.
# Runtime-built paths, earlier shell functions, and script files can still hide
# Git from a matcher that only sees this command string.
SEPARATORS = frozenset({";", "&&", "||", "|", "&"})
SHELLS = frozenset({"bash", "sh", "zsh", "dash", "ksh"})
GIT_OPTIONS_WITH_VALUES = frozenset(
    {"-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"}
)
MAX_RECURSION_DEPTH = 3


def tokenize(command: str) -> list[str] | None:
    lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    try:
        return list(lexer)
    except ValueError:
        return None


def segment_end(tokens: list[str], start: int) -> int:
    for index in range(start, len(tokens)):
        if tokens[index] in SEPARATORS:
            return index
    return len(tokens)


def has_short_flag(token: str, flag: str) -> bool:
    return token.startswith("-") and not token.startswith("--") and flag in token[1:]


def destructive_rule(subcommand: str, arguments: list[str]) -> str | None:
    option_end = arguments.index("--") if "--" in arguments else len(arguments)
    options = arguments[:option_end]

    if subcommand == "push":
        for argument in options:
            if (
                argument == "-f"
                or argument in {"--force", "--force-with-lease"}
                or argument.startswith("--force-with-lease=")
                or argument.startswith("--force-if-includes")
            ):
                return "push --force"
        if any(argument.startswith("+") for argument in arguments):
            return "push forced refspec"
        return None

    if subcommand == "reset" and "--hard" in options:
        return "reset --hard"

    if subcommand == "clean" and any(
        argument == "--force" or has_short_flag(argument, "f")
        for argument in options
    ):
        return "clean --force"

    if subcommand == "branch":
        if any(has_short_flag(argument, "D") for argument in options):
            return "branch -D"
        deleting = any(
            argument == "--delete" or has_short_flag(argument, "d")
            for argument in options
        )
        forcing = any(
            argument == "--force" or has_short_flag(argument, "f")
            for argument in options
        )
        if deleting and forcing:
            return "branch --delete --force"
        return None

    if subcommand in {"checkout", "restore"} and "." in arguments:
        return f"{subcommand} ."

    if subcommand == "stash" and arguments and arguments[0] in {"drop", "clear"}:
        return f"stash {arguments[0]}"

    if subcommand == "reflog":
        action = next(
            (argument for argument in arguments if not argument.startswith("-")),
            None,
        )
        if action == "expire":
            return "reflog expire"
        return None

    if subcommand == "gc" and "--prune=now" in options:
        return "gc --prune=now"

    return None


def match_git_invocation(arguments: list[str]) -> str | None:
    index = 0
    while index < len(arguments):
        token = arguments[index]
        if token in GIT_OPTIONS_WITH_VALUES:
            index += 2
            continue
        if token.startswith("-"):
            index += 1
            continue
        return destructive_rule(token, arguments[index + 1 :])
    return None


def nested_code(tokens: list[str], index: int) -> str | None:
    end = segment_end(tokens, index + 1)
    program = tokens[index].rsplit("/", 1)[-1]

    if program in SHELLS:
        option_index = index + 1
        while option_index < end:
            option = tokens[option_index]
            if option == "--" or option == "-" or not option.startswith("-"):
                break
            if option.startswith("--"):
                option_index += 1
                continue
            # The contract treats the token after the option cluster as code.
            if "c" in option[1:]:
                if option_index + 1 < end:
                    return tokens[option_index + 1]
                return None
            option_index += 1

    if tokens[index] == "eval":
        return " ".join(tokens[index + 1 : end])

    return None


def match_command(command: str, depth: int = 0) -> str | None:
    if depth > MAX_RECURSION_DEPTH:
        return None

    tokens = tokenize(command)
    if tokens is None:
        return None

    for index, token in enumerate(tokens):
        if token == "git" or token.endswith("/git"):
            end = segment_end(tokens, index + 1)
            rule = match_git_invocation(tokens[index + 1 : end])
            if rule is not None:
                return rule
            continue

        if index == 0 or tokens[index - 1] in SEPARATORS:
            code = nested_code(tokens, index)
            if code is not None:
                rule = match_command(code, depth + 1)
                if rule is not None:
                    return rule

    return None


def main() -> int:
    try:
        payload: object = json.load(sys.stdin)
        if not isinstance(payload, dict):
            return 0
        tool_input: object = payload.get("tool_input")
        if not isinstance(tool_input, dict):
            return 0
        command: object = tool_input.get("command")
        if not isinstance(command, str):
            return 0

        rule = match_command(command)
        if rule is None:
            return 0

        print(
            f"BLOCKED: '{command}' matches dangerous pattern '{rule}'. "
            "The user has prevented you from doing this.",
            file=sys.stderr,
        )
        return 2
    except Exception:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
