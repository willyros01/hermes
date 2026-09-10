# FIDUNIO 1.1.9 Rogue Runtime Code — Ramifications and Retest Authority

Date: 2026-09-10  
Status: DOCUMENTATION-ONLY AUDIT — NO RUNTIME REPAIR APPROVED OR IMPLEMENTED  
Audited checkpoint: `main` commit `a3830afd8a01f88448e42703ac4b803058451ef8`, visible version 1.1.9

## 1. Purpose and governing restriction

This document records the full known impact of timing-driven and duplicate lifecycle behavior discovered in the restored 1.1.9 runtime. Discovery does not prove that any listed item causes the notification-routing failure. None may be removed, rewritten, or consolidated without a separately approved implementation boundary and the complete retest matrix in this document.

Notification routing and iPad message-display latency remain separate investigations. They must not be combined with lifecycle cleanup.

The governing architecture remains:

```
ONE RESOURCE
-> ONE OWNER
-> ONE PREDEFINED AREA
-> ONE SERIALIZED WRITE PATH
```

No future repair may introduce reload repair, orientation repair, MutationObserver repair, timing repair, duplicate Firebase/subscription owners, or fire-and-forget mutation of shared state.

## 2. Audited rogue paths

### R1 — `scheduleReconnectRecovery()`

Observed behavior:

- clears two existing timer handles;
- immediately calls `flushQueuedAfterAuthoritativeReconcile()`;
- schedules another call after approximately 1.5 seconds;
- schedules another call after approximately 4 seconds;
- does not await the immediate call.

Resources reached:

- encrypted IndexedDB Outbox;
- local message rows and their Queued/Sending/Failed/Sent projection;
- authoritative Firestore message-ID reads;
- direct and group replay selection;
- disappearing-message local purge/convergence;
- Firebase authentication-session validation;
- application persistence and visible error state.

Potential consequences:

- repeated server reads from one lifecycle event;
- later lifecycle events adding work while an earlier serialized cycle is active;
- status changes or visible errors occurring after the initiating event;
- delayed or repeated projection work during reconnect;
- apparent screen hangs while serialized reconciliation is still running;
- wider coupling between resume, connectivity and message sending.

### R2 — `recoverForegroundCloudSession()`

Observed behavior:

- updates online state;
- starts `applyPendingNotificationRoute()` without awaiting it;
- force-replaces the active direct-message subscription;
- schedules reconnect recovery when online;
- calls global `render()` unconditionally.

Resources reached:

- notification route state;
- selected conversation and route;
- direct-message listener ownership;
- Outbox/reconnect coordinator;
- global DOM projection for the currently selected screen;
- local persistence triggered by render.

Potential consequences:

- route application racing a render of the previous screen;
- an active message listener being replaced during ordinary foreground return;
- Settings or a child screen being rebuilt during resume;
- PIN fields, composer state, modal state or scroll position being disturbed;
- message callbacks and read-receipt work restarting during a foreground transition.

### R3 — `online` event handler

Observed behavior:

- sets online state;
- force-replaces the active direct-message subscription;
- globally renders;
- invokes the three-attempt reconnect schedule.

Affected events include Wi-Fi restoration, LTE acquisition, Wi-Fi-to-LTE/LTE-to-Wi-Fi handoff and transient connectivity recovery.

Potential consequences include subscription churn, repeated Outbox reconciliation, duplicate-looking UI transitions, delayed optimistic projection, receipt lag and lost transient screen state.

### R4 — `offline` event handler

Observed behavior:

- sets offline state;
- clears both reconnect timers;
- schedules persistence;
- globally renders.

Although clearing timers is defensive inside the current design, this handler is coupled to R1. Removing or changing R1 requires redesigning R4 in the same approved lifecycle boundary.

Potential consequences include rebuilding the active screen during a connectivity transition and changing composer, picker, modal, scroll or PIN presentation while the user is interacting.

### R5 — `visibilitychange` and `pageshow`

Both can invoke `recoverForegroundCloudSession()` for one foreground return. A typical iOS resume may therefore enter the same recovery owner more than once.

Potential consequences:

- repeated forced subscription replacement;
- repeated reconnect scheduling;
- repeated global render;
- multiple pending route-application attempts;
- overlapping work at the app/Firebase boundary.

No exact event ordering may be assumed across iPhone, iPad, standalone PWA, Safari tab restoration or bfcache restoration.

