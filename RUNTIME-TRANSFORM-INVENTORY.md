# FIDUNIO Runtime Transform Inventory

**STATUS: PHASE 1 INVENTORY — AUTHORITATIVE FOR RUNTIME CONSOLIDATION**

This inventory records the source-code transformations currently performed by `service-worker.js` against raw `app.js`. No transformation may be deleted until its behavior exists in authoritative repository source and has been validated.

## Current transformations

1. **Live receipt reconciliation / read promotion — MATERIALIZED IN AUTHORITATIVE SOURCE IN 0.9.5.4 — VALIDATION PENDING**
   - Injects server-backed outgoing message-state reconciliation before message decryption.
   - Updates local outgoing Sent/Delivered/Read state from Firestore rows.
   - Marks unread incoming rows Read when the active conversation is open.
   - This is directly related to the validated iPad live Sent -> Read behavior.
   - Fragility: exact string replacement around `existing` and `peerKey` lines.

2. **Per-device E2EE v2 helper functions — production-critical**
   - Injects device-envelope key derivation, envelope encryption, per-device fan-out construction, and device-envelope decryption before `resolvePeerUidForConversation()`.
   - Uses P-256 ECDH + HKDF-SHA256 + AES-GCM.
   - Fragility: exact function-name insertion anchor.

3. **E2EE v2 receive/decrypt branch — production-critical**
   - Replaces the legacy-only `if(m.e2ee)` decrypt block.
   - Handles `e2ee===2` device envelopes and retains legacy `e2ee:1` compatibility.
   - Fragility: exact multiline source replacement.

4. **Direct-send trust-gate change — compatibility behavior / security-sensitive**
   - Replaces the old behavior that blocks sending when the compatibility peer key changes.
   - Leaves key refresh but removes the old account-level changed-key send block because per-device envelope fan-out became authoritative.
   - Fragility: exact multiline replacement plus regex fallback.

5. **Outbox cloud-send conversion to per-device fan-out — production-critical**
   - Replaces legacy single-recipient-key ciphertext generation with `buildDeviceEnvelopes()`.
   - Sends `e2ee:2`, per-device envelopes, recipient device IDs, sender device ID, and sender device public JWK.
   - This is the validated multi-device delivery path.
   - Fragility: exact multiline replacement.

6. **Group Firebase imports — group foundation**
   - Adds `listCloudUsers`, `createCloudGroup`, and `subscribeMyGroups` to `app.js` imports.
   - Fragility: exact import-tail replacement.

7. **Group runtime variables — group foundation**
   - Adds `cloudGroupUnsub` and `groupCandidates` alongside conversation subscription state.
   - Fragility: exact variable declaration replacement.

8. **Cloud group merge/subscription functions — group foundation**
   - Injects `mergeCloudGroup()` and `beginCloudGroupSubscription()` before `stopCloudMessageSubscription()`.
   - Populates real group metadata into the same conversation list while group message transport remains disabled.
   - Fragility: exact function insertion anchor.

9. **Start cloud group subscription on authenticated Firebase lifecycle — group foundation**
   - Adds `beginCloudGroupSubscription()` next to direct-conversation subscription startup.
   - Fragility: exact statement replacement.

10. **Stop cloud group subscription on sign-out — group foundation**
    - Adds cleanup of `cloudGroupUnsub` beside direct-conversation cleanup.
    - Fragility: exact statement replacement.

11. **Replace prototype New Group / Group Details functions — production UI + group foundation**
    - Locates `renderNewGroup()`, `renderGroupName()`, and `renderChat()` by string index.
    - Replaces the whole old prototype group-creation block with real FIDUNIO-user selection and Firestore group metadata creation.
    - Group messaging remains explicitly disabled pending group E2EE.
    - This is especially dangerous because raw `app.js` still contains the old sample-contact/numeric-ID group implementation.
    - Fragility: broad source slicing between function-name anchors.

12. **Block message send for cloud groups — safety-critical group guard**
    - Injects an early guard after `const cloud=!!c?.cloud;` so group message sending remains disabled until group E2EE exists.
    - Fragility: exact statement replacement.

## Consolidation order

Materialize in small validated increments. Recommended order:

1. Live receipt reconciliation/read promotion.
2. Per-device E2EE helper + receive path + fan-out send path as one coherent cryptographic unit.
3. Group Firebase imports/state/subscription lifecycle.
4. Real group UI replacement and cloud-group send guard.
5. Confirm no service-worker transform remains necessary.
6. Reduce service worker to cache/offline duties only.
7. Only then remove prototype runtime seed data and harden genuine empty-account behavior.

## Rule

For each item: add the exact current transformed behavior to authoritative source, remove only that corresponding service-worker transformation, bump visible version, and validate the affected protected behavior before moving to the next item.