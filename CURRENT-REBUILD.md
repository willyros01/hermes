FCM N3 REPOSITORY CANDIDATE — 1.1.1: Deterministic Settings now has a Notifications panel. Permission is requested only from the explicit Enable Notifications user gesture. One installation ID is retained locally; firebase.js remains sole Firebase owner and reads/writes only users/{uid}/notificationDevices/{installationId}. Exact owner-only Firestore rules + emulator matrix are included. Public VAPID configuration remains intentionally empty in notification-config.js pending the controlled Google/Firebase handoff; no live rules or Messaging configuration has been changed. N2 stale attachment-cache regression assertion was made release-agnostic without weakening attachment purge coverage. Disappearing attachments are device accepted across direct photo/file/audio/video and group photo, including reopen anti-resurrection.

### FIDUNIO 1.1 N2 — FCM OWNERSHIP FOUNDATION — 1.1.0

Repository-only N2 foundation: `firebase.js` remains the sole Firebase initializer and now owns bounded Messaging SDK capability/token APIs. `notification-registration.js` owns only notification registration intent and is dependency-injected; it never initializes Firebase, requests permission, writes message/receipt state, or persists a second message store. `notification-policy.js` keeps generic/opaque routing policy. No notification permission UI, Firestore token document, server push trigger, service-worker push display, or live Firebase configuration is activated in N2. Item 2 disappearing attachments is device accepted: direct photo/file/audio/video plus group photo all purged after authoritative Read and did not resurrect after reopen.

### DISAPPEARING ATTACHMENTS — 0.9.9.19 REPOSITORY CANDIDATE

Item 2 is wired through the existing disappearing-message authority. Future photos/files/audio/video selected while `Disappearing` is enabled receive the same immutable `disappearAfterSeconds` + `disappearingPurgeVersion: 1` metadata as text. The existing scheduled executor remains the one purge coordinator. Its single server repository now receives the already-owned Admin Storage bucket, revalidates the source basis before physical mutation, deletes deterministic encrypted Storage prefix `attachments/{senderUid}/{conversationId}/{messageId}/`, then revalidates again and executes the existing Firestore receipt/grant/source commit with source last. The UID-scoped local purge owner also releases attachment object URLs/runtime entries after authoritative source absence. No client Storage-delete authority, tombstone, second scheduler, or second Firebase owner is introduced. Live activation requires the controlled `att.txt` handoff plus device acceptance.

### DATE/TIME DEVICE ACCEPTANCE — 0.9.9.18

User confirmed group sender name/time, group date separators, and one-to-one/direct date separators are working. These presentation items are closed.

### DIRECT DATE TIMESTAMP CORRECTION — 0.9.9.18

0.9.9.17 correctly broadened the date-separator renderer to direct chats, but real-device testing proved direct rows still showed no date. Root cause: the direct Firestore projection dropped authoritative message `createdAt` while constructing display rows. 0.9.9.18 preserves `createdAt` in that existing projection so the same accepted day-separator renderer can classify direct messages. No Firebase write, E2EE, receipt, Outbox, disappearing-content, attachment, or group authority changed. Release cache revision is bumped.

### DIRECT DATE SEPARATORS — 0.9.9.17

The accepted `Month D, YYYY` horizontal-line date separator now applies to one-to-one/direct conversations as well as group conversations. Message bubbles retain their existing time display; group sender name/time presentation remains unchanged. This is presentation-only and changes no Firebase, E2EE, receipt, Outbox, disappearing-content, attachment, or membership authority. Release cache revision is bumped so installed PWAs deterministically retire the prior shell.

### GROUP SENDER TIME CORRECTION — 0.9.9.16

0.9.9.15 exposed that server-projected/historical group rows may have an empty legacy `time` display field even though authoritative `createdAt` is present. 0.9.9.16 keeps the accepted date separators and sender labels, uses the existing time when present, and otherwise derives `h:mm AM/PM` from `createdAt` beside the sender name. No Firebase, E2EE, Outbox, receipt, disappearing-content, attachment, or membership authority changed.

### GROUP SENDER TIME CANDIDATE — 0.9.9.15

Group conversations retain the accepted horizontal-line date separators from 0.9.9.14 and now also show each message's existing time immediately beside the message creator's displayed name. This is additive presentation only: the existing time inside message metadata remains unchanged, direct-message sender presentation remains unchanged, and no Firebase, E2EE, receipt, Outbox, disappearing-content, attachment, or membership authority changed.

### GROUP DATE SEPARATOR CANDIDATE — 0.9.9.14

Group conversations now insert a centered `Month D, YYYY` date demarcation with horizontal lines before the first visible dated message and whenever the next message falls on a different local calendar day. Individual messages continue to show time only. The accepted 0.9.9.13 sender-name labels remain unchanged. This is presentation-only: no Firebase, E2EE, receipt, Outbox, disappearing-content, attachment, or membership authority changed.

### GROUP SENDER LABEL CANDIDATE — 0.9.9.13

Group message rendering now resolves each message's existing `senderUid` against the current group member projection and displays that FIDUNIO member name above the bubble. The change is presentation-only and applies to group rows, including the local user's outgoing group rows. Direct-message bubble structure remains unchanged. No Firebase, E2EE, receipts, Outbox, disappearing-content, attachment, or group membership write path changed. Permanent regression coverage is included; iPhone/iPad device acceptance remains required.

### OPEN FOLLOW-UP ITEMS — after 0.9.9.12

1. **Disappearing attachments** — photos, files, audio, and video remain intentionally non-disappearing. Future activation must extend the binding `DISAPPEARING-PURGE-AUTHORITY.md` path to physically remove Firebase Storage manifests/chunks and every related durable trace before deleting the authoritative Firestore source message. No attachment disappearance may be enabled until the source-delete-last contract is implemented, permanently gated, live-deployed, and device accepted.
2. **Group chat sender label** — group message bubbles must display the sender's current/displayed FIDUNIO name so recipients can identify who sent each message. This is a group-chat presentation change only; direct-message bubble layout and existing sender/message authority must remain unchanged.

### DISAPPEARING TEXT FEATURE DEVICE CLOSEOUT — 0.9.9.12

Group real-device acceptance passed: sent yes, all tested recipients received, all required Reads confirmed, message disappeared from sender and all recipients, and after close/reopen it did not return. Together with the previously accepted direct 5-minute purge and unread-protection tests, disappearing TEXT is DEVICE ACCEPTED and closed for this activation checkpoint. Attachments remain intentionally non-disappearing until their Storage trace-deletion contract is implemented and separately accepted.

### DISAPPEARING UNREAD-PROTECTION DEVICE ACCEPTANCE — 0.9.9.12

Real-device unread protection passed: a 5-minute disappearing text remained present beyond five minutes while the recipient had not Read it. This confirms expiry is not authorized from send or delivery time and begins only after the authoritative Read condition. Direct disappearing text and unread protection are device accepted; group disappearing text remains the only outstanding acceptance test for this activation checkpoint. Attachments remain intentionally non-disappearing.

### DISAPPEARING DIRECT DEVICE ACCEPTANCE — 0.9.9.12

Fresh direct 5-minute disappearing-text acceptance passed after the live Firestore collection-group index recovery: sent yes, authoritative Read yes, disappeared on sender yes, disappeared on recipient yes, and after close/reopen the message did not return. Direct disappearing text is device accepted. Unread-protection and group behavior remain pending acceptance; attachments remain intentionally non-disappearing in this checkpoint.

### DISAPPEARING LIVE INDEX RECOVERY — 0.9.9.12

Live device/backend diagnosis proved the scheduled purge Function was returning HTTP 500 because Firestore required a `COLLECTION_GROUP ASCENDING` index on collection group `messages`, field `disappearingPurgeVersion`. The reviewed `firestore.indexes.json` index was deployed successfully to `fidunio-fef13`. After index activation, Cloud Scheduler job `firebase-schedule-purgeDisappearingMessagesV1-us-central1` reported `state: ENABLED` with empty `status.code`; the live scheduler invocation boundary is therefore healthy again. Device acceptance must now repeat a fresh 5-minute direct disappearing-text test before closing the feature.

### DISAPPEARING LIVE INDEX REPAIR — 0.9.9.12

Real-device Test 1 proved send and authoritative Read but no purge. Live Function logs isolated the backend failure to `FAILED_PRECONDITION`: the scheduler collection-group query on `messages.disappearingPurgeVersion` lacked its required `COLLECTION_GROUP ASCENDING` Firestore field index. `firestore.indexes.json` is now durable deployment authority for this index and `firebase.json` explicitly references it. Future disappearing scheduler deployment must include Firestore indexes and must verify a successful post-index scheduler invocation; ACTIVE Function + existing scheduler alone is insufficient live proof.

# FIDUNIO Current Rebuild — Recovery Entry Point

### Disappearing text activation — 0.9.9.12

**Status: LIVE BACKEND DEPLOYED AND VERIFIED; DEVICE ACCEPTANCE REQUIRED.**

The previously visible compose selector had policy, immutable metadata, server eligibility, physical Firestore purge repositories, authoritative local convergence and reconnect anti-resurrection foundations, but no scheduled server owner was deployed. 0.9.9.12 adds the missing scheduled Function owner `purgeDisappearingMessagesV1`. Only newly created text messages explicitly stamped `disappearingPurgeVersion: 1` are discoverable by the scheduler. This is an activation boundary: old pre-activation rows and attachment descriptors are intentionally excluded. The scheduler runs from server time, invokes the existing serialized purge executor/revalidated repository path, and never authorizes deletion from a browser clock. Attachments remain non-disappearing in this activation build until Storage trace deletion can satisfy the source-delete-last contract. Live activation completed through the reviewed Cloud Shell handoff. `purgeDisappearingMessagesV1` is ACTIVE in `us-central1` under `fidunio-disappearing-purge@fidunio-fef13.iam.gserviceaccount.com`; scheduler `firebase-schedule-purgeDisappearingMessagesV1-us-central1` exists; reviewed Firestore rules were deployed successfully. Device acceptance is still required before the feature is closed.

## FIDUNIO 1.1 Message Notification authority