### R6 — `initializeFirebaseLayer()`

The authentication callback calls:

- conversation subscription startup;
- group subscription startup;
- `ensureActiveCloudMessageSubscription(true)`;
- `applyPendingNotificationRoute()`;
- `scheduleReconnectRecovery()`.

After `await initFirebase(...)`, initialization again calls:

- `ensureActiveCloudMessageSubscription(true)`;
- `applyPendingNotificationRoute()`;
- `scheduleReconnectRecovery()`.

Potential consequences include duplicate startup/recovery entry, forced listener replacement during authentication settlement, repeated Outbox reconciliation and render activity while Settings/messages/unlock state is stabilizing.

### R7 — `applyPendingNotificationRoute()`

When a valid pending route exists, it:

- resolves or merges the authoritative conversation;
- mutates `state.selectedId`, `state.route`, modal/tools state and unread state;
- closes group ownership;
- calls `beginCloudMessageSubscription(...,{force:true})`;
- clears the pending route and URL metadata;
- persists and renders.

This is the correct application route owner, but its forced direct-message rebind couples notification navigation to the shared subscription owner. It may cause catch-up reads and downstream processing. It is not proven to cause the current routing failure because current device evidence shows that no pending route reaches the app.

### R8 — `firebase.js subscribeConversationMessages()`

This is the underlying message-stream owner.

Observed behavior:

- keeps one `messageStreams` entry per conversation;
- reuses or replaces callback tokens;
- performs catch-up `getDocs()` work when an existing stream is rebound;
- serializes callback delivery through `stream.delivery`;
- delays final close by approximately 250 ms;
- may cancel that delayed close when a new owner reuses the stream.

This design must be reviewed together with every forced caller. Editing only the caller or only `firebase.js` can change ordering, lost-callback protection, catch-up delivery and subscription lifetime.

### R9 — direct-message projection latency

The direct-message callback:

1. filters hidden rows;
2. resolves legacy key material when required;
3. decrypts/projects each row;
4. reads Outbox records;
5. performs authoritative projection and possible local purge;
6. updates in-memory messages and conversation preview;
7. awaits `cacheCloudHistory()`;
8. awaits `persistState()`;
9. may await `markCloudConversationRead()`;
10. renders only after those awaited operations.

This ordering can delay visible receipt of a newly projected message, particularly on iPad/Safari IndexedDB or network paths. It is separate from notification click routing. Optimizing it requires its own release, durability analysis and receipt regression plan.

## 3. Explicit screen impact matrix

