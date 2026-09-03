# FIDUNIO UX Prototype 0.4

Prototype 0.4 is the first version intended for the initial GitHub upload.

## Added in 0.2
- New Message screen
- New Group flow
- Select group members
- Name and create a group
- Group conversation UX
- Sender names on incoming group messages
- Group Info screen
- Member list and owner/admin role display
- Add-member simulation
- Group history-access controls
- New-member privacy rule: a new member sees messages only from the time they join
- Admin may explicitly grant prior-history access
- Group security/history notes in the interface

## Carried forward from 0.1
- Simulated unlock screen
- Conversation list and search
- Individual chat screen
- Quick Compose chips
- Expandable tool tray
- Message state simulation
- Offline queue behavior using browser online/offline events
- Settings and large-text mode

## Important prototype limitations
This is still a UX prototype. It does NOT yet include:
- Firebase
- Real authentication
- Real WebAuthn/passkeys
- Real end-to-end encryption
- Real group key rotation/distribution
- Real push notifications
- Real attachments
- Persistent IndexedDB storage
- Production-grade offline service-worker queueing

The group-history permission screen demonstrates the intended policy only. Production enforcement must be cryptographic and server-rule aware; it must not rely on hiding old messages in the interface.

## Group history policy
Default:
- A new group member can access conversation content only from the time they join.
- Earlier history is not automatically exposed.

Admin override:
- An admin can explicitly grant selected prior-history access.
- Prototype choices shown: last 24 hours, last 7 days, from a selected date, or entire available history.

Planned production design:
- New member receives current group encryption material, not historical keys by default.
- If prior history is explicitly granted, only the authorized history/key material is securely shared.

## Run it
Serve the folder over HTTP/HTTPS rather than opening index.html directly.

Examples:
- Python: `python3 -m http.server 8080`
- VS Code: Live Server
- GitHub Pages: publish the repository and open its HTTPS URL

## Suggested UX test
1. Unlock the prototype.
2. Tap + on Messages.
3. Choose New Group.
4. Select at least 2 people.
5. Name the group and create it.
6. Open Group Info.
7. Add a member and confirm that the UI marks earlier history hidden.
8. Tap History beside a member and test the admin history-access choices.
9. Disable network connectivity, send a message, and verify it shows Queued.
10. Restore connectivity and verify the message progresses through delivery states.

Prototype 0.4 remains intentionally Firebase-free so the UX can be reviewed before backend and cryptographic implementation.

## Initial GitHub upload

Repository name: `hermes`

Recommended description: `Fidunio private messaging PWA`

For the simplest GitHub Pages workflow on GitHub Free, use a **Public** repository.

When creating the repository:
1. Choose **New repository**.
2. Repository name: `hermes`
3. Description: `Fidunio private messaging PWA`
4. Visibility: **Public**
5. Do **not** pre-create a README, `.gitignore`, or license for this first upload, because this package already includes `README.md`.
6. Create the repository.
7. Use **Add file → Upload files**.
8. Upload the extracted files from this package, not the ZIP itself:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `README.md`
9. Commit message: `Initial FIDUNIO UX Prototype 0.4`

### GitHub Pages
After the files are uploaded:
1. Open the repository **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Branch: `main`
5. Folder: `/ (root)`
6. Save.
7. Wait for GitHub Pages to publish the HTTPS site.

Do not commit private keys, service-account JSON, passwords, encryption keys, server credentials, or other secrets to the repository.

## Added / fixed in 0.3
- Fixed History Access navigation so saving returns to Group Info
- Improved Large Text support across Fidunio
- Added Appearance: Auto / Light / Dark
- Auto appearance follows the device/browser color-scheme preference and reacts to changes
- Added visible version information in Settings → About and at the bottom of Settings
- Version number is synchronized with this package: `0.3`

