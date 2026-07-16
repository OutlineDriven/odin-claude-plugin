```typescript
// TypeScript
const ENABLE_TASK_SHARING = process.env.FEATURE_TASK_SHARING === 'true';

if (ENABLE_TASK_SHARING) {
  // work-in-progress sharing UI
}
```

```python
# Python
import os

ENABLE_TASK_SHARING = os.environ.get("FEATURE_TASK_SHARING") == "true"

if ENABLE_TASK_SHARING:
    ...  # work-in-progress sharing path
```

This merges small increments to the main branch without exposing incomplete work.
