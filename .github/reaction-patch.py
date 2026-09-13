from pathlib import Path

def edit(path, old, new, count=1):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f"missing anchor: {path}: {old[:80]}")
    p.write_text(s.replace(old,new,count))

# firebase.js remains sole Firestore owner.
edit('firebase.js','import {createDirectMessageDeliveryOwner} from "./direct-message-delivery-owner.js";\n','import {createDirectMessageDeliveryOwner} from "./direct-message-delivery-owner.js";\nimport {nextMessageReactions} from "./message-reaction-policy.js";\n')
anchor='export function deleteCloudConversationForEveryone(conversationId,conversationKind="direct"){return callCloudFunction("deleteConversationForEveryoneV1",{conversationId:String(conversationId||""),conversationKind:conversationKind==="group"?"group":"direct"});}\n'
addition='''export async function setCloudMessageReaction(conversationId,messageId,messageKind="direct",reaction){
  const s=await ensureServices();if(!authUser)throw new Error("Sign in first.");
  const id=String(conversationId||"").trim(),mid=String(messageId||"").trim(),kind=messageKind==="group"?"group":"direct";
  if(!id||!mid)throw new Error("Message reaction target is incomplete.");
  if(kind==="group")await readCloudGroupAuthority(id);else{const snap=await s.fsSdk.getDoc(s.fsSdk.doc(s.db,"conversations",id));if(!snap.exists()||!Array.isArray(snap.data().members)||!snap.data().members.includes(authUser.uid))throw new Error("Conversation is not available to this account.");}
  const ref=kind==="group"?s.fsSdk.doc(s.db,"groups",id,"messages",mid):s.fsSdk.doc(s.db,"conversations",id,"messages",mid);
  return s.fsSdk.runTransaction(s.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error("Message was not found.");const next=nextMessageReactions(snap.data().reactions,authUser.uid,reaction);tx.update(ref,{reactions:next});return{reactions:next,reaction:next[authUser.uid]||null};});
}
'''
edit('firebase.js',anchor,anchor+addition)

# Projection metadata only; no crypto/receipt lifecycle changes.
edit('e2ee-account-group-conversation.js','disappearAfterSeconds:row.disappearAfterSeconds??null,decryptAvailable});','disappearAfterSeconds:row.disappearAfterSeconds??null,reactions:row.reactions&&typeof row.reactions==="object"?row.reactions:{},decryptAvailable});')

