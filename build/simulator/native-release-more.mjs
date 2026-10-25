// Second set of release-action journeys: direct messages, archive, expiry.
export async function runExtraActions(ctx){
 const {d,expr,present,wait,shot,readDoc,readCollection,me,test,ready}=ctx;
 const direct=async()=>{
  const dm=(await readCollection('conversations')).find(x=>x.id.startsWith('dm_')&&x.members?.includes(me));
  if(!dm)throw Error('No cloud direct conversation created by the native run');
  for(let n=0;n<4&&!await present('#newBtn');n++){
   if(!await present('#backBtn'))throw Error('Cannot navigate back to Messages');await d.press('#backBtn');
  }
  await wait(()=>present('.conversation-open[data-id="'+dm.id+'"]'),'direct conversation row',50000);
  await d.press('.conversation-open[data-id="'+dm.id+'"]');
  await wait(()=>present('#messageBox'),'direct composer',40000);return dm;
 };
 const open=async(cid,mid)=>{
  const s='.pending-message-action[data-message-id="'+mid+'"]';
  await wait(()=>present(s),'direct message action target',60000);
  const ok=await expr('(() => {const el=document.querySelector('+JSON.stringify(s)+');if(!el)return false;el.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));return true})()');
  if(!ok)throw Error('Message action not triggered');
  await wait(()=>present('#pendingMessageTitle'),'message action dialog',30000);
 };
 let dm;
 const a=await test('R04','Direct emoji picker applies and removes all six emotions',async()=>{
  dm=await direct();
  const msg=(await readCollection('conversations/'+dm.id+'/messages')).find(x=>x.senderUid===me);
  if(!msg)throw Error('No native direct message to react to');
  // N08 already reacted to this message (normally with 👍). Clicking an
  // already-selected reaction toggles it OFF. Clear it through the actual
  // native message menu before verifying the six add/remove journeys.
  const original=(await readDoc('conversations/'+dm.id+'/messages/'+msg.id))?.reactions?.[me];
  if(original){
   await open(dm.id,msg.id);
   const selected='.message-reaction-btn[data-reaction="'+original+'"]';
   if(!await present(selected))throw Error('Existing emoji not available to remove: '+original);
   const pressed=await expr('document.querySelector('+JSON.stringify(selected)+')?.getAttribute("aria-pressed")');
   if(pressed!=='true')throw Error('Existing emoji not highlighted in native picker');
   await d.press(selected);
   await wait(async()=>!((await readDoc('conversations/'+dm.id+'/messages/'+msg.id))?.reactions||{})[me],'prior N08 emoji cleared',55000);
  }
  for(const reaction of ['👍','❤️','😂','😮','😢','🙏']){
   await open(dm.id,msg.id);
   const btn='.message-reaction-btn[data-reaction="'+reaction+'"]';
   await wait(()=>present(btn),'emoji '+reaction+' present',25000);
   await d.press(btn);
   await wait(async()=>((await readDoc('conversations/'+dm.id+'/messages/'+msg.id))?.reactions||{})[me]===reaction,'direct reaction saved',50000);
   await open(dm.id,msg.id);
   await d.press(btn);
   await wait(async()=>!((await readDoc('conversations/'+dm.id+'/messages/'+msg.id))?.reactions||{})[me],'direct reaction removed',50000);
  }
  await shot('native-direct-six-emoji');
  return 'All six direct reactions added/removed from actual UI and checked in Firestore';
 },{requires:ready});
 const b=await test('R05','Direct Delete for Me hides only sender local copy',async()=>{
  dm=dm||await direct();
  if(!await present('#messageBox'))dm=await direct();
  const previous=new Set((await readCollection('conversations/'+dm.id+'/messages')).map(x=>x.id));
  await d.fill('#messageBox','NATIVE_DIRECT_LOCAL_DELETE_'+Date.now());await d.press('#sendBtn');
  let m;await wait(async()=>{m=(await readCollection('conversations/'+dm.id+'/messages')).find(x=>x.senderUid===me&&!previous.has(x.id));return !!m;},'new direct ciphertext committed',65000);
  await open(dm.id,m.id);
  await wait(()=>present('#modalDeleteForMe'),'Delete for Me menu choice',30000);
  await d.press('#modalDeleteForMe');
  await wait(async()=>!await present('.pending-message-action[data-message-id="'+m.id+'"]'),'local direct message hidden',50000);
  if(!await readDoc('conversations/'+dm.id+'/messages/'+m.id))throw Error('Direct Delete for Me removed recipient shared message');
  await shot('native-direct-delete-for-me');
  return 'Deleted native direct row locally; recipient-authoritative message remains in Firestore';
 },{requires:ready});
 const c=await test('R06','Archive and unarchive direct conversation using native Messages controls',async()=>{
  dm=dm||await direct();
  for(let n=0;n<3&&!await present('#newBtn');n++){if(!await present('#backBtn'))throw Error('Cannot reach Messages');await d.press('#backBtn');}
  const action='.conversation-menu[data-conversation-actions="'+dm.id+'"]';
  await wait(()=>present(action),'direct conversation actions button',60000);
  await d.press(action);
  await wait(()=>present('#archiveConversationBtn'),'Archive action',30000);
  await shot('native-archive-dialog');
  await d.press('#archiveConversationBtn');
  await wait(async()=>!await present('.conversation-open[data-id="'+dm.id+'"]'),'conversation archived',45000);
  await d.press('#archivedViewBtn');
  await wait(()=>present('.conversation-open[data-id="'+dm.id+'"]'),'conversation visible in Archived list',45000);
  await d.press(action);await wait(()=>present('#archiveConversationBtn'),'Unarchive action');
  const label=await expr('document.querySelector("#archiveConversationBtn")?.textContent?.trim()');
  if(label!=='Unarchive')throw Error('Archive action did not switch to Unarchive');
  await d.press('#archiveConversationBtn');
  await wait(async()=>!await present('.conversation-open[data-id="'+dm.id+'"]'),'unarchived row removed from archive',45000);
  await d.press('#archivedViewBtn');
  await wait(()=>present('.conversation-open[data-id="'+dm.id+'"]'),'unarchived row visible in Messages',45000);
  await shot('native-unarchived-messages');
  return 'Archive and Unarchive used live UI and updated both filtered conversation lists';
 },{requires:ready});
 return [a,b,c].every(Boolean);
}
