# Encoding and Serialization

JSON dominates, but its defaults betray you: a `nil` slice becomes `null`, every `int64` over 2^53 silently loses precision through `float64`, and field matching is case-*insensitive*. Master the traps in `encoding/json`, know when `omitzero` [1.24] beats `omitempty`, reach for `Decoder`/`Encoder` to stream, and understand the `encoding/json/v2` [1.26, `GOEXPERIMENT=jsonv2`] redesign that fixes the defaults: then pick binary (protobuf/CBOR/gob) only when JSON's cost is measured, not assumed.

> Verified against Go **1.26.x** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. `[verify]` marks a claim to confirm against the final release.

## TL;DR: the modern deltas (read first)

- `omitzero` [1.24] is the fix for `omitempty`'s broken cases. `omitempty` can't omit a zero `time.Time`, a zero-valued struct, or `0`/`false` you want to keep. `omitzero` omits on the Go zero value (and honors a `IsZero() bool` method). They're independent: you can set both.
- `encoding/json` numbers decode to `float64` into `any`: silent precision loss above 2^53. Decode into a typed `int64` field, or `Decoder.UseNumber()` to get a lossless `json.Number` (a `string`).
- JSON member matching is case-*insensitive* in v1 (an exact match wins over an inexact one, but `{"id"}` still fills a `ID` field). v2 makes it case-*sensitive* by default. This is a real interop/security difference.
- `encoding/json/v2` [1.26, `GOEXPERIMENT=jsonv2`] flips the bad defaults (nil slice→`[]`, nil map→`{}`, duplicate names *rejected*, invalid UTF-8 *rejected*, case-*sensitive*) and adds streaming `MarshalWrite`/`UnmarshalRead` + a `jsontext` tokenizer. Still experimental: gate behind a build tag, never in published modules. [verify: GA target.]
- `encoding.TextAppender`/`BinaryAppender` [1.24] append into a caller's buffer (alloc-free); if you also implement Marshaler, `MarshalText()` must equal `AppendText(nil)`.
- `new(expr)` [1.26] makes optional pointer fields ergonomic: `Age: new(yearsSince(born))` instead of a throwaway local + `&`.
- `gob` is Go-only and self-describing: fine for `net/rpc` / same-binary caches, a foot-gun for durable storage or cross-language.

