# FIDUNIO simulator + emulator evidence

**Overall result: INCOMPLETE / FAIL**

- GitHub Actions run: https://github.com/willyros01/hermes/actions/runs/40125224817
- Test-only source commit: 83a594051602ae7e1b95f95584a63c8ab77f2e2c
- Production app branches and Firebase project were not mutated
- Firebase: disposable `demo-` project IDs and localhost emulator ports

## Verification stages

| Stage | Status | PNG captures | Detailed evidence |
| --- | --- | ---: | --- |
| Reviewed functional and security regressions | **PASS** | 0 | [unit/REPORT.md](unit/REPORT.md) |
| Firebase emulator Firestore access rules | **PASS** | 0 | [rules/REPORT.md](rules/REPORT.md) |
| Authenticated invite, direct, group, reactions and notification settings workflows | **FAIL** | 0 | [functional/REPORT.md](functional/REPORT.md) |
| Browser-based native-mode UI journeys | **PASS** | 16 | [browser/REPORT.md](browser/REPORT.md) |
| Android native simulator | **PASS** | 10 | [android/REPORT.md](android/REPORT.md) |
| iPhone native simulator | **PASS** | 10 | [ios/REPORT.md](ios/REPORT.md) |

## Interpretation

- Native device captures prove the specified pre-auth screens on disposable phone simulators, not full authenticated messaging.
- Authenticated flows exercise real exported app API transactions using disposable accounts and emulator rules; synthetic ciphertext is not an E2EE/decryption proof.
- Firebase rules checks verify actual repository rules inside local emulators.
- Existing source tests cover a wide range of E2EE, direct/group messages, attachments, deletion, retention, recovery, notification policy, settings, and platform boundaries.
- A green script build is never treated as proof that APNs, Amazon ADM, physical biometrics, actual camera pickers, or real push-tap routing works.
- Live Firebase messaging, external email delivery, physical Fire HD 8, iPhone/iPad acceptance, and real notification providers require separate controlled acceptance testing.
