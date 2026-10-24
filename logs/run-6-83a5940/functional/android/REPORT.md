# FIDUNIO Android-shared chromium authenticated functional emulator run

**Result: FAIL — 0/1 executed cases**

- App source: /home/runner/work/hermes/hermes
- Firebase project: `demo-fidunio-simulator-tests` (localhost Auth and Firestore only)
- Test accounts: synthetic and disposable; no production credentials
- Tests invoke actual exported FIDUNIO client APIs and enforce real Firestore rules
- Direct/group payloads use **synthetic ciphertext fixtures**; separate reviewed crypto tests check actual E2EE
- APNs/ADM/FCM arrival, callable leases, camera, live email, hardware biometrics and full settings UI are **NOT VERIFIED** here

| ID | Result | Verified interaction |
| --- | --- | --- |
| FN-001 | **FAIL** | page.evaluate: FirebaseError: Firebase: Error (auth/network-request-failed).
    at createErrorInternal (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:29725)
    at _fail (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:28841)
    at _performFetchWithErrorHandling (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:36492)
    at async _performSignInRequest (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:36606)
    at async _signInWithCredential (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:94988)
    at async Module.signInFidunio (http://127.0.0.1:36733/firebase.js:90:242)
    at async <anonymous>:337:30 |

## Unverified device/provider behaviour

- Actual email invitation sharing and Universal Link open on physical hardware
- Real encrypted display, attachments, replies, history grants, purge execution, Firebase Functions deletion and lease endpoints
- Native APNs and Amazon ADM push **arrival** and notification tap-to-PIN routing
- Hardware Face ID/biometric, camera, microphone, background, offline, settings screen persistence

## Failures

- FN-001: page.evaluate: FirebaseError: Firebase: Error (auth/network-request-failed).     at createErrorInternal (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:29725)     at _fail (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:28841)     at _performFetchWithErrorHandling (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:36492)     at async _performSignInRequest (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:36606)     at async _signInWithCredential (https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js:1:94988)     at async Module.signInFidunio (http://127.0.0.1:36733/firebase.js:90:242)     at async <anonymous>:337:30
- Error: Cannot proceed without isolated owner seed     at file:///home/runner/work/hermes/hermes/build/simulator/run-functional.mjs:152:19

