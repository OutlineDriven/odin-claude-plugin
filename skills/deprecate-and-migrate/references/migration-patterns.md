# Migration Patterns

## Strangler Pattern

Run old and new in parallel. Route traffic incrementally from old to new. When the old system handles 0% of traffic, remove it.

```
Phase 1: New system handles 0%, old handles 100%
Phase 2: New system handles 10% (canary)
Phase 3: New system handles 50%
Phase 4: New system handles 100%, old system idle
Phase 5: Remove old system
```

## Adapter Pattern

Wrap the new implementation behind the old interface. Consumers keep calling the old API while the backend moves to the replacement.

```typescript
// Old interface, new implementation underneath
class LegacyTaskService implements OldTaskAPI {
  constructor(private readonly next: NewTaskService) {}

  getTask(id: number): OldTask {
    return this.toOldFormat(this.next.findById(String(id)));
  }
}
```

```python
# Old interface, new implementation underneath
class LegacyTaskService(OldTaskAPI):
    def __init__(self, nxt: NewTaskService) -> None:
        self._next = nxt

    def get_task(self, task_id: int) -> OldTask:
        return to_old_format(self._next.find_by_id(str(task_id)))
```

## Feature Flag Migration

Flip consumers from old to new one cohort at a time, gated by a flag.

```go
func TaskServiceFor(userID string) TaskService {
    if flags.Enabled("new-task-service", userID) {
        return NewTaskService()
    }
    return LegacyTaskService()
}
```

```typescript
function taskServiceFor(userId: string): TaskService {
  return flags.isEnabled("new-task-service", { userId })
    ? new NewTaskService()
    : new LegacyTaskService();
}
```
