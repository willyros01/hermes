# Authenticated FIDUNIO feature workflows

**Result: FAIL — 0/2 cross-platform source/engine runs**

| Source / browser | Status | Cases passed | Report |
| --- | --- | ---: | --- |
| Android-shared / Chromium | FAIL | 13/14 | [android/REPORT.md](android/REPORT.md) |
| iOS-shared / WebKit | FAIL | 13/14 | [ios/REPORT.md](ios/REPORT.md) |

These are real authenticated client API transactions against the Auth/Firestore emulators, not device chat-screen walkthroughs.
All message ciphertext is synthetic test-fixture data; reviewed cryptography suites run separately.
Actual notification delivery, Cloud Function leases, email, physical biometrics, full settings UI, and native hardware acceptance remain **NOT VERIFIED**.