# Existing app long-press owner is reused unchanged.
edit('app.js','  deleteCloudConversationForEveryone\n} from "./firebase.js";','  deleteCloudConversationForEveryone,\n  setCloudMessageReaction\n} from "./firebase.js";')
edit('app.js','import {createGroupMessageStreamLifecycle} from "./group-message-stream-lifecycle.js";\n','import {createGroupMessageStreamLifecycle} from "./group-message-stream-lifecycle.js";\nimport {MESSAGE_REACTION_CHOICES,summarizeMessageReactions} from "./message-reaction-policy.js";\n')
edit('app.js','remote.push({id:m.id,mine:m.senderUid===firebaseUser.uid,sender:m.senderName||"",text,time:m.timeLabel||"",createdAt:m.createdAt?.toDate?.()||m.createdAt||null,state:m.state||"sent",cloud:true,e2ee:!!m.e2ee,senderDeviceId:m.senderDeviceId||null,disappearAfterSeconds:m.disappearAfterSeconds??null,disappearingPurgeVersion:m.disappearingPurgeVersion??null});','remote.push({id:m.id,mine:m.senderUid===firebaseUser.uid,sender:m.senderName||"",text,time:m.timeLabel||"",createdAt:m.createdAt?.toDate?.()||m.createdAt||null,state:m.state||"sent",cloud:true,e2ee:!!m.e2ee,senderDeviceId:m.senderDeviceId||null,disappearAfterSeconds:m.disappearAfterSeconds??null,disappearingPurgeVersion:m.disappearingPurgeVersion??null,reactions:m.reactions&&typeof m.reactions==="object"?m.reactions:{}});')
edit('app.js','  const groupSender=groupSenderDisplayName(m,c);\n  const displayTime=messageDisplayTime(m);\n','''  const groupSender=groupSenderDisplayName(m,c);
  const displayTime=messageDisplayTime(m);
  const reactionSummary=summarizeMessageReactions(m.reactions,firebaseUser?.uid||"");
  const reactionMarkup=reactionSummary.length?`<div class="message-reactions" aria-label="Message reactions">${reactionSummary.map(item=>`<span class="message-reaction-chip ${item.mine?"mine":""}">${esc(item.emoji)}${item.count>1?` <span class="message-reaction-count">${item.count}</span>`:""}</span>`).join("")}</div>`:"";
''')
edit('app.js','      <div class="msg-meta"><span>${esc(m.time)}</span>${m.mine?`<span class="${cls}">${label}</span>`:""}</div>\n    </div>','      <div class="msg-meta"><span>${esc(m.time)}</span>${m.mine?`<span class="${cls}">${label}</span>`:""}</div>\n      ${reactionMarkup}\n    </div>')
old='''    const canDeleteForEveryone=MESSAGE_DELETE_FOR_EVERYONE_ENABLED&&message?.mine&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup);
    host.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pendingMessageTitle">
        <h2 id="pendingMessageTitle">Message actions</h2>
        <p>${isPending?"This message has not completed sending. Delete it and permanently stop future retries?":"Delete only from this device, or remove it for everyone?"}</p>
        <div class="modal-actions ${isPending?"":"message-delete-actions"}">
          ${isPending?'<button class="modal-delete" id="modalDeletePending">Delete Message</button>':'<button class="modal-delete" id="modalDeleteForMe">Delete for Me</button>'}
          ${canDeleteForEveryone?'<button class="modal-delete" id="modalDeleteForEveryone">Delete for Everyone</button>':""}
          <button class="modal-cancel" id="modalCancel">Cancel</button>
        </div>
      </div>`;
'''
new='''    const canDeleteForEveryone=MESSAGE_DELETE_FOR_EVERYONE_ENABLED&&message?.mine&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup);
    const canReact=!!message&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup)&&message.authoritativeSource!==false;
    const myReaction=firebaseUser?.uid&&message?.reactions?.[firebaseUser.uid]||"";
    const reactionButtons=canReact?MESSAGE_REACTION_CHOICES.map(reaction=>`<button class="message-reaction-btn ${myReaction===reaction?"selected":""}" type="button" data-reaction="${reaction}" aria-label="React ${reaction}" aria-pressed="${myReaction===reaction?"true":"false"}">${reaction}</button>`).join(""):"";
    host.innerHTML=`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pendingMessageTitle">
        <h2 id="pendingMessageTitle">Message actions</h2>
        <p>${isPending?"This message has not completed sending. Delete it and permanently stop future retries?":"Choose a reaction, or manage this message below."}</p>
        ${canReact?`<section class="message-reaction-section" aria-label="React to message"><div class="message-reaction-title">React</div><div class="message-reaction-picker">${reactionButtons}</div><div class="small-note">Tap your selected reaction again to remove it.</div></section>`:""}
        <div class="modal-actions ${isPending?"":"message-delete-actions"} ${isPending?"":"message-delete-section"}">
          ${isPending?'<button class="modal-delete" id="modalDeletePending">Delete Message</button>':'<button class="modal-delete" id="modalDeleteForMe">Delete for Me</button>'}
          ${canDeleteForEveryone?'<button class="modal-delete" id="modalDeleteForEveryone">Delete for Everyone</button>':""}
          <button class="modal-cancel" id="modalCancel">Cancel</button>
        </div>
      </div>`;
'''
edit('app.js',old,new)
needle='''    };
    const pendingBtn=host.querySelector("#modalDeletePending");'''
replacement='''    };
    host.querySelectorAll(".message-reaction-btn").forEach(button=>button.onclick=()=>perform(button,()=>setCloudMessageReaction(modal.conversationId,modal.messageId,conversation?.cloudGroup?"group":"direct",button.dataset.reaction)));
    const pendingBtn=host.querySelector("#modalDeletePending");'''
edit('app.js',needle,replacement)

# Spacious 3x2 reaction layout, separated from destructive actions.
css='''.message-reaction-section{margin:16px 0 4px;padding:14px 0 20px;border-bottom:1px solid var(--line)}
.message-reaction-title{font-weight:900;margin-bottom:12px}
.message-reaction-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.message-reaction-btn{min-height:56px;border:1px solid var(--line);border-radius:14px;background:var(--tool);color:var(--ink);font-size:28px;line-height:1;padding:10px}
.message-reaction-btn.selected{border:3px solid var(--accent);background:var(--accent-soft)}
.message-reaction-section .small-note{margin-top:12px}
.message-delete-section{margin-top:18px}
.message-reactions{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;justify-content:flex-start}
.mine .message-reactions{justify-content:flex-end}
.message-reaction-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:var(--tool);border:1px solid var(--line);font-size:15px;line-height:1.2}
.message-reaction-chip.mine{border:2px solid var(--accent);background:var(--accent-soft)}
.message-reaction-count{font-size:12px;font-weight:800;color:var(--muted)}
html.text-aplusplus .message-reaction-btn{min-height:64px;font-size:32px}
'''
edit('styles.css','.message-delete-actions .modal-cancel{grid-column:1/-1}\n','.message-delete-actions .modal-cancel{grid-column:1/-1}\n'+css)

# Release/cache authority.
Path('version.js').write_text('globalThis.FIDUNIO_RELEASE = Object.freeze({ version: "1.1.43" });\n')
edit('service-worker.js','const SHELL_REVISION="1.1.42-large-attachment-network-verification";','const SHELL_REVISION="1.1.43-message-reactions";')
edit('service-worker.js','"./bulk-message-delete-projection.js","./firebase-config.js"','"./bulk-message-delete-projection.js","./message-reaction-policy.js","./firebase-config.js"')
