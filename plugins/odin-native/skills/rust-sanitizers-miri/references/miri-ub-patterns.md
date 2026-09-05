# Miri UB patterns reference

## Undefined behaviour Miri catches

### Pointer provenance violations

```rust
// Wrong: reusing pointer after reallocation
let mut v: Vec<u32> = Vec::with_capacity(4);
let ptr = v.as_ptr();
v.push(1); v.push(2); v.push(3); v.push(4);
v.push(5);           // triggers reallocation
let val = unsafe { *ptr };  // UB: dangling pointer after realloc

// Correct: re-derive pointer after push
v.push(5);
let ptr = v.as_ptr();  // fresh pointer
```

### Transmutation errors

```rust
// UB: invalid enum discriminant
#[repr(u8)]
enum Color { Red = 0, Green = 1, Blue = 2 }

let x: u8 = 99;
let c = unsafe { std::mem::transmute::<u8, Color>(x) };  // UB

// UB: bool with non-0/1 value
let x: u8 = 2;
let b = unsafe { std::mem::transmute::<u8, bool>(x) };  // UB

// UB: reference to unaligned data
let data = [0u8; 5];
let ptr = data[1..].as_ptr() as *const u32;  // misaligned
let val = unsafe { *ptr };  // UB on most platforms
```

### Stacked borrows violations

```rust
// UB: reborrow violation
let mut x = 5u32;
let raw = &mut x as *mut u32;
let r = unsafe { &mut *raw };   // reborrow of raw ptr
let _ = unsafe { *raw };        // UB: accessing raw while reborrow active

// Safe pattern: reborrow scope ended before raw access
{
    let r = unsafe { &mut *raw };
    *r = 10;
}
let _ = unsafe { *raw };        // Now fine -- reborrow ended
```

### Uninitialized memory

```rust
use std::mem::MaybeUninit;

// UB: reading before init
let mut uninit: MaybeUninit<u64> = MaybeUninit::uninit();
let ptr = uninit.as_mut_ptr();
let val = unsafe { ptr.read() };  // UB: reading uninitialized

// Correct: initialize first
unsafe { ptr.write(42) };
let val = unsafe { ptr.read() };   // OK

// UB: partial initialization
let mut buf = MaybeUninit::<[u8; 4]>::uninit();
let ptr = buf.as_mut_ptr() as *mut u8;
unsafe { ptr.write(1) };
// Only first byte initialized; reading all 4 is UB
let arr = unsafe { buf.assume_init() };  // UB
```

### Lifetime extension

```rust
// UB: returning reference to local
fn bad<'a>() -> &'a u32 {
    let x = 42u32;
    unsafe { &*(&x as *const u32) }  // UB: dangling after return
}
```

## MIRIFLAGS quick reference

```bash
# Development (permit host I/O)
MIRIFLAGS="-Zmiri-disable-isolation" cargo +nightly miri test

# CI (strict provenance and number checking)
MIRIFLAGS="-Zmiri-strict-provenance" cargo +nightly miri test

# Concurrency testing with randomized scheduling
MIRIFLAGS="-Zmiri-disable-isolation -Zmiri-seed=42 -Zmiri-num-cpus=4" \
  cargo +nightly miri test

# Ignore intentional leaks (for example, global objects)
MIRIFLAGS="-Zmiri-ignore-leaks -Zmiri-disable-isolation" \
  cargo +nightly miri test

# Full backtraces
MIRIFLAGS="-Zmiri-backtrace=full" cargo +nightly miri test
```

## Miri limitations

Miri cannot run:
- Code using `extern "C"` functions that Miri does not support.
- `asm!` blocks.
- Platform-specific syscalls that Miri has not implemented.
- Long-running programs (the interpreter is much slower than native execution).

Workarounds:

```rust
// Mock FFI functions for Miri testing
#[cfg(not(miri))]
use real_ffi::dangerous_function;

#[cfg(miri)]
fn dangerous_function(x: u32) -> u32 {
    x  // stub for Miri
}
```

## Sanitizer comparison for Rust

| Tool | Detects | Requires | Approximate overhead |
|---|---|---|---|
| Miri | UB in safe and unsafe Rust | nightly, pure Rust | much slower than native (workload-dependent) |
| ASan | Memory errors at runtime | nightly for Rust build | around 2x (workload-dependent) |
| TSan | Data races at runtime | nightly for Rust build | 5-15x (workload-dependent) |
| MSan | Uninit reads at runtime | nightly, all-instrumented | around 3x (workload-dependent) |
| UBSan | Integer UB, null, etc. | nightly | less than 2x (workload-dependent) |
| `cargo check` | Type and lifetime errors | stable | fast |
| Clippy | Common bug patterns | stable | fast |

The overhead numbers are approximate and depend on the workload and microarchitecture. Treat them as guidance, not universal guarantees.
