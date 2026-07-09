# OWASP Top 10 Prevention Patterns

These are prevention patterns, not a ranking. `references/security-checklist.md` holds the 2021 ordering as a quick-reference table, along with the detailed security checklists and pre-commit verification steps. Examples appear in two language families; the mitigation is the same across stacks.

## Injection (SQL, NoSQL, OS Command)

```typescript
// BAD: SQL injection via string concatenation
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// GOOD: parameterized query
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// GOOD: ORM with parameterized input
const user = await prisma.user.findUnique({ where: { id: userId } });
```

```python
# BAD: SQL injection via string formatting
cur.execute(f"SELECT * FROM users WHERE id = '{user_id}'")

# GOOD: parameterized query (driver binds the value)
cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))

# GOOD: ORM with parameterized input
user = session.query(User).filter(User.id == user_id).one_or_none()
```

The same rule holds for OS commands: pass an argument vector (`execFile`, `subprocess.run([...])`), never a shell string built from input.

## Broken Authentication

```typescript
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 12;
const hashedPassword = await hash(plaintext, SALT_ROUNDS);
const isValid = await compare(plaintext, hashedPassword);

// Session cookie flags
app.use(session({
  secret: process.env.SESSION_SECRET,  // from environment, not code
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,     // not readable by JavaScript
    secure: true,       // HTTPS only
    sameSite: 'lax',    // CSRF protection
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  },
}));
```

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()
hashed_password = ph.hash(plaintext)
try:
    ph.verify(hashed_password, plaintext)
    is_valid = True
except VerifyMismatchError:
    is_valid = False

# Session cookie flags (framework-agnostic)
SESSION_COOKIE = dict(
    httponly=True,   # not readable by JavaScript
    secure=True,     # HTTPS only
    samesite="Lax",  # CSRF protection
    max_age=24 * 60 * 60,
)
```

The secret comes from the environment in both cases; never hard-code it.

## Cross-Site Scripting (XSS)

```typescript
// BAD: rendering user input as HTML
element.innerHTML = userInput;

// GOOD: framework auto-escaping (React escapes by default)
return <div>{userInput}</div>;

// If you MUST render HTML, sanitize first
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

```python
# BAD: concatenating input into markup (autoescape bypassed)
return render_template_string("<div>" + user_input + "</div>")

# GOOD: template autoescaping (Jinja2 escapes {{ ... }} by default)
return render_template("page.html", body=user_input)

# If you MUST allow HTML, sanitize first
import bleach
clean = bleach.clean(user_input)
```

The bypass paths (`innerHTML`, `|safe`, `mark_safe`, `render_template_string` with concatenation) are where XSS enters.

## Broken Access Control

Check authorization, not just authentication. Verify the caller owns the resource.

```typescript
app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  const task = await taskService.findById(req.params.id);

  if (task.ownerId !== req.user.id) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Not authorized to modify this task' }
    });
  }

  const updated = await taskService.update(req.params.id, req.body);
  return res.json(updated);
});
```

```python
@app.patch("/api/tasks/{task_id}")
async def update_task(task_id: str, body: TaskUpdate, user=Depends(authenticate)):
    task = await task_service.find_by_id(task_id)

    if task.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this task")

    return await task_service.update(task_id, body)
```

Missing ownership checks are IDOR: authenticated, but acting on another user's row.

## Security Misconfiguration

```typescript
import helmet from 'helmet';
app.use(helmet());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],  // tighten if possible
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
```

```python
from fastapi.middleware.cors import CORSMiddleware

SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'self'; script-src 'self'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
}

@app.middleware("http")
async def set_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.update(SECURITY_HEADERS)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
)
```

CORS is an allowlist of known origins. Never reflect arbitrary origins and never pair `*` with credentials.

## Sensitive Data Exposure

```typescript
// Strip sensitive fields from API responses
function sanitizeUser(user: UserRecord): PublicUser {
  const { passwordHash, resetToken, ...publicFields } = user;
  return publicFields;
}

const API_KEY = process.env.STRIPE_API_KEY;
if (!API_KEY) throw new Error('STRIPE_API_KEY not configured');
```

```python
from pydantic import BaseModel

# Response model defines exactly which fields leave the boundary
class PublicUser(BaseModel):
    id: str
    email: str
    # passwordHash / reset_token are absent, so they cannot be serialized

API_KEY = os.environ.get("STRIPE_API_KEY")
if not API_KEY:
    raise RuntimeError("STRIPE_API_KEY not configured")
```

Default to an explicit allowlist of returned fields rather than denylisting secrets one by one.

## Server-Side Request Forgery (SSRF)

Any time the server fetches a URL the user influenced (webhooks, "import from URL", image proxies, link previews), an attacker can aim it at internal services (cloud metadata, `localhost`, private IPs).

```typescript
// BAD: fetch whatever the user gives you
await fetch(req.body.webhookUrl);

// GOOD: allowlist scheme + host, reject if ANY resolved IP is private, forbid redirects
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

const ALLOWED_HOSTS = new Set(['hooks.example.com']);

async function assertSafeUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('https only');
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error('host not allowed');
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.some((a) => ipaddr.parse(a.address).range() !== 'unicast')) {
    throw new Error('private/reserved IP');
  }
  return url;
}

await fetch(await assertSafeUrl(req.body.webhookUrl), { redirect: 'error' });
```

```python
# GOOD: allowlist scheme + host, reject if ANY resolved IP is non-global
import ipaddress, socket
from urllib.parse import urlparse

ALLOWED_HOSTS = {"hooks.example.com"}

def assert_safe_url(raw: str) -> str:
    url = urlparse(raw)
    if url.scheme != "https":
        raise ValueError("https only")
    if url.hostname not in ALLOWED_HOSTS:
        raise ValueError("host not allowed")
    for *_, sockaddr in socket.getaddrinfo(url.hostname, 443):
        if not ipaddress.ip_address(sockaddr[0]).is_global:
            raise ValueError("private/reserved IP")
    return raw
```

The non-unicast / non-global check covers loopback, link-local `169.254.169.254` (cloud metadata, the #1 SSRF target), private, and unique-local ranges across IPv4 and IPv6.

**Caveat: this still has a TOCTOU gap.** The HTTP client resolves DNS again after the check, so an attacker using a short-TTL record can rebind to an internal IP between validation and connection. For high-risk surfaces, resolve once and connect to the pinned IP, or put a request-filtering proxy in front of all outbound fetches.