`FCM-NOTIFICATION-ARCHITECTURE.md` is now the authoritative architecture for Message Notifications / FCM / Web Push. All future notification work must read it before implementation. FCM is notification/wake-up transport only; Firestore + existing account-authoritative E2EE remain message authority. No plaintext message or attachment content may enter push payloads. N1 architecture is approved; N2-N7 remain future implementation phases. This documentation checkpoint made no live Firebase/Google change and no runtime version change.

## 0.9.9.11 iOS recorded-audio MIME normalization

**Status: DEVICE CANDIDATE.**

Real-device 0.9.9.10 evidence: Audio chooser passed, microphone recorder opened correctly, and the camera did not open; after **Stop & Send**, the recorded clip was rejected before send as `Unsupported attachment type`. Source review showed the recorder was passing `MediaRecorder.mimeType` verbatim into the attachment validator. Browser recorder MIME values may include codec parameters (for example `audio/mp4;codecs=...`), while FIDUNIO's attachment authority deliberately validates canonical media types. 0.9.9.11 normalizes only the recorded-audio MIME to the lower-case base media type before constructing the File. It does not accept video MIME as audio and does not change encryption, Storage, Outbox, limits, or recipient handling.

## 0.9.9.10 Audio source chooser and microphone recorder

**Status: DEVICE CANDIDATE.**

Observed on iPhone: tapping Audio invoked a camera/video capture path; the returned video MIME was then correctly rejected by the audio validator as an unsupported attachment type and showed the 25 MB audio limit. The Audio tool no longer uses the generic capture hint. It now opens **Record Audio / Choose Audio File / Cancel**. Record Audio uses microphone-only `getUserMedia({audio:true, video:false})` plus `MediaRecorder`; Choose Audio File opens `audio/*` without any capture attribute. Both sources converge on the same existing attachment validation, encryption, Storage upload, Outbox/publication and receipt path. No Firebase or E2EE authority changed.

## 0.9.9.9z iPhone composer clearance and video source chooser

**Status: DEVICE CANDIDATE — Issue 3.**

The phone chat no longer assumes a fixed 170px composer footprint. After each phone chat render, and whenever the textarea grows, FIDUNIO measures the actual fixed composer height and applies that exact bottom inset to the message area before scrolling to the bottom. Wide/iPad layout retains its prior scroll path and two-pane behavior.

Video now opens a source chooser with **Photo Library**, **Camera**, and **Cancel**. Both choices feed the existing accepted `chooseAndSendAttachment("video", "video/*", capture)` owner, so attachment validation, picker-session locking, encryption, upload, publication, and the 50 MiB video boundary are unchanged.

## 0.9.9.9y LTE optimistic outgoing-message visibility

**Status: DEVICE CANDIDATE — Issue 2 only.**

Observed device defect: immediately after Wi-Fi → LTE transition, tapping Send could clear the composer while the outgoing text remained absent from the conversation until much later. Source review isolated the visibility delay to `sendCurrent()`: it staged the row in memory, then awaited encrypted IndexedDB Outbox creation and local-state persistence before the first render.

0.9.9.9y renders the staged row immediately, before any awaited Outbox/persistence work. The existing serialized encrypted Outbox remains the sole durable send authority. If durable queueing fails after the row becomes visible, that same row becomes `failed`; the composer is not silently repopulated with the same text. No Firebase, E2EE, receipt, attachment, group-authority, or layout ownership changes are included. Device acceptance must reproduce Wi-Fi → LTE and confirm one tap produces one immediate bubble which later advances normally.

## 0.9.9.9x iOS camera-session continuity

Cross-device testing proved 10-second camera videos (~1.5 MB) send and receive, while 20-second captures on both iPhone and iPad return no bubble, warning, or other trace. This occurs before attachment validation or upload: the detached transient file input and immediate background lock do not reliably survive the longer native-camera session. The picker is now mounted under `document.body`, the security monitor defers background locking only while that picker is active, and the exception ends on file return or cancellation. Issues 2 and 3 remain untouched.

## 0.9.9.9w video failure-path correction

The reported iPhone camera video left a failed partial descriptor that the renderer later treated as a downloadable encrypted attachment. Selection validation now runs before local preview/message creation, so unsupported or over-50-MiB videos produce an immediate actionable alert without inserting a bubble. Any failure after valid staging is rendered explicitly as a send failure and can be deleted; it is never routed to attachment receive/decrypt. LTE optimistic-message visibility and iPhone composer overlap remain separate, pending issues by user direction.

## 0.9.9.9v attachment upload publication barrier

Real-device evidence found a published camera message whose manifest referenced chunk 8 although that object did not exist. Root cause: the UI's attachment staging callback incorrectly queued the Firestore message before Storage upload completed. The publishable direct/group Outbox operation now occurs only inside the post-upload commit callback, after `uploadEncryptedAttachment` has uploaded and verified the manifest and every chunk. An incomplete upload remains local/failed and is never exposed to recipients.

## 0.9.9.9u original-photo and source-choice build

Picture recompression is disabled. FIDUNIO encrypts the exact bytes returned by the selected library picture or camera capture. The Photo tool now opens a dedicated source dialog with **Photo Library**, **Take a Picture**, and **Cancel**; the library picker has no capture hint, while the camera picker explicitly requests the environment camera. Storage CORS and encrypted download behavior are unchanged.

## 2026-09-08 attachment download diagnosis

Device acceptance on 0.9.9.9t proved that upload, metadata verification, download-URL lookup, and version refresh succeed, while Safari fails at the cross-origin object fetch with `storage/unknown: Load failed`. The bounded repair is the root `s.txt` Cloud Shell script, which configures the live Storage bucket CORS for `https://willyros01.github.io`. No Firestore-rule or encryption change is involved.

## Basic direct-message transport candidate — 2026-09-07

By explicit user direction, direct one-to-one text messaging is the immediate priority and must not wait on account-key readiness or manual fingerprint verification. The minimal candidate sends new direct text through the existing authenticated Firestore/Outbox path in the plaintext format already allowed by current rules. Existing encrypted messages remain readable. No Firebase rules, App Check, group, attachment, or deletion change is included. Repository validation, `main` deployment, and real iPad-to-iPhone Sent → Delivered → Read proof remain required.

First iPad launch still exposed a legacy key-change/fingerprint banner. The follow-up removes direct-chat key status banners and routes the Info button to plain Chat Info; it does not expose verification or key controls.

Device proof confirms iPad → iPhone message transmission. The remaining Sent status is a Read-receipt return defect. The bounded candidate calls the existing recipient-only conversation Read owner whenever the direct chat opens, so a cached first snapshot cannot skip the server receipt.

The first receipt candidate failed device proof after two iPhone restarts. Root cause refinement: the Firestore listener omitted metadata-change delivery, so an incoming message displayed from cache did not necessarily generate a second server-confirmed callback. Version **0.9.9.8c** enables metadata changes, preserves actual snapshot authority on listener reuse, and gives testers a visible candidate identifier.

0.9.9.8c also failed device receipt proof. The iPad listener is demonstrably active because its conversation timestamp advanced with the 8:10 PM send. The receiver callback still performed a compatibility-key lookup before processing every snapshot, including plaintext. Candidate **0.9.9.8d** bypasses that lookup for basic messages, uses server-authoritative rows for explicit open-chat Read recovery, and no longer swallows receipt-write failures.

0.9.9.8d failed four device attempts and is rejected. Candidate **0.9.9.8e** applies the basic contract directly: any unread incoming message displayed in the currently open chat immediately attempts the existing Firestore Read update, regardless of cache metadata. Failure becomes a visible `Read receipt failed` message.

0.9.9.8e device evidence exposed the exact failure: Firebase returns `Missing or insufficient permissions` to the iPhone Read write. This proves listener execution and rejects further UI/lifecycle speculation. The rules gate previously covered plaintext creation but not plaintext receipt update; exact emulator coverage is now mandatory before any live rules action.

The reviewed repository rules were deployed to live project `fidunio-fef13` through the verified Cloud Shell REST script. Live ruleset `6f6d9fda-0698-48db-b1a9-b9dde31b9456` replaced `52ea515e-359f-453f-8822-3c0f6ef2659a`. Client version remains 0.9.9.8e because this was backend-only; real-device receipt confirmation remains required.

Real-device iPad → iPhone Read receipt proof passed after the rules deployment. Candidate **0.9.9.9a** restores the already-validated account E2EE v3 envelope at the sole serialized direct Outbox send boundary, enables the existing sender-owned Delete for Everyone callable UI, and mounts one reusable six-slot FIDUNIO PIN control in the signed-out login and local-unlock screens. Login now unlocks the existing account encryption with the entered password and PIN; ordinary chat remains free of key-management prompts. Delete for Everyone still requires live deployment of its dedicated callable before device acceptance.

**0.9.9.9b unlock correction:** 0.9.9.9a incorrectly required password plus PIN on a remembered session and `app.js` then rebound the READY identity back to LOCKED. The corrected flow retains the non-extractable account key in UID/keyId/revision-bound local storage after setup, restores it only after PIN or biometric authorization, clears it on sign-out, and never rebinds a READY runtime. Password plus PIN is limited to sign-in, first setup, or recovery. A stale password wrapper gets one bounded recovery attempt that preserves the same identity.

**0.9.9.9c Delete for Me:** accepted sent or received direct/group messages now expose a local-only deletion action. The encrypted local state retains hidden message IDs per conversation so later Firestore snapshots cannot restore them on that device. Delete for Me never calls Firebase delete and does not affect the other participant. Pending cancellation and sender-only Delete for Everyone remain separate paths.

**0.9.9.9d lock and Groups correction:** `visibilitychange=hidden` and iOS `pagehide` now lock immediately instead of waiting for the inactivity timeout. The iPad Groups button owns a real Groups route with a group list and explicit New Group action; it no longer attempts to open a nonexistent first group and silently remain in the current chat.

**0.9.9.9e receipt, appearance, and delete-action correction:** displayed unread direct messages now have one bulk receipt owner, eliminating the false permission warning caused by competing receipt writes. Auto appearance supports both current and older iOS media-query change listeners. Delete for Me and Delete for Everyone share one row, with Cancel separated beneath them.

**0.9.9.9f PIN focus correction:** live message and connection callbacks no longer replace an already-mounted local unlock screen. A PIN being entered retains all digits and focus through the sixth box instead of unexpectedly returning to box one.

