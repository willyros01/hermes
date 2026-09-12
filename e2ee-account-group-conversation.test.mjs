import fs from "node:fs";
import {mergeGroupHistoryProjection} from "./e2ee-account-group-history-projection.js";
const src=fs.readFileSync(new URL("./e2ee-account-group-conversation.js",import.meta.url),"utf8");
const firebaseSrc=fs.readFileSync(new URL("./firebase.js",import.meta.url),"utf8");
const rulesSrc=fs.readFileSync(new URL("./firestore.rules",import.meta.url),"utf8");
const required=[
  'readCloudGroupAuthority',
  'subscribeCloudGroupMessages',
  'subscribeCloudGroupReceipts',
  'updateCloudGroupReceipt',
  'decryptAccountGroupMessage',
  'loadAccountGroupGrantedHistory',
  'mergeGroupHistoryProjection',
  'memberUids=a.memberUids||[]',
  'recipients.every(uid=>states.get(uid)==="read")',
  '["delivered","read"].includes(states.get(uid))',
  'decryptAvailable&&row.senderUid!==id.uid',
  'isOpen()?"read":"delivered"',
  'disappearAfterSeconds:row.disappearAfterSeconds??null',
  'await onRows?.(merged,meta)',
  'meta.fromCache===true'
];
for(const token of required)if(!src.includes(token))throw new Error(`group conversation owner missing ${token}`);
for(const forbidden of ['initializeApp(','getFirestore(','firebase-config','senderDeviceId','recipientDeviceId'])if(src.includes(forbidden))throw new Error(`group conversation owner crosses authority boundary: ${forbidden}`);
for(const token of ['readCloudGroupMessageAccess','"members",uid','historyFrom','canReadEarlier','where("createdAt",">=",access.historyFrom)'])if(!firebaseSrc.includes(token))throw new Error(`group join-time Firebase boundary missing ${token}`);
for(const token of ['groupMessageReadable(groupId,d)','d.createdAt>=groupMemberDoc(groupId,request.auth.uid).data.historyFrom','request.auth.uid in resource.data.envelopes','canReadGroupMessage(groupId,messageId)'])if(!rulesSrc.includes(token))throw new Error(`group join-time rules boundary missing ${token}`);

const t0=new Date("2026-09-06T10:00:00Z"),t1=new Date("2026-09-06T11:00:00Z"),t2=new Date("2026-09-06T12:00:00Z");
const projected=mergeGroupHistoryProjection([
  {id:"m2",text:"[Encrypted group message — account encryption unavailable]",createdAt:t1,decryptAvailable:false,senderUid:"older"},
  {id:"m3",text:"current",createdAt:t2,decryptAvailable:true,senderUid:"current"}
],[
  {id:"m1",text:"grant-only",createdAt:t0,historyGrantId:"g1"},
  {id:"m2",text:"granted replacement",createdAt:t1,historyGrantId:"g1"},
  {id:"m3",text:"must not replace live decrypt",createdAt:t2,historyGrantId:"g1"}
]);
if(projected.map(x=>x.id).join(",")!=="m1,m2,m3")throw new Error("history projection is not chronologically deterministic");
if(projected[0].authoritativeSource!==false)throw new Error("grant-only history incorrectly became source authority");
if(projected[1].text!=="granted replacement"||projected[1].granted!==true||projected[1].authoritativeSource!==true)throw new Error("grant did not preserve retained source authority while replacing undecryptable body");
if(projected[2].text!=="current"||projected[2].granted||projected[2].authoritativeSource!==true)throw new Error("grant incorrectly overrode ordinary decryptable history");
if(projected.filter(x=>x.id==="m2").length!==1)throw new Error("history projection duplicated a source message");
if(projected.some(x=>"decryptAvailable" in x))throw new Error("internal decrypt marker leaked into app projection");
console.log("Account group conversation receipt/history projection owner gate passed");
