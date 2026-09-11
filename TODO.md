# FIDUNIO / Hermes — Deferred TODO

These items are intentionally deferred. Do not begin them unless explicitly requested.

1. **Emoticons on messages** — the existing text/E2EE path is Unicode-capable, so native-keyboard emoji entry should require verification rather than a data-format change. A built-in composer picker is a separate small UI feature; per-message reactions are a larger data/synchronization feature. Confirm the intended scope before implementation.
2. **Persistence of FIDUNIO on trusted local devices / encrypted vault reconnection** — preserve the intended trusted-device FIDUNIO installation and account state across normal use, icon removal, browser storage loss, or reinstall without weakening PIN/biometric, account, E2EE, Outbox, or local-security boundaries. The agreed direction is both a same-device verified checkpoint and an optional portable encrypted whole-account vault. Detailed binding candidate design is recorded below; do not implement until explicitly requested.
3. **Administrator-authorized account recovery — User Administration option (reconfirmed 2026-09-11)** — add a visible action at **Settings → User Administration → selected user → Start Account Recovery**. It creates a short-lived, single-use recovery invitation for exactly that selected UID. The administrator authorizes and audits the opportunity but never receives the user's password, PIN, private key, recovery secret, messages, or attachments. The user verifies the Firebase email and privately chooses a new password and six-digit FIDUNIO PIN; the established recovery owner restores the same account encryption key and history. Keep this separate from installation repair. Include expiry, revocation, completion status, initiating-admin identity, timestamps, backend callable enforcement, emulator security gates, and iPhone/iPad acceptance testing. Requirements are recorded below; do not implement until explicitly requested.
4. **Mass-delete messages sent by the owner — DEPLOYED; 1.1.33 DIRECT DEVICE ACCEPTED; GROUP MATRIX PENDING** — **Delete My Sent Messages** is available from Direct Chat Info and Group Info. One confirmation starts bounded server pages that select only authoritative `senderUid == authenticated UID` rows, revalidate membership/sender authority per message, remove attachment/group-history/receipt traces through the established deletion owner, and then physically delete the source. `deleteMyMessagesForEveryoneV1` is deployed and ACTIVE. The first direct test proved deletion on both devices but exposed a temporary sender-row repaint from an intermediate listener snapshot; 1.1.33 suppresses only server-confirmed IDs in memory until authoritative absence. Messages from other senders and queued/failed unsent Outbox rows remain untouched. Direct convergence is device accepted on 1.1.33; complete the group and remaining iPhone/iPad matrix before closing.
5. **Delete or archive a conversation from the Messages list** — add accessible actions on each direct/group row in the Messages/conversation list. Archive must remove the row from the normal list without deleting shared message history. Delete must have an explicit confirmation and a precisely defined local-versus-everyone effect before implementation; reopening, new-message, membership, unread-count, attachment, Outbox, and multi-device behavior must be tested independently.
6. **Enforce “Large attachments on Wi-Fi only”** — make the existing **Settings → Data → Large attachments on Wi-Fi only** selection control the actual attachment-send boundary. When enabled, a large attachment must not start or resume upload on cellular/mobile data; show a clear waiting-for-Wi-Fi state, retain one safe queued send, and resume on Wi-Fi without duplicate publication. Define the authoritative large-file threshold and test Wi-Fi→cellular, cellular→Wi-Fi, offline/restart, direct, group, photo, file, audio, and video paths.
7. **Make “FIDUNIO is installed” actionable** — the Install-panel control must be selectable when FIDUNIO is not installed and must invoke the browser-supported installation flow from that explicit user action. If FIDUNIO is already running from the Home Screen/standalone installation, show the installed state and disable the control. Preserve platform-specific Safari/Android/Fire/desktop handling and keep invitation redemption separate. Do not restore or adapt the rejected 0.9.4.12–0.9.4.15 automatic invite/install code.
8. **Restore the accepted full invitation letter** — replace the current terse generated invitation message with the previously accepted, well-written invitation letter. Recover the exact accepted text from durable history before implementation rather than inventing a replacement. Preserve the personalized role, single-use Join link, Quick Start Guide link, expiry, and safe Mail/Messages/Share/copy behavior; verify readable large-text presentation and line breaks on iPhone and iPad.
9. **Add or remove members in an existing group conversation** — expose reliable administrator-only **Add Members** and **Remove Member** actions in Group Info for an already-created group. Reuse the existing membership and E2EE epoch-rotation authority; added members begin at their join time unless an administrator separately grants earlier history, and removed members receive no future epoch or messages. Require clear confirmation, progress, updated member display, and repeated iPhone/iPad tests covering owner/admin/member roles, multiple additions, removal, history boundaries, notifications, receipts and restart. A direct one-to-one conversation remains exactly two accounts; adding another person must explicitly create a new group rather than silently changing the direct conversation.

## Administrator-authorized account recovery boundary

- Entry point: Settings → User Administration → selected user → Start Account Recovery, with explicit confirmation.
- Recovery authorization is bound to exactly one UID, single-use, revocable, and short-lived (target 30–60 minutes; finalize before implementation).
- Administrator-visible state is limited to requested/created, expiry, pending/completed/expired/revoked, initiating administrator, and audit timestamps.
- The administrator never sees or supplies the user's password, PIN, private encryption key, recovery unlock secret, decrypted messages, or attachments.
- The user opens the recovery invitation, verifies the account email through Firebase, and privately enters the new password and six-digit PIN.
- The existing recovery/E2EE owner restores the same account key. Recovery does not create a replacement identity, disclose content, change roles/membership, or expand message/history permissions.
- Successful use consumes the authorization. Expired, revoked, reused, wrong-user, or incomplete attempts fail closed.
- Keep **Repair This Installation** distinct: it handles a known password/PIN and matching local identity, while **Recover Account** handles genuinely unavailable credentials/device identity.
- Required delivery scope: User Administration UI, authorization/audit record, secure callable backend, user recovery screen, expiry/revocation, permanent unit/integration/emulator gates, and repeated iPhone/iPad acceptance.

