from pathlib import Path

AUTH='FCM-NOTIFICATION-ARCHITECTURE.md'


def insert_after_first_line(path, block):
    p=Path(path); s=p.read_text()
    marker=block.splitlines()[0]
    if marker in s:
        return
    i=s.find('\n')
    if i<0:
        p.write_text(s+'\n\n'+block+'\n')
    else:
        p.write_text(s[:i+1]+'\n'+block+'\n\n'+s[i+1:].lstrip('\n'))


def insert_after_prefix(path, prefix, block):
    p=Path(path); s=p.read_text()
    marker=block.splitlines()[0]
    if marker in s:
        return
    idx=s.find(prefix)
    if idx<0:
        raise AssertionError(f'{path}: prefix not found: {prefix}')
    end=s.find('\n', idx)
    if end<0: end=len(s)
    p.write_text(s[:end+1]+'\n'+block+'\n'+s[end+1:])

# hermes-memory: durable instruction + mandatory-read pointer.
p=Path('hermes-memory.txt'); s=p.read_text()
block='''### MESSAGE NOTIFICATION / FCM AUTHORITY — FIDUNIO 1.1

`FCM-NOTIFICATION-ARCHITECTURE.md` is the authoritative durable design for every FIDUNIO Message Notification / FCM / Web Push task. BEFORE any notification implementation, testing, deployment, debugging, Firebase Messaging configuration, token-registration change, Cloud Function notification work, service-worker notification handling, or notification-click routing, reread that document together with the normal mandatory architecture documents. Do not rely on conversational memory. If a future notification proposal conflicts with that document, stop and reconcile the architecture before coding.

Governing notification principle: FCM tells the user that FIDUNIO has something new; Firestore plus the existing account-authoritative E2EE messaging system remain the only authority for what the message actually is. FCM carries no plaintext message/attachment content and is never a second message, receipt, E2EE, Firebase-init, or persistence authority. FCM activation remains FIDUNIO 1.1 work. No live Firebase/Google configuration change was made when this architecture was approved/documented.'''
if '### MESSAGE NOTIFICATION / FCM AUTHORITY — FIDUNIO 1.1' not in s:
    # Preserve the two-line memory title before the new current instruction.
    anchor='CUMULATIVE PROJECT MEMORY\n'
    assert anchor in s
    s=s.replace(anchor,anchor+'\n'+block+'\n\n',1)
if '`FCM-NOTIFICATION-ARCHITECTURE.md`' not in s[s.find('MANDATORY FIRST READ'):s.find('REBUILD BASELINE')]:
    needle='- At minimum: `hermes-memory.txt`'
    idx=s.find(needle)
    assert idx>=0
    end=s.find('\n',idx)
    addition='\n- Message Notification / FCM / Web Push work additionally MUST read `FCM-NOTIFICATION-ARCHITECTURE.md` before any consequential design, code, test, deploy, or Google/Firebase configuration instruction.'
    s=s[:end]+addition+s[end:]
p.write_text(s)

# Checklist: authoritative N1 ledger + future phase status.
insert_after_first_line('FIDUNIO-BUILD-CHECKLIST.md','''### FIDUNIO 1.1 Message Notifications — N1 architecture/specification

**Authoritative design:** `FCM-NOTIFICATION-ARCHITECTURE.md`.

- [x] Preserve the approved notification architecture as one durable authoritative document on `main`.
- [x] Define FCM/Web Push as notification/wake-up transport only; Firestore + existing E2EE remain message authority.
- [x] Prohibit plaintext/decrypted message and attachment content in push payloads.
- [x] Preserve `firebase.js` as sole Firebase SDK/service owner and service worker as infrastructure-only notification display/click owner.
- [x] Define installation-scoped notification-token storage and owner-only rules model.
- [x] Define explicit Settings permission flow; no automatic startup permission prompt.
- [x] Define server-only recipient resolution, FCM send, invalid-token cleanup, direct/group policy, multi-device behavior, disappearing-content behavior, and Fire OS limitation.
- [x] Define phased implementation N2-N7 and the live Google/Firebase handoff barrier.
- [ ] N2 — Firebase Messaging ownership foundation.
- [ ] N3 — Settings permission + UID-scoped token registration + rules/emulator tests.
- [ ] Google/Firebase handoff only after repo-side N2/N3 readiness is proven.
- [ ] N4 — Direct-message background notification.
- [ ] N5 — Notification tap routing through existing app/Firestore/E2EE path.
- [ ] N6 — Group + multi-device notification fan-out.
- [ ] N7 — lifecycle/reliability/device acceptance closeout.

Every future Message Notification/FCM task must read `FCM-NOTIFICATION-ARCHITECTURE.md` first and reconcile this checklist with it. N1 is documentation/architecture only and does not activate FCM or alter live Firebase configuration.''')

