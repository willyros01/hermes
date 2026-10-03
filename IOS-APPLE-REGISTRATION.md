# FIDUNIO iOS Apple Registration Authority

**Status:** Phase 2 registration specification prepared — Apple account mutation pending authenticated Mac/Work session  
**Repository:** `willyros01/hermes`  
**Branch:** `ios`

## Fixed identity

- Product name: **FIDUNIO**
- Platform: **iOS / iPadOS**
- Explicit Bundle ID: **`io.github.willyros01.fidunio`**
- Existing Firebase project authority: **`fidunio-fef13`**
- Existing web/PWA remains on `main`; Apple registration does not change web runtime or Firebase data contracts.

The Bundle ID is already the committed Capacitor `appId`. Do not create an alternate Apple identifier without explicit architecture reconciliation.

## Initial Apple capability set

Enable only capabilities required by the current migration stage.

### Required now

- **Push Notifications** — required for the planned native APNs/FCM notification adapter. The current web notification path remains untouched until that adapter is implemented and device accepted.

### Do not enable merely because another project uses it

- Associated Domains — not required for the first TestFlight shell. Add later only when a FIDUNIO universal-link/deep-link contract is defined.
- Sign in with Apple — FIDUNIO currently uses its existing Firebase email/password account model; do not introduce a second sign-in provider as migration plumbing.
- App Groups — no shared extension/container design exists.
- iCloud/CloudKit — Firebase remains the application data authority.
- Apple Pay, Game Center, HealthKit, HomeKit, Wallet — not part of FIDUNIO.

App Attest/App Check configuration is a later controlled security phase. Do not enable Firebase App Check enforcement during Apple registration.

## App Store Connect record

Create the record only after the explicit Bundle ID exists.

- Platform: iOS
- Name: FIDUNIO
- Primary language: English (U.S.) unless the user selects another language in the authenticated session.
- Bundle ID: `io.github.willyros01.fidunio`
- SKU: choose once in the authenticated session; it is internal and cannot be changed after app creation.
- User Access: preserve the user's existing App Store Connect access policy; do not broaden access merely for migration.

Apple currently requires a new app record to be created in the App Store Connect website; the App Store Connect REST Apps resource does not support CREATE.

## Apple credentials for GitHub Actions

Hermes Phase 3 will require these repository secrets:

- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_KEY_P8`
- `APPLE_TEAM_ID`

The working Scorecard pipeline uses the same four names. GitHub repository secrets are write-only after storage; their values cannot be recovered from the Scorecard repository through the GitHub connector. Reuse the same Apple API key only if the original key ID, issuer ID and .p8 material are available and still valid.

## Firebase iOS registration

The first Capacitor/TestFlight shell continues to use the existing shared FIDUNIO web Firebase SDK/config inside WKWebView. A native Firebase Apple app registration and `GoogleService-Info.plist` become mandatory when native Firebase Apple SDK services are introduced (notably native FCM/App Check). Register that Apple app against project `fidunio-fef13` with the same Bundle ID; do not create a second Firebase project.

## Export-compliance hold

Do **not** copy Scorecard's `ITSAppUsesNonExemptEncryption = NO` declaration.

FIDUNIO implements application-level end-to-end encryption in shared JavaScript in addition to HTTPS/OS cryptography. Before the first TestFlight upload, answer Apple's current encryption questionnaire for FIDUNIO and record the resulting exempt/non-exempt determination and any required declaration/code. The build pipeline must reflect that determination; it must not guess.

## Phase 2 completion gate

Phase 2 is complete only when all applicable items are verified:

1. Apple explicit Bundle ID exists exactly as `io.github.willyros01.fidunio`.
2. Push Notifications capability is enabled.
3. App Store Connect app record named FIDUNIO exists and points to that Bundle ID.
4. Apple Team ID is confirmed.
5. Hermes has usable App Store Connect API credentials/secrets, or a documented credential-loading step is ready before Phase 3.
6. No unintended Apple capabilities were enabled.
7. No live Firebase/App Check enforcement or shared backend contract was changed.
8. Read-only `node build/asc.mjs check` passes once credentials are present.

## Rollback / safety

Before the first uploaded build, Apple allows more flexibility around the app record's Bundle ID, but the Bundle ID becomes fixed after a build is uploaded. The SKU cannot be changed after the app is added. Therefore verify the exact Bundle ID and SKU before creating/uploading the first build.

Apple capabilities can be added later. Keep the initial set minimal rather than pre-enabling speculative services.
