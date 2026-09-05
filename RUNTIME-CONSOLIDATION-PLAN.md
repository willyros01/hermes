# FIDUNIO Runtime Consolidation and Recovery Plan

**STATUS: MANDATORY PROJECT ACTION PLAN — READ BEFORE FURTHER RUNTIME, MESSAGING, STORAGE, OR SERVICE-WORKER CHANGES**

This plan exists because the September 4, 2026 audit established that the repository currently has a hidden dual-code architecture: the raw `app.js` still contains substantial prototype-era state/UI, while `service-worker.js` rewrites `app.js` source at runtime to inject later production behavior. Therefore the raw source in the repository is not always the same program that users have been validating.

This is now a project-level architectural defect. Do not continue Fire account-isolation work or remove prototype data until this plan reaches the appropriate validation checkpoints.

## Non-negotiable objective

Move FIDUNIO from:

```
raw prototype-era app.js
        -> service worker rewrites source code
        -> actual running FIDUNIO
```

to:

```
authoritative production source in repository
        -> service worker only performs normal cache/offline duties
        -> same FIDUNIO code executes on cold load, refresh, and controlled load
```

No validated behavior may be intentionally redesigned during this consolidation.

## Protected starting points

- `checkpoint-0.9.5.1-settings-pass` protects the validated Settings ownership/lifecycle work.
- `checkpoint-0.9.5.3-before-runtime-cleanup` protects the exact state before runtime consolidation begins.
- FIDUNIO 0.9.4.11 remains the clean stabilization rollback baseline.
- FIDUNIO 0.9.0.4 remains the validated messaging/E2EE development baseline.

## Core discovery

`app.js` is not merely a UI file. It currently combines runtime state, navigation, rendering, IndexedDB persistence, Outbox/history restore, Firebase synchronization, E2EE/device identity, receipt behavior, and prototype-era defaults.

The service worker is also not merely a cache. It transforms `app.js` text at runtime and injects later functionality, including important messaging/E2EE/group/receipt behavior. This creates two possible application implementations depending on service-worker control and lifecycle.

The old Maria Santos / John Cruz / Family Group data is embedded directly in the raw runtime state. Sample contacts and old local group flows are also embedded in the raw application framework.

## Mandatory sequence

### Phase 1 — Inventory the runtime transformation

Before changing behavior:

1. Enumerate every transformation performed by `service-worker.js` against `app.js`.
2. Classify each transformation as production-critical, compatibility-only, UI, group foundation, receipt behavior, E2EE, or obsolete.
3. Identify the exact validated release/checkpoint that originally introduced each behavior when practical.
4. Record any transformation whose replacement depends on fragile source-string matching.
5. Do not delete or simplify a transformation until its resulting behavior exists in authoritative source and is tested.

### Phase 2 — Materialize the transformed production behavior into normal source

Move the behavior currently injected by the service worker into normal repository source in controlled increments.

Rules:

- Preserve the existing validated messaging path.
- Preserve per-device E2EE fan-out and legacy E2EE compatibility.
- Preserve Sent/Delivered/Read behavior, including iPad live Sent -> Read refresh.
- Preserve encrypted local history and Outbox/reconnect behavior.
- Preserve real group metadata foundation; do not enable group message writes before group E2EE/key rotation is ready.
- Preserve New Message display-name selection.
- Preserve Settings 0.9.5.1 behavior.
- Preserve approved message bubbles, Back button, iPhone overflow containment, and iPad two-pane behavior.
- Do not perform unrelated cleanup while materializing a transformation.
- Each mutable resource follows `CODING-GUIDELINES.md`: one owner, one scope, one lifecycle, one serialized write path.

After each materialized increment, verify that controlled and uncontrolled/cold startup execute equivalent behavior.

### Phase 3 — Reduce the service worker to a normal service worker

Only after all required runtime transformations have been materialized and validated:

1. Remove source-code rewriting from `service-worker.js`.
2. Keep only normal shell caching/offline lifecycle behavior that is still required.
3. Firebase Auth/Firestore data must remain outside inappropriate service-worker caching.
4. Verify first load, refresh, service-worker update, private/new browser context, and offline/reconnect behavior.
5. Confirm that repository source is now the authoritative running program.

