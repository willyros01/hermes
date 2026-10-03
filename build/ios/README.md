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
