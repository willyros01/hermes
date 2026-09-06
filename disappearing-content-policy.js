// Pure disappearing-content policy owner. No Firebase, DOM, crypto, storage or timers.
// Server-backed receipt timestamps are inputs; device clocks are evaluation hints only.

export const DISAPPEARING_POLICY_VERSION=1;

function finiteMillis(value){
  if(value==null)return null;
  if(value instanceof Date)return Number.isFinite(value.getTime())?value.getTime():null;
  if(typeof value?.toMillis==="function"){const n=value.toMillis();return Number.isFinite(n)?n:null;}
  const n=Number(value);return Number.isFinite(n)?n:null;
}

export function normalizeDisappearDurationSeconds(value){
  const n=Number(value);
  if(!Number.isInteger(n)||n<=0||n>31536000)throw new Error("Disappearing duration must be 1..31536000 seconds.");
  return n;
}

export function recipientExpiryAt(readAt,durationSeconds){
  const readMillis=finiteMillis(readAt);
  if(readMillis==null)return null;
  return new Date(readMillis+normalizeDisappearDurationSeconds(durationSeconds)*1000);
}

export function recipientHasExpired({readAt,durationSeconds,now}){
  const expiry=recipientExpiryAt(readAt,durationSeconds),nowMillis=finiteMillis(now);
  if(!expiry||nowMillis==null)return false;
  return nowMillis>=expiry.getTime();
}

// A shared group source is purge-eligible only when every still-authorized
// recipient has an authoritative first-read timestamp and every resulting
// fixed window has elapsed. Unread recipients deliberately keep the source.
export function groupSourcePurgeEligible({recipientUids,receipts,durationSeconds,now}){
  const recipients=[...new Set((recipientUids||[]).map(String).filter(Boolean))];
  if(!recipients.length)return true;
  const byUid=new Map((receipts||[]).map(row=>[String(row?.uid||""),row]));
  return recipients.every(uid=>{
    const row=byUid.get(uid);
    return row?.state==="read"&&row?.readAt!=null&&recipientHasExpired({readAt:row.readAt,durationSeconds,now});
  });
}

export function firstReadReceiptMutation(existing,state){
  if(!["delivered","read"].includes(state))throw new Error("Receipt state must be delivered or read.");
  const current=existing&&typeof existing==="object"?existing:null;
  if(current?.state==="read")return{kind:"noop",preserveReadAt:true};
  if(state==="delivered"&&current?.state==="delivered")return{kind:"noop",preserveReadAt:false};
  return{kind:current?"update":"create",state,setReadAt:state==="read",preserveReadAt:false};
}
