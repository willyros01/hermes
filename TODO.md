# FIDUNIO / Hermes — Deferred TODO

These items are intentionally deferred. Do not begin them unless explicitly requested.

1. **Emoticons on messages** — the existing text/E2EE path is Unicode-capable, so native-keyboard emoji entry should require verification rather than a data-format change. A built-in composer picker is a separate small UI feature; per-message reactions are a larger data/synchronization feature. Confirm the intended scope before implementation.
2. **Persistence of FIDUNIO on trusted local devices / encrypted vault reconnection** — preserve the intended trusted-device FIDUNIO installation and account state across normal use, icon removal, browser storage loss, or reinstall without weakening PIN/biometric, account, E2EE, Outbox, or local-security boundaries. The agreed direction is both a same-device verified checkpoint and an optional portable encrypted whole-account vault. Detailed binding candidate design is recorded below; do not implement until explicitly requested.
3. **Administrator-authorized account recovery — User Administration option (reconfirmed 2026-09-11)** — add a visible action at **Settings → User Administration → selected user → Start Account Recovery**. It creates a short-lived, single-use recovery invitation for exactly that selected UID. The administrator authorizes and audits the opportunity but never receives the user's password, PIN, private key, recovery secret, messages, or attachments. The user verifies the Firebase email and privately chooses a new password and six-digit FIDUNIO PIN; the established recovery owner restores the same account encryption key and history. Keep this separate from installation repair. Include expiry, revocation, completion status, initiating-admin identity, timestamps, backend callable enforcement, emulator security gates, and iPhone/iPad acceptance testing. Requirements are recorded below; do not implement until explicitly requested.

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