**0.9.9.9g login-join:** the Sign In branch contains only email and password and enters directly after successful Firebase authentication by restoring the device's saved encryption identity. The separate Join branch collects invitation code, display name, email, password, and one six-digit PIN, then establishes account E2EE and local unlock before entering. Sign-out preserves the UID-bound local encryption identity so the next successful password sign-in does not ask for PIN; PIN/biometrics remain for a still-signed-in session returning from local lock.

**0.9.9.9h authentication navigation:** the approved prototype is implemented as two large side-by-side graphic tiles with distinct Sign In and Join icons. The selected tile has an accent surface and explicit tab semantics; the full-width form submission button remains visually and structurally separate below.

**0.9.9.9i button progress feedback:** one bootstrap-owned busy treatment observes action buttons that disable while asynchronous work runs, adds an accessible spinner, and removes it when the action completes or the button is replaced by the next rendered screen. Password reset and message Send now participate explicitly. Instant navigation remains immediate.

**0.9.9.9j group-send correction:** the composer clears and Send becomes single-flight before encrypted Outbox work begins, so repeated taps cannot duplicate a message. Group completion now renders Sent immediately. If a row is stale at Sending after its Outbox record has already completed, Delete Message falls back to local Delete for Me. Group receipt rules remove the circular parent/receipt dependency while retaining membership, ownership, existing-message, and monotonic-state checks. Live group receipt repair requires deployment of the reviewed `firestore.rules` with `g.txt`.

**0.9.9.9k sender-owned group deletion:** accepted group messages expose Delete for Everyone only to their original sender. The existing authenticated delete callable now distinguishes direct and group authority, rechecks immutable `senderUid` plus current group membership on the server, and removes the group source, receipt subcollection, encrypted attachment prefix, and any history-grant copies while repairing grant metadata. Other members retain local-only Delete for Me.

**0.9.9.9l group Outbox epoch correction:** group initialization returned the active epoch under `authority.keyEpoch`, but Outbox preparation read the nonexistent wrapper field `epoch.keyEpoch`. `Number(undefined)` serialized as null, so the bounded bridge rejected the record as an unsupported group Outbox payload. Preparation now captures `epoch.authority.keyEpoch`, with a permanent regression assertion.

**0.9.9.9o attachment receive UI:** a decrypted attachment descriptor is no longer rendered as chat text. The app recognizes the bounded attachment envelope, uses the existing encrypted attachment receive service to download, integrity-check, and decrypt it, then renders photos from a temporary object URL. Pending uploads, downloads, failures, and retry are explicit without exposing storage paths or key material. Object URLs are released at sign-out.

**0.9.9.9p mobile attachment download completion:** the shared sender/receiver stall was below rendering: encrypted chunks were fetched strictly serially. The Storage owner now uses a bounded six-worker download pool while preserving chunk order, and gives each Storage read a 30-second timeout. A stalled request therefore reaches the existing retry UI instead of waiting forever. The PWA shell now explicitly precaches the Firebase Storage SDK.

**0.9.9.9q immediate sender preview:** the selected browser `File` becomes visible immediately through `URL.createObjectURL(file)`, before `arrayBuffer()`, encryption, or upload. This is a pointer to the selected object rather than another picture copy. The preview retains the normal Sending/Sent/Failed status and is revoked on sign-out; after restart the encrypted remote copy is downloaded normally.

**0.9.9.9r pre-encryption photo compression:** photos are decoded locally, proportionally resized to at most 1600 pixels on the longest edge, and JPEG-encoded at 76% quality. The compressed result is used only when it is smaller than the source, then encrypted and uploaded through the existing attachment path. No plaintext is uploaded. The receiving browser naturally decodes the JPEG after local decryption; unsupported image conversion safely falls back to the original file.

**0.9.9.9s attachment-stage proof:** device evidence established that no Firebase-backed picture download has ever passed; the only displayed picture was the ephemeral sender object URL. The prior UI discarded the causal error. Upload now performs authenticated metadata verification for the manifest and every chunk before committing the message. Download and receive preserve bounded stage/error information in the visible retry card without exposing paths or key material. This diagnostic is required to distinguish Storage authorization, missing objects, malformed data, and cryptographic verification on a real device.

**0.9.9.9t manifest transport correction:** real-device evidence isolated the failure to the first manifest request: `getBytes()` timed out even though post-upload authenticated metadata verification confirmed the object. The receive owner now asks Firebase for an authenticated download URL, fetches the still-encrypted object with a 15-second abort boundary, enforces the one-megabyte object limit before parsing, and never persists or transmits the temporary URL.

**0.9.9.9m stored-Outbox repair:** previously malformed group records may remain encrypted in IndexedDB with a null epoch and continue generating the same rejection after the new-write correction. The bounded bridge now recognizes a group record by its discriminator plus group/message IDs; flush treats a non-integer legacy epoch as missing, revalidates membership and current epoch through server authority, and re-encrypts before sending. It does not weaken Firebase authorization.

**Sole authoritative development and deployment branch:** `main`

If a ChatGPT session is interrupted or a handover is required, start here:

1. Read `hermes-memory.txt` completely, beginning with its mandatory-first-read instructions.
2. Read `FIDUNIO-BUILD-CHECKLIST.md` completely and use it as the authoritative operational completion ledger.
3. Read the architecture/security documents required by `hermes-memory.txt` before consequential code changes.
4. Perform executable development directly on `main`; every substantive candidate must pass the normal security baseline before device acceptance credit.

Current product decision: disappearing direct and group messages use a fixed interval that starts from each recipient account's first authoritative Read event. Group timers are per recipient, not first-reader-global. Exact purge implementation remains in progress.

## Branch authority transition — 2026-09-07

By explicit user direction, `main` is now the single authority for application code, durable documentation, repository validation and GitHub Pages device testing. `fidunio-complete-rebuild` is a historical checkpoint only and must not receive new work or overwrite `main`. The former automatic recovery-document mirror is removed. The permanent Rebuild Baseline Security Gate runs on pushes to `main`. Protected Firebase configuration remains unchanged.

## 0.9.9.8 readonly transport-row repair — 2026-09-07

First direct-on-`main` iPad evidence showed `Attempted to assign to readonly property` and a row stuck at Sending. The disappearing compose policy froze the whole row, conflicting with the existing Outbox owner's required status mutation. The candidate keeps one-time expiry stamping but returns an application-owned mutable row, with regression coverage that transport state changes while expiry remains unchanged. Cache revision `001f`; full main gate/deployment/device proof pending. Completion remains 96%.

## 0.9.6.16 purge continuation
Group disappearing purge now has deterministic history-grant trace planning and grant/copy versions in its server read basis. Physical group deletion remains deliberately fail-closed pending a race-safe new-grant barrier and one revalidated receipt/grant/source commit. Live Firebase and htest remain untouched.

## 0.9.6.17 purge barrier
New group history-grant creation is now basis-visible to disappearing purge: the same transaction must update group `updatedAt`, and repository Rules enforce that barrier. Clean gate `34054522196` passed. Physical group deletion remains fail-closed pending one revalidated receipt/grant/source commit. No live Firebase or htest change.

## 0.9.6.18 copy purge barrier
New group history-copy writes are now basis-visible: every genuinely new copy chunk must atomically update group `updatedAt`, and repository Rules enforce it. Clean gate `34054991773` passed. Group physical trace deletion remains the next secure slice. Live Firebase and htest remain untouched.

## 0.9.6.19 receipt purge barrier
Group receipt creation/advance is now purge-basis-visible through an atomic parent `receiptRevision`. Clean gate `34055638377` passed. Group physical trace deletion remains fail-closed; next work is the bounded server trace commit, then local/offline anti-resurrection. Live Firebase and htest remain untouched.

## 0.9.6.20 atomic group physical trace commit
The server-only repository now revalidates and atomically removes/reconciles the complete Firestore group disappearing-message trace set. Browser deletes remain closed. Next security slice is local/offline anti-resurrection convergence (cache + encrypted Outbox, then remaining attachment/notification traces). Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.

## 0.9.6.21 local anti-resurrection decision foundation
A pure local convergence planner now requires explicit prior server-backed observation plus authoritative server absence before identifying disappearing cache/Outbox traces for removal. Cache-only absence and device time remain non-authoritative; no tombstone is created. Next work is serialized IndexedDB/application wiring and restart/reconnect proof, then remaining attachment/object-URL/notification traces. Live Firebase and htest remain untouched. Overall first rebuild remains approximately 65%.

## 0.9.6.22 local physical purge wiring
The existing application/local-persistence owner can now physically remove planned disappearing IDs from live message state, encrypted history and matching encrypted Outbox rows under one serialized active-UID guard, with no tombstone. Full security gate `34058248816` is SUCCESS, so the build earns its allocated +1.0 point and weighted completion is now 68%. Next allocated work after green validation is 0.9.6.23 authoritative direct/group projection convergence. Live Firebase and htest remain untouched.

## 0.9.6.23 authoritative projection convergence
Direct and group message projections now distinguish cache-only snapshots from server-backed authority. Server-backed rows retain explicit disappearing metadata and prior-server observation; authoritative absence invokes the existing local convergence planner and serialized physical purge before projection persistence. Cache-only emptiness cannot purge. Group snapshot metadata now reaches the app projection, and granted-history authority is refreshed from server so stale cached grant copies cannot become authoritative resurrection material. Full gate `34059145963` passed. Weighted first-rebuild completion is **69%**. Next allocated build is 0.9.6.24 restart/reconnect stale-client anti-resurrection proof. Live Firebase and htest remain untouched.

### 0.9.6.23 final grant-source authority strengthening
Final review caught and closed a subtle group-history resurrection boundary: a grant-only projected copy is not proof that its original source message still exists. `e2ee-account-group-history-projection.js` now marks ordinary retained source rows `authoritativeSource:true` and grant-only rows `authoritativeSource:false`; `disappearing-authoritative-projection.js` excludes grant-only rows from authoritative source-presence IDs and suppresses a grant-only row when authoritative source absence plans that disappearing ID for purge. The permanent projection and group-conversation gates cover this distinction. Full baseline security gate `34059145963` passed on the strengthened implementation. Live Firebase and `htest` were not touched.

