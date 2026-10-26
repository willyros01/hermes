export const MESSAGE_REACTION_CHOICES=Object.freeze(["👍","❤️","😂","😮","😢","🙏"]);

export function normalizeMessageReaction(value){
  const reaction=String(value||"");
  return MESSAGE_REACTION_CHOICES.includes(reaction)?reaction:null;
}

// A reaction tap has one fixed intent. Firestore may retry its transaction
// callback against a newer snapshot; a toggle inside that callback can undo
// the SAME tap on retry. Applying the captured intent is retry-idempotent.
export function applyMessageReactionIntent(value,uid,reaction,intent){
  const accountUid=String(uid||"").trim();
  if(!accountUid)throw new Error("Reaction account is required.");
  const normalized=normalizeMessageReaction(reaction);
  if(!normalized)throw new Error("Unsupported message reaction.");
  if(intent!=="apply"&&intent!=="remove")throw new Error("Message reaction intent is required.");
  const next=value&&typeof value==="object"&&!Array.isArray(value)?{...value}:{};
  if(intent==="apply")next[accountUid]=normalized;
  else if(next[accountUid]===normalized)delete next[accountUid];
  return next;
}

export function nextMessageReactions(value,uid,reaction){
  const accountUid=String(uid||"").trim();
  if(!accountUid)throw new Error("Reaction account is required.");
  const normalized=normalizeMessageReaction(reaction);
  if(!normalized)throw new Error("Unsupported message reaction.");
  const current=value&&typeof value==="object"&&!Array.isArray(value)?{...value}:{};
  if(current[accountUid]===normalized)delete current[accountUid];
  else current[accountUid]=normalized;
  return current;
}

export function summarizeMessageReactions(value,myUid=""){
  const reactions=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  const mine=String(myUid||"");
  return MESSAGE_REACTION_CHOICES.map(emoji=>{
    const uids=Object.entries(reactions).filter(([,value])=>value===emoji).map(([uid])=>uid);
    return{emoji,count:uids.length,mine:!!mine&&uids.includes(mine)};
  }).filter(item=>item.count>0);
}

/** Group-member names for a selected reaction, without exposing account IDs. */
export function listMessageReactionAuthors(value,emoji,members=[],myUid=""){
  if(!normalizeMessageReaction(emoji))return [];
  const names=new Map((Array.isArray(members)?members:[]).map(member=>
    [String(member?.id||member?.uid||""),String(member?.name||"").trim()]
  ).filter(([uid,name])=>uid&&name));
  const reactions=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  return Object.entries(reactions).filter(([,reaction])=>reaction===emoji).map(([uid])=>
    myUid&&uid===String(myUid)?"You":(names.get(uid)||"Former member")
  ).sort((a,b)=>a.localeCompare(b));
}
