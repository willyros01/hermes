## 2026-10-15 ~00:27 EDT — Physical Fire ADM FAIL: Amazon OAuth HTTP 401 isolated

Owner tested signed FIDUNIO Android APK 38679022748; native provider **Amazon ADM**, Settings status **Enabled**, physical background direct-message receipt **FAIL (no notification at all)**. Cloud Shell read-only `adl.txt` report scanned 5 users: **ADM ROWS 1, enabled/unexpired 1, token-owner eligible 1**. Gen2 `notifyDirectMessageCreatedV1` was **ACTIVE**, both ADM secrets mounted, Firestore trigger path correct. Sender logs show at **2026-10-15T04:12:46.800Z** **Amazon OAuth HTTP 401** plus downstream direct-notification partial failure; `ao123.txt` sanitized read-only follow-up matched 2 events: OAuth denied 1, Amazon ADM HTTP message rejected 0, secret unavailable 0. Therefore sender did not get an Amazon access token; do not ask for more APK installs, device settings toggles, or push tests until OAuth passes.

Official Amazon ADM `Request an Access Token` docs say HTTP 401 is `INVALID_CLIENT`, i.e. Amazon rejected OAuth client authentication. Client request shape in `functions/notification/adm-delivery.mjs` matches Amazon required URL/content type/grant `client_credentials`/scope `messaging:push`. Audit original successful GitHub workflow **38650650490**, one-time `.github/workflows/fads.yml` at SHA `df92666b322a3e6f5c9810d7082a192dade6ac08`: transfer unconditionally checked `FIDUNIO_ADM_CLIENT_ID` starts `amzn1.application-oa2-client.`, which contrasts with `amzn1.iba-client.` **example** in Amazon ADM docs. This is a concrete validation mismatch, not by itself proof all `application-oa2-client` IDs fail. The actual credential pair from FIDUNIO's **attached** Amazon Developer Console > My Apps > FIDUNIO > App Services > Security Profile Management > Web Settings needs secure re-verification. NEVER ask owner to paste credentials in chat or expose them in logs.

Fix boundary: use owner-entered exact FIDUNIO-associated ADM OAuth Client ID and Client Secret, validate directly against Amazon OAuth endpoint with no secret display, then update two Firebase Secret Manager versions and restart/update **only** targeted notification function revision(s) through existing verified rollback route. A new secret version alone may not refresh warm Cloud Run environment-variable bindings. Do not change shared Firebase before positive credential validation. Preserve Wire app, Hermes main/ios/main-3 and previous GCS function backup. No server changes have been made in this diagnosis.

Sources: https://developer.amazon.com/docs/adm/request-access-token.html ; https://developer.amazon.com/docs/adm/obtain-credentials.html .

---

## 2026-10-15 00:06 EDT — VERIFIED WIRE/FIDUNIO APK INSTALL COLLISION AND CORRECTION

