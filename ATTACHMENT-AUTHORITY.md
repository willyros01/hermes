# FIDUNIO Attachment Authority v1

## Ownership

`attachment-send-service.js` is the sole attachment send coordinator. `firebase.js` remains the sole Firebase SDK/service owner and is the only client module permitted to call Firebase Storage. `e2ee-account-attachment-crypto.js` is the byte-encryption/chunk-integrity owner. `app.js` owns browser selection/capture intent and the existing encrypted IndexedDB Outbox mutation path.

## Format and ordering

A selected byte object is validated before encryption. Photo <=12 MiB, generic file <=20 MiB, audio <=25 MiB, video <=50 MiB. Encryption uses the existing 256 KiB AES-256-GCM chunk format with attachment/id/index/total AAD and whole-object SHA-256 integrity. Plaintext bytes are never passed to Firebase.

The send transaction is deliberately ordered: validate -> encrypt locally -> persist encrypted Outbox work -> upload ciphertext manifest/chunks -> commit an E2EE direct/group message containing the attachment descriptor/key inside message ciphertext -> remove Outbox only after message commit confirmation. Upload or message failure leaves Outbox authoritative for later retry/cleanup. Attachment transport cannot manufacture independent Sent/Delivered/Read state.

## Cloud schema

Ciphertext objects live below `attachments/{senderUid}/{conversationId}/{messageId}/{attachmentId}/`. `manifest` contains only bounded encrypted-transport metadata and chunks are ciphertext. The attachment key is never stored in Storage or unencrypted Firestore metadata; it travels only inside the existing direct/group E2EE message plaintext before that message is encrypted.

Storage authorization is UID/member scoped. Storage rules may consult Firestore conversation/group membership; no public reads. A sender can create only its own namespace. Recipient reads are authorized only by current conversation/group membership. Deletes remain excluded from ordinary client attachment transport; disappearing-content physical deletion is owned by the dedicated purge authority in 0.9.7.8.

## Phase boundary

0.9.7.0 defines transport/data authority. 0.9.7.1-.4 wire photo/file/audio/video selection and encrypted send. Receive/decrypt/display is 0.9.7.5, offline restart integration 0.9.7.6, receipt closeout 0.9.7.7 and trace-free disappearing attachment purge 0.9.7.8. No live Firebase deployment occurs in these repository builds.

## 0.9.7.5–0.9.7.9 attachment phase closeout — repository validated

Runtime 0.9.7.9 completes the allocated attachment phase: integrity-checked receive/decrypt with explicit object-URL lifecycle; UID-scoped offline/cache recovery policy; message-level receipt authority; trace-free disappearing-attachment purge planning and serialized storage/local-before-source execution; and the permanent attachment closeout matrix. Firebase Storage download remains solely in `firebase.js`. Client Storage deletion remains denied; server purge dependencies are injected into the dedicated purge executor and no live Firebase deployment occurred. Full Rebuild Baseline Security Gate `34064314857` SUCCESS. Next allocated build is 0.9.8.0 invitation deterministic-owner rebuild; rejected 0.9.4.12-.15 invite/install logic remains forbidden.


## 0.9.9.8 Firebase Storage connectivity repair — IN PROGRESS — 2026-09-06
The 0.9.9.7 pre-acceptance connectivity check proved that the prior 0.9.7.x attachment gates were repository-only dependency-injection/source tests, not a real Firebase-backed attachment test. The live default bucket `fidunio-fef13.firebasestorage.app` was then created in `US-CENTRAL1`, the reviewed `storage.rules` compiled and deployed, and Firebase granted the required Storage-Rules-to-Firestore cross-service role. Firestore rules, Functions, Hosting, Auth, App Check, GitHub branches and protected Firebase configuration were not changed by that live setup.

Repository stabilization now registers `storage.rules` in `firebase.json` and adds a permanent Storage deployment-wiring gate. Runtime advances 0.9.9.6 -> 0.9.9.8 because 0.9.9.7 is the device-acceptance gate, not an implementation build. This does not complete attachment acceptance: authenticated real-device upload/download/authorization/offline/purge proof remains required. The 0.9.9.8 point remains unearned until the full repository gate is green and acceptance defects are closed. Overall ledger remains 96.0/100 (96%).
