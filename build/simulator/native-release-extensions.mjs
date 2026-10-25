// Release-extension UI journeys on an installed disposable Android/iPhone app.
// These tests operate the real app WebView and local Firebase emulator. No release
// source, live database, or backend service is modified.
export async function runNativeReleaseExtensions(ctx) {
  const {d,expr,present,wait,shot,readDoc,readCollection,me,test,ready} = ctx;
  const log = ctx.log;
  const openActions = async (cid,mid) => {
    const selector='.pending-message-action[data-conversation-id="'+cid+'"][data-message-id="'+mid+'"]';
    await wait(()=>present(selector),'actionable message '+mid,65000);
    const opened=await expr('(() => {const row=document.querySelector('+JSON.stringify(selector)+');if(!row)return false;row.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));return true})()');
    if(!opened)throw new Error('Native message action target absent');
    await wait(()=>present('#pendingMessageTitle'),'native message action dialog',30000);
  };
  const group=async()=>{
    const row=(await readCollection('groups')).find(g=>g.name==='Native Simulator Group');
    if(!row)throw new Error('Test group not created by native journey');
    for(let n=0;n<4 && !await present('#newBtn');n++){
      if(!await present('#backBtn'))throw new Error('Cannot return to Messages list');
      await d.press('#backBtn');
    }
    await wait(()=>present('.conversation-open[data-id="'+row.id+'"]'),'group row',60000);
    await d.press('.conversation-open[data-id="'+row.id+'"]');
    await wait(()=>present('#messageBox'),'group composer',40000);
    return row;
  };
  let g;
  const a=await test('R01','Full six-emoji native picker: apply, change, remove each choice',async()=>{
    g=await group();
    const m=(await readCollection('groups/'+g.id+'/messages')).find(x=>x.senderUid===me);
    if(!m)throw new Error('No native-sent group message for emoji verification');
    const expected=['👍','❤️','😂','😮','😢','🙏'];
    for(const emoji of expected){
      await openActions(g.id,m.id);
      const choices=await expr('Array.from(document.querySelectorAll(".message-reaction-btn")).map(e=>e.dataset.reaction)');
      if(JSON.stringify(choices)!==JSON.stringify(expected))throw new Error('Native emoji picker differs from six-choice contract');
      const button='.message-reaction-btn[data-reaction="'+emoji+'"]';
      await d.press(button);
      await wait(async()=>((await readDoc('groups/'+g.id+'/messages/'+m.id))?.reactions||{})[me]===emoji,'emoji stored '+emoji,55000);
      await openActions(g.id,m.id);
      const selected=await expr('document.querySelector('+JSON.stringify(button)+')?.getAttribute("aria-pressed")');
      if(selected!=='true')throw new Error('Selected emoji not highlighted '+emoji);
      await d.press(button);
      await wait(async()=>!((await readDoc('groups/'+g.id+'/messages/'+m.id))?.reactions||{})[me],'emoji removed '+emoji,55000);
    }
    await shot('all-native-emoji-tested');
    return 'Six picker choices verified individually: applied, selected and removed in native UI and Firestore';
  },{requires:ready});
  const b=await test('R02','Group Delete for Me hides local message but keeps shared ciphertext',async()=>{
    g=g||await group();
    if(!await present('#messageBox'))g=await group();
    const previous=new Set((await readCollection('groups/'+g.id+'/messages')).map(x=>x.id));
    await d.fill('#messageBox','NATIVE_DELETE_LOCAL_'+Date.now());await d.press('#sendBtn');
    let m;
    await wait(async()=>{m=(await readCollection('groups/'+g.id+'/messages')).find(x=>x.senderUid===me&&!previous.has(x.id));return !!m;},'new group message',75000);
    await openActions(g.id,m.id);
    await wait(()=>present('#modalDeleteForMe'),'native Delete for Me option');
    await shot('delete-for-me-dialog');
    await d.press('#modalDeleteForMe');
    await wait(async()=>!await present('.pending-message-action[data-message-id="'+m.id+'"]'),'hidden in native view',50000);
    if(!await readDoc('groups/'+g.id+'/messages/'+m.id))throw new Error('Shared record deleted by local-only operation');
    await shot('delete-for-me-hidden');
    return 'Delete for Me removed native message locally without deleting shared Firestore message';
  },{requires:a});
  const c=await test('R03','Native group message Reply composer sends ciphertext-only response',async()=>{
    g=g||await group();
    if(!await present('#messageBox'))g=await group();
    const previous=new Set((await readCollection('groups/'+g.id+'/messages')).map(x=>x.id));
    const m=(await readCollection('groups/'+g.id+'/messages')).find(x=>x.senderUid===me&&x.id!==undefined);
    if(!m)throw new Error('No original group message to reply to');
    await openActions(g.id,m.id);
    await wait(()=>present('#modalReply'),'native group Reply action');
    await d.press('#modalReply');
    await wait(()=>present('#replyCancelBtn'),'reply composer marker',30000);
    await shot('group-reply-composer');
    const phrase='NATIVE_REPLY_'+Date.now();
    await d.fill('#messageBox',phrase);await d.press('#sendBtn');
    let reply;
    await wait(async()=>{reply=(await readCollection('groups/'+g.id+'/messages')).find(x=>x.senderUid===me&&!previous.has(x.id));return !!reply;},'encrypted reply recorded',80000);
    if(JSON.stringify(reply).includes(phrase))throw new Error('Plaintext reply leaked to Firestore');
    await shot('group-reply-encrypted');
    return 'Native Reply action and composer, encrypted group reply stored; peer-side quote rendering still unverified';
  },{requires:b});
  log('Release extension native scenarios complete: '+[a,b,c].filter(Boolean).length+'/3 passed');
  return [a,b,c].every(Boolean);
}
