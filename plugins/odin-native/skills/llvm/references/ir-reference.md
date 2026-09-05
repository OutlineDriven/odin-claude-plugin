# LLVM IR reference

Source: https://llvm.org/docs/LangRef.html. Every snippet below assembles with `llvm-as` on LLVM 23.1.0.

## Types

| Type | Meaning |
|---|---|
| `i1` | 1-bit integer, used as a boolean |
| `i8`, `i16`, `i32`, `i64` | Integer of N bits; any width is legal |
| `float`, `double` | 32-bit and 64-bit IEEE 754 |
| `ptr` | Opaque pointer; the only pointer type since LLVM 15 |
| `[N x T]` | Array of N elements of T |
| `{T1, T2}` | Struct; `<{T1, T2}>` is packed |
| `<N x T>` | Vector of N elements of T |
| `void` | No value |

## Instructions

Memory:

```llvm
define i32 @mem(ptr %base) {
  %slot = alloca i32, align 4
  store i32 42, ptr %slot, align 4
  %v = load i32, ptr %slot, align 4
  %next = getelementptr i32, ptr %base, i64 1
  %w = load i32, ptr %next, align 4
  %sum = add i32 %v, %w
  ret i32 %sum
}
```

Arithmetic and bitwise: `add`, `sub`, `mul`, `sdiv`, `udiv`, `srem`, `urem`, `shl`, `lshr` (logical right), `ashr` (arithmetic right), `and`, `or`, `xor`. Each takes two operands of one integer or vector type.

Comparison: `icmp <pred> i32 %a, %b` with predicates `eq ne slt sle sgt sge ult ule ugt uge`; `fcmp <pred> float %a, %b` with ordered predicates `oeq one olt ole ogt oge ord` and the unordered `uno`.

Control flow and SSA merge:

```llvm
define i32 @flow(i32 %x) {
entry:
  %c = icmp sgt i32 %x, 0
  br i1 %c, label %pos, label %nonpos
pos:
  br label %join
nonpos:
  br label %join
join:
  %r = phi i32 [ 1, %pos ], [ 0, %nonpos ]
  switch i32 %r, label %done [ i32 0, label %zero ]
zero:
  ret i32 0
done:
  ret i32 %r
}
```

Conversion: `trunc` narrows, `zext` and `sext` widen, `fptrunc` and `fpext` change float width, `sitofp` and `uitofp` go integer to float, `fptosi` and `fptoui` go float to integer, `ptrtoint` and `inttoptr` cross between pointers and integers, `bitcast` reinterprets bits of equal width.

## Attributes

```llvm
declare i32 @callee(i32 noundef, ptr nonnull)
define i32 @attrs(i32 %x, ptr %p) noinline nounwind {
  %r = call i32 @callee(i32 %x, ptr %p)
  ret i32 %r
}
define i32 @hot() alwaysinline {
  ret i32 1
}
```

Function attributes seen most often: `noinline`, `alwaysinline`, `nounwind` (never unwinds), `noreturn`, and the memory-effect attributes `memory(read)` and `memory(none)` that replaced `readonly` and `readnone` on functions in LLVM 16. Parameter attributes: `noundef`, `nonnull`, `nocapture`, `align N`.
