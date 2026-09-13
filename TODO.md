# FIDUNIO / Hermes — Deferred TODO

These items are intentionally deferred unless explicitly activated by the user.

1. **Message emoji reactions — DEVICE ACCEPTED / CLOSED 2026-09-12** — implemented in 1.1.43 and accepted on real devices. No composer emoji picker is added because the native keyboard already provides emoji entry. Press-and-hold continues to use the existing single Message actions owner. The action sheet provides six large reactions (👍 ❤️ 😂 😮 😢 🙏) in a spacious 3 x 2 section separated from Delete for Me / Delete for Everyone. One account has at most one reaction per authoritative message; selecting another replaces only that account reaction and selecting the same one again removes it. Reactions sync as bounded message metadata through the central Firebase owner. Firestore reaction rules were deployed successfully with `mr.txt`. The user confirmed the reactions work as expected and both delete actions still work. A minor temporary photo/reaction overlap was observed while some images settle; 1.1.44 reduces photo display footprint on iPhone/iPad and keeps reaction chips below the photo in normal layout flow. Item 1 is device accepted and closed.
2. **Persistence of FIDUNIO on trusted local devices / encrypted vault reconnection** — preserve the intended trusted-device FIDUNIO installation and account state across normal use, icon removal, browser storage loss, or reinstall without weakening PIN/biometric, account, E2EE, Outbox, or local-security boundaries. The agreed direction is both a same-device verified checkpoint and an optional portable encrypted whole-account vault. Detailed binding candidate design is recorded below; do not implement until explicitly requested.
3. **Administrator-authorized account recovery — DEVICE ACCEPTED / CLOSED 2026-09-12** — implemented in 1.1.45 under Settings → User Administration → selected user → **Start Account Recovery**. Authorization is exact-UID, single-use, revocable, and valid for 30 minutes. The administrator never receives the user's password, PIN, private encryption key, recovery unlock key, messages, or attachments. The existing E2EE recovery owner restores the same account identity. The five recovery functions were deployed successfully after correcting the Firebase Functions codebase-qualified deployment filter. Real-device acceptance passed: the user confirmed recovery completed successfully, reuse of the same recovery authorization failed as required, and administrator revocation also worked. Item 3 is closed.
4. **Mass-delete messages sent by the owner — DEVICE ACCEPTED / CLOSED 2026-09-11** — **Delete My Sent Messages** is available from Direct Chat Info and Group Info. One confirmation starts bounded server pages that select only authoritative `senderUid == authenticated UID` rows, revalidate membership/sender authority per message, remove attachment/group-history/receipt traces through the established deletion owner, and then physically delete the source. `deleteMyMessagesForEveryoneV1` is deployed and ACTIVE. The first direct test exposed a temporary sender-row repaint from an intermediate listener snapshot; 1.1.33 suppresses only server-confirmed IDs in memory until authoritative absence. The user subsequently confirmed the corrected direct path and the group mass-delete path both work. Messages from other senders and queued/failed unsent Outbox rows remain untouched. Item 4 is device accepted and closed.
5. **Delete or archive a conversation from the Messages list — DEVICE ACCEPTED / CLOSED 2026-09-12** — implemented and deployed in 1.1.35. Every direct/group row in the Messages list has the established Conversation actions control. Archive is installation-local and preserves shared history; Delete is permanent for all participants through the sole server callable, with typed `DELETE` confirmation and the existing deletion barriers. `deleteConversationForEveryoneV1` is ACTIVE and the deletion-barrier Firestore rules are deployed. The user explicitly accepted Item 5 as complete on 2026-09-12. Item 5 is closed.
6. **Enforce “Large attachments on Wi-Fi only” — 1.1.42 CORRECTION; PARTIAL DEVICE ACCEPTANCE PASS** — threshold remains **5 MiB**. The 1.1.41 silent-send fallback for unknown network type is rejected. On real iPhone testing with the setting enabled, a **19 MB LTE send correctly produced the unverifiable-network warning; Cancel prevented sending; repeating and choosing Send Anyway deliberately allowed the transfer.** The first LTE override attempt timed out, while the second completed; that timeout is tracked as transport reliability evidence, not a failure of the Wi-Fi-only safeguard. The same 19 MB file over actual Wi-Fi produced the same warning because iPhone Safari does not reliably disclose Wi-Fi versus cellular; choosing Send Anyway completed successfully. This behavior is accepted for iPhone Safari: if Wi-Fi/Ethernet is positively reported, proceed; if cellular/WiMAX or offline is positively reported, wait; if transport is unknown/unverifiable, fail closed and require explicit **Send Anyway**. Cancellation performs no file read, encryption, Outbox staging or upload. Existing attachment/E2EE/Firebase/direct/group/Outbox/receipt/delete/notification/PIN owners remain unchanged. Keep item 6 open only for the remaining direct/group photo/file/audio/video acceptance matrix and related regression checks.
7. **Make “FIDUNIO is installed” actionable** — the Install-panel control must be selectable when FIDUNIO is not installed and must invoke the browser-supported installation flow from that explicit user action. If FIDUNIO is already running from the Home Screen/standalone installation, show the installed state and disable the control. Preserve platform-specific Safari/Android/Fire/desktop handling and keep invitation redemption separate. Do not restore or adapt the rejected 0.9.4.12–0.9.4.15 automatic invite/install code.
8. **Restore the accepted full invitation letter — DEVICE ACCEPTED / CLOSED 2026-09-12** — release 1.1.40 restored the exact accepted subject and full letter from the validated 0.9.5.1 checkpoint and safe 0.9.4.10 stabilization branch. Copy Invitation, Email Invitation and Share use the same restored inviter introduction, assigned role, expiry, clean single-use Join URL, personal/non-forward warning, clean Quick Start Guide URL, guide summary and FIDUNIO sign-off. The user confirmed the invitation is back to its original accepted form. The current serialized invitation owner and invitation/install separation remain authoritative; rejected 0.9.4.12–0.9.4.15 automatic invite/install code remains absent.
9. **Add or remove members in an existing group conversation — DEVICE ACCEPTED / CLOSED 2026-09-13** — Group Info administrator Add Member / Remove uses the established serialized membership and E2EE epoch-rotation authority. Final real-device acceptance passed Add Member, join-time history exclusion, owner member projection, Remove, Re-add, exclusion of messages sent while removed, post-rejoin bidirectional messaging with Sent→Read, explicit Grant Access → From beginning, background return through the six-digit PIN, persistence of granted earlier history, and FCM notification tap → PIN → exact notified group/message routing. The accepted repair chain is 1.1.47 owner projection, 1.1.50 bounded one-copy-at-a-time history-grant writes, and 1.1.51 immediate unlocked render before asynchronous cloud activation. Corrected group rules were already deployed through the successful 1.1.43 full rules deployment. Direct conversations remain exactly two accounts. Item 9 is closed.
10. **Show password while typing — DEVICE ACCEPTED / CLOSED 2026-09-12** — implemented in 1.1.46 with a large **Show password / Hide password** checkbox through one bounded presentation-only owner. The allow-list covers Sign In, Join, secure-messaging password entry, Profile/Change Password, Security, and Administrator-authorized Account Recovery password fields. The owner only switches the DOM input between `password` and `text`; it does not read, store, log, submit, or transform the password. Six-digit FIDUNIO PIN fields remain masked and outside the visibility owner. Real-device acceptance passed: the user confirmed Show/Hide works and the PIN remains protected. Item 10 is closed.

