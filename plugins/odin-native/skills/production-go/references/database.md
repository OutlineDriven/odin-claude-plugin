# Database Access Patterns

`database/sql` is a *pool* with a thin conversion layer, not a driver: tune the pool, always pass `ctx`, and remember the conversion machinery (`Scan`, `driver.Valuer`/`Scanner`) is where NULLs and custom types bite. For PostgreSQL, **pgx v5** is the default, but pick its native, single-conn, or `database/sql`-adapter mode deliberately, because their semantics differ (notably ctx-cancel rollback). The library you pick matters less than pool discipline + transaction discipline.

> Source horizon: verified against Go **1.26.4** (stable, GA 2026-02-10) + **1.27 RC** draft notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md) and the 1.27 rows were checked against the final notes. Ecosystem pins (as of 2026-06): pgx **v5.10.0**, sqlc **v1.31.1**, golang-migrate **v4.19.1**, goose **v3.27.x**, Atlas CLI **v1.2.0**. Version tags `[1.N]` mark the Go release a claim applies to. Triangulated from two deep-research reports + go.dev/pkg.go.dev.

## TL;DR: the modern deltas (read first)

- `sql.Null[T]` [1.22] retires the `sql.NullString`/`NullInt64`/… zoo for scanning nullable columns. Caveat (open issues #69728/#69837): `Null[T].Value()` does **not** detect a `T` that implements `driver.Valuer`, and it accepts `T` incompatible with `driver.Value`, deferring failure to runtime. Use it for *primitive* `T`, implement `Scanner`/`Valuer` for custom types.
- `database/sql` is otherwise frozen through 1.26. The only API additions land in **1.27**: `sql.ConvertAssign` (exposes `Rows.Scan`'s conversion to drivers) and `driver.RowsColumnScanner` (drivers scan straight into user destinations). Driver-author surface; most app code is unaffected. Confirmed in the final 1.27 release notes.
- `SetMaxIdleConns` defaults to 2; `SetMaxOpenConns` defaults to 0 (unlimited). The classic production bug is raising `MaxOpen` and leaving idle at 2 → constant connection churn + `TIME_WAIT` pileup. Set `MaxIdle == MaxOpen` for steady load.
- pgx ≠ database/sql on context-cancel rollback. In `database/sql`, canceling the `ctx` passed to `BeginTx` auto-rolls-back the tx. In pgx, *"the context only affects the begin command"*; no auto-rollback. Code ported from `database/sql` that relies on it is silently wrong on pgx.
- pgx v5 renamed the pool constructors. `pgxpool.Connect`/`ConnectConfig` are **v4** (removed); v5 is `pgxpool.New`/`NewWithConfig`. The #1 staleness trap in generated pgx code.
- pgx auto-prepares & caches statements: manual `Prepare` is rarely needed and *breaks under PgBouncer transaction/statement pooling* unless you switch exec mode.
- `sql.Open`/`pgxpool.New` do not connect. Lazy; first I/O is the first query. `Ping`/`Acquire` at startup to fail fast.

## Table of Contents
1. [Driver Selection](#drivers)
2. [database/sql context APIs & lifecycle](#context-apis)
3. [pgx v5 native API & modes](#pgx-native)
4. [Connection Pool Configuration](#connection-pool)
5. [Query Patterns](#queries)
6. [NULL handling & driver.Valuer/Scanner](#nulls)
7. [Prepared statements & the implicit-prepare trap](#prepared-statements)
8. [Transactions](#transactions)
9. [Batching & bulk insert (CopyFrom/Batch)](#batching)
10. [Retry on serialization/deadlock](#retry)
11. [Migrations](#migrations)
12. [sqlc: Type-Safe SQL](#sqlc)
13. [Redis (go-redis/v9)](#redis)
14. [MongoDB](#mongodb)
15. [Repository Pattern](#repository)
16. [Anti-Patterns](#anti-patterns)
17. [Library landscape & status](#libraries)
18. [Version map 1.20→1.27](#versions)
19. [What models get wrong](#stale)

---

## Driver Selection {#drivers}

| Use Case | Recommended | Why |
|----------|------------|-----|
| PostgreSQL (default) | `jackc/pgx/v5` (native `pgxpool`) | Binary protocol, native types, `COPY`, `LISTEN/NOTIFY`, batch, own pool |
| PostgreSQL behind `database/sql` | `pgx/v5/stdlib` adapter | ORM / multi-DB / existing libs need `*sql.DB`; lose direct COPY/batch ergonomics |
| Conservative PG `database/sql`-only | `lib/pq` | Maintenance-mode (see note); only for existing code with no pgx-native needs |
| Any SQL DB (generic) | `database/sql` + driver | stdlib interface, driver-agnostic |
| MySQL | `go-sql-driver/mysql` | Standard |
| SQLite (CGO-free) | `modernc.org/sqlite`; CGO: `mattn/go-sqlite3` | Pick by CGO appetite |
| Query building + struct scan | `jmoiron/sqlx` | Named params, `StructScan` over `database/sql` |
| Type-safe from SQL | `sqlc` | Compiles SQL → Go structs + methods, no runtime reflection |
| ORM | `gorm.io/gorm`, `ent` | Only if team has chosen one; understand the query-cost/N+1 tradeoffs |
| Schema migration | `goose` / `golang-migrate` / `atlas` | See [Migrations](#migrations) |

On `lib/pq`: it is **not** dead, still tagged (v1.12.x, 2026) and documents PG-specific COPY/LISTEN. The two source reports conflict on whether it is "officially deprecated"; an official deprecation banner could **not** be corroborated. Defensible synthesis: lib/pq is in **maintenance mode** (no new feature work), pgx is the recommended default for new PG code, but "lib/pq is gone/unusable" is overstated. One persistent lib/pq fact: PostgreSQL does **not** support `sql.Result.LastInsertId()`; use `INSERT … RETURNING`.

---

## database/sql context APIs & lifecycle {#context-apis}

**The context-bearing methods are the only correct ones for server code.** Non-context variants (`Query`, `Exec`, `Begin`, `Prepare`, `Ping`) run with `context.Background()` and cannot be cancelled or timed out. A slow query pins a pool connection indefinitely. Stable since [1.8]; models still emit the bare forms.

| Use | Method |
|---|---|
| Multi-row | `db.QueryContext(ctx, q, args…)` |
| Single row | `db.QueryRowContext(ctx, q, args…)` |
| Exec (no rows) | `db.ExecContext(ctx, q, args…)` |
| Prepared | `db.PrepareContext(ctx, q)` → `stmt.ExecContext/QueryContext` |
| Transaction | `db.BeginTx(ctx, *sql.TxOptions)` |
| Pin a conn (session-scoped) | `db.Conn(ctx)` → `*sql.Conn` |
| Liveness | `db.PingContext(ctx)` |

```go
// RIGHT — cancellation + deadline flow from the call site
ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
defer cancel()
row := db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", id)
```
```go
// WRONG — uncancellable; the query runs to completion even after the client disconnects
row := db.QueryRow("SELECT name FROM users WHERE id = $1", id)
```

**`ctx` is only as good as the driver.** The package docs warn that drivers without context-cancellation support **will not return until the query completes**, passing a `ctx` is necessary but not sufficient; the driver is part of the cancellation story.

Lifecycle facts models get wrong:
- `sql.Open` does **not** connect; it validates args and returns lazily; first real I/O is the first query. `db.PingContext(ctx)` at startup to fail fast.
- `*sql.DB` **is a pool**, safe for concurrent use. Open it **once** per database and share it. Opening one per request/handler is the single most common production DB bug.
- `sql.OpenDB(connector)` is the modern constructor when you hold a `driver.Connector` (inject config/credentials without a DSN string).

---

## pgx v5 native API & modes {#pgx-native}

pgx offers **three** modes: models conflate them:

1. Native pool `pgx/v5/pgxpool`: fastest; binary protocol; PG-only features (`COPY`, `LISTEN/NOTIFY`, batch). Default when the app targets only PostgreSQL.
2. Native single conn `pgx.Connect` → `*pgx.Conn`: **not** concurrency-safe; one-shot tools/migrations only.
3. `database/sql` adapter `pgx/v5/stdlib`: `sql.Open("pgx", dsn)`. Use when a layer needs `*sql.DB`; you lose direct `CopyFrom`/`LISTEN`/batch (reach them via `conn.Raw`). Uses `$1` positional params; **does not** support named params.

```go
// Bridge both directions:
db := stdlib.OpenDBFromPool(pool)          // *sql.DB backed by a *pgxpool.Pool — one pool, both call styles
// reach a pgx-native op from database/sql:
conn, _ := db.Conn(ctx); defer conn.Close()
_ = conn.Raw(func(dc any) error {
    return dc.(*stdlib.Conn).Conn().CopyFrom(ctx, pgx.Identifier{"users"}, []string{"email"}, src) == nil
})
```

Generic row collectors: prefer these over hand-rolled loops:
```go
rows, _ := pool.Query(ctx, "SELECT id, name FROM users WHERE active = $1", true)
users, err := pgx.CollectRows(rows, pgx.RowToStructByName[User])     // []User; closes rows, checks rows.Err()
// pgx.CollectOneRow(...)            — exactly the first row
// pgx.CollectExactlyOneRow(...)     — errors on 0 or >1 (v5.5+)
```
`RowToStructByName` matches columns to exported fields case-insensitively; override with `db:"col"`, ignore with `db:"-"`. `RowToStructByNameLax` (v5.4+) allows the struct to have *more* fields than the row. PG arrays (incl. `array_agg`) scan straight into Go slices.

Errors: `pgx.ErrNoRows` wraps `sql.ErrNoRows`, so **both** match. For PG SQLSTATE codes, type-assert `*pgconn.PgError` and compare `.Code` against `pgerrcode` constants; never string-match.
```go
if errors.Is(err, pgx.ErrNoRows) { return ErrNotFound }        // == errors.Is(err, sql.ErrNoRows)
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) && pgErr.Code == pgerrcode.UniqueViolation { return ErrDuplicate }
```

---

## Connection Pool Configuration {#connection-pool}

### database/sql knobs and their **defaults** (the defaults are the footgun)

| Method | Default | Guidance |
|---|---|---|
| `SetMaxOpenConns(n)` | **0 = unlimited** | Always cap. Must be ≤ server `max_connections` **summed across all app instances** (+ migrations + admin headroom). |
| `SetMaxIdleConns(n)` | **2** | High `MaxOpen` + idle 2 ⇒ open/close churn + `TIME_WAIT` flood. Set `MaxIdle == MaxOpen` for steady load. |
| `SetConnMaxLifetime(d)` | 0 = forever | ~30m-1h. Forces rebalancing behind load balancers; sheds connections to backends being drained / after failover. |
| `SetConnMaxIdleTime(d)` | 0 = never [1.15] | Releases idle bursts when quiet. Set *both* lifetime and idle-time (ordering once bit users, #45993). |

```go
// RIGHT — OLTP service-instance baseline
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(25)                 // match MaxOpen → no churn
db.SetConnMaxLifetime(30 * time.Minute)
db.SetConnMaxIdleTime(5 * time.Minute)

s := db.Stats()                        // the ONLY built-in pool observability
slog.Info("dbpool", "open", s.OpenConnections, "inuse", s.InUse, "idle", s.Idle,
    "wait_count", s.WaitCount, "wait_dur", s.WaitDuration)
```
```go
// WRONG — unbounded fan-out; one spike → "FATAL: sorry, too many clients already"
db.SetMaxOpenConns(0)                  // and leaving MaxIdle at 2 = churn under load
```

`DBStats` signals: `WaitCount`/`WaitDuration` rising = app demand exceeds `MaxOpenConns` (raise it or add a pooler). `MaxIdleClosed`/`MaxIdleTimeClosed`/`MaxLifetimeClosed` rising = your lifetime/idle settings are churning connections.

### pgxpool knobs (different names, not 1:1)

```go
cfg, _ := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
cfg.MaxConns = 25                      // default = max(4, GOMAXPROCS)
cfg.MinConns = 2                       // warm floor — avoids cold-start latency
cfg.MaxConnLifetime = time.Hour
cfg.MaxConnLifetimeJitter = 5 * time.Minute   // de-synchronize recycling → no thundering herd
cfg.MaxConnIdleTime = 30 * time.Minute
cfg.HealthCheckPeriod = time.Minute
cfg.AfterConnect = func(ctx context.Context, c *pgx.Conn) error { return nil } // register enums/custom types HERE
pool, err := pgxpool.NewWithConfig(ctx, cfg)
if err != nil { return err }
defer pool.Close()
if err := pool.Ping(ctx); err != nil { pool.Close(); return err }   // New() did NOT connect
```
`pool.Stat()` → `AcquireCount`, `AcquiredConns`, `IdleConns`, `EmptyAcquireCount` (acquires that had to wait: saturation), `CanceledAcquireCount`. Export these.

Sizing: start near `(cores*2) + effective_spindles` per instance; for cloud OLTP a *small* pool (10-25) usually beats a large one (more conns ≠ more throughput: lock/context-switch thrash, ~5-10 MB PG memory per conn). Keep `Σ(instances × pool)` under the server cap. Add **PgBouncer** (transaction mode) when instance count outgrows the cap, then shrink client pools and disable prepared statements (below). Pair with PG guards: `statement_timeout`, `idle_in_transaction_session_timeout`, a distinct `application_name` (find hogs in `pg_stat_activity`).

Rules: always `pool.Close()`/`db.Close()` on shutdown; set `ConnMaxLifetime`/`MaxConnLifetime` so a DB failover can't hand you a permanently-stale conn.

---

## Query Patterns {#queries}

```go
// Parameterized only — string concatenation is a SQL-injection hole (see security.md#sql-injection)
rows, err := pool.Query(ctx,
    "SELECT id, name FROM users WHERE active = $1 ORDER BY name LIMIT $2", true, 100)
if err != nil { return nil, fmt.Errorf("querying users: %w", err) }
defer rows.Close()                     // unclosed rows pin a pool connection

var users []User
for rows.Next() {
    var u User
    if err := rows.Scan(&u.ID, &u.Name); err != nil {   // never ignore Scan's error
        return nil, fmt.Errorf("scanning user: %w", err)
    }
    users = append(users, u)
}
if err := rows.Err(); err != nil {     // iteration can fail AFTER the last Next() — must check
    return nil, fmt.Errorf("iterating users: %w", err)
}
```
```go
// WRONG — three bugs at once
for rows.Next() {
    var u User
    rows.Scan(&u.ID, &u.Name)          // 1) error ignored
    out = append(out, u)
}                                       // 2) no defer rows.Close() → leaked conn
                                        // 3) no rows.Err() → silent partial result
```

`QueryRow`/`Scan` pitfalls: `QueryRow(Context)` never returns an error itself; the error (incl. `ErrNoRows`) surfaces from `Scan`. Always check `Scan`'s error and branch on `ErrNoRows`. `Scan` arg count/order must match the `SELECT` columns exactly; a NULL into a non-pointer/non-`Null[T]` target is a runtime error ("converting NULL to string is unsupported"; see [NULL handling](#nulls)).

```go
var id int64
err := db.QueryRowContext(ctx,
    "INSERT INTO authors(name, bio) VALUES ($1,$2) RETURNING id", name, bio).Scan(&id)
// PG: use RETURNING, NOT res.LastInsertId() (unsupported on PostgreSQL)
```

---

## NULL handling & driver.Valuer/Scanner {#nulls}

Four strategies, by intent:

```go
// 1. sql.Null[T]  [1.22] — stdlib default; explicit validity
var bio sql.Null[string]
row.Scan(&bio); if bio.Valid { use(bio.V) }

// 2. Pointer *T — nil ⇔ SQL NULL; ergonomic in structs/JSON
var bio *string                        // 1.26: new("x") accepts an expr → *string without a helper
row.Scan(&bio)

// 3. COALESCE in SQL — collapse NULL→zero when the distinction is irrelevant (LOSES NULL-vs-empty)
//    SELECT COALESCE(bio, '') FROM users   → scan into a plain string

// 4. pgx native — pgtype (when on pgxpool directly)
var bio pgtype.Text                    // {String string; Valid bool}; v5 dropped v4's tri-state Status
row.Scan(&bio); if bio.Valid { use(bio.String) }
```
```go
// WRONG — NULL into a non-pointer, non-Null target → runtime error
var bio string
row.Scan(&bio)                         // "converting NULL to string is unsupported"
```

Decision: JSON/structs → `*T`; explicit validity → `sql.Null[T]` (stdlib) or `pgtype.*` (pgx); zero-value-OK → `COALESCE`. Don't mix pointers and `Null*` arbitrarily in one model. "Just use `*string` for all nullables" is too glib. Pointers lose the type's `Scanner`/`Valuer` if you needed custom semantics.

Custom types: implement `driver.Valuer` (write) + `sql.Scanner` (read).
```go
type Money int64 // cents

func (m Money) Value() (driver.Value, error) { return int64(m), nil }   // Go → DB; must return a driver.Value (int64/float64/bool/[]byte/string/time.Time)
func (m *Money) Scan(src any) error {                                    // DB → Go; src is one of those same types or nil
    switch v := src.(type) {
    case int64: *m = Money(v); return nil
    case nil:   *m = 0; return nil          // decide your NULL policy
    default:    return fmt.Errorf("Money.Scan: unsupported %T", src)
    }
}
```
`Valuer` runs in the driver, so it also closes the injection surface for custom types. `sql.Null[T]` does **not** invoke a `T`'s own `Valuer` (#69728). Wrap such a `T` in your own `Scanner`/`Valuer`, not `Null[T]`.

---

## Prepared statements & the implicit-prepare trap {#prepared-statements}

`database/sql` **implicitly prepares** every parameterized query: prepare → exec → close, three round-trips, and the prepared statement is bound to **one** pooled connection. Under load across many connections this re-prepares per connection. Explicit `db.PrepareContext` returns a `*sql.Stmt` that the pool re-prepares on whatever connection it lands on and **must be `Close`d**. A leaked `*sql.Stmt` leaks server-side statements.

```go
stmt, err := db.PrepareContext(ctx, "SELECT name FROM users WHERE id = $1")
if err != nil { return err }
defer stmt.Close()                     // REQUIRED — else server-side statement leak
for _, id := range ids {
    var name string
    if err := stmt.QueryRowContext(ctx, id).Scan(&name); err != nil { return err }
}
```

**pgx auto-prepares and caches by default** (statement cache keyed per connection), so manual `Prepare` is rarely needed and can *fight* the cache. The trap: this default extended-protocol prepared-statement caching is **incompatible with PgBouncer transaction/statement pooling**. Fix by switching exec mode:
```go
cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec   // or QueryExecModeSimpleProtocol — no server-side prepared stmts
```
Recent pgx hardening (deterministic prepared-statement names; `CancelRequest` waits for server ack) improves pooler compatibility, but with a transaction pooler you still disable server-side prepares.

---

## Transactions {#transactions}

### database/sql canonical form

```go
tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable}) // pick isolation explicitly when it matters
if err != nil { return err }
defer tx.Rollback()                    // after a successful Commit this returns sql.ErrTxDone — harmless; do NOT check it

if _, err := tx.ExecContext(ctx, "UPDATE accounts SET bal=bal-$1 WHERE id=$2 AND bal>=$1", amt, from); err != nil {
    return err                         // deferred Rollback fires
}
if _, err := tx.ExecContext(ctx, "UPDATE accounts SET bal=bal+$1 WHERE id=$2", amt, to); err != nil {
    return err
}
return tx.Commit()
```
- The `ctx` passed to `BeginTx` governs the **whole** transaction: **if `ctx` is canceled, `database/sql` rolls the tx back automatically.**
- Ignoring the deferred `Rollback`'s return is correct and idiomatic.
- Always scope a tx with a `ctx` timeout; an open tx holds locks, pins a connection, and blocks autovacuum.

```go
// WRONG — no defer; any early return/panic between Begin and Commit leaks an open tx
tx, _ := db.BeginTx(ctx, nil)
tx.ExecContext(ctx, "...")             // early return here → tx never closed → locks held, conn pinned
tx.Commit()
```

### pgx canonical form and the cancellation gotcha

```go
// Preferred: closure form auto-commits on nil, auto-rolls back on error/panic
err := pgx.BeginFunc(ctx, pool, func(tx pgx.Tx) error {
    if _, err := tx.Exec(ctx, "INSERT INTO ledger(...) VALUES (...)"); err != nil { return err }
    return nil
})
// Manual: tx, _ := pool.Begin(ctx); defer tx.Rollback(ctx); …; return tx.Commit(ctx)
```

> **Critical difference:** per the pgx docs, *"Unlike database/sql, the context only affects the begin command. i.e. there is no auto-rollback on context cancellation."* With pgx you **must** rely on `defer tx.Rollback(ctx)` (or `BeginFunc`). `database/sql` code assuming auto-rollback-on-cancel is subtly wrong when ported to pgx.

Other pgx tx facts: `tx.Begin(ctx)` on an existing tx creates a **savepoint-based pseudo-nested** transaction. Sentinels: `pgx.ErrTxClosed`, `pgx.ErrTxCommitRollback` (PG turned a `COMMIT` on an already-aborted tx into a `ROLLBACK`). Set isolation via `pgx.TxOptions{IsoLevel: pgx.Serializable}` on `BeginTx`.

---

## Batching & bulk insert (CopyFrom/Batch) {#batching}

```go
// CopyFrom (pgx) — fastest bulk load (PG COPY protocol); beats multi-row INSERT from ~5 rows
n, err := pool.CopyFrom(ctx,
    pgx.Identifier{"users"},                  // schema-qualified: pgx.Identifier{"app","users"}
    []string{"email", "name", "age"},
    pgx.CopyFromRows([][]any{{"a@x", "Ann", int32(30)}, {"b@x", "Bob", int32(41)}}))
```
Sources: `CopyFromRows([][]any)`, `CopyFromSlice(n, fn)` (typed, no `[][]any` conversion), `CopyFromFunc(fn)` (stream without buffering). **Constraints models miss:** COPY uses **binary format**: custom/enum types must be **registered** first (`AfterConnect` + `LoadType`/`RegisterType`) or it fails; **no `ON CONFLICT`, no `RETURNING`**. To upsert/get IDs at scale, COPY into a staging table then `INSERT … SELECT … ON CONFLICT`.

```go
// Batch / SendBatch (pgx) — pipeline many DISTINCT statements in one round trip
b := &pgx.Batch{}
b.Queue("INSERT INTO logs(msg) VALUES ($1)", "a")
b.Queue("UPDATE counters SET n=n+1 WHERE k=$1", "x")
br := pool.SendBatch(ctx, b)
defer br.Close()                              // MANDATORY before reusing the conn (idempotent)
if _, err := br.Exec(); err != nil { return err }   // results consumed in queue order
```
Queued queries run in an **implicit transaction** unless you queue explicit `BEGIN/COMMIT`. Use `Batch` for heterogeneous statements; `CopyFrom` for homogeneous bulk inserts. `lib/pq`'s `CopyIn` (explicit tx + prepared `COPY` + per-row `Exec` + flush) is legacy. Replace with `pgx.CopyFrom`; note lib/pq COPY encodes `[]byte` as `bytea`, breaking `jsonb` unless you pass strings.

---

## Retry on serialization/deadlock {#retry}

`SERIALIZABLE` (and `REPEATABLE READ`) transactions can abort with a serialization failure (`40001`) or deadlock (`40P01`); these are **expected** under contention and the contract is **retry the whole transaction** (a fresh snapshot). Retry *only* these codes; never retry a constraint violation or a canceled ctx.

```go
func serializable(ctx context.Context, db *sql.DB, fn func(*sql.Tx) error) error {
    for attempt := range 5 {                    // [1.22] range-over-int
        tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
        if err != nil { return err }
        if err = fn(tx); err == nil { err = tx.Commit() } else { _ = tx.Rollback() }
        if err == nil { return nil }

        var pg *pgconn.PgError
        if errors.As(err, &pg) && (pg.Code == pgerrcode.SerializationFailure || pg.Code == pgerrcode.DeadlockDetected) {
            select {                            // exp backoff + jitter; honor ctx (see errors-and-resilience.md#retry)
            case <-time.After(time.Duration(rand.Int64N(int64(50<<attempt))) * time.Millisecond):
            case <-ctx.Done(): return ctx.Err()
            }
            continue
        }
        return err                              // non-retryable
    }
    return fmt.Errorf("serializable txn: exhausted retries")
}
```
Keep retried transactions **idempotent** and short. Full backoff/jitter/classification mechanics: [errors-and-resilience.md](errors-and-resilience.md#retry).

---

## Migrations {#migrations}

Decision framework:

| Want | Tool |
|---|---|
| Plain SQL files, Go-embeddable library, **Go-code migrations** allowed | **goose** |
| Language-agnostic CLI, broad DB/source matrix, dead-simple CI, stable/frozen API | **golang-migrate** |
| **Schema-as-code**, auto-diff/plan, 50+ safety analyzers, drift detection, ORM-driven | **Atlas** |
| pgx-only shop wanting a pgx-native tool | **tern** (jackc) or goose |

### goose (v3.27.x)
```go
import ("embed"; "github.com/pressly/goose/v3")
//go:embed migrations/*.sql
var migrationsFS embed.FS

goose.SetBaseFS(migrationsFS)
goose.SetDialect("postgres")
if err := goose.UpContext(ctx, db, "migrations"); err != nil { return err }  // db is *sql.DB
```
```sql
-- +goose Up
-- +goose StatementBegin
CREATE FUNCTION f() RETURNS trigger AS $$ ... $$ LANGUAGE plpgsql;  -- internal ';' → REQUIRES Begin/End
-- +goose StatementEnd
CREATE TABLE users (id bigserial PRIMARY KEY, email text NOT NULL);
-- +goose Down
DROP TABLE users;
```
- **`StatementBegin`/`StatementEnd` is mandatory** around any statement with internal semicolons (PL/pgSQL, triggers, DO blocks); omitting it splits the function and errors (#1 goose mistake).
- Hybrid versioning: timestamps in dev, `goose fix` → sequential before prod (run `fix` in CI). `goose validate` checks files without applying; out-of-order errors unless `-allow-missing`/`WithAllowMissing()`. Provider API adds `WithSessionLocker` (advisory-lock to serialize concurrent migrators), `WithTableName`, etc.

### golang-migrate (v4.19.1)
File pairs `{version}_{name}.up.sql`/`.down.sql`. Ships a **native pgx driver** now (`pgx5://…`). No lib/pq needed. Prefer embedding (`source/iofs`) + an existing `*sql.DB` (`WithInstance`) over shelling out to cwd-relative paths.
```go
d, _ := iofs.New(migrationsFS, "migrations")
drv, _ := postgrespkg.WithInstance(db, &postgrespkg.Config{})
m, _ := migrate.NewWithInstance("iofs", d, "postgres", drv)
if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) { return err }
```
- Dirty-state footgun: a failed migration marks the version **dirty**; further runs refuse until `migrate force <version>` (after manual cleanup). Routinely omitted by models.
- **No per-migration transaction wrapping by default**; wrap multi-statement files in explicit `BEGIN; … COMMIT;`. Down migrations in real repos are often untested; treat as such.

### Atlas (schema-as-code; CLI v1.2.0)
```bash
# Versioned: generate a reviewable migration from the schema diff, then apply in CI
atlas migrate diff add_users --to file://schema.sql --dev-url "docker://postgres/16/dev"
atlas migrate apply --url "$DATABASE_URL" --dir file://migrations
```
- **`--dev-url` is mandatory** for diff/lint/plan; Atlas needs a throwaway "dev database" (often ephemeral Docker PG) to normalize and compute the plan. Models forget it and the command fails.
- `atlas.sum` integrity: apply **aborts** if the migration directory is out of sync with `atlas.sum` or if history mismatches. After a manual edit run `atlas migrate hash` to refresh it; never hand-edit a file and commit without re-hashing. Versioned migrations are roll-forward; linear-history can be enforced.
- 50+ safety analyzers (destructive change, table locks/rewrites, non-nullable-without-default) gate CI. Can `schema inspect` an existing DB to HCL/SQL and emit golang-migrate-format dirs for interop.
- Licensing caveat: default binary under the Atlas EULA (Community build = Apache-2). Declarative `schema apply` by default manages schemas/tables/indexes/constraints; views, functions, triggers, sequences, roles/RLS need **Atlas Pro**.

---

## sqlc: Type-Safe SQL {#sqlc}

Compile-time SQL → typed Go. Parses your **schema + queries**, validates them, generates structs + methods. No runtime reflection, no query strings in app code. **It is static codegen, not a runtime query builder.**

```yaml
# sqlc.yaml (v2)
version: "2"
sql:
  - engine: "postgresql"
    schema: "migrations/"            # DDL or a migrations dir
    queries: "queries/"
    gen:
      go:
        package: "db"
        out: "internal/db"
        sql_package: "pgx/v5"        # "database/sql" (DEFAULT) | "pgx/v4" | "pgx/v5"
        emit_pointers_for_null_types: true   # *T instead of sql.Null*/pgtype.* — pgx & SQLite ONLY
        emit_interface: true                 # Querier interface (mocking)
        emit_methods_with_db_argument: true  # pass DBTX per-call instead of storing it — dispatch over *sql.DB/*sql.Tx/pgx.Tx
```

Annotations (cmd after `:`): `:one` · `:many` · `:exec` · `:execrows` · `:execresult` (`sql.Result`) · `:batchexec`/`:batchmany`/`:batchone` (pgx batch, PG-only) · `:copyfrom` (generates a `CopyFrom` helper, PG+pgx). `:copyfrom`/`:batch*` require `sql_package` set to pgx.
```sql
-- name: GetUser :one
SELECT * FROM users WHERE id = $1;
-- name: BulkInsertUsers :copyfrom
INSERT INTO users (email, name) VALUES ($1, $2);
```

Transaction binding: use generated `WithTx`:
```go
tx, _ := db.BeginTx(ctx, nil); defer tx.Rollback()
qtx := queries.WithTx(tx)                          // queries now run inside the tx
if err := qtx.UpdateRecord(ctx, params); err != nil { return err }
return tx.Commit()
```

What models get wrong about sqlc:
- No dynamic SQL. Variable `IN`/`WHERE`/`ORDER BY` aren't supported at runtime: use `= ANY($1)` with a slice, or `sqlc.slice('ids')` (pgx, expands to a placeholder list). `sqlc.arg()`/`sqlc.narg()` name params (narg = nullable).
- It validates against the **declared schema at generate time**; schema drift silently mis-types until you regenerate.
- CI is the expert path: `sqlc vet` (lint, incl. `sqlc/db-prepare` against a live DB; v1.19+), **managed databases** (v1.22+, spin a template DB for analysis), `sqlc diff`/`sqlc verify` (catches schema changes that would break existing queries before deploy).
- Type mapping: PG UUID → `github.com/google/uuid` by default, `pgtype.UUID` under `pgx/v5`; JSON columns with `pgx/v5` can map directly to structs (pgx marshals). `emit_pointers_for_null_types` is **pgx/SQLite-only**, not `database/sql`/MySQL.

---

## Redis (go-redis/v9) {#redis}

```go
import "github.com/redis/go-redis/v9"
rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
defer rdb.Close()

err := rdb.Set(ctx, "key", "value", 10*time.Minute).Err()
val, err := rdb.Get(ctx, "key").Result()           // val == "value"

pipe := rdb.Pipeline()                              // one round-trip for N commands
incr := pipe.Incr(ctx, "counter"); _ = pipe.Get(ctx, "config")
_, err = pipe.Exec(ctx); _ = incr.Val()

sub := rdb.Subscribe(ctx, "events"); defer sub.Close()
for msg := range sub.Channel() { _ = msg.Payload }  // auto-reconnects on network errors
```
Rules: always pass `ctx` (every command respects cancellation/deadlines). `Get` returns `redis.Nil` (not `nil`) for a missing key; branch with `errors.Is(err, redis.Nil)`. `Pipeline` batches without atomicity; use `TxPipelined` for `MULTI/EXEC`. Prefer `sub.Channel()` over manual `ReceiveMessage` loops.

---

## MongoDB {#mongodb}

Use `go.mongodb.org/mongo-driver/v2`; v1 is deprecated. Import paths: `.../v2/bson`, `.../v2/mongo`, `.../v2/mongo/options`.
```go
client, err := mongo.Connect(options.Client().ApplyURI("mongodb://localhost:27017"))
defer client.Disconnect(ctx)
coll := client.Database("mydb").Collection("users")
coll.InsertOne(ctx, bson.M{"name": "Alice", "age": 30})
coll.FindOne(ctx, bson.M{"name": "Alice"}).Decode(&user)
cursor, _ := coll.Find(ctx, bson.M{"age": bson.M{"$gte": 18}}); cursor.All(ctx, &users)
```
Rules: `bson.M` for unordered docs, `bson.D` when field order matters (aggregation pipelines). Always `client.Disconnect(ctx)` on shutdown.

---

## Repository Pattern {#repository}

```go
// Interface defined where it's CONSUMED (not next to the impl) — see project-patterns.md#ddd
type UserRepository interface {
    Get(ctx context.Context, id string) (*User, error)
    Create(ctx context.Context, u *User) error
}

type pgUserRepo struct{ pool *pgxpool.Pool }
func NewUserRepo(pool *pgxpool.Pool) UserRepository { return &pgUserRepo{pool: pool} }

func (r *pgUserRepo) Get(ctx context.Context, id string) (*User, error) {
    var u User
    err := r.pool.QueryRow(ctx,
        "SELECT id, name, email, created_at FROM users WHERE id = $1", id,
    ).Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt)
    if errors.Is(err, pgx.ErrNoRows) { return nil, ErrNotFound }    // translate driver error at the boundary
    if err != nil { return nil, fmt.Errorf("getting user %s: %w", id, err) }
    return &u, nil
}
```
Translate `ErrNoRows` to a domain sentinel at the repo boundary; don't leak driver errors upward (see [errors-and-resilience.md](errors-and-resilience.md#wrapping-strategy)). For cross-cutting transactions, pass a tx-bound querier (sqlc `WithTx`) or accept an `interface{ Exec/Query… }` that both `*pgxpool.Pool` and `pgx.Tx` satisfy.

---

## Anti-Patterns {#anti-patterns}

| Anti-Pattern | Why It's a Problem | Fix |
|---|---|---|
| Non-context calls (`db.Query`, `db.Begin`) | Uncancellable; pins a pool conn on a slow query | Always `…Context` variants + a `ctx` deadline |
| `MaxOpenConns(0)` / default unlimited | One spike → "too many clients" outage | Cap ≤ (server limit / instances) |
| `MaxIdleConns` left at 2 under load | Connection churn, `TIME_WAIT` flood | `MaxIdle == MaxOpen` for steady load |
| `*sql.DB`/pool per request | Exhausts the server; defeats pooling | Open once, share (it *is* the pool) |
| Treating `sql.Open`/`pgxpool.New` as connecting | Startup "succeeds", first query fails | `Ping`/`Acquire` at startup |
| String-concatenated SQL | SQL injection | Parameterized `$1,$2` only |
| Missing `rows.Close()` | Leaks a pool connection | `defer rows.Close()` |
| Skipping `rows.Err()` | Silent partial result on iteration error | Check after the loop |
| Ignoring `Scan` error / `ErrNoRows` | Wrong data / nil-deref | Check `Scan`; branch `errors.Is(…, sql.ErrNoRows)` |
| pgx tx assuming ctx-cancel rollback | No auto-rollback in pgx; leaked open tx | `defer tx.Rollback(ctx)` / `BeginFunc` |
| Tx without a timeout | Holds locks, blocks autovacuum | `context.WithTimeout` around every tx |
| `res.LastInsertId()` on PostgreSQL | Unsupported | `INSERT … RETURNING` |
| Scanning NULL into non-pointer | Runtime conversion error | `sql.Null[T]` / `*T` / `COALESCE` |
| Manual `Prepare` with pgx | Fights the auto-prepare cache; breaks PgBouncer | Let pgx prepare; set `QueryExecModeExec` behind a pooler |
| ORM for everything | Hides query cost, N+1, opaque SQL | sqlc / raw SQL on hot paths |
| Secrets in config files | Leak via VCS | Env vars / secret manager |
| Not closing pool on shutdown | Abandoned DB sessions | `defer pool.Close()` / graceful shutdown |

---

## Library landscape & status {#libraries}

| Area | Use now | Avoid / superseded | Why |
|---|---|---|---|
| PG driver | **pgx v5** (`jackc/pgx/v5`, v5.10.0; needs **Go 1.25+**) | lib/pq for new code | pgx faster, PG-native features; lib/pq maintenance-mode |
| pgx pool ctor | `pgxpool.New`/`NewWithConfig` | `pgxpool.Connect`/`ConnectConfig` | v4→v5 rename |
| pgx nulls | `pgtype.*` (`Valid bool`) | v4 tri-state `Status` | v5 simplified |
| stdlib nulls | `sql.Null[T]` [1.22] | per-type `sql.NullString`/… (valid, verbose) | one generic type |
| Bulk insert | `pgx.CopyFrom` | `pq.CopyIn` | ergonomic, COPY protocol |
| MySQL / SQLite | `go-sql-driver/mysql` / `modernc.org/sqlite` (pure) or `mattn/go-sqlite3` (CGO) | - | standard |
| Codegen | **sqlc v1.31.1** | hand-rolled scan boilerplate | typed, validated, `vet`/`verify` |
| Migrations (embed lib) | **goose v3.27.x** | - | `embed.FS`, Go migrations, provider/locker API |
| Migrations (CLI) | **golang-migrate v4.19.1** | its lib/pq driver path | use the native `pgx5://` driver |
| Migrations (schema-as-code) | **Atlas v1.2.0** | manual diffing | auto-plan + 50+ linters + drift |
| Query helper | `jmoiron/sqlx` | - | named params/`StructScan` over `database/sql` |
| MongoDB | `mongo-driver/v2` | v1 (deprecated) | v2 import paths |

---

## Version map 1.20→1.27 {#versions}

| Ver | Database-relevant |
|---|---|
| **1.15** | `SetConnMaxIdleTime` added |
| **1.20** | (no `database/sql` change) `errors.Join`/multi-`%w` useful for collecting per-row errors |
| **1.21** | `log/slog` (log `DBStats`); `slices`/`maps` |
| **1.22** | **`sql.Null[T]`** generic null; range-over-int (retry loops); `math/rand/v2` (jitter) |
| **1.23** | Timers GC'd unreferenced → old `time.After`-leak advice in retry loops stale |
| **1.24** | `testing/synctest` (experiment); deterministic time for retry/timeout DB tests |
| **1.25** | `sync.WaitGroup.Go`; no `database/sql` API change |
| **1.26** | No `database/sql` API change; `new(expr)` returns `*T` (cleaner pointer NULL params); `errors.AsType[E]` (typed `*pgconn.PgError` extraction) |
| **1.27** | `sql.ConvertAssign` + `driver.RowsColumnScanner` (driver-author surface); generic methods (enables generic query methods); **stdlib `uuid` package**; `encoding/json/v2` backs `encoding/json` (JSON-column scan error text differs). GA 2026-08-19; row from 2026-06 RC notes, confirmed against the final release notes. |

---

## What models get wrong {#stale}

(Distinct from the [anti-patterns table](#anti-patterns); these are *staleness/version* errors.)

1. pgxpool constructor names: `pgxpool.Connect`/`ConnectConfig` are pgx **v4**; v5 is `pgxpool.New`/`NewWithConfig`.
2. Assuming pgx auto-rolls-back on ctx cancel: it does not (*"context only affects the begin command"*); only `database/sql` does.
3. Per-type NULL scanning when `sql.Null[T]` [1.22] exists, and `sql.Null[T]` ignores a `T`'s own `driver.Valuer` (#69728), so wrap custom types in `Scanner`/`Valuer`.
4. `res.LastInsertId()` on PostgreSQL: unsupported; use `RETURNING`.
5. Re-preparing statements manually with pgx: it auto-prepares/caches; manual `Prepare` fights the cache, and the default extended-protocol caching breaks under **PgBouncer** txn/statement pooling (set `QueryExecModeExec`/`SimpleProtocol`).
6. `CopyFrom` misconceptions: expecting `RETURNING`/`ON CONFLICT` (neither works through COPY), or forgetting enum/custom-type registration so binary COPY fails.
7. sqlc as dynamic SQL: static codegen; variable `IN`/`WHERE` need `= ANY($1)` + slice or `sqlc.slice()`. `emit_pointers_for_null_types` is pgx/SQLite-only.
8. String-matching PG errors instead of `errors.As(&*pgconn.PgError)` + `pgerrcode`; missing that `pgx.ErrNoRows == sql.ErrNoRows`; not retrying `40001`/`40P01` (serialization/deadlock are expected under `SERIALIZABLE`; retry the idempotent txn).
9. Migration footguns: golang-migrate dirty state (blocks until `migrate force`); Atlas without `--dev-url` (and no `atlas migrate hash` after a manual edit); goose missing `StatementBegin/End` around PL/pgSQL.
10. Stale pgx Go floor: pgx v5.10 needs **Go 1.25+**; old toolchain + new pgx fails to build.
11. "`database/sql` ctx guarantees cancellation": false if the *driver* lacks context-cancellation support (query runs to completion regardless).
12. "lib/pq is officially deprecated": overstated; it's maintenance-mode, still released. The defensible claim is "pgx is the default for new PG code."
13. Ignoring Go 1.27: `sql.ConvertAssign`/`driver.RowsColumnScanner` are real additions since GA 2026-08-19 (driver authors); a stdlib `uuid` package landed too.

---

## See Also {#see-also}
- [errors-and-resilience.md](errors-and-resilience.md#retry): backoff/jitter/classification for serialization-failure retries; error wrapping at the repo boundary
- [observability.md](observability.md): `DBStats`/`pool.Stat()` metrics, query tracing, slog
- [testing.md](testing.md): test databases, fixtures, integration tests (`testing/synctest` for deterministic timing)
- [security.md](security.md#sql-injection): parameterized queries, credential handling
- [project-patterns.md](project-patterns.md#ddd): repositories, where to define the interface

---

## Sources {#sources}
- go.dev/doc/go1.22 (`sql.Null[T]`), go1.26, **go.dev/doc/go1.27 (`sql.ConvertAssign`, `driver.RowsColumnScanner`, stdlib `uuid`, `encoding/json/v2`)**; go.dev/doc/database/manage-connections
- pkg.go.dev/{database/sql, database/sql/driver}; pkg.go.dev/github.com/jackc/pgx/v5 (+ `/pgxpool`, `/stdlib`, `/pgconn`); github.com/jackc/pgx CHANGELOG; github.com/jackc/pgerrcode
- pkg.go.dev/github.com/lib/pq (maintenance status: no deprecation banner corroborated; `LastInsertId` unsupported)
- docs.sqlc.dev (config, annotations, vet/verify/managed-db); pkg.go.dev/github.com/pressly/goose/v3; pkg.go.dev/github.com/golang-migrate/migrate/v4 (v4.19.1); pkg.go.dev/ariga.io/atlas (v1.2.0) + atlasgo.io
- golang/go issues #45993, #69728, #69837; redis/go-redis v9; go.mongodb.org/mongo-driver/v2
