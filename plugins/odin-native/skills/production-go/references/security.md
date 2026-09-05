# Security Patterns in Go

Go's stdlib is increasingly *secure by default*: post-quantum TLS, traversal-resistant file APIs, token-less CSRF, and a native FIPS module now ship in the box, capabilities that used to require third-party deps. The job is to **use the modern primitive instead of the legacy hand-roll**, and to stop emitting patterns that were already wrong in 2020. Most AI-generated Go security code is stale, not insecure-by-malice: it reaches for `filepath.Clean`+`HasPrefix`, `math/rand`, `gorilla/csrf`, and `InsecureSkipVerify`. This file is the delta.

> Source horizon: verified against Go **1.26.x** (stable, Feb 2026) + **1.27 RC** notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md). Version tags `[1.N]` mark the release a claim landed in. Triangulated from multi-source research and primary sources (go.dev release notes, pkg.go.dev, go.dev/security).

## TL;DR: the modern deltas (read first)

- Path traversal: use `os.Root`/`os.OpenInRoot` [1.24], not `filepath.Clean`+`HasPrefix`. The lexical guard is bypassable via symlinks and TOCTOU; `os.Root` uses OS-level directory descriptors (`openat`) so escapes are *refused by the kernel*. Method set **expanded [1.25]** (`WriteFile`, `Rename`, `MkdirAll`, `RemoveAll`, …).
- CSRF: use `net/http.CrossOriginProtection` [1.25], which is token-less, cookie-less, and Fetch-metadata based. `gorilla/csrf` has **GO-2025-3884 / CVE-2025-24358 with no fix**; migrate. Backport: `filippo.io/csrf`.
- PQ TLS: on by default with `X25519MLKEM768` [1.24], plus `SecP256r1MLKEM768`/`SecP384r1MLKEM1024` [1.26]. No code needed. Setting `CurvePreferences` to legacy curves *silently drops* it.
- `math/rand` and `math/rand/v2` are **never** acceptable for secrets: "v2 uses ChaCha8 so it's secure" is **false** (no CSPRNG guarantee). Use `crypto/rand`; `rand.Text()` [1.24] for tokens.
- [1.26] the `io.Reader` arg to key-gen/sign is **ignored** (`ecdsa.GenerateKey`, `rsa.GenerateKey`, `rand.Prime`, `ecdh`, `dsa`, `ed25519`-nil). System CSPRNG is always used. Deterministic tests must use `testing/cryptotest.SetGlobalRandom` [1.26], not an injected reader.
- TLS `CipherSuites` does nothing for TLS 1.3 and its order is ignored [1.17]; `PreferServerCipherSuites` is ignored. Control security via `MinVersion`, not a hand-rolled suite list.
- For pinning, use `VerifyConnection`, not `VerifyPeerCertificate`; the latter is skipped on resumed sessions.

