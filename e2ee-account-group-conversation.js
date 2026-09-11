import {getAccountE2EERuntimeIdentity} from "./e2ee-account-runtime.js";
import {decryptAccountGroupMessage,loadAccountGroupGrantedHistory} from "./e2ee-account-group-service.js";
import {mergeGroupHistoryProjection} from "./e2ee-account-group-history-projection.js";
import {readCloudGroupAuthority,getCloudGroupMessageFromServer,subscribeCloudGroupMessages,updateCloudGroupReceipt,subscribeCloudGroupReceipts} from "./firebase.js";

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
  const priorityReads=new Map();
  let rawRows=[],memberUids=[],closed=false,pendingSnapshot=null,running=null;
  const emit=async(rows,meta)=>{
    const live=[],receiptUpdates=[];
    for(const row of rows){
      let text="[Encrypted group message — account encryption unavailable]",decryptAvailable=false;
      try{text=await decryptAccountGroupMessage({groupId:key,messageId:row.id,row});decryptAvailable=true;}catch(err){onError?.(err);}
      live.push({id:row.id,mine:row.senderUid===id.uid,senderUid:row.senderUid,text,time:row.timeLabel||"",state:aggregateReceipt(row,receiptRows.get(row.id),id.uid,memberUids),cloud:true,e2ee:4,keyEpoch:row.keyEpoch,createdAt:asDate(row.createdAt),disappearAfterSeconds:row.disappearAfterSeconds??null,decryptAvailable});
      if(decryptAvailable&&row.senderUid!==id.uid)receiptUpdates.push(row.id);
    }

    let granted=[];
    if(meta?.partial!==true)try{granted=await loadAccountGroupGrantedHistory(key);}catch(err){onError?.(err);}
    const merged=mergeGroupHistoryProjection(live,granted);
    if(!closed)await onRows?.(merged,meta);
    if(meta?.partial!==true)for(const messageId of receiptUpdates){try{await updateCloudGroupReceipt(key,messageId,isOpen()?"read":"delivered");}catch(err){onError?.(err);}}
  };
  const authorityReady=readCloudGroupAuthority(key).then(a=>{memberUids=a.memberUids||[];});
  const priorities=new Map();
  const start=()=>{
    if(closed||running)return running;
    running=(async()=>{
      try{await authorityReady;}catch(error){for(const item of priorities.values())for(const waiter of item.waiters)waiter.reject(error);priorities.clear();throw error;}
      while(!closed){
        const priority=priorities.values().next().value;
        if(priority){priorities.delete(priority.messageId);try{await emit(priority.rows,priority.meta);for(const waiter of priority.waiters)waiter.resolve(true);}catch(error){for(const waiter of priority.waiters)waiter.reject(error);onError?.(error);}continue;}
        if(!pendingSnapshot)break;
        const snapshot=pendingSnapshot;pendingSnapshot=null;
        try{await emit(snapshot.rows,snapshot.meta);}catch(error){onError?.(error);}
      }
    })().catch(error=>onError?.(error)).finally(()=>{running=null;if(!closed&&(priorities.size||pendingSnapshot))start();});
    return running;
  };
  const offerSnapshot=(rows,meta={})=>{pendingSnapshot={rows,meta};start();};
  const offerPriority=(messageId,row)=>new Promise((resolve,reject)=>{const item=priorities.get(messageId)||{messageId,rows:[row],meta:{fromCache:false,hasPendingWrites:false,partial:true,priorityMessageId:messageId},waiters:[]};item.rows=[row];item.waiters.push({resolve,reject});priorities.set(messageId,item);start();});
  const unsub=subscribeCloudGroupMessages(key,(rows,meta={})=>{
    rawRows=rows||[];const snapshotMeta={fromCache:meta.fromCache===true,hasPendingWrites:meta.hasPendingWrites===true};
    for(const row of rawRows){
      if(row.senderUid===id.uid&&!receiptStops.has(row.id))receiptStops.set(row.id,subscribeCloudGroupReceipts(key,row.id,rs=>{receiptRows.set(row.id,rs||[]);offerSnapshot(rawRows,snapshotMeta);},onError));
    }
    for(const [messageId,stop] of [...receiptStops])if(!rawRows.some(r=>r.id===messageId)){try{stop();}catch{}receiptStops.delete(messageId);receiptRows.delete(messageId);}
    offerSnapshot(rawRows,snapshotMeta);
  },onError);
  streams.set(key,{async prioritize(messageId){const mid=String(messageId||"");if(!mid)throw new Error("Group notification message ID is required.");if(priorityReads.has(mid))return priorityReads.get(mid);const operation=getCloudGroupMessageFromServer(key,id.uid,mid).then(row=>offerPriority(mid,row)).finally(()=>priorityReads.delete(mid));priorityReads.set(mid,operation);return operation;},stop(){closed=true;pendingSnapshot=null;for(const item of priorities.values())for(const waiter of item.waiters)waiter.reject(new Error("Group message delivery owner closed."));priorities.clear();priorityReads.clear();try{unsub();}catch{}for(const stop of receiptStops.values())try{stop();}catch{}receiptStops.clear();receiptRows.clear();}});
  return()=>stopAccountGroupConversation(key);
}

export function prioritizeAccountGroupConversationMessage(groupId,messageId){const stream=streams.get(String(groupId));if(!stream)throw new Error("Group message delivery owner is not active.");return stream.prioritize(messageId);}
export function stopAccountGroupConversation(groupId){const key=String(groupId),stream=streams.get(key);if(stream){streams.delete(key);stream.stop();}}
export function resetAccountGroupConversationStreams(){for(const key of [...streams.keys()])stopAccountGroupConversation(key);}
