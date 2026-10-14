# FIDUNIO Android Fire HD 8 — Amazon ADM implementation

Last updated 2026-10-14. Source of truth: `hermes/Android`. Production `main`, iOS `ios`, and Wire are not modified by this port.

## Current release separation

- **Existing signed website APK**: FCM-only (`android-fcm-beta`), successful build 38596933723. DO NOT describe it as supporting background ADM notifications.
- **ADM version under construction**: Android-native Amazon A3L 1.1.1 bridge using ADM on Fire OS, preserving existing Capacitor Firebase Messaging on Google-enabled devices. No APK may be published until required FIDUNIO-specific Amazon API key is present, native compilation and signed artifact pass, and Cuberoot publisher verifies the correct APK.
- Native platform `android-adm` is distinct from `android-native`. Authenticated claim/revoke and the single 30-day token lease authority are reused; a Fire token must NEVER be sent to Firebase FCM.
- The `functions/notification/adm-delivery.mjs` code and Cloud Functions wiring are **STAGED SOURCE ONLY** on `Android`. They are **not deployed** to Firebase. In particular, native compilation or APK signature SUCCESS is not evidence of delivery, sender credentials, server deployment, or notification-to-PIN device acceptance.

## Verified CI result — 2026-10-14

GitHub Actions run **38602612272**, source commit `e7d6d53ea88515de73eb6977ce54f086ede3dd9f`:

- `Verify shared application and native Android adapters`: **PASS**.
- `Compile Fire ADM native bridge (no release APK)`: **PASS**. Official Amazon A3L 1.1.1 Android library compiled against the FIDUNIO native adapter with a synthetic compile-only key; this is **not** a real ADM device authorization.
- `Build permanently signed FIDUNIO APK`: **BLOCKED (intended)**, confirmed by job logs: missing `FIDUNIO_ADM_API_KEY`. Permanent signing and Firebase Android secrets passed their prerequisite checks.
- No new ADM APK signed or published. The last Cuberoot release remains the earlier FCM-only APK from run 38596933723.
- After the owner registers FIDUNIO's Amazon app and manually adds `FIDUNIO_ADM_API_KEY`, a new `Android` build can produce the ADM-capable signed APK. This still does not establish live server delivery; backend OAuth credentials, deployment and physical Fire acceptance remain separate gates.

## Amazon owner setup — REQUIRED before the ADM APK

1. Open [Amazon Developer Console](https://developer.amazon.com/), sign in with the same developer account used for your other Fire OS apps.
2. Add/select the **FIDUNIO application**, not Wire. Assign package name `io.github.willyros01.fidunio`. Enable **Device Messaging (ADM)** for its own security profile.
3. To obtain permanent certificate hashes, run the read-only Cloud Shell script `build/aadm.txt` (upload the file to Cloud Shell and run `bash aadm.txt`). It refuses a certificate that differs from the already published FIDUNIO APK. Expected certificate SHA-256 (colon-free lowercase): `fbff41947e477e0b4df65bd741b550d7b30d7b18636a47c10853d789c4937a1d`. Supply Amazon the exact package, MD5 and SHA-256 values printed.
4. Create a **new FIDUNIO Amazon API key** for that package and certificate. Do not reuse Wire's key. Manually add it in `willyros01/hermes` repository Settings > Secrets and variables > Actions, secret name `FIDUNIO_ADM_API_KEY`, secret value the complete Amazon API key on one line. Never upload a key to the repository or chat.
5. Owner controls both Amazon sender credentials (security profile **Client ID** and **Client Secret**). They are not APK content and not Actions signing secrets. Eventually add them as Firebase Secret Manager secrets **`FIDUNIO_ADM_CLIENT_ID`** and **`FIDUNIO_ADM_CLIENT_SECRET`** under existing `fidunio-fef13`, with least-privilege notification service account access, after backup and review.
6. Do not deploy ADM-aware Cloud Functions until both credentials are configured, current notification functions/backends are backed up, sender regression tests pass, and an explicit separate server rollout is approved. Test that Fire registration gets an ADM token, and that sender selects Amazon only for `android-adm`.
7. Fire HD 8 acceptance: enable notification in FIDUNIO Settings; send direct/group messages from another device; check Fire foreground, background, lock screen, cold-start tap > PIN > **correct conversation/message**, privacy text, opt-out, logout immediate lease revocation, and renewal. Repeat Google Android FCM and iOS/Web regression checks.

## CI and publication safety

- `Verify shared application and native Android adapters` checks deterministic platform, privacy, transport/source contracts.
- `Compile Fire ADM native bridge (no release APK)` uses the official A3L SDK with a synthetic (never published) API key solely for compile checks, plus the registered Firebase Android configuration. This is not ADM delivery acceptance.
- `Build permanently signed FIDUNIO APK` requires all three previous secrets **plus** `FIDUNIO_ADM_API_KEY`. Absence fails closed, with no new APK artifact.
- Sign with the **existing** permanent PKCS12 FIDUNIO key; no new keys or repositories. No `main` or `ios` code changes.
- Until ADM is fully working, the Cuberoot publisher may leave the last verified FCM-only APK intact. The website release channel and badge must not be changed to `android-adm-fcm-beta` before end-to-end verified delivery and publishing.
- Existing public test release APK signing certificate checksum must remain unchanged.

## Notes

Firebase Storage CORS has already been restored and tested. ADM work must never edit CORS or Firebase Storage security rules.

Official references: https://developer.amazon.com/docs/adm/obtain-credentials.html and https://developer.amazon.com/docs/a3l-messaging/get-started.html .
