// Repeatable actual native-app reaction stress tests, not a mocked policy unit.
// Each press goes through the installed app UI; Auth/Firestore/Storage are
// localhost emulator-only. A failure remains FAIL even if a subsequent run passes.
export async function runEmojiStress({d,expr,present,wait,shot,readDoc,readCollection,me,test,ready,log}) {
  const choices=['👍','❤️','😂','😮','😢','🙏'];
  const cycles=4;
  const reportState=async(type,id,mid,emoji,cycle,phase,error)=>{
    const root=type==='group'?'groups':'conversations';
    const server=(await readDoc(root+'/'+id+'/messages/'+mid))?.reactions||{};
    const row='.pending-message-action[data-message-id="'+mid+'"]';
    const ui=await expr('JSON.stringify({chips:Array.from(document.querySelectorAll('+JSON.stringify(row+' .message-reaction-chip')+')).map(x=>({text:x.textContent,mine:x.classList.contains("mine")})),menu:Array.from(document.querySelectorAll(".message-reaction-btn")).map(x=>({emoji:x.dataset.reaction,selected:x.getAttribute("aria-pressed"),disabled:x.disabled})),modalText:document.querySelector(".modal-backdrop .modal")?.innerText?.slice(0,360)||null,rowMeta:document.querySelector('+JSON.stringify(row+' .msg-meta')+')?.innerText||null,alerts:Array.from(document.querySelectorAll("[role=alert]")).map(x=>x.innerText?.slice(0,180))})').catch(e=>'Inspector unavailable: '+e.message);
    log('REACTION-STRESS FAIL: '+JSON.stringify({type,conversationId:id,messageId:mid,emoji,cycle,phase,serverReaction:server[me]||null,server,ui,error:String(error?.message||error)}));
  };
  const nav=async(type)=>{
    const path=type==='group'?'groups':'conversations';
    const row=(await readCollection(path)).find(r=>type==='group'?r.name==='Native Simulator Group':r.id.startsWith('dm_')&&r.members?.includes(me));
    if(!row)throw Error(type+' native conversation unavailable');
    for(let i=0;i<5&&!await present('#newBtn');i++){
      if(!await present('#backBtn'))throw Error('Could not return to Messages');
      await d.press('#backBtn');
    }
    await wait(()=>present('.conversation-open[data-id="'+row.id+'"]'),type+' row in Messages list',60000);
    await d.press('.conversation-open[data-id="'+row.id+'"]');
    await wait(()=>present('#messageBox'),type+' composer',40000);
    return row;
  };
  // Exactly one click, atomically checked and dispatched in the WebView.
  // This records DOM dispatch, not Firebase transaction success. Never retry
  // a toggle automatically: two clicks can invert the intended reaction.
  const tapReaction=async(selector,kind,emoji,cycle,phase)=>{
    const payload=await expr('(() => {const el=document.querySelector('+JSON.stringify(selector)+');if(!el)return JSON.stringify({error:"button-missing"});const before={disabled:!!el.disabled,connected:!!el.isConnected,pressed:el.getAttribute("aria-pressed"),handler:typeof el.onclick==="function"};let delivered=0;el.addEventListener("click",()=>{delivered++;},{once:true});if(!before.disabled&&before.connected)el.click();return JSON.stringify({...before,delivered,disabledAfter:!!el.disabled,connectedAfter:!!el.isConnected});})()');
    const info=JSON.parse(payload||"null");
    log('REACTION-CLICK '+JSON.stringify({kind,emoji,cycle,phase,...info}));
    if(!info||info.error||info.disabled||!info.connected||!info.handler||info.delivered!==1)throw Error('Reaction click was not delivered to an enabled live button: '+JSON.stringify(info));
    await d.sleep(1200);
  };
  const open=async(id,mid)=>{
    const sel='.pending-message-action[data-message-id="'+mid+'"]';
    await wait(async()=>!await present('#pendingMessageTitle'),'previous reaction dialog to close',30000);
    await wait(()=>present(sel),'live native action row for '+mid,70000);
    const ok=await expr('(() => {const el=document.querySelector('+JSON.stringify(sel)+');if(!el)return false;el.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));return true})()');
    if(!ok)throw Error('Cannot open native reaction menu');
    await wait(()=>present('#pendingMessageTitle'),'native actions modal',35000);
    await wait(async()=>await expr('document.querySelectorAll(".message-reaction-btn").length===6'),'six actual emoji buttons, not an unsent-message dialog',35000);
  };
  async function exercise(type){
    const row=await nav(type);
    if(await present('#disappearSelect')){
      // Test stress message must not expire mid-matrix.
      await d.fill('#disappearSelect','off');
      await wait(async()=>await expr('document.querySelector("#disappearSelect")?.value==="off"'),'disappearing disabled for test source');
    }
    const dbPath=(type==='group'?'groups':'conversations')+'/'+row.id+'/messages';
    const existing=new Set((await readCollection(dbPath)).map(m=>m.id));
    const token='NATIVE_EMOJI_STRESS_'+type.toUpperCase()+'_'+Date.now();
    await d.fill('#messageBox',token);await d.press('#sendBtn');
    let message=null;
    await wait(async()=>{message=(await readCollection(dbPath)).find(x=>x.senderUid===me&&!existing.has(x.id));return !!message;},'fresh authentic encrypted message',85000);
    if(JSON.stringify(message).includes(token))throw Error('Plaintext leaked during reaction stress');
    await wait(()=>present('.pending-message-action[data-message-id="'+message.id+'"]'),'fresh message visible on device',60000);
    // A remote Firestore document can exist while local Outbox still says
    // Sending. The earlier iPhone R07 entered that pending-delete dialog.
    // Require both committed Firestore state and actual native Sent UI.
    const msgSel='.pending-message-action[data-message-id="'+message.id+'"]';
    await wait(async()=>{
      const doc=await readDoc(dbPath+'/'+message.id);
      const ui=await expr('document.querySelector('+JSON.stringify(msgSel+' .msg-meta')+')?.innerText||""');
      return doc?.state==="sent" && /(?:Sent|Delivered|Read)/i.test(String(ui));
    },'Firestore committed AND native Outbox marked Sent',90000);
    log('REACTION-STRESS precondition '+type+' native Sent + authoritative Firestore confirmed for '+message.id);
    const chipSel='.pending-message-action[data-message-id="'+message.id+'"] .message-reaction-chip.mine';
    let passed=0;
    for(let cycle=1;cycle<=cycles;cycle++){
      for(const emoji of choices){
        let phase='apply';
        try{
          await open(row.id,message.id);
          const options=await expr('Array.from(document.querySelectorAll(".message-reaction-btn")).map(x=>x.dataset.reaction)');
          if(JSON.stringify(options)!==JSON.stringify(choices))throw Error('Missing or reordered emoji options');
          const button='.message-reaction-btn[data-reaction="'+emoji+'"]';
          const before=await expr('document.querySelector('+JSON.stringify(button)+')?.getAttribute("aria-pressed")');
          if(before!=='false')throw Error('Reaction already selected before apply: '+emoji);
          await tapReaction(button,type,emoji,cycle,"apply");
          await wait(async()=>((await readDoc(dbPath+'/'+message.id))?.reactions||{})[me]===emoji,'authoritative apply '+emoji,50000);
          await wait(async()=>await expr('Array.from(document.querySelectorAll('+JSON.stringify(chipSel)+')).some(x=>x.textContent.trim().startsWith('+JSON.stringify(emoji)+'))'),'native UI shows applied '+emoji,45000);
          phase='remove';
          await open(row.id,message.id);
          const selected=await expr('document.querySelector('+JSON.stringify(button)+')?.getAttribute("aria-pressed")');
          if(selected!=='true')throw Error('Native picker stale or reaction not selected: '+emoji);
          await tapReaction(button,type,emoji,cycle,"remove");
          await wait(async()=>!((await readDoc(dbPath+'/'+message.id))?.reactions||{})[me],'authoritative removal '+emoji,50000);
          await wait(async()=>!await expr('Array.from(document.querySelectorAll('+JSON.stringify(chipSel)+')).some(x=>x.textContent.trim().startsWith('+JSON.stringify(emoji)+'))'),'native UI removes '+emoji,45000);
          passed++;
          log('REACTION-STRESS PASS '+type+' cycle='+cycle+'/'+cycles+' emoji='+emoji+' message='+message.id);
        }catch(error){
          await reportState(type,row.id,message.id,emoji,cycle,phase,error);
          throw error;
        }
      }
      await shot('stress-'+type+'-completed-cycle-'+cycle);
      // Trigger an independent new conversation projection between cycles.
      if(cycle!==cycles){
        await d.press('#backBtn');await wait(()=>present('#newBtn'),'Messages between stress cycles',30000);
        await d.press('.conversation-open[data-id="'+row.id+'"]');
        await wait(()=>present('.pending-message-action[data-message-id="'+message.id+'"]'),'same message after reopening',45000);
      }
    }
    return type+' 4 cycles × 6 emoji = '+passed+' authentic add/remove pairs; Firestore and UI synchronized after each step';
  }
  const group=await test('R07','Group reaction stress — four complete six-emoji cycles across native chat reopen',()=>exercise('group'),{requires:ready});
  const direct=await test('R08','Direct reaction stress — four complete six-emoji cycles across native chat reopen',()=>exercise('direct'),{requires:ready});
  log('REACTION-STRESS summary group='+group+' direct='+direct+'; no release approval implied.');
  return group&&direct;
}