- User explicitly uninstalled FIDUNIO from Amazon Fire HD 8 then attempted clean install from Cuberoot; Android reported **"App not installed"**. User asked investigate Wire/ADM and had repeatedly confirmed prior APK installs. Do not blame user/download or request repeated install checks.
- Independently downloaded and parsed binary AndroidManifest.xml from **Wire's owner-accepted signed APK** (balita Android 0.17.59, workflow 38485663797, artifact 11859098306) and FIDUNIO signed APK build 38677524749. Both contained A3L SDK's **identical content-provider `android:authorities="com.amazon.A3L.messaging.util.A3LMessagingInitProvider"`**. Android package manager forbids provider-authority duplication across installed applications (`INSTALL_FAILED_CONFLICTING_PROVIDER`); this explains clean installation failure when Wire remains installed. Wire MUST NOT be uninstalled or changed.
- Owner-authorized fix ONLY on `hermes/Android`: `build/install-fidunio-adm.mjs` injects manifest-merger override for `com.amazon.A3L.messaging.util.A3LMessagingInitProvider` to **`io.github.willyros01.fidunio.a3l-init`** with `tools:replace="android:authorities"`; keeps the original A3L provider class/initialization mechanism. `build/android-build.sh` verifies compiled APK authority using aapt before signing success; `build/test-adm.mjs` prevents regression. Commits eaeabec70f31574e272be7a10df3fa5ebbd4ae43, c6a451cd0820b39c3e89a8674b298a43d8304754, fa5ab04f651a7de418bcb4528a940dbdaffbfb1e.
- Signed Hermes run **38679022748 SUCCESS**, native A3L compile PASS, exact compiled APK provider guard PASS, permanent signing certificate unchanged SHA256 `fbff41947e477e0b4df65bd741b550d7b30d7b18636a47c10853d789c4937a1d`. Artifact **11947478568**; independently parsed its actual binary manifest; Wire provider authority remains `com.amazon.A3L.messaging.util.A3LMessagingInitProvider`, new FIDUNIO authority `io.github.willyros01.fidunio.a3l-init`, **NO PROVIDER AUTHORITY COLLISION** among their declared providers. New APK SHA256 **8853d757e4360e8eee21a3ca89a8de08544b6a0114379e80aad42099bd2197e9**, bytes 10,100,008.
- Hermes-to-Cuberoot handoff triggered new publisher **38679536163**; Cuberoot main `downloads/fidunio-build.json` updated to exact run 38679022748 / artifact 11947478568 / sha256 above. Pages deployment **38679573807** was IN PROGRESS as of initial check. Wait for Pages PASS before requesting another download.
- Next physical acceptance: Owner keeps Wire INSTALLED, deletes obsolete FIDUNIO APK(s) from Downloads if convenient, downloads current Cuberoot APK, installs FIDUNIO freshly, signs in, checks Settings Notifications native Provider: Amazon ADM, enables and confirms matching `android-adm` server lease, then direct DM notification -> tap -> PIN -> correct message. No physical ADM receipt PASS yet; successful APK install on Wire-equipped Fire also still pending.
- Do not touch Wire, Firebase, Web/iOS/Main/Main-3, existing Fire content or private function backups. No Cloud Shell script/long paste needed.

---

## 2026-10-14 ~23:50 EDT — Native SW cache/Wire comparative fix, device acceptance pending

Owner says installed APK on Fire HD 8; Settings still old Enabled UI without provider. Exact prior signed APK was downloaded and inspected; it includes new Provider UI, so source packaging cannot alone explain old screen. Working frozen Wire detects native A3L service directly from `WirePush`, while FIDUNIO's early native-detection guard can select web and register a stale PWA Service Worker. FIDUNIO's cached shell version did not change as builds progressed. External Capacitor case reports Service Worker serving old web assets ahead of new APK. This is strong diagnostic mechanism, **not yet physically confirmed**.

`hermes/Android` native-only commit **72d13b28f404683a59232f1693092ae41b5b336c**: robust `https://localhost` + Android-UA early detection; generated-APK-only Service Worker retirement without clearing user storage and no origin change; revalidate Firebase ID token before native claim/revoke; deterministic tests. Signed APK GitHub run **38677524749 SUCCESS**, native A3L compile PASS, artifact **11947225671** and SHA256 **947f6f88236342c6161ca23cc6f30eebfd0e0b87ac82386a3c29355ca851d580**. Physical contents independently inspected: `assets/public/service-worker.js` is safe retirement worker (no fetch handler); FIDUNIO Provider UI/native fallback/auth refresh all present. Cuberoot publisher **38678010978 SUCCESS**, website Pages **38678040864 SUCCESS**, release descriptor exact run and SHA match, permanent signer unchanged.

**Next check:** owner updates existing Fire app WITHOUT uninstall and opens FIDUNIO > Settings > Notifications; verify Provider field is shown and status accurately reflects actual lease. Do not repeat old ADM message smoke until provider/registration status is known. No physical ADM receipt PASS yet. No Firebase backend, Wire, iOS, main/main-3 or user data touched.

---

## 2026-10-14 ~23:20 EDT — Android native notification truth-in-status build PUBLISHED, ADM receipt OPEN

