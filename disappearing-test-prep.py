from pathlib import Path

p=Path('disappearing-compose-policy.test.mjs')
s=p.read_text()
old="'Disappearing:'"
new="'Disappearing text:'"
if s.count(old)!=1:
    raise AssertionError('disappearing compose label assertion changed')
p.write_text(s.replace(old,new,1))

p=Path('direct-message-basic-path.test.mjs')
s=p.read_text()
old='assert.match(app,/prepareAccountDirectMessage\\(\\{uid:firebaseUser\\.uid,peerUid,conversationId:payload\\.conversationId,messageId:payload\\.messageId,text:payload\\.text\\}\\)/,"the Outbox owner must prepare one account-encrypted envelope");'
new='assert.match(app,/prepareAccountDirectMessage\\(\\{uid:firebaseUser\\.uid,peerUid,conversationId:payload\\.conversationId,messageId:payload\\.messageId,text:payload\\.text,disappearingPurgeVersion:payload\\.disappearingPurgeVersion\\?\\?null\\}\\)/,"the Outbox owner must prepare one account-encrypted envelope while carrying only outer disappearing activation metadata");'
if s.count(old)!=1:
    raise AssertionError('direct-message prepare assertion changed')
s=s.replace(old,new,1)
old_rev='SHELL_REVISION="0\\.9\\.9\\.11-audio-mime-normalization"'
new_rev='SHELL_REVISION="0\\.9\\.9\\.12-disappearing-text-activation"'
if old_rev in s:
    s=s.replace(old_rev,new_rev,1)
p.write_text(s)