### Mandatory build reallocation after 0.9.6.23
Repository review reconfirmed the known 0.9.6.20 omission: group physical purge still lacks an explicit conservative transaction write-count ceiling. Per the pre-allocation rule, this security repair is allocated **before implementation** as 0.9.6.24. The previous 0.9.6.24–0.9.6.29 work shifts to 0.9.6.25–0.9.6.30. The weighted denominator remains 100: 0.9.6.24 receives 0.5 point and restart/reconnect 0.9.6.25 receives 0.5 point; later shifted builds retain their prior points. Current earned completion remains 69%.

### 0.9.6.24 bounded group-purge transaction writes
The known 0.9.6.20 write-limit omission is closed. `disappearing-purge-firestore-admin-adapter.mjs` now computes the complete group purge transaction write count before scheduling any mutation and caps it at 400. Exactly 400 writes are accepted; 401 fails closed with `PURGE_TRACE_TOO_LARGE` and zero scheduled writes. Oversized traces remain intact for a future safe lease/chunk design; there is no source-first chunking, tombstone, browser delete permission, or live Firebase change. Full baseline security gate `34059468538` passed. Runtime version is 0.9.6.24. Weighted ledger is 69.5/100, reported as **70%**. Next allocated build is 0.9.6.25 restart/reconnect stale-client anti-resurrection proof.

### 0.9.6.25 restart/reconnect replay barrier — IN PROGRESS
Runtime version is now **0.9.6.25**. `disappearing-reconnect-recovery.js` is the pure restart/reconnect Outbox decision owner. `firebase.js` remains the sole client Firebase owner and now exposes explicit server-only direct/group source-ID probes; `app.js` remains the sole local mutation/controller owner and serializes reconnect reconciliation before any cloud/group Outbox replay. Server-present Outbox IDs are treated as already accepted, prior-server-backed disappearing IDs that are authoritatively absent are physically purged before retry, and only never-server-backed absent work may replay. Cache-only absence and client time remain non-authoritative; no tombstone is created. Full baseline security gate **34060082292** passed on head `cb05fadc749fd42cdbbccc64fc3bb1972b854d41`.

The build is deliberately **not** marked repository-validated for the 1.0 ledger because one exact crash/idempotency boundary remains unresolved: if Firestore accepts a send and the browser crashes before the Outbox is deleted or any durable `serverBacked:true` observation is recorded, then the source later expires and is physically purged before that device returns, restart state is indistinguishable from genuinely never-sent queued work. A per-message tombstone/accepted-ID registry would violate the current trace-free rule; delaying purge until sender acknowledgement can violate disappearance semantics; a durable per-device/replay-channel high-water mark may solve replay but would intentionally retain non-content anti-replay state caused by expired traffic and therefore needs an explicit architecture/privacy decision before adoption. The contract records `postCommitPreObservationCrashGapClosed:false`. No live Firebase or `htest` change was made. The allocated 0.5 point remains unearned, so weighted completion stays **69.5/100 (70% normal status)**. Do not begin 0.9.6.26 until this boundary is resolved.

### 0.9.6.25 fail-closed restart/reconnect closeout — REPOSITORY-VALIDATED
User approved the conservative fail-closed resolution for the post-commit/pre-observation crash boundary. The encrypted IndexedDB Outbox now records `sendAttempted:true` durably before direct or group cloud transmission. Reconnect performs an authoritative server read first. Server-present IDs are accepted and their stale Outbox record is removed; prior-server-backed disappearing IDs that are authoritatively absent are physically purged; never-attempted and never-server-backed work may replay; but an attempted ID that is authoritatively absent is marked failed and **never automatically replayed** because FIDUNIO cannot distinguish a definite pre-commit failure from accepted-then-expired content after a crash. The sender can deliberately send a new message instead. No server tombstone, accepted-ID registry, client clock authority, reload or timer-rescue architecture was introduced.

Focused materialization test passed and full baseline security gate `34060880885` is SUCCESS on `593c078727b6e5fc062a0b20e9d3cf88b2bc1797`. Build 0.9.6.25 earns its allocated 0.5 point, making the weighted ledger **70.0/100 (70%)**. Next allocated build is **0.9.6.26 multi-device expiry convergence foundation**. Live Firebase and `htest` remain untouched.

### Combined 0.9.6.26 / 0.9.6.27 pass — REPOSITORY-VALIDATED
0.9.6.26 proves same-UID installations independently converge a server-backed disappearing message after authoritative source purge: live projection, encrypted history and matching encrypted Outbox traces are removed on each device, while cache-only absence cannot authorize purge and attempted stale Outbox work cannot replay. 0.9.6.27 adds one persisted future-message duration preference and compact composer control. The pure compose owner normalizes Off/5m/1h/1d/7d; `app.js` snapshots the selection into a newly created message and propagates it through both direct and group encrypted Outbox/send paths. Already-sent message metadata is not rewritten when the preference changes. Full gate `34061730677` SUCCESS on `b3086fb894b2e9d904264300b60c04a68668f3dc`. Runtime 0.9.6.27. Weighted completion **72.0/100**. Next allocated build: **0.9.6.28 disappearing text end-to-end security closeout**. Live Firebase and `htest` untouched.

## 0.9.6.28-0.9.6.30 combined repository checkpoint
The three pre-attachment builds are repository-validated by full gate `34062508968` SUCCESS. Disappearing text has a permanent end-to-end closeout matrix; Group Info now delegates admin beginning/date earlier-history grants to the validated server-backed grant runtime; direct Read receipt mutation has one deterministic subscription path with foreground/pageshow recovery retained. Runtime is 0.9.6.30 and weighted completion is 75%. Next work is 0.9.7.0 attachment transport/data authority. Real-device receipt proof remains in the release-candidate acceptance phase. Live Firebase and htest remain untouched.

## 0.9.7.0–0.9.7.4 attachment send checkpoint — repository validated

Builds 0.9.7.0 through 0.9.7.4 establish one attachment send owner and wire photo, file, audio and video selection/capture through bounded local AES-256-GCM chunk encryption, encrypted Outbox staging, ciphertext-only Firebase Storage upload through `firebase.js`, and the existing direct/group E2EE message commit path. Attachment keys travel only inside E2EE message ciphertext. Size limits are photo 12 MiB, file 20 MiB, audio 25 MiB, video 50 MiB. Storage client delete is denied; disappearing attachment deletion remains reserved for the purge owner in 0.9.7.8. Full Rebuild Baseline Security Gate `34063327957` SUCCESS. No live Firebase or htest deployment occurred. Runtime version is 0.9.7.4. Next build is 0.9.7.5 receive/decrypt/display/play.

## 0.9.7.5–0.9.7.9 attachment phase closeout — repository validated

Runtime 0.9.7.9 completes the allocated attachment phase: integrity-checked receive/decrypt with explicit object-URL lifecycle; UID-scoped offline/cache recovery policy; message-level receipt authority; trace-free disappearing-attachment purge planning and serialized storage/local-before-source execution; and the permanent attachment closeout matrix. Firebase Storage download remains solely in `firebase.js`. Client Storage deletion remains denied; server purge dependencies are injected into the dedicated purge executor and no live Firebase deployment occurred. Full Rebuild Baseline Security Gate `34064314857` SUCCESS. Next allocated build is 0.9.8.0 invitation deterministic-owner rebuild; rejected 0.9.4.12-.15 invite/install logic remains forbidden.

## 0.9.8.0–0.9.8.5 invitation/install checkpoint — repository validated

Runtime 0.9.8.5 completes the invitation/join/install phase. `invitation-owner.js` is the sole serialized invitation mutation coordinator while `firebase.js` remains the sole Firebase repository/SDK owner. Pure `invitation-policy.js` enforces single-use lifecycle, issuer roles and target roles. Auth and Settings request invitation work through that owner. Firestore emulator coverage proves anonymous validation of a known token, unauthorized issuance/revocation denial, owner issuance/revocation, atomic accepted-invitation + active-profile enrollment, and second-redemption denial. Joined active profiles flow into existing direct/group discovery without device binding.

`install-guidance.js` owns only an optional predefined Settings Install panel. It never mutates invitation, account, messaging or service-worker state and never uses automatic install prompting. iOS uses Safari Share -> Add to Home Screen; Android/Fire and desktop use browser-provided install/add/shortcut commands when available. The rejected 0.9.4.12–0.9.4.15 invite/install logic was not restored or adapted. Protected iPhone Back/wrap, Settings deterministic ownership and two-pane architecture remain gated. Full Rebuild Baseline Security Gate `34065528714` SUCCESS. No live Firebase or htest deployment occurred. Next allocated build: 0.9.9.0 Group Info completion.


## 0.9.9.0-0.9.9.5 repository candidate checkpoint — 2026-09-06
Group Info landscape/responsive completion, real Direct Chat Info-only behavior, prototype/simulation retirement and responsive/lifecycle hardening are repository-validated. Permanent candidate UI/lifecycle coverage is in the normal baseline. Full gate 34066875377 SUCCESS. Runtime checkpoint 0.9.9.5. Weighted ledger 95.5/100 (reported 96%). Next: 0.9.9.6 atomic htest deployment. Do not claim 0.9.9.7 device acceptance until the user actually tests iPhone/iPad/two-account/offline/disappearing/attachments/invitation/install/recovery. Live Firebase is still not to be changed.


## 0.9.9.6 htest deployment checkpoint — 2026-09-06
Full gate 34067021824 SUCCESS on exact candidate 31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6; htest branch created at that exact SHA with runtime 0.9.9.6. Weighted ledger 96.0/100. 0.9.9.7 is now CURRENT but BLOCKED — USER DEVICE PROOF. Do not award 0.9.9.7, run 0.9.9.8 stabilization, or claim 0.9.9.9 promotion readiness without actual device acceptance evidence. Live Firebase remains untouched.


## 0.9.9.6 htest deployment checkpoint — 2026-09-06
Full gate 34067021824 SUCCESS on exact candidate 31dac2c0b551429a5a4ba7cf7c967e6316e9a9e6; htest branch created at that exact SHA with runtime 0.9.9.6. Weighted ledger 96.0/100. 0.9.9.7 is now CURRENT but BLOCKED — USER DEVICE PROOF. Do not award 0.9.9.7, run 0.9.9.8 stabilization, or claim 0.9.9.9 promotion readiness without actual device acceptance evidence. Live Firebase remains untouched.


