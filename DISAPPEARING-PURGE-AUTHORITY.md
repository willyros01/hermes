# FIDUNIO Disappearing-Content Purge Authority

**STATUS: BINDING REBUILD SECURITY CONTRACT — REPOSITORY FOUNDATION ONLY**

This document defines the single physical-deletion ownership boundary for disappearing content. It does not authorize a live Firebase deployment.

## Core invariant

**ONE DISAPPEARING SOURCE -> ONE SERVER PURGE OWNER -> ONE REVALIDATED TRACE SET -> ONE SERIALIZED COMMIT PATH.**

`disappearing-purge-policy.js` remains the pure final-source eligibility owner. `disappearing-purge-executor.js` is the serialized coordination owner. Neither module owns Firebase/Admin SDK access or physical deletion. A dedicated server repository/adapter will own every Firestore/Storage delete and MUST re-read authoritative state before commit.

A client/browser/device clock is never deletion authority.

## Executor contract

The executor requires four repository capabilities:

- `readDirectPurgeState({conversationId,messageId})`
- `commitDirectPurge({conversationId,messageId,expectedBasis,evaluatedAt,decision})`
- `readGroupPurgeState({groupId,messageId})`
- `commitGroupPurge({groupId,messageId,expectedBasis,evaluatedAt,decision})`

Every read returns an opaque `basis` plus the exact authoritative inputs required by the pure purge policy. The basis may be a version/revision tuple or another server-owned comparison token. It is intentionally opaque to UI/runtime callers.

The commit path MUST re-read/revalidate the source and eligibility basis. A stale basis fails closed. The executor does not retry a stale commit automatically because the source membership/receipt state may have changed; a later scheduled evaluation may start a fresh read/decision cycle.

The in-process serialization queue prevents one executor instance from overlapping its own mutation requests. It is supplemental only. Cross-instance/cloud correctness MUST come from the server repository's transaction/precondition strategy.

## Direct purge state

Authoritative direct decision inputs are:

- exact direct conversation/message identity;
- immutable source message `disappearAfterSeconds`;
- non-sender recipient UID;
- authoritative source `state` and immutable first `readAt`;
- server-side current time.

If the recipient has not Read or the window has not elapsed, no physical-delete owner is invoked.

## Group purge state

Authoritative group decision inputs are:

- exact group/message identity;
- source sender UID and immutable `disappearAfterSeconds`;
- source epoch member UIDs;
- current entitlement/current-member UIDs;
- authoritative per-account Read receipts with immutable first `readAt`;
- server-side current time.

A later-added member outside the source epoch is not a retroactive recipient. A removed member no longer blocks final source deletion. Every still-entitled original recipient independently blocks final purge until Read + duration has elapsed.

## Required physical trace set

When a commit revalidates eligible, it must physically delete every FIDUNIO-controlled trace that exists only for that source, including as applicable:

- source Firestore message document/ciphertext;
- message receipt documents/subcollections;
- explicit earlier-history grant copies whose `sourceMessageId` is the source;
- grant metadata that becomes empty/invalid after subordinate copies are removed, when that metadata has no remaining retained-message purpose;
- attachment manifest/metadata;
- encrypted attachment chunks/blobs;
- thumbnails/previews;
- attachment-specific receipt/reference records;
- any server-owned notification/payload-cache records introduced in later releases.

There is no `expired:true` source record and no per-message tombstone.

Local browser/device traces are a separate convergence resource and must be purged by the UID-scoped cache/Outbox owner after cloud absence/expiry is authoritative. The cloud purge executor must never reach into browser IndexedDB or DOM ownership.

## History-grant rule

History grants cannot extend a disappearing source's lifetime. A copy is subordinate to its source. Source purge eligibility therefore implies purge of every grant copy/reference for that source. A grant target does not become a new lifetime authority.

Rules already require retained source existence for history-copy creation. Once the source is physically absent, a normal current client must not recreate grant copies from cache-only history.

## Anti-resurrection boundary

The normal application has only one authoritative pending-send owner: the encrypted Outbox. Rebuildable local history/cache is never a send authority. Therefore reconnect must never turn cached/projected history back into a cloud message write.

The later local-convergence slice must additionally remove expired source IDs from Outbox/cache before retry/projection and ignore stale cached snapshots after authoritative cloud absence. No new per-message cloud tombstone may be introduced merely to simplify reconciliation.

