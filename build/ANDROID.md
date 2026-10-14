# FIDUNIO Android — owner checklist
Android source branch: `Android` copied from `ios` at commit `0e222ef9a358133274bdec48f7a6ed3fab104bd2`.
Do not push this Android-only port to `main` or `ios`.
Bundle ID: `io.github.willyros01.fidunio`. Firebase project: `fidunio-fef13`.

## One-time required GitHub Actions secrets (entered manually by owner)
Repository Settings > Secrets and variables > Actions > New repository secret.

- `FIDUNIO_ANDROID_KEYSTORE_BASE64`: base64 of the PERMANENT Android PKCS12 signing keystore with alias `fidunio`.
- `FIDUNIO_ANDROID_PASSWORD`: the password protecting that keystore (used for both store/key).
- `FIDUNIO_GOOGLE_SERVICES_JSON_B64`: base64 of Firebase Android app's `google-services.json`, registered for package `io.github.willyros01.fidunio` in Firebase project `fidunio-fef13`.

Use `build/fas.txt` in Google Cloud Shell to generate the permanent signing material. Back up the PRIVATE keystore and password securely before any public release. Do not commit them. Existing other-app signing keys must not be reused.

## Verified milestones — 2026-10-14

- **Firebase Android registration: PASS (owner's Cloud Shell output)**. Created app `io.github.willyros01.fidunio` in the *existing* Firebase project `fidunio-fef13`; downloaded configuration was validated for that project/package. Do not register a duplicate app. Keep the resulting `google-services.json` base64 out of source control.
- **Storage CORS: RESTORED and verified** using original backup and conditional CORS-only update. The two original rules remain; the unintended exact duplicate was removed.
- **Existing FIDUNIO Web media smoke test: PASS (owner)** for opening photos, playing videos, and playing audio after CORS recovery. This does not count as Android device media acceptance.
- **Actions secret 3:** owner reports `FIDUNIO_GOOGLE_SERVICES_JSON_B64` was saved manually in GitHub repository secrets. Only a fresh successful workflow can verify the required build inputs; connector does not read secret contents.
- All prior build outcomes remain historical; a fresh signed APK build and Cuberoot publication are **not yet verified**. This documentation update on `Android` intentionally triggers the existing full Android workflow, without modifying application code or the `main`/`ios` branches.
- Detailed evidence: [`docs/ANDROID-ACCEPTANCE.md`](../docs/ANDROID-ACCEPTANCE.md).

## Chain
1. Push to `Android` triggers `.github/workflows/android-apk.yml`.
2. Verify original iOS-based web assets plus Android adapters.
3. Build native Capacitor 8 Android APK, sign with permanent FIDUNIO certificate, validate signer, upload artifact `fidunio-android-signed-apk`.
4. Record build outcome in `build/android-last-run.json`; failed or skipped build is never published.
5. Cuberoot `.github/workflows/publish-fidunio-apk.yml` polls every five minutes, selects the latest successful build from `hermes/Android`, downloads that exact artifact, verifies APK integrity and certificate continuity, and publishes `downloads/fidunio.apk`, `downloads/fidunio.apk.sha256`, `downloads/fidunio-build.json`. GitHub Pages then serves the file.
6. Homepage exposes the FIDUNIO Android download only after the verified artifact and manifest exist.

## Outstanding pre-release acceptance
- Test on Android phone and Fire tablet; Google Play Services/FCM is not equivalent to Amazon ADM. Amazon Fire native notification support requires separate engineering/testing.
- Verify Firebase server accepts the `android-native` notification platform, token lease and FCM delivery. This step is not proven by compilation. No Firebase backend changes were made in this port.
- Verify PIN, biometric unlock, account login/deletion, iOS/web parity, attachment send/receive/zoom, native notification-to-PIN routing, group history, and Android hardware Back.
- To enable verified Android App Links for the invitation URL, Cuberoot must include Android Digital Asset Links with the new permanent app signing certificate. The Android intent filter alone does NOT establish verified links.
- No tests on a physical device are claimed by this setup.

## Failure handling
The build fails closed if any required GitHub secret is missing or invalid. Publisher never fabricates, builds, or re-signs an APK; previous published APK remains unchanged. Keep the signing key in owner-controlled backup. An accidental key rotation will block future updates and publication.

## 2026-10-14 — ADM and live Firebase state (supersedes outdated pending notes above)

- Android APK workflows and server-side ADM mock regressions passed; most recent ADM backend gate run `38651372635` PASS. Test results are not device acceptance.
- Amazon server credentials `FIDUNIO_ADM_CLIENT_ID` and `FIDUNIO_ADM_CLIENT_SECRET` transferred to Firebase Secret Manager successfully in run `38650650490`; no notification Function deployment occurred in that transfer.
- The Android branch has its own modified copy of several shared modules. This does **not** modify other GitHub branch copies. A Firebase Functions deployment, however, would change the live shared backend for every client.
- Scope for the authorized deployment is limited to the two existing direct/group notification sender Functions, after fresh actual-deployed-source and configuration backup in `fidunio-fef13` with restore verification.
- Durable scripts: `build/ab2614.txt` backup; `build/ad2614.txt` activation; `build/ar2614.txt` rollback. See `docs/ADM-LIVE.md`. The Cloud Shell backup has **not** been run; the ADM sender is **not yet live**.
- User cannot paste into Cloud Shell; provide verifiable nonempty downloadable TXT or ZIP, with short commands and filenames. All iOS repositories/branches are frozen.