Owner's latest Cloud Shell screenshot (03:06:58Z) after Fire Settings Off/On and failed DM notification showed **ADM ROWS 0** and one `android-native` row. Native Settings displayed "Enabled" from stale Firestore `enabled`, without verifying a current server-bound native lease. Android-only fix `d9a9de68b955a86a9e4c30f01c52d95e51a23f83` adds verified lease status, visible provider (Amazon ADM/Google FCM/Undetected), explicit "Registration needed" and re-enable when old status is stale; `bf0c9302f85da0d4cffca87b625f449f8d5fb5ba` adds the pure module to Capacitor's explicit web-files allowlist. Regression and Amazon A3L compile passed, signed APK run **38675060568** PASSED (attempt 2 after npm runner ECONNRESET), Cuberoot `downloads/fidunio-build.json` points to that run with SHA256 `f6bd195be6356aa4564e8c1e307c5a5b66d7c5b238b3ea9f8746e38d2ab3ccd3`; Pages run **38675691140** SUCCESS.

**Next ONE device test:** Install update over FIDUNIO on Fire HD 8 (DO NOT uninstall), open in-app Settings → Notifications; report provider and status. If Amazon ADM and Registration needed, tap Enable Notifications and report result. Do NOT retry delivery blindly until provider and active lease verified. Build+publication PASS is NOT a notification receipt PASS. No Firebase or other repo changes.

---

## 2026-10-14 ~23:05 EDT — Fire HD 8 ADM direct notification FAIL after explicit Off/On

Owner reports FIDUNIO Settings > Notifications initially "Enabled". Owner explicitly turned notifications Off, then On, without a visible error ("off and on worked"). Subsequently placed FIDUNIO in background and triggered a direct message from another device; **no notification arrived ("nada") — FAIL**. UI success is NOT proof of an eligible Amazon ADM lease or successful Amazon delivery. Prior read-only Cloud Logging identified an expired Firebase ID token (HTTP 401), followed by HTTP 200 for a later authentication verification; this does not establish valid ADM claim. Previous scan showed ADM ROWS 0, before explicit toggling. Next smallest discriminator: **re-run existing `bash admchk.txt`** (short command, read-only; uploaded file already on Cloud Shell) and check ADM ROWS / ELIGIBLE ADM ROWS after enabling. If zero, diagnose native provider/auth registration. If eligible ADM present, diagnose Amazon sender logs/delivery/provider response. Owner insists no long pastes, repetitive scripts, unnecessary backup or blind APK/Firebase redeployment. Do not mark notification receipt PASS.

---

## 2026-10-14 ~22:50 EDT — FIRE HD 8 NOTIFICATION TEST FAIL (new APK)

Owner reports **FAIL** testing Fire HD 8 notifications after installing Cuberoot-published signed Android build **38671172852** (artifact **11943617517**), whose publishing handoff, checksum/certificate verification and Pages deployment passed. **No physical ADM notification acceptance**. The user has not yet specified whether no notification appeared or whether arrival/tap/PIN/routing failed; do NOT fabricate specifics. Earlier read-only scans (before updated APK) showed zero eligible `android-adm` leases. Next minimal test: run existing read-only Cloud Shell `bash admchk.txt` after launching Fire app, inspect `ADM ROWS`, `ELIGIBLE ADM ROWS` and claim logs. Distinguish current device registration failure from Amazon delivery failure. Do not redeploy Firebase, rebackup or rebuild blindly.

---

## 2026-10-14 ~22:07 EDT — Provider fix checks complete; waiting for website publication

Commit `812c1bdd247f78f5fcb1ba034ba7eb1fa02822c3` implements explicit Wire-style A3L ADM/FCM detection and fail-closed unknown provider on **Hermes/Android** only. New test in `build/test-adm.mjs` exercises runtime ADM token lease `android-adm`, Google FCM `android-native`, unknown/error fail-closed and preserved iOS selection. Signed APK run **38668803728** reported all jobs SUCCESS; artifact **11942369130**. This is compilation/build PASS, **NOT physical Fire receipt PASS**.

Cuberoot web release descriptor was still pointing to old run **38655432189** when last read. Do not ask owner to reinstall until publisher has replaced website APK with exact artifact from **38668803728**. Next: verify web descriptor / signed build identity; owner install Fire APK; check live eligible `android-adm` row, then direct/group notifications, tap/PIN/message. No other branches, Firebase or Wire changed.

---

## 2026-10-14 ~22:02 EDT — Provider-selection correction (Android source only)

