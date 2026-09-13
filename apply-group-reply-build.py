from pathlib import Path
import json


def replace_once(path, old, new):
    p=Path(path); text=p.read_text()
    if text.count(old)!=1:
        raise SystemExit(f"{path}: expected one anchor, found {text.count(old)}")
    p.write_text(text.replace(old,new,1))


def prepend(path, text):
    p=Path(path); current=p.read_text()
    if text.strip() not in current:
        p.write_text(text+current)

# app.js — bounded group Reply UI/orchestration only.
replace_once("app.js",
'''import {MESSAGE_REACTION_CHOICES,summarizeMessageReactions} from "./message-reaction-policy.js";''',
'''import {MESSAGE_REACTION_CHOICES,summarizeMessageReactions} from "./message-reaction-policy.js";
import {encodeGroupReplyDescriptor,parseGroupReplyDescriptor} from "./group-reply-policy.js";''')

replace_once("app.js",
'''function messagePreview(text){
  const descriptor=parseAttachmentDescriptor(text);
  if(!descriptor)return text||"";
  return descriptor.kind==="photo"||String(descriptor.type||"").startsWith("image/")?"📷 Photo":`📎 ${descriptor.name||"Attachment"}`;
}''',
'''function messagePreview(text){
  const reply=parseGroupReplyDescriptor(text);
  if(reply)return reply.text;
  const descriptor=parseAttachmentDescriptor(text);
  if(!descriptor)return text||"";
  return descriptor.kind==="photo"||String(descriptor.type||"").startsWith("image/")?"📷 Photo":`📎 ${descriptor.name||"Attachment"}`;
}
function groupReplyTargetPreview(message){
  const reply=parseGroupReplyDescriptor(message?.text);
  const source=reply?.text??messagePreview(message?.text);
  return String(source||"Message").replace(/\\s+/g," ").trim().slice(0,160)||"Message";
}
function beginGroupReply(conversation,message){
  if(!conversation?.cloudGroup||!message)return;
  const key=String(conversation.id),prior=composerStateByConversation.get(key)||{};
  composerStateByConversation.set(key,{...prior,replyTo:{messageId:String(message.id),sender:groupSenderDisplayName(message,conversation)||"FIDUNIO member",preview:groupReplyTargetPreview(message)},focused:true});
  state.modal=null;render();
  setTimeout(()=>document.querySelector(`#messageBox[data-conversation-id="${CSS.escape(key)}"]`)?.focus(),0);
}
function clearGroupReplyComposer(conversationId){
  captureComposerStateFromDom();
  const key=String(conversationId),prior=composerStateByConversation.get(key)||{},next={...prior};
  delete next.replyTo;composerStateByConversation.set(key,next);render();
}''')

replace_once("app.js",
'''        <div class="small-note" style="display:flex;align-items:center;gap:8px;margin:0 4px 6px"><label for="disappearSelect">Disappearing:</label><select id="disappearSelect" aria-label="Disappearing message duration">${DISAPPEARING_COMPOSE_PRESETS.map(p=>`<option value="${p.value??"off"}" ${(state.settings.disappearingTextSeconds??null)===p.value?"selected":""}>${esc(p.label)}</option>`).join("")}</select><span>${esc(composeDisappearLabel(state.settings.disappearingTextSeconds))}</span></div>
        <div class="compose-line">''',
'''        <div class="small-note" style="display:flex;align-items:center;gap:8px;margin:0 4px 6px"><label for="disappearSelect">Disappearing:</label><select id="disappearSelect" aria-label="Disappearing message duration">${DISAPPEARING_COMPOSE_PRESETS.map(p=>`<option value="${p.value??"off"}" ${(state.settings.disappearingTextSeconds??null)===p.value?"selected":""}>${esc(p.label)}</option>`).join("")}</select><span>${esc(composeDisappearLabel(state.settings.disappearingTextSeconds))}</span></div>
        ${c.cloudGroup&&existingComposerState?.replyTo?`<div class="card" style="margin:0 4px 8px;padding:9px 11px;border-left:4px solid currentColor;display:flex;gap:10px;align-items:center"><div style="min-width:0;flex:1"><strong>Replying to ${esc(existingComposerState.replyTo.sender)}</strong><div class="small-note" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(existingComposerState.replyTo.preview)}</div></div><button class="icon-btn" id="replyCancelBtn" type="button" aria-label="Cancel reply">×</button></div>`:""}
        <div class="compose-line">''')

