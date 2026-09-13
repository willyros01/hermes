# FIDUNIO Administrator-Authorized Account Recovery Authority

## Status

FIDUNIO 1.1.45 repository candidate. Backend function deployment and real-device acceptance are required before TODO Item 3 is closed.

## User-facing entry point

Settings → User Administration → Manage Users & Access → selected user → ••• → Recovery → **Start Account Recovery**.

The existing `settings-lifecycle.js` Settings owner remains the only User Administration UI owner. Recovery authorization mutations use the established serialized Settings mutation queue.

## Authorization policy

- A recovery authorization is bound to exactly one FIDUNIO UID.
- It is single-use, revocable, and valid for 30 minutes.
- No account may authorize recovery for itself.
- The Owner account cannot be a recovery target.
- An Administrator may authorize an eligible active User.
- The Owner may authorize an eligible active User or Administrator.
- An Administrator cannot authorize another Administrator.
- Deactivated or otherwise inactive accounts cannot receive a new authorization.
- The opaque recovery token is generated server-side; only its SHA-256 identifier is stored in Firestore.
- Expired, revoked, reused, wrong-account, or conflicting authorization attempts fail closed.

## Privacy and security boundary

The administrator authorizes only the opportunity to recover an account. The administrator never receives or supplies the user's password, six-digit FIDUNIO PIN, private encryption key, recovery unlock key, decrypted messages, attachments, or other plaintext content.

The user follows a dedicated recovery page. The user requests the normal Firebase password-reset email, chooses a new Firebase password, signs in to the exact target account, and privately enters the existing six-digit FIDUNIO PIN.

The authorization wrapper then delegates to the existing E2EE recovery core. The same account encryption identity and key are recovered; recovery does not create a replacement identity, change roles or group membership, expand message/history authority, or expose content to the administrator.

## Server ownership

Existing recovery owner:
- `functions/recovery/e2ee-recovery-callable-core.mjs`
- `functions/recovery/e2ee-recovery-firestore-admin-adapter.mjs`

Administrator-authorization wrapper:
- `functions/recovery/admin-recovery-authorization-core.mjs`
- `functions/recovery/admin-recovery-authorization-firestore.mjs`

Server collection:
- `accountRecoveryAuthorizations/{authorizationId}`

The collection is server-owned. No client Firestore write path is introduced.

Authorization states include `PENDING`, `STARTING`, `STARTED`, `COMPLETED`, `REVOKED`, and `FAILED`; a pending authorization past its expiry is presented as expired.

Audit data is limited to the authorization identity, target UID, initiating administrator UID/role, status, expiry, recovery-session binding, and timestamps. Secret credentials and message content are excluded.

## Cloud Functions

FIDUNIO 1.1.45 adds only these callable functions:

- `createAdminRecoveryAuthorizationV1`
- `listAdminRecoveryAuthorizationsV1`
- `revokeAdminRecoveryAuthorizationV1`
- `startAdminAuthorizedRecoveryV1`
- `completeAdminAuthorizedRecoveryV1`

They use the existing recovery service-account boundary. The completion callable uses the existing recovery master secret. Normal recovery functions remain unchanged.

## Client ownership

- `settings-lifecycle.js` owns the administrator action and recovery-result modal.
- `admin-recovery-client.js` is a bounded authenticated callable adapter and does not initialize a second Firebase App/Auth/Firestore owner.
- `account-recovery.html` / `account-recovery.js` own the dedicated target-user recovery screen.
- `e2ee-account-recovery-client.js` and `e2ee-account-runtime.js` add an authorized wrapper around the established recovery flow; the normal recovery flow remains available.

## Deployment

Root `ar.txt` is the controlled deployment handoff. It deploys only the five new administrator-authorized recovery functions to project `fidunio-fef13`.

No Firestore rules deployment is required for this candidate because authorization records are accessed through server-side Admin SDK repositories only.

## Permanent gates

- `admin-recovery-authorization.test.mjs` verifies exact-UID binding, role boundaries, single-use behavior, revocation, and expiry.
- `admin-recovery-wiring.test.mjs` verifies the User Administration action, serialized mutation ownership, recovery-page wiring, existing E2EE runtime use, and absence of a second Firebase initialization owner in the bounded client adapter.
- `.github/workflows/admin-recovery-gate.yml` runs syntax, authorization-policy, and ownership/wiring gates.

## Real-device acceptance required

Before Item 3 may be closed:

1. Administrator on iPhone/iPad can select an eligible user and see **Start Account Recovery**.
2. Creation clearly states the 30-minute, single-use boundary.
3. Copy / Email / Share produces a usable recovery link; revoke disables it.
4. Administrator UI never asks for or displays the user's password or PIN.
5. Target user opens the link, resets the Firebase password, signs in, enters the existing six-digit PIN, and recovers the same FIDUNIO account identity.
6. Existing conversations, groups, history authority, reactions, delete behavior, and normal unlock/login remain unchanged.
7. Wrong-account, reused, and revoked authorization attempts fail closed.
