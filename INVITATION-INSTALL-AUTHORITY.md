# FIDUNIO Invitation and Install Authority

**STATUS: BINDING REPOSITORY ARCHITECTURE — 0.9.8.5 VALIDATED**

## Invitation ownership

`invitation-owner.js` is the sole serialized invitation mutation coordinator. `firebase.js` remains the sole Firebase SDK/repository owner. Authentication and Settings request invitation work through `invitation-owner.js`; neither owns a competing invitation write queue. `invitation-policy.js` owns pure lifecycle/role decisions.

Invitation lifecycle is single-use. Only owner/admin accounts may issue invitations, and only `user` or `admin` may be granted. Pending, unexpired invitations can be redeemed. Accepted, revoked, expired, wrong-role, unauthorized issuance/revocation and second-redemption paths fail closed. Firestore redemption is atomic: the invitation changes to accepted with the authenticated UID while the matching active `users/{uid}` profile is created with `joinedByInviteId` and `invitedByUid`. Repository emulator coverage is permanent in `firestore-invitation.rules.test.mjs`.

A successfully enrolled active profile enters the existing account-authoritative discovery path (`listCloudUsers`) and therefore the established direct/group conversation selection paths. No device-owned identity or installation ID becomes conversation authority.

## Install ownership

`install-guidance.js` owns only optional installation instructions in the predefined Settings `Install` panel. It never creates, validates, redeems or revokes an invitation; never signs an account in or out; and never mutates messaging state. It does not intercept `beforeinstallprompt`, auto-prompt, auto-install an icon, or modify the service worker.

iPhone/iPad guidance uses Safari Share -> Add to Home Screen. Android/Fire guidance uses the browser's Add to Home screen/Install app command when offered. Desktop guidance uses the browser's install/shortcut command when offered. Existing manifest/icon/PWA assets remain authoritative.

## Historical prohibition

The rejected 0.9.4.12–0.9.4.15 invitation/install implementation is not restored or adapted. In particular, invitation redemption and Home Screen installation remain separate owners and separate user actions.

## Validation

Focused invitation policy, Firestore emulator enrollment/rule, and invitation/install coexistence gates are permanent parts of the normal Rebuild Baseline Security Gate. Full gate `34065528714` completed SUCCESS on 0.9.8.5 source. Repository validation does not authorize live Firebase or `htest` deployment.
