# FIDUNIO / Hermes Bug List

This file is the durable working bug list for current development. Keep it concise, factual, and update status as issues are verified or resolved.

## Open bugs

### Fire HD 8 / Account Isolation
- **Account-local data is not isolated when different FIDUNIO users sign in on the same browser/device.**
  - Reported on Fire HD 8 after signing out of Alpha Account/Willy Rosales and signing in as Kyrie Rosales.
  - The new account could still see remnants of the previous account's conversation state, and messages appeared as encrypted/unreadable remnants.
  - Root cause: installation-wide `fidunio-local` contained application state, Outbox, history, peer trust, and E2EE/device material without authenticated-account ownership.
  - **0.9.5.2 TEST BUILD:** adds `account-storage.js` as the single serialized account-storage activation owner. Authentication determines the UID first; account-local state is switched/restored before `app.js` imports and restores local state.
  - Local PIN/config and the local encryption-at-rest key remain installation-wide; application state, Outbox/history, and E2EE/device identity are account-owned.
  - Existing legacy local data is assigned only when its E2EE public identity uniquely matches one FIDUNIO profile. Ambiguous/unowned legacy data is quarantined rather than exposed to the newly signed-in account.
  - Bootstrap no longer rewrites account-owned `app-state` before authentication determines the UID.
  - Status: **awaiting Fire HD 8 A → B → A validation.**
  - Must preserve validated 0.9.5.1 Settings lifecycle; do not reuse the rejected 0.9.4.12 implementation.

### PIN / Local Security
- **Remove Local PIN does not work.**
  - Reported on FIDUNIO 0.9.5.1.
  - Other tested local-security controls are working: Change PIN, Lock Now, inactivity timeout, and existing PIN flows.
  - Treat as a focused local-security defect. Do not redesign the PIN/biometric architecture to fix it.

## Recently validated

### Settings lifecycle / late-added panels
- FIDUNIO 0.9.5.1: Profile, User Administration, and Invitations now appear immediately and remain available after leaving/re-entering Settings.
- On first cold load, Invitations may briefly show a loading state before data appears; subsequent opens are immediate. This is currently considered normal data-fetch latency, not a Settings lifecycle failure.
- Protected checkpoint branch: `checkpoint-0.9.5.1-settings-pass`.

## Development rule
- Before fixing any item in this list, read `CODING-GUIDELINES.md` and identify the owner, scope, lifecycle trigger, and serialized write path for the resource being changed.
