import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');const write=(p,s)=>fs.writeFileSync(p,s);
function append(p,marker,text){const s=read(p);if(!s.includes(marker))write(p,s.trimEnd()+"\n\n"+text.trim()+"\n");}
append('hermes-memory.txt','V3 REPOSITORY CHECKPOINT — SECURITY GATE GREEN',`V3 REPOSITORY CHECKPOINT — SECURITY GATE GREEN — SEPTEMBER 6, 2026
- Version 0.9.6.3 is the branch test checkpoint.
- Full Rebuild Baseline Security Gate passed all substantive steps after the account-E2EE runtime cutover: Firestore E2EE rules, account-message rules, recovery crypto/session/callable/Firestore adapter, central Firebase adapter, account auth lifecycle, recovery client boundary, direct-message crypto/service, App Check integration, Functions scaffold, transform gate, and runtime authority gate.
- Recovery Functions remain live/ACTIVE from the verified console handoff; this repository work did not redeploy them.
- Account Encryption UI, callable recovery client, coordinated password rewrap, e2ee:3 direct send/receive, Outbox send path, and service-worker transform retirement are materialized on fidunio-rebuild-baseline-2026-09-05.
- App Check enforcement remains OFF.
- STOP BOUNDARY: do not merge/deploy this v3 transport to the live app until a legitimate signed-in account performs the first real Account Encryption enrollment/unlock/recovery proof on a test device. That proof necessarily needs the user's authenticated browser and chosen six-digit account E2EE PIN; it cannot be completed by repository CI without exposing credentials or fabricating a user identity.
- Required first live proof: enroll -> READY -> record stable keyId -> sign out/reset runtime -> unlock same keyId -> controlled recovery after password-reset test -> same keyId/history -> two-device e2ee:3 send/read/offline-Outbox test. Only after that proof may the branch be merged/deployed and later App Check metrics evaluated for enforcement.`);
append('REBUILD-BASELINE-AUDIT.md','## Account-E2EE v3 repository checkpoint — September 6, 2026',`## Account-E2EE v3 repository checkpoint — September 6, 2026

Version 0.9.6.3 has the account-authoritative client/runtime cutover materialized on the rebuild branch. The full security gate passed Firestore rules, recovery server/client boundaries, account lifecycle, v3 crypto/service, App Check integration, Functions scaffold, raw-runtime transform anchors, and sole-authority checks. service-worker.js is now cache/transport only.

This is deliberately NOT yet a live-app deployment. The remaining gate is a real authenticated-device proof of enrollment, unlock, recovery preserving the same keyId/history, and two-device e2ee:3/Outbox behavior. Repository CI cannot safely substitute for the user's Firebase account credentials and chosen six-digit E2EE PIN. App Check enforcement remains OFF.`);
append('ACCOUNT-E2EE-FIRESTORE-AUTHORITY.md','## Runtime implementation checkpoint — September 6, 2026',`## Runtime implementation checkpoint — September 6, 2026

The rebuild branch now wires account-authoritative enrollment/unlock/recovery and e2ee:3 direct-message send/receive. The raw runtime is authoritative and the service worker no longer performs semantic source transforms. All repository security gates are green. Live cutover remains blocked until the first real authenticated account proves READY, stable-keyId recovery, history preservation, and two-device messaging/Outbox behavior.`);
append('DETERMINISTIC-UI-LIFECYCLE.md','## Account Encryption Settings owner — September 6, 2026',`## Account Encryption Settings owner — September 6, 2026

settings-lifecycle.js owns the named Account Encryption Settings host and serializes account/profile mutations. Enrollment/unlock/recovery inputs are ephemeral DOM values only; the six-digit account E2EE PIN is not persisted by the UI. The installation-local 4–12 digit app-lock PIN remains a separate resource and lifecycle.`);
append('BUG-LIST.md','## 0.9.6.3 validation boundary',`## 0.9.6.3 validation boundary

No repository-gate failure is open for the account-E2EE v3 materialization. The remaining item is a required live-device validation gate, not a known code defect: first authenticated enrollment/unlock/recovery with stable keyId/history, followed by two-device e2ee:3 send/read/offline-Outbox verification. App Check remains OFF until that succeeds.`);
console.log('Final v3 documentation checkpoint recorded.');
