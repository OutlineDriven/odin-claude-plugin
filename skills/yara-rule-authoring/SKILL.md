---
name: yara-rule-authoring
description: 'Use when the user asks to write, review, tighten, optimize, validate, or migrate YARA or YARA-X malware-detection rules including CRX or DEX module rules; the run produces a validated rule with family-specific indicators, correct metadata, bounded performant patterns, and documented validation results. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# YARA-X rule authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to write, review, tighten, optimize, validate, or migrate YARA or YARA-X malware-detection rules, including CRX or DEX module rules. |
| Authority | Reversible-local: create or modify YARA-X rule files on disk; run yr, yara_lint.py, atom_analyzer.py, sample scans, and goodware scans. No remote mutation, credential access, publishing, or deployment. Rollback is file deletion or VCS revert. |
| Side effect | May create or modify YARA-X rule files and run yr, yara_lint.py, atom_analyzer.py, sample scans, and goodware scans. Tool output must distinguish syntax/style/atom defects, positive matches, negative-corpus matches, timing, and unperformed validation rather than collapsing them into one verdict. |
| Done | The resulting rule has family-specific indicators and cheap prefilters, correct endianness and module use, required metadata, bounded performant patterns, passing yr check/format/linter results, documented positive-sample coverage, and zero measured goodware matches, or explicitly states which validation was not run and why. |

## Inputs

- **Rule source or specification** (required): existing rule to review/optimize/migrate, samples to write against, or IOC/threat-intel to convert.
- **Sample corpus** (optional but required for done): positive samples the rule must match.
- **Goodware corpus** (optional but required for done): clean files to verify zero false positives.
- **Target platform** (optional): Windows PE, macOS Mach-O, JavaScript/npm, Chrome extension, Android DEX, Office document. Defaults to PE if not stated.
- Scope boundary: static analysis requiring disassembly, dynamic sandbox analysis, network IDS rules, memory forensics, and plain hash-list detection are out of scope.

## Procedure

1. **Identify target and gather samples.** Determine the malware family, platform, and available samples. Single-sample rules are brittle; gather multiple variants when possible. If the sample is packed (entropy > 7.0, few readable strings, known packer detected), target the unpacked payload or detect the packer itself, not the packed layer.

2. **Extract candidate strings.** Use yarGen (`yarGen.py -m samples/ --excludegood`) or FLOSS (`floss sample.exe` for obfuscated/stack strings) to extract candidates. Expect to discard 80% of output in step 3.

3. **Validate string quality.** Apply every test below to each candidate. Reject a string when any test fails:

   | Test | Why it fails | Do instead |
   |---|---|---|
   | Under 4 bytes | No atom generated | Find a longer string |
   | Repeated bytes (0000, 9090) | Weak atom | Add surrounding context |
   | Common API name (VirtualAlloc, CreateRemoteThread) | Every packer and installer calls it | Hex pattern of the call site plus a unique marker |
   | Appears in Windows system files | Guaranteed false positives | Find something family-specific |
   | Common path (C:\\Windows\\, cmd.exe) | Ubiquitous | Find malware-specific paths |
   | Appears in other malware families | Not identifying this family | Combine with a family-specific marker |

   **String type selection:** exact ASCII/Unicode text for known strings (`ascii wide` only with confirmed encoding evidence); hex bytes for fixed sequences; hex wildcards (`??`) for variable bytes; bounded regex for structured patterns (URLs, paths); XOR modifier for unknown encoding. Never use `nocase` or `wide` speculatively: `nocase` doubles atom generation, `wide` doubles string matching. Prefer hex over regex where bytes are fixed.

   **Value ranking:** mutex names are gold, C2 paths silver, error messages bronze. Stack strings are almost always unique. If more than 6 strings are needed, the rule is over-fitting.

