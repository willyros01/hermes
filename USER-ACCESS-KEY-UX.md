# FIDUNIO User Access and Encryption UX

## 0.9.9.9a login and PIN surface

Signed-out login collects email, account password, and the one six-digit FIDUNIO PIN. One reusable `pin-input.js` owner renders six individual digit slots for login and local unlock. Login unlocks the existing account E2EE identity before app startup; ordinary conversations do not expose key setup, fingerprints, or verification controls.

## User-visible credentials

For a fresh account, the user sees and remembers only:

1. Email and Firebase account password for account creation, sign-in and recovery.
2. One six-digit FIDUNIO PIN for normal local unlock and account-encryption recovery.
3. Optional biometrics as a convenient normal-unlock substitute.

## Internal encryption

Account identity, authorized-device material, direct-message encryption, group epochs, attachment keys, key IDs and fingerprints are internal cryptographic resources. They remain independently owned and domain-separated in code but are created, selected, rotated and validated automatically. They are not ordinary user settings.

## Required presentation

Normal Settings may show only a plain status such as **End-to-end encryption: On**. Device Identity, Account Encryption forms, fingerprints and Verify Current Key controls must not be presented to an ordinary user. Recovery may request the account password and the one FIDUNIO PIN when genuinely required.

## Migration and security boundary

Folding the two visible PIN experiences does not mean reusing one derived key. Local unlock verification and account-encryption wrapping must use separate salts, contexts and derived key material. The PIN itself is never stored or transmitted. Existing installations with different local and E2EE PINs require an explicit migration or a controlled clean-account reset; the application must never guess, silently replace an identity or treat storage failure as an unset PIN.

## 0.9.9.8 implementation

The candidate implements one ordinary **Security** area. New PINs are exactly six digits. Security setup verifies any existing installation PIN and writes the separate local verifier only after account E2EE succeeds. Legacy 4–12 digit local PINs remain usable solely to prevent lockout during deliberate migration.

Device Identity, separate Account Encryption navigation, fingerprints, key identifiers, independent local-PIN controls, and Firebase-specific account wording are removed from ordinary Settings. The app shows **Account**, **FIDUNIO PIN**, optional device unlock, and **End-to-end encryption: On**.

An existing installation whose prior PINs differ fails closed. It requires a separately reviewed migration or controlled clean-account reset; the app never guesses or replaces an identity. Full gates and device acceptance remain required.
