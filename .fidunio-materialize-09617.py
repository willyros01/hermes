from pathlib import Path

def read(path): return Path(path).read_text()
def write(path,s): Path(path).write_text(s)
def replace_once(path,old,new):
    s=read(path)
    if old not in s: raise SystemExit(f"Missing expected anchor in {path}: {old[:180]!r}")
    write(path,s.replace(old,new,1))

replace_once('firebase.js',
'if(existing.exists()){const x=existing.data(),same=x.status==="building"&&x.grantorUid===grant.grantorUid&&x.targetUid===grant.targetUid&&x.boundaryKind===grant.boundaryKind&&Number(x.totalCopies)===Number(grant.totalCopies)&&x.firstSharedMessageId===grant.firstSharedMessageId;if(!same)throw new Error("History grant ID already exists with different authority.");return{grantId,status:x.status};}tx.set(grantRef,{...grant,createdAt:s.fsSdk.serverTimestamp(),activatedAt:null});return{grantId,status:"building"};});}',
'if(existing.exists()){const x=existing.data(),same=x.status==="building"&&x.grantorUid===grant.grantorUid&&x.targetUid===grant.targetUid&&x.boundaryKind===grant.boundaryKind&&Number(x.totalCopies)===Number(grant.totalCopies)&&x.firstSharedMessageId===grant.firstSharedMessageId;if(!same)throw new Error("History grant ID already exists with different authority.");return{grantId,status:x.status};}const now=s.fsSdk.serverTimestamp();tx.update(groupRef,{updatedAt:now});tx.set(grantRef,{...grant,createdAt:now,activatedAt:null});return{grantId,status:"building"};});}')

replace_once('firestore.rules',
'    function validHistoryBoundary(groupId,d){return (d.boundaryKind=="beginning"&&d.boundaryAt==null)||(d.boundaryKind=="timestamp"&&d.boundaryAt is timestamp&&d.firstSharedAt>=d.boundaryAt);}\n    function validHistoryGrantCreate(groupId,grantId,d){',
'    function validHistoryBoundary(groupId,d){return (d.boundaryKind=="beginning"&&d.boundaryAt==null)||(d.boundaryKind=="timestamp"&&d.boundaryAt is timestamp&&d.firstSharedAt>=d.boundaryAt);}\n    function historyGrantBarrier(groupId){let before=groupDoc(groupId).data;let after=groupDocAfter(groupId).data;return after.updatedAt==request.time&&after.updatedAt!=before.updatedAt&&after.diff(before).affectedKeys().hasOnly(["updatedAt"]);}\n    function validHistoryGrantCreate(groupId,grantId,d){')
replace_once('firestore.rules',
'        allow create: if isGroupAdmin(groupId)&&validHistoryGrantCreate(groupId,grantId,request.resource.data);',
'        allow create: if isGroupAdmin(groupId)&&validHistoryGrantCreate(groupId,grantId,request.resource.data)&&historyGrantBarrier(groupId);')

replace_once('firestore-group-e2ee-v1.rules.test.mjs',
'await test("25 admin creates building beginning grant",()=>assertSucceeds(setDoc(doc(dbA,"groups","g1","historyGrants","hg1"),grant())));',
'await test("25a admin history grant without basis-visible group touch denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","historyGrants","hg-no-barrier"),grant("hg-no-barrier"))));\nawait test("25 admin creates building beginning grant with group barrier",async()=>{const b=writeBatch(dbA);b.update(doc(dbA,"groups","g1"),{updatedAt:serverTimestamp()});b.set(doc(dbA,"groups","g1","historyGrants","hg1"),grant());return assertSucceeds(b.commit());});')

print('0.9.6.17 history-grant purge barrier materialized')