| Screen or mounted area | How rogue lifecycle work can touch it | Required retest |
|---|---|---|
| PIN unlock | Global render and asynchronous notification-route attempts occur around unlock; message callbacks may arrive while PIN is mounted | Lock app, return normally and by notification, enter all six digits, verify no cleared/duplicated slots, no Continue bypass, correct success/failure behavior |
| Messages/chat list | Conversation subscriptions restart during init/resume; global render rebuilds the list | Cold launch, warm resume, receive while list visible, confirm complete list, stable ordering, unread counts and no blank list |
| Direct conversation | Forced subscription replacement and serialized catch-up projection touch the active conversation | Live receive both directions, history continuity, no duplicate/missing rows, stable scroll/composer, correct decrypt |
| Direct Chat Info | Global render may replace the route while background work settles | Open, background/resume, switch networks, verify it remains Chat Info and Back returns correctly |
| Settings parent | `recoverForegroundCloudSession()`, online/offline and auth callbacks can globally render Settings | Leave Settings open, background/resume, switch networks, verify Settings remains selected without blanking, jumping or duplicated panels |
| General Settings host | Parent render can replace permanent host and require deterministic remount | Change appearance/text size, resume and reconnect, verify values and one mounted owner |
| Privacy & Access host | PIN/biometric/lock-timeout controls depend on stable mount and local-security state | Open child, background/resume, lock/unlock, verify controls remain correct and no duplicate handlers |
| Profile host | Auth/profile and device publication callbacks can render Settings | Open Profile through auth settlement/resume, verify fields remain stable and Save acts once |
| User Administration host | Firebase auth/subscription work can rebuild Settings parent | Open, resume, verify list, permissions and navigation remain correct |
| Invitations host | Parent replacement can disturb invitation owner and pending UI | Create/view/revoke flows as authorized; verify one operation, no duplicated controls or lost status |
| Data host | Global Settings render can replace data controls | Open and resume; verify controls remain mounted and no unintended data operation occurs |
| About host | Lowest mutation risk but still subject to parent replacement | Open, resume/reconnect, verify version 1.1.9 and stable Back navigation |
| Notifications host | Token/permission state shares Firebase startup but must remain installation-scoped | Verify Enabled state, sender-name preference, no repeated permission prompt, no duplicate registration |
| New Message | Global render can replace recipient picker during lifecycle recovery | Open picker, background/resume and reconnect, verify search/results/selection and one conversation creation |
| New Group / Group Name | Global render and group-owner close/open interactions may disturb staged group state | Select members, name group, background/resume at each stage, confirm selections persist and creation occurs once |
| Group conversation | Reconnect recovery includes group Outbox and group message authority | Live receive, offline queue/replay, group decrypt, receipts and no duplicate rows |
| Group Info | Global render and group owner transitions may rebuild the responsive screen | Portrait/landscape, background/resume, membership/admin actions and Back; verify two-pane layout and no narrow-phone regression |
| Attachment picker/camera/recorder | Offline/visibility events can fire during native picker/camera transitions | Photo/file/audio/video selection, 10s and >10s camera return, cancel, background return; verify one staged row and no premature lock |
| Attachment receive/download UI | Listener rebind and projection latency affect descriptor appearance and download state | Receive/download each type, resume/reconnect, verify no false descriptor, duplicate download or resurrected purge |
| Pending-message delete modal | Global render removes modal backdrops and may clear `state.modal` paths indirectly | Long-press queued/sending/failed row, background/resume, cancel/delete once, verify Outbox and visible row converge |
| Disappearing selector and messages | Reconnect reconciliation can purge local traces and global render rebuilds composer | Verify selector persistence, unread protection, post-Read purge, restart/reconnect anti-resurrection |
| Startup/loading state | Duplicate initialization and recovery entry can extend or repaint startup | Cold launch on iPhone/iPad, verify visible loading feedback, bounded arrival at PIN/messages and no blank screen |

## 4. Explicit functionality impact and required proof

### Launch, lock and navigation

- ordinary cold launch on iPhone and iPad;
- installed-PWA warm resume without notification;
- Safari/tab resume where supported;
- manual Lock Now;
- automatic lock after configured timeout;
- correct six-digit PIN, wrong PIN and biometric fallback;
- no PIN bypass;
- stable previous route on ordinary resume;
- notification route only when a valid notification intent exists.

### Connectivity and Outbox

Run each on both iPhone and iPad:

1. online send;
2. Wi-Fi to LTE transition, then send;
3. LTE to Wi-Fi transition, then send;
4. compose/send fully offline;
5. restore connectivity;
6. verify queued row replays exactly once;
7. verify no duplicate bubble or duplicate Firestore message;
8. verify no disappearance of optimistic row;
9. verify ambiguous attempted send fails closed;
10. verify pending-message deletion removes the intended Outbox row only.

### Direct messaging, subscriptions and receipts

- live receive while the direct chat is open;
- receive while Messages is open;
- receive while Settings and every permanent Settings child is open;
- no missing or duplicated rows after foreground return;
- no lost conversation list;
- historical messages remain decryptable;
- Sent -> Delivered -> Read advances without sending a reply;
- sender and recipient reopen/history convergence;
- multi-device same-UID listener behavior;
- only one active direct-message subscription owner.

### Groups

- group creation and membership projection;
- group live receive;
- group offline queue and exactly-once replay;
- group E2EE decrypt/history;
- group Delivered/Read receipts;
- group resume and Group Info navigation;
- no direct/group owner overlap;
- multi-device same-UID behavior.

### Disappearing content

- direct and group text unread protection;
- purge begins only from authoritative Read eligibility;
- attachments purge through server authority;
- local history, object URLs, Outbox and caches converge;
- reconnect and restart do not resurrect purged content;
- lifecycle recovery does not prematurely purge cache-only absence.

### Attachments

For photo, file, recorded audio, chosen audio and video:

- selection/capture and cancellation;
- immediate visible staging;
- encrypted upload publication barrier;
- recipient display and download/decrypt;
- offline/reconnect behavior;
- failure is explicit and never rendered as a downloadable descriptor;
- attachment purge and reopen anti-resurrection;
- camera/picker background transitions do not trigger duplicate send or premature lock.

### Settings and permanent hosts

For General, Privacy & Access, Profile, User Administration, Invitations, Data, About and Notifications:

