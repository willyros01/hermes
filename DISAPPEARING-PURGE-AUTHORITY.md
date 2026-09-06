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
