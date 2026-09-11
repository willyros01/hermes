# FIDUNIO Message Notification Architecture — FCM / Web Push

**STATUS: AUTHORITATIVE DESIGN FOR FIDUNIO 1.1**

This document is the durable authority for FIDUNIO message notifications. Every future task that designs, implements, tests, deploys, debugs, or changes message notifications, Firebase Cloud Messaging (FCM), Web Push, notification token registration, notification click routing, or notification Cloud Functions MUST read and follow this document before implementation.

This architecture is additive to the existing validated messaging system. It must not create a second messaging authority, second receipt authority, second E2EE authority, second Firebase initializer, or second local message store.

Core invariant:

**ONE RESOURCE -> ONE OWNER -> ONE PREDEFINED AREA -> ONE SERIALIZED WRITE PATH**

## 1. Product goal

FIDUNIO 1.1 adds message-arrival notifications on platforms that support FCM/Web Push, including installed iPhone/iPad PWAs where supported by the browser/OS permission model.

FCM is a notification/wake-up transport only. It is NOT message delivery authority.

The authoritative message path remains:

1. Sender creates/sends through the existing FIDUNIO encrypted Outbox path.
2. Firestore accepts the authoritative encrypted message.
3. A server-side notification trigger observes the accepted message.
4. The server resolves authorized recipient installation tokens.
5. FCM/Web Push delivers a generic notification.
6. On notification tap, FIDUNIO opens/focuses and uses the existing Firestore + E2EE path to retrieve/decrypt/display the real message.

A push notification must never manufacture a message bubble or substitute for Firestore.

## 2. Privacy rule — no message content in FCM payload

FCM payloads must not contain:

- plaintext message text;
- decrypted message previews;
- attachment names;
- image/audio/video/file content;
- group plaintext content;
- E2EE private keys or derived key material;
- account-E2EE PIN;
- local unlock PIN;
- recovery secrets;
- any message plaintext retained for notification history.

The default OS-visible notification is intentionally generic:

- Title: `FIDUNIO`
- Body: `New message`

Opaque routing metadata may include only what is required to route the application after a tap, for example:

- notification type;
- opaque conversation ID;
- opaque message ID.

Sender identity remains private by default. A user may explicitly enable **Show sender name** per installation. When enabled, the server may place only the authoritative `users/{senderUid}.displayName` value in the OS-visible body (`New message from <FIDUNIO display name>`). The message document's `senderName` is not notification authority. No message text, attachment name, email, UID, phone number, key material, or decrypted content may be added.

## 3. Ownership map

### Firebase SDK / FCM client ownership

`firebase.js` remains the sole Firebase SDK/service owner. Any Firebase Messaging SDK acquisition, token API, Firestore notification-token persistence API, or Firebase messaging initialization must be exposed through `firebase.js` or a reviewed thin adapter that receives central services by injection. No notification module may independently initialize Firebase.

### Notification registration owner

A dedicated notification-registration owner may manage only notification intent/state and call bounded `firebase.js` APIs. Suggested responsibilities:

- `enableNotifications()`
- `disableNotifications()`
- `refreshNotificationRegistration()`
- `getNotificationStatus()`

It must not own Auth, Firestore initialization, E2EE, message state, receipts, or structural UI.

### Settings UI owner

The existing deterministic Settings lifecycle creates the Notifications host and mounts the notification UI owner into that predefined host. No document-wide MutationObserver, post-render re-parenting, or direct append into a shared Settings parent is allowed.

### Server notification owner

Cloud Functions/Admin-side notification code owns:

- deciding when an accepted Firestore message warrants notification;
- resolving authorized recipients from authoritative Firestore state;
- loading active notification tokens;
- sending FCM/Web Push;
- pruning invalid/unregistered tokens.

The sending browser never sends directly to the FCM HTTP API and never chooses arbitrary recipient tokens.

### Service worker owner

`service-worker.js` remains infrastructure only. For notifications it may:

- receive a push/FCM event;
- display the generic OS notification;
- receive notification click;
- focus/open FIDUNIO;
- pass opaque conversation/message routing intent to the app.

The service worker must NOT:

- decrypt messages;
- write Read/Delivered receipts;
- write or reconstruct chat message state;
- persist a second notification message history;
- rewrite application source;
- become a second Firebase/message authority.

### Application/message owner

