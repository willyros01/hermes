# FIDUNIO Android migration — acceptance evidence and open gates

Project: FIDUNIO / Hermes.
Android-only development branch: `Android`; do not modify `main` or `ios` to complete this port.
Recorded: 2026-10-14 (owner-provided Google Cloud Shell logs and device/browser testing).

## Confirmed PASS — existing FIDUNIO Web (not Android)

- User confirmed that existing photos open, existing videos play, and existing audio plays in the FIDUNIO web app after Storage CORS restoration. Result: **PASS** on all three. This is a browser/web smoke test only; it does not verify sending new media or native Android media functionality.
- Firebase project: `fidunio-fef13`; Storage bucket: `fidunio-fef13.firebasestorage.app`.
- Read-only audit reported that the original two CORS rules survived, with one *exact duplicate* of an original rule added.
- User ran conditional CORS-only restoration using the original backup `~/f3-cors-20261014T151537Z.json`. Google Cloud Shell report: `RESULT: SUCCESS — ORIGINAL CORS RESTORED AND VERIFIED.`
- Restoration report identified pre-change snapshot `~/crb-live-20261014T155850Z.json` and verified post-change snapshot `~/crb-after-20261014T155850Z.json`. Original backup preserved; duplicate removed; two original rules remain. No Firebase security rules, database, Storage objects, or GitHub code changed by the script.
- This establishes restored CORS configuration and owner-tested web media access only; it is **not** an Android device acceptance result.

## Android migration — verified against GitHub on 2026-10-14

- Native adapter/shared validation job: **PASS** on GitHub Actions run `38578062436`.
- Permanently signed Android APK job: **FAIL** on the same run at `Require owner-controlled signing and Firebase Android registration`; this is a prerequisites failure, not a completed Android package test.
- **Firebase Android registration: PASS (owner-provided Google Cloud Shell `fand.txt` result).** On 2026-10-14 Google Cloud Shell returned `RESULT: SUCCESS`, `REGISTRATION: CREATED`, `PROJECT: fidunio-fef13`, and `ANDROID APP: io.github.willyros01.fidunio`; its script decoded and validated the new `google-services.json` for the expected project, project number, and package. **Do not repeat registration**; reuse the existing Android app. The resulting configuration text/base64 must be handled as an owner-controlled GitHub Actions secret and is intentionally NOT copied into repository documentation.
- Previous handoff: owner-controlled permanent keystore/password had been accepted. Latest known Android job failed because `FIDUNIO_GOOGLE_SERVICES_JSON_B64` was not present then. The owner's registration PASS does **not** prove that GitHub Actions secret has since been entered. Secret's current presence remains unverified; do not claim a signed build until Actions passes.
- Report `build/android-last-run.json` showed run `38578062436` failure. No verified FIDUNIO APK or Cuberoot publication was found as of that inspection.
- Android Firebase registration must target the existing Firebase project `fidunio-fef13`, Android package `io.github.willyros01.fidunio`. Never create a second Firebase project.
- Do **not** run an unrelated Cloud Storage CORS script while configuring Firebase Android. The correct registration process only reads/creates a matching Firebase Android app and downloads `google-services.json`; **CORS is not part of Android app registration**. In Cloud Shell, filename `f3.txt` has been reused for different scripts; avoid ambiguous filenames.

## Required release gates (not yet claimed PASS)

1. Confirm the required three GitHub Actions secrets are present (keystore, password, Android `google-services.json` base64); keep private material out of the repository/chat.
2. Run the `Android` signed-APK workflow after prerequisites are ready. Require successful native build, permanent signing validation, and signed artifact.
3. Independently verify the Cuberoot publisher's artifact, manifest, hash, and public download before claiming it published.
4. Owner-device acceptance on Android phone and Fire tablet: login/PIN/biometrics, media send/receive/zoom, notifications and correct conversation routing, hardware Back, logout, privacy/security, and regression coverage. Amazon Fire native ADM is a separate requirement and is not proven by an FCM build.
5. Preserve iOS/web functional parity through the platform abstraction layer, without changing production branches during this Android migration.

## Evidence limitations

All media and CORS confirmations were reported by the owner; no native Android physical-device tests are confirmed yet. No CORS settings were modified by this documentation entry.
