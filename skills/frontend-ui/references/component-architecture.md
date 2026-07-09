# Component Architecture

## File Structure

Colocate everything that changes together with the component. The principle is stack-independent:

```
# JavaScript component framework (React)
src/components/TaskList/
  TaskList.tsx          # Component implementation
  TaskList.test.tsx     # Tests
  TaskList.stories.tsx  # Stories (if using a component workbench)
  use-task-list.ts      # Custom hook (when state is non-trivial)
  types.ts              # Component-local types
```

```
# Server-rendered templates (Django)
app/components/task_list/
  task_list.html        # Template — presentation
  task_list.py          # View / component logic
  task_list_test.py     # Tests
  task_list.css         # Component-local styles
```

## Component Patterns

**Prefer composition over configuration.** Expose regions as slots/children, not a wall of props.

```tsx
// React — composable
<Card>
  <CardHeader>
    <CardTitle>Tasks</CardTitle>
  </CardHeader>
  <CardBody>
    <TaskList tasks={tasks} />
  </CardBody>
</Card>

// React — over-configured (avoid)
<Card
  title="Tasks"
  headerVariant="large"
  bodyPadding="md"
  content={<TaskList tasks={tasks} />}
/>
```

```django
{# Django — composable: a card shell that yields named regions #}
{% component "card" %}
  {% fill "header" %}<h2 class="card-title">Tasks</h2>{% endfill %}
  {% fill "body" %}{% include "task_list.html" with tasks=tasks %}{% endfill %}
{% endcomponent %}

{# Django — over-configured (avoid) #}
{% component "card" title="Tasks" header_variant="large" body_padding="md" content=task_list %}
```

**Keep components focused.** One responsibility per component.

```tsx
// React — renders a single task row, nothing else
export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 p-3">
      <Checkbox checked={task.done} onChange={() => onToggle(task.id)} />
      <span className={task.done ? 'line-through text-muted' : ''}>{task.title}</span>
      <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
        <TrashIcon />
      </Button>
    </li>
  );
}
```

```django
{# Django — task_item.html: renders a single task row, nothing else #}
<li class="task-item">
  <input type="checkbox" name="toggle" value="{{ task.id }}"
         {% if task.done %}checked{% endif %}
         aria-label="Complete: {{ task.title }}">
  <span class="{% if task.done %}done{% endif %}">{{ task.title }}</span>
  <button type="submit" name="delete" value="{{ task.id }}"
          class="btn-ghost" aria-label="Delete task">
    {% include "icons/trash.svg" %}
  </button>
</li>
```

**Separate data fetching from presentation.** The data owner picks the state to render (loading, error, empty, populated); the presentation component only renders.

```tsx
// React — container owns data
export function TaskListContainer() {
  const { tasks, isLoading, error, refetch } = useTasks();

  if (isLoading) return <TaskListSkeleton />;
  if (error) return <ErrorState message="Failed to load tasks" retry={refetch} />;
  if (tasks.length === 0) return <EmptyState message="No tasks yet" />;

  return <TaskList tasks={tasks} />;
}

// React — presentation owns rendering
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul role="list" className="divide-y">
      {tasks.map(task => <TaskItem key={task.id} task={task} />)}
    </ul>
  );
}
```

```python
# Django — the view owns data and chooses which state to render (MVT)
def task_list(request):
    try:
        tasks = Task.objects.for_user(request.user)
    except DataError:
        return render(request, "errors/load_failed.html",
                      {"retry_url": request.path}, status=503)
    template = "task_list.html" if tasks else "empty_state.html"
    return render(request, template, {"tasks": tasks})
```

```django
{# Django — task_list.html owns rendering only #}
<ul role="list" class="divide-y">
  {% for task in tasks %}{% include "task_item.html" with task=task %}{% endfor %}
</ul>
```
