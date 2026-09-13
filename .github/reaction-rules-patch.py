from pathlib import Path

def edit(path, old, new, count=1):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f"missing anchor: {path}: {old[:90]}")
    p.write_text(s.replace(old,new,count))

helpers='''    function validReactionValue(value){return value in ["👍","❤️","😂","😮","😢","🙏"];}
    function validReactionUpdate(d,old){return ("reactions" in d)&&d.reactions is map&&d.reactions.size()<=64&&((!("reactions" in old)&&d.reactions.keys().hasOnly([request.auth.uid]))||(("reactions" in old)&&old.reactions is map&&d.reactions.diff(old.reactions).affectedKeys().hasOnly([request.auth.uid])))&&(!(request.auth.uid in d.reactions)||validReactionValue(d.reactions[request.auth.uid]));}
    function validDirectReactionUpdate(id,d,old){return request.auth.uid in conversationDoc(id).data.members&&d.diff(old).affectedKeys().hasOnly(["reactions"])&&validReactionUpdate(d,old);}
'''
edit('firestore.rules','    function validDirectReceiptUpdate(id,d,old){',helpers+'    function validDirectReceiptUpdate(id,d,old){')
edit('firestore.rules','    function validGroupReceiptParentUpdate(groupId,messageId,d,old){return d.receiptRevision is int&&d.receiptRevision==old.receiptRevision+1&&d.diff(old).affectedKeys().hasOnly(["receiptRevision"]);}','    function validGroupReceiptParentUpdate(groupId,messageId,d,old){return d.receiptRevision is int&&d.receiptRevision==old.receiptRevision+1&&d.diff(old).affectedKeys().hasOnly(["receiptRevision"]);}\n    function validGroupReactionUpdate(groupId,d,old){return groupMessageReadable(groupId,old)&&d.diff(old).affectedKeys().hasOnly(["reactions"])&&validReactionUpdate(d,old);}')
edit('firestore.rules','allow update: if conversationWritable(conversationId)&&validDirectReceiptUpdate(conversationId,request.resource.data,resource.data);','allow update: if conversationWritable(conversationId)&&(validDirectReceiptUpdate(conversationId,request.resource.data,resource.data)||validDirectReactionUpdate(conversationId,request.resource.data,resource.data));')
edit('firestore.rules','allow update: if groupMessageReadable(groupId,resource.data)&&validGroupReceiptParentUpdate(groupId,messageId,request.resource.data,resource.data)&&groupWritable(groupId);','allow update: if groupMessageReadable(groupId,resource.data)&&(validGroupReceiptParentUpdate(groupId,messageId,request.resource.data,resource.data)||validGroupReactionUpdate(groupId,request.resource.data,resource.data))&&groupWritable(groupId);')

direct='''await test("25 participant can add own reaction",()=>assertSucceeds(updateDoc(doc(dbA,"conversations","dm-v3","messages","m02"),{reactions:{[A]:"👍"}})));
await test("26 second participant can add own reaction",()=>assertSucceeds(updateDoc(doc(dbB,"conversations","dm-v3","messages","m02"),{reactions:{[A]:"👍",[B]:"❤️"}})));
await test("27 cannot overwrite another direct reaction",()=>assertFails(updateDoc(doc(dbB,"conversations","dm-v3","messages","m02"),{reactions:{[A]:"😂",[B]:"❤️"}})));
await test("28 unsupported direct reaction denied",()=>assertFails(updateDoc(doc(dbA,"conversations","dm-v3","messages","m02"),{reactions:{[A]:"🔥",[B]:"❤️"}})));
await test("29 outsider direct reaction denied",()=>assertFails(updateDoc(doc(dbC,"conversations","dm-v3","messages","m02"),{reactions:{[A]:"👍",[B]:"❤️",[C]:"😂"}})));
await test("30 direct reaction cannot mutate ciphertext",()=>assertFails(updateDoc(doc(dbA,"conversations","dm-v3","messages","m02"),{reactions:{[A]:"😂",[B]:"❤️"},ciphertext:"BBBBBBBBBBBBBBBBBBBBBB"})));
await test("31 participant can remove own direct reaction",()=>assertSucceeds(updateDoc(doc(dbA,"conversations","dm-v3","messages","m02"),{reactions:{[B]:"❤️"}})));

'''
edit('firestore-account-message-v3.rules.test.mjs','const failed=results.filter(([,ok])=>!ok);',direct+'const failed=results.filter(([,ok])=>!ok);')

edit('firestore-group-e2ee-v1.rules.test.mjs','import { collection,doc,getDoc,getDocs,orderBy,query,setDoc,serverTimestamp,where,writeBatch,deleteDoc } from "firebase/firestore";','import { collection,doc,getDoc,getDocs,orderBy,query,setDoc,updateDoc,serverTimestamp,where,writeBatch,deleteDoc } from "firebase/firestore";')
group='''await test("18a group sender can add own reaction",()=>assertSucceeds(updateDoc(doc(dbA,"groups","g1","messages","m1"),{reactions:{[A]:"👍"}})));
await test("18b group member can add own reaction",()=>assertSucceeds(updateDoc(doc(dbB,"groups","g1","messages","m1"),{reactions:{[A]:"👍",[B]:"❤️"}})));
await test("18c cannot overwrite another group reaction",()=>assertFails(updateDoc(doc(dbB,"groups","g1","messages","m1"),{reactions:{[A]:"😂",[B]:"❤️"}})));
await test("18d unsupported group reaction denied",()=>assertFails(updateDoc(doc(dbB,"groups","g1","messages","m1"),{reactions:{[A]:"👍",[B]:"🔥"}})));
await test("18e outsider group reaction denied",()=>assertFails(updateDoc(doc(dbO,"groups","g1","messages","m1"),{reactions:{[A]:"👍",[B]:"❤️",[OUT]:"😂"}})));
await test("18f group reaction cannot mutate ciphertext",()=>assertFails(updateDoc(doc(dbB,"groups","g1","messages","m1"),{reactions:{[A]:"👍",[B]:"😂"},ciphertext:"BBBBBBBBBBBBBBBBBBBBBB"})));

'''
edit('firestore-group-e2ee-v1.rules.test.mjs','await test("19 membership change without matching epoch denied"',group+'await test("19 membership change without matching epoch denied"')
