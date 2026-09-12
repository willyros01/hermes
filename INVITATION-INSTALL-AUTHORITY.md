# FIDUNIO Invitation and Install Authority

**STATUS: BINDING REPOSITORY ARCHITECTURE — 0.9.8.5 VALIDATED**

## Invitation ownership

`invitation-owner.js` is the sole serialized invitation mutation coordinator. `firebase.js` remains the sole Firebase SDK/repository owner. Authentication and Settings request invitation work through `invitation-owner.js`; neither owns a competing invitation write queue. `invitation-policy.js` owns pure lifecycle/role decisions.

Invitation lifecycle is single-use. Only owner/admin accounts may issue invitations, and only `user` or `admin` may be granted. Pending, unexpired invitations can be redeemed. Accepted, revoked, expired, wrong-role, unauthorized issuance/revocation and second-redemption paths fail closed. Firestore redemption is atomic: the invitation changes to accepted with the authenticated UID while the matching active `users/{uid}` profile is created with `joinedByInviteId` and `invitedByUid`. Repository emulator coverage is permanent in `firestore-invitation.rules.test.mjs`.

A successfully enrolled active profile enters the existing account-authoritative discovery path (`listCloudUsers`) and therefore the established direct/group conversation selection paths. No device-owned identity or installation ID becomes conversation authority.

## Install ownership

`install-guidance.js` owns only optional installation instructions in the predefined Settings `Install` panel. It never creates, validates, redeems or revokes an invitation; never signs an account in or out; and never mutates messaging state. It does not intercept `beforeinstallprompt`, auto-prompt, auto-install an icon, or modify the service worker.

iPhone/iPad guidance uses Safari Share -> Add to Home Screen. Android/Fire guidance uses the browser's Add to Home screen/Install app command when offered. Desktop guidance uses the browser's install/shortcut command when offered. Existing manifest/icon/PWA assets remain authoritative.

## Deferred install-control correction — 2026-09-11

The Settings Install panel must ultimately expose an explicit actionable installation control. When the browser supports an installation prompt, selecting the control invokes that browser-owned process from the user's gesture. On iPhone/iPad or another platform that does not expose a programmatic prompt, the same action opens the platform-specific browser installation guidance. When standalone/Home-Screen installation is already detected, the panel shows **FIDUNIO is installed** as a disabled installed-state control. This remains deferred in `TODO.md`; it does not authorize automatic prompting or reuse of rejected invitation/install code.

## Invitation-letter restoration — implemented in 1.1.40

The exact accepted subject and full invitation letter were recovered from the validated 0.9.5.1 checkpoint and safe 0.9.4.10 stabilization branch. Copy Invitation, Email Invitation and Share use the same restored text, including inviter, role, expiry, clean single-use Join URL, personal/non-forward warning, clean Quick Start Guide URL, guide summary and sign-off. The existing serialized invitation owner and install separation remain authoritative. Device acceptance is pending.

## Historical prohibition

The rejected 0.9.4.12–0.9.4.15 invitation/install implementation is not restored or adapted. In particular, invitation redemption and Home Screen installation remain separate owners and separate user actions.

## Validation

Focused invitation policy, Firestore emulator enrollment/rule, and invitation/install coexistence gates are permanent parts of the normal Rebuild Baseline Security Gate. Full gate `34065528714` completed SUCCESS on 0.9.8.5 source. Repository validation does not authorize live Firebase or `htest` deployment.