Owner authorized immediate Android-only implementation following working Wire's A3L provider identification. Java `FidunioAdmPlugin` now checks Amazon A3L `getCurrentPlatform` and returns explicitly `adm`, `fcm` or unsupported (unknown), mirroring Wire's decision logic. Java `register()` remains ADM-only; Google's existing FirebaseMessaging owner is used for confirmed FCM, preserving the Google Android receiver. Java does not auto-register an unauthenticated ADM token.

`notification-platform-adapter.js` no longer starts with implicit `fcm` on Android: unknown/failed A3L detection fails closed, ADM acquires an Amazon token and sets lease platform `android-adm`, confirmed FCM acquires Firebase Messaging token and sets `android-native`, and the provider label is set only after successful matching token retrieval. iOS/Web branches/source and the live Firebase functions remain unchanged. Regression tests added to `build/test-adm.mjs` for ADM, Google FCM, unknown/error conditions and iOS invariance. GitHub CI started for latest `Android` commit `812c1bdd247f78f5fcb1ba034ba7eb1fa02822c3`; latest known workflow run `38668803728` was **pending** on initial inspection. No device receipt claim or functional PASS yet; once signed artifact is published, install it on Fire and confirm authenticated eligible `android-adm` lease, direct/group notification, tap/PIN/route.

No extra Firebase backup, deployment, Wire change or TestFlight actions were authorized or performed.

---

## 2026-10-14 21:54 EDT — Second read-only audit after Fire foreground

The owner opened FIDUNIO on Fire HD 8, waited, and re-ran `admchk.txt` in Cloud Shell. Output: `CHECK COMPLETE — NO CHANGES MADE`. Five user documents scanned; one enabled, unexpired, owner-matched `android-native` row; **`ADM ROWS: 0`, `ELIGIBLE ADM ROWS: 0` again**. It is not yet established whether the `android-native` row belongs to the Fire tablet. Logs in the query window: direct 12, group 6, claim 43; no matching diagnostic errors, send success not established. This repeat excludes a simple passive-foreground ADM lease recovery, not all other causes.

Source review: `FidunioAdmPlugin` uses Amazon A3L's `getCurrentPlatform` + `getToken`, similar to working Wire; generated `FidunioAdmService` receiver and `com.a3l.clsName` metadata match Amazon's documented A3L manifest. Client `notification-platform-adapter.js` silently falls back to Firebase Messaging when `activeAdm()` is unavailable, while Settings shows saved cloud registration separately from an authoritative eligible lease. This is a **potential fail-open/provider-observability defect**, not proved to be the exact tablet cause.

Next zero-cloud-change device check: inspect **FIDUNIO's own Settings → Notifications → Status** on Fire (not the system-wide OS notifications toggle); then relate to current installed APK/build and token selection. Do not repeat ADM sender deployment, backups or blind priority edits. Amazon reference: https://developer.amazon.com/docs/a3l-messaging/integrate.html

---

## 2026-10-14 21:46 EDT — READ-ONLY LIVE DIAGNOSTIC (owner screenshot)

- Owner ran existing `admchk.txt` in Cloud Shell on project `fidunio-fef13`; result `CHECK COMPLETE — NO CHANGES MADE`.
- Read-only window started `2026-10-15T00:30:00Z`. Log entries: direct trigger 7, group trigger 6, lease claim 28. Script reported `NO DIAGNOSTIC ERRORS IN MATCHED LOGS; success is NOT established`. Log counts do not prove individual pushes were sent.
- Five user documents scanned. Exactly one enabled/unexpired/owner-matched native registration was found with **platform=`android-native`**, not `android-adm`; `NATIVE ROWS: 1`, `ADM ROWS: 0`, `ELIGIBLE ADM ROWS: 0`.
- **Confirmed immediate blocker: No `android-adm` lease was saved among scanned users**, so the server has no eligible Amazon token to deliver to. Actual Fire installation identity is not yet correlated to the one `android-native` row; do not misattribute it. Why ADM registration is absent remains OPEN: current APK identity/provider detection, native plugin availability or authenticated claim failure.
- Source shows `notification-platform-adapter.js` defaults to `selectedNativeProvider="fcm"`, promotes to `adm` only after native `FidunioAdm.available()` reports support, otherwise uses `android-native`. This is consistent with the live state, not full root-cause proof.
- Next minimal gate: verify the Fire runs the published ADM-capable APK and foreground app registration actually establishes an owner-matched `android-adm` lease; only then test sender/receipt/tap/PIN. No code or Firebase deployment until cause established. Historical Fire DM receipt still FAIL.

