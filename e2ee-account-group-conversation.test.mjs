import fs from "node:fs";
const src=fs.readFileSync(new URL("./e2ee-account-group-conversation.js",import.meta.url),"utf8");
const required=[
  'readCloudGroupAuthority',
  'subscribeCloudGroupMessages',
  'subscribeCloudGroupReceipts',
  'updateCloudGroupReceipt',
  'decryptAccountGroupMessage',
  'memberUids=a.memberUids||[]',
  'recipients.every(uid=>states.get(uid)==="read")',
  '["delivered","read"].includes(states.get(uid))',
  'isOpen()?"read":"delivered"'
];
for(const token of required)if(!src.includes(token))throw new Error(`group conversation owner missing ${token}`);
for(const forbidden of ['initializeApp(','getFirestore(','firebase-config','senderDeviceId','recipientDeviceId'])if(src.includes(forbidden))throw new Error(`group conversation owner crosses authority boundary: ${forbidden}`);
console.log("Account group conversation receipt owner gate passed");