## Delete-rule boundary

Do **not** open browser/client delete rules for disappearing content. The physical-delete owner is server-side. Firebase Admin access bypasses client Security Rules and therefore must use a narrowly scoped, reviewed runtime identity and repository path. Any future live deployment requires explicit Firebase handoff and verification.

## Scheduling boundary

This checkpoint does not add a scheduled Cloud Function or deploy any new Function. A future scheduler may discover/evaluate candidates, but it must call the same single purge executor/repository path rather than implementing independent deletion logic.

## Required validation before enabling user-facing controls

Before disappearing-message controls or Group Info earlier-history sharing are considered complete, repository and device validation must prove:

1. eligible direct/group sources are physically deleted;
2. ineligible/unread/current-window sources are retained;
3. stale-basis commits fail closed;
4. receipts and history-grant copies/references are deleted with the source;
5. attachment traces are deleted when attachment transport exists;
6. local cache/Outbox/object URLs converge to absence;
7. offline/reconnect cannot re-upload or re-project expired material;
8. same-account multiple devices converge to the same absence;
9. no client delete permission or per-message tombstone is introduced.

Live Firebase and `htest` remain untouched until the normal controlled handoff/final-candidate gates.

## Firestore repository foundation — 0.9.6.15

`disappearing-purge-firestore-admin-adapter.mjs` is the first server-only repository implementation behind the serialized executor. It receives an Admin Firestore instance by dependency injection and never initializes Firebase itself.

Direct state basis includes the direct conversation and source-message Firestore update times. Direct commit runs in a Firestore transaction, re-reads those documents, rejects any basis change, validates the direct membership/sender-recipient relationship again, and physically deletes only the source message. An already absent source is idempotent success.

Group state basis includes the group document, source message, immutable source epoch document, and every current per-message receipt update time. The read returns source-epoch member UIDs, current entitlement member UIDs and receipt data to the existing pure eligibility owner. Group physical deletion is intentionally unavailable until history-grant copies/references and group receipts can be removed/reconciled without violating trace-free purge. The adapter therefore fails closed rather than deleting the group source prematurely.

This repository foundation is not a scheduler or deployed Function and does not authorize client delete rules.

## Group history-grant trace planning — 0.9.6.16

`disappearing-group-grant-trace-plan.js` is the pure subordinate-history reconciliation owner. For one disappearing group source it receives complete grant metadata + copy rows and produces only a deterministic plan:

- delete every grant copy whose `sourceMessageId` equals the disappearing source;
- delete a grant document when that was its last copy;
- otherwise recompute `totalCopies` and the earliest retained `firstSharedMessageId` / `firstSharedAt` so grant metadata does not retain a stale reference to the purged source.

The planner fails closed if metadata `totalCopies` does not equal the observed copy count, if copy authority does not match its group/grant, if duplicate source copies exist, or if source times are invalid. A partially constructed grant cannot be silently ignored.

The server Firestore repository now reads grant metadata and copy subcollections during group purge state acquisition and includes every observed grant/copy update time in the opaque basis. Physical group deletion remains disabled until new grant creation is guaranteed to mutate a basis-visible authority and the final commit can re-read/reconcile receipts, grants/copies and source under one serialized path.

## History-grant creation purge barrier — 0.9.6.17

A new group history grant must now mutate a basis-visible group authority in the same transaction that creates its metadata. `beginCloudGroupHistoryGrant` uses one server timestamp to update `groups/{groupId}.updatedAt` and create `historyGrants/{grantId}`. Firestore Rules enforce the same-request barrier through `historyGrantBarrier(groupId)`, which permits only an `updatedAt` change and requires that timestamp to equal `request.time`.

Because the group purge basis includes the group document Firestore update time, a concurrent new grant now invalidates/retries an in-flight purge transaction instead of becoming a phantom subordinate trace outside the observed grant set. Existing matching building-grant retry is idempotent and does not manufacture a new barrier event.

This closes the prerequisite race only. The group physical-delete commit remains fail-closed until receipts, grant copies, grant metadata reconciliation and source deletion are performed under one revalidated path.

## History-copy creation purge barrier — 0.9.6.18

Every genuinely new history-grant copy chunk now updates the parent group `updatedAt` in the same Firestore batch and uses the same server timestamp for the new copy `createdAt` values. Firestore Rules require `historyGrantBarrier(groupId)` for copy creation, so an administrator cannot append a copy without a basis-visible group authority change.