replace_once("app.js",
'''  document.querySelector("#moreBtn").onclick=()=>{state.toolsOpen=!state.toolsOpen;render()};
  const disappearSelect=document.querySelector("#disappearSelect");''',
'''  document.querySelector("#moreBtn").onclick=()=>{state.toolsOpen=!state.toolsOpen;render()};
  const replyCancelBtn=document.querySelector("#replyCancelBtn");if(replyCancelBtn)replyCancelBtn.onclick=()=>clearGroupReplyComposer(c.id);
  const disappearSelect=document.querySelector("#disappearSelect");''')

replace_once("app.js",
'''  document.querySelectorAll(".tool").forEach(btn=>btn.onclick=()=>{const label=btn.textContent.trim();if(label==="Photo"||label==="Video"||label==="Audio"){state.modal={type:label==="Photo"?"photoSource":label==="Video"?"videoSource":"audioSource"};return render();}const map={File:["file","*/*",false]};const action=map[label];if(action)chooseAndSendAttachment(...action);});''',
'''  document.querySelectorAll(".tool").forEach(btn=>btn.onclick=()=>{const label=btn.textContent.trim();if(c.cloudGroup&&composerStateByConversation.get(String(c.id))?.replyTo){alert("Send or cancel the text reply before attaching a file.");return;}if(label==="Photo"||label==="Video"||label==="Audio"){state.modal={type:label==="Photo"?"photoSource":label==="Video"?"videoSource":"audioSource"};return render();}const map={File:["file","*/*",false]};const action=map[label];if(action)chooseAndSendAttachment(...action);});''')

replace_once("app.js",
'''  const descriptor=parseAttachmentDescriptor(m.text);
  let messageContent=`<div class="msg-text">${esc(m.text)}</div>`;
  if(descriptor){''',
'''  const reply=parseGroupReplyDescriptor(m.text);
  const descriptor=reply?null:parseAttachmentDescriptor(m.text);
  let messageContent=reply
    ?`<div style="border-left:3px solid currentColor;padding:5px 8px;margin-bottom:7px;opacity:.82"><strong>${esc(reply.replyToSender)}</strong><div class="small-note">${esc(reply.replyPreview)}</div></div><div class="msg-text">${esc(reply.text)}</div>`
    :`<div class="msg-text">${esc(m.text)}</div>`;
  if(descriptor){''')

replace_once("app.js",
'''async function sendCurrent(){
  if(messageSendInFlight)return;
  const box=document.querySelector("#messageBox");
  const text=box.value.trim();
  if(!text) return;
  messageSendInFlight=true;
  box.value="";
  box.style.height="46px";

  let stagedMessage=null;
  try{
    const conversationId=state.selectedId;
    const c=currentConversation();
    const cloud=!!c?.cloud;
    const cloudGroup=!!c?.cloudGroup;

  if(cloud && c?.peerUid && !firebaseUser){throw new Error("Sign in before sending an encrypted message.");}

  const m=stagedMessage=stampOutgoingDisappearSelection({
    id:crypto.randomUUID(),
    mine:true,
    text,
    time:nowTime(),
    createdAt:new Date(),
    state:(state.online && (!cloud || firebaseUser))?"sending":"queued",
    cloud
  },state.settings.disappearingTextSeconds);

  if(!state.messages[conversationId]) state.messages[conversationId]=[];
  if(cloudGroup)optimisticOutgoingProjection.stage(conversationId,m);
  state.messages[conversationId].push(m);
  c.preview=messagePreview(text);
  c.time=m.time;
  render();

  // The Outbox is authoritative. Group plaintext enters only the encrypted local Outbox.
  if(cloudGroup){
    m.cloud=true;m.group=true;
    await queueGroupTextForApp({groupId:conversationId,messageId:m.id,text,time:m.time,disappearAfterSeconds:m.disappearAfterSeconds??null,persistEncryptedOutbox:persistGroupOutboxPayload});
  }else await queueOutboxMessage(conversationId,m);''',
'''async function sendCurrent(){
  if(messageSendInFlight)return;
  const box=document.querySelector("#messageBox");
  const draftText=box.value.trim();
  if(!draftText) return;
  messageSendInFlight=true;
  box.value="";
  box.style.height="46px";

  let stagedMessage=null;
  try{
    const conversationId=state.selectedId;
    const c=currentConversation();
    const cloud=!!c?.cloud;
    const cloudGroup=!!c?.cloudGroup;
    const composerKey=String(conversationId),replyTo=cloudGroup?composerStateByConversation.get(composerKey)?.replyTo:null;
    const text=replyTo?encodeGroupReplyDescriptor({replyToMessageId:replyTo.messageId,replyToSender:replyTo.sender,replyPreview:replyTo.preview,text:draftText}):draftText;

  if(cloud && c?.peerUid && !firebaseUser){throw new Error("Sign in before sending an encrypted message.");}

  const m=stagedMessage=stampOutgoingDisappearSelection({
    id:crypto.randomUUID(),
    mine:true,
    text,
    time:nowTime(),
    createdAt:new Date(),
    state:(state.online && (!cloud || firebaseUser))?"sending":"queued",
    cloud
  },state.settings.disappearingTextSeconds);

  if(!state.messages[conversationId]) state.messages[conversationId]=[];
  if(cloudGroup)optimisticOutgoingProjection.stage(conversationId,m);
  state.messages[conversationId].push(m);
  c.preview=messagePreview(text);
  c.time=m.time;
  if(replyTo){const prior=composerStateByConversation.get(composerKey)||{},next={...prior,draft:""};delete next.replyTo;composerStateByConversation.set(composerKey,next);}
  render();

  // The Outbox is authoritative. Group reply metadata remains inside the same encrypted text payload.
  if(cloudGroup){
    m.cloud=true;m.group=true;
    await queueGroupTextForApp({groupId:conversationId,messageId:m.id,text,time:m.time,disappearAfterSeconds:m.disappearAfterSeconds??null,persistEncryptedOutbox:persistGroupOutboxPayload});
  }else await queueOutboxMessage(conversationId,m);''')