This phase is not complete merely because the app appears visually correct. Messaging, receipts, E2EE, Outbox, group metadata, Settings, and responsive behavior must all be checked.

### Phase 4 — Establish true empty production runtime state

Only after Phase 3 passes:

1. Replace prototype-seeded runtime initialization with an explicit production initializer.
2. Production defaults must include:
   - `conversations: []`
   - `messages: {}`
   - `selectedId: null`
   - `peerTrust: {}`
   - legitimate Settings and quick-phrase defaults only.
3. Remove Maria Santos, John Cruz, Family Group, and other prototype/sample conversations from the production runtime path.
4. Remove sample local contacts from production New Message behavior unless they are intentionally retained in a separately owned development-only harness that cannot execute in production.
5. Do not let an empty account fall back to prototype data.

Before making the runtime empty, explicitly harden:

- Messages empty-state rendering.
- iPad/tablet two-pane behavior with zero conversations.
- `currentConversation()` and `renderChat()` against a missing selection.
- Any navigation that assumes `state.conversations[0]` exists.
- Numeric prototype conversation-ID assumptions.
- Old local group creation assumptions that depend on sample contacts or `Math.max()` numeric IDs.

### Phase 5 — Revalidate the messaging round trip

Before returning to Fire account isolation, test the production runtime on the established devices:

- real conversation discovery only;
- send and receive;
- E2EE decrypt on intended devices;
- legacy encrypted history compatibility where applicable;
- Sent -> Delivered -> Read behavior;
- iPad live Sent -> Read without navigation/refresh;
- offline Outbox and reconnect;
- conversation re-entry/history restore;
- New Message display-name flow;
- iPad two-pane layout;
- iPhone layout/overflow;
- Settings Profile/User Administration/Invitations lifecycle;
- Back-button visibility.

If a protected behavior fails, stop at that phase and diagnose it. Do not continue to account isolation.

### Phase 6 — Resume Fire HD 8 account isolation

Only after one authoritative runtime exists and Phase 5 passes:

1. Re-audit exact account-owned IndexedDB resources.
2. Keep installation-local PIN/config separate from account-owned messaging state unless a later explicit design changes that rule.
3. Scope account-owned state by authenticated UID: conversations, messages/history, Outbox, peer trust, and account/device cryptographic material as appropriate.
4. Authentication must determine UID before account-owned state is activated/restored.
5. Serialize account/storage switching through the designated owner/mutex.
6. No storage module may mutate structural UI or call `location.reload()` as an account-switch mechanism.
7. Treat ambiguous pre-isolation mixed data as untrusted; never guess ownership.
8. Test A -> sign out -> B -> sign out -> A on the same Fire browser. No account may display another account's local data.

## Explicitly prohibited shortcuts

Until this plan is complete, do not:

- patch Maria/John/Family visibility with CSS;
- simply delete prototype arrays without auditing their framework dependencies;
- add another MutationObserver to repair runtime lifecycle;
- add another service-worker source transform;
- depend on orientation changes, refresh timing, or cache warming to make functionality appear;
- create a second competing runtime state owner;
- reuse rejected 0.9.4.12 account-isolation architecture;
- broadly rewrite messaging/E2EE while doing consolidation;
- assume a UI element is merely cosmetic without tracing its state/event dependencies.

## Definition of success

Runtime consolidation is successful only when:

1. GitHub source is the authoritative application implementation.
2. The service worker does not rewrite application source code.
3. Cold and warm loads execute the same application logic.
4. Empty accounts are genuinely empty and never seed prototype conversations.
5. All protected messaging/E2EE/receipt/Outbox/UI/Settings behaviors still pass.
6. Fire account-isolation work can then proceed against one deterministic runtime.

## Development gate

Before every implementation step in this plan:

1. Read `CODING-GUIDELINES.md`.
2. Read this file.
3. State the owner, exact resource scope, lifecycle trigger, and serialized write path for resources being changed.
4. Make one bounded change.
5. Validate before moving to the next phase.

This plan supersedes any earlier assumption that prototype UI/data can be removed independently from `app.js` without first consolidating service-worker-injected runtime behavior.