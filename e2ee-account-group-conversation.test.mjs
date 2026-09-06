import fs from "node:fs";
const src=fs.readFileSync(new URL("./e2ee-account-group-conversation.js",import.meta.url),"utf8");
const required=[
  'readCloudGroupAuthority',
  'subscribeCloudGroupMessages',
  'subscribeCloudGroupReceipts',
  'updateCloudGroupReceipt',
  'decryptAccountGroupMessage',
  'loadAccountGroupGrantedHistory',
  'memberUids=a.memberUids||[]',
  'recipients.every(uid=>states.get(uid)==="read")',
  '["delivered","read"].includes(states.get(uid))',
  'decryptAvailable&&row.senderUid!==id.uid',
  'grantsById=new Map',
  'historyGrantId:grant.historyGrantId',
  'merged.sort',
  'isOpen()?"read":"delivered"'
];
for(const token of required)if(!src.includes(token))throw new Error(`group conversation owner missing ${token}`);
for(const forbidden of ['initializeApp(','getFirestore(','firebase-config','senderDeviceId','recipientDeviceId'])if(src.includes(forbidden))throw new Error(`group conversation owner crosses authority boundary: ${forbidden}`);
if(src.includes('updateCloudGroupReceipt(key,row.id,isOpen()?"read":"delivered")')&&!src.includes('decryptAvailable&&row.senderUid!==id.uid'))throw new Error('undecryptable historical ciphertext can still receive normal receipts');
console.log("Account group conversation receipt/history projection owner gate passed");
