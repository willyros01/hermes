# FIDUNIO ios-shared webkit authenticated functional emulator run

**Result: FAIL — 6/12 executed cases**

- App source: /home/runner/work/hermes/hermes/ios-src
- Firebase project: `demo-fidunio-simulator-tests` (localhost Auth and Firestore only)
- Test accounts: synthetic and disposable; no production credentials
- Tests invoke actual exported FIDUNIO client APIs and enforce real Firestore rules
- Direct/group payloads use **synthetic ciphertext fixtures**; separate reviewed crypto tests check actual E2EE
- APNs/ADM/FCM arrival, callable leases, camera, live email, hardware biometrics and full settings UI are **NOT VERIFIED** here

| ID | Result | Verified interaction |
| --- | --- | --- |
| FN-001 | **PASS** | Disposable Owner signs in using the original FIDUNIO API and demo Auth/Firestore |
| FN-002 | **FAIL** | Cannot read properties of undefined (reading 'status') |
| FN-003 | **PASS** | Used/revoked invitation rejected; User cannot issue/list invites; Admin can issue and Owner revokes |
| FN-004 | **PASS** | Original direct-conversation API creates shared record; outsider read denied by real rules |
| FN-005 | **FAIL** | Cannot read properties of undefined (reading 'text') |
| FN-006 | **PASS** | Block denies direct transport in actual Firestore rules; unblock removes restriction |
| FN-007 | **PASS** | Original group creation writes owner, two members and membership metadata; outsider denied |
| FN-008 | **FAIL** | Cannot read properties of undefined (reading 'name') |
| FN-009 | **FAIL** | Cannot read properties of undefined (reading 'receiptRevision') |
| FN-010 | **PASS** | Web notification device registration, sender privacy preference, cross-user isolation, deletion; ADM direct write denied (lease API only) |
| FN-011 | **FAIL** | Cannot read properties of undefined (reading 'status') |
| FN-012 | **FAIL** | Cannot read properties of undefined (reading 'active') |

## Unverified device/provider behaviour

- Actual email invitation sharing and Universal Link open on physical hardware
- Real encrypted display, attachments, replies, history grants, purge execution, Firebase Functions deletion and lease endpoints
- Native APNs and Amazon ADM push **arrival** and notification tap-to-PIN routing
- Hardware Face ID/biometric, camera, microphone, background, offline, settings screen persistence

## Failures

- FN-002: Cannot read properties of undefined (reading 'status')
- FN-005: Cannot read properties of undefined (reading 'text')
- FN-008: Cannot read properties of undefined (reading 'name')
- FN-009: Cannot read properties of undefined (reading 'receiptRevision')
- FN-011: Cannot read properties of undefined (reading 'status')
- FN-012: Cannot read properties of undefined (reading 'active')