replace_once("app.js",
'''      const currentBox=document.querySelector("#messageBox");
      if(currentBox&&!currentBox.value)currentBox.value=text;''',
'''      const currentBox=document.querySelector("#messageBox");
      if(currentBox&&!currentBox.value)currentBox.value=draftText;''')

replace_once("app.js",
'''    const canDeleteForEveryone=MESSAGE_DELETE_FOR_EVERYONE_ENABLED&&message?.mine&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup);
    const canReact=!!message&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup)&&message.authoritativeSource!==false;''',
'''    const canDeleteForEveryone=MESSAGE_DELETE_FOR_EVERYONE_ENABLED&&message?.mine&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup);
    const canReact=!!message&&!isPending&&["sent","delivered","read"].includes(message.state)&&!!(conversation?.cloud||conversation?.cloudGroup)&&message.authoritativeSource!==false;
    const canReply=!!conversation?.cloudGroup&&!!message&&!isPending&&["sent","delivered","read"].includes(message.state)&&message.authoritativeSource!==false&&!(Number(message.disappearAfterSeconds)>0);''')

replace_once("app.js",
'''        <p>${isPending?"This message has not completed sending. Delete it and permanently stop future retries?":"Choose a reaction, or manage this message below."}</p>
        ${canReact?`<section class="message-reaction-section" aria-label="React to message"><div class="message-reaction-title">React</div><div class="message-reaction-picker">${reactionButtons}</div><div class="small-note">Tap your selected reaction again to remove it.</div></section>`:""}''',
'''        <p>${isPending?"This message has not completed sending. Delete it and permanently stop future retries?":canReply?"Reply, react, or manage this message below.":"Choose a reaction, or manage this message below."}</p>
        ${canReply?'<div class="modal-actions" style="margin-bottom:12px"><button class="modal-confirm" id="modalReply">Reply</button></div>':""}
        ${canReact?`<section class="message-reaction-section" aria-label="React to message"><div class="message-reaction-title">React</div><div class="message-reaction-picker">${reactionButtons}</div><div class="small-note">Tap your selected reaction again to remove it.</div></section>`:""}''')

replace_once("app.js",
'''    host.querySelectorAll(".message-reaction-btn").forEach(button=>button.onclick=()=>perform(button,()=>setCloudMessageReaction(modal.conversationId,modal.messageId,conversation?.cloudGroup?"group":"direct",button.dataset.reaction)));
    const pendingBtn=host.querySelector("#modalDeletePending");''',
'''    const replyBtn=host.querySelector("#modalReply");if(replyBtn)replyBtn.onclick=()=>{state.modal=null;host.remove();beginGroupReply(conversation,message);};
    host.querySelectorAll(".message-reaction-btn").forEach(button=>button.onclick=()=>perform(button,()=>setCloudMessageReaction(modal.conversationId,modal.messageId,conversation?.cloudGroup?"group":"direct",button.dataset.reaction)));
    const pendingBtn=host.querySelector("#modalDeletePending");''')

# Version + cache.
replace_once("version.js",'globalThis.FIDUNIO_RELEASE = Object.freeze({ version: "1.1.53" });','globalThis.FIDUNIO_RELEASE = Object.freeze({ version: "1.1.54" });')
replace_once("service-worker.js",'const SHELL_REVISION="1.1.53-ios-recovery-file-picker";','const SHELL_REVISION="1.1.54-group-message-reply";')
replace_once("service-worker.js",'"./bulk-message-delete-projection.js","./message-reaction-policy.js","./firebase-config.js"','"./bulk-message-delete-projection.js","./message-reaction-policy.js","./group-reply-policy.js","./firebase-config.js"')

