# Input Validation Patterns

## Schema Validation at Boundaries

```typescript
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
});

app.post('/api/tasks', async (req, res) => {
  const result = CreateTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.flatten() },
    });
  }
  const task = await taskService.create(result.data);  // typed and validated
  return res.status(201).json(task);
});
```

```python
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ValidationError

class CreateTask(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: Optional[datetime] = None

@app.post("/api/tasks", status_code=201)
async def create_task(raw: dict):
    try:
        data = CreateTask.model_validate(raw)  # typed and validated
    except ValidationError as e:
        raise HTTPException(422, detail={"code": "VALIDATION_ERROR", "details": e.errors()})
    return await task_service.create(data)
```

Validate at the boundary with an allowlist schema; reject anything that does not parse.

## File Upload Safety

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file: UploadedFile) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ValidationError('File type not allowed');
  }
  if (file.size > MAX_SIZE) {
    throw new ValidationError('File too large (max 5MB)');
  }
  // Don't trust the file extension — check magic bytes if critical
}
```

```python
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB

def validate_upload(file):
    if file.content_type not in ALLOWED_TYPES:
        raise ValidationError("File type not allowed")
    if file.size > MAX_SIZE:
        raise ValidationError("File too large (max 5MB)")
    # Don't trust the file extension — check magic bytes if critical
```