## Table of Contents
1. [OWASP Top 10 Mapping](#owasp)
2. [Input Validation](#input-validation)
3. [SQL Injection Prevention](#sql-injection)
4. [Command Injection & Path Traversal (os.Root)](#injection-exec)
5. [Templates & XSS (html vs text/template)](#templates-xss)
6. [Randomness & crypto/rand](#randomness)
7. [TLS Configuration](#tls)
8. [Post-Quantum & Modern Cryptography](#post-quantum)
9. [Constant-Time & Crypto Hygiene](#crypto-hygiene)
10. [Authentication (JWT)](#jwt)
11. [Password Hashing](#passwords)
12. [Sessions & CSRF (CrossOriginProtection)](#csrf)
13. [Secrets Management & redaction](#secrets)
14. [HTTP Security Headers](#http-security)
15. [Runtime Hardening](#runtime-hardening)
16. [Static Analysis & govulncheck](#static-analysis)
17. [Library landscape & status](#libraries)
18. [Version map 1.20→1.27](#versions)
19. [What models get wrong](#stale)

---

## OWASP Top 10 Mapping {#owasp}

| OWASP | Go-specific mitigation (2026) | Section |
|---|---|---|
| **A01** Broken Access Control | Authz at boundary; **`os.Root` [1.24]** for path confinement (not `Clean`+`HasPrefix`) | [JWT](#jwt), [Injection](#injection-exec) |
| **A02** Cryptographic Failures | `crypto/rand` (never `math/rand`); TLS 1.2+ floor; bcrypt/argon2id; OAEP not PKCS#1v1.5 [1.26-dep] | [TLS](#tls), [Randomness](#randomness), [Passwords](#passwords) |
| **A03** Injection | Parameterized SQL; `os/exec` without a shell; `html/template` not `text/template` | [SQL](#sql-injection), [Injection](#injection-exec), [XSS](#templates-xss) |
| **A04** Insecure Design | Strong types as constraints, safe zero values, `context` propagation | architectural |
| **A05** Security Misconfiguration | All `http.Server` timeouts; security headers; `MinVersion` set explicitly | [Headers](#http-security), [Hardening](#runtime-hardening) |
| **A06** Vulnerable Components | **`govulncheck ./...`** (reachability-based), Dependabot/Renovate, `go.sum` | [Static Analysis](#static-analysis) |
| **A07** Auth Failures | bcrypt cost ≥10; JWT alg **pinned** + `iss`/`aud`/`exp`; session-ID rotation on login | [JWT](#jwt), [Sessions](#csrf) |
| **A08** Integrity Failures | `go.sum` + checksum DB; `GOFLAGS=-mod=readonly`; signed releases | [supply-chain-security.md](supply-chain-security.md) |
| **A09** Logging Failures | `log/slog`; redact via `LogValuer` (allow-list); never log secrets/PII | [Secrets](#secrets) |
| **A10** SSRF | Allowlist outbound hosts; block private IPs in a custom `DialContext` | below |

An **SSRF dialer** checks every resolved IP *in the dialer* and dials that IP directly. A pre-flight `LookupIP` leaves a DNS-rebinding TOCTOU gap:

```go
func safeDial(ctx context.Context, network, addr string) (net.Conn, error) {
    host, port, err := net.SplitHostPort(addr)
    if err != nil { return nil, err }
    ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
    if err != nil { return nil, err }
    for _, ip := range ips {
        if !ip.IP.IsGlobalUnicast() || ip.IP.IsPrivate() || ip.IP.IsLoopback() || ip.IP.IsLinkLocalUnicast() {
            return nil, errors.New("blocked: non-public IP")
        }
    }
    return (&net.Dialer{}).DialContext(ctx, network, net.JoinHostPort(ips[0].IP.String(), port)) // dial vetted IP
}
// http.Client{Transport: &http.Transport{DialContext: safeDial}}
```

---

## Input Validation {#input-validation}

Validate **at the boundary**, allow-list over deny-list, reject early. Struct-tag validation (`go-playground/validator/v10`, tags `validate:"required,email,max=100"`) is fine for shape but is **not** a substitute for parameterization, contextual escaping, or `os.Root`: those are the actual injection boundaries. Decode defensively: `dec.DisallowUnknownFields()` rejects mass-assignment; `http.MaxBytesReader(w, r.Body, n)` bounds the body *before* decoding. For paths, `filepath.IsLocal`/`filepath.Localize` [1.20] are useful **lexical** checks when the attacker controls only a string, but if they can also touch the filesystem (symlinks, archives, shared workdirs), use `os.Root` ([below](#injection-exec)).

---

## SQL Injection Prevention {#sql-injection}

The safety property is **separating SQL text from values**, not escaping. `db.Query`/`Exec` accept a format-*looking* string but **do not format it**: passing a pre-`Sprintf`'d query is the bug.

```go
// RIGHT — placeholders (driver-specific: ? MySQL/SQLite, $1 pgx/lib/pq, @name / sql.Named)
rows, err := db.QueryContext(ctx,
    `SELECT id, email FROM users WHERE org_id = $1 AND status = $2`, orgID, status)

// WRONG — string building; the #1 failure under "complex"/dynamic prompts
q := fmt.Sprintf(`SELECT id FROM users WHERE status = '%s'`, status) // injectable
rows, err = db.Query(q)
```

Identifiers cannot be parameterized: table/column/`ORDER BY`/`ASC|DESC` are not bindable. Map user input through a fixed allow-list, never interpolate. **Dynamic `IN (...)`** requires generating the right number of placeholders, not joining values:

```go
// Identifier: allow-list, not interpolation
col, ok := map[string]string{"name": "name", "created": "created_at"}[sortKey]
if !ok { return errBadSort }
// Dynamic IN: one placeholder per value, slice as variadic args
ph := make([]string, len(ids)); args := make([]any, len(ids))
for i, id := range ids { ph[i] = "$" + strconv.Itoa(i+1); args[i] = id }
q := `SELECT id FROM users WHERE id IN (` + strings.Join(ph, ",") + `) ORDER BY ` + col
rows, err := db.QueryContext(ctx, q, args...)
```

ORMs/builders (GORM, sqlc, squirrel) parameterize by default, but `.Raw()`/`.Exec()` escape hatches and `gorm.Expr` with interpolation reintroduce injection. (gosec **G201** format-string SQL / **G202** concat.)

---

## Command Injection & Path Traversal (os.Root) {#injection-exec}

### Command execution

`os/exec` does not invoke a shell: `exec.Command(name, args...)` passes args straight to `execve`; spaces and metacharacters in an arg are inert. Injection happens **only** when you hand a built string to a shell.

```go
// RIGHT — discrete args + context for cancel/timeout
cmd := exec.CommandContext(ctx, "convert", "-resize", size, inPath, outPath)
out, err := cmd.Output()

// WRONG — explicit shell with concatenation
cmd = exec.Command("sh", "-c", "convert -resize "+size+" "+inPath) // injectable
```

Traps even *without* a shell: a user-controlled **program name** (first arg) is its own vuln class; allow-list it. Flag injection: input beginning with `-` can become an option (`--output=/etc/...`); terminate flags with `"--"` or validate. `[1.19] exec.ErrDot`: `LookPath`/`Command` no longer resolve a bare name against the *current directory*; models that "fix" this by re-adding `.` to `PATH` reintroduce the vuln, so use an absolute path. (gosec **G204**.)

### Path traversal → `os.Root` [1.24]

`filepath.Join`/`Clean` **do not contain traversal**: `filepath.Join("/srv/up", "../../etc/passwd")` → `/etc/passwd`. The common `strings.HasPrefix(filepath.Clean(p), base)` guard catches *lexical* `..` but is **bypassable via symlinks** and racey (TOCTOU). `os.OpenRoot`/`os.Root` [1.24] resolves every op *inside* the root and refuses escaping paths (including symlinks).

```go
// RIGHT [1.24]
root, err := os.OpenRoot("/srv/uploads")     // *os.Root
if err != nil { return err }
defer root.Close()
f, err := root.Open(userRelPath)             // ".." or escaping symlink -> error
// One-shot: os.OpenInRoot("/srv/uploads", userRelPath)

// WRONG — lexical, symlink-bypassable, TOCTOU-prone
p := filepath.Join("/srv/uploads", userRelPath)
if !strings.HasPrefix(p, "/srv/uploads/") { return errEscape }
f, err = os.Open(p)
```

Method set: `Open`/`Create`/`OpenFile`/`Mkdir`/`Stat`/`Lstat`/`Remove`/`FS` [1.24]; **expanded [1.25]** with `Chmod`/`Chown`/`Chtimes`/`Link`/`MkdirAll`/`ReadFile`/`Readlink`/`RemoveAll`/`Rename`/`Symlink`/`WriteFile`. `Root.FS()` returns a traversal-safe `fs.FS` that implements `io/fs.ReadLinkFS` [1.25]; **extract archives (zip-slip) through a `Root`** (gosec **G305**). Threat-model fine print: `os.Root` does **not** defend against bind mounts or other privileged constructs; on `GOOS=js` it remains TOCTOU-vulnerable (no `openat`); `Root.Symlink` does **not** validate `oldname` (an untrusted symlink target is still dangerous inside the root). `github.com/google/safeopen` is superseded; its own README now points to `os.Root`.

---

## Templates & XSS (html vs text/template) {#templates-xss}

`html/template` does **context-aware** auto-escaping (HTML, attribute, JS, URL, CSS contexts). `text/template` does **none**: using it (or `fmt`/concat) to emit HTML is XSS by construction. Both share the same API surface, so the import line is the whole difference.

```go
// RIGHT — contextual auto-escaping
import "html/template"
t := template.Must(template.New("p").Parse(`<a href="{{.URL}}">{{.Name}}</a>`))
_ = t.Execute(w, data) // .Name HTML-escaped, .URL URL-sanitized per position

// WRONG — text/template emits raw -> XSS
import "text/template"
t = template.Must(template.New("p").Parse(`<a href="{{.URL}}">{{.Name}}</a>`))
```

Typed-string bypass (defeats escaping): the marker types `template.HTML`, `template.JS`, `template.URL`, `template.CSS`, `template.HTMLAttr`, `template.Srcset` mean "already safe, do not escape." Wrapping user input in them reintroduces XSS. Only ever wrap developer-controlled constants, or sanitize first (`bluemonday`).

```go
// WRONG — disables escaping for attacker bytes
data := map[string]any{"Body": template.HTML(userSuppliedHTML)} // injectable
// RIGHT — sanitize, then mark trusted
data = map[string]any{"Body": template.HTML(policy.Sanitize(userHTML))}
```

The model assumes "trusted template authors, untrusted data": **never `Parse(userInput)`** (the template *text* is trusted, the *data* is escaped). For untrusted JSON in a `<script>`, `json.Unmarshal` then pass the value through the template in JS context; do not stuff raw JSON into `template.JS`. Keep the toolchain patched: `html/template` escaping has had occasional parser-edge CVEs fixed in minor releases; `gosec` **G203** flags unescaped template data.

---

## Randomness & crypto/rand {#randomness}

`crypto/rand` is the **only** source for keys, nonces, tokens, salts, IVs, session/reset IDs. `math/rand` and `math/rand/v2` [1.22] are **never** acceptable for security material, regardless of how good the source looks.

```go
// RIGHT
import "crypto/rand"
b := make([]byte, 32)
rand.Read(b)        // [1.24] never returns an error; crashes irrecoverably on impossible OS failure
tok := rand.Text()  // [1.24] cryptographically-secure base32 string (good for tokens/reset codes)

// WRONG — not a CSPRNG; predictable, seedable, reproducible
import "math/rand/v2"
for i := range b { b[i] = byte(rand.IntN(256)) } // gosec G404
```

Stale beliefs to correct:
- [1.24] `crypto/rand.Read` is guaranteed not to fail: always returns `nil` error (crashes irrecoverably on impossible OS failure). Error branches on it are dead code; a `math/rand` fallback "if crypto fails" is a *vulnerability*. [1.24] `math/rand.Seed` is a no-op; `math/rand/v2` auto-seeds and omits a top-level `Read` to discourage misuse.
- [1.26] The `rand io.Reader` parameter is now ignored across `crypto/rand.Prime`, `crypto/rsa` (`GenerateKey`, `EncryptPKCS1v15`), `crypto/ecdsa` (`GenerateKey`, `Sign`, `SignASN1`, `PrivateKey.Sign`), `crypto/ecdh.Curve.GenerateKey`, `crypto/dsa.GenerateKey`, and `crypto/ed25519.GenerateKey` (nil arg). System CSPRNG is always used; **passing `rand.Reader` is unaffected**. Tests injecting a deterministic reader **break**; use `testing/cryptotest.SetGlobalRandom(t, seed)` [1.26] (bridge `GODEBUG=cryptocustomrand=1`, to be removed). Separately [1.24], `ecdsa.PrivateKey.Sign` yields **deterministic RFC 6979** signatures when the source is nil.

---

## TLS Configuration {#tls}

```go
// RIGHT — pin a floor explicitly; don't rely on shifting defaults for compliance
cfg := &tls.Config{MinVersion: tls.VersionTLS13} // or VersionTLS12 for broad-reach public services
srv := &http.Server{Addr: ":443", TLSConfig: cfg}
```

Versions: default `MinVersion` is **TLS 1.2** (clients and servers); `MaxVersion` is 1.3. Server floor can drop to 1.0 only via `GODEBUG=tls10server=1`. **[1.27] removes** the escape hatches `tls10server` (server floor becomes 1.2), `tls3des` (3DES dropped from defaults), `tlsrsakex` (legacy RSA-kex off by default), `tlsunsafeekm`, and `x509keypairleaf`. The new behavior becomes unconditional regardless of `go.mod` version.

Cipher suites (what models get wrong): `Config.CipherSuites` configures **only TLS 1.0-1.2**; **TLS 1.3 suites are not configurable** (all secure). Suite **ordering is owned by crypto/tls since [1.17]**; `CipherSuites` order is ignored and `PreferServerCipherSuites` is ignored (the stack prefers ECDHE and picks AES-GCM vs ChaCha20 by hardware). RSA-kex suites were removed from defaults [1.22]; SHA-1 sig algs are disallowed in TLS 1.2 handshakes [1.25]. **Leave suites at defaults; control security via `MinVersion`.** Hand-rolled "hardened" lists are usually weaker/stale.

`InsecureSkipVerify: true` disables all verification, including chain and hostname (gosec **G402**); a MitM hole, and inside cert-pinning code it *disables the very check being added*. For pinning, keep verification on and use `VerifyConnection` (runs on **all** connections including resumptions; `VerifyPeerCertificate` is **skipped on resumed sessions**):

```go
cfg := &tls.Config{
    MinVersion: tls.VersionTLS13, ServerName: "api.example.com",
    VerifyConnection: func(cs tls.ConnectionState) error { // SPKI pin; chain+host still verified
        sum := sha256.Sum256(cs.PeerCertificates[0].RawSubjectPublicKeyInfo)
        if !slices.ContainsFunc(pins, func(p [32]byte) bool { return p == sum }) {
            return errors.New("pin mismatch")
        }
        return nil
    },
}
```

For fully custom trust (self-signed, no system roots), use `InsecureSkipVerify: true` **with** `VerifyConnection` doing real checks; a client config must set `ServerName` or `InsecureSkipVerify`. mTLS: only `tls.RequireAndVerifyClientCert` both requires *and* verifies against `ClientCAs`; `RequireAnyClientCert`/`VerifyClientCertIfGiven`/`RequestClientCert` do **not** all verify. For Let's Encrypt, `autocert.Manager{Cache, Prompt: AcceptTOS, HostPolicy: HostWhitelist(...)}.TLSConfig()`.

---

## Post-Quantum & Modern Cryptography {#post-quantum}

### Post-quantum TLS (X25519MLKEM768) [1.24]

To defeat "harvest-now-decrypt-later," Go's TLS stack negotiates **hybrid** key exchange (classical X25519/P-curve **+** ML-KEM, FIPS 203), secure if *either* holds. Defaults, enabled when `Config.CurvePreferences == nil`:

- [1.24] `X25519MLKEM768` is on by default; revert with `GODEBUG=tlsmlkem=0`. The draft `X25519Kyber768Draft00` [1.23, experimental] was **removed**; a 1.23 client and 1.24 client **cannot** negotiate PQ together (silent downgrade to classical X25519). New `crypto/mlkem` [1.24].
- [1.26] adds `SecP256r1MLKEM768` + `SecP384r1MLKEM1024` (NIST-curve stacks); disable via `CurvePreferences` or `GODEBUG=tlssecpmlkem=0`. ML-KEM enc/dec ~18% faster [1.26].

It's **default since 1.24 (no code needed).** The only reason to disable is a broken middlebox mishandling the larger (~1.2 KB) ClientHello. Setting `CurvePreferences` to legacy curves silently **drops** PQ.

### HPKE: `crypto/hpke` [1.26]

RFC 9180 Hybrid Public Key Encryption, **including PQ-hybrid KEMs**, the stdlib answer for "encrypt a message to a public key," replacing ad-hoc ECIES / `nacl/box`. Compile-time KEM+KDF+AEAD selection keeps `govulncheck` reachability precise. Verified API (pkg.go.dev, go1.26.x):

```go
import "crypto/hpke"
kem, kdf, aead := hpke.MLKEM768X25519(), hpke.HKDFSHA256(), hpke.AES256GCM() // X-Wing PQ hybrid
k, _ := kem.GenerateKey()                            // recipient; publish k.PublicKey().Bytes()
pub, _ := kem.NewPublicKey(k.PublicKey().Bytes())    // sender deserializes pub
ct, _ := hpke.Seal(pub, kdf, aead, []byte("info"), []byte("secret")) // returns enc||ciphertext
pt, _ := hpke.Open(k, kdf, aead, []byte("info"), ct) // recipient
```

`Seal`/`Open` are one-shot (no aad). For multiple messages, `NewSender`/`NewRecipient` return **stateful** contexts whose `Seal(aad, pt)`/`Open(aad, ct)` increment a nonce counter and **must be called in matching order**. Out-of-order opens fail. Prefer named constructors over `NewAEAD`/`NewKDF`/`NewKEM` unless you need runtime agility.

### FIPS 140-3 [1.24]: `GOFIPS140` + `fips140` GODEBUG

Native FIPS 140-3 module inside the stdlib (pure Go, no cgo): replaces the unsupported, **incompatible** Go+BoringCrypto path. Public crypto APIs route transparently through the validated module.

```bash
GOFIPS140=v1.0.0 go build ./...   # link a frozen CMVP-validated module (also: latest, inprocess, certified)
GODEBUG=fips140=on  ./app         # enable at runtime even without build-time selection
GODEBUG=fips140=only ./app        # non-approved algos ERROR/panic — TEST/ASSESSMENT ONLY, may crash by design
```

```go
import "crypto/fips140"
if fips140.Enabled() { /* … */ }  // fips140.Version() [1.26] returns the resolved module version
```

In FIPS mode: self-tests at init; pairwise key-gen consistency checks (**up to ~2× slower for ephemeral keys**); `crypto/rand.Reader` becomes a SP 800-90A DRBG; `crypto/tls` negotiates only FIPS-approved versions/suites. **`fips140=only` is documented as test/assessment, NOT production.** [1.26] `crypto/fips140.WithoutEnforcement`/`Enforced` selectively relax `only`. Modules: **v1.0.0** (Cert #5247, validated) from 1.24; **v1.26.0** from 1.26 (pending review). **Unsupported on OpenBSD, Wasm, AIX, 32-bit Windows.** [1.27 RC] `tls.Config.Rand` deprecated.

---

## Constant-Time & Crypto Hygiene {#crypto-hygiene}

Use constant-time comparison for any secret-vs-input (MACs, API keys, reset tokens, signature bytes, TOTP). `==`/`bytes.Equal` short-circuit on the first mismatched byte: a timing oracle that brute-forces the secret byte-by-byte.

```go
import "crypto/subtle"
if subtle.ConstantTimeCompare(got, want) == 1 { /* equal */ } // equal-length slices only
if hmac.Equal(macGot, macWant) { /* valid MAC */ }            // for MAC tags specifically

// WRONG — early-exit timing leak
if string(got) == string(want) { /* ... */ }
```

`ConstantTimeCompare` is constant-time **only for equal-length inputs** (it returns immediately if lengths differ, leaking length). Compare fixed-length encodings (or hash both sides to a fixed length first). **[1.24] `crypto/subtle.WithDataIndependentTiming(f)`** runs `f` with arch data-independent timing (PSTATE.DIT on arm64; no-op elsewhere) so the CPU can't make constant-time code variable-time; **[1.26]** it no longer pins the goroutine to its OS thread and now **propagates DIT to spawned goroutines, descendants, and across cgo**. Verify your isolation boundary covers the whole goroutine tree.

New stdlib crypto (prefer over `x/crypto`): `crypto/hkdf`, `crypto/pbkdf2`, `crypto/sha3` [1.24]. AEAD: `cipher.NewGCMWithRandomNonce` [1.24] generates+prepends a random nonce (kills the manual-GCM nonce-reuse footgun). Deprecated/dangerous to emit: `cipher.NewCFB*`/`NewOFB` [1.24-dep] (unauthenticated; use an AEAD, or `NewCTR` for a raw stream); `rsa.EncryptPKCS1v15`/`DecryptPKCS1v15*` **encryption** [1.26-dep] (Bleichenbacher, so use OAEP; `EncryptOAEPWithOptions` [1.26] allows distinct OAEP/MGF1 hashes; PKCS#1 v1.5 *signatures* remain fine); `rsa.GenerateKey` **errors on keys <1024 bits** [1.24] (use ≥2048); `x509.Certificate.Verify` **rejects SHA-1 signatures** [1.24]; MD5/SHA-1/DES/RC4 dead for security (G401/G405/G501-G505). The `big.Int` fields of `ecdsa.PublicKey`/`PrivateKey` are deprecated [1.26]. Use `crypto/ecdh` and `ecdsa.*Bytes`/`Parse*` [1.25] for encodings.

---

## Authentication (JWT) {#jwt}

`github.com/golang-jwt/jwt/v5` is current (`v4`/`v3` legacy; `dgrijalva/jwt-go` abandoned). **Algorithm confusion** is the durable pitfall: the server verifies with whatever `alg` the *token header* claims, so an attacker flips `RS256`→`HS256` and signs with the server's **public** key as the HMAC secret (or sets `alg:none`). Fix: pin the algorithm; never let the token choose.

```go
// RIGHT — pin alg via WithValidMethods AND assert the method type in keyFunc (defense in depth)
tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
    if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
        return nil, fmt.Errorf("unexpected alg: %v", t.Header["alg"])
    }
    return rsaPublicKey, nil
},
    jwt.WithValidMethods([]string{"RS256"}),
    jwt.WithIssuer(expectedIss),   // pin iss (Keycloak/Camel-class CVEs)
    jwt.WithAudience(expectedAud),
    jwt.WithExpirationRequired(),
)
if err != nil { /* errors.Is(err, jwt.ErrTokenExpired) … */ }
if !tok.Valid { /* reject */ }

// WRONG — trusts header alg; RS256->HS256 confusion & alg:none
tok, _ = jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) { return key, nil })
```

Library facts [v5]: with a key set the library **rejects `alg:none` by default** ("'none' signature type is not allowed"; only `UnsafeAllowNoneSignatureType` permits it); still set `WithValidMethods` to make pinning explicit. `keyFunc` receives the **parsed-but-unverified** token; only read the header to choose the key. You **still** check `token.Valid` after a no-error `Parse`. `ParseUnverified` does **not** verify the signature. [v5] does not validate `iat` by default (RFC-informational). **JWTs are signed, not encrypted**; payload is readable; never put secrets in claims (use HPKE/JWE for confidentiality). Pin alg **and** `iss`/`aud`; both, since 2026 saw alg-confusion *and* `iss`-not-validated CVE classes across ecosystems.

---

## Password Hashing {#passwords}

No password hash in the stdlib: use `golang.org/x/crypto/bcrypt` (or `argon2id`). **PBKDF2 [1.24 stdlib] is a KDF, not a password hash.**

```go
hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost) // cost ≥10; tune to ~250ms
ok := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil     // constant-time by construction
```

`bcrypt` silently **truncates input at 72 bytes**; limit length, or pre-hash with SHA-256 for very long inputs. Never MD5/SHA for passwords (too fast); never roll custom crypto; compare hashes only via the library, never `==`.

---

## Sessions & CSRF (CrossOriginProtection) {#csrf}

### `net/http.CrossOriginProtection` [1.25]

Token-less, cookie-less, stateless CSRF defense using **Fetch metadata** (`Sec-Fetch-Site`), falling back to `Origin` vs `Host`. Safe methods (GET/HEAD/OPTIONS) always pass; same-origin and non-browser requests (no relevant headers) pass; unsafe-method cross-origin browser requests are rejected.

```go
cop := http.NewCrossOriginProtection()                       // zero value also valid
_ = cop.AddTrustedOrigin("https://app.example.com")          // returns error; needs scheme+host, no path
cop.AddInsecureBypassPattern("POST /webhooks/stripe")        // skip CSRF for non-browser ingress (sharp tool)
cop.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    http.Error(w, "cross-origin rejected", http.StatusForbidden)
}))
srv := &http.Server{Addr: ":8443", Handler: cop.Handler(mux)} // also: cop.Check(r) error for manual use
```

What it does/doesn't: protects form/`fetch` cross-site POSTs from all current major browsers; fails open only for a vanishing set of ancient browsers (e.g. Firefox 60-69) sending neither header. It is **not** authentication and does nothing for non-browser API abuse. It requires HTTPS (`Sec-Fetch-Site` is sent only to trustworthy origins); pair with HSTS, since a plaintext MitM can strip `Origin`. Footgun [1.25] (CVE-2025-47910 / GO-2025-3955, fixed 1.25.1): `AddInsecureBypassPattern("/x/")` could let `POST /x` bypass via ServeMux trailing-slash redirect; bypass patterns are sharp, so prefer `AddTrustedOrigin`. Pre-1.25: `filippo.io/csrf` (+ `filippo.io/csrf/gorilla` drop-in). `gorilla/csrf` has **GO-2025-3884 / CVE-2025-24358** (TrustedOrigins accepted both HTTP and HTTPS of a host → MitM CSRF) with no fixed release; migrate. `justinas/nosurf` is effectively unmaintained.

### Session lifecycle & cookies

Regenerate the session ID on every privilege transition (login, role elevation, re-auth); reusing a pre-auth ID enables session fixation. `alexedwards/scs/v2` exposes `RenewToken` for exactly this. Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`); `SameSite=None` *must* be paired with `Secure`; use the `__Host-` prefix; set server-side absolute + idle timeouts; invalidate server-side on logout. Never accept a session ID from URL/query.

```go
http.SetCookie(w, &http.Cookie{
    Name: "__Host-session", Value: token, Path: "/",
    Secure: true, HttpOnly: true, SameSite: http.SameSiteLaxMode,
})
```

---

## Secrets Management & redaction {#secrets}

```go
secret := os.Getenv("JWT_SECRET")
if secret == "" { log.Fatal("JWT_SECRET required") } // never hardcode (gosec G101); use env or a vault
```

Redaction: allow-list via `LogValuer` on the secret-bearing type (O(1), no reflection); not a global `ReplaceAttr` deny-list (O(N) string-match every line). `LogValue` emits only safe fields, so the secret never reaches a handler (never put secrets in claims, errors, or URLs):

```go
func (c Credential) LogValue() slog.Value { // Token field deliberately omitted
    return slog.GroupValue(slog.String("user_id", c.UserID))
}
slog.InfoContext(ctx, "issued", slog.Any("cred", cred)) // Token never logged
```

`runtime/secret` [1.26, experimental] (`GOEXPERIMENT=runtimesecret`; **amd64/arm64 Linux only**) addresses the deeper problem that Go gives **no guarantee** when sensitive bytes are zeroed: naive `for i := range k { k[i]=0 }` is a **dead store the compiler may elide**. `secret.Do(func(){...})` zeroes registers/stack on return (immediate) and heap allocations made *inside* the block once the GC finds them unreachable (deferred).

```go
//go:build goexperiment.runtimesecret
import "runtime/secret"

sessionKey := make([]byte, 32)        // allocate OUTPUTS outside the block
secret.Do(func() {
    priv, _ := ecdh.X25519().GenerateKey(rand.Reader)
    shared, _ := priv.ECDH(peerPub)
    copy(sessionKey, kdf(shared))     // priv/shared/intermediates erased after Do returns
})
```

Caveats: heap erasure is **GC-deferred**, not immediate; any allocation *inside* `Do` (slice growth, map insert) erases the **entire** new backing store; keep inner allocation minimal and copy results to buffers allocated **outside**; globals and (in 1.26) spawned goroutines are **not** covered; [1.27] goroutines created in secret mode inherit it. Intended for crypto-library authors; apps should rely on libraries that use it internally. Until then: minimize secret lifetime, don't trust manual zeroing.

---

## HTTP Security Headers {#http-security}

No stdlib helper: set in middleware, **before the first `Write`/`WriteHeader`** (headers are immutable once the body starts; setting them after silently no-ops).

```go
func secureHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        h := w.Header()
        h.Set("Content-Security-Policy", "default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'")
        h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload") // HTTPS only
        h.Set("X-Content-Type-Options", "nosniff")
        h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
        h.Set("Permissions-Policy", "geolocation=(), camera=(), microphone=()")
        next.ServeHTTP(w, r)
    })
}
```

Prefer CSP `frame-ancestors 'none'` over `X-Frame-Options` (now obsolete per MDN; keep both for old browsers). A strict CSP (nonce/hash-based, no `unsafe-inline`) is the strongest single XSS defense-in-depth. Emit HSTS **only over HTTPS**, and know `preload` is hard to undo. These are not a universal checklist; for JSON-only internal APIs, CSP/framing add little; HSTS still matters if browser-reachable over HTTPS.

---

## Runtime Hardening {#runtime-hardening}

- Heap base randomization [1.26] is automatic on all 64-bit platforms at startup; makes addresses unpredictable, hardening exploitation of memory-safety bugs **especially with cgo**. Opt out (discouraged) via `GOEXPERIMENT=norandomizedheapbase64` (escape hatch, will be removed). May cause false positives in eBPF/stack-pivot telemetry (e.g. Tracee) until updated.
- `http.Server` timeouts: zero means *no* timeout; always set them in prod (Slowloris/resource exhaustion):

```go
srv := &http.Server{
    ReadTimeout: 5 * time.Second, ReadHeaderTimeout: 2 * time.Second,
    WriteTimeout: 10 * time.Second, IdleTimeout: 120 * time.Second,
    MaxHeaderBytes: 1 << 20,
}
```

- `httputil.ReverseProxy.Director` is deprecated [1.26]; it is fundamentally unsafe (a malicious client can strip Director-added headers by marking them hop-by-hop), so migrate to `ReverseProxy.Rewrite` (added 1.20), which sees both the inbound and outbound request.
- Build with `-trimpath` (strip local paths), `-buildmode=pie` where ASLR on the text segment helps; the linker emits a GNU build ID / Mach-O UUID by default [1.24] for SBOM correlation. Run `-race` in CI; data races are a security concern; [1.26] an experimental `goroutineleak` profile (`GOEXPERIMENT=goroutineleakprofile`) surfaces forever-blocked goroutines.

---

## Static Analysis & govulncheck {#static-analysis}

`govulncheck` (supply chain, reachability-based): the official scanner; it builds a call graph and reports only vulns your code **actually reaches**, far less noise than version-string scanners. Data from the Go vuln DB (`vuln.go.dev`, OSV, IDs `GO-YYYY-NNNN`).

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...                  # source mode: reachable findings get call stacks
govulncheck -mode binary ./bin/app # scan a compiled binary (no call graph)
govulncheck -format sarif ./...    # for code scanning (also json, openvex)
```

Exit code is **non-zero when reachable vulns are found** (good CI gate), but exits 0 with `-format json|sarif|openvex`, so gate on parsed output for those. Blind spots: `reflect`-dispatched and `unsafe`-hidden calls can cause false negatives; binary mode omits call graphs.

`gosec` (code-pattern, SSA taint analysis); it catches what `go vet` can't: hardcoded creds (G101), SQL via format/concat (G201/G202), unescaped template data (G203), command exec (G204), zip-slip/file-perms (G301-G307), MD5/SHA1 (G401), bad TLS / `InsecureSkipVerify` (G402), RSA<2048 (G403), `math/rand` for security (G404), DES/RC4 (G405), import-blocklist (G501-G505). Suppress a verified FP inline: `// #nosec G402 -- reason`.

```bash
# CI gate, fail on any:
go vet ./... && gosec ./... && go test -race -count=1 ./... && govulncheck ./...
```

`go vet` [1.25] adds `hostport` (flags `fmt.Sprintf("%s:%d", host, port)` → use `net.JoinHostPort`) and `waitgroup`. `golangci-lint` bundles `gosec`, `govet`, `errcheck`, `staticcheck`, `bodyclose`, `sqlclosecheck`, etc. The two security tools are **complementary, not interchangeable**: `govulncheck` for known-CVE reachability, `gosec` for pattern smells.

---

## Library landscape & status {#libraries}

| Area | Use now | Avoid / superseded | Since |
|---|---|---|---|
| CSPRNG | `crypto/rand` (`Read` no-fail; `Text`) | `math/rand`, `math/rand/v2` for security | `[1.24]` |
| Crypto rand in tests | `testing/cryptotest.SetGlobalRandom` | injecting an `io.Reader` (now ignored) | `[1.26]` |
| KDF / hash | `crypto/hkdf`, `crypto/pbkdf2`, `crypto/sha3` | `golang.org/x/crypto/{hkdf,pbkdf2,sha3}` | `[1.24]` |
| Password hash | `x/crypto/bcrypt`, argon2id | PBKDF2-as-password-hash; MD5/SHA | - |
| AEAD | `cipher.NewGCMWithRandomNonce`; AES-GCM/ChaCha20-Poly1305 | manual GCM nonce; CFB/OFB; CBC w/o MAC | `[1.24]` |
| RSA enc padding | OAEP (`EncryptOAEPWithOptions`) | PKCS#1 v1.5 **encryption** | `[1.26]` dep |
| PQ KEM / TLS | `crypto/mlkem`; TLS auto (X25519MLKEM768, SecP*MLKEM*) | `X25519Kyber768Draft00` (removed) | `[1.24]`/`[1.26]` |
| Hybrid PKE | `crypto/hpke` (RFC 9180) | ad-hoc ECIES, `nacl/box` for new code | `[1.26]` |
| FIPS | native `GOFIPS140` + `fips140` GODEBUG | Go+BoringCrypto (legacy, incompatible) | `[1.24]` |
| Path containment | `os.Root`/`os.OpenInRoot` | `filepath.Clean`+`HasPrefix`; `google/safeopen` | `[1.24]` |
| CSRF | `net/http.CrossOriginProtection`; `filippo.io/csrf` | `gorilla/csrf` (GO-2025-3884), `nosurf` | `[1.25]` |
| JWT | `golang-jwt/jwt/v5` + `WithValidMethods` | jwt `v4`/`v3`; `dgrijalva/jwt-go`; trusting header `alg` | `[v5]` |
| Sessions | `alexedwards/scs/v2` (`RenewToken`) | not rotating ID on login | - |
| Reverse proxy | `httputil.ReverseProxy.Rewrite` | `ReverseProxy.Director` (unsafe) | `[1.26]` dep |
| Secret erasure | `runtime/secret` (experimental) | manual loop-zeroing (elided) | `[1.26]` |
| Const-time cmp | `subtle.ConstantTimeCompare`, `hmac.Equal` | `==`, `bytes.Equal` on secrets | - |
| Vuln scan | `govulncheck` (reachability) | version-string-only scanners | - |
| SAST | `gosec/v2` (SSA taint) | syntactic-only security linters | - |

---

## Version map 1.20→1.27 {#versions}

| Ver | Security-relevant |
|---|---|
| **1.20** | `filepath.IsLocal`; `httputil.ReverseProxy.Rewrite` added (Director still default) |
| **1.21** | `log/slog` (`LogValuer` redaction); `crypto/ecdh` maturing |
| **1.22** | `math/rand/v2` (ChaCha8/PCG, **not** a CSPRNG API); RSA-kex suites dropped from TLS defaults |
| **1.23** | `X25519Kyber768Draft00` (experimental PQ); SHA-1 sig hygiene tightening; timer channels synchronous |
| **1.24** | `os.Root`/`os.OpenInRoot`; **`X25519MLKEM768` default**; `crypto/mlkem`; native FIPS (`GOFIPS140`); `crypto/{hkdf,pbkdf2,sha3}`; `rand.Text`; `crypto/rand.Read` no-fail; `cipher.NewGCMWithRandomNonce`; CFB/OFB deprecated; RSA<1024 errors; x509 rejects SHA-1; `subtle.WithDataIndependentTiming`; `math/rand.Seed` no-op |
| **1.25** | **`net/http.CrossOriginProtection`** (CSRF); `os.Root` method set expanded + `Root.FS` ReadLinkFS; TLS 1.2 SHA-1 sig algs disallowed; `go vet` `hostport`/`waitgroup` |
| **1.26** | `crypto/hpke`; **SecP*MLKEM* TLS defaults**; **rand `io.Reader` arg ignored** + `testing/cryptotest.SetGlobalRandom`; PKCS#1v1.5 enc deprecated; `EncryptOAEPWithOptions`; heap-base randomization; `runtime/secret` (exp); `httputil.Director` deprecated; `fips140` v1.26.0 + `WithoutEnforcement`/`Enforced`/`Version`; `WithDataIndependentTiming` goroutine/cgo propagation; `ecdsa` `big.Int` fields deprecated; `errors.AsType` |
| **1.27** | Removes GODEBUGs `tls10server`/`tls3des`/`tlsrsakex`/`tlsunsafeekm`/`x509keypairleaf` (new TLS behavior unconditional) and `asynctimerchan`; `tls.Config.Rand` deprecated; `runtime/secret` goroutines inherit secret mode. GA 2026-08-19; row from 2026-06 RC notes, confirmed against the final release notes. |

---

## What models get wrong {#stale}

1. `filepath.Clean`/`Join`+`HasPrefix` as a traversal boundary: symlink- and TOCTOU-bypassable. Use `os.Root`/`os.OpenInRoot` [1.24] (+ [1.25] methods); extract archives through a `Root`.
2. `math/rand`/`math/rand/v2` for tokens/keys/nonces: "v2 uses ChaCha8 so it's secure" is **false**; use `crypto/rand` (G404). And [1.24] `crypto/rand.Read` never errors; dead error branches, and a `math/rand` fallback "if crypto fails" is a vuln.
3. [1.26] the `rand io.Reader` arg to key-gen/sign is ignored: deterministic tests must use `testing/cryptotest.SetGlobalRandom`, not an injected reader.
4. `text/template` (or `fmt`) to render HTML → XSS; and the inverse: wrapping user input in `template.HTML`/`JS`/`URL`/`CSS` reintroduces XSS.
5. `exec.Command` myths: it does **not** invoke a shell; building `sh -c "<concat>"` does; re-adding `.`/cwd to `PATH` to "fix" [1.19] `exec.ErrDot` is a regression; flag-injection (`-`-leading args) missed.
6. `InsecureSkipVerify: true` is sprinkled in, including inside cert-pinning code where it disables the check being added. Use `VerifyConnection` (not `VerifyPeerCertificate`, which is skipped on resumption).
7. TLS cipher-suite cargo-culting: `CipherSuites` does nothing for TLS 1.3, its order is ignored, `PreferServerCipherSuites` is ignored (all since 1.17). Control via `MinVersion`.
8. PQ TLS thought to need manual setup: default since [1.24], broadened [1.26]; `CurvePreferences` with legacy curves silently disables it.
9. mTLS `ClientAuth` confusion: only `RequireAndVerifyClientCert` verifies against `ClientCAs`; `RequireAnyClientCert`/`VerifyClientCertIfGiven` do not.
10. JWT alg not pinned: no `WithValidMethods`/method assertion → RS256→HS256 / `alg:none`; forgetting `iss`/`aud` and `token.Valid`; misusing `ParseUnverified`.
11. `==`/`bytes.Equal` on MACs/tokens/secrets (timing oracle): use `subtle.ConstantTimeCompare`/`hmac.Equal`; mind the equal-length caveat.
12. Unaware of [1.25] `CrossOriginProtection`: still reaching for token/double-submit CSRF or `gorilla/csrf` (GO-2025-3884, no fix). And not regenerating the session ID on login (fixation).
13. Deprecated crypto emitted: CFB/OFB [1.24-dep], PKCS#1v1.5 **encryption** [1.26-dep], MD5/SHA-1/DES/RC4, raw GCM with reused/zero nonce (use `NewGCMWithRandomNonce`), RSA<2048.
14. Naive memory zeroing assumed to work (dead-store elimination): `runtime/secret` [1.26, exp] is the mechanism; heap erasure is GC-deferred. Security headers set after `w.Write` silently no-op.
15. Unknown to models: `crypto/hpke` [1.26], `crypto/mlkem` [1.24], `crypto/{hkdf,pbkdf2,sha3}` [1.24]; pulling from `x/crypto` or rolling custom ECIES instead. `httputil.ReverseProxy.Director` deprecated as unsafe [1.26] → `Rewrite`.
16. FIPS treated as Go+BoringCrypto: supported path is native `GOFIPS140` + `fips140` GODEBUG (BoringCrypto incompatible); `fips140=only` is test-only. And "vuln scanning = check go.mod versions"; `govulncheck` is call-graph reachability-based.

---

## See Also {#see-also}
- [http-and-apis.md](http-and-apis.md): CSRF middleware, TLS server config, HTTP client timeouts
- [supply-chain-security.md](supply-chain-security.md): `govulncheck`, SBOM, reproducible builds, GODEBUG
- [errors-and-resilience.md](errors-and-resilience.md#slog-errors): `LogValuer` redaction, structured errors
- [networking.md](networking.md#tls): manual TLS handshake over raw TCP

## Sources {#sources}
- go.dev/doc/go1.24-go1.27 release notes; pkg.go.dev/{crypto/tls, crypto/hpke, crypto/rand, crypto/subtle, crypto/fips140, os, net/http, golang-jwt/jwt/v5, golang.org/x/vuln, securego/gosec/v2}
- go.dev/blog/osroot (traversal-resistant file APIs); go.dev/doc/security/{fips140,vuln,best-practices}
- pkg.go.dev/crypto/hpke (verified API, go1.26.x); OWASP Top 10; OWASP Session Management
- Advisories: GO-2025-3884/CVE-2025-24358 (gorilla/csrf), GO-2025-3955/CVE-2025-47910 (CrossOriginProtection bypass, fixed 1.25.1)

`source horizon: verified against Go 1.26.x (stable) + 1.27 RC notes, 2026-06, before general availability. Go 1.27 GA'd 2026-08-19 (current pin: SKILL.md)`
