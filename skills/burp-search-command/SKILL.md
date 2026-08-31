---
name: burp-search-command
description: 'Use when a human invokes the Burp search command with a required .burp project file and optional parser operation. The command runs the Burp Suite project parser wrapper and returns JSON search results. Don''t use for tasks that require source or remote-system changes.'
---

# Burp search command

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes the Burp search command with a required .burp file and optional parser operation. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The command only reads the specified .burp project file through the Burp Suite parser. |
| Side effect | Local read of the command-selected .burp project through the Burp parser wrapper. No project file is modified; output is written to stdout only. |
| Done | A valid project path and optional operation are passed to the full bounded Burp parser workflow and its JSON result is returned. |

## Inputs

1. **Burp project file** (required): Path to a `.burp` project file. Must exist on the local filesystem.
2. **Operation** (optional, at least one expected for useful output): One of:
   - `auditItems`: extract all security audit findings.
   - `proxyHistory`: dump all proxy history entries.
   - `siteMap`: dump all site map entries.
   - `responseHeader='regex'`: search response headers with a regex.
   - `responseBody='regex'`: search response bodies with a regex.
   - Sub-component filters appended with dots: `proxyHistory.request.headers`, `proxyHistory.request.body`, `proxyHistory.response.headers`, `proxyHistory.response.body`, and the same patterns for `siteMap.*`.

Environment variables (optional overrides):
- `BURP_JAVA`: path to the Java executable. Defaults to the Burp Suite Professional bundled JRE (`/Applications/Burp Suite Professional.app/Contents/Resources/jre.bundle/Contents/Home/bin/java` on macOS, `/opt/BurpSuiteProfessional/jre/bin/java` on Linux).
- `BURP_JAR`: path to `burpsuite_pro.jar`. Defaults to `/Applications/Burp Suite Professional.app/Contents/Resources/app/burpsuite_pro.jar` on macOS, `/opt/BurpSuiteProfessional/burpsuite_pro.jar` on Linux.

Prerequisites: Burp Suite Professional with the `burpsuite-project-file-parser` extension installed.

## Procedure

1. Validate that the project file argument is supplied and that the file exists at the given path. Stop with an error if it is missing or not a regular file.
2. Resolve the Java executable: use `BURP_JAVA` if set, otherwise the platform default. Stop with an error if the path is empty or the executable is not found.
3. Resolve the Burp JAR: use `BURP_JAR` if set, otherwise the platform default. Stop with an error if the path is empty or the JAR is not found.
4. If no operation argument is supplied, print usage and stop.
5. Run the parser wrapper by executing the resolved Java binary headless against the resolved JAR, passing `--project-file=<project-file>` followed by every operation argument verbatim:
   ```
   <java> -jar -Djava.awt.headless=true <burpsuite_pro.jar> --project-file=<project-file> <operation...>
   ```
6. Stream the JSON output (one object per line) from the parser to stdout. Do not parse, filter, or mutate the output inside this command.

## Failure and recovery
- **Project file not found**: Print an error naming the missing path and stop. No parser invocation occurs.
- **Unsupported platform**: When `uname -s` is neither Darwin nor Linux and no `BURP_JAVA`/`BURP_JAR` overrides are set, print a warning naming the platform and stop. The user must set both environment variables.
- **Java or JAR not found**: Print an error naming the missing path and the environment variable to set, then stop. No parser invocation occurs.
- **No operation supplied**: Print usage and stop. No parser invocation occurs.
- **Parser runtime error**: Surface the parser's stderr and exit code unchanged. Do not swallow errors or fabricate results. The done predicate does not hold; report the failure as the terminal result.
- **Non-mutation rule**: This command never writes to or modifies the `.burp` project file. No rollback is needed; a failed run leaves the project file untouched.

## Output
JSON objects, one per line, written to stdout. The shape depends on the operation:
- `auditItems`: objects with `name`, `severity`, `confidence`, `host`, `port`, `protocol`, `url`.
- `proxyHistory` / `siteMap`: complete request/response data, narrowed by any sub-component filter.
- `responseHeader='regex'` / `responseBody='regex'`: objects with `url` and the matching header or body content.

## Provenance

Adapted from the Trail of Bits skills repository (`https://github.com/trailofbits/skills`), revision `d1f1575cff97816e5cc08af66cd2506099c681d3`, file `plugins/burpsuite-project-parser/commands/burp-search.md` and supporting script `plugins/burpsuite-project-parser/skills/burpsuite-project-parser/scripts/burp-search.sh`. Licensed CC-BY-SA-4.0; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse `trail-of-bits-mark.svg` as branding. This is a clean-room adaptation: the slash-command routing and skill-pointer indirection were replaced with a self-contained procedure that restates the parser wrapper invocation, operations, environment variables, and platform defaults directly.