`app.js` and existing conversation/message owners remain responsible for navigation, message projection, Firestore subscription results, unread state, and normal routing after the app receives a notification-click intent.

### E2EE owner

Existing account-authoritative E2EE owners remain unchanged. Notification code does not decrypt or re-encrypt chat content.

### Receipt owner

Existing Delivered/Read receipt ownership remains unchanged. A push notification itself never marks a message Delivered or Read unless the existing messaging architecture already defines a separate authoritative event for that state. Notification display/click must not invent receipt state.

## 4. Installation-scoped token model

Each FIDUNIO installation gets its own push registration token. Notification identity is installation-scoped, not encryption-key-scoped.

Preferred Firestore model:

`users/{uid}/notificationDevices/{installationId}`

Bounded fields may include:

- `installationId`
- `fcmToken`
- `platform`
- `enabled`
- `showSenderName` — boolean, default `false`, installation-scoped privacy preference
- `createdAt`
- `updatedAt`
- `lastSeenAt`

Optional platform classification may distinguish supported environments such as `ios-pwa`, `android-browser`, or `desktop-browser` if this becomes operationally useful.

The token document must not contain chat content, keys, PINs, recovery secrets, or notification history.

One UID may legitimately have multiple active notification installations:

- iPhone token;
- iPad token;
- future desktop/browser token.

Removing or invalidating one token must not disturb another installation.

## 5. Notification permission UX

Do not request notification permission automatically on first app load.

The user explicitly enables notifications from a deterministic Settings section.

Recommended state model:

- Notifications Off
- Enable Notifications
- Enabled
- Permission denied
- Unsupported on this device/browser

Enable flow:

1. Confirm authenticated Firebase user.
2. Confirm browser notification capability.
3. Request Notification permission from an explicit user gesture.
4. Obtain the FCM/Web Push registration token through the central Firebase owner.
5. Persist the installation token under the authenticated UID.
6. Display durable status in Settings.

Notification setup must occur after normal account startup and must never block account authentication, local unlock, E2EE readiness, conversation loading, or message sending.

Startup order remains:

`Authentication -> determine UID -> activate UID-local storage -> restore account state/Outbox/history -> establish account identity -> start app -> refresh notification registration only if previously enabled`

## 6. Token lifecycle

The notification registration owner must handle:

- first enable;
- token refresh/rotation;
- permission revocation;
- explicit notification disable;
- explicit FIDUNIO sign-out;
- switching to a different UID on the same installation;
- invalid/unregistered token cleanup.

Recommended sign-out policy: remove or disable the current installation's notification association with the signed-out UID. A signed-out installation should not continue receiving account-specific message notifications by default.

Server send failures identifying invalid/unregistered tokens must flow through one server-side cleanup path.

## 7. Firestore token security rules

Client access to:

`users/{uid}/notificationDevices/{installationId}`

must be owner-only and exact-schema bounded.

Required emulator matrix includes at minimum:

- owner creates own token: ALLOW;
- owner updates own token: ALLOW;
- owner deletes/disables own token: ALLOW;
- other UID read: DENY;
- other UID write: DENY;
- unauthenticated read: DENY;
- unauthenticated write: DENY;
- unexpected fields: DENY;
- invalid/overlong values: DENY.

Production rules deployment follows the established FIDUNIO process:

`repo source -> emulator tests -> exact reviewed source -> pinned commit -> short Cloud Shell .txt deployment script -> live verification`

A green repository gate never implies live rules have changed.

## 8. Server send ordering

Notification send is strictly downstream of authoritative message acceptance.

Forbidden:

`Send tap -> push -> Firestore attempt`

Required:

`encrypted Outbox -> encryption/preparation -> Firestore accepted message -> server notification trigger -> FCM`

A notification must never exist for a message that was never durably accepted.

The sender's existing Outbox semantics, fixed message IDs, retry policy, receipt transitions, and Firestore confirmation boundary remain unchanged.

## 9. Direct-message notification policy

For a newly accepted direct message:

1. Server reads authoritative conversation membership/state.
2. Server independently identifies sender and recipient.
3. Sender is excluded.
4. Only current authorized recipient UID installation tokens are eligible.
5. Server sends the generic notification.

The client may never submit the destination token list as authority.

## 10. Group notification policy

For a newly accepted group message:

