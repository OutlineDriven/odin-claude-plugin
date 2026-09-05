---
name: burpsuite-project-parser
description: 'Use when asked to analyze a Burp Suite .burp project for audit items, request/response metadata, or captured traffic. Modes: parsed (default) and stream. Not for source or remote-system changes.'
---

# Burp Suite project parser

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks to search or analyze a Burp Suite `.burp` project, extract audit items, inspect request or response metadata, or search captured traffic. |
| Authority | Read-only: the `.burp` project is read through Burp Suite Professional; no project file is modified. No remote mutation. |
| Side effect | The user-selected local `.burp` project is read through Burp Suite Professional; output is capped and filtered in `parsed` mode, or streamed raw in `stream` mode. |
| Done | The requested operation returns the correct JSON output for the selected mode: size-checked and truncated in `parsed` mode, or raw streamed in `stream` mode. |

## Inputs

- Project file path (required): absolute path to a `.burp` project file.
- Operation (required): one of `auditItems`, `proxyHistory`, `siteMap`, `responseHeader='regex'`, `responseBody='regex'`, or a sub-component filter such as `proxyHistory.request.headers`.
- Mode (required): `parsed` (default) or `stream`. `stream` returns the parser output unchanged to stdout without body truncation.
- BURP_JAVA (required if not at default platform path): path to Burp Suite Professional's bundled Java executable.
- BURP_JAR (required if not at default platform path): path to `burpsuite_pro.jar`.
- jq (required for `parsed` mode): used for filtering, truncating body fields, and triaging audit items.

## Procedure

1. Verify prerequisites. Confirm Burp Suite Professional is installed, the `burpsuite-project-file-parser` extension (github.com/BuffaloWill/burpsuite-project-file-parser) is loaded, and `BURP_JAVA`, `BURP_JAR`, and `jq` resolve to existing executables. `BURP_JAVA` and `BURP_JAR` default to macOS `/Applications/Burp Suite Professional.app/Contents/Resources/...` and Linux `/opt/BurpSuiteProfessional/...`. If any prerequisite is missing, stop and report it. This skill does not parse `.burp` files directly. Done when: Burp Suite, the extension, Java, JAR, and jq are confirmed present.
2. Confirm the project file exists at the supplied path. If not, stop and report the missing file. Done when: the project file is confirmed.
3. If no operation argument is supplied, print usage and stop. Done when: at least one operation is present or usage is printed.
4. Mode `parsed`: preflight result size by running the operation through `wc -cl`:
   ```bash
   "$BURP_JAVA" -Djava.awt.headless=true -jar "$BURP_JAR" \
     --project-file="$PROJECT_FILE" <operation> | wc -cl
   ```
   The `-Djava.awt.headless=true` flag must precede `-jar`. Interpret both metrics: lines under 50 and bytes under 50 KB are safe; lines 50 to 200 or bytes 50 to 200 KB require narrowing; lines over 200 or bytes over 200 KB require further narrowing; lines over 1000 or bytes over 1 MB require stopping and refining. A single large response on one line shows a high byte count but only one line; the byte check catches this. Done when: size is classified as safe, needs narrowing, or stop-and-refine.
5. Mode `parsed`: if the size check is too broad, narrow the operation. Replace full `proxyHistory` or `siteMap` with sub-component filters (`proxyHistory.request.headers`, `proxyHistory.response.headers`, `siteMap.request.headers`, `siteMap.response.headers`). Tighten regex patterns from `.*` to specific content. Pipe through `jq` with a `select` filter before retrieving full output. Done when: the operation is narrowed to pass the size check.
6. Mode `parsed`: retrieve the narrowed result with a hard byte cap of 50 KB:
   ```bash
   "$BURP_JAVA" -Djava.awt.headless=true -jar "$BURP_JAR" \
     --project-file="$PROJECT_FILE" <operation> | head -c 50000
   ```
   Done when: the narrowed result is retrieved with a 50 KB byte cap.
7. Mode `parsed`: truncate body fields and triage audit items using `jq`. For any operation returning a `.body` field, truncate each body to 1000 characters before it enters context:
   ```bash
   ... | head -n 20 | jq -c '.body = (.body[:1000] + "...[TRUNCATED]")'
   ```
   For audit items, triage by severity and confidence:
   ```bash
   ... | jq 'select(.severity == "High")' | jq 'select(.confidence == "Certain" or .confidence == "Firm")'
   ```
   Present Burp findings as indicators requiring manual validation, not proven vulnerabilities. Note that proxy history may be incomplete due to Burp scope filters, intercept settings, or traffic not routed through the proxy. Done when: every body field is truncated, audit items are triaged, and findings are presented as indicators requiring validation.
8. Mode `stream`: run the parser by executing the resolved Java binary headless against the resolved JAR, passing `--project-file=<project-file>` followed by every operation argument verbatim:
   ```bash
   <BURP_JAVA> -Djava.awt.headless=true -jar <BURP_JAR> --project-file=<PROJECT_FILE> <operation...>
   ```
   Stream the JSON output (one object per line) to stdout unchanged. Do not parse, filter, or mutate the output. Done when: the parser is invoked and its output is streamed.

## Failure and recovery

- Missing prerequisite (Burp Suite, extension, Java, JAR, or jq not found): stop and report which prerequisite is missing. Do not attempt to parse `.burp` files directly.
- Project file not found: stop, naming the missing path. No parser invocation occurs.
- Unsupported platform: when `uname -s` is neither Darwin nor Linux and no `BURP_JAVA`/`BURP_JAR` overrides are set, stop and name the platform. The user must set both environment variables.
- Java or JAR not found: stop, naming the missing path and the environment variable to set. No parser invocation occurs.
- No operation supplied: print usage and stop. No parser invocation occurs.
- Result set too large (`parsed` mode, lines over 1000 or bytes over 1 MB after size check): do not retrieve. Report the size, apply sub-component filters or narrower regex, and re-check size before retrieving.
- Regex silently fails on encoded responses: response bodies may be gzip-compressed, chunked, or non-UTF8. Search headers first, try broader patterns, or direct the user to inspect the raw response in Burp's UI.
- Partial results from size cap (`parsed` mode): if `head -c 50000` truncates output mid-stream, report that results are incomplete and the user should narrow the search or inspect remaining records in Burp's UI.
- Parser runtime error (`stream` mode or `parsed` mode): surface the parser's stderr and exit code unchanged. Do not swallow errors or fabricate results.
- Non-mutation: no rollback is needed; this skill only reads the project file through Burp Suite Professional and never modifies it.

## Output

- Mode `parsed`: JSON objects, one per line, piped through `jq`. Audit items include name, severity, confidence, host, port, protocol, and url; header searches return url and header fields; body searches return url and body fields truncated to 1000 characters; total output capped at 50 KB. Findings are presented as indicators requiring validation, not as proof.
- Mode `stream`: raw JSON objects, one per line, streamed to stdout without size caps or body truncation.
