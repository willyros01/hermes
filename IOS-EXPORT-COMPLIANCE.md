# FIDUNIO iOS export-compliance assessment

Date: 2026-10-03
Scope: current Capacitor 8.5.2 iOS shell, bundle `io.github.willyros01.fidunio`.
Status: technical self-assessment complete; first uploaded-build processing remains unverified.

## Determination and limits

FIDUNIO DOES use encryption, including application-level end-to-end encryption. For this current iOS implementation, its encryption primitives are provided by Apple's WKWebView/WebKit Web Crypto implementation. The supported App Store Connect answer is encryption limited to that within Apple's operating system, with `ITSAppUsesNonExemptEncryption = false`. This means exempt from Apple's encryption-document upload requirement, not absence of encryption and not a CCATS or government approval.

This determination was independently derived from FIDUNIO code and Apple/WebKit documentation, not copied from Scorecard. Apple states that OS-limited encryption requires no encryption documentation in App Store Connect. WebKit documents that its macOS/iOS Web Crypto implementation uses CommonCrypto. App-owned message envelopes, authenticated metadata, group epoch/key handling and encrypted vault formats call those primitives; they do not implement replacement AES/ECDH algorithms.

Reassess before distributing any candidate that adds a JavaScript/WASM/native cryptographic implementation outside Apple's OS, an alternative browser engine, a proprietary algorithm/protocol, or changes the encryption architecture. This is a technical self-assessment under Apple's published documentation, not an Apple export-review acceptance or a legal determination for all countries.

## Source evidence

Reviewed 82 allow-listed JavaScript/HTML source files from `build/www-files.txt` and current package dependency declarations. Encryption code inspected includes:

- `e2ee-account-crypto.js`: ECDH P-256 identity; AES-256-GCM key wrapping; PBKDF2-HMAC-SHA256.
- `e2ee-account-message-crypto.js`: ECDH P-256 / HKDF-SHA256 / AES-256-GCM through `crypto.subtle`.
- `e2ee-account-group-crypto.js` and `e2ee-account-group-history-crypto.js`: same OS-provided primitives for group epoch wrapping and history grants.
- `e2ee-account-attachment-crypto.js`: AES-256-GCM chunk encryption and SHA-256 integrity.
- `account-vault-format.js`: HKDF-SHA256 and AES-256-GCM for portable encrypted vaults.
- `app.js`, `account-storage.js`, `local-security.js`: Web Crypto AES-GCM storage, ECDH/HKDF and PBKDF2 PIN verification.
- `package.json`: Capacitor Core/iOS production dependencies; build/test tooling is not the application payload.

No bundled replacement encryption library or WASM encryption asset was identified in the explicit application payload. Existing Firebase services remain backend authority; server crypto and Apple CI JWT signing are not bundled mobile encryption implementations.

## App Store Connect observation

Opened FIDUNIO App Information > App Encryption Documentation. The upload wizard asks for app purpose, then permits selecting proprietary algorithms or standard algorithms beyond Apple's OS. Neither selection matches this current OS-provided implementation. The upload wizard was cancelled without creating a declaration or uploading a document. No Apple-issued export code exists or is required by this self-assessment.

The appropriate place to communicate the exempt result is the generated application's Info.plist. First TestFlight upload must verify the resulting archive contains the Boolean false and that App Store Connect processes the build without unexpected Missing Compliance status. An unexpected question or requirement must be reviewed rather than overridden.

## Primary sources consulted

- [Apple: documentation by encryption type](https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption)
- [Apple: overview and developer responsibility](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance)
- [Apple: determining documentation requirements](https://developer.apple.com/help/app-store-connect/manage-app-information/determine-and-upload-app-encryption-documentation)
- [WebKit: native Web Crypto / CommonCrypto on macOS and iOS](https://webkit.org/blog/7790/update-on-web-cryptography/)

No production web, Firebase backend, App Check enforcement or cryptographic runtime behavior was changed by this assessment.
