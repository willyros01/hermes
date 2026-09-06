// FIDUNIO disappearing-content purge Firestore repository.
// SERVER ONLY. Browser/app code must never import or instantiate this adapter.
// Firebase Admin Firestore is injected so this module does not become a second
// SDK initializer. Every physical delete is owned by this repository path.

import {planGroupHistoryGrantSourcePurge} from "./disappearing-group-grant-trace-plan.js";

function fail(code,message){const error=new Error(message);error.code=code;return error;}
function text(value,name){const out=String(value??"").trim();if(!out)throw fail("INVALID_INPUT",`${name} is required.`);return out;}
function dataOf(snap){return snap?.exists?snap.data():null;}
function stamp(snap){
  if(!snap?.exists)return "missing";
  const t=snap.updateTime;
  if(t&&Number.isFinite(Number(t.seconds))&&Number.isFinite(Number(t.nanoseconds)))return `${Number(t.seconds)}:${Number(t.nanoseconds)}`;
  if(t&&typeof t.toMillis==="function")return `ms:${t.toMillis()}`;
  throw fail("PURGE_VERSION_UNAVAILABLE","Authoritative Firestore update time is unavailable.");
}
function pathOf(snap,ref){return String(snap?.ref?.path||ref?.path||"");}
function basis(parts){return JSON.stringify(parts);}
function array(value){return Array.isArray(value)?value.map(x=>String(x||"").trim()).filter(Boolean):[];}
function sameBasis(actual,expected){if(actual!==String(expected??""))throw fail("STALE_PURGE_BASIS","Disappearing purge authority changed before commit.");}

function directBasis(conversationSnap,messageSnap){return basis([
  [pathOf(conversationSnap),stamp(conversationSnap)],
  [pathOf(messageSnap),stamp(messageSnap)]
]);}
function groupBasis(groupSnap,messageSnap,epochSnap,receiptSnaps,grantEntries=[]){
  const receiptVersions=[...(receiptSnaps||[])].map(s=>[pathOf(s),stamp(s)]).sort((a,b)=>a[0].localeCompare(b[0]));
  const grantVersions=[];
  for(const entry of grantEntries||[]){
    grantVersions.push([pathOf(entry.grantSnap),stamp(entry.grantSnap)]);
    for(const copySnap of entry.copySnaps||[])grantVersions.push([pathOf(copySnap),stamp(copySnap)]);
  }
  grantVersions.sort((a,b)=>a[0].localeCompare(b[0]));
  return basis([
    [pathOf(groupSnap),stamp(groupSnap)],
    [pathOf(messageSnap),stamp(messageSnap)],
    [pathOf(epochSnap),stamp(epochSnap)],
    receiptVersions,
    grantVersions
  ]);
}
function directRecipient(conversation,message){
  const members=array(conversation?.members),sender=String(message?.senderUid||"");
  if(conversation?.type!=="direct"||members.length!==2||!sender||!members.includes(sender))throw fail("PURGE_SOURCE_INVALID","Direct purge authority is malformed.");
  const recipient=members.find(uid=>uid!==sender);
  if(!recipient)throw fail("PURGE_SOURCE_INVALID","Direct purge recipient is unavailable.");
  return recipient;
}
function epochMembers(epoch){
  const keys=epoch?.memberKeyIds&&typeof epoch.memberKeyIds==="object"?Object.keys(epoch.memberKeyIds):[];
  if(!keys.length)throw fail("PURGE_SOURCE_INVALID","Source group epoch member authority is unavailable.");
  return keys.sort();
}
function grantRows(entries){return entries.map(entry=>({grant:{...entry.grantSnap.data()},copies:(entry.copySnaps||[]).map(s=>({...s.data()}))}));}

