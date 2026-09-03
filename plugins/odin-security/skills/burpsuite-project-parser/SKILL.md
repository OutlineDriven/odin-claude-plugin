---
name: burpsuite-project-parser
description: 'Use when asked to search or analyze a Burp Suite .burp project to extract audit items, inspect request or response metadata, or search captured traffic. Reads through Burp Suite Professional headless JAR, preflights result size, and returns size-checked JSON with truncated body fields. Findings are indicators requiring validation.'
---

# Burp Suite project parser

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks to search or analyze a Burp Suite .burp project, extract audit items, inspect targeted request or response metadata, or search captured traffic. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The .burp project is read through Burp Suite Professional; no project file is modified. |
| Side effect | The user-selected local .burp project is read through Burp Suite Professional, with output capped and filtered. |
| Done | The requested operation returns relevant, size-checked JSON within record and byte limits, body fields are truncated to at most 1000 characters, and Burp findings are presented as indicators requiring validation rather than proof. |

## Inputs

- Project file path (required): absolute path to a `.burp` project file.
- Operation (required): one of `auditItems`, `proxyHistory`, `siteMap`, `responseHeader='regex'`, `responseBody='regex'`, or a sub-component filter such as `proxyHistory.request.headers`.
- BURP_JAVA (required if not at default platform path): path to Burp Suite Professional's bundled Java executable. Defaults: macOS `/Applications/Burp Suite Professional.app/Contents/Resources/jre.bundle/Contents/Home/bin/java`; Linux `/opt/BurpSuiteProfessional/jre/bin/java`.
- BURP_JAR (required if not at default platform path): path to `burpsuite_pro.jar`. Defaults: macOS `/Applications/Burp Suite Professional.app/Contents/Resources/app/burpsuite_pro.jar`; Linux `/opt/BurpSuiteProfessional/burpsuite_pro.jar`.
- jq (required): used for filtering, truncating body fields, and triaging audit items. Mandatory for core operations.

## Procedure

1. Verify prerequisites: Burp Suite Professional is installed and the burpsuite-project-file-parser extension (github.com/BuffaloWill/burpsuite-project-file-parser) is loaded in Burp Suite. Confirm `BURP_JAVA`, `BURP_JAR`, and `jq` resolve to existing executables. If any is missing, stop and report the missing prerequisite. This skill delegates parsing to Burp Suite Professional; it does not parse `.burp` files directly. Done when: Burp Suite Professional, the extension, Java, JAR, and jq are confirmed present.

2. Confirm the project file exists at the supplied path. If not, stop and report the missing file. Then preflight result size by running the operation through `wc -cl`:
   ```bash
   "$BURP_JAVA" -Djava.awt.headless=true -jar "$BURP_JAR" \
     --project-file="$PROJECT_FILE" <operation> | wc -cl
   ```
   The `-Djava.awt.headless=true` flag must precede `-jar`, not follow it; placing it after `-jar` passes it as a program argument and Burp ignores it. Interpret both metrics: lines under 50 and bytes under 50 KB are safe; lines 50 to 200 or bytes 50 to 200 KB require narrowing; lines over 200 or bytes over 200 KB require further narrowing; lines over 1000 or bytes over 1 MB require stopping and refining. A single large response on one line will show a high byte count but only one line; the byte check catches this. Done when: the size check is run and the result is classified as safe, needs narrowing, or stop-and-refine.

3. If the size check is too broad, narrow the operation before retrieving:
   - Replace full `proxyHistory` or `siteMap` with sub-component filters (`proxyHistory.request.headers`, `proxyHistory.response.headers`, `siteMap.request.headers`, `siteMap.response.headers`). Avoid `.response.body` and `.request.body` sub-filters unless specifically needed; full `proxyHistory` or `siteMap` can return gigabytes.
   - Tighten regex patterns from `.*` to specific header or body content (e.g. `responseHeader='.*X-Frame-Options.*'`).
   - Pipe through `jq` with a `select` filter before retrieving full output.
   Done when: the operation is narrowed to pass the size check.

4. Retrieve the narrowed result with a hard byte cap of 50 KB:
   ```bash
   "$BURP_JAVA" -Djava.awt.headless=true -jar "$BURP_JAR" \
     --project-file="$PROJECT_FILE" <operation> | head -c 50000
   ```
   Done when: the narrowed result is retrieved with a 50 KB byte cap.

5. Truncate body fields and triage audit items using jq. For any operation returning a `.body` field (`responseBody='regex'` or `*.response.body`), truncate each body to 1000 characters before it enters context:
   ```bash
   ... | head -n 20 | jq -c '.body = (.body[:1000] + "...[TRUNCATED]")'
   ```
   Body content exceeding 1000 characters must never enter context. If the user needs full body content, direct them to view it in Burp Suite's UI. For audit items, triage by severity and confidence:
   ```bash
   ... | jq 'select(.severity == "High")' | jq 'select(.confidence == "Certain" or .confidence == "Firm")'
   ```
   A high-severity, tentative-confidence finding is frequently a false positive. Do not report findings based on severity alone. Present Burp findings as indicators requiring manual validation, not as proven vulnerabilities. Note that proxy history may be incomplete due to Burp scope filters, intercept settings, or browser traffic not routed through the proxy. Done when: every body field is truncated to 1000 characters, audit items are triaged by severity and confidence, and findings are presented as indicators requiring validation with the proxy-history caveat noted.

## Failure and recovery

- Missing prerequisite (Burp Suite Professional, extension, Java, JAR, or jq not found): stop and report which prerequisite is missing. Do not attempt to parse `.burp` files directly.
- Result set too large (lines over 1000 or bytes over 1 MB after size check): do not retrieve. Report the size, apply sub-component filters or narrower regex, and re-check size before retrieving.
- Regex silently fails on encoded responses: response bodies may be gzip-compressed, chunked, or non-UTF8. If a body search returns fewer results than expected, search headers first, try broader patterns, or direct the user to inspect the raw response in Burp's UI.
- Partial results from size cap: if `head -c 50000` truncates output mid-stream, report that results are incomplete and the user should narrow the search or inspect remaining records in Burp's UI.
- Non-mutation: no rollback is needed; the skill only reads the project file through Burp Suite Professional and never modifies it.

## Output

JSON objects, one per line, piped through `jq` for formatting. Audit items include name, severity, confidence, host, port, protocol, and url; header searches return url and header fields; body searches return url and body fields truncated to 1000 characters; total output capped at 50 KB. Burp findings are presented as indicators requiring validation, not as proof.