4. **Write the rule with metadata and short-circuiting condition.**

   **Naming:** `{CATEGORY}_{PLATFORM}_{FAMILY}_{VARIANT}_{DATE}` (e.g., `MAL_Win_Emotet_Loader_Jan25`). Categories: `MAL_`, `HKTL_`, `WEBSHELL_`, `EXPL_`, `SUSP_`, `GEN_`. Platforms: `Win_`, `Lnx_`, `Mac_`, `Android_`, `CRX_`.

   **Required metadata:** `description` (starting with "Detects"), `author`, `reference`, `date`.

   **Condition ordering for short-circuit:** `filesize <` (instant), magic bytes (nearly instant), strings (cheap), modules (expensive). If the condition exceeds 5 lines, split into multiple rules.

   **Magic-byte endianness:** `uintNN()` reads little-endian: write the constant as bytes reversed, or use `uintNNbe()` and write in file order. A ZIP/OOXML file starts with bytes `50 4B 03 04`, so `uint32(0) == 0x04034B50` is correct; `uint32(0) == 0x504B0304` compiles but never matches. Mach-O universal binaries on disk are `CA FE BA BE`, so `uint32(0) == 0xCAFEBABE` is dead; write `uint32be(0) == 0xCAFEBABE`. Verify every magic-byte check with `yr scan` against one known-good sample.

   **Platform-specific patterns:**

   | Platform | Magic bytes | Prefer | Avoid |
   |---|---|---|---|
   | Windows PE | `uint16(0) == 0x5A4D` | Mutex names, PDB paths | API names, Windows paths |
   | macOS Mach-O | `uint32(0) == 0xFEEDFACF` (64-bit), `uint32be(0) == 0xCAFEBABE` (universal) | Keylogger artifacts (CGEventTapCreate), persistence paths (~/Library/LaunchAgents), credential theft (security find-generic-password) | Common Obj-C methods |
   | JavaScript | (none) | Obfuscator signatures (_0x, eval+atob), Ethereum function selectors ({ a9 05 9c bb }), specific C2 domains | require, fetch, axios, Buffer, crypto, process.env alone |
   | npm packages | (none) | Suspicious package names, exfil URLs, postinstall hooks | postinstall, dependencies alone |
   | Chrome extensions | Use `crx` module | Permission abuse, manifest anomalies | Common Chrome APIs |
   | Android apps | Use `dex` module | Obfuscated classes, suspicious permissions, DexClassLoader reflection | Standard DEX structure |
   | Office docs | `uint32(0) == 0x04034B50` | Macro auto-exec, encoded payloads | VBA keywords |

   **Condition grouping by confidence:** Group strings by prefix for graduated requirements. Example: `$a*` for library indicators, `$b*` for behavioral, `$c*` for C2: require evidence from multiple categories (`any of ($a*) and any of ($b*)`). Use `any of them` only when each string is individually unique to the malware. Use `all of them` when strings are common but the combination is suspicious.

   **Module vs byte checks:** Use `uint16`/`uint32` for magic bytes and simple offsets (faster, no module overhead). Use PE module for imphash, rich header, authenticode, section names. Use `crx` module for Chrome extension permissions. Use `lnk` module for LNK target paths. If `uint32()` can do the job, do not load a module.

   **Performance rules:**
   - Anchor every regex to a 4+ byte literal prefix. Without anchoring, regex evaluates at every file offset.
   - Bound every regex quantifier: `.{0,30}`, never `.*`. Unbounded regex is a performance disaster and memory explosion.
   - Bound loops with filesize: `filesize < 100KB and for all i in (1..#a) : ...`. Unbounded `#a` can reach thousands.
   - Prefer hex over regex where bytes are fixed.

   **YARA-X version-gated features:** `private $helper = "pattern"` matches but stays out of output (v1.3.0+); `// suppress: slow_pattern` silences a specific warning inline (v1.4.0+); `filesize < 10_000_000` numeric underscores (v1.5.0+); `$_unused` suppresses unused-string warnings.

5. **Run syntax and format validation.**
   ```
   yr check rule.yar
   yr fmt -w rule.yar
   ```
   Fix every error at the reported line number. `yr check` with `--relaxed-re-syntax` is a diagnostic only; fix the regex, then verify without relaxed mode.

6. **Run linter and atom analysis.**
   ```
   uv run yara_lint.py rule.yar
   uv run atom_analyzer.py rule.yar
   ```
   These catch mechanical faults (short strings, FP-prone substrings, unbounded quantifiers, expensive terms ahead of cheap ones). Report findings by code (E002, W009) so the author can look each one up. Direct attention to the judgment calls the scripts cannot make: whether strings identify this family, and whether the condition can fire on generic strings alone.

7. **Validate against positive samples and goodware.**
   ```
   time yr scan -s rule.yar corpus/
   ```
   The rule must match all target samples. A rule matching under 50% of known variants is too narrow. Then scan the goodware corpus: zero matches required. 1-2 goodware matches: investigate and tighten. 3-5: find different indicators. 6+: start over.

8. **Report results with separated signals.** Present each validation category as a distinct result: syntax/format pass or fail with line numbers; linter findings by code; atom quality per string; positive-sample match count and timing; goodware match count; and which validations were not run with the reason. Never collapse these into a single pass/fail verdict.

### Reviewing an existing rule

