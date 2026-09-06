import {getAccountE2EERuntimeIdentity} from "./e2ee-account-runtime.js";
import {decryptAccountGroupMessage,loadAccountGroupGrantedHistory} from "./e2ee-account-group-service.js";
import {readCloudGroupAuthority,subscribeCloudGroupMessages,updateCloudGroupReceipt,subscribeCloudGroupReceipts} from "./firebase.js";

// Read-side group messaging owner. app.js supplies a bounded projection callback;
// this module owns Firebase group message/receipt subscriptions, ordinary group
// decryption, and projection of separately granted earlier-history plaintext.
const streams=new Map();

function needIdentity(){const id=getAccountE2EERuntimeIdentity();if(!id?.uid||!id?.keyId||!id?.privateKey)throw new Error("Account E2EE identity must be unlocked before group messaging.");return id;}
function asDate(v){const d=v instanceof Date?v:v?.toDate?.()||new Date(v);return d instanceof Date&&!Number.isNaN(d.getTime())?d:null;}
function aggregateReceipt(row,receipts,myUid,memberUids){
  if(row.senderUid!==myUid)return row.state||"sent";
  const recipients=(memberUids||[]).filter(uid=>uid!==myUid);
  if(!recipients.length)return row.state||"sent";
  const states=new Map((receipts||[]).map(r=>[r.uid,r.state]));
  if(recipients.every(uid=>states.get(uid)==="read"))return "read";
  if(recipients.every(uid=>["delivered","read"].includes(states.get(uid))))return "delivered";
  return "sent";
}

export function subscribeAccountGroupConversation(groupId,{onRows,onError,isOpen=()=>false}={}){
  const id=needIdentity(),key=String(groupId);stopAccountGroupConversation(key);
  const receiptStops=new Map(),receiptRows=new Map();
  let rawRows=[],memberUids=[],closed=false,delivery=Promise.resolve();
  const emit=async()=>{
    const live=[];
    for(const row of rawRows){
      let text="[Encrypted group message — account encryption unavailable]",decryptAvailable=false;
      try{text=await decryptAccountGroupMessage({groupId:key,messageId:row.id,row});decryptAvailable=true;}catch(err){onError?.(err);}
      live.push({id:row.id,mine:row.senderUid===id.uid,senderUid:row.senderUid,text,time:row.timeLabel||"",state:aggregateReceipt(row,receiptRows.get(row.id),id.uid,memberUids),cloud:true,e2ee:4,keyEpoch:row.keyEpoch,createdAt:asDate(row.createdAt),decryptAvailable});
      // A member must not create normal-message receipts for ciphertext they
      // cannot decrypt. Explicit history-grant copies have their own authority
      // and are projected below without retroactive receipt mutation.
      if(decryptAvailable&&row.senderUid!==id.uid){
        try{await updateCloudGroupReceipt(key,row.id,isOpen()?"read":"delivered");}catch(err){onError?.(err);}
      }
    }

    let granted=[];
    try{granted=await loadAccountGroupGrantedHistory(key);}catch(err){onError?.(err);}
    const grantsById=new Map((granted||[]).map(row=>[String(row.id),row]));
    const merged=[];
    for(const row of live){
      const grant=grantsById.get(String(row.id));
      if(grant&&!row.decryptAvailable){
        merged.push({...row,text:grant.text,createdAt:asDate(grant.createdAt)||row.createdAt,granted:true,historyGrantId:grant.historyGrantId});
        grantsById.delete(String(row.id));
      }else{
        merged.push(row);
        grantsById.delete(String(row.id));
      }
    }
    for(const grant of grantsById.values())merged.push({id:grant.id,mine:false,senderUid:null,text:grant.text,time:"",state:"sent",cloud:true,e2ee:4,keyEpoch:null,createdAt:asDate(grant.createdAt),decryptAvailable:true,granted:true,historyGrantId:grant.historyGrantId});
    merged.sort((a,b)=>{const at=a.createdAt?.getTime?.()??Number.MAX_SAFE_INTEGER,bt=b.createdAt?.getTime?.()??Number.MAX_SAFE_INTEGER;return at-bt||String(a.id).localeCompare(String(b.id));});
    for(const row of merged)delete row.decryptAvailable;
    if(!closed)onRows?.(merged);
  };
  readCloudGroupAuthority(key).then(a=>{memberUids=a.memberUids||[];delivery=delivery.then(emit,emit);}).catch(onError);
  const unsub=subscribeCloudGroupMessages(key,(rows)=>{
    rawRows=rows||[];
    for(const row of rawRows){
      if(row.senderUid===id.uid&&!receiptStops.has(row.id))receiptStops.set(row.id,subscribeCloudGroupReceipts(key,row.id,rs=>{receiptRows.set(row.id,rs||[]);delivery=delivery.then(emit,emit);},onError));
    }
    for(const [messageId,stop] of [...receiptStops])if(!rawRows.some(r=>r.id===messageId)){try{stop();}catch{}receiptStops.delete(messageId);receiptRows.delete(messageId);}
    delivery=delivery.then(emit,emit);
  },onError);
  streams.set(key,()=>{closed=true;try{unsub();}catch{}for(const stop of receiptStops.values())try{stop();}catch{}receiptStops.clear();receiptRows.clear();});
  return()=>stopAccountGroupConversation(key);
}

export function stopAccountGroupConversation(groupId){const key=String(groupId),stop=streams.get(key);if(stop){streams.delete(key);stop();}}
export function resetAccountGroupConversationStreams(){for(const key of [...streams.keys()])stopAccountGroupConversation(key);}
