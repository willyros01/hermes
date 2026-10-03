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
