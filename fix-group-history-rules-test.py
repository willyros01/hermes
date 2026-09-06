from pathlib import Path
p=Path('firestore-group-e2ee-v1.rules.test.mjs')
s=p.read_text()
s=s.replace('const keyA="group-key-ownerA-0001",keyB="group-key-memberB-0001";','const keyA="group-key-ownerA-0001",keyB="group-key-memberB-0001";let m1CreatedAt=null;')
s=s.replace('firstSharedAt:new Date("2026-09-06T12:00:00Z")','firstSharedAt:m1CreatedAt')
s=s.replace('sourceCreatedAt:new Date("2026-09-06T12:00:00Z")','sourceCreatedAt:m1CreatedAt')
s=s.replace('await test("08 valid encrypted group message succeeds",()=>assertSucceeds(setDoc(doc(dbA,"groups","g1","messages","m1"),msg({createdAt:new Date("2026-09-06T12:00:00Z")}))));','await test("08 valid encrypted group message succeeds",async()=>{await assertSucceeds(setDoc(doc(dbA,"groups","g1","messages","m1"),msg()));m1CreatedAt=(await getDoc(doc(dbA,"groups","g1","messages","m1"))).data().createdAt;});')
restore='''await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();const g=await getDoc(doc(db,"groups","g1"));await setDoc(doc(db,"groups","g1"),{...g.data(),memberUids:[A,B],adminUids:[A],updatedAt:new Date()});await setDoc(doc(db,"groups","g1","members",B),{uid:B,displayName:B,role:"member",joinedAt:new Date(),historyFrom:new Date(),addedByUid:A,active:true});});\n'''
anchor='await test("18 removed member cannot read new epoch",()=>assertFails(getDoc(doc(dbB,"groups","g1","epochs","2"))));\n\n'
if restore not in s:
    if anchor not in s: raise SystemExit('history restore anchor missing')
    s=s.replace(anchor,anchor+restore,1)
s=s.replace('boundaryAt:new Date("2026-09-06T12:01:00Z")','boundaryAt:new Date(m1CreatedAt.toMillis()+60000)')
p.write_text(s)
