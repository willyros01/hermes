from pathlib import Path
import json

def read(path): return Path(path).read_text()
def write(path,text): Path(path).write_text(text)
def edit(path,old,new,count=1):
    s=read(path)
    if old not in s: raise SystemExit(f"missing anchor: {path}: {old[:100]}")
    write(path,s.replace(old,new,count))
def prepend(path,block):
    s=read(path)
    if block.strip() not in s: write(path,block+s)

pkg=json.loads(read('package.json'))
pkg['scripts']['test:message-reactions']='node message-reaction-policy.test.mjs && node message-reaction-wiring.test.mjs'
write('package.json',json.dumps(pkg,separators=(',',':'))+'\n')

note='''FIDUNIO 1.1.43 MESSAGE REACTIONS — 2026-09-12: TODO item 1 is implemented as per-message reactions, not a composer emoji picker. The existing 650 ms press-and-hold Message actions owner remains singular and unchanged; its action sheet adds six large reaction choices (👍 ❤️ 😂 😮 😢 🙏) in a spacious 3 x 2 grid, physically separated from Delete for Me / Delete for Everyone to reduce tap errors. One account may hold one reaction per authoritative message; choosing another replaces only that account's entry and choosing the same reaction again removes it. Reactions are message metadata only and do not alter plaintext/ciphertext, E2EE, Outbox, receipts, notifications, attachments, PIN, deletion authority or the long-press lifecycle. `firebase.js` remains the sole Firebase owner and performs reaction changes in a Firestore transaction. Firestore rules allow a direct/group participant to modify only that participant's reaction-map key and only to the six approved values; group join-time source-read boundaries remain enforced, so grant-only historical copies gain no reaction write path. Direct and group Firestore emulator reaction matrices passed before publication. Runtime/cache advance 1.1.42 -> 1.1.43 / `1.1.43-message-reactions`. Root `mr.txt` is the controlled Firestore-rules deployment handoff. Device acceptance remains required before TODO item 1 is closed.\n\n'''
for path in ['README.md','hermes-memory.txt','CURRENT-REBUILD.md','FIDUNIO-BUILD-CHECKLIST.md']:
    prepend(path,note)

accept='''## FDA-REACTION-001 — FIDUNIO 1.1.43 message reactions\n\n**Status: REPOSITORY CANDIDATE — RULES DEPLOYMENT + DEVICE ACCEPTANCE REQUIRED.**\n\nAcceptance: deploy `mr.txt`; direct chat on iPhone/iPad must add, replace, remove and cross-device-sync reactions for incoming and outgoing messages; group chat must do the same for at least two members; verify the spacious 3 x 2 reaction grid and separation from destructive actions prevent accidental delete taps; verify Delete for Me and sender-only Delete for Everyone still behave exactly as before; verify normal text send, Sent/Read receipts and notification routing regress unchanged. Grant-only earlier-history copies must not gain a reaction write path. Close only after repeated real-device pass.\n\n'''
prepend('DEVICE-ACCEPTANCE-BUGS.md',accept)
old='1. **Emoticons on messages** — the existing text/E2EE path is Unicode-capable, so native-keyboard emoji entry should require verification rather than a data-format change. A built-in composer picker is a separate small UI feature; per-message reactions are a larger data/synchronization feature. Confirm the intended scope before implementation.'
new='1. **Message emoji reactions — IMPLEMENTED IN 1.1.43; RULES DEPLOYMENT + DEVICE ACCEPTANCE PENDING** — no composer emoji picker is added because the native keyboard already provides emoji entry. Press-and-hold continues to use the existing single Message actions owner. The action sheet adds six large reactions (👍 ❤️ 😂 😮 😢 🙏) in a spacious 3 x 2 section separated from delete actions. One account has at most one reaction per authoritative message; selecting another replaces only that account reaction and selecting the same one again removes it. Reactions sync as bounded message metadata through the central Firebase owner. Firestore rules permit only the authenticated participant\'s own reaction-map entry and only the approved values; ciphertext/content/receipt fields and other users\' reactions cannot be changed. Group join-time history remains enforced and grant-only history copies are non-reactable. Run `mr.txt`, then complete FDA-REACTION-001 direct/group iPhone/iPad acceptance before closing.'
edit('TODO.md',old,new)
s=read('README.md')
if '- Current checkpoint version: **0.9.9.13**' in s: s=s.replace('- Current checkpoint version: **0.9.9.13**','- Current checkpoint version: **1.1.43**',1)
write('README.md',s)