- open the parent and child;
- background and resume;
- switch Wi-Fi/LTE;
- receive a direct message while the child remains open;
- confirm child remains in its predefined host;
- confirm one set of controls and one handler;
- save/cancel/back performs exactly one action;
- no broad query/mount under `.content.settings`, `#app` or `document.body`.

### Notification routing — separate boundary

- private and sender-name modes;
- notification appears once;
- cold app and warm/background app;
- tap -> PIN -> exact direct conversation;
- ordinary resume without notification preserves previous screen;
- deleted/disappeared message tap opens authoritative conversation without resurrecting content;
- iPhone and iPad;
- multiple installations under one UID;
- no UID-global consumable route;
- no notification code writing messages, receipts or E2EE state.

## 5. Ramification rules before any repair

A proposal must identify:

1. the one owner being changed;
2. exact mutable resources;
3. authorized lifecycle event;
4. serialization mechanism;
5. every caller removed or retained;
6. screens and functions requiring retest;
7. permanent regression tests;
8. why the change cannot duplicate Firebase, subscription, Outbox, receipt or purge ownership.

Lifecycle cleanup must not share a release with:

- notification payload/click-routing redesign;
- direct-message projection latency optimization;
- Settings feature work;
- E2EE/key changes;
- attachment changes;
- disappearing-content changes.

## 6. Current notification investigation result

The restored backend sends a common FCM `notification` payload plus opaque `data`. Firebase documents background notification messages as automatically displayed. FIDUNIO simultaneously expects its own service-worker `push` and `notificationclick` path to own display and route construction.

Current device proof on both iPhone and iPad is:

`notification -> tap -> PIN -> Settings`

Earlier diagnostics found that the resumed URL was `/hermes/` without routing parameters and that no FIDUNIO `push` or `notificationclick` event was recorded. Therefore the current evidence places the break before `app.js` route application. The PIN and Settings owners must not be modified to compensate.

A future notification proposal must choose one display/click owner and reconcile that design with the service worker's separate execution environment. The rejected 1.1.9.1–1.1.16 experiments remain rejected.

## 7. Current iPad latency evidence

The iPad took approximately 30 seconds or more for the reported message-delivery event, while iPhone notification arrival was approximately 1–2 seconds. It is not yet established whether the delayed event was:

- OS notification appearance;
- Firestore message arrival;
- decrypt/projection;
- cache/persistence;
- receipt update;
- final render.

No latency repair is authorized until that boundary is measured. R9 is a plausible projection-latency contributor, not a proven cause.

## 8. Documentation-only checkpoint restrictions

This audit changes documentation only. It does not authorize or include:

- edits to `app.js`, `firebase.js`, service worker or Functions;
- version or shell-revision bump;
- Firebase/Firestore/FCM deployment;
- Firestore rules change;
- GitHub Pages promotion;
- device acceptance claim;
- baseline completion claim.


## FIDUNIO 1.1.17 — data-only service-worker notification owner — 2026-09-10

**Status: IMPLEMENTED REPOSITORY CANDIDATE; LIVE FUNCTION DEPLOYMENT AND DEVICE ACCEPTANCE REQUIRED.** The server notification core now sends one opaque data-only FCM payload per eligible installation. The payload contains only type, conversationId, messageId and the bounded OS-visible notification body (private “New message” or the installation-opted authoritative sender display name). It has no common FCM notification object, message text, attachment information, ciphertext, keys, PIN or recovery material.

The existing FIDUNIO service worker is registered as a module and initializes a named Firebase Messaging-only worker app using the unchanged protected firebase-config.js. It initializes no Auth, Firestore, App Check, Functions or Storage service. Firebase Messaging onBackgroundMessage is the one background display owner; it validates the payload, suppresses display when a FIDUNIO window is visible, and attaches the opaque route to the notification. The existing notificationclick -> routed URL -> PIN -> app.js path remains unchanged. app.js remains route/message owner and Firestore + E2EE remain message authority.

No rogue lifecycle, Outbox, receipt, subscription, Settings host, group, attachment, disappearing-message or direct projection code changed. Version advances from 1.1.9 to 1.1.17 because 1.1.9.1 through 1.1.16 are rejected historical experiments. Full baseline, exact Pages verification, live N4 Function deployment and iPhone/iPad device acceptance remain required.

## FIDUNIO 1.1.18 rejected; projection evidence remains separate — 2026-09-10

