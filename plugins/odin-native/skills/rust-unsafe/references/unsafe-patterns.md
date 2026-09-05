# Rust unsafe patterns reference

## The unsafe contract

Every `unsafe` block has an implicit contract: the programmer claims all safety invariants are upheld. Document them:

```rust
// Always document with a Safety comment
// # Safety
// - `ptr` must be non-null
// - `ptr` must be aligned to `align_of::<T>()`
// - `ptr` must point to `len` initialized values of type `T`
// - The memory must remain valid and not be mutated for the lifetime of the returned slice
unsafe fn raw_slice<'a, T>(ptr: *const T, len: usize) -> &'a [T] {
    std::slice::from_raw_parts(ptr, len)
}
```

## Raw pointer patterns

### NonNull: non-null raw pointer wrapper

```rust
use std::ptr::NonNull;

struct Node<T> {
    data: T,
    next: Option<NonNull<Node<T>>>,
}

// Create NonNull
let boxed = Box::new(42u32);
let nn: NonNull<u32> = NonNull::new(Box::into_raw(boxed)).unwrap();

// Dereference (unsafe)
let val = unsafe { nn.as_ref() };

// Convert back to Box (takes ownership, will drop)
let boxed_again = unsafe { Box::from_raw(nn.as_ptr()) };
```

### Pointer arithmetic

```rust
let arr = [1u32, 2, 3, 4, 5];
let ptr = arr.as_ptr();

// Offset by count (wrapping_add is safe to call, dereference still unsafe)
let p3 = ptr.wrapping_add(2);  // no UB even if out of bounds (do not deref)
let third = unsafe { *ptr.add(2) };  // add: UB if out of bounds even without deref

// Distance between pointers
let end = unsafe { ptr.add(arr.len()) };
let count = unsafe { end.offset_from(ptr) };  // count == 5
```

### Read and write without creating references

```rust
// ptr::read: copies T out without binding lifetime
let val: u32 = unsafe { std::ptr::read(ptr) };

// ptr::write: writes T without dropping old value
unsafe { std::ptr::write(mut_ptr, new_val) };

// ptr::copy: memcpy (may overlap for copy_nonoverlapping)
unsafe { std::ptr::copy_nonoverlapping(src, dst, count) };
unsafe { std::ptr::copy(src, dst, count) };  // overlapping OK

// ptr::drop_in_place: run destructor without freeing memory
unsafe { std::ptr::drop_in_place(ptr) };
```

## Safe abstraction patterns

### Invariant-based safety

```rust
use std::ptr::NonNull;

pub struct AlignedBuffer {
    ptr: NonNull<u8>,
    len: usize,
    align: usize,
}

impl AlignedBuffer {
    pub fn new(len: usize, align: usize) -> Option<Self> {
        let layout = std::alloc::Layout::from_size_align(len, align).ok()?;
        // Safety: layout is valid; alloc_zeroed returns initialized bytes.
        let ptr = unsafe { std::alloc::alloc_zeroed(layout) };
        let ptr = NonNull::new(ptr)?;  // null check
        Some(Self { ptr, len, align })
    }

    pub fn as_slice(&self) -> &[u8] {
        // Safety: ptr is non-null, aligned, and points to len zero-initialized bytes.
        // Invariant maintained by constructor and no unsafe mutations.
        unsafe { std::slice::from_raw_parts(self.ptr.as_ptr(), self.len) }
    }
}
```

### Pin and self-referential structs

```rust
use std::pin::Pin;
use std::marker::PhantomPinned;
use std::ptr::addr_of;

// Pin prevents moving the value (required for self-referential structs and async).
// PhantomPinned makes the type !Unpin so the pinned value cannot be moved.
struct SelfRef {
    data: String,
    data_ref: *const String,  // points into self
    _pin: PhantomPinned,
}

impl SelfRef {
    fn new(s: String) -> Pin<Box<Self>> {
        let mut boxed = Box::pin(SelfRef {
            data: s,
            data_ref: std::ptr::null(),
            _pin: PhantomPinned,
        });
        // Safety: we are setting data_ref to point to our own data field.
        // addr_of! avoids creating a shared reference, so the raw pointer
        // descends from the &mut tag and is not invalidated by the write.
        // Pin and PhantomPinned guarantee the Box will not move,
        // so data_ref remains valid for the lifetime of the Box.
        unsafe {
            let this = boxed.as_mut().get_unchecked_mut();
            this.data_ref = addr_of!(this.data);
        }
        boxed
    }
}
```

## Transmute safety table

| From | To | Safe? | Alternative |
|---|---|---|---|
| `u32` | `f32` | yes (same size) | `f32::from_bits(u)` |
| `[u8; 4]` | `u32` | yes | `u32::from_ne_bytes(arr)` |
| `&T` | `*const T` | yes | `ptr as *const T` |
| `*mut T` | `*const T` | yes | `ptr as *const T` |
| `&'a T` | `&'b T` (longer) | no | Restructure lifetimes |
| `Box<T>` | `*mut T` | yes | `Box::into_raw(b)` |
| `u8` | `bool` | no, unless 0/1 | Match on value |
| `u8` | `MyEnum` | no, unless valid tag | `MyEnum::try_from(u)` |
| `i32` | `u32` | yes | `i as u32` |
| `Vec<T>` | `Vec<U>` | no | Manual conversion |

## Miri testing for unsafe

```bash
# Run unsafe tests under Miri
cargo +nightly miri test

# With stricter provenance checking
MIRIFLAGS="-Zmiri-strict-provenance" cargo +nightly miri test

# Isolate a specific test
cargo +nightly miri test test_my_unsafe_fn
```

Pattern for testable unsafe:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_raw_slice_roundtrip() {
        let data = vec![1u32, 2, 3, 4, 5];
        let slice = unsafe { raw_slice(data.as_ptr(), data.len()) };
        assert_eq!(slice, &[1, 2, 3, 4, 5]);
    }
}
```

## Clippy for unsafe

```bash
# Run all lints including unsafe-related
cargo clippy -- -W clippy::undocumented-unsafe-blocks \
               -W clippy::multiple-unsafe-ops-per-block \
               -W clippy::transmute-undefined-repr \
               -W clippy::ptr-as-ptr

# Deny undocumented unsafe blocks in production code
#![deny(clippy::undocumented_unsafe_blocks)]
```

## Stacked borrows rules

1. Each borrow creates a new tag on the borrow stack.
2. `&mut T` access pops all borrows above it from the stack and invalidates them.
3. `&T` access is valid as long as the shared reference is on the stack.
4. Raw pointer access is valid only if its tag is still on the stack at the time of access.

Violation example:

```rust
let mut x = 5u32;
let raw = &mut x as *mut u32;
let shared = &x;         // shared borrow pushed onto stack
let _ = unsafe { *raw }; // VIOLATION: raw's &mut tag was invalidated by &x
```
