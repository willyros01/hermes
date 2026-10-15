## 2026-10-15 ~02:01 EDT — Fire HD 8 Amazon ADM notification RECEIPT PASS (owner confirmed)

**Physical result:** owner reports **"notifications are working now"** on FIDUNIO Fire HD 8 after the backend credential correction. Mark **ADM notification receipt: PASS (owner confirmed)**. Do **not** yet claim notification tap → PIN/biometric → correct message, group-message notification, or iOS/web notification regression PASS; those require separate owner acceptance. Wire and installed APK were not changed for this repair.

**Root cause proven:** original Firebase `FIDUNIO_ADM_CLIENT_ID` differed byte-for-byte from the owner's credential for Amazon's attached **FIDUNIO ADM** security profile; Firebase Client Secret already matched. Amazon returned HTTP **401 INVALID_CLIENT** for the previous deployed pair. Private `ax.txt` comparison and OAuth test of owner-supplied correct pair returned **HTTP 200**. The targeted `af.txt` repair added a corrected **Client ID only** as a new Firebase Secret Manager version. Follow-up `ax.txt` reported **YES** for both ID and Secret against Secret Manager **latest** and deployed references, plus Amazon OAuth **HTTP 200**. Do not print credential values or store them in GitHub.

**Function state and caution:** `az.txt` read-only audit found direct notification function updated to **corrected new Client ID reference** and new revision, with original Secret reference and service configuration; build metadata fields (build ID, source storage generation and source provenance generation) changed, plus eventFilter list representation. Group notification function remained at its original revision and original Client ID reference; group ADM acceptance **unverified**. Prior repair script's strict configuration-diff guard stopped and its automatic rollback did **not** complete; do **not** rerun `af.txt` or its rollback based on this record. A green physical direct-message notification receipt is evidence of that path working now, not proof of full original source-content equivalence or that group Firebase credential binding is repaired.

**Change discipline:** No further production functions, APK, iOS/web, Wire or Firestore changes without a specific observed failure and a narrowly scoped verified rollback; preserve the existing private production backup. The uploaded Client Secret was shared in chat; plan safe rotation **after acceptance**, with continuity safeguards to avoid breaking working push notifications.

---

## 2026-10-14 ~22:07 EDT — Wire-style native provider fix BUILT

Owner authorized immediate narrowly scoped Android-only fix after two read-only Cloud Shell audits both found `ADM ROWS:0`. The Fire tablet had not created an eligible Amazon ADM server lease even on foreground. As requested, `android-src/native/FidunioAdmPlugin.java` now uses Wire's A3L capability detection: explicit `adm`, `fcm`, unknown. `notification-platform-adapter.js` no longer assumes FCM on detection failure: unknown fails closed, Amazon tokens receive `android-adm`, Google tokens `android-native`, and the provider label is only set after valid token acquisition. A3L Java `register` remains ADM-only and Google's existing FirebaseMessaging owns FCM; no duplicate notification owner.

**Confirmed CI:** `hermes/Android` commit `812c1bdd247f78f5fcb1ba034ba7eb1fa02822c3`, signed workflow run **38668803728 SUCCESS**, native A3L compile PASS, native provider regression tests PASS, permanent signing PASS, signed artifact **11942369130**. No Firebase redeployment, backup, Wire, iOS or production web changes. Cuberoot `downloads/fidunio-build.json` still pointed to prior run `38655432189` at last check; **do not install via website until descriptor identifies run `38668803728`**. No Amazon delivery/device acceptance PASS until new published APK installed on Fire, eligible `android-adm` lease verified and direct/group receipt/tap/PIN/correct message tested. Earlier paragraphs are chronological.

---

## 2026-10-14 ~21:30 EDT — Live ADM deployed; physical Fire test FAIL (latest)