---

## 2026-10-14 ~21:30 EDT — ADM live physical test (latest acceptance evidence)

- **Backend activation PASS (owner screenshot):** `adm33.txt`, Firebase `fidunio-fef13` / `us-central1`; both original Gen2 direct/group notification functions **ACTIVE** with two ADM secrets mounted, preserving triggers and service identity. No sender acceptance implied.
- **Original deployed-function backup PASS (owner screenshot):** two source archives and metadata/checksums in private versioned `gs://fidunio-fef13-notify-backup-130339622893/20261015T002242Z`. Do not redo.
- **Signed Android artifact PASS:** Hermes `Android` run `38655432189`, source `9bfae478f50f69eec5b4095f761fa7ace52a1438`, artifact `11937041460`, confirmed Cuberoot descriptor; the site's old `android-fcm-beta` channel label is not native provider verification.
- **Physical Amazon Fire HD 8 direct notification FAIL:** owner received no notice; Fire notification setting confirmed ON. Do not ask user to enable again.
- **NOT TESTED:** Fire group notifications; post-change web/iOS regression; Fire ADM lease state; Amazon delivery HTTP result; Fire notification tap/PIN/correct-message routing.
- **Next:** read-only cloud logs and authenticated lease eligibility, then sender vs device receive isolation. Wire `balita/android` 0.17.58 ADM physical receipt PASS is reference only (frozen). No code/Cloud Functions edits until root cause is proved; preserve rollback.
- Below historical status blocks record earlier build and migration stages; they are not current release verdicts.

---

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

## Android signed APK and Cuberoot publication — 2026-10-14

- GitHub Actions Android workflow run `38596933723` **PASS**, source `15a1152bb75b7c513a829f860f106c46de532f1b`, signed artifact `11909923773`. App and native-adapter verification passed; APK signing passed with certificate SHA256 `fbff41947e477e0b4df65bd741b550d7b30d7b18636a47c10853d789c4937a1d`.
- Automatic Cuberoot publisher had not executed since earlier failed builds, so its required `downloads/fidunio.apk` and `downloads/fidunio-build.json` were absent. An unchanged-logic workflow comment commit `10d34fef0745647dee24f3eae72c824b760ae98b` triggered the existing Cuberoot publisher.
- Publisher run `38599459960` **PASS**; Cuberoot `main` now contains the signed APK, .sha256 checksum and build manifest. Manifest identifies source run `38596933723`, APK SHA256 `0502d02637603f611d43e93dab5edc0b35f3b37e6d92f87676bc799c2ef1b63c`, size 10,064,732 bytes, signer digest listed above, origin GitHub Actions artifact.
- Cuberoot Pages deployment `38599545498` was still **in progress** on the last inspection. Actual public website HTTP download/visibility was **not yet independently verified**; do not announce public availability until deployment finishes and HTTP succeeds.
- The published beta is **FCM-only** (`android-fcm-beta`); Amazon Fire ADM has not been built or verified in this artifact. An ADM-enabled future build must be separately validated against Fire tablet, and the sender/server must support ADM. Never relabel the current APK as ADM-capable.

## Required release gates (not yet claimed PASS)

1. Confirm the required three GitHub Actions secrets are present (keystore, password, Android `google-services.json` base64); keep private material out of the repository/chat.
2. Run the `Android` signed-APK workflow after prerequisites are ready. Require successful native build, permanent signing validation, and signed artifact.
3. Independently verify the Cuberoot publisher's artifact, manifest, hash, and public download before claiming it published.
4. Owner-device acceptance on Android phone and Fire tablet: login/PIN/biometrics, media send/receive/zoom, notifications and correct conversation routing, hardware Back, logout, privacy/security, and regression coverage. Amazon Fire native ADM is a separate requirement and is not proven by an FCM build.
5. Preserve iOS/web functional parity through the platform abstraction layer, without changing production branches during this Android migration.

## Evidence limitations

All media and CORS confirmations were reported by the owner; no native Android physical-device tests are confirmed yet. No CORS settings were modified by this documentation entry.
