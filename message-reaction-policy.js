export const MESSAGE_REACTION_CHOICES=Object.freeze(["👍","❤️","😂","😮","😢","🙏"]);

export function normalizeMessageReaction(value){
  const reaction=String(value||"");
  return MESSAGE_REACTION_CHOICES.includes(reaction)?reaction:null;
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