## 0.9.9.8 Firebase Storage connectivity repair — IN PROGRESS — 2026-09-06
The 0.9.9.7 pre-acceptance connectivity check proved that the prior 0.9.7.x attachment gates were repository-only dependency-injection/source tests, not a real Firebase-backed attachment test. The live default bucket `fidunio-fef13.firebasestorage.app` was then created in `US-CENTRAL1`, the reviewed `storage.rules` compiled and deployed, and Firebase granted the required Storage-Rules-to-Firestore cross-service role. Firestore rules, Functions, Hosting, Auth, App Check, GitHub branches and protected Firebase configuration were not changed by that live setup.

Repository stabilization now registers `storage.rules` in `firebase.json` and adds a permanent Storage deployment-wiring gate. Runtime advances 0.9.9.6 -> 0.9.9.8 because 0.9.9.7 is the device-acceptance gate, not an implementation build. This does not complete attachment acceptance: authenticated real-device upload/download/authorization/offline/purge proof remains required. The 0.9.9.8 point remains unearned until the full repository gate is green and acceptance defects are closed. Overall ledger remains 96.0/100 (96%).


### 0.9.9.8 repository validation checkpoint — 2026-09-06
Commit `34c8d237eb8f08b8228f670b8ca958038b553aef` registers `storage.rules` in `firebase.json`, adds the permanent `storage-deployment-wiring.test.mjs` gate, advances runtime to 0.9.9.8, and preserves `firebase-config.js` unchanged at blob `b81026dcc07b7374d1f48d0cb094764ce28319bd`. Full Rebuild Baseline Security Gate `34072294756` completed SUCCESS, including the new Firebase Storage deployment-wiring step. This proves repository deployability, not real attachment operation. 0.9.9.8 remains IN PROGRESS pending authenticated iPhone/iPad upload, second-device download/decrypt, unauthorized denial, offline/reconnect and disappearing-attachment purge proof. No additional completion credit is earned; overall remains 96.0/100 (96%).


## 0.9.9.7 iPad acceptance failure — 2026-09-06

Real-device testing on the promoted `main` build exposed three release-candidate blockers: missing conversation widgets, materially regressed iPad text size, and conversation-pane overlap. The durable detailed records are FDA-IPAD-001 through FDA-IPAD-003 in `DEVICE-ACCEPTANCE-BUGS.md`. These are user-observed device failures, not repository simulations. Build 0.9.9.7 remains FAILED/BLOCKED; 0.9.9.8 remains the allocated RC stabilization build and earns no point until repair, full required gates, redeployment and repeated user acceptance. Overall completion remains 96.0/100.0 (96%).


## 0.9.9.8 iPad RC repair candidate — 2026-09-07

The bounded repair candidate addresses FDA-IPAD-001 through FDA-IPAD-003 without changing Firebase/E2EE/storage ownership. It separates Sign Out from the constrained tablet icon cluster, makes tablet brand/navigation/tool labels scale from the established root A/A+/A++ owner, changes the obsolete eight-slot tablet attachment grid to the four supported tools, and distinguishes Firebase conversation discovery from authoritative empty/error state. It does not fabricate conversations or restore quarantined cross-account data. Targeted iPad stabilization, release-candidate UI/lifecycle and Storage-wiring gates pass locally. Full baseline, promotion to `main`, Pages deployment and repeated user-device acceptance remain pending. Defects remain OPEN; 0.9.9.8 earns no point and total completion remains 96.0/100.0 (96%).


## 0.9.9.8 second iPad acceptance evidence — 2026-09-07

The first repair restored the real cloud conversation and composer/widgets and removed the horizontal Sign Out collision. The user screenshot also exposed FDA-IPAD-004 (standalone status-bar header clipping) and FDA-IPAD-005 (unused right-side viewport). A tablet-only follow-up candidate adds a bounded safe-top fallback and gives the existing `#app`/tablet-shell owner full flex width. Targeted iPad, candidate UI and receipt-lifecycle gates pass locally. All five device defects remain open until full baseline, `main` deployment and repeated user acceptance. Completion remains 96.0/100.0 (96%).


## 0.9.9.8 third iPad acceptance finding — 2026-09-07

The second screenshot confirms the safe-area and full-width repairs visually, while exposing FDA-IPAD-006: iPad painted the native disappearing selector white inside the dark composer. The bounded CSS-only candidate themes the existing selector with the established panel/accent/ink variables and preserves an accessible 42px target. No render, Firebase, storage, E2EE or receipt owner changes. Targeted gates and user acceptance remain required; completion remains 96%.

## FDA-IPAD-006 deferred visual-alignment evidence — 2026-09-07

The deployed theme repair removed the white native selector and preserved readability, but user-device evidence shows the selector is not aesthetically aligned with the quick-reply widgets. At the user's direction, no additional code change is made now. Keep FDA-IPAD-006 OPEN — DEFERRED and combine its visual-alignment repair with the next necessary 0.9.9.8 acceptance defect repair. No Firebase, E2EE, storage, receipt or disappearing-message ownership change is authorized. Completion remains 96%.

## FDA-DM-001 direct send stall — 2026-09-07

The first resumed direct-message device test failed: the iPad message `IPAD TEST 1` remained at Sending for more than one minute. The encrypted Outbox row is created and Sending is rendered before authoritative reconnect reconciliation completes. Its server-read chain is unbounded, so a stalled Firebase promise can leave the message at Sending before the actual encrypted Firestore write is attempted. This is a critical 0.9.9.8 acceptance blocker. Repair must remain inside the existing serialized Outbox/reconnect path and fail closed without fabricated receipts. Completion remains 96%.

## FDA-DM-001 bounded repair candidate — 2026-09-07

The existing `app.js` Outbox/reconnect owner now applies a 12-second boundary to authoritative reconciliation. A timeout returns only unattempted Outbox-backed Sending rows to Queued, preserves their encrypted Outbox records, and explicitly reports the Firebase timeout for the initiating sender. Attempted rows cannot be selected and no receipt state is manufactured. Permanent regression coverage is wired into the full baseline; targeted Outbox, receipt and runtime-authority gates pass locally. Full baseline, corrected `main` deployment and real-device acceptance remain required. Completion remains 96%.

## FDA-DM-001 expanded repair after failed retest — 2026-09-07

The first promoted candidate did not pass device acceptance: an existing Failed message returned to Sending and two newly sent messages remained Sending for more than one minute. The corrected candidate now serializes the complete reconcile/encrypt/send cycle, bounds every Firebase-dependent direct-send stage, prevents attempted rows from returning to the replay queue, and revises the service-worker shell cache while retaining runtime 0.9.9.8. This is still a candidate. Full baseline, corrected `main` deployment and fresh user-device proof remain mandatory. Completion remains 96%.

### Expanded candidate validation and deployment — 2026-09-07

Commit `90460aea19c0d5204c91b2542d59905b1edff246` passed full Rebuild Baseline Security Gate `34085040014`. It was promoted to `main` at `321d182cbd08cb690fa4df7caf96221ef69d09b4`; Pages run `34085354728` succeeded and live code/cache anchors were verified. FDA-DM-001 remains OPEN pending the user's fresh installed-iPad observation and authenticated Firebase send/receipt proof. Completion remains 96%.

## Current device evidence — queued correctly; Firebase connectivity unresolved — 2026-09-07

The second iPad launch shows both preserved messages as Queued. The repair therefore prevents indefinite Sending and preserves Outbox authority without false receipts. The underlying authenticated Firebase path still does not complete, so FDA-DM-001 remains open and further test sends are paused pending connectivity diagnosis. New minor FDA-IOS-001 records the iPhone's blank startup/login interval and defers an accessible spinner/loading state to a later bundled minor repair. Completion remains 96%.

## FDA-DM-001 authenticated Firebase session repair candidate — 2026-09-07

The Verify action was incorrectly bypassing the serialized authoritative reconcile/Outbox cycle and calling the lower-level queue flush. The candidate removes that competing trigger, routes all verification retries through the established owner, and uses sole `firebase.js` owner to force-refresh the authenticated ID token before reconciliation. Bounded errors identify auth refresh, reconciliation, peer resolution, envelope preparation or send confirmation. The user did not compare fingerprints before pressing Verify, so verification is treated only as a saved trust decision; keys are not reset. Runtime remains 0.9.9.8, completion remains 96%, and the defect stays open pending gate/deployment/device proof.

Candidate `6e6d5e84beb7e12173a5708835842512d44a92d4` passed complete baseline `34087534090` and was promoted to `main` as `529a56d1f8e45d463a47d8c6150f95b4937ee87b`. Firebase adapter run `34087731108` and Pages run `34087730948` succeeded. Live code/cache/config anchors were verified. FDA-DM-001 remains open solely pending fresh two-device transport/receipt evidence; completion remains 96%.

## 0.9.9.8 retry-backlog/startup/PIN fail-closed candidate — 2026-09-07

Fresh device evidence rejected the preceding candidate: launch remained blank for more than two minutes, the iPhone PIN appeared unset, and `ipad test 3` returned Sending → Queued after restart. The current candidate coalesces the three lifecycle recovery triggers instead of stacking bounded cycles; removes mandatory network token refresh from ordinary sends; shows retained Firebase stage errors; adds a large static startup spinner before asynchronous bootstrap; and treats local PIN storage failure as locked/unavailable rather than unconfigured. FDA-DM-001, FDA-IOS-001 and new FDA-IOS-002 remain open. Runtime remains 0.9.9.8 and completion remains 96%.

Authoritative `429855f037c3f9f0fb2a0f31ff1371a21f273922` passed full baseline `34125430406`; promoted `main` is `2dcbd8a558ed8bf355ebec1c6bbc82e59948b29f`; Pages `34125666157` succeeded. Live corrected anchors and protected config were verified. Device acceptance remains required and completion remains 96%.

## Device result: startup/PIN repaired; Account E2EE remains locked — 2026-09-07

The user accepted the new startup spinner on iPhone/iPad and successfully used the original iPhone local PIN. FDA-IOS-001 and FDA-IOS-002 are resolved. The iPad now exposes the actual pre-send blocker: its account E2EE identity is not unlocked. This is expected fail-closed behavior from the account-authoritative message service and does not prove Firebase communication failure. Do not reset keys or verify the changed peer fingerprint without comparison. Next acceptance action is to inspect the existing Settings → Account Encryption state and deliberately unlock the same durable identity. FDA-DM-001 remains open; completion remains 96%.

