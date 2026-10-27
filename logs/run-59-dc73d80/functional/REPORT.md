# Authenticated FIDUNIO feature workflows

**Result: FAIL — 2/4 cross-platform source/engine runs**

| Source / browser | Status | Cases passed | Report |
| --- | --- | ---: | --- |
| Android-shared / Chromium | PASS | 14/14 | [android/REPORT.md](android/REPORT.md) |
| iOS-shared / WebKit | PASS | 14/14 | [ios/REPORT.md](ios/REPORT.md) |
| 1.1.80 web / Chromium | FAIL | 0/1 | [web-chromium/REPORT.md](web-chromium/REPORT.md) |
| 1.1.80 web / WebKit | FAIL | 0/1 | [web-webkit/REPORT.md](web-webkit/REPORT.md) |

Android/iOS source API tests use real authenticated Firebase transactions. Web source tests also click and inspect actual browser reaction chips, dialog and immediate DOM paint, with a clearly marked simulator-only encrypted-text projection. No live production deployment is inferred.
All message ciphertext is synthetic test-fixture data; reviewed cryptography suites run separately.
Actual notification delivery, Cloud Function leases, email, physical biometrics, other settings controls, and native hardware acceptance remain **NOT VERIFIED**.