1. Server reads the authoritative current active-member list when the notification trigger processes the message.
2. Sender is excluded.
3. Each enabled registered installation belonging to the remaining members receives the generic notification.
4. The payload contains only notification type plus opaque `conversationId`/`messageId` routing identifiers; it is never access authority.
5. On open, the existing group-membership, history-entitlement, Firestore and E2EE owners independently allow or reject access to the actual message.

The group-member list must not be exposed as plaintext notification content.

No separate “member joined before message creation” notification check or message-time recipient snapshot is required for the initial implementation. Notification delivery grants no message or history access. A stale notification, deleted message, membership change, or entitlement change is resolved by the existing authoritative access path when the app attempts to open the message. Rejection consumes/discards the unusable pending route and returns to the normal conversation surface with a simple unavailable-message notice; it must not manufacture a row or weaken access rules.

## 11. Attachments

Photo, file, audio, and video messages use the same generic notification:

`FIDUNIO — New message`

Notification code does not need attachment filename/type/content. The existing encrypted attachment pipeline remains the sole attachment authority.

## 12. Notification click routing

On notification click:

1. Service worker closes/handles the notification.
2. Find and focus an existing FIDUNIO client when possible, otherwise open the installed PWA/app URL.
3. Pass only opaque navigation intent (`conversationId`, optional `messageId`, notification type).
4. `app.js`/existing route owner selects the conversation.
5. Existing Firestore subscription obtains authoritative state.
6. Existing E2EE owner decrypts the message.
7. Existing receipt owner handles any legitimate Delivered/Read transition.

The notification payload must never directly instantiate a local message row.

Cold-open and already-running/warm-open paths must both be tested.

## 13. Foreground behavior

If FIDUNIO is already visible and the relevant conversation is open, the normal Firestore subscription/live UI is sufficient. Avoid a redundant OS notification for that same visible conversation.

For other conversations while foregrounded, the first implementation should prefer existing in-app unread indicators and suppress redundant OS display when practical.

Server push may still occur; display suppression is a client/service-worker presentation choice and must not change message authority.

## 14. Multi-device behavior

A UID with multiple registered installations may receive the same generic notification on each active installation. This is expected.

Opening/reading on one device does not let notification code directly clear or mutate another device's message state. Existing Firestore receipt/conversation state remains the convergence authority.

Cross-device notification suppression is a later optimization and must not be introduced until the basic architecture is device accepted.

## 15. Disappearing content interaction

Disappearing messages must not leave message content in FIDUNIO-controlled notification payload/history.

Because payloads are generic and opaque, message purge does not require deletion of plaintext notification content.

If a notification is tapped after the message was deleted/expired:

1. FIDUNIO opens the conversation.
2. Firestore/current projection shows authoritative absence.
3. No message is reconstructed from the push payload.

Notification metadata must never resurrect expired/deleted message content.

## 16. Fire HD / platforms without FCM

FCM is a supported-platform notification transport, not universal message-delivery authority.

Fire HD / Fire OS may lack compatible Google Play Services/FCM behavior. FIDUNIO messaging must continue to function normally when foregrounded/reopened through Firestore synchronization even when push is unavailable.

Do not block the iPhone/iPad notification implementation on Fire OS push. A Fire-specific notification transport, if ever added, is a separate adapter/phase and must preserve this architecture.

## 17. iPhone/iPad PWA acceptance scope

Explicit real-device tests must cover:

- installed Home Screen PWA;
- explicit notification permission grant;
- FIDUNIO foreground;
- FIDUNIO background;
- screen locked;
- suspended/terminated/cold-open state where supported;
- notification tap with app already running;
- notification tap requiring cold open;
- Wi-Fi and cellular transition;
- token refresh/re-registration where reproducible.

Do not assume native-app background execution semantics. Push only notifies/wakes; Firestore + E2EE remain authoritative after foreground/open.

## 18. Proposed implementation phases

### N1 — Architecture/specification

This document is N1 and is authoritative. No live Firebase change is part of N1.

Exit: architecture referenced by all relevant durable docs and marked required reading for notification work.

### N2 — Firebase Messaging ownership foundation

- add bounded FCM client APIs behind `firebase.js`;
- add dedicated notification registration/policy module(s);
- no permission UI yet;
- prove no second Firebase initializer;
- focused ownership tests.

### N3 — Settings permission + token registration

