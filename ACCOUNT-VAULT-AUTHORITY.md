# FIDUNIO Portable Account Vault Authority

**STATUS: BINDING RECOVERY CONTRACT — FIDUNIO 1.1.52 DEVICE CANDIDATE**

## Recovery objective

FIDUNIO must recover the same account after the Home Screen app, browser cache/site data, or local origin storage is removed. A same-origin checkpoint alone is not recovery for this failure. The portable `.fidunio` file is the user-controlled recovery artifact.

## Authority

**ONE ACCOUNT VAULT → ONE CRYPTO OWNER → ONE SETTINGS AREA → ONE SERIALIZED EXPORT/IMPORT PATH.**

- `account-vault-owner.js` serializes each export and import and owns no Firebase, UI, IndexedDB, message, or identity mutation.
- `account-vault-format.js` owns the versioned file envelope and cryptography.
- `settings-lifecycle.js` owns the predefined Settings → Data controls and explicit user gesture.
- `app.js` remains the sole live application-state/history/Outbox snapshot and activation owner.
- `e2ee-account-runtime.js` borrows established server recovery authority for one operation and clears recovered key bytes in `finally`.
- `firebase.js` remains the sole Firebase service owner and supplies server-only reconciliation reads.

## File cryptography and binding

Schema v1 creates one random 256-bit Vault Backup Key and encrypts the JSON account payload with AES-256-GCM. The existing 32-byte Recovery Unlock Key is obtained only through authenticated, PIN-gated server recovery authority. HKDF-SHA256 derives a file-wrapping key from that recovery key, a fresh 16-byte salt, and exact UID/keyId context; the wrapping key encrypts the Vault Backup Key with AES-256-GCM. Separate authenticated additional data binds key wrapping and payload encryption to format, schema, UID, keyId, identity revision and creation time.

The public envelope contains only format/algorithm metadata, UID, keyId, identity revision, creation time, salt, IVs, wrapped key and ciphertext. It contains no plaintext messages, attachments, drafts, Outbox payloads, passwords, PINs, private keys or recovery keys.

Opening requires the matching authenticated Firebase UID, exact existing six-digit FIDUNIO PIN, and successful server recovery authority. Wrong UID, wrong keyId, a vault identity revision newer than current cloud-bound identity, invalid algorithms/schema/limits, corrupt authentication tags, truncation and oversize fail closed before activation. The file or PIN alone cannot decrypt the account.

## Contents and exclusions

The encrypted payload contains versioned application state, encrypted-history plaintext re-enveloped inside the vault, peer trust/settings, hidden-message state, and pending Outbox payloads with their durable `sendAttempted` value. Attachment descriptors and their E2EE keys remain protected inside the encrypted payload; ciphertext objects remain under existing Firebase Storage authority.

The vault does not restore Firebase Auth sessions, notification tokens, notification installation IDs, pending notification routes, biometric credentials, the installation-local PIN verifier, the local AES key, or a private E2EE identity key. The existing authenticated recovery lifecycle restores the same E2EE identity before application startup; device-specific registrations are recreated by their existing owners.

## Quarantine, reconciliation and activation

Import remains closed unless the account is authenticated, E2EE identity is READY, the local PIN verifies, and the browser is online. The candidate remains outside live state while the app authenticates/decrypts it; checks UID, keyId and revision; reads current server message IDs for each cloud conversation; removes inaccessible conversations and server-absent messages/history; removes already-accepted Outbox rows; retains absent never-attempted work as queued; retains absent attempted work only as failed with `sendAttempted:true`; encrypts under the new installation key; atomically replaces only app state/history/Outbox with a pre-import transition; rereads and verifies every record; and removes the transition only after verification.

If activation fails, the prior state is restored. If the browser stops before verification finishes, next startup detects the transition and restores the prior state deterministically. No file may grant membership, group history, receipt, deletion, notification, or identity authority. Failure to read cloud authority removes that conversation instead of accepting stale local entitlement.

## Deletion boundary

A created vault is a deliberate user-held encrypted backup. FIDUNIO cannot edit a copy after it leaves browser control. Before export and import activation, server reconciliation excludes currently deleted or inaccessible data. The UI must tell the user that an older recovery file can contain content that existed when it was created. Once imported, ordinary authoritative deletion and disappearing-content convergence apply. FIDUNIO retains no inactive internal portable copy after successful activation; the pre-import transition exists only until verification or rollback.

## Required validation

Permanent repository coverage must retain cryptographic round trip, tamper/wrong-key/wrong-account/wrong-PIN binding, revision bounds, truncation/oversize limits, denied-conversation removal, deletion convergence, accepted-Outbox removal, attempted-Outbox replay blocking, interrupted activation rollback, service-worker caching and single-owner wiring.

Device acceptance requires creating a `.fidunio` file, removing Home Screen/browser site data, reinstalling on iPhone and iPad, restoring the same E2EE identity with existing PIN/server authority, importing, and verifying current direct/group history, settings, attachments, receipts, deletions and pending-send behavior. Re-enable notification/biometric capabilities through their normal owners, then regress messaging, attachments, deletion, invitation, group membership/history, local PIN and FCM notification → PIN → exact-message routing.

No Firebase rules, Functions, Storage policy, notification backend or other live backend change is part of 1.1.52.