## Item 2 — encrypted installation vault and reconnection design

### Existing foundation and limitation

FIDUNIO already maintains `fidunio-account-vault-v3`, containing per-account snapshots of encrypted application state, encrypted history cache, encrypted Outbox data, device-identity records, and account metadata. This is a useful same-origin/account-switching foundation, but it is not a portable backup. Its AES local-storage key is a separate non-exportable browser `CryptoKey`; some identity metadata is not secret-encrypted; structured-cloned device keys cannot simply be written to a portable file; and clearing the website origin can remove both the live database and internal vault. A direct IndexedDB copy is therefore neither sufficient nor an approved restore format.

### Two-level target

1. **Same-device checkpoint vault:** retain a versioned last-known-good account snapshot in a separate record. The single storage owner prepares, cryptographically verifies, commits and rereads the primary update before advancing the checkpoint. Interrupted or invalid updates retain the preceding verified checkpoint. This protects against partial transactions, faulty revision changes, startup corruption and defective releases, but not complete origin deletion.
2. **Portable encrypted vault:** allow the user to create one `.fidunio` recovery file containing the encrypted account snapshot plus a securely wrapped Vault Backup Key. It must survive icon removal, origin-data loss or reinstall without exposing usable data to possession of the file alone.

### Portable contents

Include encrypted application state, encrypted history cache, encrypted Outbox, settings/trusted-peer state, UID, account `keyId` and revision, backup schema and FIDUNIO versions, creation time, and cryptographic integrity/authenticity data. The minimum public envelope may identify format, version and account binding but must not contain plaintext messages, attachments, passwords, PINs, private keys, recovery secrets, drafts or Outbox payloads.

Do not restore Firebase authentication sessions, FCM tokens, biometric credentials, temporary notification routes, device-specific notification installation IDs, stale membership/role authority, or unverified receipt state. Device-bound keys that cannot be safely exported must be recreated and re-registered rather than serialized unsafely.

### Opening authority

Opening a portable vault requires the matching authenticated Firebase UID, the existing six-digit FIDUNIO PIN, and the existing server recovery authority. The file alone and the PIN alone must be insufficient for offline decryption. Restore preserves the same account E2EE identity/keyId; it must never silently generate a replacement identity or expand message/group/history entitlement.

### Single-owner restore and activation

The sole storage/startup owner imports into quarantine and holds the normal application UI closed while it:

1. validates format, supported schema, size bounds and cryptographic integrity;
2. verifies authenticated UID and authoritative cloud `keyId` binding;
3. invokes the established PIN/server recovery boundary to restore the same account identity and unwrap the Vault Backup Key;
4. decrypts and validates the candidate without overwriting live state;
5. compares revisions and refuses to replace newer authoritative identity state;
6. refreshes account status, group membership/history entitlement, deletion state and receipts from Firebase/Firestore;
7. reconciles every restored Outbox ID against authoritative server state so sent/deleted rows are not resent and legitimate unsent rows remain queued;
8. recreates device-specific notification/biometric registrations through their existing owners;
9. atomically activates the verified vault, rereads it, then releases startup; and
10. retains the pre-restore state in quarantine until activation is confirmed, with deterministic rollback on failure.

No listener, renderer, Settings module, service worker or import callback may bypass this serialized activation owner.

### User-facing reconnection cases

- **Icon removed but origin data remains:** detect the verified internal account vault after Firebase sign-in and offer **Reconnect Existing Installation**; no file selection is needed.
- **Website/origin data removed or new installation:** offer **Reconnect from FIDUNIO Vault**, accept the `.fidunio` file, then perform the authenticated PIN/server-controlled restore above.

### Required acceptance

Test export/import, tampering, wrong account, wrong PIN, expired/locked recovery, old/new revisions, corrupt/truncated/oversized files, unsupported schema, interrupted import, rollback, origin deletion, icon-only removal, multiple accounts, multi-device convergence, Outbox duplicate prevention, deletion convergence, groups/history entitlement, receipts, notifications, attachments, disappearing content, and iPhone/iPad/Fire 8 browser behavior. Ordinary startup, password change/reset, PIN/biometric unlock and account recovery must regress unchanged. This remains a deferred design and carries no implementation authority.

## Current focus

- Notification tap routing, exact-message priority projection, newest positioning and composer stability are DEVICE ACCEPTED on iPhone and iPad at the FIDUNIO 1.1.24 checkpoint.
- N6 group + multi-device notifications are DEVICE ACCEPTED on FIDUNIO 1.1.29: the user reports cold and warm notification tests passed on both iPad and iPhone with no repeated permission banner.
- FIDUNIO 1.1.30 corrects the newly reported sender-side gap where an outgoing bubble could disappear between its first optimistic render and the Sent confirmation. The permanent gate now covers listener-snapshot retention, not only source ordering.
- Existing-group add/remove-member controls were reported unavailable during device use. The underlying membership/epoch owners already exist; diagnose UI/role exposure separately before changing membership security.
