# Cloud-Native Go Patterns

Kubernetes controllers are **level-triggered, idempotent state reconcilers**, not event handlers. `client-go` versions as `v0.<k8s-minor>` (not semver), `controller-runtime` splits its client (**cached reads, direct writes**), webhooks and workqueues went **generic**, and Server-Side Apply replaced GET-modify-PUT. Reconcile the full desired state every call; never assume a read is fresh or an event fires once.

> Verified against Go **1.26.4** (stable) + **1.27 RC**, **Kubernetes 1.36** / `client-go` **v0.36.x** / `controller-runtime` **v0.24.1** / `controller-tools` v0.21.0 / Kubebuilder go/v4, 2026-06. This ecosystem moves fast: version tags `[CR vX]` / `[k8s 1.N]` mark the release a claim applies to; patch numbers drift weekly. Deepened from multi-source research, corroborated against pkg.go.dev.

## TL;DR: the modern deltas (read first)

- `client-go` is `v0.<k8s-minor>.<patch>`, NOT semver. `v0.36.x` ⇔ k8s 1.36; `apimachinery` matches. The `kubernetes-1.x.y` tags are legacy (pre-1.17). There is no "client-go v1".
- controller-runtime version is locked to a k8s minor: **CR v0.24 ⇔ k8s 1.36 ⇔ client-go v0.36**; v0.23⇔1.35, v0.22⇔1.34, v0.21⇔1.33, v0.20⇔1.32. The README is explicit: cross-minor pairings are "neither supported nor tested" and often won't compile. CR v0.24 minimum Go is 1.26.
- The webhook builder is generic and lost `.For()` [CR v0.23]. `ctrl.NewWebhookManagedBy(mgr, &T{})` (two args) + typed `admission.Validator[T]`/`Defaulter[T]` structs in `internal/webhook/`. The old `ctrl.NewWebhookManagedBy(mgr).For(r)` + `webhook.Validator` methods **on the API type** are gone. This is the #1 stale-model trap.
- Workqueues/handlers/sources/predicates are generic: `workqueue.TypedRateLimitingInterface[T]`, `handler.TypedEnqueueRequestForObject[*T]`, `source.TypedKind[T]`. The untyped versions are deprecated aliases.
- Server-Side Apply via `applyconfigurations` is the idiomatic controller write path, not GET-modify-PUT-retry, not strategic-merge. Build the *apply config* (all-pointer fields), `Force: true`, unique `FieldManager`.
- `r.Get` may be stale: CR's client reads from the informer cache by default; writes go direct. Use `mgr.GetAPIReader()` for strong reads.
- `apiextensions.k8s.io/v1beta1` CRDs and `admissionregistration.k8s.io/v1beta1` webhooks were removed in k8s 1.22: emitting them is a hard error, not a deprecation.
- Go 1.25+ sets GOMAXPROCS from the cgroup CPU *limit* automatically: `go.uber.org/automaxprocs` is obsolete for `go 1.25+` modules.

