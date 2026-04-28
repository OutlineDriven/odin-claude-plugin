# Go strict-mode bootstrap (2026)

Go has no single strict-mode toggle. The 2026 idiom is golangci-lint with the `staticcheck` family enabled, plus `go vet` in CI, plus typed-error and context-first conventions enforced at review.

## .golangci.yml

```yaml
version: "2"
run:
  timeout: 5m
  go: "1.24"

linters:
  enable:
    - errcheck
    - errorlint
    - exhaustive
    - gocritic
    - gosec
    - govet
    - ineffassign
    - revive
    - staticcheck
    - unused
    - wastedassign

linters-settings:
  errorlint:
    errorf: true
    asserts: true
    comparison: true
  exhaustive:
    default-signifies-exhaustive: false  # require explicit case coverage; `default` does not hide future enum cases
  govet:
    enable-all: true
  staticcheck:
    checks: ["all"]
```

`errorlint` enforces `%w` for error wrapping (matches the user's "errors %w typed/sentinel" rule). `exhaustive` with `default-signifies-exhaustive: false` requires every typed-enum `switch` to list each case explicitly — a bare `default` does not silence the lint, so adding a new enum value forces a compile-time review of every switch over it. `staticcheck checks: ["all"]` enables every rule.

## Justfile (or Makefile target)

```just
test:
    go test -race -count=1 ./...

vet:
    go vet ./...

lint:
    golangci-lint run ./...

verify: vet lint test
```

`-race` is the de facto 2026 default for `go test`; without it, data races silently pass.

## Schema validators at IO boundaries

```go
type Request struct {
    UserID  uuid.UUID       `json:"user_id" validate:"required,uuid4"`
    Payload json.RawMessage `json:"payload" validate:"required"`
}

// Reject unknown fields, trailing data, and concatenated JSON at decode time.
func ParseRequest(r io.Reader) (Request, error) {
    var req Request
    dec := json.NewDecoder(r)
    dec.DisallowUnknownFields()
    if err := dec.Decode(&req); err != nil {
        return Request{}, fmt.Errorf("decode request: %w", err)
    }
    // Reject trailing data: a second decode must hit io.EOF cleanly.
    var sentinel struct{}
    if err := dec.Decode(&sentinel); err != io.EOF {
        if err == nil {
            return Request{}, fmt.Errorf("decode request: unexpected trailing JSON value")
        }
        return Request{}, fmt.Errorf("decode request: trailing bytes after object: %w", err)
    }
    if err := validator.New().Struct(req); err != nil {
        return Request{}, fmt.Errorf("validate request: %w", err)
    }
    return req, nil
}
```

`DisallowUnknownFields()` is the stdlib equivalent of zod's `.strict()`. Pair with `go-playground/validator` for field-level constraints.

## Notes

- `errcheck` will flag every unchecked error return — including ones in tests. Use `_ =` explicitly when discarding is intentional.
- Generics (Go 1.18+) interact awkwardly with some linters; use `gocritic` rule disables sparingly.
- Race detector (`-race`) doubles binary size and slows runtime ~2-10×; run it always in CI, optionally locally.