# Permanent test command.
p=Path("package.json"); data=json.loads(p.read_text()); data.setdefault("scripts",{})["test:group-reply"]="node group-reply-policy.test.mjs"; p.write_text(json.dumps(data,separators=(",",":"))+"\n")

release=("FIDUNIO 1.1.54 GROUP MESSAGE REPLY — 2026-09-13: TODO Item 11 is a deployed device candidate. In an authoritative cloud group, press-and-hold an accepted non-disappearing message and choose Reply. The composer shows the target sender and bounded preview with an explicit cancel control; the outgoing reply carries a versioned reply descriptor entirely inside the existing encrypted group text payload, so Firestore outer schema/rules, group E2EE epochs, Outbox ownership, receipts, notifications, attachments, reactions, deletion and membership authority remain unchanged. Reply-to-disappearing-message preview copying is intentionally disabled so a permanent reply cannot preserve content that is scheduled to disappear. This first candidate supports text replies; attachment sends require sending or cancelling the active reply first. Device acceptance is required on iPhone and iPad before closure.\n\n")
for name in ["README.md","hermes-memory.txt","CURRENT-REBUILD.md","FIDUNIO-BUILD-CHECKLIST.md"]:
    prepend(name,release)

p=Path("README.md"); text=p.read_text(); text=text.replace("Current checkpoint version: **1.1.52**","Current checkpoint version: **1.1.54**",1); p.write_text(text)

accept=("## FIDUNIO 1.1.54 — group message Reply\n\n**Status: DEPLOYED DEVICE CANDIDATE.** In an existing cloud group, press-and-hold a sent/delivered/read non-disappearing message and choose Reply. Confirm a quoted sender/preview appears above the composer, Cancel removes only reply targeting and preserves the draft, and sending produces one reply bubble with the quote plus reply text on sender and recipients. Close/reopen and confirm the reply still renders. Reply to another member, your own message, and an attachment message (text response quoting the attachment label). Confirm disappearing targets do not expose Reply, attachment sending while a reply is active is blocked with guidance, reactions/delete still work, group Sent→Read still works, direct-chat actions remain unchanged, and notification tap → PIN → exact group message still routes correctly. No Firebase/rules/backend deployment is required.\n\n")
prepend("DEVICE-ACCEPTANCE-BUGS.md",accept)

p=Path("TODO.md"); text=p.read_text(); item='''\n\n## 11. Reply to a message in group chat — 🟡 DEPLOYED DEVICE CANDIDATE\n\n- FIDUNIO 1.1.54 adds **Reply** to the existing group-message press-and-hold action sheet.\n- Reply target sender + bounded preview are shown above the composer and inside the resulting reply bubble.\n- Reply metadata stays inside the existing encrypted group text payload; no Firebase schema/rules/backend change.\n- Disappearing targets are intentionally excluded so quoted content cannot outlive the disappearing source.\n- First candidate supports text replies; send or cancel the reply before attaching a file.\n- Required acceptance: iPhone + iPad, reply to incoming/outgoing/attachment target, close/reopen persistence, Cancel/draft preservation, reactions/delete regression, Sent→Read, direct-chat unchanged, and FCM exact-message routing.\n- **Status:** device acceptance pending.\n'''
if "## 11. Reply to a message in group chat" not in text:text+=item
p.write_text(text)

p=Path("ACCOUNT-E2EE-GROUP-MESSAGE-FORMAT.md"); text=p.read_text(); note='''\n\n## Group reply compatibility — FIDUNIO 1.1.54\n\nA group text reply does **not** add a Firestore field or change the outer `fidunio-group-message-v1` transport. The existing encrypted plaintext `text` member may contain a versioned application reply descriptor (`fidunioReply: 1`) with the target message ID, bounded sender/preview, and reply body. The descriptor is encrypted as part of the normal group plaintext before publication. Disappearing source messages are not eligible for quoted Reply in this candidate, preventing a non-disappearing reply preview from retaining disappearing source content.\n'''
if "## Group reply compatibility — FIDUNIO 1.1.54" not in text:text+=note
p.write_text(text)

# Remove one-time patch machinery from the resulting feature commit.
Path("apply-group-reply-build.py").unlink(missing_ok=True)
Path(".github/workflows/apply-group-reply-build.yml").unlink(missing_ok=True)
