# FIDUNIO / Hermes — Deferred TODO

These items are intentionally deferred. Do not begin them unless explicitly requested.

1. **Emoticons on messages** — the existing text/E2EE path is Unicode-capable, so native-keyboard emoji entry should require verification rather than a data-format change. A built-in composer picker is a separate small UI feature; per-message reactions are a larger data/synchronization feature. Confirm the intended scope before implementation.
2. **Persistence of FIDUNIO on trusted local devices** — preserve the intended trusted-device FIDUNIO installation/session state across normal device use and app restarts without weakening the existing PIN/biometric, account, E2EE, or local-security boundaries. Scope and acceptance criteria to be discussed before implementation.

## Current focus

- Notification tap routing, exact-message priority projection, newest positioning and composer stability are DEVICE ACCEPTED on iPhone and iPad at the FIDUNIO 1.1.24 checkpoint.
- Next notification phase is N6: groups + multi-device, unless another priority is explicitly chosen first.