## Table of Contents
1. [Which Serialization Format?](#decision-table)
2. [JSON (encoding/json)](#json)
3. [omitempty vs omitzero, zero vs absent](#omitempty-omitzero)
4. [Numbers, precision, json.Number & RawMessage](#numbers)
5. [Custom marshalers, time & []byte](#custom-marshal)
6. [Streaming with Decoder / Encoder](#streaming)
7. [JSON v2 [1.26, experimental]](#json-v2)
8. [encoding.TextAppender / BinaryAppender [1.24]](#appender)
9. [Protocol Buffers](#protobuf)
10. [MessagePack & CBOR](#msgpack)
11. [Gob (Go-to-Go Only)](#gob)
12. [Binary (encoding/binary)](#binary)
13. [CSV](#csv)
14. [XML](#xml)
15. [High-performance JSON (sonic/jsoniter)](#fast-json)
16. [Schema evolution](#schema-evolution)
17. [Library landscape & status](#libraries)
18. [Version map 1.21→1.27](#versions)
19. [What models get wrong](#stale)
20. [Anti-Patterns](#anti-patterns)

---

## Which Serialization Format? {#decision-table}

| Scenario | Format | Why |
|----------|--------|-----|
| HTTP APIs, config files | JSON | Universal, human-readable, stdlib |
| Inter-service RPC, gRPC | Protocol Buffers | Schema evolution, compact, polyglot |
| Cache values (Redis/memcached) | MessagePack / CBOR | Binary, smaller/faster than JSON, schemaless |
| Cross-language binary with an RFC | CBOR (RFC 8949) | Standardized, COSE/WebAuthn ecosystem |
| Go↔Go IPC, `net/rpc`, same-binary cache | Gob | Zero schema setup, stdlib |
| Custom wire/file format | `encoding/binary` | Direct byte control, no overhead |
| Tabular import/export | CSV | Universal spreadsheet format |
| SOAP/SAML/RSS/Atom/legacy | XML | When the other side demands it |

Decision order: (1) other end dictates the format → use it. (2) Human-readable / HTTP → JSON. (3) *Measured* JSON cost too high *and* you control both ends → binary: protobuf (schema + polyglot), CBOR/MessagePack (schemaless), gob (both Go). Don't reach for binary on a hunch: `encoding/json` (plus v2/sonic) handles most workloads.

---

## JSON (encoding/json) {#json}

```go
import "encoding/json"

data, err := json.Marshal(user)        // value → []byte
err = json.Unmarshal(data, &user)      // []byte → value (pass a pointer)

type User struct {
    ID    int64  `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email,omitempty"` // omit "" (JSON-empty)
    Bio   string `json:"-"`               // never serialized
    admin bool                            // unexported → always skipped
}
```

Struct-tag rules that bite: `json:"-"` skips a field; the field literally named `-` needs `json:"-,"`. A leading comma keeps the Go field name (`json:",omitempty"`). Only **exported** fields are (un)marshaled: an unexported field is invisible, never an error. Embedded structs are promoted (flattened) into the parent object unless tagged.

v1 behaviors that "cannot be changed" (per the package overview):

- Duplicate JSON keys: processed in observed order; later values **replace** scalars but **merge** into maps/structs.
- Object→struct matching is **case-insensitive** (an exact match is preferred over an inexact one, but `"ID"`, `"id"`, `"Id"` all hit field `ID`).
- Unknown keys are **silently ignored** unless you use a `Decoder` with `DisallowUnknownFields()`.
- Invalid UTF-8 in strings → replaced with U+FFFD (the replacement char), not an error.
- Large integers lose precision when unmarshaled into floating-point (`any` → `float64`).

The `nil` traps:

```go
// WRONG — caller expected [] and {} in the response:
var tags []string             // nil
m := map[string]int(nil)      // nil
json.Marshal(struct{ T []string; M map[string]int }{tags, m})
// → {"T":null,"M":null}      ← null, not [] / {}

// RIGHT — initialize empty (non-nil) collections:
tags := []string{}
m := map[string]int{}
// → {"T":[],"M":{}}
```

A `nil` slice/map marshals to `null`; an *empty non-nil* one to `[]`/`{}` (v2 marshals even nil as `[]`/`{}`). `[]byte` fields marshal to a **base64 string**, not a number array. For HTTP response wiring (`json.NewEncoder(w)`, content type), see [http-and-apis.md](http-and-apis.md#json-api).

---

## omitempty vs omitzero, zero vs absent {#omitempty-omitzero}

The single most error-prone corner of Go JSON. `omitempty` uses **JSON-emptiness** (`""`, `0`, `false`, `nil`, empty slice/map). `omitzero` [1.24] uses **Go zero-value** semantics and calls the field's `IsZero() bool` if present.

```go
type Event struct {
    Name    string    `json:"name"`
    When    time.Time `json:"when,omitzero"`  // [1.24] omits the zero time correctly
    Count   int       `json:"count,omitzero"` // omit 0 — but keep an explicit 0 elsewhere by NOT tagging
    Tags    []string  `json:"tags,omitempty"` // omit nil OR empty slice
}
```

Why `omitempty` alone is broken:

```go
// WRONG — omitempty can't omit a zero time.Time (it's a non-empty struct),
// so you emit "0001-01-01T00:00:00Z":
When time.Time `json:"when,omitempty"`   // ← does nothing; struct is never "empty"

// RIGHT [1.24]:
When time.Time `json:"when,omitzero"`    // time.Time has IsZero() → omitted
```

They're **independent** and can both appear: `json:"x,omitempty,omitzero"`. (In v2, `omitempty` becomes JSON-output-emptiness based: verify if you migrate.)

zero vs absent: the three-state problem. A value-typed field can't distinguish "was `0`" from "was absent." When a PATCH/merge API must tell them apart, use a **pointer** (`nil` = absent, `&0` = explicit zero):

```go
type Patch struct {
    Name  *string `json:"name,omitempty"`   // nil ⇒ "don't touch"; &"" ⇒ "set to empty"
    Quota *int    `json:"quota,omitempty"`  // nil ⇒ absent;       &0  ⇒ "set to zero"
}
// [1.26] populate a pointer field in one expression:
p := Patch{Quota: new(0)}                   // was: q := 0; Patch{Quota: &q}
```

To separate absent / explicit `null` / present, decode into `json.RawMessage` and inspect, or do a first pass into `map[string]json.RawMessage` to see which keys actually arrived.

---

## Numbers, precision, json.Number & RawMessage {#numbers}

The precision trap. Decoding JSON numbers into `any` (or `map[string]any`) yields **`float64`**, which has 53 bits of mantissa. Any `int64` above 2^53 (~9.0e15): Twitter snowflake IDs, large counters: is silently corrupted.

```go
// WRONG — id is float64; 9007199254740993 round-trips as 9007199254740992:
var m map[string]any
json.Unmarshal([]byte(`{"id":9007199254740993}`), &m)

// RIGHT (a) — decode into a typed field; int64 is exact:
var v struct{ ID int64 `json:"id"` }
json.Unmarshal(data, &v)

// RIGHT (b) — UseNumber: json.Number is the decimal text, lossless:
dec := json.NewDecoder(r)
dec.UseNumber()
var m map[string]any
dec.Decode(&m)
id, err := m["id"].(json.Number).Int64()   // or .Float64(), .String()
```

`json.Number` [1.1] is a `string` with `.Int64()`/`.Float64()`/`.String()`. Use it when a value may exceed `int64` or you must preserve exact numeric text. For money, decode to `json.Number`/`string` and parse into a decimal type: never `float64`.

`json.RawMessage` [1.1] is `[]byte` that defers (un)marshaling: stores raw JSON verbatim:

```go
type Envelope struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"` // not decoded until Type is known
}
// dispatch on Type, then json.Unmarshal(env.Payload, &concrete)
```

Use `RawMessage` for discriminated unions, pass-through proxies that mustn't reserialize, lazy decoding of large blobs, and (on marshal) injecting pre-rendered JSON without re-encoding.

---

## Custom marshalers, time & []byte {#custom-marshal}

Implement `json.Marshaler`/`json.Unmarshaler` to control a type's wire form. The classic case is a duration:

```go
type Duration time.Duration

func (d Duration) MarshalJSON() ([]byte, error) {
    return json.Marshal(time.Duration(d).String()) // "5m30s", not 330000000000
}
func (d *Duration) UnmarshalJSON(b []byte) error {
    var s string
    if err := json.Unmarshal(b, &s); err != nil { return err }
    v, err := time.ParseDuration(s)
    if err != nil { return err }
    *d = Duration(v)
    return nil
}
```

Pointer-receiver rule: `UnmarshalJSON` must be on `*T` and the value must be addressable to fire. A value-receiver `MarshalJSON` serves `T` and `*T`; a pointer-receiver one fires only when marshaling a pointer.

`time.Time` formats as RFC 3339 because it implements `MarshalJSON`/`TextMarshaler`. For Unix epoch, date-only, or another layout, wrap it in your own type. `encoding/json` falls back to `encoding.TextMarshaler`/`TextUnmarshaler` when `json.Marshaler` is absent, so `net.IP`, `time.Time`, etc. serialize as JSON strings for free.

HTML escaping is on by default. `json.Marshal` escapes `<`, `>`, `&` (and `HTMLEscape` also U+2028/U+2029) for safe `<script>` embedding: corrupting values meant for non-HTML consumers (signatures, exact-match keys):

```go
enc := json.NewEncoder(w)
enc.SetEscapeHTML(false) // emit < > & literally
```

`json.Marshal` (the function) always HTML-escapes; only `Encoder` can disable it. `Encoder.Encode` also **appends a trailing newline**: a frequent surprise in golden-file tests and byte comparisons.

---

## Streaming with Decoder / Encoder {#streaming}

`json.Unmarshal` buffers the **entire** input into `[]byte` first: an OOM risk on large files or untrusted HTTP bodies. `json.Decoder` reads incrementally.

```go
// Stream a top-level JSON array element-by-element (constant memory):
dec := json.NewDecoder(r)
dec.DisallowUnknownFields()                  // reject typo'd/extra keys
if _, err := dec.Token(); err != nil {       // consume opening '['
    return err
}
for dec.More() {
    var item Item
    if err := dec.Decode(&item); err != nil {
        return fmt.Errorf("decode item: %w", err)
    }
    process(item)
}
_, err := dec.Token()                        // consume closing ']'
```

Decoder knobs: `DisallowUnknownFields()` [1.10] (silent key-drops → errors); `UseNumber()` [1.1] (lossless numbers); `Token()`/`More()` [1.5] (token streaming); `InputOffset()` [1.14] (error positions). **Encoder knobs:** `SetEscapeHTML(false)`, `SetIndent(...)`. `NewEncoder(w).Encode(v)` streams straight to an `io.Writer` (e.g. `http.ResponseWriter`), skipping the buffer that `Marshal` + `w.Write` allocates.

Trap: one `Decode` reads *one* value and stops at the next token boundary: it does **not** require EOF. To reject trailing garbage (`{...}{...}` or `{...} junk`), after `Decode(&v)` verify a second `Decode` returns `io.EOF`. For decoder reuse / `sync.Pool`, see [performance.md](performance.md).

---

## JSON v2 [1.26, experimental] {#json-v2}

`encoding/json/v2` is a ground-up redesign (RFC 8259) fixing v1's worst defaults and adding true streaming. It exists **only** with `GOEXPERIMENT=jsonv2`; the overview states it is experimental and **not** under the Go 1 compatibility promise. It ships with `encoding/json/jsontext`, a low-level format-only tokenizer.

```bash
GOEXPERIMENT=jsonv2 go build ./...
```

Default behavior changes from v1 (all toggleable via `Options`):

| Behavior | v1 default | v2 default | v2 opt-out |
|----------|-----------|-----------|------------|
| `nil` slice | `null` | `[]` | `json.FormatNilSliceAsNull(true)` |
| `nil` map | `null` | `{}` | `json.FormatNilMapAsNull(true)` |
| Member matching | case-insensitive | case-**sensitive** | `json.MatchCaseInsensitiveNames(true)` |
| Duplicate names | last wins (merge/replace) | **rejected** | `jsontext.AllowDuplicateNames(true)` |
| Invalid UTF-8 | replaced with U+FFFD | **rejected** | `jsontext.AllowInvalidUTF8(true)` |
| Unknown members | ignored | ignored | `json.RejectUnknownMembers(true)` to reject |

Verified top-level API (all take a variadic `opts ...Options`):

```go
func Marshal(in any, opts ...Options) ([]byte, error)
func MarshalWrite(out io.Writer, in any, opts ...Options) error
func MarshalEncode(out *jsontext.Encoder, in any, opts ...Options) error
func Unmarshal(in []byte, out any, opts ...Options) error
func UnmarshalRead(in io.Reader, out any, opts ...Options) error
func UnmarshalDecode(in *jsontext.Decoder, out any, opts ...Options) error
```

True streaming custom (un)marshalers: replace v1's `MarshalJSON`/`UnmarshalJSON` (which forced a full buffer) with the `jsontext` tokenizer:

```go
import (
    jsonv2 "encoding/json/v2"
    "encoding/json/jsontext"
)

// Verified interface names: MarshalerTo.MarshalJSONTo / UnmarshalerFrom.UnmarshalJSONFrom.
func (t MyType) MarshalJSONTo(enc *jsontext.Encoder) error   { /* write tokens */ return nil }
func (t *MyType) UnmarshalJSONFrom(dec *jsontext.Decoder) error { /* read tokens */ return nil }
```

Useful options: `json.Deterministic(true)` (sorted map keys → reproducible/signable output), `json.OmitZeroStructFields(true)`, `json.StringifyNumbers(true)`, and `json.WithMarshalers(...)`/`WithUnmarshalers(...)` to register type behavior *without* modifying the type; combine via `json.JoinOptions(...)`.

Status & guidance: experimental in 1.26: **do not** import from a published module or rely on it in production. Use a feature-flagged/staging build to measure the perf win and flush out behavioral diffs (nil collections, case-sensitivity, duplicate-key rejection) before GA. The dev repo `github.com/go-json-experiment/json` mirrors the API but **must not** appear in published `go.mod`. [verify: GA target; whether v1 is internally reimplemented on v2: the v2 doc does not assert this, treat as unconfirmed.]

---

## encoding.TextAppender / BinaryAppender [1.24] {#appender}

Append-style interfaces [1.24] let a type serialize into a caller-owned buffer with no allocation:

```go
type TextAppender interface   { AppendText(b []byte) ([]byte, error) }
type BinaryAppender interface { AppendBinary(b []byte) ([]byte, error) }
```

Contract (docs): if a type implements both Appender and Marshaler, `v.MarshalText()` **must equal** `v.AppendText(nil)` (same for binary); implementations **must not retain** `b` nor mutate `b[:len(b)]`. Implement `AppendText` and define `MarshalText` in terms of it:

```go
func (id ID) AppendText(b []byte) ([]byte, error) {
    return append(b, id[:]...), nil
}
func (id ID) MarshalText() ([]byte, error) { return id.AppendText(nil) }
```

Many stdlib types (`time.Time`, `net.IP`, `netip.Addr`) implement these, so buffering many values avoids per-value allocations. `encoding/json`, `gob`, and `xml` all detect the marshaler interfaces: one implementation serves multiple encodings.

---

## Protocol Buffers {#protobuf}

Import: `google.golang.org/protobuf` (the modern API; requires a recent Go toolchain). **Deprecated:** `github.com/golang/protobuf` (old v1), `github.com/gogo/protobuf`: don't use in new code.

```go
import "google.golang.org/protobuf/proto"

data, err := proto.Marshal(msg) // msg is a generated *pb.T
err = proto.Unmarshal(data, msg)

// JSON form of a protobuf message (canonical proto3 JSON mapping):
import "google.golang.org/protobuf/encoding/protojson"
b, err := protojson.Marshal(msg) // NOT interchangeable with encoding/json
```

buf is the modern toolchain (pure Go, no `protoc`/C++): `buf generate`, `buf lint`, `buf breaking` (CI gate for incompatible schema changes), plus remote plugins and the BSR registry.

```yaml
# buf.gen.yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/go
    out: gen/go
    opt: paths=source_relative
  - remote: buf.build/grpc/go
    out: gen/go
    opt: paths=source_relative
```

Use for: gRPC/inter-service RPC, strong schema evolution, polyglot fleets. Compare messages via `proto.Equal`, never `bytes.Equal`: proto marshaling is **not** canonical (map ordering, unknown fields), so bytes can differ across runs. gRPC wiring: [http-and-apis.md](http-and-apis.md) / [distributed-systems.md](distributed-systems.md).

---

## MessagePack & CBOR {#msgpack}

Two schemaless binary formats with a JSON-like data model. Pick **CBOR** if you want an IETF standard (RFC 8949) and its ecosystem (COSE, WebAuthn, EDN); pick **MessagePack** for its slightly smaller footprint and ubiquity in caching stacks.

```go
// MessagePack — github.com/vmihailenco/msgpack/v5
import "github.com/vmihailenco/msgpack/v5"
data, err := msgpack.Marshal(user)
err = msgpack.Unmarshal(data, &user)

// CBOR — github.com/fxamacker/cbor/v2 (security-reviewed, RFC 8949)
import "github.com/fxamacker/cbor/v2"
data, err := cbor.Marshal(user)
err = cbor.Unmarshal(data, &user)
```

Both mirror the `encoding/json` API and honor struct tags (`msgpack:"..."` / `cbor:"..."`, or `enc.SetCustomStructTag("json")` to reuse JSON tags). MessagePack's `UseCompactInts`/`UseCompactFloats` shrink output; `UseArrayEncodedStructs(true)` encodes positionally (smallest, but field-order-coupled: a schema-evolution hazard). `fxamacker/cbor` offers deterministic/canonical modes for signing.

Use over JSON when: cache values (Redis/memcached), high-volume internal messaging where a protobuf schema is overkill, or binary + cross-language. Measure first: JSON (or v2/sonic) is often fast enough and far more debuggable.

---

## Gob (Go-to-Go Only) {#gob}

Import: `encoding/gob`. Self-describing binary, stdlib, **Go-only**.

```go
var buf bytes.Buffer
err := gob.NewEncoder(&buf).Encode(value)
err = gob.NewDecoder(&buf).Decode(&target)

gob.Register(MyConcreteType{}) // required for values sent through an interface field
```

### Schema evolution (matched by **name**, not position)

| Change | Safe? | Behavior |
|--------|-------|----------|
| Add field | Yes | Receiver ignores unknown fields |
| Remove field | Yes | Missing fields keep zero value |
| Reorder fields | Yes | Matched by name |
| Rename field | **No** | Old name no longer matches → silent zero |
| Change field type | **No** | Must be compatible or decode errors |

Limits: Go-only; no formal wire-format spec; can't encode funcs/channels; the *first* value on a stream carries type info (slower), amortized after. **Don't** use for durable storage or cross-team contracts. **Do** use for `net/rpc` (gob is its default), short-lived Go↔Go IPC, and caches where both ends are the same binary. Forgetting `gob.Register` for an interface value is a **runtime panic**, not a compile error.

---

## Binary (encoding/binary) {#binary}

Import: `encoding/binary`. Byte-level control for custom protocols, file formats, hardware.

```go
binary.BigEndian    // network byte order — use for protocols
binary.LittleEndian // x86/ARM native
binary.NativeEndian // [1.21] machine native
```

Fast path (no reflection): use the typed Put/get methods or the `Append*` family [1.19]:

```go
buf := make([]byte, 8)
binary.BigEndian.PutUint32(buf[0:4], hdr.Length)
binary.BigEndian.PutUint32(buf[4:8], hdr.Type)
length := binary.BigEndian.Uint32(buf[0:4])
buf = binary.BigEndian.AppendUint32(buf, value) // [1.19] no pre-size needed
```

Slow path (reflection): `binary.Read`/`binary.Write` (and `binary.Append` [1.23]) are convenient but markedly slower; reserve for cold paths. They handle only **fixed-size** types: no strings/maps/slices.

Varints: two incompatible conventions; confirm which the spec wants before you write a byte:

- LSB-first, little-endian base-128: Go's stdlib *and* the **protobuf wire format / LEB128**. Use `binary.PutUvarint`/`PutVarint` and `ReadUvarint`/`ReadVarint` (the reader must be an `io.ByteReader`). The least-significant 7-bit group is emitted **first**; the continuation bit `0x80` is set on every byte *except the last*. `128` → `0x80 0x01`.
- MSB-first, big-endian base-128: **MIDI / Standard-MIDI-File delta-times, ASN.1 BER, DWARF, Git**. The standard library does **not** produce this; hand-roll it (most-significant group first):

```go
// MSB-first VLQ (MIDI/Git style): high 7-bit group first. 128 -> 0x81 0x00.
func putVLQ(x uint32) []byte {
    b := []byte{byte(x & 0x7f)} // low group, no continuation bit
    for x >>= 7; x > 0; x >>= 7 {
        b = append([]byte{byte(x&0x7f | 0x80)}, b...) // prepend higher groups
    }
    return b
}
```

Reaching for `binary.PutUvarint` when the spec wants MIDI-style VLQ (or vice-versa) silently yields **byte-reversed** output: the two encodings agree only for values < 128, so small tests pass and real data corrupts. Length-prefixed framing: [networking.md](networking.md#custom-protocol).

---

## CSV {#csv}

Import: `encoding/csv`.

```go
r := csv.NewReader(file)
for {
    rec, err := r.Read()
    if err == io.EOF { break }
    if err != nil { return err }
    process(rec)
}

w := csv.NewWriter(file)
w.WriteAll(records)         // flushes internally
// for incremental writes: w.Write(rec) in a loop, then:
w.Flush()
if err := w.Error(); err != nil { return err } // Flush errors surface HERE
```

| Setting | Default | Use when |
|---------|---------|----------|
| `Comma` | `,` | `'\t'` for TSV |
| `FieldsPerRecord` | `0` (lock to first row) | `-1` for ragged rows |
| `LazyQuotes` | `false` | `true` for messy/non-standard quoting |
| `TrimLeadingSpace` | `false` | `true` to strip leading field whitespace |
| `ReuseRecord` | `false` | `true` for speed: **caller must copy** the returned slice |
| `UseCRLF` (Writer) | `false` | `true` for RFC 4180 strict output |

Gotchas: a UTF-8 **BOM** is not stripped: remove it before parsing or the first header field is corrupted. With `ReuseRecord`, the returned slice is overwritten on the next `Read`: copy if you retain it. `Flush` errors are observable only via `Error()`, never returned by `Write`.

---

## XML {#xml}

Import: `encoding/xml`: use only when forced (SOAP, SAML, RSS/Atom, legacy). Tags: `xml:"name"` (element), `xml:"name,attr"` (attribute), `xml:",chardata"` (text), `xml:",cdata"`, `xml:"parent>child"` (nested path), `xml:",innerxml"` (raw), `xml:",comment"`. **Stdlib limits:** incomplete namespace handling, no XPath/XSLT/XSD, not perfectly round-trippable, no streaming marshal (decode supports `Decoder.Token`). Alternatives: `github.com/beevik/etree` (mutable DOM), `github.com/nbio/xml` (better namespace prefixes). Prefer JSON/protobuf for anything new.

---

## High-performance JSON (sonic/jsoniter) {#fast-json}

Before reaching for a third-party JSON library, try **`GOEXPERIMENT=jsonv2`**: it's stdlib, no new dependency, and closes much of the historical gap. If you still need more:

| Library | Trade-off |
|---------|-----------|
| `github.com/bytedance/sonic` | Fastest (JIT + SIMD); **amd64/arm64 only**, falls back elsewhere; larger surface, occasional edge-case differences from stdlib. Best for hot marshal/unmarshal paths. |
| `github.com/json-iterator/go` | Near-drop-in `ConfigCompatibleWithStandardLibrary`; mature but **lightly maintained** now. Modest speedup over v1; v2/sonic often better. |
| `github.com/goccy/go-json` | Drop-in API, strong all-rounder, pure Go (portable). |

Trade-offs: (1) **compatibility**: they aim to match `encoding/json` but differ in error text/edge cases, so a contract test suite is mandatory before swapping. (2) **portability**: sonic's fast path is arch-gated. (3) **security**: parsers on untrusted input must be actively maintained; prefer stdlib v2 there. (4) **measure**: profile that JSON is the bottleneck; `Decoder`/`Encoder` + `sync.Pool` reuse often beats a library swap.

---

## Schema evolution {#schema-evolution}

How each format tolerates change drives format choice for anything long-lived or cross-team:

| Format | Add field | Remove field | Rename | Reorder |
|--------|-----------|-------------|--------|---------|
| **JSON** | Safe (unknown ignored, or rejected with `DisallowUnknownFields`) | Safe (zero value) | Breaks consumers keyed on old name | N/A (keyed) |
| **Protobuf** | Safe (new field number) | Safe if number **reserved** | Safe (matched by **number**, not name) | N/A (numbered) |
| **gob** | Safe | Safe | **Breaks** (matched by name) | Safe |
| **CBOR/MessagePack (map mode)** | Safe | Safe | Breaks | Safe |
| **MessagePack (array/positional)** | Append-only | **Breaks** | N/A | **Breaks** |

Rules: protobuf is the gold standard: never reuse a retired field number (`reserved` it), never change a field's type. JSON evolves well if consumers ignore unknowns (the default) and you never repurpose a key. gob and positional encodings are brittle for durable/shared data. Across all formats: add, don't mutate; version the envelope for unavoidable breaks.

---

## Library landscape & status {#libraries}

| Library | Status [2026] | Use when |
|---------|---------------|----------|
| stdlib `encoding/json` (v1) | **Default** | Almost all JSON today |
| `encoding/json/v2` + `jsontext` | **Experimental** [1.26, `GOEXPERIMENT=jsonv2`] | New code via build flag; better defaults + streaming; not in published modules |
| `google.golang.org/protobuf` | **Default** for protobuf | gRPC, schemas, polyglot |
| `github.com/golang/protobuf`, `gogo/protobuf` | **Deprecated** | Never in new code |
| `github.com/fxamacker/cbor/v2` | Active, security-reviewed | CBOR (RFC 8949), COSE/WebAuthn, deterministic encoding |
| `github.com/vmihailenco/msgpack/v5` | Active | MessagePack caches/messaging |
| `encoding/gob` (stdlib) | Stable, niche | Go↔Go only; `net/rpc`, same-binary caches |
| `github.com/bytedance/sonic` | Active | Hottest JSON paths (amd64/arm64) |
| `github.com/json-iterator/go` | Lightly maintained | Legacy near-drop-in; prefer v2/sonic for new |
| `github.com/goccy/go-json` | Active | Portable fast drop-in |
| `github.com/beevik/etree` | Active | XML DOM manipulation |

---

## Version map 1.21→1.27 {#versions}

| Ver | Encoding-relevant |
|-----|-------------------|
| **1.21** | `binary.NativeEndian` |
| **1.22** | (no major encoding API; general perf) |
| **1.23** | `binary.Append` (reflection convenience) |
| **1.24** | **`omitzero` struct tag**; **`encoding.TextAppender`/`BinaryAppender`** |
| **1.25** | `encoding/json/v2` available as an experiment (early form) |
| **1.26** | **`encoding/json/v2` + `encoding/json/jsontext`** under `GOEXPERIMENT=jsonv2` (experimental); `new(expr)` aids optional pointer fields; (`slog.NewMultiHandler`, `NotifyContext` cause: adjacent) |
| **1.27 (RC)** | json/v2 progress toward GA [verify]; generic methods (enable generic marshaler helpers). Treat as draft until GA. |

---

## What models get wrong {#stale}

1. `omitempty` on a `time.Time`/struct to omit its zero value: does nothing; use **`omitzero`** [1.24].
2. Decoding numbers into `any`/`map[string]any`: `int64 > 2^53` corrupted via `float64`; use a typed field or `UseNumber()`.
3. Assuming v1 member matching is case-sensitive: it's case-**insensitive** (v2 flips this); and assuming `nil` slice/map → `[]`/`{}` (it's `null`).
4. Claiming `json.Marshal` can disable HTML escaping: only `Encoder.SetEscapeHTML(false)` can; and forgetting `Encoder.Encode` appends a trailing newline (breaks golden tests).
5. `UnmarshalJSON` on a value receiver: must be `*T` and addressable. Treating `[]byte` fields as number arrays: they're **base64**.
6. Comparing protobuf via `bytes.Equal` (not canonical) → use `proto.Equal`; comparing JSON via `string(b)` → unmarshal and compare.
7. `gob` cross-language/durable; forgetting `gob.Register` for interface values (runtime **panic**).
8. Importing `encoding/json/v2` or `go-json-experiment/json` from a published module: experimental/dev-only.
9. Reusing a protobuf field number after removal: silent corruption; always `reserved` it.
10. Adopting sonic/jsoniter with no contract tests or profile proving JSON is the bottleneck.

---

## Anti-Patterns {#anti-patterns}

| Anti-Pattern | What goes wrong | Fix |
|---|---|---|
| `omitempty` on `time.Time`/structs | Never omitted (struct isn't JSON-empty) | `omitzero` [1.24] |
| Numbers into `any` without `UseNumber` | `int64 > 2^53` silently corrupted via `float64` | typed field, or `dec.UseNumber()` → `json.Number` |
| `json.Unmarshal` on large/HTTP bodies | Buffers entire payload: OOM | `json.NewDecoder(r).Decode(&v)` |
| No `DisallowUnknownFields` in strict ingest | Typo'd keys silently dropped | `dec.DisallowUnknownFields()` |
| Assuming `null` for empty slice/map | v1 emits `null`, breaks JS clients expecting `[]`/`{}` | init non-nil, or json v2 |
| `Marshal` then expecting no HTML escape | `< > &` become `\u00xx` | `Encoder` + `SetEscapeHTML(false)` |
| `string(jsonBytes)` for equality | whitespace/key-order/newline differ | unmarshal + compare fields |
| `bytes.Equal` on protobuf | proto output not canonical | `proto.Equal` |
| `gob` cross-language / durable | Go-only, no spec, name-coupled | protobuf / CBOR |
| Missing `gob.Register` for interfaces | runtime panic on encode | register every concrete type |
| `binary.Read`/`Write` in hot loops | reflection: slow | `BigEndian.PutUint32` / `Append*` |
| fast-JSON lib swap on a hunch | edge-case/arch incompat, no measured win | profile; contract tests; try json v2 first |

---

## See Also {#see-also}

- [http-and-apis.md](http-and-apis.md#json-api): JSON request/response handling, `Encoder`-to-`ResponseWriter`, content negotiation
- [api-design.md](api-design.md#error-responses): response envelopes, RFC 9457 error bodies
- [distributed-systems.md](distributed-systems.md): gRPC/protobuf at service boundaries
- [networking.md](networking.md#custom-protocol): length-prefixed binary framing with `encoding/binary`
- [performance.md](performance.md): `sync.Pool` for encoder/decoder reuse, allocation profiling
- [modern-go.md](modern-go.md): `new(expr)` [1.26], generics in the version matrix

---

## Sources {#sources}

- pkg.go.dev/{encoding, encoding/json, encoding/json/v2, encoding/json/jsontext, encoding/binary, encoding/csv, encoding/gob, encoding/xml} @ go1.26.x
- go.dev/doc/go1.24 (omitzero, TextAppender/BinaryAppender), go.dev/doc/go1.26 (new(expr); json/v2 + jsontext under GOEXPERIMENT=jsonv2), go.dev/doc/go1.27 (RC notes: draft)
- `encoding/json` package overview: v1 "behaviors that cannot be changed" (duplicate keys, case-insensitive matching, unknown-key handling, invalid-UTF-8 replacement, integer precision)
- `encoding/json/v2` package overview: differs-from-v1 list, `Options` toggles, `MarshalerTo`/`UnmarshalerFrom`
- protobuf.dev (proto3 JSON mapping, field-number rules); RFC 8949 (CBOR); buf.build docs
- Repos: google.golang.org/protobuf, fxamacker/cbor, vmihailenco/msgpack, bytedance/sonic, json-iterator/go, goccy/go-json, beevik/etree