### 0.9.9.8 outgoing account-message read repair — 2026-09-07

Both devices now report Account Encryption READY. Preserved rows reached Sent, establishing Firebase write acceptance, but sender-side reading used the incoming-only direction. The candidate adds direction-aware v3 reading to the existing account message service, rejects unknown senders, retains exact AAD/keyId checks, and permanently tests both directions. Compatibility-device warning text no longer falsely says account E2EE is paused; no fingerprint is trusted automatically. Cache revision is `001e`. Full baseline, promotion and device proof remain required. Completion remains 96%.

First full runs `34130208522` and `34130353052` reached the Outbox gate after every earlier step passed, then failed because its exact cache-revision assertion remained pinned to `001d`. The candidate requires `001e`; update only that expected revision and rerun the entire baseline. This is test maintenance for deterministic cache invalidation, not a weakened invariant.

Corrected commit `fbfb296b2c29ce367fae7c38abc2b5147f14d509` passed full baseline `34130779064`. The sender-side read repair is repository-validated. Do not promote completion credit: exact-tree `main` deployment and user-device readable Sent → Delivered → Read remain required. Overall completion remains 96%.

Final docs tree `243e1698f5efad09e03587cce0c8689c81ff4659` passed full baseline `34131152754`, was promoted exactly to `main` as `a08d985a8308b9f9da9fabc3c127beefc452fe04`, and Pages `34131445802` succeeded. Device retest is next. 0.9.9.8 remains IN PROGRESS and total remains 96%.

Current FDA-DM-002 candidate adds pending-message deletion. Only outgoing Queued/Sending/Failed rows expose it. Cancellation stays inside the serialized encrypted Outbox authority and removes local traces without Firestore deletion. Full gate, deployment and device proof remain required; completion stays 96%.

The next bounded deletion layer is built but not deployed: sender-owned accepted direct messages route through server-only `deleteDirectMessageForEveryoneV1`; see `MESSAGE-DELETION-AUTHORITY.md`. Live IAM/Function deployment requires explicit authorization. The approved key UX is email/password plus one six-digit FIDUNIO PIN, with internal key details hidden; see `USER-ACCESS-KEY-UX.md`. Implementation remains incomplete and earns no point. Completion stays 96%.

## 0.9.9.8 single-PIN/security presentation candidate — 2026-09-07

Ordinary Settings now retains only Account email/password, one Security area, one six-digit FIDUNIO PIN, and optional device unlock. Separate Device Identity and Account Encryption options and technical key/fingerprint presentation are absent. Existing local-security and account-E2EE derivations remain separate and established owners remain unchanged. First setup writes the local verifier from the same transient PIN only after E2EE succeeds; a different existing installation PIN fails closed. Focused UX and established candidate/iPad/runtime gates pass locally. Full baseline, deployment and device proof remain required; completion stays 96%.

Candidate commit `5e22a9484029d02f9f6691b82329a55d4695c848` passed complete Rebuild Baseline Security Gate `34139245770`; Pages run `34139244639` succeeded. Repository/deployment criteria are green. Device acceptance remains required. Accepted-message Delete for Everyone remains deliberately disabled until its dedicated least-privilege callable is explicitly provisioned and deployed. Completion remains 96%.

## FIDUNIO 1.1.6 notification routing checkpoint — 2026-09-09

- N4 real-device acceptance passed: a backgrounded iPhone received the generic `FIDUNIO — New message` notification after the live Eventarc/Cloud Run invocation permission was corrected.
- Live N4 trigger: `notifyDirectMessageCreatedV1`; Eventarc trigger region is `nam5`; the trigger service account has `roles/run.invoker` only on the N4 Cloud Run service.
- N5 candidate adds deterministic notification-tap routing. The service worker may focus/open FIDUNIO and pass only opaque direct-message routing intent. `app.js` remains the route/message owner and resolves the conversation through existing Firestore/E2EE state.
- Notification metadata never creates a message row, decrypts content, or writes receipts. Cold-open routing waits behind the normal local PIN/auth gates.
- Device acceptance still required for N5 warm-open and cold-open taps before N5 is closed.

## FIDUNIO 1.1.9 — optional sender display-name notifications — 2026-09-09

**Status: REPOSITORY CANDIDATE; live Firestore rules + N4 Function deployment and device acceptance required.** Private notifications remain the default. Each notification installation may explicitly opt in with `showSenderName: true`. The server resolves the sender only from authoritative `users/{senderUid}.displayName`, never from message `senderName`, and sends `FIDUNIO — New message from <display name>` only to opted-in installations. Non-opted installations remain `FIDUNIO — New message`. Message text, attachment names, email, UID, phone, ciphertext and decrypted content remain excluded. This changes no Firestore/E2EE/message/receipt authority.


## 2026-09-10 — restored 1.1.9 routing evidence and rogue-code documentation checkpoint

**Status: DOCUMENTATION ONLY — NO RUNTIME BUILD OR REPAIR.** Exact frontend checkpoint remains `a3830afd8a01f88448e42703ac4b803058451ef8`, version 1.1.9. The user confirmed the `fcm.txt` backend/rules restoration completed successfully. Fresh device proof now shows both iPhone and iPad follow `notification -> tap -> PIN -> Settings`, rather than the intended direct conversation. iPhone notification arrival was about 1–2 seconds; the reported iPad delivery event took approximately 30 seconds or more. The earlier iPhone-success baseline is therefore not reproducible in the restored environment.

Read-only source and official-contract investigation places the routing break before `app.js`: the backend sends a common FCM notification plus opaque data, while the application expects its own service-worker push/click path to create a routed URL. Device diagnostics showed the resumed root URL without routing parameters and no pending route. PIN and Settings must not be changed to compensate. The latency boundary remains unclassified and separate.

`ROGUE-CODE-RAMIFICATIONS.md` is now the binding screen/functionality impact and retest authority for the timing-driven reconnect, forced subscription, duplicate lifecycle and delayed projection behavior discovered in 1.1.9. No rogue-code cleanup is approved. Notification redesign, lifecycle cleanup and projection-latency work must remain separate releases.


## FIDUNIO 1.1.17 — data-only service-worker notification owner — 2026-09-10

**Status: IMPLEMENTED REPOSITORY CANDIDATE; LIVE FUNCTION DEPLOYMENT AND DEVICE ACCEPTANCE REQUIRED.** The server notification core now sends one opaque data-only FCM payload per eligible installation. The payload contains only type, conversationId, messageId and the bounded OS-visible notification body (private “New message” or the installation-opted authoritative sender display name). It has no common FCM notification object, message text, attachment information, ciphertext, keys, PIN or recovery material.

The existing FIDUNIO service worker is registered as a module and initializes a named Firebase Messaging-only worker app using the unchanged protected firebase-config.js. It initializes no Auth, Firestore, App Check, Functions or Storage service. Firebase Messaging onBackgroundMessage is the one background display owner; it validates the payload, suppresses display when a FIDUNIO window is visible, and attaches the opaque route to the notification. The existing notificationclick -> routed URL -> PIN -> app.js path remains unchanged. app.js remains route/message owner and Firestore + E2EE remain message authority.

No rogue lifecycle, Outbox, receipt, subscription, Settings host, group, attachment, disappearing-message or direct projection code changed. Version advances from 1.1.9 to 1.1.17 because 1.1.9.1 through 1.1.16 are rejected historical experiments. Full baseline, exact Pages verification, live N4 Function deployment and iPhone/iPad device acceptance remain required.


### 1.1.17 baseline rerun correction — 2026-09-10

Initial full gate run 34436219194 passed all notification stages and the first 73 security stages, then stopped because outbox-reconciliation-boundary.test.mjs still required the historical 1.1.9 service-worker revision. The assertion is updated to require the exact 1.1.17-data-only-sw-owner revision. No runtime, Outbox or notification behavior changed and no invariant was weakened. A complete rerun is required.


### 1.1.17 second baseline rerun correction — 2026-09-10

Full gate run 34436403470 passed stages 1–81, including all notification, lifecycle, Outbox, attachment, E2EE, PIN and deletion gates, then stopped at direct-message-basic-path.test.mjs because its installed-PWA assertion also retained the historical 1.1.9 shell revision. A scan of all 78 permanent test files confirmed this was the only remaining old-revision assertion. It is updated to require 1.1.17-data-only-sw-owner. No runtime behavior or invariant changed. A third complete run is required.

## FIDUNIO 1.1.18 — REJECTED; exact 1.1.17 frontend restored — 2026-09-10

Live 1.1.17 backend deployment succeeded. 1.1.17 iPhone routing passed twice at approximately five seconds while iPad returned to Settings twice. The 1.1.18 returned-client route message did not improve iPad and reduced perceived iPhone stability/performance. Every 1.1.18 runtime/test-expectation change is removed; frontend version and cache revision return exactly to 1.1.17 and the live 1.1.17 backend is untouched. Clean-baseline investigation keeps iPad click routing separate from the independently observed delayed direct-message projection.

## FIDUNIO 1.1.19 — one-shot correlated diagnostic build — 2026-09-10

Prior diagnostics established active worker but no route query/pending route on iPad, no recorded FIDUNIO notificationclick under browser-managed display, and no recorded push/click under the earlier data-only diagnostic. They did not correlate the current Firebase Messaging callback, notification data, click, clients, actual open result, bootstrap/PIN/hydration, route gates and projection in one ledger. 1.1.19 adds that correlation without changing the restored 1.1.17 route action. One device run and copied report must decide the next repair; no further diagnostic release is allocated.

### 1.1.19 iPad diagnostic verdict

The one allocated run completed and is conclusive: correct FCM data arrived and the worker displayed the notification, but no FIDUNIO `notificationclick` or `openWindow()` event followed. The installed PWA resumed at plain `/hermes/`; every app-stage record showed `pendingNotificationRoute: null`. Direct chat opened from the already-persisted matching `selectedId`, not from the notification. FDA-NOTIFY-002 is therefore an absent iPad worker-tap-intent problem upstream of PIN, Settings and app routing. The message loaded authoritatively; its approximately 3.7–4.0 second projection and repeated subscription passes remain a separate lifecycle/performance defect. Next build: remove diagnostic instrumentation and implement an installation-local pending-notification inbox with deterministic sole-item consumption and a multiple-item chooser. No more diagnostic release.

