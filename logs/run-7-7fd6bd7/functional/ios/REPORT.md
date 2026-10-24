# FIDUNIO ios-shared webkit authenticated functional emulator run

**Result: FAIL — 13/14 executed cases**

- App source: /home/runner/work/hermes/hermes/ios-src
- Firebase project: `demo-fidunio-simulator-tests` (localhost Auth and Firestore only)
- Test accounts: synthetic and disposable; no production credentials
- Tests invoke actual exported FIDUNIO client APIs and enforce real Firestore rules
- Direct/group payloads use **synthetic ciphertext fixtures**; separate reviewed crypto tests check actual E2EE
- APNs/ADM/FCM arrival, callable leases, camera, live email, hardware biometrics and full settings UI are **NOT VERIFIED** here

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
| FN-013 | **FAIL** | locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.fidunio-settings-nav-btn[data-group="general"]')
    - locator resolved to <button type="button" data-group="general" aria-current="false" class="fidunio-settings-nav-btn">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    2 × waiting for element to be visible, enabled and stable
    - element was detached from the DOM, retrying
      - locator resolved to <button type="button" data-group="general" aria-current="false" class="fidunio-settings-nav-btn">…</button>
    - attempting click action
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 20ms
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 500ms
    45 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms
 |
| FN-014 | **PASS** | Non-admin removal denied; Owner removes/adds; E2EE key epoch increments; former member loses access |

## Unverified device/provider behaviour

- Actual email invitation sharing and Universal Link open on physical hardware
- Real encrypted display, attachments, replies, history grants, purge execution, Firebase Functions deletion and lease endpoints
- Native APNs and Amazon ADM push **arrival** and notification tap-to-PIN routing
- Hardware Face ID/biometric, camera, microphone, background, offline, settings screen persistence

## Failures

- FN-013: locator.click: Timeout 30000ms exceeded. Call log:   - waiting for locator('.fidunio-settings-nav-btn[data-group="general"]')     - locator resolved to <button type="button" data-group="general" aria-current="false" class="fidunio-settings-nav-btn">…</button>   - attempting click action     2 × waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action     - waiting 20ms     2 × waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 100ms     2 × waiting for element to be visible, enabled and stable     - element was detached from the DOM, retrying       - locator resolved to <button type="button" data-group="general" aria-current="false" class="fidunio-settings-nav-btn">…</button>     - attempting click action       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 20ms       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 100ms       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 100ms       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 500ms       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 500ms       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 500ms       - waiting for element to be visible, enabled and stable       - element is not visible     - retrying click action       - waiting 500ms     45 × waiting for element to be visible, enabled and stable        - element is not visible      - retrying click action        - waiting 500ms 

