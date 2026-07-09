# Operational Controls

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
}));

// Stricter limit for auth endpoints
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,  // 10 attempts per 15 minutes
}));
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# General API rate limit
@app.get("/api/resource")
@limiter.limit("100/15minutes")
async def resource(request: Request):
    ...

# Stricter limit for auth endpoints
@app.post("/api/auth/login")
@limiter.limit("10/15minutes")
async def login(request: Request):
    ...
```

Always apply a tighter limit to authentication endpoints than to general traffic.

## Secrets Management

```
.env files:
  ├── .env.example  → committed (template with placeholder values)
  ├── .env          → NOT committed (contains real secrets)
  └── .env.local    → NOT committed (local overrides)

.gitignore must include:
  .env
  .env.local
  .env.*.local
  *.pem
  *.key
```

**Always check before committing:**
```bash
# Catch accidentally staged secrets
git diff --cached | grep -i "password\|secret\|api_key\|token"
```

**If a secret is ever committed, rotate it.** Deleting the line or rewriting history is not enough. Assume it is compromised the moment it reaches a remote. Revoke and reissue the key first, then purge it from history.
