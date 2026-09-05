# FIDUNIO Runtime Consolidation and Recovery Plan

**STATUS: MANDATORY PROJECT ACTION PLAN — READ BEFORE FURTHER RUNTIME, MESSAGING, STORAGE, OR SERVICE-WORKER CHANGES**

This plan exists because the September 4, 2026 audit established that the repository currently has a hidden dual-code architecture: the raw `app.js` still contains substantial prototype-era state/UI, while `service-worker.js` rewrites `app.js` source at runtime to inject later production behavior. Therefore the raw source in the repository is not always the same program that users have been validating.

**September 5 architecture amendment:** the former per-device E2EE ownership model has also been superseded. `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md` is now binding: one account owns one durable E2EE identity; Firestore is authoritative for encrypted conversations/messages; local storage is rebuildable cache; device ID is informational only for now. This changes the target of E2EE consolidation, but does not permit blind deletion of existing service-worker transforms or legacy code.

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

At the same time, migrate messaging ownership toward the binding account-authoritative model without allowing local browser/device identity to remain the only durable key to conversation history.

## Protected starting points

- `checkpoint-0.9.5.1-settings-pass` protects the validated Settings ownership/lifecycle work.
- `checkpoint-0.9.5.3-before-runtime-cleanup` protects the exact state before runtime consolidation begins.
- FIDUNIO 0.9.4.11 remains the clean stabilization rollback baseline.
- FIDUNIO 0.9.0.4 remains the validated historical per-device messaging/E2EE development baseline, not the new target architecture.

## Core discovery

`app.js` is not merely a UI file. It currently combines runtime state, navigation, rendering, IndexedDB persistence, Outbox/history restore, Firebase synchronization, E2EE/device identity, receipt behavior, and prototype-era defaults.

The service worker is also not merely a cache. It transforms `app.js` text at runtime and injects later functionality, including important messaging/E2EE/group/receipt behavior. This creates two possible application implementations depending on service-worker control and lifecycle.

The old Maria Santos / John Cruz / Family Group data is embedded directly in the raw runtime state. Sample contacts and old local group flows are also embedded in the raw application framework.

## Mandatory sequence

### Phase 1 — Inventory the runtime transformation

Before changing behavior, enumerate every transformation performed by `service-worker.js` against `app.js`, classify it, identify fragile source-string matching, and record dependencies. Do not delete a transformation merely because its old architecture is superseded; first identify what validated behavior it also carries.

### Phase 2 — Establish the account-authoritative E2EE target

Before materializing further per-device E2EE transforms, follow `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`:

1. Firebase Auth UID is the durable user identifier.
2. One account owns one durable randomly generated E2EE identity.
3. Design a reviewed method for storing the public portion in Firestore and the private portion only as a secure encrypted/wrapped package.
4. Firestore is authoritative for encrypted conversation/message data.
5. Local IndexedDB/storage is a rebuildable cache and temporary Outbox.
6. Device ID may be collected but is not used for E2EE routing/history ownership.
7. Future FCM registration tokens are a separate UID-associated notification concern.

Do not derive private keys from UID alone. Do not store plaintext private keys in Firestore. Do not make the installation-local PIN the sole durable source of the permanent account identity without an explicit reviewed redesign.

### Phase 3 — Materialize/replace transformed production behavior in bounded increments

Move required behavior currently injected by the service worker into authoritative repository source, while replacing obsolete per-device E2EE ownership with the new account model in controlled units.

Preserve user-visible validated behavior: direct messaging, Sent/Delivered/Read including iPad live refresh, Outbox/reconnect, Settings, New Message display-name selection, responsive UI, Back button, and group safety gates. Existing per-device envelope code is legacy migration material, not a behavior that must remain the final architecture.

Each mutable resource follows `CODING-GUIDELINES.md`: one owner, one scope, one lifecycle, one serialized write path.

### Phase 4 — Reduce the service worker to a normal service worker

Only after required runtime behavior exists in authoritative source and is validated, remove source-code rewriting from `service-worker.js`. Keep only appropriate shell caching/offline behavior. Verify first load, refresh, service-worker update, private/new browser context, and offline/reconnect behavior.

### Phase 5 — Establish true empty production runtime state

Replace prototype-seeded runtime initialization with explicit production defaults including `conversations: []`, `messages: {}`, `selectedId: null`, and no Maria/John/Family/sample fallback. Harden empty-state rendering, tablet two-pane behavior, missing selection, navigation assumptions, numeric prototype IDs, and old sample-contact group assumptions first.

### Phase 6 — Firestore-authoritative cache synchronization

After authentication determines UID and account E2EE recovery succeeds:

1. synchronize authoritative conversation metadata/messages from Firestore;
2. rebuild/update local inbox/message cache;
3. maintain live synchronization;
4. keep Outbox as temporary offline queue only;
5. ensure deleting local cache causes reconstruction rather than loss of account history or cryptographic identity.

### Phase 7 — Revalidate the messaging round trip and durability

Test:

- real conversation discovery only;
- send/receive and decrypt;
- Sent -> Delivered -> Read;
- iPad live Sent -> Read;
- offline Outbox/reconnect;
- history/re-entry;
- New Message display-name flow;
- iPad/iPhone layouts and Back button;
- Settings lifecycle;
- PWA reinstall recovery;
- local-cache deletion recovery;
- Safari/PWA access without dependence on the old installation device ID;
- replacement-device recovery of the same account E2EE identity through the approved secure recovery path.

### Phase 8 — Resume same-browser account isolation

After one authoritative runtime and account-authoritative messaging path pass, re-audit account-owned IndexedDB resources. Authentication must determine UID before account-owned cache is activated. Installation-local PIN/config remains separate unless explicitly redesigned. Test A -> sign out -> B -> sign out -> A with no cross-account cache exposure.

## Explicitly prohibited shortcuts

Do not patch prototype visibility with CSS, blindly delete prototype arrays or service-worker transforms, add broad MutationObservers, add new service-worker source transforms, depend on timing/orientation/cache warming, create competing state owners, reuse rejected 0.9.4.12 account-isolation architecture, derive E2EE private keys from UID alone, store plaintext private keys in Firestore, or continue building new per-device E2EE fan-out as the target design.

## Definition of success

Runtime consolidation and the architecture correction succeed only when GitHub source is authoritative, the service worker no longer rewrites source, empty accounts are genuinely empty, Firestore is authoritative for encrypted conversations/messages, local cache is disposable/rebuildable, one account has one durable recoverable E2EE identity, device ID is not required for decryptability, and protected messaging/UI behavior passes.

## Development gate

Before every implementation step:

1. Read `hermes-memory.txt`.
2. Read `CODING-GUIDELINES.md`.
3. Read `ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md`.
4. Read this file and `RUNTIME-TRANSFORM-INVENTORY.md`.
5. Read `E2EE-IDENTITY-LIFECYCLE.md` for historical/migration context when touching E2EE/device code.
6. Read other supporting root documentation relevant to the change, including `architecture-ownership.txt` and `BUG-LIST.md`.
7. State owner, resource scope, lifecycle trigger, and serialized write path.
8. Make one bounded change and validate it before proceeding.

## Consolidation progress

- **0.9.5.4:** live direct-message receipt reconciliation/read promotion copied from service-worker transform into authoritative `app.js`; corresponding transform removed.
- **0.9.5.7:** legacy per-installation E2EE identity race fixed and validated. This remains a useful stabilization checkpoint but its device-based ownership model is now superseded.
- **September 5, 2026:** production direction changed to account-authoritative E2EE/Firestore authority. Further per-device E2EE materialization is paused until the new durable account-key wrapping/recovery design is defined.
