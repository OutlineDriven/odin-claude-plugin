# Parse, Don't Validate -- Patterns by Language

Brief constructor-validation patterns. The type IS the proof of validity.

## Rust

```rust
pub struct EmailAddress(String);
impl EmailAddress {
    pub fn parse(raw: &str) -> Result<Self, ValidationError> {
        if raw.contains('@') && raw.contains('.') { Ok(Self(raw.to_string())) }
        else { Err(ValidationError::InvalidEmail) }
    }
    pub fn as_str(&self) -> &str { &self.0 }
}
```

## TypeScript

```typescript
declare const EmailBrand: unique symbol;
type EmailAddress = string & { readonly [EmailBrand]: typeof EmailBrand };
function parseEmail(raw: string): EmailAddress {
  if (!raw.includes('@') || !raw.includes('.')) throw new ValidationError('Invalid email');
  return raw as EmailAddress;
}
```

## Python

```python
@dataclass(frozen=True)
class EmailAddress:
    value: str
    def __post_init__(self):
        if '@' not in self.value or '.' not in self.value:
            raise ValueError('Invalid email')
```

## Kotlin

```kotlin
@JvmInline
value class EmailAddress private constructor(val value: String) {
    companion object {
        fun parse(raw: String): EmailAddress {
            require('@' in raw && '.' in raw) { "Invalid email" }
            return EmailAddress(raw)
        }
    }
}
```

## Go

```go
type EmailAddress struct{ value string }
func ParseEmail(raw string) (EmailAddress, error) {
    if !strings.Contains(raw, "@") || !strings.Contains(raw, ".") {
        return EmailAddress{}, errors.New("invalid email")
    }
    return EmailAddress{value: raw}, nil
}
```

## Java

```java
public record EmailAddress(String value) {
    public EmailAddress {
        if (!value.contains("@") || !value.contains("."))
            throw new IllegalArgumentException("Invalid email");
    }
}
```

## C++

```cpp
class EmailAddress {
    std::string value_;
    explicit EmailAddress(std::string val) : value_(std::move(val)) {}
public:
    static std::expected<EmailAddress, Error> parse(std::string_view raw) {
        if (raw.find('@') == std::string_view::npos || raw.find('.') == std::string_view::npos)
            return std::unexpected(Error::InvalidEmail);
        return EmailAddress{std::string(raw)};
    }
    std::string_view value() const { return value_; }
};
```

## C#

```csharp
public sealed record EmailAddress {
    public string Value { get; }
    private EmailAddress(string value) => Value = value;
    public static EmailAddress Parse(string raw) =>
        raw.Contains('@') && raw.Contains('.')
            ? new EmailAddress(raw)
            : throw new ArgumentException("Invalid email");
}
```

## Swift

```swift
struct EmailAddress {
    let value: String
    init?(raw: String) {
        guard raw.contains("@"), raw.contains(".") else { return nil }
        self.value = raw
    }
}
```

## Scala 3

```scala
opaque type EmailAddress = String
object EmailAddress:
  def parse(raw: String): Either[String, EmailAddress] =
    if raw.contains("@") && raw.contains(".") then Right(raw)
    else Left("Invalid email")
```