- deterministic Notifications Settings host;
- explicit permission user gesture;
- token registration under authenticated UID;
- Firestore rules + emulator tests;
- device proof that correct UID installation record is created;
- Google/Firebase handoff only when repo-side requirements are ready.

### N4 — Direct-message background notification

- server trigger only after accepted direct message;
- recipient derived server-side;
- generic payload;
- one notification on recipient supported installation.

### N5 — Notification tap routing

- service-worker generic display + click;
- focus/open PWA;
- pass opaque navigation intent;
- existing app/Firestore/E2EE path shows message;
- warm and cold open acceptance.

### N6 — Groups + multi-device

- group recipients derived from the authoritative current active-member list at notification-processing time;
- sender excluded;
- multi-installation fan-out;
- generic payload with only opaque group/message routing identifiers;
- existing membership/history, Firestore and E2EE rules remain final access authority;
- no separate join-time check or message-time recipient snapshot in the initial implementation.

### N7 — Lifecycle/reliability closeout

Validate:

- token refresh;
- permission revoke;
- notification disable;
- explicit sign-out;
- switch UID on same installation;
- stale-token pruning;
- deleted/disappeared message before tap;
- offline/reconnect;
- Wi-Fi to LTE;
- foreground/background;
- cold/warm open;
- direct/group/multi-device behavior.

## 19. Expected implementation files

Likely existing files touched across bounded phases:

- `firebase.js`
- `service-worker.js`
- `app.js` and/or deterministic Settings lifecycle owner
- `version.js`
- `firebase.json`
- `firestore.rules`
- server Functions files
- `package.json`
- `.github/workflows/rebuild-baseline-security.yml`

Likely new bounded modules/tests:

- `notification-registration.js`
- `notification-policy.js`
- notification registration/policy tests
- notification Firestore-rules tests
- server notification Function tests
- notification click-routing tests

Do not create these merely to match this list; final names/owners are chosen only after the applicable phase source audit.

## 20. Mandatory documentation reconciliation

Every substantive notification implementation/build must reconcile at minimum:

- `FCM-NOTIFICATION-ARCHITECTURE.md` (this authority)
- `hermes-memory.txt`
- `CURRENT-REBUILD.md`
- `README.md`
- `FIDUNIO-BUILD-CHECKLIST.md`
- `RUNTIME-AUTHORITY-MAP.md`
- `architecture-ownership.txt`
- `CODING-GUIDELINES.md` when an ownership rule changes
- `FIREBASE-RECOVERY-PROJECT-CONFIG.md` when live Firebase setup/deployment requirements change
- `BUG-LIST.md` only when tracking an actual notification defect
- `DEVICE-ACCEPTANCE-BUGS.md` during device acceptance/defect testing

Every release-number change still follows the existing version/document ledger rules.

## 21. Live Firebase/Google handoff rule

Do not change live Firebase/Google configuration merely because notification architecture has been documented.

Before live handoff:

1. repo-side ownership foundation is implemented;
2. notification schema/rules are emulator-tested;
3. exact Firebase Messaging/Web Push requirements are identified from the current project configuration;
4. any required VAPID/Web Push configuration is reviewed;
5. Cloud Function/Admin send permissions are explicitly reviewed;
6. exact deployment source is pinned;
7. user-authenticated Google Cloud/Firebase actions use a short `.txt` Cloud Shell script where applicable;
8. live configuration/deployment is separately verified.

## 22. Explicitly prohibited designs

Do not implement:

- plaintext or decrypted message content in FCM payloads;
- message/attachment names in lock-screen payloads by default;
- service-worker message decryption;
- service-worker receipt writes;
- notification-created fake/local chat rows;
- direct browser calls to FCM server APIs using server credentials;
- client-authoritative destination token lists;
- FCM token embedded inside message documents;
- notification as required message-delivery authority;
- automatic notification permission prompt at startup;
- a second Firebase initializer;
- notification-specific E2EE/key ownership;
- Fire OS limitations as a blocker for supported-platform FCM work;
- notification payload/content retention that violates disappearing-content purge requirements.

## 23. Governing principle

**FCM tells the user that FIDUNIO has something new. Firestore + the existing E2EE messaging system remain the only authority for what that message actually is.**

## 24. FIDUNIO 1.1.19 binding iPad result and next notification owner — 2026-09-10

