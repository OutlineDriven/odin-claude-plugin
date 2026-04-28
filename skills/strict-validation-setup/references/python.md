# Python strict-mode bootstrap (2026)

## pyrightconfig.json

```json
{
  "typeCheckingMode": "strict",
  "pythonVersion": "3.12",
  "useLibraryCodeForTypes": true,
  "reportMissingTypeStubs": true,
  "reportImplicitOverride": "error",
  "reportShadowedImports": "error",
  "reportUnusedCallResult": "warning"
}
```

Pyright `typeCheckingMode = "strict"` is the canonical 2026 strict surface (~30 rules enabled). The extra `reportImplicitOverride` and `reportShadowedImports` close two common drift sources in long-running codebases.

## ruff.toml

```toml
target-version = "py312"
line-length = 100

[lint]
extend-select = ["F", "W", "E", "I", "UP", "C4", "B", "SIM", "ANN", "PT"]
ignore = ["ANN101", "ANN102"]  # self/cls type annotations are noise

[lint.per-file-ignores]
"tests/**" = ["ANN", "S101"]   # tests can assert without S101
```

The selected rule families: Pyflakes (F), pycodestyle warnings (W), pycodestyle errors (E), isort (I), pyupgrade (UP), comprehensions (C4), bugbear (B), simplify (SIM), annotations (ANN), pytest-style (PT). This is broader than the bare 2026 default and matches the user's coding standard ("Strict type hints ALWAYS").

## Schema validators at IO boundaries

```python
from pydantic import BaseModel, ConfigDict, Field
from typing import Annotated

class Request(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)

    user_id: Annotated[str, Field(min_length=36, max_length=36)]
    payload: dict[str, object]
```

`extra="forbid"` rejects unknown keys; `frozen=True` makes instances hashable and immutable; `strict=True` disables coercion (string `"42"` is not `int 42`).

## Notes

- Pytest test-side strict config (xfail-strict, no-skip-without-reason) defers to `pytest-code-review` skill.
- FastAPI request/response specifics (Annotated dependencies, response_model_exclude_unset) defer to `fastapi-code-review`.
- SQLAlchemy session strictness (autoflush=False, expire_on_commit=False) defers to `sqlalchemy-code-review`.
