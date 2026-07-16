# To resume

A cold session finds the active handoff by recency, not by knowing the slug:

```bash
root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
eza -1 -s modified -r "$root"/.outline/handoffs/*.md 2>/dev/null | head -1   # newest by mtime; read it
```