## 0.3 acceptance checks
1. Open Settings and confirm `Version 0.4` is visible.
2. Turn Large Text on and check Messages, Chat, Group Info, History, and Settings.
3. In Appearance, test Light and Dark manually.
4. Select Auto, then change the iPad/iPhone appearance between Light and Dark and confirm Fidunio follows it.
5. Open a group, go to Group Info → History, grant access, and confirm Fidunio returns to Group Info.

## Fidunio branding included in this build
- Approved flat 2D Fidunio profile with winged helmet
- Logo shown on the Fidunio unlock screen
- Logo shown in Settings → About
- `apple-touch-icon` included for iPhone/iPad Add to Home Screen
- 192×192 and 512×512 PWA icons included in `manifest.json`
- Browser favicon included

### Files added
- `fidunio-logo.png`
- `icon-180.png`
- `icon-192.png`
- `icon-512.png`
- `favicon.png`

When updating GitHub, upload all files from this package directly into the repository root.

## Flat GitHub layout for iPad
This build intentionally keeps every file in the repository root. There is no `assets` subfolder.

Upload all files directly to the main `fidunio` repository directory. The image and icon references in the code already point to the root directory.

## FIDUNIO UX Prototype 0.4
This maintenance build keeps the approved Fidunio graphics and flat single-directory GitHub layout.

Changes:
- Large Text now scales the major interface text, message text, controls, settings, group screens, labels, and supporting text much more visibly.
- The fixed chat composer now uses the exact same centered width boundaries as the Fidunio app shell, correcting the iPad/tablet alignment issue.
- Phone widths continue to use the full available app width.
- Version display is updated to 0.4.


## Fidunio 0.4
- Fixed History Access Cancel and Grant Access so the modal closes correctly.
- Replaced the single Large Text toggle with A / A+ / A++.
- A++ is intentionally much larger for easier reading.
- History modal buttons stay reachable when larger text is selected.
- The flat, single-directory GitHub layout is unchanged.

## Fidunio 0.4
- Preserves the existing Fidunio 0.3.2 color scheme.
- No gold was added to the interface.
- Lightens only low-contrast dark-mode text, especially tool labels and secondary information.
- History Access Save/Cancel behavior from 0.3.2 is retained.
- A / A+ / A++ text-size controls are retained.
- Flat, single-directory GitHub layout remains unchanged.

## FIDUNIO 0.5
- Rebrands the project from Hermes to **FIDUNIO**.
- Uses the descriptor **Private Messaging**.
- Keeps the approved winged-messenger artwork unchanged.
- Keeps the approved 0.3.3 UI color scheme and dark-mode contrast.
- Keeps A / A+ / A++ text sizing.
- Keeps the working Group History Access Save/Cancel controls.
- Keeps the flat, single-directory GitHub layout.

## Hermes 0.5 / FIDUNIO 0.5

This is the first functional local build.

- Fixes Group Info/control overflow so the page no longer requires horizontal scrolling on iPhone/iPad.
- Adds `service-worker.js` and app-shell caching for the PWA foundation.
- Adds IndexedDB persistence so conversations, messages, settings, and selected conversation survive reload/relaunch.
- Local persisted app state is encrypted with AES-GCM using the Web Crypto API.
- Adds a persistent IndexedDB Outbox. Messages sent while offline remain queued across reloads and are processed after connectivity returns and the PWA gets execution time.
- Keeps client-generated UUID message IDs.
- Keeps the approved FIDUNIO graphics, UI palette, A/A+/A++ sizing, group-history controls, and flat repository layout.
- Firebase/network transport is intentionally not included yet; this release proves the local persistence/offline engine first.

Important: local AES-GCM storage in 0.5 is a functional prototype foundation, not the final end-to-end encryption/key-management design. Firebase transport, device identity, production key wrapping/recovery, and multi-device E2EE remain later milestones.


## Hermes 0.6 / FIDUNIO 0.6

0.6 adds the Firebase foundation and first real one-to-one, two-account Firestore transport while retaining the 0.5 encrypted IndexedDB Outbox.