This complements the 0.9.6.17 new-grant barrier. While a grant is `building`, any additional copy creation changes group update-time; activation changes the grant document itself, whose update time is already present in the purge basis. Thus the observed grant/copy trace set can no longer gain a permitted browser-written subordinate document without changing a basis-visible resource.

The group source still must not be deleted until the server repository revalidates and commits all receipt/grant/source traces together.

## Group receipt purge barrier — 0.9.6.19

Every new encrypted group source begins with outer `receiptRevision: 0`. A real Delivered or first Read receipt mutation must atomically advance that source revision by exactly one. Firestore Rules couple both sides: the source update may affect only `receiptRevision` and requires the caller's receipt `updatedAt == request.time`; the receipt create/update requires the corresponding parent revision advance.

The server purge basis already binds the source message Firestore update time. Therefore a receipt that appears or advances after planning changes the source version and causes final purge revalidation to fail/retry rather than deleting the source while leaving an orphan receipt. Repeat receipt no-ops do not manufacture revision changes.

This barrier does not grant browser delete authority. Group physical deletion remains server-only and fail-closed until the full revalidated trace commit is materialized.

## Atomic group physical trace commit — 0.9.6.20

`commitGroupPurge` is now materialized in the single server-only Firestore repository. It performs all authoritative reads before writes in one Firestore transaction: group, disappearing source, source epoch, complete receipt query, complete history-grant query and every grant-copy query. It reconstructs the exact opaque basis and fails with `STALE_PURGE_BASIS` before mutation if any basis-visible authority changed.

After basis equality, the transaction recomputes the pure history-grant trace plan from the re-read rows. It deletes all source message receipts, deletes every history-grant copy whose `sourceMessageId` matches the source, deletes grants made empty, updates retained grants to the remaining `totalCopies` and earliest retained `firstSharedMessageId`/`firstSharedAt`, and finally deletes the shared encrypted source. These mutations commit atomically.

The 0.9.6.17 grant-creation barrier, 0.9.6.18 copy-creation barrier and 0.9.6.19 receipt revision barrier ensure every permitted concurrent browser addition/advance changes a basis-visible resource. Thus a trace cannot be appended behind the transaction's observed set without invalidating the transaction/precondition. Browser delete Rules remain closed.

This makes the Firestore group physical trace commit repository-ready, not product-complete. Local cache/Outbox/object-URL/notification convergence, attachment transport traces, scheduler/discovery and real device validation remain separate required slices.

## Local anti-resurrection decision foundation — 0.9.6.21

`disappearing-local-convergence.js` is the pure local-convergence decision owner. It cannot open IndexedDB, mutate application state, call Firebase, delete cloud data, or use a client clock as deletion authority. It receives an already-classified authoritative remote ID set from the synchronization owner.

A local row is eligible for physical local removal only when it has valid `disappearAfterSeconds`, was explicitly observed as server-backed, and is absent from the authoritative server-backed snapshot. Cache-only absence and never-server-backed queued work do not qualify. Matching encrypted Outbox IDs are returned in the plan so the one local persistence owner can remove them before retry. The planner emits no tombstone.

This is intentionally only the decision foundation. The next slice must carry server-backed/disappearing metadata through direct and group projections, perform serialized IndexedDB history/Outbox removal through the existing UID-scoped owner before reconnect retry, and prove restart/offline convergence. Object URLs, attachment traces and notification payload caches remain separate resources.

## UID-scoped local physical purge wiring — 0.9.6.22
`app.js` already owns the live `fidunio-local` application state, encrypted `history` cache and encrypted `outbox`; it therefore owns physical local message purge rather than introducing a competing storage module. The purge is serialized on one local-purge queue and requires the active authenticated UID. It decrypts history outside a Safari-sensitive read/write transaction, computes exact removals with the pure storage planner, re-encrypts cleaned history, deletes matching Outbox keys in one write transaction, and persists cleaned app state. No tombstone is written. Authority for deciding which IDs qualify remains `disappearing-local-convergence.js`; authoritative snapshot wiring is intentionally deferred to 0.9.6.23.

