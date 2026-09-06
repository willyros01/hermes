from pathlib import Path
p=Path('FIDUNIO-BUILD-CHECKLIST.md'); s=p.read_text()
old='''## Current completion estimate

Approximately **65%** of the first complete rebuild release acceptance criteria. FCM 1.1 and App Check 1.2 are tracked roadmap work and are not part of this percentage or first-release completion gate.
'''
new='''## Weighted 1.0 completion ledger

The 1.0 percentage is now a **fixed-point weighted ledger**, not a subjective estimate and not a count of build numbers. The denominator is exactly **100.0 product points**. FCM 1.1 and App Check 1.2 are outside this denominator.

### Calculation rule

1. **Validated foundation through 0.9.6.20 = 66.0 earned points.** This freezes already repository-validated architecture, account E2EE/recovery, direct/group messaging foundations, responsive foundations, and the server disappearing-purge authority into one audited baseline rather than repeatedly re-estimating historical work.
2. Every remaining allocated 1.0 build has a fixed point value below. A build earns its points only when its stated exit criteria are satisfied and the required repository gate is green. `PLANNED`, `CURRENT`, and incomplete `IN PROGRESS` builds earn 0 from their reserved points.
3. `BLOCKED — USER DEVICE PROOF` work earns no final-device points until the required real-device acceptance is recorded.
4. If a validated build regresses, its points are removed until the regression is closed. If a new mandatory 1.0 task is discovered, points must be reallocated **before** implementation while preserving the 100.0 denominator; the percentage must never be adjusted merely to look smoother.
5. Reported completion = `earned product points / 100`, rounded to the nearest whole percent for normal status reports. The ledger retains tenths so progress remains auditable.

### Remaining point allocation

| Build(s) | 1.0 product work | Points |
|---|---|---:|
| **0.9.6.21** | Local anti-resurrection decision foundation | **1.0** |
| **0.9.6.22–0.9.6.25** | IndexedDB/Outbox purge wiring, authoritative projection convergence, restart/reconnect proof, multi-device expiry convergence | **4.0** (1.0 each) |
| **0.9.6.26–0.9.6.27** | Disappearing-text UI + end-to-end security closeout | **2.0** (1.0 each) |
| **0.9.6.28–0.9.6.29** | Group earlier-history UI + receipt/lifecycle stabilization | **2.0** (1.0 each) |
| **0.9.7.0–0.9.7.9** | Complete encrypted attachment/rich-messaging phase including disappearing attachment purge | **10.0** (1.0 each) |
| **0.9.8.0–0.9.8.5** | Invitation/join/account association + safe install rebuild | **6.0** (1.0 each) |
| **0.9.9.0–0.9.9.3** | Remaining UI completion, prototype cleanup, responsive/lifecycle hardening | **3.0** (0.75 each) |
| **0.9.9.4–0.9.9.5** | Complete repository candidate gate + final docs/package reconciliation | **1.5** (0.75 each) |
| **0.9.9.6** | Atomic coherent candidate deployment to `htest` | **0.5** |
| **0.9.9.7** | Real-device acceptance pass | **2.0** |
| **0.9.9.8** | Reserved RC stabilization; if no defects require code, points earn when acceptance confirms no stabilization is needed | **0.5** |
| **0.9.9.9** | 1.0 promotion readiness/go-no-go | **0.5** |
| **1.0.0** | Controlled final production/Firebase handoff and synchronized release promotion | **1.0** |
| | **Remaining allocation after 0.9.6.20** | **34.0** |

### Current calculation

- Audited validated foundation through 0.9.6.20: **66.0 / 66.0 earned**.
- 0.9.6.21 is repository-validated: **+1.0 earned**.
- 0.9.6.22 and later allocated builds: **0.0 earned so far**.
- **Current total: 67.0 / 100.0 = 67%.**

This 67% is the authoritative 1.0 completion figure until another allocated build earns points or a validated item regresses.
'''
if old not in s: raise SystemExit('completion estimate anchor not found')
p.write_text(s.replace(old,new,1))

m=Path('hermes-memory.txt'); t=m.read_text(); marker='WEIGHTED 1.0 COMPLETION LEDGER — USER REQUIREMENT'
if marker not in t:
 t += '''\n\nWEIGHTED 1.0 COMPLETION LEDGER — USER REQUIREMENT\n- FIDUNIO 1.0 completion is now a fixed 100.0-point weighted ledger in `FIDUNIO-BUILD-CHECKLIST.md`, not a subjective estimate or raw build count.\n- Audited/repository-validated foundation through 0.9.6.20 is frozen at 66.0 earned points. 0.9.6.21 earns 1.0, making the current authoritative completion 67.0%.\n- Every remaining allocated 1.0 build has a fixed point value. Reserved/current/incomplete builds earn zero until exit criteria + required repository gate are green; real-device points remain unearned until device proof.\n- Regression removes points. Newly discovered mandatory 1.0 work requires explicit point reallocation before implementation while denominator remains 100.0.\n- FCM 1.1 and App Check enforcement 1.2 remain outside the 1.0 denominator.\n'''
 m.write_text(t)
print('weighted ledger installed: 67.0%')