Added:
- Firebase Web modular SDK bridge using Firebase's browser-module CDN.
- Firebase Email/Password account creation/sign-in/sign-out.
- Visible per-account FIDUNIO ID (Firebase UID) for the controlled two-device test.
- Direct cloud conversation creation by recipient FIDUNIO ID.
- Real Firestore message transport and live message listeners.
- Provided Firestore Security Rules.
- Persistent offline Outbox feeds queued cloud messages to Firestore after reconnect/foreground.
- Detailed iPad-first setup guide: `hermes-ux-0.6-setup.txt`.

Security warning:
0.6 is a transport prototype and does NOT yet provide end-to-end encryption for Firestore message text. Use only harmless test messages. E2EE/device-key work is the next major security milestone.


## Hermes 0.6.1 / FIDUNIO 0.6.1

0.6.1 is a reliability correction based on real iPad/iPhone testing.

Confirmed before this fix:
- Firebase Email/Password authentication worked on iPad and iPhone.
- iPad -> iPhone Firestore messaging worked.
- iPhone -> iPad reply worked.
- Sender status advanced to Read.
- When the iPad PWA was killed while offline, previously received cloud messages were not visible until connectivity returned.
- A queued cloud message could disappear after kill/reopen and never reach the other device.

0.6.1 fixes:
- Encrypted IndexedDB Outbox is now authoritative for unsent messages.
- IndexedDB writes for critical state and Outbox records wait for transaction completion.
- Startup reconstructs any missing queued message from the encrypted Outbox.
- Firestore snapshots preserve local queued/sending/failed messages instead of overwriting them.
- Downloaded cloud messages are committed immediately to encrypted local storage so they remain readable after an offline relaunch.
- Firebase authentication completion triggers an Outbox retry, avoiding dependence on a new online event.
- Outbox records are removed only after Firestore confirms the message write.
- Missing normal message-cache state can no longer cause an Outbox record to be deleted.
- Cloud direct conversations display "Connected" instead of the misleading "Secure" status until E2EE exists.

Configuration protection:
- This update ZIP intentionally does NOT include `firebase-config.js`.
- Keep the already configured `firebase-config.js` in the GitHub repository.
- `config-firestore.js`, if present in the user's repository/workflow, is also protected and must not be overwritten or included in version ZIPs.

0.6.1 remains a transport prototype. Cloud message content is not yet end-to-end encrypted.


## Hermes 0.6.2 / FIDUNIO 0.6.2

0.6.2 fixes the foreground receive bug found during the first 0.6.1 online retest. A cloud chat could be opened before Firebase Authentication finished restoring; the message subscription then did not attach. 0.6.2 attaches/re-attaches the active cloud message listener after auth restoration, after Firebase initialization, on reconnect, and when iOS/PWA returns to the foreground. All 0.6.1 encrypted Outbox and offline-cache fixes are retained.

`firebase-config.js` and `config-firestore.js` are intentionally excluded from this ZIP. Preserve the existing configured copies in GitHub.


## Hermes 0.6.3 / FIDUNIO 0.6.3

0.6.3 addresses the failed iPad offline cold-start history test after 0.6.2 passed live two-way foreground messaging.

Observed:
- 0.6.2 online live receive passed.
- After Airplane Mode + kill/reopen on iPad, previously downloaded iPhone/cloud messages were absent.
- The cloud-chat header still displayed Connected because that label represented cloud-conversation type, not verified network reachability. This was misleading.

0.6.3 corrections:
- IndexedDB schema v2 adds a dedicated `history` store.
- Each Firestore snapshot is encrypted and durably saved per conversation in that store.
- Offline startup restores the dedicated cloud-history cache before Outbox reconstruction and first render.
- Existing queued/sending/failed local messages are merged with restored history.
- Safari/iOS CryptoKey creation no longer keeps an IndexedDB transaction open across asynchronous Web Crypto key generation; key read and key write use separate transactions and the write is awaited.
- Cloud-chat header now says `Cloud` rather than `Connected`, because a static conversation label must not imply verified Internet reachability.
- All 0.6.1 Outbox safeguards and 0.6.2 live-listener fixes remain.

