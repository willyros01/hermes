from pathlib import Path

def replace_once(path,old,new):
    p=Path(path);s=p.read_text()
    if s.count(old)!=1:raise AssertionError(f'{path}: anchor count {s.count(old)}')
    p.write_text(s.replace(old,new,1))

replace_once('firestore-account-message-v3.rules.test.mjs',
'''await test("15d recipient cannot mutate disappearing duration",()=>assertFails(updateDoc(doc(dbB,"conversations","dm-v3","messages","m15d"),{state:"read",readAt:serverTimestamp(),disappearAfterSeconds:7200})));''',
'''await test("15d recipient cannot mutate disappearing duration",()=>assertFails(updateDoc(doc(dbB,"conversations","dm-v3","messages","m15d"),{state:"read",readAt:serverTimestamp(),disappearAfterSeconds:7200})));
await test("15e activation marker with duration allowed",()=>assertSucceeds(setDoc(doc(dbA,"conversations","dm-v3","messages","m15e"),{...v3(A,keyA,keyB),disappearAfterSeconds:300,disappearingPurgeVersion:1})));
await test("15f activation marker without duration denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m15f"),{...v3(A,keyA,keyB),disappearingPurgeVersion:1})));
await test("15g unknown activation marker version denied",()=>assertFails(setDoc(doc(dbA,"conversations","dm-v3","messages","m15g"),{...v3(A,keyA,keyB),disappearAfterSeconds:300,disappearingPurgeVersion:2})));
await test("15h recipient receipt transition preserves activation metadata",()=>assertSucceeds(updateDoc(doc(dbB,"conversations","dm-v3","messages","m15e"),{state:"delivered"})));''')

replace_once('firestore-group-e2ee-v1.rules.test.mjs',
'''await test("09c non-integer disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-float"),msg({disappearAfterSeconds:1.5}))));''',
'''await test("09c non-integer disappearing duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-float"),msg({disappearAfterSeconds:1.5}))));
await test("09d activation marker with duration allowed",()=>assertSucceeds(setDoc(doc(dbA,"groups","g1","messages","m-disappear-active"),msg({disappearAfterSeconds:300,disappearingPurgeVersion:1}))));
await test("09e activation marker without duration denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-no-duration"),msg({disappearingPurgeVersion:1}))));
await test("09f unknown activation marker version denied",()=>assertFails(setDoc(doc(dbA,"groups","g1","messages","m-disappear-wrong-version"),msg({disappearAfterSeconds:300,disappearingPurgeVersion:2}))));''')
print('disappearing rules gate patch prepared')
