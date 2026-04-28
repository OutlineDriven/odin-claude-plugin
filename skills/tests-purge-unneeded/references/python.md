# Python — pytest deletion patterns

Python has no enforced static type system at runtime — `mypy`/`pyright` are advisory. This means **boundary shape/type tests ARE real-bug tests** in Python; a refactor that silently changes a return shape will pass type checking (if the user even runs it) but blow up at runtime. Keep these.

## Delete (no compiler covers this — the test still does not earn its keep)

### Identity passthrough

```python
def test_echo_returns_input():
    assert echo("hello") == "hello"  # what bug does this catch? none
    assert echo(42) == 42
```

`echo` is either dead code or its real behavior is something else (validation, normalization, logging). If dead, delete the function. If it transforms, test the transform. The identity assertion describes the signature, not the behavior.

### Mock-only test

```python
def test_user_service_returns_user(mocker):
    mock_repo = mocker.Mock()
    mock_repo.get.return_value = User(id=1, name="x")
    service = UserService(repo=mock_repo)
    result = service.get_user(1)
    assert result == User(id=1, name="x")  # asserting the mock's fixture
```

The mock returns a fixture; the test asserts the fixture. Zero real I/O, zero real validation, zero real bug surface. Delete or replace with a real-DB integration test.

### Constructor reflects its arguments

```python
@dataclass
class User:
    id: int
    name: str

def test_user_constructor():
    u = User(id=1, name="alice")
    assert u.id == 1
    assert u.name == "alice"
```

The `@dataclass` decorator generates `__init__` that does exactly this — Python's runtime guarantees it. A real bug here would mean the dataclass decorator broke, which is not your codebase's bug.

## Keep (boundary / contract / I/O — real-bug surface)

### Boundary shape test (Python's dynamic-typing carve-out)

```python
def test_parse_user_returns_dict_with_required_keys():
    result = parse_user_payload({"name": "x", "age": 30})
    assert "name" in result
    assert "age" in result
    assert isinstance(result["age"], int)
```

This catches a refactor that silently changes the return shape — runtime type hints will not enforce it. Keep.

### Real-I/O integration

```python
def test_user_repo_persists_and_retrieves(db_session):
    user = User(id=1, name="alice")
    db_session.add(user)
    db_session.commit()
    found = db_session.query(User).get(1)
    assert found.name == "alice"
```

Real DB, real transaction. Catches schema mismatches, ORM mapping bugs, transaction-handling errors. Keep.

### Error semantics

```python
def test_parse_rejects_missing_required_field():
    with pytest.raises(ValidationError):
        parse_user_payload({"age": 30})  # missing "name"
```

Boundary contract — what happens when the input is wrong. Real-bug surface. Keep.

### Security invariant

```python
def test_admin_endpoint_rejects_unauthenticated_request(client):
    response = client.get("/admin/users")
    assert response.status_code == 401
```

Authz boundary. Always keep.