Protected firebase-config.js and config-firestore.js remain excluded.


## Hermes 0.6.4 / FIDUNIO 0.6.4

0.6.4 corrects a specific Safari/iOS IndexedDB bug in the 0.6.3 offline-history restore path.

The 0.6.3 loader opened one read transaction, awaited `getAllKeys()`, and then tried `getAll()` on that same transaction. Safari/iOS is aggressive about auto-closing IndexedDB transactions when JavaScript yields across an `await`, so the second request can fail with an inactive transaction. That prevents the dedicated encrypted history cache from being restored on cold offline startup.

0.6.4 performs one `getAll()` request in one transaction and then decrypts the returned records after that transaction is finished. The records already contain their conversation IDs, so the separate key request was unnecessary.

All 0.6.1 Outbox safeguards, 0.6.2 live-listener fixes, and 0.6.3 dedicated encrypted history storage remain intact.

Protected `firebase-config.js` and `config-firestore.js` remain excluded from the release ZIP.


## Hermes 0.6.5 / FIDUNIO 0.6.5

0.6.5 changes the offline architecture after comparing FIDUNIO with the user's proven JavaScript Scorecard application.

The critical finding was not simply "use localStorage." The important Scorecard discipline is:

1. durable local state is independent from Firebase availability;
2. Firebase is a synchronization layer, not the sole source of what the user should see;
3. a failed/unavailable remote read must never erase locally durable information;
4. Firebase SDK JavaScript may be cached, but Firebase data transport must not be service-worker cached.

A concrete FIDUNIO issue was also identified:
Firestore can emit an offline/cache snapshot on cold start. In 0.6.4, the message listener replaced the locally restored message array with whatever Firestore returned. If that cache snapshot was empty, FIDUNIO erased the locally restored conversation in memory and then saved the empty result. When connectivity returned, the server snapshot populated the messages again. That matches the observed iPad behavior.

0.6.5 fixes:
- `firebase.js` now passes Firestore snapshot metadata (`fromCache`, `hasPendingWrites`) to the app.
- Cached/offline Firestore snapshots MERGE into locally restored history and can never delete locally stored rows.
- Only a server-backed snapshot is treated as authoritative for server messages.
- Local queued/sending/failed outbound messages remain preserved until Firestore confirms them.
- Read receipts are not attempted from an offline/cache-only snapshot.
- Startup is explicitly local-first: local state -> encrypted cloud history -> Outbox reconstruction -> render -> Firebase synchronization.
- The service worker uses the Scorecard-style split:
  * own FIDUNIO files: network-first with offline cache fallback;
  * versioned `www.gstatic.com` Firebase SDK modules: cache-first/background refresh;
  * `googleapis.com` / `firebaseio.com` data transport: never service-worker cached.
- Firebase SDK top-level modules are pre-cached opportunistically during service-worker install.
- Service-worker installation uses `Promise.allSettled`, so one unavailable optional/remote file does not abort the worker installation.
- Existing 0.6.1 authoritative encrypted Outbox, 0.6.2 live listener, and 0.6.3/0.6.4 encrypted history work remain.

Protected configuration:
- `firebase-config.js` is NOT included in this ZIP.
- `config-firestore.js` is NOT included in this ZIP.
- Keep the configured repository copies untouched.

0.6.5 is still a transport prototype; Firestore cloud message text is not yet end-to-end encrypted.


## Hermes 0.7.0 / FIDUNIO 0.7.0