## Administrator-authorized account recovery boundary

- Entry point: Settings → User Administration → selected user → Start Account Recovery, with explicit confirmation.
- Accepted release: **1.1.45**.
- Recovery authorization is bound to exactly one UID, single-use, revocable, and valid for **30 minutes**.
- Owner may authorize eligible User/Admin accounts; Admin may authorize eligible User accounts. No caller may authorize self or the Owner.
- Administrator-visible state is limited to authorization creation, expiry, pending/started/completed/expired/revoked/failed status, initiating administrator, and audit timestamps.
- The administrator never sees or supplies the user's password, PIN, private encryption key, recovery unlock secret, decrypted messages, or attachments.
- The user opens the recovery link, requests/uses the normal Firebase password-reset email, signs in with the new password, and privately enters the existing six-digit PIN.
- The existing recovery/E2EE owner restores the same account key. Recovery does not create a replacement identity, disclose content, change roles/membership, or expand message/history permissions.
- Successful use consumes the authorization. Expired, revoked, reused, wrong-user, or incomplete attempts fail closed.
- Keep **Repair This Installation** distinct: it handles a known password/PIN and matching local identity, while **Administrator-authorized Account Recovery** handles an administrator-approved recovery opportunity.
- `ar.txt` deploys only `createAdminRecoveryAuthorizationV1`, `listAdminRecoveryAuthorizationsV1`, `revokeAdminRecoveryAuthorizationV1`, `startAdminAuthorizedRecoveryV1`, and `completeAdminAuthorizedRecoveryV1` in the `recovery` Functions codebase.
- Real-device closure passed on 2026-09-12: successful recovery, single-use replay rejection, and revocation were all confirmed.

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

- Item 10 / Show password while typing is DEVICE ACCEPTED / CLOSED on 2026-09-12 after successful real-device Show/Hide testing with PIN masking preserved.
- Item 3 / administrator-authorized account recovery is DEVICE ACCEPTED / CLOSED on 2026-09-12 after successful live recovery, single-use replay rejection, and revocation testing.
- Item 5 / delete or archive conversation is DEVICE ACCEPTED / CLOSED on 2026-09-12.
- Message emoji reactions are DEVICE ACCEPTED / CLOSED on 2026-09-12 after successful rules deployment and real-device confirmation of reaction behavior plus Delete for Me / Delete for Everyone regression checks. 1.1.44 also reduces photo display footprint and reserves reaction layout beneath images.
- Notification tap routing, exact-message priority projection, newest positioning and composer stability are DEVICE ACCEPTED on iPhone and iPad at the FIDUNIO 1.1.24 checkpoint.
- N6 group + multi-device notifications are DEVICE ACCEPTED on FIDUNIO 1.1.29: the user reports cold and warm notification tests passed on both iPad and iPhone with no repeated permission banner.
- FIDUNIO 1.1.30 corrects the sender-side gap where an outgoing bubble could disappear between its first optimistic render and the Sent confirmation. The permanent gate covers listener-snapshot retention, not only source ordering.
- Item 9 / existing-group membership administration is DEVICE ACCEPTED / CLOSED on 2026-09-13. The accepted path includes the 1.1.47 owner-member projection repair, 1.1.50 bounded history-grant writes, and 1.1.51 immediate post-PIN render; add/remove/re-add, history boundary/grant, messaging/receipts, PIN/background return, and FCM exact-message routing all passed real-device acceptance.