### 0.9.6.23 authoritative projection boundary
`disappearing-authoritative-projection.js` owns the pure decision between cache merge and server-authoritative convergence. `snapshotMeta.fromCache === true` can never authorize local purge. A server-backed snapshot marks observed remote rows `serverBacked:true`; absence of a previously server-backed disappearing row may then be handed to the existing 0.9.6.22 physical local purge owner. Direct and group app projections execute that physical purge before persisting the new authoritative projection. Group history-grant reads used to rebuild the projection are server-only, while offline encrypted local history remains non-authoritative. This closes the projection-level resurrection path but does not yet prove cold-start/reconnect ordering; that proof belongs to 0.9.6.24.

### 0.9.6.23 final grant-source authority strengthening
Final review caught and closed a subtle group-history resurrection boundary: a grant-only projected copy is not proof that its original source message still exists. `e2ee-account-group-history-projection.js` now marks ordinary retained source rows `authoritativeSource:true` and grant-only rows `authoritativeSource:false`; `disappearing-authoritative-projection.js` excludes grant-only rows from authoritative source-presence IDs and suppresses a grant-only row when authoritative source absence plans that disappearing ID for purge. The permanent projection and group-conversation gates cover this distinction. Full baseline security gate `34059145963` passed on the strengthened implementation. Live Firebase and `htest` were not touched.

### 0.9.6.24 bounded group-purge transaction writes
The known 0.9.6.20 write-limit omission is closed. `disappearing-purge-firestore-admin-adapter.mjs` now computes the complete group purge transaction write count before scheduling any mutation and caps it at 400. Exactly 400 writes are accepted; 401 fails closed with `PURGE_TRACE_TOO_LARGE` and zero scheduled writes. Oversized traces remain intact for a future safe lease/chunk design; there is no source-first chunking, tombstone, browser delete permission, or live Firebase change. Full baseline security gate `34059468538` passed. Runtime version is 0.9.6.24. Weighted ledger is 69.5/100, reported as **70%**. Next allocated build is 0.9.6.25 restart/reconnect stale-client anti-resurrection proof.

### 0.9.6.25 restart/reconnect replay barrier — IN PROGRESS
Runtime version is now **0.9.6.25**. `disappearing-reconnect-recovery.js` is the pure restart/reconnect Outbox decision owner. `firebase.js` remains the sole client Firebase owner and now exposes explicit server-only direct/group source-ID probes; `app.js` remains the sole local mutation/controller owner and serializes reconnect reconciliation before any cloud/group Outbox replay. Server-present Outbox IDs are treated as already accepted, prior-server-backed disappearing IDs that are authoritatively absent are physically purged before retry, and only never-server-backed absent work may replay. Cache-only absence and client time remain non-authoritative; no tombstone is created. Full baseline security gate **34060082292** passed on head `cb05fadc749fd42cdbbccc64fc3bb1972b854d41`.

The build is deliberately **not** marked repository-validated for the 1.0 ledger because one exact crash/idempotency boundary remains unresolved: if Firestore accepts a send and the browser crashes before the Outbox is deleted or any durable `serverBacked:true` observation is recorded, then the source later expires and is physically purged before that device returns, restart state is indistinguishable from genuinely never-sent queued work. A per-message tombstone/accepted-ID registry would violate the current trace-free rule; delaying purge until sender acknowledgement can violate disappearance semantics; a durable per-device/replay-channel high-water mark may solve replay but would intentionally retain non-content anti-replay state caused by expired traffic and therefore needs an explicit architecture/privacy decision before adoption. The contract records `postCommitPreObservationCrashGapClosed:false`. No live Firebase or `htest` change was made. The allocated 0.5 point remains unearned, so weighted completion stays **69.5/100 (70% normal status)**. Do not begin 0.9.6.26 until this boundary is resolved.

### Fail-closed replay boundary (0.9.6.25)
Before any direct/group cloud send, the existing local Outbox owner durably marks the record `sendAttempted:true`. This is local pending-send state, not a deletion tombstone. On reconnect, an attempted ID absent from an authoritative server read is not eligible for automatic replay, because it may have been accepted and subsequently physically purged while the device was away. This closes resurrection without retaining a server accepted-ID/deletion registry. A deliberate user resend creates a new message ID.

### 0.9.6.26 multi-device convergence
Same-UID installations do not share a device-local expiry authority. Each independently treats authoritative server source absence plus its own prior server-backed observation as the convergence signal, then physically removes its local projection/history/Outbox traces through the existing local owner. Cache-only absence cannot purge and attempted stale Outbox state cannot resurrect the source.
