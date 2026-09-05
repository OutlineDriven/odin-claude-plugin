# Hardening flags reference

Full hardened build commands and per-flag support. Grounded channels: GCC 16.x, Clang 23.1.0, binutils 2.47, glibc 2.44. Source of the flag set: the OpenSSF Compiler Options Hardening Guide.

## Complete hardened build (GCC, Linux)

```bash
CFLAGS="-O2 -pipe \
  -Wall -Wformat -Wformat-security -Werror=format-security \
  -fstack-protector-strong \
  -fstack-clash-protection \
  -fcf-protection \
  -D_FORTIFY_SOURCE=3 \
  -D_GLIBCXX_ASSERTIONS \
  -fPIE"

LDFLAGS="-pie \
  -Wl,-z,relro \
  -Wl,-z,now \
  -Wl,-z,noexecstack \
  -Wl,-z,nodlopen \
  -Wl,-z,nodump \
  -Wl,--as-needed"

gcc ${CFLAGS} ${LDFLAGS} -o prog main.c
```

## Clang (Linux)

Clang has no `-D_GLIBCXX_ASSERTIONS` dependency difference; keep it for C++ code. SafeStack is an optional extra and changes the ABI:

```bash
CFLAGS="-O2 \
  -fstack-protector-strong \
  -fstack-clash-protection \
  -D_FORTIFY_SOURCE=3 \
  -fPIE"

LDFLAGS="-pie -Wl,-z,relro -Wl,-z,now -Wl,-z,noexecstack"

clang ${CFLAGS} ${LDFLAGS} -o prog main.c
```

## Shared libraries

`-fPIC`, not `-fPIE`; link with `-shared` and keep the relro flags:

```bash
gcc -O2 -fPIC -fstack-protector-strong -D_FORTIFY_SOURCE=2 \
    -shared -Wl,-z,relro -Wl,-z,now -Wl,-z,noexecstack \
    -o libfoo.so foo.c
```

## Flag support matrix

| Flag | Compiler support | Effect |
|---|---|---|
| `-fstack-protector-strong` | GCC, Clang | Canary on at-risk functions |
| `-fstack-protector-all` | GCC, Clang | Canary everywhere; slowest |
| `-fstack-clash-protection` | GCC 8+, Clang 11+ | Stack-heap collision guard |
| `-fcf-protection` | GCC 8+, Clang | x86 CET markers (IBT plus SHSTK) |
| `-D_FORTIFY_SOURCE=2` | GCC, Clang | Checked libc wrappers |
| `-D_FORTIFY_SOURCE=3` | GCC 12+, Clang 9+, glibc 2.34+ headers | Dynamic object size checks |
| `-fPIE` / `-pie` | GCC, Clang | Position-independent executable |
| `-Wl,-z,relro` | binutils ld | GOT read-only after relocation |
| `-Wl,-z,now` | binutils ld | Eager binding; Full RELRO with relro |
| `-Wl,-z,noexecstack` | binutils ld | NX stack |
| `-Wl,-z,separate-code` | binutils ld | Separate code and data segments |
| `-Wl,-z,ibt`, `-Wl,-z,shstk` | binutils ld | Stamp the CET GNU property notes directly |
| `-fsanitize=cfi` | Clang, requires `-flto` | Control flow integrity |
| `-fsanitize=safe-stack` | Clang | SafeStack; ABI-changing |
| `-Wformat-security` / `-Werror=format-security` | GCC, Clang | Reject risky format strings |

## Distribution defaults

Distributions differ and change; query the machine instead of trusting a table:

```bash
dpkg-buildflags --query            # Debian, Ubuntu
rpm --eval "%{build_cflags}"       # Fedora, RHEL
```

One verified anchor point: Fedora 38 and later build with `_FORTIFY_SOURCE=3`.
