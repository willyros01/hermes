# FIDUNIO Web-main3-WebKit webkit authenticated functional emulator run

**Result: FAIL — 0/1 executed cases**

- App source: /home/runner/work/hermes/hermes/web-src
- Firebase project: `demo-fidunio-simulator-tests` (localhost Auth and Firestore only)
- Test accounts: synthetic and disposable; no production credentials
- Tests invoke actual exported FIDUNIO client APIs and enforce real Firestore rules
- Direct/group payloads use **synthetic ciphertext fixtures**; separate reviewed crypto tests check actual E2EE
- APNs/ADM/FCM arrival, callable leases, camera, live email, hardware biometrics and settings beyond these four UI controls are **NOT VERIFIED** here

| ID | Result | Verified interaction |
| --- | --- | --- |
| FN-001 | **FAIL** | Local owner account could not be created: {"error":{"code":400,"message":"EMAIL_EXISTS","errors":[{"message":"EMAIL_EXISTS","reason":"invalid","domain":"global"}]}} |

## Unverified device/provider behaviour

- Actual email invitation sharing and Universal Link open on physical hardware
- Real encrypted display, attachments, replies, history grants, purge execution, Firebase Functions deletion and lease endpoints
- Native APNs and Amazon ADM push **arrival** and notification tap-to-PIN routing
- Hardware Face ID/biometric, camera, microphone, background, offline, full settings coverage beyond the four rendered controls

## Failures

- FN-001: Local owner account could not be created: {"error":{"code":400,"message":"EMAIL_EXISTS","errors":[{"message":"EMAIL_EXISTS","reason":"invalid","domain":"global"}]}}
- Error: Cannot proceed without isolated owner seed     at file:///home/runner/work/hermes/hermes/build/simulator/run-functional.mjs:193:19     at process.processTicksAndRejections (node:internal/process/task_queues:103:5)