The worker received the correct data-only envelope and displayed the notification, but the complete correlated ledger recorded no `notificationclick`, client enumeration or `openWindow()` attempt. iPad resumed plain `/hermes/` and the page had no pending route. Exact notification-tap routing therefore cannot depend exclusively on iPad dispatching `notificationclick`.

The next bounded design persists each validated opaque route in an installation-local service-worker notification inbox before `showNotification()`. After the normal PIN/auth gates, the page consumes a sole applicable unread route; multiple routes must produce a chooser. This owner may store only notification type, conversation ID, message ID and lifecycle metadata. It must not store message content, keys, tokens or receipts, and must never become Firestore/message authority. A manual launch following notification display is observationally indistinguishable from a tap on the affected iPad and may consume the pending route; that is an explicit platform tradeoff, not a hidden heuristic. UID-global consumable routing remains prohibited.

## 25. FIDUNIO 1.1.20 implementation ownership

`notification-pending-inbox.js` is the sole installation-local route-record owner. Its dedicated IndexedDB contains at most 50 validated records keyed by opaque message ID. The worker writes before display. The page reads only after hydration, unlock and Firebase user readiness, collapses records by conversation, and deletes only the selected conversation's message IDs after route selection succeeds or the authoritative conversation is rejected. It uses no timeout, UID-global document, message content, Firestore write, receipt write or E2EE operation. Multiple conversations are user-selected. The 1.1.19 diagnostic owner and Settings report are removed.

## FIDUNIO 1.1.6 notification routing checkpoint — 2026-09-09

- N4 real-device acceptance passed: a backgrounded iPhone received the generic `FIDUNIO — New message` notification after the live Eventarc/Cloud Run invocation permission was corrected.
- Live N4 trigger: `notifyDirectMessageCreatedV1`; Eventarc trigger region is `nam5`; the trigger service account has `roles/run.invoker` only on the N4 Cloud Run service.
- N5 candidate adds deterministic notification-tap routing. The service worker may focus/open FIDUNIO and pass only opaque direct-message routing intent. `app.js` remains the route/message owner and resolves the conversation through existing Firestore/E2EE state.
- Notification metadata never creates a message row, decrypts content, or writes receipts. Cold-open routing waits behind the normal local PIN/auth gates.
- Device acceptance still required for N5 warm-open and cold-open taps before N5 is closed.

## FIDUNIO 1.1.9 — optional sender display-name notifications — 2026-09-09

**Status: REPOSITORY CANDIDATE; live Firestore rules + N4 Function deployment and device acceptance required.** Private notifications remain the default. Each notification installation may explicitly opt in with `showSenderName: true`. The server resolves the sender only from authoritative `users/{senderUid}.displayName`, never from message `senderName`, and sends `FIDUNIO — New message from <display name>` only to opted-in installations. Non-opted installations remain `FIDUNIO — New message`. Message text, attachment names, email, UID, phone, ciphertext and decrypted content remain excluded. This changes no Firestore/E2EE/message/receipt authority.


## FIDUNIO 1.1.17 — explicit worker-environment Messaging exception

The web page and service worker are separate JavaScript execution environments. firebase.js remains the sole Firebase owner in the page. For data-only FCM background handling, service-worker.js may initialize exactly one named Firebase app, “fidunio-notification-worker”, using the unchanged firebase-config.js and may acquire Firebase Messaging only. It must not acquire Auth, Firestore, App Check, Functions or Storage and must not read/write messages, receipts, Outbox, E2EE, keys or application state.

The server sends no common notification object. The bounded data payload is limited to type, conversationId, messageId and notificationBody. notificationBody is either “New message” or “New message from <authoritative display name>” for an installation that explicitly enabled sender names. The worker validates this value before display. onBackgroundMessage is the sole background notification display owner. app.js remains the route/message owner after notificationclick and PIN.

## FIDUNIO 1.1.18 — rejected click-route experiment

The attempt to keep `openWindow(routed URL)` while also messaging its returned client did not improve iPad routing and reduced perceived iPhone stability/performance. It is removed completely. The active frontend returns exactly to the 1.1.17 routed URL path; the live 1.1.17 data-only backend remains valid. Any next iPad design must begin from that clean baseline, preserve one click owner and remain separate from delayed message projection/lifecycle work.

## FIDUNIO 1.1.19 — temporary diagnostic ownership exception

