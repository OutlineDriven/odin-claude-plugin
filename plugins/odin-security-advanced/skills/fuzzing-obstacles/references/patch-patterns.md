# Patch patterns

Branch-specific bypass and safe-default code patterns for steps 2 and 4 of
the SKILL.md procedure. The shared spine (identify the obstacle, wrap behind
the fuzzing build flag, patch incrementally, verify coverage, assess risk)
stays in SKILL.md; this file carries the per-language code patterns.

## Fuzzing build flags

- C/C++: `FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION` (the libFuzzer/AFL++/LibAFL/honggfuzz convention).
- Rust: `cfg!(fuzzing)` (cargo-fuzz / libFuzzer).

## Checksum bypass (C/C++)

```c++
if (computed != expected_checksum) {
#ifndef FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION
    return ERROR_INVALID_HASH;
#endif
}
process_data(data, size);
```

## Checksum bypass (Rust)

```rust
if checksum != expected_hash {
    if !cfg!(fuzzing) {
        return Err(MyError::Hash);
    }
}
```

## Deterministic PRNG seeding (C/C++)

Replace a system-seeded `srand(time(NULL))` with a fixed seed under the
fuzzing flag so the same input always produces the same behavior.

## Safe defaults when downstream code assumes validated state (C/C++)

```c++
#ifndef FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION
if (!validate_config(&config)) { return -1; }
#else
if (!validate_config(&config)) { config.x = 1; config.y = 1; }
#endif
```
