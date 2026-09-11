# FIDUNIO / Hermes — Deferred TODO

These items are intentionally deferred. Do not begin them unless explicitly requested.

1. **Emoticons on messages** — the existing text/E2EE path is Unicode-capable, so native-keyboard emoji entry should require verification rather than a data-format change. A built-in composer picker is a separate small UI feature; per-message reactions are a larger data/synchronization feature. Confirm the intended scope before implementation.
2. **Persistence of FIDUNIO on trusted local devices** — preserve the intended trusted-device FIDUNIO installation/session state across normal device use and app restarts without weakening the existing PIN/biometric, account, E2EE, or local-security boundaries. Scope and acceptance criteria to be discussed before implementation.
3. **Administrator-authorized account recovery** — add a User Administration action that creates a short-lived, single-use recovery invitation for one selected UID. The administrator authorizes and audits the opportunity but never receives the user's password, PIN, private key, recovery secret, messages, or attachments. The user verifies the Firebase email and privately chooses a new password and six-digit FIDUNIO PIN; the established recovery owner restores the same account encryption key and history. Keep this separate from installation repair. Include expiry, revocation, completion status, initiating-admin identity, timestamps, backend callable enforcement, emulator security gates, and iPhone/iPad acceptance testing. Requirements are recorded below; do not implement until explicitly requested.

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

## Current focus

- Notification tap routing, exact-message priority projection, newest positioning and composer stability are DEVICE ACCEPTED on iPhone and iPad at the FIDUNIO 1.1.24 checkpoint.
- Next notification phase is N6: groups + multi-device, unless another priority is explicitly chosen first.
