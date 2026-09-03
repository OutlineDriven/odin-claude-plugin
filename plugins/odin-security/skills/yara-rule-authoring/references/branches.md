# YARA branch detail

Branch-specific procedure detail for `yara-rule-authoring`. Each section applies only when the run takes that branch.

## Reviewing an existing rule

Run `yara_lint.py` and `atom_analyzer.py` before reading the rule by eye. Quote the codes they emit. Then evaluate whether the strings identify this specific family and whether the condition can fire on generic strings alone.

## Migrating from legacy YARA

Run `yr check --relaxed-re-syntax` to identify issues. Fix each one, then verify without relaxed mode. Common fixes:

| Issue | Legacy | YARA-X fix |
|---|---|---|
| Literal `{` in regex | `/{/` | `/\{/` |
| Invalid escapes | `\R` silently literal | `\\R` or `R` |
| Base64 strings | Any length | 3+ chars required |
| Negative indexing | `@a[-1]` | `@a[#a - 1]` |
| Duplicate modifiers | Allowed | Remove duplicates |

## CRX module (Chrome extensions)

Requires YARA-X v1.5.0+, or v1.11.0+ for `permhash()`. Key APIs: `crx.is_crx`, `crx.permissions`, `crx.permhash()`. Red flags: `nativeMessaging` + `downloads`, `debugger` permission, content scripts on `<all_urls>`.

## DEX module (Android)

Requires YARA-X v1.11.0+. Not compatible with legacy YARA's dex module; the API is completely different. Key APIs: `dex.is_dex`, `dex.contains_class()`, `dex.contains_method()`, `dex.contains_string()`. Red flags: single-letter class names (obfuscation), `DexClassLoader` reflection, encrypted assets.

## When strings fail, pivot to structure

If extraction returns only API names and generic paths, use `math.entropy()` on specific sections for high-entropy detection, use `pe.imphash()` for import-hash clustering, check PE structure anomalies (section names, sizes, characteristics), and examine metadata (version info, timestamps, resources). If nothing unique remains, the sample may not be detectable with YARA alone.

## Rationalizations to reject

When these appear in the agent's own thinking, stop and reconsider:

| Rationalization | Response |
|---|---|
| "This generic string is unique enough" | Unique in one sample does not mean unique across the ecosystem. Test against goodware. |
| "yarGen gave me these strings" | yarGen suggests; validate each one manually; expect to discard 80%. |
| "It works on my 10 samples" | 10 samples is not production. Use a goodware corpus. |
| "One rule to catch all variants" | Causes FP floods. Target specific families. |
| "I'll make it more specific if we get FPs" | Write tight rules upfront. A weak rule deployed is damage done. |
| "This is just for hunting" | Hunting rules become detection rules. Same quality bar. |
| "The API name makes it malicious" | Legitimate software uses the same APIs. Need behavioral context. |
| "any of them is fine for these common strings" | Common strings + any = FP flood. Use any of only for individually unique strings. |
| "This regex is specific enough" | `/fetch.*token/` matches all auth code. Add an exfil destination requirement. |
| "I'll use .* for flexibility" | Unbounded regex = performance disaster plus memory explosion. Use `.{0,30}`. |
| "Performance doesn't matter" | One slow rule slows the entire ruleset. Optimize atoms. |
| "I'll use --relaxed-re-syntax everywhere" | Masks real bugs. Fix the regex instead. |