One diagnostic ledger may receive append-only event records from the worker and page because those are separate execution environments. The dedicated module owns only its isolated IndexedDB database and serializes writes per context; it never reads or writes app, message, Outbox, receipt, Settings or E2EE storage. Instrumentation observes the existing click/route/projection owners without changing their decisions. The ledger must be removed after diagnosis. Security-secret values are excluded even from diagnostics.

## FIDUNIO 1.1.21 — repeated inbox read and single activation owner

The 1.1.20 page incorrectly treated the installation-local inbox as loaded for the entire JavaScript process. A first empty or consumed read prevented later background notifications from being observed until process restart. The process-lifetime cache is prohibited.

Every eligible activation after hydration, unlock and authenticated Firebase readiness rereads the installation-local inbox through its existing single read promise. Initial hydration, unlock, auth settlement, foreground lifecycle, connectivity and worker messages only signal `requestAppActivation()`; none independently applies a route or renders. A valid sole direct-message route outranks restored Settings/messages state, is persisted and rendered, then consumed. Multiple conversations retain the neutral chooser. Because affected iPadOS supplies no click signal, manual launch after display retains the documented next-activation tradeoff.

## FIDUNIO 1.1.22 — cold authority and visible-projection boundary

An installation-local route must not be rejected from a stale locally restored conversation record. If the local target is absent, non-cloud, group-like or otherwise questionable, the single application activation owner asks the central `firebase.js` service for a server-authoritative conversation record. Absence may be consumed only after that authoritative read; network/auth failure retains the route for a later serialized activation. Successful routing is consumed only after the exact target conversation's composer exists in the rendered DOM.

Firestore remains message authority and E2EE remains plaintext authority. Direct snapshot projection may reuse plaintext previously authenticated for the same immutable e2ee:3 message ID because client rules permit only recipient receipt fields to change after creation. New or previously unavailable rows still decrypt through the existing account-E2EE owner. The central render owner must paint the merged in-memory projection before IndexedDB durability and server Read-recovery awaits. Notification metadata still never constructs a message row.

Scroll is not durable notification or composer state. The composer owner retains only ephemeral draft/focus/caret/height. A current chat viewport may be handed across one owned background projection only; a deliberate conversation-list or notification entry has no prior viewport and opens at the latest message.

## FIDUNIO 1.1.23 — notification activation handoff

The installation-local inbox and server-authoritative route validation remain unchanged. The activation promise is still the single route owner, but its release is now an explicit ownership boundary: after clearing the active promise it synchronously starts another serialized drain when any hydration, unlock, Firebase-auth, foreground, connectivity or worker reason is queued. A readiness reason can therefore neither run concurrently nor remain stranded at cold launch. This changes no FCM payload, worker display/click behavior, inbox format, privacy field, backend Function or notification registration.

## FIDUNIO 1.1.24 — exact-message priority inside the existing owner

The pending inbox record is the durable semaphore and its key is `(conversationId, messageId)`. After unlock/auth/hydration are ready, the activation owner keeps the PIN transition mounted and starts the existing conversation subscription. If the keyed row is absent, `prioritizeConversationMessage` performs one `getDocFromServer` for that exact document and submits it to the same delivery owner as listener snapshots. Priority is processed after any currently executing projection but before a queued snapshot or maintenance step. Duplicate priority requests share the keyed operation; later full snapshots merge by ID.

The priority row is non-authoritative: it cannot purge history or Outbox data. Projection/decryption and rendering happen before cache, state persistence, or receipt recovery. Only the activation owner reveals chat, and only after the exact row is projected; only the render/activation owners consume the record after the row and exact conversation composer are mounted. Timeout, offline, missing document, decryption failure, or render mismatch leaves the record pending. No-notification activation bypasses the path.

## Agreed N6 group-notification boundary — 2026-09-10

The first group-notification release will follow the general rule rather than add speculative exception machinery. The server derives recipients from the authoritative current active group members when it processes the accepted message, excludes the sender, and fans out a generic notification to their enabled installations. Notification metadata is only an opaque wake-up/route hint. It does not prove membership, disclose content, grant history, or bypass Firestore/E2EE. Actual access is resolved by the existing group membership/history-entitlement, Firestore and E2EE authorities after PIN unlock. Stale, deleted or no-longer-authorized targets fail closed through that path. This decision is documentation-only pending an explicitly requested release build.