First direct-message E2EE foundation. New 0.7.0 direct messages use a per-installation non-exportable ECDH P-256 private key, HKDF-SHA-256 and AES-256-GCM. Firestore receives ciphertext/IV and an empty legacy text field. This build does not yet implement multi-device key fan-out, safety-number verification, forward secrecy/Double Ratchet, or group E2EE. The proven 0.6.5 local-first/offline architecture remains. Protected Firebase config files are excluded.


## Hermes 0.7.1 / FIDUNIO 0.7.1

0.7.1 corrects the mixed-version labels in the 0.7.0 test build and centralizes the runtime release number.

- `version.js` is now the single authoritative current-version source.
- `app.js` reads the version from `globalThis.FIDUNIO_RELEASE.version`.
- `service-worker.js` imports the same version file and derives its cache name from it.
- Startup/login, Settings/About, warnings, and prototype notices no longer carry stale hard-coded release numbers.
- The 0.7.0 direct-message E2EE implementation and Firestore rule design are retained.
- The proven 0.6.5 local-first/offline architecture is retained.
- `firebase-config.js` and `config-firestore.js` remain protected and excluded.
- One cumulative `hermes-memory.txt` replaces version-specific memory files.

## Hermes 0.7.2 / FIDUNIO 0.7.2

0.7.2 repairs the direct-E2EE conversation identity problem found during the first 0.7.1 test. Firestore conversation discovery already returned `peerUid`, but the local merge dropped it. Since E2EE needs the recipient UID to retrieve the recipient public key, an older/restored conversation could fail before encryption/send. 0.7.2 preserves `peerUid`, repairs missing peer identity from the authoritative Firestore conversation document, preserves it in Outbox recovery data, and retries queued/failed cloud work after conversation reconciliation. It does not change the 0.7.x cryptographic design or Firestore rule design, and it preserves the proven 0.6.5 local-first/offline architecture.


## Hermes 0.7.3 / FIDUNIO 0.7.3

0.7.3 is a focused live-receive/reconnect reliability correction built on the successful 0.7.2 E2EE/offline baseline.

- Keeps `version.js` as the only authoritative current release number.
- Prevents the conversation-list Firestore listener from unnecessarily tearing down and recreating the active message listener whenever `conversation.updatedAt` changes.
- Tracks the currently subscribed cloud conversation so repeated reconciliation is idempotent.
- Explicit chat navigation, authentication restoration, reconnect, `pageshow`, and visible `visibilitychange` can still force one clean listener reattach.
- On reconnect, the Outbox flushes immediately and retries after 1.5 seconds and 4 seconds to tolerate iOS/Safari reporting connectivity before Firebase is fully usable.
- Keeps the 0.7.2 E2EE design, peerUid repair, encrypted local history, authoritative Outbox, and Firestore rules unchanged.
- Protected Firebase configuration files remain excluded.


## Hermes 0.8.0 / FIDUNIO 0.8.0

0.8.0 starts the multi-device identity layer while deliberately preserving the stable 0.7.3 transport and E2EE ciphertext path.

- Each installation receives a stable random Device ID stored locally in IndexedDB.
- The existing non-exportable ECDH P-256 keypair is reused during migration, avoiding an unnecessary key rotation.
- Settings shows the SHA-256 fingerprint of this installation's public key.
- The signed-in installation publishes a public device record under `users/{uid}/devices/{deviceId}`.
- New encrypted message metadata includes `senderDeviceId`.
- The existing account-level `e2eePublicJwk` remains the encryption compatibility bridge in 0.8.0.
- Firestore rules add explicit owner-write/authenticated-read access to public device records.
- Protected Firebase configuration files remain excluded.

0.8.0 is a foundation only: it does not yet encrypt one message separately to every recipient device. Per-device recipient envelopes, verified device linking/key-change approval, forward secrecy, and group E2EE remain future milestones.


## Hermes 0.8.1 / FIDUNIO 0.8.1

0.8.1 adds local contact-key verification and key-change detection on top of the stable 0.8.0 device registry.

