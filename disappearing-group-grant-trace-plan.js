// FIDUNIO disappearing group-history grant trace reconciliation planner.
// PURE MODULE: no Firebase/Admin SDK, storage, DOM, timers, crypto, or deletes.
// It computes the exact metadata/copy reconciliation required before a
// disappearing group source can be physically removed.

function fail(code,message){const error=new Error(message);error.code=code;return error;}
function text(value,name){const out=String(value??"").trim();if(!out)throw fail("INVALID_INPUT",`${name} is required.`);return out;}
function asDate(value,name){const d=value instanceof Date?value:value?.toDate?.()||new Date(value);if(!(d instanceof Date)||Number.isNaN(d.getTime()))throw fail("GRANT_TRACE_INCONSISTENT",`${name} is invalid.`);return d;}
function compareCopies(a,b){const at=asDate(a.sourceCreatedAt,"Grant copy source time").getTime(),bt=asDate(b.sourceCreatedAt,"Grant copy source time").getTime();return at-bt||String(a.sourceMessageId).localeCompare(String(b.sourceMessageId));}

export function planGroupHistoryGrantSourcePurge({groupId,sourceMessageId,grants=[]}={}){
  const gid=text(groupId,"Group ID"),sourceId=text(sourceMessageId,"Source message ID");
  if(!Array.isArray(grants))throw fail("INVALID_INPUT","Grant trace rows must be an array.");
  const copiesToDelete=[],grantsToDelete=[],grantsToUpdate=[];
  const seenGrants=new Set();

  for(const entry of grants){
    const grant=entry?.grant;
    const copies=Array.isArray(entry?.copies)?entry.copies:[];
    const grantId=text(grant?.grantId,"Grant ID");
    if(seenGrants.has(grantId))throw fail("GRANT_TRACE_INCONSISTENT","Duplicate history grant authority was supplied.");
    seenGrants.add(grantId);
    if(grant?.groupId!==gid)throw fail("GRANT_TRACE_INCONSISTENT","History grant belongs to another group.");
    if(!Number.isInteger(Number(grant?.totalCopies))||Number(grant.totalCopies)<1)throw fail("GRANT_TRACE_INCONSISTENT","History grant totalCopies is invalid.");
    if(Number(grant.totalCopies)!==copies.length)throw fail("GRANT_TRACE_INCONSISTENT","History grant copy count does not match metadata.");

    const copyIds=new Set();
    for(const copy of copies){
      const copyId=text(copy?.sourceMessageId,"Grant copy source message ID");
      if(copyIds.has(copyId))throw fail("GRANT_TRACE_INCONSISTENT","History grant contains duplicate source copies.");
      copyIds.add(copyId);
      if(copy?.groupId!==gid||copy?.grantId!==grantId)throw fail("GRANT_TRACE_INCONSISTENT","History grant copy authority does not match metadata.");
      asDate(copy?.sourceCreatedAt,"Grant copy source time");
    }

    const target=copies.find(copy=>String(copy.sourceMessageId)===sourceId);
    if(!target)continue;
    copiesToDelete.push(Object.freeze({grantId,sourceMessageId:sourceId}));
    const remaining=copies.filter(copy=>String(copy.sourceMessageId)!==sourceId).sort(compareCopies);
    if(!remaining.length){
      grantsToDelete.push(grantId);
      continue;
    }
    const first=remaining[0];
    grantsToUpdate.push(Object.freeze({
      grantId,
      totalCopies:remaining.length,
      firstSharedMessageId:String(first.sourceMessageId),
      firstSharedAt:first.sourceCreatedAt
    }));
  }

  copiesToDelete.sort((a,b)=>a.grantId.localeCompare(b.grantId));
  grantsToDelete.sort();
  grantsToUpdate.sort((a,b)=>a.grantId.localeCompare(b.grantId));
  return Object.freeze({
    groupId:gid,
    sourceMessageId:sourceId,
    copiesToDelete:Object.freeze(copiesToDelete),
    grantsToDelete:Object.freeze(grantsToDelete),
    grantsToUpdate:Object.freeze(grantsToUpdate)
  });
}