The owner verified both original deployed production notification functions archived with metadata/checksums in private versioned `gs://fidunio-fef13-notify-backup-130339622893/20261015T002242Z`: **BACKUP PASS**. The owner then ran `adm33.txt`; both existing Gen2 functions `notifyDirectMessageCreatedV1` and `notifyGroupMessageCreatedV1` were **ACTIVE**, with both FIDUNIO ADM secrets mounted, preserving region, triggers and runtime service identity: **BACKEND DEPLOYMENT PASS**. Do not redo either procedure.

The first Fire HD 8 direct-message notification test **FAILED (no receipt)** although device notifications are ON. Fire group untested; post-deployment iOS/web notifications not yet reverified. Root cause **unconfirmed**: first inspect real authenticated `android-adm` leases and production sender logs, then native A3L receipt/identity. Wire on `balita/android` physically received ADM notification (0.17.58), but is frozen: reference only. Wire server uses priority `high`, FIDUNIO `normal`; this is not yet causation.

Signed/published Android build `38655432189` / artifact `11937041460` / source `9bfae478f50f69eec5b4095f761fa7ace52a1438` appears in Cuberoot descriptor; its `android-fcm-beta` label is historical, not provider proof. No claim of ADM delivery PASS until Fire receipt → tap → PIN unlock → correct message is owner-confirmed. Preserve verified rollback and existing iOS/web/APNs/FCM functionality. The below staged/not-deployed notes document earlier chronology and are **superseded**.

---

## 2026-10-14 — Latest ADM activation handoff (supersedes older prerequisites below)

**Current status:** Permanent-signed Android APK and mock sender tests passed. Both private ADM OAuth secret versions were transferred to Firebase Secret Manager via GitHub run `38650650490`. The production ADM Cloud Functions sender remains **NOT DEPLOYED** and a fresh production backup is **NOT VERIFIED**. Earlier descriptions below of missing credentials or unsigned builds are historical only, not the latest release state.

The user authorized a **targeted** backend rollout with a verified private, versioned, in-Firebase backup and rollback capability. Scripts on `Android`: `build/ab2614.txt` (backup), `build/ad2614.txt` (activate), `build/ar2614.txt` (rollback). Detailed gates: `docs/ADM-LIVE.md`. Do not alter `main`, `main-3`, `ios`, Wire, other Cloud Functions or Firebase rules. All iOS branches are frozen. Native Firebase ADM service must be accepted on physical Fire HD 8; backend mock PASS is not device PASS.

---

# FIDUNIO Android Fire HD 8 — Amazon ADM implementation

Last updated 2026-10-14. Source of truth: `hermes/Android`. Production `main`, iOS `ios`, and Wire are not modified by this port.

## VERIFIED OCT 14 2026 — latest release and publication (supersedes older status below)