insert_after_first_line('CURRENT-REBUILD.md','''## FIDUNIO 1.1 Message Notification authority

`FCM-NOTIFICATION-ARCHITECTURE.md` is now the authoritative architecture for Message Notifications / FCM / Web Push. All future notification work must read it before implementation. FCM is notification/wake-up transport only; Firestore + existing account-authoritative E2EE remain message authority. No plaintext message or attachment content may enter push payloads. N1 architecture is approved; N2-N7 remain future implementation phases. This documentation checkpoint made no live Firebase/Google change and no runtime version change.''')

insert_after_first_line('README.md','''## FIDUNIO 1.1 Message Notifications — authoritative plan

The approved durable design is `FCM-NOTIFICATION-ARCHITECTURE.md`. It governs all future FCM/Web Push notification implementation, testing, deployment, token registration, server notification triggers, service-worker notification handling, and tap routing. FCM must remain a generic wake-up/notification layer; authoritative messages continue to come only from Firestore through the existing E2EE path. The N1 architecture checkpoint changes documentation only and does not enable FCM or change live Firebase configuration.''')

insert_after_first_line('RUNTIME-AUTHORITY-MAP.md','''## Message Notification / FCM authority — FIDUNIO 1.1

`FCM-NOTIFICATION-ARCHITECTURE.md` is the authoritative notification ownership map and must be read before notification work. Key boundary: `firebase.js` remains sole client Firebase SDK/service owner; a dedicated registration owner may manage notification intent/status only; server Functions/Admin own recipient resolution/FCM send/token cleanup; `service-worker.js` owns only generic push display/click transport; `app.js`/existing conversation owners retain routing/message projection; existing E2EE and receipt owners are unchanged. Push never constructs message state or decrypts content.''')

insert_after_first_line('architecture-ownership.txt','''MESSAGE NOTIFICATION / FCM AUTHORITY — FIDUNIO 1.1
`FCM-NOTIFICATION-ARCHITECTURE.md` is the authoritative design for all Message Notification / FCM / Web Push resources. It is mandatory reading before notification work. The core ownership rule remains ONE RESOURCE -> ONE OWNER -> ONE PREDEFINED AREA -> ONE SERIALIZED WRITE PATH. FCM is notification/wake-up transport only; Firestore + existing E2EE remain message authority. firebase.js remains sole client Firebase owner; server notification Functions own recipient resolution/send/token cleanup; service-worker.js may display/click-route generic notifications only and may not decrypt, write receipts, persist chat state, or create message rows.
''')

insert_after_first_line('CODING-GUIDELINES.md','''## Message Notification / FCM mandatory reference

For every Message Notification, Firebase Cloud Messaging, Web Push, notification token, notification Cloud Function, notification service-worker, or notification-click task, `FCM-NOTIFICATION-ARCHITECTURE.md` is a mandatory pre-code read in addition to this document. A notification implementation that conflicts with that authority must stop for architecture reconciliation rather than introducing a workaround or second owner.''')

insert_after_first_line('FIREBASE-RECOVERY-PROJECT-CONFIG.md','''## FIDUNIO 1.1 notification configuration authority

Before any live Firebase Messaging / Web Push / VAPID / notification Cloud Function configuration or deployment, read `FCM-NOTIFICATION-ARCHITECTURE.md`. That document defines the notification architecture and the explicit Google/Firebase handoff barrier. The N1 documentation checkpoint does NOT authorize or imply any live Firebase Messaging, VAPID, Functions, Firestore-rule, or Google Cloud configuration change.''')

print('Notification authority references installed in durable project docs.')
