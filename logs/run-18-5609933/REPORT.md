# FIDUNIO simulator + emulator evidence

**Overall result: INCOMPLETE / FAIL**

- GitHub Actions run: https://github.com/willyros01/hermes/actions/runs/40145182318
- Test-only source commit: 5609933990d1f42b3947a708177ddb9414b1468a
- Production app branches and Firebase project were not mutated
- Firebase: disposable `demo-` project IDs and localhost emulator ports

## Verification stages

| Stage | Status | PNG captures | Detailed evidence |
| --- | --- | ---: | --- |
| Reviewed functional and security regressions | **NOT RUN** | 0 | No detailed report; inspect GitHub job (cancelled) |
| Firebase emulator Firestore access rules | **NOT RUN** | 0 | No detailed report; inspect GitHub job (cancelled) |
| Authenticated invite, direct, group, reactions and notification settings workflows | **NOT RUN** | 0 | No detailed report; inspect GitHub job (cancelled) |
| Browser-based native-mode UI journeys | **NOT RUN** | 0 | No detailed report; inspect GitHub job (cancelled) |
| Android native simulator | **NOT RUN** | 0 | No detailed report; inspect GitHub job (cancelled) |
| iPhone native simulator | **NOT RUN** | 0 | No detailed report; inspect GitHub job (cancelled) |

## Interpretation

- The Android/iPhone native stages now include real authenticated Join, settings, direct/group composer, invitation and message UI operations, with independent pass/fail and on-device screen captures.
- Native enrollment uses a specifically disclosed localhost recovery-enrollment callable substitute; this does not prove production Cloud Functions or peer-side E2EE decryption.
- Authenticated flows exercise real exported app API transactions using disposable accounts and emulator rules; synthetic ciphertext is not an E2EE/decryption proof.
- Firebase rules checks verify actual repository rules inside local emulators.
- Existing source tests cover E2EE, direct/group messages, attachments, deletion, retention, recovery, notification policy, settings, and platform boundaries; not every control has a native automated UI journey.
- A green script build is never treated as proof that APNs, Amazon ADM, physical biometrics, actual camera pickers, or real push-tap routing works.
- Live Firebase messaging, external email delivery, physical Fire HD 8, iPhone/iPad acceptance, and real notification providers require separate controlled acceptance testing.