- Each contact's observed account compatibility-key fingerprint is stored in the already encrypted local app state.
- Cloud direct-chat Info now opens Conversation Security.
- Users can compare a contact fingerprint over a separate trusted channel and explicitly mark the current key verified.
- A change to a previously verified key becomes a blocking security event for NEW outgoing messages until the new fingerprint is reviewed and verified.
- An unverified key change is surfaced as a warning but is not falsely described as a verified-key compromise.
- Peer keys are refreshed on message send/live snapshot so the app can detect changes rather than trusting an indefinite memory cache.
- The contact device registry count is shown, and FIDUNIO reports when the current compatibility key matches a registered device.
- No Firestore rules change from 0.8.0.
- No change to the stable message ciphertext format, Outbox, offline history, or reconnect architecture.


## Hermes 0.8.1.1 / FIDUNIO 0.8.1.1

UI-only refinement built from the fully passed 0.8.1 security baseline.

- Replaces simple text/emoji-style action graphics with cleaner two-dimensional SVG pictograms.
- Updates Settings, Info, Add/New, Back, Send, and composer tool icons.
- Composer tools now use consistent 2D pictograms for Photo, File, Voice, Location, Contact, Checklist, Schedule, and Saved.
- Retains the existing navy/teal/gray visual language and does not introduce gold.
- No Firebase, Firestore rules, E2EE, device-identity, peer-verification, Outbox, local-history, or reconnect logic changes.
- `version.js` remains the single runtime version source.
- Stable root-level TXT files are `hermes-memory.txt` and `hermes-setup.txt`.


## Hermes 0.8.1.2 / FIDUNIO 0.8.1.2

Responsive UI correction for the 0.8.1.1 icon refresh.

- Fixes composer attachment-panel overflow seen on iPad.
- Uses 4 columns on tablet-width layouts and 2 columns on narrow iPhone layouts.
- Prevents tool buttons and labels from forcing the grid wider than the viewport.
- Adds distinct color accents to the 2D tool icons to improve recognition.
- Keeps all security, Firebase, Firestore, E2EE, verification, Outbox, history, and reconnect logic unchanged.


## Hermes 0.8.1.3 / FIDUNIO 0.8.1.3

Responsive UI refinement combining compact colored attachment icons with adaptive tablet presentation.

- Restores a compact 4×2 attachment-icon grid.
- Keeps recognizable colored 2D icons with complete labels.
- Adds adaptive two-pane tablet layout at wider viewport sizes: conversation sidebar left, active chat right.
- Automatically falls back to single-pane at narrow widths.
- Uses viewport width rather than device-name detection.
- No Firebase, Firestore rules, E2EE, key verification, device identity, Outbox, local history, or reconnect changes.


## Hermes 0.8.1.4 / FIDUNIO 0.8.1.4

UI-only correction to the 0.8.1.3 adaptive tablet release.

- Wide Messages route now enters the two-pane tablet shell immediately.
- Fixes literal `${icon2d(...)}` text appearing in place of the Settings SVG.
- Adds proper Settings/New controls to the tablet sidebar.
- Preserves compact 4×2 colored attachment icons and all 0.8.1 security behavior.
- No Firestore Rules update is required.


## Hermes 0.8.1.5 / FIDUNIO 0.8.1.5

Final iPad UI refinement based on the approved 0.8.1.4 two-pane layout.

- Wide tablet/iPad attachment tools now appear in ONE horizontal row of eight icons.
- The row contains Photo, File, Voice, Location, Contact, Checklist, Schedule, and Saved.
- Icons retain distinct colors and compact labels underneath.
- The iPad conversation sidebar now includes a compact bottom navigation strip for Messages, Groups, Contacts, and Settings.
- iPhone/narrow view remains a compact 4×2 attachment grid.
- No Firebase, Firestore Rules, E2EE, verification, device identity, Outbox, history, or reconnect changes.
