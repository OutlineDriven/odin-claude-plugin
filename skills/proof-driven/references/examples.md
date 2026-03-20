# Property Test Patterns by Language

Brief property test patterns. One property per language demonstrating a round-trip or invariant.

## Rust

```rust
proptest! {
    #[test]
    fn encode_decode_roundtrip(input in "\\PC*") {
        let encoded = encode(&input);
        let decoded = decode(&encoded).unwrap();
        prop_assert_eq!(input, decoded);
    }
}
```

## Python

```python
@given(st.binary())
def test_encode_decode_roundtrip(data):
    encoded = encode(data)
    decoded = decode(encoded)
    assert decoded == data
```

## TypeScript

```typescript
fc.assert(fc.property(fc.string(), (input) => {
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
}));
```

## Go

```go
func TestEncodeDecodeRoundtrip(t *testing.T) {
    rapid.Check(t, func(t *rapid.T) {
        input := rapid.SliceOf(rapid.Byte()).Draw(t, "input")
        decoded, err := Decode(Encode(input))
        assert.NoError(t, err)
        assert.Equal(t, input, decoded)
    })
}
```

## Java

```java
@Property
void encodeDecodeRoundtrip(@ForAll String input) {
    String encoded = encode(input);
    String decoded = decode(encoded);
    assertThat(decoded).isEqualTo(input);
}
```

## Kotlin

```kotlin
forAll(Arb.string()) { input ->
    val encoded = encode(input)
    val decoded = decode(encoded)
    decoded shouldBe input
}
```

## C++

```cpp
rc::prop("encode/decode roundtrip", [](const std::string& input) {
    auto encoded = encode(input);
    auto decoded = decode(encoded);
    RC_ASSERT(decoded == input);
});
```

## C#

```csharp
[Property]
public Property EncodeDecodeRoundtrip() =>
    Prop.ForAll(Arb.Default.String(), input => {
        var encoded = Encode(input);
        var decoded = Decode(encoded);
        return decoded == input;
    });
```

## Haskell

```haskell
prop_roundtrip :: Property
prop_roundtrip = property $ do
  input <- forAll $ Gen.bytes (Range.linear 0 1000)
  decode (encode input) === Right input
```

## Elixir

```elixir
property "encode/decode roundtrip" do
  check all input <- binary() do
    assert input == input |> encode() |> decode!()
  end
end
```
