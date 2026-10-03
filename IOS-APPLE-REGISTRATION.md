# FIDUNIO iOS Apple Registration Authority

**Status:** Phase 2 Apple registration COMPLETE — verified API key and Hermes repository secrets provisioned  
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


## Authenticated Apple registration checkpoint — 2026-10-03

Verified in Apple Developer and App Store Connect through the authenticated browser:

- Apple Developer Team ID: `VXMLKHF72B`.
- Registered explicit App ID description: FIDUNIO.
- Bundle ID: `io.github.willyros01.fidunio`.
- Push Notifications selected and enabled at registration. All other selectable capabilities were unchecked; Apple automatically selected its disabled In-App Purchase default. No additional capability was deliberately enabled.
- App Store Connect app name: FIDUNIO.
- Apple app ID: `6818880685`.
- Platform: iOS.
- Primary language: English (U.S.).
- Immutable SKU: `fidunio-ios-001`.
- Existing individual account has one Account Holder/Admin with All Apps access; the new record used the available Full Access option.
- Issuer ID: `6f5d8bf7-437f-4729-b96a-036729b03ee8`.
- Existing active team API keys were listed, but their original private-key material has not been verified or loaded into Hermes. Credential readiness is pending.
- Read existing `build/asc.mjs`: Apple requests are GET-only; authenticated API execution remains pending credentials.
- Re-read GitHub job results: iOS preflight `37139976180`, Rebuild Baseline Security Gate `37139976192`, and Capacitor Simulator shell `37139976206` all completed successfully. These are existing pre-registration runs, not new Apple API validation.

No build was uploaded. Export compliance remains undetermined for FIDUNIO E2EE. This registration changed no live Firebase backend, App Check enforcement, production web runtime, or `main` branch.


### Existing credential verification — 2026-10-03

The user identified the existing iCloud Fairpot Keys folder. The original local private-key file for active key `48475DA2L4` was available. The exact existing `build/asc.mjs check` was fetched from `ios` and executed locally using the bundled modern Node runtime with that key. It exited 0:

- Apple accepted the API key.
- Exact FIDUNIO Bundle ID and Team ID matched.
- Enabled capabilities reported `IN_APP_PURCHASE, PUSH_NOTIFICATIONS` only.
- FIDUNIO app name, SKU `fidunio-ios-001`, and locale `en-US` matched.
- Result: Phase 2 Apple setup is ready.

No private key was printed, committed, or pasted in chat. Hermes GitHub Actions secrets are not yet verified or provisioned: the browser requires GitHub sign-in. Expected secret names remain `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`, and `APPLE_TEAM_ID`. Do not treat API verification as proof of repository-secret readiness.


### Hermes repository secrets provisioned — 2026-10-03

With explicit user approval, reused existing active Apple team Admin API key `48475DA2L4`. GitHub confirmed all four repository secret names in `willyros01/hermes`: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`, and `APPLE_TEAM_ID`. The user saved the prepared key ID; the remaining three were saved through the authenticated GitHub secret forms. Private key contents went directly from the original local file into GitHub's secret field and were never printed or committed.

GitHub secret values are write-only. The supplied credential set passed the existing read-only Apple verifier locally before provisioning; a GitHub Actions execution consuming these stored secrets has not yet been verified. No upload or signing workflow was introduced in this registration step.

Apple registration scope is complete. Native Firebase registration remains deferred until native Firebase SDK integration, and the FIDUNIO-specific export-compliance determination remains required before first TestFlight upload. No production web or live Firebase changes were made.


### GitHub Actions Apple verification PASS — 2026-10-03

Added `.github/workflows/ios-apple-verification.yml` on `ios` at `fe589bb734c2201b9d67635defc3f30a49099f4a`. Run `37156481701` successfully executed the registration specification gate and existing read-only Apple verifier using all four repository secrets. Apple accepted the key and confirmed the exact bundle ID, Team ID consistency, Push Notifications, FIDUNIO app name, SKU and `en-US` locale. Capabilities were `IN_APP_PURCHASE, PUSH_NOTIFICATIONS`.

This supersedes the earlier limitation that stored GitHub credentials had not been exercised. Workflow uses contents-read permission, an `ios` branch guard, no dependency installation, a restrictive temporary key file and exit cleanup. It performs no signing, upload, Apple mutation, Firebase mutation or export-compliance declaration. GitHub masks credential values in the logs.
