# FIDUNIO / Hermes Bug List

This file is the durable working bug list for current development. Keep it concise, factual, and update status as issues are verified or resolved.

## Open bugs

### Fire HD 8 / Account Isolation
- **Account-local data is not isolated when different FIDUNIO users sign in on the same browser/device.**
  - Reported on Fire HD 8 after signing out of Alpha Account/Willy Rosales and signing in as Kyrie Rosales.
  - The new account could still see remnants of the previous account's conversation state, and messages appeared as encrypted/unreadable remnants.
  - Current local persistence uses shared installation-wide IndexedDB storage (`fidunio-local`) for application state, Outbox, history, and E2EE/device material without a UID/account namespace.
  - Treat this as an ownership/isolation defect, not a display-only bug.
  - Fix must preserve the validated 0.9.5.1 Settings lifecycle and must not reuse the rejected 0.9.4.12 account-isolation implementation.

### PIN / Local Security
- **Remove Local PIN does not work.**
  - Reported on FIDUNIO 0.9.5.1.
  - Other tested local-security controls are working: Change PIN, Lock Now, inactivity timeout, and existing PIN flows.
  - Treat as a focused local-security defect. Do not redesign the PIN/biometric architecture to fix it.

## Recently validated

### Settings lifecycle / late-added panels
- FIDUNIO 0.9.5.1: Profile, User Administration, and Invitations now appear immediately and remain available after leaving/re-entering Settings.
- On first cold load, Invitations may briefly show a loading state before data appears; subsequent opens are immediate. This is currently considered normal data-fetch latency, not a Settings lifecycle failure.

## Development rule
- Before fixing any item in this list, read `CODING-GUIDELINES.md` and identify the owner, scope, lifecycle trigger, and serialized write path for the resource being changed.
