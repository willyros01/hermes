import {directSourcePurgeDecision,groupSourcePurgeDecision} from "./disappearing-purge-policy.js";

// Server-purge coordination core. This module owns serialization and eligibility
// orchestration only. It does not import Firebase/Admin SDKs and it never deletes
// by itself. The injected repository is the sole mutable trace-delete owner and
// MUST re-read/revalidate the supplied basis inside its server-side commit path.

function need(obj,name){if(!obj||typeof obj[name]!=="function")throw new Error(`Missing disappearing purge repository method: ${name}`);}
function text(value,name){const out=String(value??"").trim();if(!out)throw new Error(`${name} is required.`);return out;}
function serverDate(value){const d=value instanceof Date?value:new Date(value);if(Number.isNaN(d.getTime()))throw new Error("Authoritative server time is invalid.");return d;}
function basis(value){if(value===undefined||value===null||value==="")throw new Error("Purge repository basis is required.");return value;}

export function createDisappearingPurgeExecutor({repository,serverNow}={}){
  ["readDirectPurgeState","commitDirectPurge","readGroupPurgeState","commitGroupPurge"].forEach(name=>need(repository,name));
  if(typeof serverNow!=="function")throw new Error("A server-side time provider is required for purge execution.");

  let tail=Promise.resolve();
  function serial(work){const run=tail.then(work,work);tail=run.catch(()=>{});return run;}
  function now(){return serverDate(serverNow());}

  async function purgeDirect({conversationId,messageId}={}){
    return serial(async()=>{
      const cid=text(conversationId,"Conversation ID"),mid=text(messageId,"Message ID");
      const state=await repository.readDirectPurgeState({conversationId:cid,messageId:mid});
      if(!state?.message)throw new Error("Direct purge source state is unavailable.");
      const expectedBasis=basis(state.basis),evaluatedAt=now();
      const decision=directSourcePurgeDecision({message:state.message,recipientUid:state.recipientUid,now:evaluatedAt});
      if(!decision.eligible)return Object.freeze({purged:false,kind:"direct",conversationId:cid,messageId:mid,reason:decision.reason,decision});
      const committed=await repository.commitDirectPurge({conversationId:cid,messageId:mid,expectedBasis,evaluatedAt,decision});
      if(!committed?.purged)throw new Error("Direct purge commit did not confirm physical deletion.");
      return Object.freeze({purged:true,kind:"direct",conversationId:cid,messageId:mid,reason:"purged",traceCount:Number(committed.traceCount||0),decision});
    });
  }

  async function purgeGroup({groupId,messageId}={}){
    return serial(async()=>{
      const gid=text(groupId,"Group ID"),mid=text(messageId,"Message ID");
      const state=await repository.readGroupPurgeState({groupId:gid,messageId:mid});
      if(!state?.message)throw new Error("Group purge source state is unavailable.");
      const expectedBasis=basis(state.basis),evaluatedAt=now();
      const decision=groupSourcePurgeDecision({message:state.message,epochMemberUids:state.epochMemberUids,currentMemberUids:state.currentMemberUids,receipts:state.receipts,now:evaluatedAt});
      if(!decision.eligible)return Object.freeze({purged:false,kind:"group",groupId:gid,messageId:mid,reason:decision.reason,decision});
      const committed=await repository.commitGroupPurge({groupId:gid,messageId:mid,expectedBasis,evaluatedAt,decision});
      if(!committed?.purged)throw new Error("Group purge commit did not confirm physical deletion.");
      return Object.freeze({purged:true,kind:"group",groupId:gid,messageId:mid,reason:"purged",traceCount:Number(committed.traceCount||0),decision});
    });
  }

  return Object.freeze({purgeDirect,purgeGroup});
}