- **Amazon API key complete:** owner created and manually stored `FIDUNIO_ADM_API_KEY`; signing input check passed; never copy the key into source.
- **ADM-capable signed APK built:** Hermes Android run **38602612272**, attempt 2, passed all native, signing, artifact and publisher-contract jobs. Official A3L adapter compiled with release credentials and the same permanent signing certificate. This proves compilation only; **server-side ADM notification delivery and physical Fire acceptance are NOT yet tested**.
- **Website release verified:** Cuberoot publish run **38640459634**, site Pages run **38640506041**, manifest references Hermes run **38602612272**, SHA-256 `9623ebe45ff2509bcc343d26ba67510b75a40ddf4cbb6b486a69722399410aa2`, existing permanent signer `fbff41947e477e0b4df65bd741b550d7b30d7b18636a47c10853d789c4937a1d`.
- **GitHub notification PASS:** Cuberoot `build/notify-fidunio.mjs` compares live site manifest to the signed release, downloads the actual public APK, verifies SHA-256, then creates a deduplicated GitHub Issue assigned to `willyros01`. Initial test [issue #1](https://github.com/willyros01/Cuberoot/issues/1) verified and **owner confirmed receiving the GitHub email**. No message until site bytes match; separate from notification delivery inside FIDUNIO.
- **Direct publishing handoff staged:** Hermes Android workflow adds `Dispatch immediate Cuberoot publication` after successful APK artifact verification. Cuberoot workflow accepts `workflow_dispatch.inputs.source_run_id` and checks this exact Hermes run is successful before publishing. **For direct dispatch to actually execute, Hermes Actions must have a cross-repository fine-grained GitHub token secret `CUBEROOT_DISPATCH_TOKEN`**. Token must be restricted to `willyros01/Cuberoot` with Actions **read and write**. Owner authorized changing workflows but **the secret has not been verified as configured**; an ordinary `GITHUB_TOKEN` cannot dispatch across repos. A missing direct credential causes an explicit warning and leaves the scheduled five-minute Cuberoot fallback in place; scheduled jobs can be delayed.
- **New APK build 38642098793 PASS:** Started automatically by commit `48dae08a578137ca95a3bfccc27bd01e07631733`. All five jobs succeeded (shared checks, Fire A3L native compilation, permanently signed APK, release reporting, publisher contract). The direct-dispatch job log explicitly warned that `CUBEROOT_DISPATCH_TOKEN` was **empty**; therefore Cuberoot was **not directly triggered**. The scheduled publisher remains configured but does not guarantee immediate delivery. **New APK website publication and the new email remain unverified**, as Cuberoot manifest still references run 38602612272.
- Cuberoot website channel stays `android-fcm-beta` until end-to-end server ADM delivery and Fire acceptance have passed; don't claim the currently published APK is Fire notification ready just because A3L compiled.

**Historical setup notes and blockers in following sections describe earlier state before the owner completed Amazon provisioning.**


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

## Owner verified signer fingerprints — 2026-10-14

The owner ran the revised read-only `build/aadm.txt` in Google Cloud Shell. Screenshot confirms `RESULT: PASS — Verified permanent FIDUNIO signer` after downloading the already-signed APK and validating its SHA-256. Amazon API-key registration inputs:

- Android package: `io.github.willyros01.fidunio`
- MD5 certificate fingerprint: `0C:DC:EB:48:A4:51:ED:02:8A:9C:99:CC:85:4F:08:1C`
- SHA-256 certificate fingerprint: `FB:FF:41:94:7E:47:7E:0B:4D:F6:5B:D7:41:B5:50:D7:B3:0D:7B:18:63:6A:47:C1:08:53:D7:89:C4:93:7A:1D`

Only public certificate fingerprints were extracted; the original private signing files were not found in Cloud Shell, and **no new keystore must be generated**. Still pending: FIDUNIO-specific Amazon API key in Actions secrets, distinct server OAuth Client ID/Secret in Firebase Secret Manager, deployment approval, and physical Fire tablet acceptance. Do not claim signed ADM APK or ADM delivery PASS.

## Amazon owner setup — REQUIRED before the ADM APK

1. Open [Amazon Developer Console](https://developer.amazon.com/), sign in with the same developer account used for your other Fire OS apps.
2. Add/select the **FIDUNIO application**, not Wire. Assign package name `io.github.willyros01.fidunio`. Enable **Device Messaging (ADM)** for its own security profile.
3. To obtain permanent certificate hashes, run the revised read-only Cloud Shell script `build/aadm.txt` (upload the file to Cloud Shell and run `bash aadm.txt`). The original signing keystore may not be present in this Cloud Shell home; **do not create another key**. The script downloads the already-published FIDUNIO APK, verifies its pinned release SHA-256, extracts only its public signing certificate, and verifies the signer fingerprint before printing MD5 and SHA-256. Expected certificate SHA-256 (colon-free lowercase): `fbff41947e477e0b4df65bd741b550d7b30d7b18636a47c10853d789c4937a1d`. Supply Amazon the exact package, MD5 and SHA-256 values printed. This does not change any signing identity, Firebase data, or repository settings.
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
