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