The returned-client notification message/focus experiment is removed after no iPad improvement and reduced perceived iPhone stability/performance. The exact 1.1.17 frontend click path is restored. Separately, iPad showed a delivered message only after leaving/re-entering its conversation and another after about five seconds. That evidence remains within the documented projection/lifecycle scope. No rogue timer, foreground/reconnect handler, subscription replacement, Settings mount, PIN, receipt, Outbox, E2EE, group, attachment or disappearing-message code is changed by the restoration.

## FIDUNIO 1.1.19 diagnostic touch/ramification matrix

Instrumentation observes but does not change `scheduleReconnectRecovery`, `recoverForegroundCloudSession`, online/offline, visibilitychange/pageshow, `initializeFirebaseLayer`, `applyPendingNotificationRoute`, direct subscription callback and render. Screens observed are PIN unlock, Settings, Messages list and direct conversation. Functionalities observed are worker receipt/display/click, window open/resume, Firebase readiness, route selection and delayed message projection. Groups, attachments, disappearing content, Outbox mutation, receipts and E2EE are not instrumented internally or modified. Retest is intentionally bounded to one iPad failing route plus one iPhone control, ordinary Settings access to the report, and confirmation that message content/send/receive remains intact.

### Diagnostic separation confirmed

The 1.1.19 iPad report proves FDA-NOTIFY-002 occurs before any rogue application lifecycle path can route the notification: no worker click/open event and no pending route reached the page. Do not modify the rogue lifecycle paths to repair notification tapping. Separately, the report measured approximately 3.7–4.0 seconds between the authoritative 48-row snapshot start and completed message projection/cache/persist, followed by repeated roughly three-second subscription/projection passes. That evidence strengthens the separate projection/lifecycle investigation but does not yet authorize cleanup. Screens potentially affected by future lifecycle cleanup remain PIN/startup, Messages list, direct conversation, Settings/Profile/User Administration loading and receipt refresh; all existing retest requirements remain binding.

### 1.1.20 separation and retest boundary

The notification inbox adds no caller to `scheduleReconnectRecovery`, `recoverForegroundCloudSession`, online/offline, visibilitychange/pageshow, forced subscription replacement or delayed projection. It enters only through the existing serialized `applyPendingNotificationRoute()` readiness gate. Touched presentation is direct-chat selection plus a multiple-conversation chooser; Settings loses only the temporary diagnostic link. Re-test PIN/startup, Messages, Settings, direct chat selection, direct message receipt state and attachment continuity because those screens border the route transition, but do not interpret their acceptance as cleanup or acceptance of FDA-RUNTIME-001.

### 1.1.21 approved bounded lifecycle ownership repair and ramifications

New device evidence proved the 1.1.20 process-lifetime inbox cache invalid. The user separately observed active message composition jumping and losing entered text. This authorizes only the shared activation/render ownership boundary required by those two defects. `requestAppActivation()` replaces independent route/render/forced-listener work in hydration, unlock, Firebase readiness, foreground, online/offline and worker-message entry points. `scheduleReconnectRecovery()` and its Outbox semantics remain unchanged and are invoked once by the activation owner; R1 is not otherwise cleaned up. Existing active direct subscriptions are reused rather than force-replaced.

Background direct/group message projection, conversation/group metadata, peer display names, attachment completion and Outbox status still update their established state owners, but request the central background UI projection. They may update chat messages, status, active name and tablet conversation list; they cannot replace the active textarea. Structural renders retain ephemeral draft/focus/caret/scroll through the composer owner.

Touched screens: startup/loading, PIN/biometric transition, Settings-to-notification transition, Messages, direct conversation, group conversation, multiple-notification chooser and iPad sidebar. Touched functions: initialization/auth activation, foreground/connectivity recovery, pending route application/finalization, active subscription reuse, central render, chat message/status projection, composer binding, attachment projection and Outbox status projection. Mandatory retest: cold/warm PIN startup; ordinary no-notification Settings resume; repeated notification routing from Settings/Messages/another chat on both devices; multiple notification chooser; active typing during incoming message, receipt change, peer-name update, attachment completion, online/offline and background return; caret/focus/scroll stability; send exactly once; Sent/Delivered/Read; offline/Outbox replay; iPad portrait/landscape and iPhone; text plus one attachment. Firebase backend/rules, E2EE, receipt and Outbox authorities remain unchanged.
