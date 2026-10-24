# FIDUNIO simulator + emulator evidence

**Overall result: INCOMPLETE / FAIL**

- GitHub Actions run: https://github.com/willyros01/hermes/actions/runs/40113305588
- Test-only source commit: 5283ce74274ce351c75994ed29b824eebfc1f6ad
- Production app branches and Firebase project were not mutated
- Firebase: disposable `demo-` project IDs and localhost emulator ports

## Verification stages

| Stage | Status | PNG captures | Detailed evidence |
| --- | --- | ---: | --- |
| Reviewed functional and security regressions | **FAIL** | 0 | [unit/REPORT.md](unit/REPORT.md) |
| Firebase emulator Firestore access rules | **PASS** | 0 | [rules/REPORT.md](rules/REPORT.md) |
| Browser-based native-mode UI journeys | **FAIL** | 10 | [browser/REPORT.md](browser/REPORT.md) |
| Android native simulator | **PASS** | 10 | [android/REPORT.md](android/REPORT.md) |
| iPhone native simulator | **PASS** | 10 | [ios/REPORT.md](ios/REPORT.md) |

## Interpretation

- Native device captures prove the specified pre-auth screens on disposable phone simulators, not full authenticated messaging.
- Firebase rules checks verify actual repository rules inside local emulators.
- Existing source tests cover a wide range of E2EE, direct/group messages, attachments, deletion, retention, recovery, notification policy, settings, and platform boundaries.
- A green script build is never treated as proof that APNs, Amazon ADM, physical biometrics, actual camera pickers, or real push-tap routing works.
- Live Firebase messaging, external email delivery, physical Fire HD 8, iPhone/iPad acceptance, and real notification providers require separate controlled acceptance testing.
