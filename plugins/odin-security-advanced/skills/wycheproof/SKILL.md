---
name: wycheproof
description: 'Use when validating a cryptographic implementation against Project Wycheproof vectors to prove it accepts/rejects them correctly, or when explaining why an implementation disagrees with a vector. Produces parameterized valid, invalid, and acceptable cases with stable tcId identifiers and a per-category pass/fail/warn summary. Not for mutation-driven vector creation — use vector-forge. Not for zeroization auditing — use zeroize-audit.'
---

# Wycheproof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user needs to prove a cryptographic implementation accepts or rejects Project Wycheproof vectors correctly, or needs to explain why an implementation disagrees with a vector. |
| Authority | Reversible-local writes limited to named vector-loader and test files, recovered via version control. Vector acquisition (submodule add or network fetch) and any CI or scheduling change are separate, explicitly confirmed steps outside the core path. |
| Side effect | Cryptographic vector loader and parameterized test files written to the project. |
| Done | The parameterized test file(s) with stable tcId identifiers exist, the suite has been executed, and a per-result-category pass/fail/warn summary is assembled. |

## Inputs

Required:
- Algorithm target: the cryptographic construction under test (AES-GCM, AES-EAX, ChaCha20-Poly1305, ECDSA, ECDH, EdDSA, RSA-PKCS1, RSA-PSS, HMAC, HKDF, X25519, X448).
- Implementation under test: the crypto library or module to validate, with its parameter constraints (key size, curve, hash).
- Test framework: pytest (Python), mocha or jest (JavaScript), or equivalent parameterized test runner.
- Vector-acquisition policy: one of (a) existing local Wycheproof submodule at `wycheproof/`, (b) a fetched JSON snapshot from `https://raw.githubusercontent.com/C2SP/wycheproof/master/testvectors_v1/`, or (c) pre-existing local JSON files, confirmed by the human up front.

## Procedure

1. **Acquire or locate the algorithm's JSON under the confirmed policy.** If the policy is an existing submodule, locate the JSON at `wycheproof/testvectors_v1/<file>`. If the policy is a fetched snapshot, confirm the local `.wycheproof/` directory contains the file. If the policy is pre-existing local files, confirm the path. If the file is absent under the confirmed policy, halt with `BLOCKED: missing vector file` and name the expected path. Do not acquire vectors yourself; vector acquisition is a separate, explicitly confirmed step outside the core path. Map the algorithm target to its JSON file:

   | Algorithm | File |
   |---|---|
   | AES-GCM | `aes_gcm_test.json` |
   | AES-EAX | `aes_eax_test.json` |
   | ChaCha20-Poly1305 | `chacha20_poly1305_test.json` |
   | ECDSA | `ecdsa_<curve>_test.json` |
   | ECDH | `ecdh_<curve>_test.json` |
   | EdDSA | `ed25519_test.json` or `ed448_test.json` |
   | RSA-PKCS1 | `rsa_signature_pkcs1_*_test.json` |
   | RSA-PSS | `rsa_pss_*_test.json` |
   | HMAC | `hmac_<hash>_test.json` |
   | HKDF | `hkdf_test.json` |
   | X25519 | `x25519_test.json` |
   | X448 | `x448_test.json` |

   Done when: the JSON file is confirmed present locally under the confirmed policy.

2. **Parse, filter test groups, and convert hex fields.** Each file contains `algorithm`, `numberOfTests`, `notes` (flag definitions), and `testGroups`. Each test group shares attributes (key size, IV size, curve). Each test vector has `tcId` (stable unique identifier), `comment`, `flags` (vulnerability patterns tested), `result` (`valid`, `invalid`, or `acceptable`), and algorithm-specific hex-encoded fields (`key`, `iv`, `aad`, `msg`, `ct`, `tag`, `sig`, `pk`, `public`, `private`, `shared`). Select only groups matching the implementation's constraints (key size, IV size, curve). Skip groups outside supported parameters. Convert all hex fields to the implementation's byte type. If no test groups match the implementation's constraints, halt with `BLOCKED: no matching test groups` and report which filters excluded all groups. Done when: matching test groups are selected and all hex fields are converted to bytes.

3. **Write tcId-stable parameterized expectations for both directions.** Create one test function parameterized over all selected vectors, using `tcId` as the stable test identifier:
   - For `result == "valid"`: the operation must succeed and produce expected output.
   - For `result == "invalid"`: the operation must fail (raise an exception or return false).
   - For `result == "acceptable"`: the operation may succeed or fail; log the outcome but do not fail the test.
   - Use `tv['comment']` in assertion messages for diagnosability.
   For symmetric operations (encrypt/decrypt, sign/verify), write separate parameterized tests for each direction. A library may accept invalid inputs in one direction but not the other. Done when: the parameterized test function covers all selected vectors with correct expectations per result type in both operation directions.

4. **Run the suite and analyze each failure.** Execute the test suite. For each failure:
   - Read the `comment` and `flags` fields to understand the vulnerability pattern.
   - Check the `notes` field in the test file for flag definitions.
   - Classify the failure as an implementation bug or a parameter mismatch. An implementation bug means the library accepts an invalid vector or rejects a valid one. A parameter mismatch means the test group's constraints do not match the implementation's actual parameters and the group should have been filtered in stage 2.
   This stage also serves the explain-a-disagreement trigger: when the user asks why an implementation disagrees with a vector, the answer is the classification plus the comment, flags, and notes that explain the vector's intent. Done when: the suite is executed and every failure is classified as implementation bug or parameter mismatch with comment, flags, and notes recorded.

5. **Assemble the per-category pass/fail/warn summary.** Summarize results by category:
   - valid: count passed, count failed.
   - invalid: count passed (correctly rejected), count failed (incorrectly accepted).
   - acceptable: count succeeded, count failed, all logged as warnings.
   For each failed case, include the `tcId`, `comment`, `flags`, and the classification (implementation bug or parameter mismatch). Done when: the per-category summary is assembled with counts and per-failure detail.

## Failure and recovery

- BLOCKED: missing vector file: the JSON file is absent under the confirmed acquisition policy. Report the expected path. Do not generate synthetic vectors or acquire vectors outside the confirmed policy.
- BLOCKED: no matching test groups: all groups were excluded by the implementation's constraint filters. Report which filters excluded all groups and ask the human to verify parameters.
- PARTIAL: interrupted run: report which `tcId` ranges completed and which did not. Never claim Done for untested vectors.
- Acceptable-vector disagreements: log as warnings only. Never fail a test on an acceptable result alone.

## Output

The parameterized test file(s) with stable `tcId` identifiers, an executed suite, and a per-result-category pass/fail/warn summary, or `BLOCKED`/`PARTIAL` with the named state. The summary names each failed case with its `tcId`, `comment`, `flags`, and classification.
