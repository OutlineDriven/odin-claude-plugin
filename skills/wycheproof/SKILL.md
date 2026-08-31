---
name: wycheproof
description: 'Use when validating a cryptographic implementation against Project Wycheproof vectors or explaining a vector disagreement. Produces parameterized valid, invalid, and acceptable cases with stable tcId identifiers. Not for zeroization auditing — use zeroize-audit.'
---

# Wycheproof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user needs to validate a cryptographic implementation against Wycheproof vectors or explain a vector disagreement. |
| Authority | Reversible-local: write only named local test files and vector loaders; recover via version control. |
| Side effect | Cryptographic vector loader and parameterized test files written to the project. |
| Done | Relevant valid, invalid, and acceptable vectors execute with explicit expectations and stable case identifiers. |

## Inputs

- **Algorithm target**: the cryptographic construction under test (AES-GCM, AES-EAX, ChaCha20-Poly1305, ECDSA, ECDH, EdDSA, RSA-PKCS1, RSA-PSS, HMAC, HKDF, X25519, X448). Required.
- **Test vector source**: either a Wycheproof git submodule at `wycheproof/` or a fetchable set of JSON files from `https://raw.githubusercontent.com/C2SP/wycheproof/master/testvectors_v1/`. Required.
- **Implementation under test**: the crypto library or module to validate. Required.
- **Test framework**: pytest (Python), mocha or jest (JavaScript), or equivalent parameterized test runner. Required.

## Procedure

1. **Acquire test vectors.** If no Wycheproof submodule exists, either add one (`git submodule add https://github.com/C2SP/wycheproof.git`) or fetch the relevant JSON files from `testvectors_v1/` into a local `.wycheproof/` directory. Use `testvectors_v1/` over `testvectors/` for more detailed metadata. Done when: the test vector JSON file is available locally.
2. **Select the test file.** Map the algorithm target to its JSON file:

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

   Done when: the correct JSON file is selected for the algorithm target.
3. **Parse the JSON.** Each file contains `algorithm`, `numberOfTests`, `notes` (flag definitions), and `testGroups`. Each test group shares attributes (key size, IV size, curve). Each test vector has:
   - `tcId`: stable unique identifier within the file.
   - `comment`: human-readable explanation.
   - `flags`: list of vulnerability patterns being tested (e.g., `ModifiedTag`, `PointDuplication`, `WeakPublicKey`).
   - `result`: one of `valid`, `invalid`, or `acceptable`.
   - Algorithm-specific fields (e.g., `key`, `iv`, `aad`, `msg`, `ct`, `tag` for AES-GCM; `msg`, `sig`, `pk` for EdDSA; `public`, `private`, `shared` for ECDH).

   Done when: the JSON is parsed and test groups with their vectors are identified.
4. **Filter test groups.** Select only groups matching the implementation's constraints (key size, IV size, curve). Skip groups outside supported parameters. Done when: only matching test groups are selected.
5. **Convert hex to bytes.** Fields like `key`, `iv`, `aad`, `msg`, `ct`, `tag`, `sig`, `pk`, `public`, `private`, `shared` are hex-encoded in the JSON. Convert to the implementation's byte type before use. Done when: all hex fields are converted to bytes.
6. **Write parameterized tests.** Create one test function parameterized over all selected vectors, using `tcId` as the stable test identifier:
   - For `result == "valid"`: the operation must succeed and produce expected output.
   - For `result == "invalid"`: the operation must fail (raise an exception or return false).
   - For `result == "acceptable"`: the operation may succeed or fail; log the outcome but do not fail the test.
   - Use `tv['comment']` in assertion messages for diagnosability.

   Done when: the parameterized test function covers all selected vectors with correct expectations per result type.
7. **Test both directions.** For symmetric operations (encrypt/decrypt, sign/verify), write separate parameterized tests for each direction. A library may accept invalid inputs in one direction but not the other. Done when: both directions have separate parameterized tests.
8. **Run and analyze.** Execute the test suite. For each failure:
   - Read the `comment` and `flags` fields to understand the vulnerability pattern.
   - Check the `notes` field in the test file for flag definitions.
   - Determine whether the failure is a genuine implementation bug or a parameter mismatch.

   Done when: the suite is executed and every failure is analyzed with comment, flags, and notes.
9. **Integrate into CI.** Add the Wycheproof test suite to the project's CI pipeline. If using a submodule, update it on a schedule (weekly or monthly) to catch new test vectors. Done when: the suite is integrated into CI with a submodule update schedule if applicable.

## Failure and recovery
- **Missing test vector file**: abort and report the expected file path. Do not generate synthetic vectors.
- **Parameter mismatch**: if no test groups match the implementation's constraints, report which filters excluded all groups and ask the human to verify parameters.
- **Acceptable-case ambiguity**: log acceptable results as warnings; never fail on acceptable alone.
- **Partial run**: if the suite is interrupted, report which `tcId` ranges completed and which did not. Do not claim the done predicate holds for untested vectors.

## Output
A parameterized test file covering valid, invalid, and acceptable Wycheproof vectors for the target algorithm — stable `tcId`-based test identifiers, assertion messages referencing `comment` and `flags`, and a summary of pass/fail/warn counts per result category.