## FIDUNIO 1.1.20 — installation-local pending notification candidate

The worker now stores each validated opaque direct-message route in a dedicated installation-local IndexedDB inbox before display. The page reads it only after local hydration, unlock and authenticated Firebase readiness. One pending conversation opens directly; repeated notifications for that conversation collapse and are consumed together. Multiple conversations present a New messages chooser. The existing click URL remains compatible and consumes its local record. The 1.1.19 diagnostic runtime/UI is removed. Backend, Firebase configuration/rules, message/E2EE, Outbox, receipts, Settings ownership and rogue lifecycle/projection paths are unchanged. Full baseline, Pages deployment and iPhone/iPad device acceptance are required; FDA-NOTIFY-002 remains open until device proof.

## FIDUNIO 1.1.21 — activation and composer ownership repair candidate

1.1.20 device acceptance failed after two iPad successes and failed on iPhone. The page incorrectly cached “notification inbox loaded” for the lifetime of the process, so later worker records were not read. The candidate removes that cache and makes `requestAppActivation()` the one serialized/coalescing owner for hydration, unlock, Firebase readiness, foreground return, connectivity and worker route signals. It applies notification priority before UI projection and consumes a route only after persisted selection and render.

FDA-COMPOSER-001 is added from user evidence that typing caused screen jumps and lost input. Background subscription, receipt, attachment, peer-name and Outbox updates now use the central background projection path, which updates message/status/sidebar regions without replacing the textarea. Per-conversation in-memory composer state protects draft/focus/caret/scroll through required structural renders. All locally runnable non-emulator baseline tests pass. Emulator-backed full baseline, exact-main promotion/Pages and repeated device acceptance remain pending.

## FIDUNIO 1.1.22 — notification route, message latency and newest-entry candidate

1.1.21 device evidence is mixed and therefore not accepted: warm/background notification activation reaches the intended chat on iPhone/iPad, but the incoming row appears after ten seconds or more; terminated iPhone activation can fall to Messages; and ordinary plus notification chat entry opens at the oldest row on both devices. The bounded 1.1.22 correction keeps the single activation/render owners and removes the three proven races.

- Cold activation revalidates a questionable locally restored conversation through `firebase.js` server authority before it may be rejected. Transient server failure leaves the installation-local route pending. Consumption occurs only after the target chat composer is actually mounted.
- Direct snapshots reuse plaintext for already authenticated immutable message IDs, decrypt only new/unavailable rows, and request composer-safe visible projection before cache/state persistence and server Read recovery.
- The composer map owns only draft/focus/caret/height. A transient same-render viewport snapshot preserves an actively viewed chat during a background patch; intentional entry has no retained viewport and opens at the newest message.

No Firebase rules/backend/configuration, notification payload/registration, PIN/auth, E2EE format, receipt authority, Outbox, groups, attachments, disappearing content or Settings lifecycle changes. Exact runtime commit `c2e98d802c5ea2851885f4f5bb2a08ef67af7f4c` is on `main`; full baseline `34494444866`, Recovery `34494444546`, Firebase Adapter `34494444308`, Rules Emulator `34494444767`, and Pages `34494429455` completed SUCCESS. The live site serves version `1.1.22` and shell revision `1.1.22-notification-projection-owner`. Repeated iPhone/iPad acceptance remains required.

## FIDUNIO 1.1.23 — deterministic owner-release correction

1.1.22 is device-rejected. Background iPhone/iPad routing reaches the direct chat but new-row timing remains inconsistent; terminated iPhone opens Messages; iPad cold routing behaves like its warm path; and both devices inconsistently open at oldest versus newest. The remaining causes are an activation-promise release window that can strand a queued readiness signal, a duplicate re-entry `getDocs()` plus FIFO snapshot backlog, and competing unversioned animation frames that can replace a latest-entry intent with scroll zero.

1.1.23 makes the existing activation owner restart synchronously when release finds queued reasons. `firebase.js` keeps one live direct listener and one latest pending snapshot rather than adding a full-history read or FIFO work. `render()` generations invalidate stale frames, while an unresolved latest-entry intent survives intervening background projections. No second owner, timer, reload or diagnostic runtime is added. Firebase backend/rules/config, worker notification behavior, PIN/auth, E2EE formats/keys, receipts, Outbox, groups, attachments, disappearing content and Settings ownership are unchanged. All local non-emulator and emulator-backed repository suites pass. Exact runtime tree `49be379988f7498d74db43a916438341bad12ef8` is on `main` as `9fa9bb62ade01c5b6a3bcf01fc9f7fd6ccb6e57c`; Rebuild Baseline `34501753123`, Firebase Adapter `34501753059`, and Pages `34501752319` completed SUCCESS. Live Pages serves version `1.1.23`. The complete repeated device matrix remains required.

## FIDUNIO 1.1.24 — notification-priority delivery candidate

The 1.1.23 device matrix isolates the remaining defect to background/warm iPad: iPhone background was instant in eight trials except one oldest-position entry, iPhone terminated was also instant, and iPad terminated was instant in eight trials; iPad background remained mostly slow. Version 1.1.24 therefore keeps the successful cold path and adds one keyed priority operation to the existing warm stream owner. The exact notified row is fetched server-authoritatively, deduplicated by ID, decrypted/projected by the same callback, and displayed before local cache, general persistence, Read-receipt, or Outbox maintenance. The route record remains durable until the exact row and composer are mounted.

This is a frontend-only candidate. No backend, rules, configuration, notification payload/display/click, PIN validation, E2EE schema/key, receipt mutation, Outbox policy, group, attachment, disappearing-content, or Settings-owner change is made. All local non-emulator tests, remaining standalone workflow gates, and all five emulator-backed rule suites pass. Product closure requires repository/deployment evidence below and repeated real-device acceptance.

Deployment evidence: exact runtime tree `9a3bcea96c726958c58f788980792f051921dabe` is on `main` as `17210008b89da26ee137cbbd529bb222c09fc164`. Rebuild Baseline `34529867052`, E2EE Rules `34529867135`, E2EE Recovery `34529866986`, Firebase Adapter `34529867158`, and Pages `34529864925` completed SUCCESS. Live Pages serves version `1.1.24`, cache revision `1.1.24-notification-priority-semaphore`, and the new delivery-owner module. Repository/deployment acceptance is complete.

Device acceptance/checkpoint: the user tested every defined 1.1.24 scenario at least five times on both iPhone and iPad and reported that everything behaved as expected. FDA-NOTIFY-002, the notification-related FDA-DM-001 projection/positioning scope, and FDA-COMPOSER-001 are closed for this release. FIDUNIO 1.1.24 is the documented checkpoint/rollback baseline for later work.

## FIDUNIO 1.1.28 — N6 group notification candidate

N6 is implemented through the established owners. The server trigger reads current group membership, excludes the sender and sends opaque data-only notifications to enabled installations. `group-message` routes use the existing installation inbox and activation mutex. Current membership is revalidated from the server, and one exact server message read rejoins the existing serialized group decrypt/receipt owner ahead of queued snapshots. Projection precedes cache, persistence and receipts; only the central renderer reveals the exact group chat. Missing/unauthorized routes fail closed and transient failures remain pending.

No Firestore rules, group E2EE format/key lifecycle, Outbox send order, receipt authority, PIN owner, direct-notification semantics, attachment/disappearing-content owner or protected Firebase configuration changed. All local non-emulator and emulator suites pass; exact-main publication and Pages verification are complete. Live deployment of `notifyGroupMessageCreatedV1` and repeated iPhone/iPad group/multi-installation acceptance remain required.

Implementation is published at `c273f0bfc0275c612fb91c916da0f4d08109dcaa`. The operator-safe `gn.txt` handoff is pinned to that commit and deploys only `functions:recovery:notifyGroupMessageCreatedV1`; live backend deployment and device acceptance remain pending.

Repository evidence: implementation runs E2EE Recovery `34594246788`, Firebase Adapter `34594246812`, Rebuild Baseline `34594246886`, and Pages `34594246065` completed SUCCESS. Handoff runs Rebuild Baseline `34594531574` and Pages `34594530919` completed SUCCESS. Live Pages serves FIDUNIO `1.1.28`, shell revision `1.1.28-group-notifications`, and the `group-message` route.

## FIDUNIO 1.1.25 — password-change PIN bridge correction

Source diagnosis proved the Settings bridge passed `{pin}` into an E2EE rewrap API requiring `{oldPin,newPin}`. Both values were therefore undefined and the six-digit validator rejected the operation before Firebase changed the password. The bounded correction passes the same entered PIN explicitly as old and new PIN for the forward password-only wrapper change and its Firebase-failure rollback. Change Password now contains and reads its own Current Password input, while the Profile field is labeled only for email changes. Successful completion clears all transient password and PIN fields.

Scope is limited to `settings-lifecycle.js`, `e2ee-account-runtime.js`, release/cache identity, one permanent integration gate and release documentation. No Firebase backend/rules/configuration, password-reset recovery, PIN/biometric unlock, E2EE identity/key format, message/receipt/Outbox, notification, group, attachment, disappearing-content, Profile-save or User Administration authority changes. All 70 non-emulator test groups and all five Firestore emulator security suites pass locally. `main` deployment and device acceptance remain required.

## FIDUNIO 1.1.26 — password-change local revision resynchronization

Acceptance exposed that 1.1.25 changed Firebase and the cloud E2EE wrapper successfully but left the device-local copy at the previous wrapper revision. Version 1.1.26 saves the new runtime revision as part of password-change completion. It also repairs devices already affected by 1.1.25: only a local identity with the same UID and keyId and an older revision may enter the existing password/PIN remote-unlock path, after which the current identity is saved locally. Unknown, absent, or different-key installations remain blocked. No message, key, PIN, notification, rules or backend data is changed.

## Deferred account-recovery administration design

