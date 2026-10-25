# FIDUNIO Android-shared chromium authenticated functional emulator run

**Result: PASS — 14/14 executed cases**

- App source: /home/runner/work/hermes/hermes
- Firebase project: `demo-fidunio-simulator-tests` (localhost Auth and Firestore only)
- Test accounts: synthetic and disposable; no production credentials
- Tests invoke actual exported FIDUNIO client APIs and enforce real Firestore rules
- Direct/group payloads use **synthetic ciphertext fixtures**; separate reviewed crypto tests check actual E2EE
- APNs/ADM/FCM arrival, callable leases, camera, live email, hardware biometrics and settings beyond these four UI controls are **NOT VERIFIED** here

| ID | Result | Verified interaction |
| --- | --- | --- |
| FN-001 | **PASS** | Disposable Owner signs in using the original FIDUNIO API and demo Auth/Firestore |
| FN-002 | **PASS** | Owner sends four actual invitations; recipients consume them; Auth accounts and Firestore profiles created |
| FN-003 | **PASS** | Used/revoked invitation rejected; User cannot issue/list invites; Admin can issue and Owner revokes |
| FN-004 | **PASS** | Original direct-conversation API creates shared record; outsider read denied by real rules |
| FN-005 | **PASS** | Direct encrypted-envelope transport, disappearing metadata, sent→delivered→read, emoji add/remove/invalid |
| FN-006 | **PASS** | Block denies direct transport in actual Firestore rules; unblock removes restriction |
| FN-007 | **PASS** | Original group creation writes owner, two members and membership metadata; outsider denied |
| FN-008 | **PASS** | Only group admin can rename; owner cannot be removed |
| FN-009 | **PASS** | Encrypted group transport, member-only access, disappearing metadata, delivery/read receipts, emoji toggle |
| FN-010 | **PASS** | Web notification device registration, sender privacy preference, cross-user isolation, deletion; ADM direct write denied (lease API only) |
| FN-011 | **PASS** | Report abuse creates open report; authorized system Admin can view it |
| FN-012 | **PASS** | System Admin suspends/restores user; suspended user cannot write group |
| FN-013 | **PASS** | Rendered Settings A++, Dark, notification previews and Wi-Fi attachment option; persisted after browser reload (3 PNGs) |
| FN-014 | **PASS** | Non-admin removal denied; Owner removes/adds; E2EE key epoch increments; former member loses access |

## Unverified device/provider behaviour

- Actual email invitation sharing and Universal Link open on physical hardware
- Real encrypted display, attachments, replies, history grants, purge execution, Firebase Functions deletion and lease endpoints
- Native APNs and Amazon ADM push **arrival** and notification tap-to-PIN routing
- Hardware Face ID/biometric, camera, microphone, background, offline, full settings coverage beyond the four rendered controls