## Table of Contents
1. [client-go: client types & config](#client-go)
2. [Informers, listers, workqueues](#informers)
3. [Server-Side Apply](#ssa)
4. [Operator development with controller-runtime](#operator-dev)
5. [The reconcile loop](#reconcile)
6. [Status, conditions, finalizers](#status-conditions)
7. [CRDs & code generation](#crds)
8. [Admission webhooks](#webhooks)
9. [CEL admission policies (VAP/MAP)](#cel-policies)
10. [Leader election](#leader-election)
11. [Containers & GOMAXPROCS](#containers)
12. [Health probes](#health-probes)
13. [Configuration](#configuration)
14. [Library landscape & status](#libraries)
15. [Version & maturity map](#versions)
16. [What models get wrong](#stale)

---

## client-go: client types & config {#client-go}

> **Agent needs this:** choose the right client and set rate limits: the foundation every K8s controller/tool builds on.

Four client kinds. Pick by *what you know at compile time* and *how much of the object you need*:

| Client | Import | Returns | Use when |
|---|---|---|---|
| **Typed (clientset)** | `k8s.io/client-go/kubernetes` | concrete structs (`*corev1.Pod`) | Known built-in/CRD types. **Default**: compile-time safety. |
| **Dynamic** | `k8s.io/client-go/dynamic` | `*unstructured.Unstructured` | Arbitrary/unknown GVKs, generic tooling, CRDs without generated clients. |
| **Metadata** | `k8s.io/client-go/metadata` | `*metav1.PartialObjectMetadata` | Only need `ObjectMeta` across many/huge objects (GC, quota, labels). Cheapest wire (protobuf). |
| **Discovery** | `k8s.io/client-go/discovery` | API group/version lists | Feature detection; pair with dynamic. |

```go
config, err := rest.InClusterConfig()        // in-cluster; or clientcmd.BuildConfigFromFlags("", kubeconfig)
config.QPS, config.Burst = 50, 100           // CRITICAL: default is 5 QPS / 10 burst — silent client-side throttling
clientset, err := kubernetes.NewForConfig(config)
pods, err := clientset.CoreV1().Pods("default").List(ctx, metav1.ListOptions{})

// Dynamic — runtime flexibility
gvr := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
list, err := dynClient.Resource(gvr).Namespace("default").List(ctx, metav1.ListOptions{})

// Metadata — ObjectMeta only; Update unsupported, use Patch
mc, _ := metadata.NewForConfig(metadata.ConfigFor(config))
```

Traps models hit: omitting `QPS`/`Burst` (the default 5/10 throttles silently; the symptom is mysterious latency under load); `context.TODO()` everywhere instead of a real cancellable `ctx`; assuming GVR `Resource` is the kind (it's the lowercase **plural**: `"deployments"`, not `"Deployment"`). Client-side rate limiting is increasingly superseded by server-side **API Priority & Fairness**, but the client knobs still apply.

---

## Informers, listers, workqueues {#informers}

> **Agent needs this:** never poll the API server in a loop. Informers maintain a watch-synced local cache; listers read it for free; workqueues decouple detection from processing with backoff.

```go
factory := informers.NewSharedInformerFactory(clientset, 30*time.Minute) // resync period; 0 = no resync
// namespace-scoped: informers.NewSharedInformerFactoryWithOptions(clientset, 30*time.Minute, informers.WithNamespace("prod"))

podInformer := factory.Core().V1().Pods()
reg, err := podInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
    AddFunc:    func(obj any) { queue.Add(key(obj)) },       // enqueue ONLY — no heavy work in handlers
    UpdateFunc: func(_, obj any) { queue.Add(key(obj)) },
    DeleteFunc: func(obj any) { queue.Add(key(obj)) },
})                                                            // [verify] AddEventHandler returns (registration, error) — handle err
_ = reg

factory.Start(ctx.Done())
if !cache.WaitForCacheSync(ctx.Done(), podInformer.Informer().HasSynced) { // ALWAYS wait before reading listers
    return errors.New("cache sync failed")
}
pods, _ := podInformer.Lister().Pods("default").List(labels.Everything()) // reads cache, zero API calls (eventually consistent)
```

Workqueues are **generic** now: `TypedRateLimitingInterface[T]` replaces the deprecated untyped `RateLimitingInterface`:

```go
queue := workqueue.NewTypedRateLimitingQueue(workqueue.DefaultTypedControllerRateLimiter[string]())

for { // run N workers in parallel
    key, shutdown := queue.Get()
    if shutdown { return }
    func() {
        defer queue.Done(key)                 // ALWAYS — even on error/panic; pairs with Get
        if err := reconcile(ctx, key); err != nil {
            queue.AddRateLimited(key)         // requeue with per-item exponential backoff
            return
        }
        queue.Forget(key)                     // success → reset that item's backoff counter
    }()
}
```

Traps: doing real work inside an event handler (blocks the shared informer's single dispatch goroutine; enqueue a key and return); calling `List` against the API server in a hot loop instead of the lister; forgetting `Done(key)` (the item is never re-dispatched, the worker silently stalls); using `workqueue.NewRateLimitingQueue` (untyped, deprecated). Don't hand-roll watch reconnection / `resourceVersion` / `continue` pagination: reflectors and informers own that.

---

## Server-Side Apply {#ssa}

The preferred controller write path. SSA tracks **field ownership** server-side, so a controller declares only the fields it owns and never clobbers another manager's: no read-modify-write race, no resourceVersion conflict loop.

```go
import appsv1ac "k8s.io/client-go/applyconfigurations/apps/v1"

// RIGHT — build the apply CONFIG (all-pointer fields), recreate it fully each reconcile
dep := appsv1ac.Deployment("my-app", "default").
    WithSpec(appsv1ac.DeploymentSpec().WithReplicas(2))
applied, err := clientset.AppsV1().Deployments("default").
    Apply(ctx, dep, metav1.ApplyOptions{FieldManager: "my-controller", Force: true})
```

```go
// WRONG — applying a normal API struct sends every zero-valued required field (e.g. replicas: 0,
// strategy: {}) as an intentional value → can shrink/break the object. Apply configs use all-pointer
// fields precisely so unset ≠ zero.
dep := &appsv1.Deployment{ /* ... */ }
clientset.AppsV1().Deployments("default").Apply(ctx, dep, ...) // type error anyway — Apply wants the *ac type
```

`Force: true` is correct for a controller (it owns its fields and should win shared-field conflicts). For read-modify-apply preserving other managers' fields, extract first: `appsv1ac.ExtractDeployment(obj, "my-controller")`. In controller-runtime, the equivalent is `client.Apply` with `client.FieldOwner(...)` / `client.ForceOwnership`, or `controllerutil.CreateOrUpdate`/`CreateOrPatch` for the GET-then-mutate style.

---

## Operator development with controller-runtime {#operator-dev}

> **Agent needs this:** scaffold an operator with the *current* Manager/Builder API: the flat `MetricsBindAddress` options and `Requeue bool` are gone.

Import: `sigs.k8s.io/controller-runtime` **v0.24.x** [CR v0.24] (k8s 1.36). The Manager owns the shared cache, split client, leader election, webhook server, and metrics.

```go
mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
    Scheme:  scheme,
    Metrics: metricsserver.Options{BindAddress: ":8443", SecureServing: true}, // secure HTTPS is the scaffold default
    LeaderElection:                true,
    LeaderElectionID:              "my-operator.example.com",
    LeaderElectionReleaseOnCancel: true,                          // fast handoff — safe ONLY if the binary exits promptly
    HealthProbeBindAddress:        ":8081",
})
mgr.AddHealthzCheck("healthz", healthz.Ping)
mgr.AddReadyzCheck("readyz", healthz.Ping)
// ... register controllers/webhooks ...
mgr.Start(ctrl.SetupSignalHandler()) // blocks until signal; returns error
```

```go
// WRONG — flat fields removed several minors ago; the kube-rbac-proxy metrics sidecar is also gone
mgr, _ := ctrl.NewManager(cfg, manager.Options{MetricsBindAddress: ":8080", Port: 9443, CertDir: "/tmp"})
```

`MetricsBindAddress`/`Port`/`Host`/`CertDir` were replaced by the `Metrics metricsserver.Options{}` and `WebhookServer webhook.Server` structs. Metrics now default to secure `:8443` via controller-runtime's `WithAuthenticationAndAuthorization` (the `kube-rbac-proxy` sidecar was dropped from Kubebuilder scaffolds).

**The split client.** `mgr.GetClient()` reads from the cache (informers) and writes direct to the API server. First read of an uncached type lazily starts an informer. For strong-consistency reads (before a critical create to avoid duplicates, or reading just-written data) use `mgr.GetAPIReader()`. Never gate exactly-once side effects on a cache read without optimistic concurrency.

```go
func (r *DatabaseReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&myapiv1.Database{}).                                  // primary type — exactly one
        Owns(&appsv1.Deployment{}).                                // enqueue owner on owned-object events (owner refs)
        Watches(&corev1.ConfigMap{}, handler.EnqueueRequestsFromMapFunc(r.mapConfigMap)).
        WithEventFilter(predicate.GenerationChangedPredicate{}).   // skip status-only updates → avoid hot loops
        Named("database").                                         // unique-name validation [CR v0.19]; set it or SkipNameValidation
        Complete(r)
}
```

**Typed/generic builders** exist (`reconcile.TypedReconciler[T]`, `source.TypedKind[T]`, `handler.TypedEnqueueRequestForObject[*corev1.Pod]`). But Go through 1.26 forbids type parameters on *methods*, so the builder's `Watches` still takes `handler.TypedEventHandler[client.Object, request]`; a fully-generic `Watches` isn't possible yet (blocked on golang/go#49085; 1.27's generic methods may relax this).

---

## The reconcile loop {#reconcile}

> **Agent needs this:** the idempotent, level-based reconcile that pre-training routinely gets wrong (edge-based handlers, busy-loops, `r.Update` for status).

Reconcile is level-triggered: each call observes current state and converges the full desired state; it must be **idempotent** and must not assume which event triggered it. Signal "come back later" with `RequeueAfter`, never a `for`/`sleep`.

```go
// +kubebuilder:rbac:groups=myapp.example.com,resources=databases,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=myapp.example.com,resources=databases/status,verbs=get;update;patch
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
    var db myapiv1.Database
    if err := r.Get(ctx, req.NamespacedName, &db); err != nil {
        return reconcile.Result{}, client.IgnoreNotFound(err) // gone = nothing to do (cache may lag)
    }

    // Deletion: run cleanup while the object still exists, then drop the finalizer.
    if !db.DeletionTimestamp.IsZero() {
        if controllerutil.ContainsFinalizer(&db, finalizerName) {
            if err := r.deleteExternalResources(ctx, &db); err != nil {
                return reconcile.Result{}, err // requeue with backoff; keep finalizer until cleanup succeeds
            }
            controllerutil.RemoveFinalizer(&db, finalizerName)
            return reconcile.Result{}, r.Update(ctx, &db)
        }
        return reconcile.Result{}, nil
    }
    if controllerutil.AddFinalizer(&db, finalizerName) { // returns true if it changed the object
        if err := r.Update(ctx, &db); err != nil { return reconcile.Result{}, err }
    }

    // Converge owned resources — SSA or CreateOrUpdate; set the owner ref for GC.
    dep := &appsv1.Deployment{ObjectMeta: metav1.ObjectMeta{Name: db.Name, Namespace: db.Namespace}}
    _, err := controllerutil.CreateOrUpdate(ctx, r.Client, dep, func() error {
        dep.Spec.Replicas = db.Spec.Replicas
        return ctrl.SetControllerReference(&db, dep, r.Scheme) // owner ref + BlockOwnerDeletion
    })
    if err != nil { return reconcile.Result{}, err }

    return reconcile.Result{RequeueAfter: time.Minute}, nil
}
```

Return-value semantics (memorize):
- `Result{}, nil`: done; requeue only on a watched change.
- `Result{}, err`: requeue with **exponential backoff** (the rate limiter handles timing; do not sleep).
- `Result{RequeueAfter: d}, nil`: requeue after `d` (level re-sync / external poll).
- `Result{}, reconcile.TerminalError(err)`: log, record the failure, **do NOT requeue** (unrecoverable input).
- `Result{Requeue: true}` is **deprecated**: return `RequeueAfter` or an error.

Traps: treating Reconcile as an event handler keyed on add/update/delete (it's level-based; reconcile the whole spec); blocking the reconciler on a long external call (return `RequeueAfter` instead; a stuck reconcile starves every other object on that worker); ignoring `ctx` cancellation in loops; returning an error for a permanent condition (it requeues forever; use `TerminalError`).

---

## Status, conditions, finalizers {#status-conditions}

Status is a subresource: write it through `r.Status()`, never `r.Update`. `r.Update` targets spec; using it for status overwrites concurrent spec edits and fights the API server's optimistic concurrency.

```go
import "k8s.io/apimachinery/pkg/api/meta"

meta.SetStatusCondition(&db.Status.Conditions, metav1.Condition{
    Type: "Ready", Status: metav1.ConditionTrue,
    ObservedGeneration: db.Generation,           // tie the condition to the spec it reflects
    Reason: "ReconcileSucceeded", Message: "all resources converged",
})
if err := r.Status().Update(ctx, &db); err != nil { return reconcile.Result{}, err }
// or patch: patch := client.MergeFrom(db.DeepCopy()); ...; r.Status().Patch(ctx, &db, patch)
```

- Use `meta.SetStatusCondition`/`FindStatusCondition` (`k8s.io/apimachinery/pkg/api/meta`), never hand-append to `Status.Conditions`. The helper updates in place, bumps `LastTransitionTime` *only on a real status flip*, and keeps the `+listType=map +listMapKey=type` array de-duplicated. Hand-appending grows a duplicate array every reconcile.
- Prefer standard conditions (Ready/Progressing/Available + Degraded, KEP-1623) over inventing a `Phase` string enum.
- Guard status writes with `equality.Semantic.DeepEqual` (`k8s.io/apimachinery/pkg/api/equality`), **not** stdlib `reflect.DeepEqual`, which spuriously differs on `metav1.Time` rounding and `resource.Quantity` normalization, causing an infinite status-write loop. Combine with `GenerationChangedPredicate`.
- Finalizers: `controllerutil.AddFinalizer`/`RemoveFinalizer`/`ContainsFinalizer`; do external cleanup while `DeletionTimestamp` is set, then remove the finalizer so the API server can delete. `SetControllerReference` sets `BlockOwnerDeletion`, enabling foreground GC of owned objects.

Event recording: `mgr.GetEventRecorderFor("db-controller").Event(obj, corev1.EventTypeNormal, "Created", "msg")`. Since [CR v0.23] events use the **`events.k8s.io`** API: RBAC must grant the `events.k8s.io` apiGroup, **not** core `""`.

---

## CRDs & code generation {#crds}

CRDs are generated **`apiextensions.k8s.io/v1` only** (controller-tools v0.21.0) with structural schemas. Annotate Go types with kubebuilder markers; `make manifests` / `controller-gen` emits the YAML.

Type markers: `+kubebuilder:object:root=true`, `+kubebuilder:subresource:status`, `+kubebuilder:resource:shortName=db,scope=Namespaced`, `+kubebuilder:printcolumn:name=Phase,type=string,JSONPath=.status.phase`.
Field markers: `+kubebuilder:validation:MinLength=1`, `+kubebuilder:validation:Enum=postgres;mysql`, `+kubebuilder:default=3`, `+kubebuilder:validation:XValidation:rule="self >= oldSelf",message="immutable"` (CEL), `+optional`.

Multi-version CRDs use hub-and-spoke conversion: one storage ("hub") version; spokes implement `conversion.Convertible` (`ConvertTo(hub)`/`ConvertFrom(hub)`), hub implements `conversion.Hub`. Exactly one version has `storage: true`; each served version carries a schema. Wire `spec.conversion.strategy: Webhook` and let cert-manager inject the CA (`cert-manager.io/inject-ca-from`). [CR v0.23] lets conversion live outside the API package.

```go
// WRONG — every v1beta1 CRD shape was removed in k8s 1.22 (hard error on apply):
apiVersion: apiextensions.k8s.io/v1beta1   // removed
spec:
  validation: {...}                        // top-level (non-per-version) validation — removed
  preserveUnknownFields: true              // removed; structural schemas required in v1
```

---

## Admission webhooks {#webhooks}

> **Agent needs this:** the *current* generic webhook API. Stale models emit `ctrl.NewWebhookManagedBy(mgr).For(r)` and put `Validate*` methods on the API type, both gone since [CR v0.23].

The validator/defaulter is a **separate struct** taking the **concrete typed object**, wired by a **two-argument generic builder** (`internal/webhook/v1/`):

```go
func SetupDatabaseWebhookWithManager(mgr ctrl.Manager) error {
    return ctrl.NewWebhookManagedBy(mgr, &myapiv1.Database{}). // generic; obj is REQUIRED; no .For()
        WithValidator(&DatabaseValidator{}).
        WithDefaulter(&DatabaseDefaulter{}).
        Complete()
}

// admission.Validator[T] — replaces deprecated CustomValidator (= Validator[runtime.Object])
type DatabaseValidator struct{}
func (v *DatabaseValidator) ValidateCreate(ctx context.Context, obj *myapiv1.Database) (admission.Warnings, error) {
    if obj.Spec.Replicas != nil && *obj.Spec.Replicas > 10 {
        return nil, fmt.Errorf("replicas cannot exceed 10")
    }
    return nil, nil
}
func (v *DatabaseValidator) ValidateUpdate(ctx context.Context, oldObj, newObj *myapiv1.Database) (admission.Warnings, error) {
    if oldObj.Spec.Engine != newObj.Spec.Engine {
        return nil, fmt.Errorf("engine is immutable")
    }
    return nil, nil
}
func (v *DatabaseValidator) ValidateDelete(ctx context.Context, obj *myapiv1.Database) (admission.Warnings, error) {
    return nil, nil
}

// admission.Defaulter[T] — replaces deprecated CustomDefaulter
type DatabaseDefaulter struct{}
func (d *DatabaseDefaulter) Default(ctx context.Context, obj *myapiv1.Database) error {
    if obj.Spec.Replicas == nil { three := int32(3); obj.Spec.Replicas = &three }
    return nil
}
```

```go
// WRONG (pre-v0.23, the dominant stale pattern):
func (r *Database) SetupWebhookWithManager(mgr ctrl.Manager) error {
    return ctrl.NewWebhookManagedBy(mgr).For(r).Complete() // .For() removed; ctor now needs (mgr, &T{})
}
var _ webhook.Validator = &Database{}                        // interface-on-the-API-type removed (coupled API to a CR version)
func (r *Database) ValidateCreate() (admission.Warnings, error) { ... }
// WRONG — runtime.Object params satisfy only the deprecated CustomValidator alias, not Validator[*Database]:
func (v *V) ValidateCreate(ctx context.Context, obj runtime.Object) (admission.Warnings, error) { ... }
```

Builder constructors `admission.WithValidator[T]`/`WithDefaulter[T]` are current; `WithCustomValidator`/`WithCustomDefaulter` and the builder's `.WithCustom*` methods are deprecated. Kubebuilder scaffold *comments* still say "implements webhook.CustomValidator": cosmetic lag; the generated code is on the generic path.

**Raw `admission.Handler`** (`Handle(ctx, admission.Request) admission.Response`, decode via `admission.Decoder`) is for multi-kind, cross-resource, or non-CRD webhooks needing the raw `AdmissionReview`.

Server-side YAML knobs: `failurePolicy: Fail|Ignore`; `sideEffects: None` (required); `admissionReviewVersions: ["v1"]` (v1beta1 `AdmissionReview` removed); `matchPolicy: Equivalent`; **`matchConditions`** [k8s 1.30 GA]: up to 64 CEL filters (e.g. exclude leases, `system:nodes`) to dodge feedback loops and cut load. Manage certs with cert-manager or controller-runtime's `certwatcher`.

---

## CEL admission policies (VAP/MAP) {#cel-policies}

In-process CEL policies increasingly replace webhooks: no server, no certs, no availability risk:

- **`ValidatingAdmissionPolicy`** [k8s 1.30 GA, `admissionregistration.k8s.io/v1`]: the apiserver evaluates CEL inline. Pair `ValidatingAdmissionPolicy` + `...Binding`; `validations` with CEL; `validationActions: [Deny|Warn|Audit]`; optional `paramKind`/`paramRef`.
- **`MutatingAdmissionPolicy`** (KEP-3962): alpha [k8s 1.32], **GA [k8s 1.36]** `[verify]` (the exact beta minor, 1.34 vs 1.35, is unsettled across sources; verify the API group/feature gate on your cluster). CEL mutations via apply-config merge or JSON patch.

Decision: prefer VAP/MAP for label/naming/registry/securityContext/replica-limit policy expressible in CEL over single resources. Keep webhooks for cross-resource lookups, external API calls, or complex stateful logic.

---

## Leader election {#leader-election}

> **Agent needs this:** correct single-active-instance controllers. Missing leader election → duplicate reconciliation and conflicts.

Uses **Lease objects** (`coordination.k8s.io/v1`) by default; ConfigMap/Endpoints locks are obsolete.

controller-runtime (operators): set `LeaderElection`, `LeaderElectionID` in `ctrl.Options` (see [operator-dev](#operator-dev)). Only leader-elected runnables (controllers) start on election; webhooks and probes run on **all** replicas. `mgr.Elected()` closes when this instance wins. `LeaderElectionReleaseOnCancel: true` speeds failover but the godoc warns it "requires the binary to immediately end when the Manager is stopped, otherwise this setting is unsafe." Out-of-cluster, set `LeaderElectionNamespace`.

client-go (non-manager daemons):

```go
lock := &resourcelock.LeaseLock{
    LeaseMeta:  metav1.ObjectMeta{Name: "my-controller", Namespace: ns},
    Client:     clientset.CoordinationV1(),
    LockConfig: resourcelock.ResourceLockConfig{Identity: podName}, // unique per pod (POD_NAME via Downward API)
}
leaderelection.RunOrDie(ctx, leaderelection.LeaderElectionConfig{
    Lock: lock, ReleaseOnCancel: true,
    LeaseDuration: 15 * time.Second, RenewDeadline: 10 * time.Second, RetryPeriod: 2 * time.Second,
    Callbacks: leaderelection.LeaderCallbacks{
        OnStartedLeading: run,                       // its ctx is cancelled when leadership is LOST
        OnStoppedLeading: func() { os.Exit(0) },     // stop ALL work or risk split-brain
    },
})
```

Invariants: `RetryPeriod < RenewDeadline < LeaseDuration` (`RunOrDie` panics otherwise). Work in `OnStartedLeading` **must** stop when its ctx is cancelled, or two leaders run. Failover ≈ `LeaseDuration` after a crash: shorter = faster failover but more API load. **Stale:** `resourcelock.ConfigMapLock`/`EndpointsLock` (deprecated).

---

## Containers & GOMAXPROCS {#containers}

> **Agent needs this:** Go 1.25+ makes `automaxprocs` obsolete.

Automatic [Go 1.25+], no code: the runtime reads the cgroup CPU **bandwidth limit** (K8s `limits.cpu`, **not** requests). `limits.cpu: "2"` on an 8-core node ⇒ GOMAXPROCS=2 (cgroup v1 and v2). Without a limit, GOMAXPROCS still defaults to all host CPUs → scheduler thrash under a CFS quota.

Manual override `runtime.GOMAXPROCS(4)`; re-enable auto `runtime.SetDefaultGOMAXPROCS()` [1.25]; opt out `GODEBUG=containermaxprocs=0`. For `go <1.25` modules only: `import _ "go.uber.org/automaxprocs"`. Docker multi-stage builds, base images, ko, cross-compile → [platform-and-build.md](platform-and-build.md). Default base: `gcr.io/distroless/static:nonroot`.

---

## Health probes {#health-probes}

> **Agent needs this:** the #1 probe mistake is checking the DB in the liveness probe: a transient DB blip restarts every pod, turning a dependency hiccup into a cascade outage.

| Endpoint | K8s probe | Fail when |
|---|---|---|
| `/healthz` | `livenessProbe` | Process deadlocked/unrecoverable. **Never check dependencies here.** |
| `/readyz` | `readinessProbe` | Not ready for traffic (warming up, dependency down), removed from Service endpoints, **not** restarted. |

```go
mux := http.NewServeMux()
mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
mux.HandleFunc("/readyz", func(w http.ResponseWriter, _ *http.Request) {
    if !isReady() { w.WriteHeader(http.StatusServiceUnavailable); return }
    w.WriteHeader(http.StatusOK)
})
go http.ListenAndServe(":8081", mux) // separate port from the app
```

gRPC (`grpc.health.v1`): `health.NewServer()` + `healthpb.RegisterHealthServer`; `SetServingStatus("", SERVING)` for overall. K8s 1.24+ has native gRPC probes (`livenessProbe.grpc.port`). controller-runtime probes are built into the Manager (see [operator-dev](#operator-dev)). More: [observability.md](observability.md).

---

## Configuration {#configuration}

Env vars (preferred): `valueFrom.configMapKeyRef`/`secretKeyRef`/`fieldRef`; `envFrom` for bulk. **Mounted files** auto-update via symlink rotation (~60s); watch the *directory* with `fsnotify` (listen for `Create`, not `Write`; rotation swaps the symlink). **Critical trap:** `subPath` mounts do **not** receive automatic updates. Never use `subPath` for live-reload config. Read namespace from `POD_NAMESPACE` (Downward API), never hardcode.

---

## Library landscape & status {#libraries}

Fast-moving: pin to the row matching your cluster's k8s minor.

| Library | Status [mid-2026] | Note |
|---|---|---|
| `k8s.io/client-go` | **v0.36.x** ⇔ k8s 1.36 *(fast-moving)* | `v0.<minor>` scheme since 1.17; not semver |
| `k8s.io/apimachinery` | **v0.36.x** *(fast-moving)* | Matches client-go minor |
| `sigs.k8s.io/controller-runtime` | **v0.24.1** ⇔ k8s 1.36 *(fast-moving)* | Generic webhooks/queues; priority queue default; min Go 1.26 |
| `sigs.k8s.io/controller-tools` | v0.21.0 *(fast-moving)* | `controller-gen`: CRD/RBAC/webhook codegen; v1 CRDs only |
| Kubebuilder | go/v4 (k8s 1.36 / Go 1.26) *(fast-moving)* | go/v2, go/v3 layouts removed; Apple-silicon support |
| Operator SDK | tracks Kubebuilder *(fast-moving)* | Uses Kubebuilder as a library |
| `cert-manager` | `cert-manager.io/v1` | Webhook/conversion CA injection |
| `go.uber.org/automaxprocs` | **Obsolete for `go 1.25+`** | Runtime does it natively |
| `k8s.io/api/.../v1beta1` CRD/webhook APIs | **Removed [k8s 1.22]** | Hard error: never emit |

---

## Version & maturity map {#versions}

| k8s | client-go | controller-runtime | Notable |
|---|---|---|---|
| **1.32** | v0.32 | **v0.20** | Webhook builder went generic was *imminent* |
| **1.33** | v0.33 | **v0.21** | Webhook custom paths (`WithValidatorCustomPath`) |
| **1.34** | v0.34 | **v0.22** | MutatingAdmissionPolicy progressing `[verify]` |
| **1.35** | v0.35 | **v0.23** | **Generic webhook builder** (`NewWebhookManagedBy(mgr, &T{})`, no `.For()`); priority queue default-on; events → `events.k8s.io` |
| **1.36** | v0.36 | **v0.24** | Current; min Go 1.26; MutatingAdmissionPolicy GA `[verify]`; v0.24.1 "Fix regression in Apply typed error handling" |

Cross-minor pairings are untested and often won't compile; always match the row. Go: **1.26.4** stable (green-tea GC default), **1.27 RC** (generic methods → may finally enable fully-generic `Watches`).

---

## What models get wrong {#stale}

1. **Webhook builder.** Emitting `ctrl.NewWebhookManagedBy(mgr).For(r)` + `webhook.Validator` methods on the API type: gone [CR v0.23]. Now two-arg generic `(mgr, &T{})` + a typed `Validator[T]` struct in `internal/webhook/`.
2. **`runtime.Object` webhook signatures** instead of the concrete type; they satisfy only the deprecated `CustomValidator = Validator[runtime.Object]` alias.
3. **`apiextensions.k8s.io/v1beta1` CRDs / `admissionregistration.k8s.io/v1beta1` webhooks / `admission/v1beta1` AdmissionReview**: all removed [k8s 1.22]; plus `preserveUnknownFields`, `trivialVersions`, top-level `validation`.
4. **Flat Manager options** (`MetricsBindAddress`, `Port`, `CertDir`) instead of `Metrics metricsserver.Options{}` / `WebhookServer`.
5. **Untyped workqueues/handlers/sources** (`workqueue.RateLimitingInterface`, `handler.EnqueueRequestForObject{}`) instead of `Typed*` generics.
6. **client-go as semver** ("v1.x"): it's `v0.<k8s-minor>.<patch>` (v0.36.x ⇔ 1.36).
7. **GET-modify-PUT-retry / strategic-merge** where typed **SSA via `applyconfigurations`** + `FieldManager` + `Force` is idiomatic.
8. **Building SSA from API structs** (`appsv1.Deployment{}`): sends destructive zero values; use `appsv1ac.Deployment(...)`.
9. **ConfigMap/Endpoints leader locks** instead of `LeaseLock`.
10. **Events RBAC** on core `""` instead of `events.k8s.io` [CR v0.23].
11. **Hand-appending to `Status.Conditions`** (duplicate growing array) instead of `meta.SetStatusCondition`; forgetting `ObservedGeneration`; inventing a `Phase` enum.
12. **`r.Update` for status** instead of `r.Status().Update`/`Patch`.
13. **`reflect.DeepEqual` to guard status writes** → infinite loop on `metav1.Time`/`Quantity`; use `equality.Semantic.DeepEqual` + `GenerationChangedPredicate`.
14. **DB check in liveness probe** → transient DB outage restarts all pods (cascade). Liveness = process alive; readiness = deps ok.
15. **Polling the API server in a loop** instead of informers; doing heavy work in event handlers; forgetting `WaitForCacheSync` or `queue.Done(key)`.
16. **Assuming `r.Get` is fresh**: it's a cache read; use `mgr.GetAPIReader()` for strong reads.
17. **Treating Reconcile as edge-triggered** (keyed on add/update/delete) instead of level-based full-state convergence; busy-looping instead of `RequeueAfter`; using deprecated `Result{Requeue: true}`.
18. **Omitting `QPS`/`Burst`** → silent 5 QPS / 10 burst client throttling.
19. **`automaxprocs` on `go 1.25+`**: obsolete; the runtime reads the cgroup CPU limit.
20. **`subPath` config mounts** expecting live reload; they never update.
21. **kube-rbac-proxy metrics sidecar**: dropped; use controller-runtime `WithAuthenticationAndAuthorization` + secure `:8443`.
22. **Reaching for a webhook** where a CEL `ValidatingAdmissionPolicy` [k8s 1.30] suffices (no server/cert/availability cost).

---

## See Also {#see-also}
- [observability.md](observability.md): OTel, health-check details, production checklist
- [platform-and-build.md](platform-and-build.md): Docker multi-stage, ko, cross-compilation
- [distributed-systems.md](distributed-systems.md): leader election (etcd/Raft), consensus, idempotency
- [modern-go.md](modern-go.md): container-aware GOMAXPROCS, generics, Go version matrix
- [errors-and-resilience.md](errors-and-resilience.md): retry/backoff, circuit breakers, context propagation
- [http-and-apis.md](http-and-apis.md): HTTP server patterns, graceful shutdown, middleware

## Sources {#sources}
- pkg.go.dev/{k8s.io/client-go@v0.36.1, sigs.k8s.io/controller-runtime@v0.24.1, .../pkg/webhook/admission, .../pkg/builder} (API signatures verified)
- github.com/kubernetes-sigs/controller-runtime: VERSIONING.md, compatibility matrix, v0.24.1 release notes
- book.kubebuilder.io: cronjob-tutorial/webhook-implementation, markers reference, versions_compatibility_supportability
- kubernetes.io: admission controllers reference (ValidatingAdmissionPolicy GA 1.30; MutatingAdmissionPolicy / KEP-3962); CRD versioning; API Priority & Fairness
- go.dev/doc/go1.25 (container-aware GOMAXPROCS), go1.26/go1.27 release notes
- github.com/kubernetes/client-go (INSTALL.md version-skew matrix); grpc.io health-checking; github.com/GoogleContainerTools/distroless
