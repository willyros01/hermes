# FIDUNIO Capacitor iOS build workspace

The generated Capacitor Xcode project uses the default `ios/` path and is intentionally **not** committed during Phase 1. CI/build creates it from the pinned Capacitor toolchain and the explicit `build/www-files.txt` payload, following the Scorecard pattern.

Authoritative inputs:

- root shared FIDUNIO HTML/CSS/JavaScript;
- `capacitor.config.json`;
- `package.json` + `package-lock.json`;
- `build/www-files.txt`;
- `build/prepare-ios-web.mjs`;
- future native configuration/plugins stored under `build/ios/`.

Do not hand-edit a generated `ios/App` tree and treat it as authority. Native changes must be reproducible from committed build/plugin inputs.


## Phase 2 Apple registration preparation

Apple account registration authority is `IOS-APPLE-REGISTRATION.md`. The fixed explicit Bundle ID is `io.github.willyros01.fidunio`. The initial required Apple capability is Push Notifications; speculative capabilities remain off. `build/asc.mjs check` is a read-only verifier to run only after the Hermes repository has the Apple API credentials available. Do not copy Scorecard's export-compliance answer: FIDUNIO's E2EE requires its own Apple determination before the first TestFlight upload.


## Signed TestFlight workflow

`ios-testflight.yml` triggers on an `ios` push changing `build/ios-testflight-release.json`. Each run waits for exact-commit preflight, Simulator shell and security baseline success. `build/ios-testflight.sh` generates one isolated native project, uses the four existing repository Apple secrets, runs read-only identity checks, archives/exports with Xcode automatic signing, audits the distribution-signed app and its 98 shared assets before upload, then reads Apple processing/encryption status. Marketing version comes from `version.js`; build number is the workflow run number. Never rerun an already-uploaded build number: inspect Apple status first, then use a new release-marker push for a new build. Generated archives and private keys are ephemeral, not repository artifacts. App Store beta review, internal tester assignments and actual device acceptance are separate steps.