Future account recovery may be initiated from User Administration, but administration is limited to issuing and revoking a short-lived, single-use authorization bound to one user UID and recording its audit state. The administrator cannot enter or view the user's password/PIN, access recovery secrets or keys, decrypt content, or change access entitlement through recovery. After Firebase email verification, the user privately selects a new password and six-digit PIN and the existing recovery owner restores the same account encryption key. Installation repair remains a separate matching-key path. The detailed boundary and delivery scope are recorded in `TODO.md`; no implementation or deployment is authorized yet.

## FIDUNIO 1.1.27 — complete Forgot Password recovery gate

The former Forgot Password button stopped after Firebase email reset and could leave the E2EE normal wrapper under the old password. The recovery control was inside Settings, unreachable for an installation without a matching local identity. Version 1.1.27 makes reset a durable authentication transition: after the email request succeeds, an email-bound local handoff expires after 24 hours. The next successful Firebase sign-in enters a dedicated recovery screen before app startup and requires the existing six-digit FIDUNIO PIN. The established ten-minute server recovery session restores the same private identity, wraps it with the new password, saves the current local revision, and only then consumes the reset handoff and opens FIDUNIO. Missing-local authenticated installations receive the same bounded recovery opportunity. Wrong PIN, expired/locked server session, different account, or recovery failure cannot open the app or consume the handoff.

## Deferred trusted-installation persistence decision

TODO item 2 now defines both a same-device verified checkpoint and a portable encrypted `.fidunio` whole-account vault. Existing `fidunio-account-vault-v3` is not portable because it depends on a separate non-exportable same-origin key. The future restore must require matching Firebase UID, existing PIN and server recovery authority, preserve the same E2EE identity, import into quarantine, reconcile cloud authority and every Outbox ID, recreate device-bound registrations, and activate only through the sole serialized storage/startup owner. Full design and acceptance boundaries are in `TODO.md`; no runtime implementation is authorized.
## FIDUNIO 1.1.29 — group-notification single-stream correction

Live N6 deployment succeeded, but iPad acceptance showed the correct group and exact notified message together with an intermittent Firestore permission banner in 2 of 4 trials. The failure was downstream of FCM and exact-message projection. Repeated activation could replace the same group stream because only the direct stream retained an active-conversation identity; asynchronous work from the closed group stream could continue into history/receipt maintenance and error reporting.

Version 1.1.29 gives the group path the same conversation-bound reuse rule, prevents closed streams from projecting or performing history/receipt maintenance, and rejects late exact-message priority work after replacement. The change is frontend-only. The live `notifyGroupMessageCreatedV1` deployment remains valid; no backend, rules, FCM payload, E2EE, membership, Outbox, receipt writer or protected configuration changed. Full repository/Pages proof and repeated iPhone/iPad acceptance remain required.

Device acceptance completed on 2026-09-11. The user reports every cold and warm group-notification test passed on both iPad and iPhone. N6 notification retrieval is accepted on 1.1.29.

## FIDUNIO 1.1.30 — optimistic outgoing projection retention

After N6 acceptance, the user reported that a newly sent message disappeared from the sender's conversation until Sent confirmation; the earlier Sending label was no longer continuously visible. The existing LTE gate proved only that the first render preceded Outbox persistence. It did not model a Firestore listener projection arriving during asynchronous encryption/Outbox preparation.

Version 1.1.30 adds one memory-only optimistic outgoing projection owner. Text and attachment sends are reserved before their first render; direct and group listener projections must merge that exact visible row until Firestore supplies the same message ID. The authoritative row then wins and releases the reservation. Explicit local purge/deletion and sign-out release/reset it. This changes no encrypted Outbox persistence, transport attempt boundary, Firestore data/rules, E2EE, receipt state, notification routing, membership or backend Function. The new behavioral gate covers empty and unrelated authoritative snapshots, exact-ID confirmation, deletion and hidden-message non-resurrection.

Runtime commit `b3bcaa8014b35c9bfffb908555fa9052bc7cd60f` is on `main`. Rebuild Baseline Security Gate `34603708400` and GitHub Pages `34603708508` completed SUCCESS, and remote `version.js` serves 1.1.30. Repository/deployment validation is complete; iPhone/iPad continuous Sending visibility remains pending.

## FIDUNIO 1.1.31 — direct-message projection restore

Real-device feedback rejected the direct-message scope of 1.1.30: Sending/Sent/Read behavior regressed after the new optimistic reservation was connected to both group and direct paths. Version 1.1.31 surgically restores the accepted direct listener projection and direct text/attachment staging boundaries to their 1.1.29 form. The reservation remains group-only. No direct Outbox, encryption, Firebase write, receipt, notification, group membership or backend logic changes. A permanent isolation gate prevents the group-only owner from entering direct projection again.

## FIDUNIO 1.1.32 — bounded mass sender deletion

Item 4 is repository-implemented through the existing message-deletion authority. Direct Chat Info and Group Info expose **Delete My Sent Messages** and one owned confirmation/progress modal. `firebase.js` remains the sole callable bridge. New callable `deleteMyMessagesForEveryoneV1` uses the existing dedicated message-delete service account and server repositories, verifies current membership, selects no more than 25 rows per invocation by authenticated `senderUid`, then reuses the existing per-message sender revalidation and attachment/group-trace-before-source cleanup. The client serially drains further pages and physically purges only server-confirmed IDs from local state/history.

Other senders' rows and unsent Outbox rows are outside scope. Direct send/receive/receipts, group E2EE/membership/history, notification routing, attachment transport, disappearing-content semantics, PIN/auth, Settings, conversation deletion/archive, and protected Firebase configuration are unchanged. All 72 non-emulator test groups and all five Firestore emulator security suites pass locally; live callable deployment, `main`/Pages verification, and direct/group device acceptance remain release requirements.

Short root Cloud Shell script `m.txt` is pinned to published implementation commit `d4909f9b831aa5a4f07c5a9b04b633cbf117ff2d`; it preflights the complete Functions graph, deploys only `deleteMyMessagesForEveryoneV1`, and verifies ACTIVE state plus the dedicated runtime service account.

## FIDUNIO 1.1.32 deployment and first device result

The validated 1.1.32 tree is on `main`; security and Pages workflows passed. The user ran `m.txt` successfully and reported `deleteMyMessagesForEveryoneV1` ACTIVE. In the first direct test, both Sent messages were physically deleted on sender and receiver, but the sender displayed one row until a later listener snapshot. This rejects immediate sender-screen convergence while proving backend authority and receiver deletion.

## FIDUNIO 1.1.33 bounded convergence correction

One memory-only owner now reserves only IDs returned as deleted by the callable. Direct and group projections suppress those IDs while sequential backend deletion snapshots arrive, then release each reservation only when a full server-backed snapshot proves the source absent. Cache/priority snapshots cannot release it. The owner is conversation-scoped and resets on sign-out; it persists no tombstone. Backend, Firebase listener ownership, single-message deletion, Outbox, E2EE, receipts, notifications and protected configuration remain unchanged. Full gate, `main`/Pages and repeated device acceptance are required.

Exact 1.1.33 tree `1ce5eab49c7573622a028cfeb800755173d3fdfe` is on `main`. Rebuild Baseline `34627532056`, E2EE Rules `34627532087`, Recovery `34627532062`, Firebase Adapter `34627532036`, and Pages `34627531490` completed SUCCESS. Remote `version.js` and the new cached convergence module were verified. Device retest remains open; no backend redeployment is required.

The user repeated the direct mass-delete test on 1.1.33 and confirmed it works. FDA-MASSDEL-001 direct convergence is device accepted. Group and remaining cross-device regression coverage remain open. Deferred TODO now explicitly includes reliable add/remove-member controls for an existing group conversation, using the established membership plus E2EE epoch-rotation authority; direct one-to-one membership remains fixed.

### Mass-delete device closeout — 2026-09-11

The user subsequently completed group mass-delete testing with a positive result. Together with the already accepted corrected direct path, TODO item 4 and FDA-MASSDEL-001 are DEVICE ACCEPTED / CLOSED. No new runtime, backend, rules or configuration change accompanies this acceptance record.

## FIDUNIO 1.1.34 group membership lifecycle correction

Device testing exposed three related projection defects: leaving did not immediately remove the group/member row, the unauthorized group remained in Messages and Groups, and Add Member could wait forever for the user directory. The underlying atomic membership/key-epoch transaction was already correct. The correction keeps that writer unchanged, rejects stale overlapping group snapshot assemblies, filters member cards against parent `memberUids`, reconciles only full server-backed non-pending group absence, and removes the leaving account's local group projection after confirmed commit. Add Member now has a 12-second UI read boundary, Cancel and Try Again, with request revisions preventing a late read from overwriting a newer modal. Full local non-emulator and all five Firestore emulator baselines pass. Exact runtime tree `0b614b97fa14a3d5ac0bdf8b2409c4dbde5c55f9` is on `main`; Rebuild Baseline `34650618943` and Pages `34650618536` completed SUCCESS. Device acceptance remains pending.

**Device closeout — 2026-09-11:** The user reports all defined TODO item 9 tests passed positively. Existing-group add/remove/leave membership behavior, projection convergence, member discovery and related regressions are DEVICE ACCEPTED. TODO item 9 and FDA-GROUP-002 are closed.

## FIDUNIO 1.1.35 permanent conversation actions

TODO item 5 is implemented as permanent row-level functionality on both Messages layouts. Archive is UID-scoped encrypted installation state, hides the row from the normal list without changing cloud history, remains archived on new activity, and is reversible in Archived. Delete for Everyone requires typed confirmation. Either direct participant is authorized; group deletion is owner-only. The dedicated callable establishes a server-time write barrier, removes attachment objects first, then recursively deletes the Firestore conversation/group tree. Client delete rules remain closed.

Direct and group list listeners now pass/consume cache and pending-write metadata for authoritative absence. Only a full server-backed omission can trigger participant-device removal and serialized local deletion of that conversation's encrypted history, hidden IDs, drafts, attachment URLs and Outbox rows. All 84 non-emulator workflow steps and all six Firestore emulator suites, including the new deletion-barrier suite, pass locally. Exact implementation tree `82c6f1636bef2c9e5356ebc0718abc933f0af557` is on `main` as `ca265dfe2f5bafc87bdba34e5c9fe4afc1968023`; deploy-script follow-up is `522be7b3801456e9d49aac4daa7bf1a73f96a976`. Functions/rules deployment, GitHub workflow/Pages verification and device acceptance remain pending.
