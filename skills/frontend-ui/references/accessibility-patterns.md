# Accessibility Patterns

## Keyboard Navigation

The native element is focusable and operable in any stack:

```html
<button>Click me</button>          <!-- focusable + keyboard-activatable by default -->
<div onclick="handleClick()">Click me</div>   <!-- NOT focusable; avoid -->
```

When a custom widget is unavoidable, restore the keyboard contract. Add `tabindex`, a role, and the Enter/Space handling the native control gives for free:

```tsx
// React
<div role="button" tabIndex={0} onClick={handleClick}
     onKeyDown={e => {
       if (e.key === 'Enter') handleClick();
       if (e.key === ' ') e.preventDefault();
     }}
     onKeyUp={e => {
       if (e.key === ' ') handleClick();
     }}>
  Click me
</div>
```

```html
<!-- Server-rendered / progressive enhancement (vanilla JS) -->
<div role="button" tabindex="0" id="action">Click me</div>
<script>
  const el = document.getElementById('action');
  el.addEventListener('click', handleClick);
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleClick();
    if (e.key === ' ') e.preventDefault();
  });
  el.addEventListener('keyup', e => { if (e.key === ' ') handleClick(); });
</script>
```

## ARIA Labels

Label every interactive element that lacks visible text. The markup is stack-neutral (React uses `htmlFor` where plain HTML uses `for`):

```html
<!-- Icon-only control needs an accessible name -->
<button aria-label="Close dialog"><!-- X icon --></button>

<!-- Associate a label with its input -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Or label inline when no visible label exists -->
<input aria-label="Search tasks" type="search" />
```

## Focus Management

Move focus when content appears, and trap it inside modal surfaces until they close:

```tsx
// React
function Dialog({ isOpen, onClose }: DialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Trap focus inside the dialog while open
  return (
    <dialog open={isOpen}>
      <button ref={closeRef} onClick={onClose}>Close</button>
      {/* dialog content */}
    </dialog>
  );
}
```

```html
<!-- Server-rendered / vanilla JS: move focus when the dialog opens -->
<dialog id="confirm">
  <button id="confirm-close">Close</button>
  <!-- dialog content -->
</dialog>
<script>
  function openDialog() {
    const dialog = document.getElementById('confirm');
    dialog.showModal();                                  // native modal traps focus
    document.getElementById('confirm-close').focus();    // move focus in
  }
</script>
```

## Meaningful Empty and Error States

Never render a blank screen. Give the empty state a purpose and a next action:

```tsx
// React
function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div role="status" className="text-center py-12">
        <TasksEmptyIcon className="mx-auto h-12 w-12 text-muted" />
        <h3 className="mt-2 text-sm font-medium">No tasks</h3>
        <p className="mt-1 text-sm text-muted">Get started by creating a new task.</p>
        <Button className="mt-4" onClick={onCreateTask}>Create Task</Button>
      </div>
    );
  }

  return <ul role="list">...</ul>;
}
```

```django
{# Django — empty_state.html rendered when the view finds no tasks #}
<div role="status" class="text-center py-12">
  {% include "icons/tasks_empty.svg" %}
  <h3 class="mt-2 text-sm font-medium">No tasks</h3>
  <p class="mt-1 text-sm text-muted">Get started by creating a new task.</p>
  <a href="{% url 'task_create' %}" class="btn mt-4">Create Task</a>
</div>
```