Run `yara_lint.py` and `atom_analyzer.py` before reading the rule by eye. Quote the codes they emit. Then evaluate whether the strings identify this specific family and whether the condition can fire on generic strings alone.

### Migrating from legacy YARA

Run `yr check --relaxed-re-syntax` to identify issues. Fix each one, then verify without relaxed mode. Common fixes:

| Issue | Legacy | YARA-X fix |
|---|---|---|
| Literal `{` in regex | `/{/` | `/\{/` |
| Invalid escapes | `\R` silently literal | `\\R` or `R` |
| Base64 strings | Any length | 3+ chars required |
| Negative indexing | `@a[-1]` | `@a[#a - 1]` |
| Duplicate modifiers | Allowed | Remove duplicates |

### CRX module (Chrome extensions)

Requires YARA-X v1.5.0+, or v1.11.0+ for `permhash()`. Key APIs: `crx.is_crx`, `crx.permissions`, `crx.permhash()`. Red flags: `nativeMessaging` + `downloads`, `debugger` permission, content scripts on `<all_urls>`.

### DEX module (Android)

Requires YARA-X v1.11.0+. Not compatible with legacy YARA's dex module; the API is completely different. Key APIs: `dex.is_dex`, `dex.contains_class()`, `dex.contains_method()`, `dex.contains_string()`. Red flags: single-letter class names (obfuscation), `DexClassLoader` reflection, encrypted assets.

### When strings fail, pivot to structure

If extraction returns only API names and generic paths: use `math.entropy()` on specific sections for high-entropy detection; use `pe.imphash()` for import-hash clustering; check PE structure anomalies (section names, sizes, characteristics); examine metadata (version info, timestamps, resources). If nothing unique remains, the sample may not be detectable with YARA alone.

### Rationalizations to reject

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

## Failure and recovery
| Failure class | Detection | Recovery |
|---|---|---|
| Syntax error | `yr check` reports line number and message | Fix at reported line; re-run `yr check` until clean |
| Format inconsistency | `yr fmt --check` reports deviation | Run `yr fmt -w` to standardize |
| Linter defect | `yara_lint.py` emits code (E/W) | Fix per code description; re-run linter |
| Atom weakness | `atom_analyzer.py` flags short or FP-prone strings | Replace or enrich flagged strings; re-run atom analysis |
| False positive on goodware | `yr scan` matches goodware file | 1-2 matches: investigate and tighten condition or add exclusion. 3-5: find different indicators. 6+: abandon and restart with different strings. |
| Too narrow (misses variants) | Rule matches under 50% of known variants | Broaden condition or add variant strings; re-validate against goodware |
| Performance regression | `time yr scan` shows excessive time | Anchor regex to 4+ byte literal; bound all quantifiers; prefer hex over regex; add filesize guard to loops |
| Wrong endianness | Magic-byte check compiles but matches zero known-good samples | Switch between `uintNN()` and `uintNNbe()`; verify with `yr scan` against one known-good sample |
| Packed sample | Entropy > 7.0, few readable strings | Target the unpacked payload or detect the packer itself; do not write rules against packed layers |
| Validation not performed | Tool unavailable or corpus missing | Report exactly which validation was skipped and why; never convert unperformed validation into a clean result |

Partial-result rule: if some validations pass and others are not run, report each separately. Never aggregate into a single pass/fail.

Non-mutation rule: rule file creation or modification is the only file mutation. All other operations (scanning, linting, analysis) are read-only on the rule and corpus.

## Output
- **New or modified YARA-X rule file** on disk with proper naming, metadata, short-circuiting condition, and bounded performant patterns.
- **Validation report** with separated signals: syntax/format pass/fail with line numbers; linter findings by code; atom quality per string; positive-sample match count and timing; goodware match count; and explicit statement of which validations were not run and why.
- **Migration report** (when migrating): legacy issues found, fixes applied, post-fix verification without relaxed mode.

## Provenance

Adapted from Trail of Bits skills repository (`plugins/yara-authoring/skills/yara-rule-authoring/SKILL.md`), revision d1f1575cff97816e5cc08af66cd2506099c681d3. Licensed CC-BY-SA-4.0. Source: https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3. Preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. This adaptation restructures the source into the ODIN 2.0 skill contract format, inlines all reference material into the procedure, and preserves every source mechanism (string selection heuristics, condition design, performance optimization, platform patterns, module analysis, migration workflow, rationalization rejection, and separated validation output). No source expression is copied beyond what the CC-BY-SA-4.0 ShareAlike obligation requires; structure and wording are original to this adaptation.