export function createDisappearingPurgeFirestoreAdminRepository({db}={}){
  if(!db||typeof db.doc!=="function"||typeof db.runTransaction!=="function")throw new Error("Admin Firestore database is required.");
  const directConversationRef=id=>db.doc(`conversations/${id}`);
  const directMessageRef=(cid,mid)=>db.doc(`conversations/${cid}/messages/${mid}`);
  const groupRef=id=>db.doc(`groups/${id}`);
  const groupMessageRef=(gid,mid)=>db.doc(`groups/${gid}/messages/${mid}`);
  const groupEpochRef=(gid,epoch)=>db.doc(`groups/${gid}/epochs/${epoch}`);
  const groupReceiptsRef=(gid,mid)=>db.doc(`groups/${gid}/messages/${mid}`).collection("receipts");
  const groupHistoryGrantsRef=gid=>db.doc(`groups/${gid}`).collection("historyGrants");

  async function readDirectPurgeState({conversationId,messageId}){
    const cid=text(conversationId,"Conversation ID"),mid=text(messageId,"Message ID");
    const cRef=directConversationRef(cid),mRef=directMessageRef(cid,mid);
    const [cSnap,mSnap]=await Promise.all([cRef.get(),mRef.get()]);
    const conversation=dataOf(cSnap),message=dataOf(mSnap);
    if(!conversation||!message)return null;
    return Object.freeze({basis:directBasis(cSnap,mSnap),recipientUid:directRecipient(conversation,message),message:{...message}});
  }

  async function commitDirectPurge({conversationId,messageId,expectedBasis}){
    const cid=text(conversationId,"Conversation ID"),mid=text(messageId,"Message ID"),expected=String(expectedBasis??"");
    if(!expected)throw fail("INVALID_INPUT","Expected purge basis is required.");
    const cRef=directConversationRef(cid),mRef=directMessageRef(cid,mid);
    return db.runTransaction(async tx=>{
      const [cSnap,mSnap]=await Promise.all([tx.get(cRef),tx.get(mRef)]);
      if(!mSnap?.exists)return{purged:true,alreadyAbsent:true,traceCount:0};
      if(!cSnap?.exists)throw fail("PURGE_SOURCE_INVALID","Direct conversation authority disappeared before purge.");
      sameBasis(directBasis(cSnap,mSnap),expected);
      directRecipient(cSnap.data(),mSnap.data());
      tx.delete(mRef);
      return{purged:true,alreadyAbsent:false,traceCount:1};
    });
  }

  async function readGroupGrantEntries(gid,getter=query=>query.get()){
    const grantsQuery=await getter(groupHistoryGrantsRef(gid));
    const entries=[];
    for(const grantSnap of grantsQuery?.docs||[]){
      const copiesQuery=await getter(grantSnap.ref.collection("messages"));
      entries.push({grantSnap,copySnaps:copiesQuery?.docs||[]});
    }
    entries.sort((a,b)=>a.grantSnap.ref.path.localeCompare(b.grantSnap.ref.path));
    return entries;
  }

  async function readGroupPurgeState({groupId,messageId}){
    const gid=text(groupId,"Group ID"),mid=text(messageId,"Message ID");
    const gRef=groupRef(gid),mRef=groupMessageRef(gid,mid);
    const [gSnap,mSnap]=await Promise.all([gRef.get(),mRef.get()]);
    const group=dataOf(gSnap),message=dataOf(mSnap);
    if(!group||!message)return null;
    const keyEpoch=Number(message.keyEpoch);
    if(!Number.isInteger(keyEpoch)||keyEpoch<1)throw fail("PURGE_SOURCE_INVALID","Group purge source epoch is invalid.");
    const eRef=groupEpochRef(gid,keyEpoch),rRef=groupReceiptsRef(gid,mid);
    const [eSnap,rQuery,grantEntries]=await Promise.all([eRef.get(),rRef.get(),readGroupGrantEntries(gid)]);
    const epoch=dataOf(eSnap);
    if(!epoch)throw fail("PURGE_SOURCE_INVALID","Source group epoch authority is unavailable.");
    const receipts=(rQuery?.docs||[]).map(s=>({...s.data()}));
    const grantTracePlan=planGroupHistoryGrantSourcePurge({groupId:gid,sourceMessageId:mid,grants:grantRows(grantEntries)});
    return Object.freeze({basis:groupBasis(gSnap,mSnap,eSnap,rQuery?.docs||[],grantEntries),message:{...message},epochMemberUids:epochMembers(epoch),currentMemberUids:array(group.memberUids),receipts,grantTracePlan});
  }

  async function commitGroupPurge({groupId,messageId,expectedBasis}){
    const gid=text(groupId,"Group ID"),mid=text(messageId,"Message ID"),expected=String(expectedBasis??"");
    if(!expected)throw fail("INVALID_INPUT","Expected purge basis is required.");
    const gRef=groupRef(gid),mRef=groupMessageRef(gid,mid),rRef=groupReceiptsRef(gid,mid);
    return db.runTransaction(async tx=>{
      // Firestore transactions require all reads before writes. Re-read every
      // basis-visible authority and every subordinate trace before planning any delete.
      const [gSnap,mSnap]=await Promise.all([tx.get(gRef),tx.get(mRef)]);
      if(!mSnap?.exists)return{purged:true,alreadyAbsent:true,traceCount:0};
      if(!gSnap?.exists)throw fail("PURGE_SOURCE_INVALID","Group authority disappeared before purge.");
      const message=mSnap.data(),keyEpoch=Number(message?.keyEpoch);
      if(!Number.isInteger(keyEpoch)||keyEpoch<1)throw fail("PURGE_SOURCE_INVALID","Group purge source epoch is invalid.");
      const eRef=groupEpochRef(gid,keyEpoch);
      const [eSnap,rQuery,grantEntries]=await Promise.all([
        tx.get(eRef),
        tx.get(rRef),
        readGroupGrantEntries(gid,query=>tx.get(query))
      ]);
      if(!eSnap?.exists)throw fail("PURGE_SOURCE_INVALID","Source group epoch authority disappeared before purge.");
      epochMembers(eSnap.data());
      const actualBasis=groupBasis(gSnap,mSnap,eSnap,rQuery?.docs||[],grantEntries);
      sameBasis(actualBasis,expected);
      const plan=planGroupHistoryGrantSourcePurge({groupId:gid,sourceMessageId:mid,grants:grantRows(grantEntries)});
      const entriesByGrant=new Map(grantEntries.map(entry=>[String(entry.grantSnap.data()?.grantId||""),entry]));
      let traceCount=0;

      for(const receiptSnap of rQuery?.docs||[]){tx.delete(receiptSnap.ref);traceCount++;}
      for(const copy of plan.copiesToDelete){
        const entry=entriesByGrant.get(copy.grantId);
        const copySnap=entry?.copySnaps?.find(s=>String(s.data()?.sourceMessageId||"")===copy.sourceMessageId);
        if(!copySnap)throw fail("GRANT_TRACE_INCONSISTENT","Planned history copy disappeared before purge commit.");
        tx.delete(copySnap.ref);traceCount++;
      }
      for(const grantId of plan.grantsToDelete){
        const entry=entriesByGrant.get(grantId);
        if(!entry?.grantSnap?.exists)throw fail("GRANT_TRACE_INCONSISTENT","Planned history grant disappeared before purge commit.");
        tx.delete(entry.grantSnap.ref);traceCount++;
      }
      for(const update of plan.grantsToUpdate){
        const entry=entriesByGrant.get(update.grantId);
        if(!entry?.grantSnap?.exists)throw fail("GRANT_TRACE_INCONSISTENT","Planned history grant disappeared before purge commit.");
        tx.update(entry.grantSnap.ref,{totalCopies:update.totalCopies,firstSharedMessageId:update.firstSharedMessageId,firstSharedAt:update.firstSharedAt});traceCount++;
      }
      tx.delete(mRef);traceCount++;
      return{purged:true,alreadyAbsent:false,traceCount};
    });
  }

  return Object.freeze({readDirectPurgeState,commitDirectPurge,readGroupPurgeState,commitGroupPurge});
}

export const DISAPPEARING_PURGE_FIRESTORE_V1=Object.freeze({
  serverOnly:true,
  directMessagePath:"conversations/{conversationId}/messages/{messageId}",
  groupMessagePath:"groups/{groupId}/messages/{messageId}",
  groupReceiptPath:"groups/{groupId}/messages/{messageId}/receipts/{uid}",
  groupEpochPath:"groups/{groupId}/epochs/{keyEpoch}",
  groupHistoryGrantPath:"groups/{groupId}/historyGrants/{grantId}",
  groupHistoryGrantCopyPath:"groups/{groupId}/historyGrants/{grantId}/messages/{sourceMessageId}",
  clientDeleteRulesRequired:false,
  groupPhysicalDeleteReady:true
});
