/*
 * FIDUNIO HELP — KISS version (owner storyboard, Nov 24 2026; owner-authorized rebuild Nov 25).
 * The one owner of HELP state and HELP screens. One action per screen, words a child can read.
 *
 * Child:  Messages → red HELP bar → hold 2 s → "HELP is sent" with the conversation on the same screen
 *         and "I'm OK now" → green "<name> is coming" (conversation + "I'm OK now").
 * Helper: notification "HELP — <name>" → red "<name> needs HELP" (Open in Maps, I'm coming) → after
 *         "I'm coming" the conversation appears on the same screen.
 * Option A (owner, 25 Nov): the big-screen conversation IS the regular chat (same messages, same order).
 * HELP chat: with one HELP contact, the direct chat with them; with two or more, one encrypted
 *         group "HELP — <child's profile name>" kept in step with the chosen contacts.
 * Setup:  Settings → Safety → HELP: who is chosen, "Choose HELP contacts" opens the list, Save.
 *
 * Data (unchanged server contract): helpSettings/{uid} {enabled, helperUids, protected:false,
 * updatedAt}; helpAlerts/{id} {senderUid, helperUids, state, test:false, acks, createdAt}.
 * The location travels only inside end-to-end encrypted messages (a HELP card in the chat).
 * Device-specific work (Android alert channel, location) is in help-platform-adapter.js.
 */
import {getFirebaseServices,listCloudUsers} from "./firebase.js";
import {prepareUrgentAlerts,currentLocation} from "./help-platform-adapter.js";

const HOLD_MS=2000,MAX_HELPERS=5;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const HELP_GROUP_PREFIX="HELP — ";

/* ---- the HELP card carried inside an encrypted message ---- */
const CARD_KINDS=["alert","note","cancel","safe","contact","coming"];
export function encodeHelpCard(card){
  return JSON.stringify({fidunioHelp:1,alertId:String(card.alertId),kind:String(card.kind),
    ...(card.location?{location:{lat:Number(card.location.lat),lng:Number(card.location.lng),acc:Math.round(Number(card.location.acc)||0)}}:{})});
}
export function parseHelpCard(text){
  if(typeof text!=="string"||!text.startsWith('{"fidunioHelp":1'))return null;
  try{const v=JSON.parse(text);return v&&v.fidunioHelp===1&&typeof v.alertId==="string"&&CARD_KINDS.includes(v.kind)?v:null;}catch{return null;}
}
export function mapLink(location){
  if(!location||!Number.isFinite(location.lat)||!Number.isFinite(location.lng))return"";
  return `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
}
export function helpCardLines(card){
  const lines=[];
  if(card.kind==="alert")lines.push("HELP");
  if(card.kind==="note"&&card.note)lines.push(String(card.note));
  if(card.kind==="cancel"||card.kind==="safe")lines.push("I'm OK now");
  if(card.kind==="contact")lines.push("You are now one of my HELP contacts.");
  if(card.kind==="coming")lines.push("I'm coming");
  return lines;
}
/* Chat bubble markup for a HELP card. */
export function renderHelpCardBubble(card){
  const link=mapLink(card.location);
  return `<div class="help-card help-card-${esc(card.kind)}">${helpCardLines(card).map((l,i)=>`<div class="${i===0?"help-card-title":"msg-text"}">${esc(l)}</div>`).join("")}${link?`<a class="msg-link help-card-map" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Open in Maps</a>`:""}</div>`;
}
export function helpPreview(card){return card.kind==="alert"?"HELP":card.kind==="safe"||card.kind==="cancel"?"I'm OK now":card.kind==="coming"?"I'm coming":"HELP";}
export function joinNames(names){
  const n=names.filter(Boolean);
  return n.length<=1?(n[0]||""):n.length===2?`${n[0]} and ${n[1]}`:`${n.slice(0,-1).join(", ")} and ${n[n.length-1]}`;
}

/* ---- the owner ----
 * chat: {sendDirect(uid,text), sendGroup(groupId,text), ensureGroup(helperUids,myName)->groupId|null,
 *        findGroup(ownerUid)->groupId|null, watch({direct}|{group})->conversationId, messages(id)->rows} — app.js owns chats. */
export function createHelpOwner({app,render,navigate,chat,shellTop,isUnlocked=()=>true,onError=m=>alert(m),
  notify={status:async()=>({on:true,denied:false,installationId:""}),turnOn:async()=>false,openSettings:()=>{}}}){
  const shown=new Set();
  const st={uid:"",settings:{enabled:false,helperUids:[]},settingsLoaded:false,mine:[],incoming:[],people:[],unsub:[],
    viewAlertId:"",holdTimer:null,sending:false,lastError:"",settingsMsg:"",choosing:false,
    mineLoaded:false,incomingLoaded:false,notifyOn:null,notifyDenied:false,helperOf:[],reachSent:"",reachOf:{}};
  let services=null,generation=0;
  const fs=()=>services.fsSdk,db=()=>services.db;
  /* Diagnostic trace (event names and counts only — no names, ids or message text), last 60 events. */
  const trace=e=>{try{const t=(globalThis.FIDUNIO_HELP_TRACE||(globalThis.FIDUNIO_HELP_TRACE=[]));t.push(new Date().toISOString().slice(11,19)+" "+e);if(t.length>60)t.shift();}catch{}};

  /* A listener that stops on an error is started again after a short wait (same account only). */
  function watch(gen,makeQuery,onNext){
    if(gen!==generation)return;
    const s=fs();
    const unsub=s.onSnapshot(makeQuery(s),onNext,err=>{trace("listener error "+(err?.code||"?"));console.warn("HELP listener stopped; starting it again",err?.code||err);try{unsub();}catch{}setTimeout(()=>watch(gen,makeQuery,onNext),3000);});
    st.unsub.push(unsub);
  }
  async function start(uid){
    /* Signed in again as the same person (sign-in events can repeat): keep the running listeners
     * and the saved HELP contacts; restarting wiped them on screen (Android simulator, 1.1.83). */
    if(String(uid||"")&&String(uid)===st.uid&&(st.unsub.length||st.starting)){trace("start skipped (already running)");return;}
    trace("start");
    stop();st.uid=String(uid||"");if(!st.uid)return;
    st.starting=true;
    const gen=++generation;
    try{
      services=await getFirebaseServices();   /* no extra sign-in listener (it piled up on every start) */
      if(gen!==generation)return;
      await prepareUrgentAlerts();
      if(gen!==generation)return;
    }finally{if(gen===generation)st.starting=false;}
    /* HELP contacts: the server-confirmed state is the truth. Proven on the iPhone simulator (25 Nov):
     * two seconds after a confirmed Save, the listener delivered an out-of-date "no settings" answer and
     * the screen lost the contacts. So a listener answer that disagrees with what is on screen is never
     * applied directly: it is checked with one direct read from the server (one at a time), and that
     * read decides. A local Save echo (pending) is applied at once. */
    const applySettings=(d,why)=>{
      const helperUids=Array.isArray(d.helperUids)?d.helperUids.slice(0,MAX_HELPERS).map(String):[];
      st.settings={enabled:d.enabled===true&&helperUids.length>0,helperUids};
      st.settingsLoaded=true;trace(`settings applied (${why}) contacts=${helperUids.length}`);render({background:true});
    };
    const same=d=>{const h=Array.isArray(d.helperUids)?d.helperUids.map(String):[];return st.settingsLoaded&&h.length===st.settings.helperUids.length&&h.every((u,i)=>u===st.settings.helperUids[i])&&(d.enabled===true&&h.length>0)===st.settings.enabled;};
    let check=Promise.resolve();
    const confirmFromServer=fallback=>{check=check.then(async()=>{
      if(gen!==generation)return;
      const s=fs();
      try{const doc=await s.getDocFromServer(s.doc(db(),"helpSettings",st.uid));if(gen!==generation)return;applySettings(doc.exists()?doc.data():{},"server read");}
      catch(e){trace("server read failed "+(e?.code||"?"));if(!st.settingsLoaded)applySettings(fallback,"offline: last known");}
    });return check;};
    watch(gen,s=>s.doc(db(),"helpSettings",st.uid),snap=>{
      const d=snap.exists()?snap.data():{};trace(`settings snapshot exists=${snap.exists()} cache=${!!snap.metadata?.fromCache} pending=${!!snap.metadata?.hasPendingWrites} contacts=${Array.isArray(d.helperUids)?d.helperUids.length:"-"}`);
      if(snap.metadata?.hasPendingWrites){applySettings(d,"this phone's save");return;}
      if(same(d))return;
      void confirmFromServer(d);
    });
    watch(gen,s=>s.query(s.collection(db(),"helpAlerts"),s.where("senderUid","==",st.uid),s.where("state","==","open")),snap=>{
      st.mine=snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.test!==true);st.mineLoaded=true;render({background:true});
    });
    watch(gen,s=>s.query(s.collection(db(),"helpAlerts"),s.where("helperUids","array-contains",st.uid),s.where("state","==","open")),snap=>{
      st.incoming=snap.docs.map(d=>({id:d.id,...d.data()}));st.incomingLoaded=true;
      if(!openUnanswered())render({background:true});
    });
  }
  function stop(){trace("stop");generation++;st.draft="";chatView={key:"",id:"",target:null};st.starting=false;st.unsub.splice(0).forEach(u=>{try{u();}catch{}});st.mine=[];st.incoming=[];st.settings={enabled:false,helperUids:[]};st.settingsLoaded=false;st.choosing=false;
    st.mineLoaded=false;st.incomingLoaded=false;st.notifyOn=null;st.notifyDenied=false;st.helperOf=[];st.reachSent="";st.reachOf={};}
  async function people(){if(!st.people.length){try{st.people=(await listCloudUsers())||[];}catch{}}return st.people;}
  const nameOf=uid=>{const p=st.people.find(p=>String(p.uid)===String(uid));return p?.displayName||p?.email||"A FIDUNIO member";};

  /* A HELP alert nobody on this phone has answered yet opens its red screen by itself —
   * when it arrives, and again when FIDUNIO is unlocked or opened from the notification. */
  function openUnanswered(){
    if(!isUnlocked())return false;
    const a=st.incoming.find(x=>!shown.has(x.id)&&!(x.acks&&st.uid in x.acks));
    if(!a)return false;
    shown.add(a.id);void people().then(()=>openAlert(a.id));
    return true;
  }
  function afterUnlock(){shown.clear();st.incoming.forEach(a=>{if(a.acks&&st.uid in a.acks)shown.add(a.id);});openUnanswered();}

  /* The HELP chat: the direct chat with a single contact, else the HELP group. */
  async function sendToChat(helperUids,text){
    if(helperUids.length>=2){
      const gid=await chat.ensureGroup(helperUids,nameOf(st.uid)).catch(e=>{st.lastError=e?.message||String(e);return null;});
      if(gid){await chat.sendGroup(gid,text);return;}
    }
    for(const uid of helperUids){try{await chat.sendDirect(uid,text);}catch(e){st.lastError=e?.message||String(e);}}
  }
  /* Send. It counts as sent only when the server has the alert document. */
  async function sendAlert(){
    if(st.sending)return;
    const helpers=st.settings.helperUids;
    if(!helpers.length){onError("Choose your HELP contacts in Settings first.");return;}
    st.sending=true;st.lastError="";render();
    const s=fs(),ref=s.doc(s.collection(db(),"helpAlerts"));
    try{await s.setDoc(ref,{senderUid:st.uid,helperUids:helpers.slice(),state:"open",test:false,acks:{},createdAt:s.serverTimestamp()});}
    catch(e){st.sending=false;st.lastError="HELP did not go out. Check the connection and hold again.";render();return;}
    st.sending=false;render();
    const location=await currentLocation();
    await queueSend(()=>sendToChat(helpers,encodeHelpCard({alertId:ref.id,kind:"alert",location})));void queueSend(deliverPending);
    render({background:true});
  }
  async function imOk(){
    const a=st.mine[0];if(!a)return;const s=fs();
    try{await s.updateDoc(s.doc(db(),"helpAlerts",a.id),{state:"safe",closedAt:s.serverTimestamp()});}
    catch(e){onError("Could not tell them you are OK. Check the connection and try again.");return;}
    await queueSend(()=>sendToChat(a.helperUids||[],encodeHelpCard({alertId:a.id,kind:"safe"})));
    navigate("messages");
  }
  async function imComing(a){
    const s=fs();
    try{await s.updateDoc(s.doc(db(),"helpAlerts",a.id),{["acks."+st.uid]:{at:s.serverTimestamp()}});}
    catch(e){onError("Could not tell them you are coming. Check the connection and try again.");return false;}
    const text=encodeHelpCard({alertId:a.id,kind:"coming"});
    try{await queueSend(()=>sendToChild(a,text));void queueSend(deliverPending);}catch(e){trace("coming card not sent");}
    return true;
  }
  async function saveHelpers(helperUids){
    const s=fs();
    const clean=[...new Set(helperUids)].filter(u=>u&&u!==st.uid).slice(0,MAX_HELPERS);
    const added=clean.filter(u=>!st.settings.helperUids.includes(u));
    await s.setDoc(s.doc(db(),"helpSettings",st.uid),{enabled:clean.length>0,helperUids:clean,protected:false,updatedAt:s.serverTimestamp()});
    st.settings={enabled:clean.length>0,helperUids:clean.slice()};st.settingsLoaded=true;   /* the server has it */
    trace("saved contacts="+clean.length);
    if(clean.length>=2)await chat.ensureGroup(clean,nameOf(st.uid)).catch(e=>console.warn("HELP chat group",e));
    for(const uid of added){try{await chat.sendDirect(uid,encodeHelpCard({alertId:"contact",kind:"contact"}));}catch{}}
  }

  /* KISS: no account protection any more; Sign Out never needs a HELP PIN. */
  async function allowSignOut(){return true;}

  /* ---- Messages: one red HELP bar, covering nothing ---- */
  function fabMarkup(){
    if(!st.settings.enabled)return"";
    const open=st.mine.length>0;
    return `<button class="help-bar${open?" help-bar-open":""}" id="helpFab">${open?"HELP is on — open":"HELP"}</button>`;
  }
  function bannerMarkup(){return`<div class="help-notice-slot" id="helpNoticeSlot">${noticeMarkup()}</div>`;}
  /* Redraw only the HELP bar slot (same markup as a full draw). Called by app.js render() on background patches. */
  function refreshBar(){
    const slot=document.querySelector("#helpBarSlot");if(!slot)return;
    const html=fabMarkup();
    if(slot.innerHTML!==html){slot.innerHTML=html;bindShared();trace("bar redrawn "+(html?"shown":"hidden"));}
    const notice=document.querySelector("#helpNoticeSlot");
    if(notice){const n=noticeMarkup();if(notice.innerHTML!==n){notice.innerHTML=n;bindNotice();trace("notice "+(n?"shown":"hidden"));}}
  }
  function bindNotice(){document.querySelector("#helpNotifyOn")?.addEventListener("click",e=>{void turnOnNotifications(e.currentTarget);});}
  function bindShared(){
    document.querySelector("#helpFab")?.addEventListener("click",()=>{st.viewAlertId="";navigate("help");});
    bindNotice();
  }
  function openAlert(alertId){st.viewAlertId=String(alertId||"");navigate(st.mine.some(a=>a.id===alertId)?"help":"helpAlert");}

  /* ---- opening HELP from a notification (1.1.87, owner 27 Nov) ----
   * Every notification that belongs to a HELP still going on opens the big HELP screen: the HELP alarm itself and
   * the chat notifications of its conversation. Right after a cold start the open HELP alerts may not be loaded
   * yet, so this waits for the first server answer (at most 10 seconds) before deciding. */
  async function loaded(ms=10000){
    const end=Date.now()+ms;
    while(Date.now()<end&&st.uid&&!(st.mineLoaded&&st.incomingLoaded))await new Promise(r=>setTimeout(r,200));
    return st.mineLoaded&&st.incomingLoaded;
  }
  function helperView(a){st.viewAlertId=a.id;shown.add(a.id);trace("opened from notification");return"helpAlert";}
  async function viewForAlert(alertId){
    await loaded();
    const id=String(alertId||"");
    if(st.mine.some(a=>a.id===id)){st.viewAlertId=id;return"help";}
    const a=st.incoming.find(x=>x.id===id);
    return a?helperView(a):null;
  }
  async function viewForConversation(c){
    if(!c)return null;
    await loaded();
    const id=String(c.id||""),peer=String(c.peerUid||""),group=!!(c.cloudGroup||c.type==="group");
    for(const a of st.incoming){
      const t=targetForChild(a);
      if(t.group?group&&String(t.group)===id:!group&&peer===String(a.senderUid))return helperView(a);
    }
    const mine=st.mine[0];
    if(mine){
      const gid=chat.findGroup(st.uid);
      if((group&&gid&&String(gid)===id)||(!group&&(mine.helperUids||[]).map(String).includes(peer))){st.viewAlertId=mine.id;return"help";}
    }
    return null;
  }

  /* ---- notifications off (1.1.87, owner 27 Nov) ----
   * A HELP contact whose notifications are off never hears HELP. So: (1) each device reports, for its account, whether
   * notifications are on there (helpReach/{uid}.devices.{installation} = true/false); (2) anyone who is someone's
   * HELP contact, or has HELP turned on, sees a red reminder on Messages while notifications are off on this device,
   * with a button that turns them on (or opens the phone's Settings when the phone refuses); no "don't show again";
   * (3) Settings → HELP shows which chosen contacts cannot be reached. */
  let reachRun=null;
  function refreshReach(){
    if(reachRun)return reachRun;
    const gen=generation;
    reachRun=(async()=>{
      if(!st.uid||!services)return;
      let status=null;
      try{status=await notify.status();}catch(e){trace("notify status failed");}
      if(gen!==generation)return;
      if(status){
        st.notifyOn=status.on===true;st.notifyDenied=status.denied===true;
        const id=String(status.installationId||"");
        const key=id+"|"+st.notifyOn;
        if(id&&/^[A-Za-z0-9_-]{1,128}$/.test(id)&&st.reachSent!==key){
          const s=fs();
          try{await s.setDoc(s.doc(db(),"helpReach",st.uid),{devices:{[id]:st.notifyOn},updatedAt:s.serverTimestamp()},{merge:true});st.reachSent=key;trace("reach saved "+st.notifyOn);}
          catch(e){trace("reach not saved "+(e?.code||"?"));}
        }
      }
      if(gen!==generation)return;
      try{
        const s=fs();
        const snap=await s.getDocs(s.query(s.collection(db(),"helpSettings"),s.where("helperUids","array-contains",st.uid)));
        if(gen!==generation)return;
        st.helperOf=snap.docs.filter(d=>d.data()?.enabled===true).map(d=>d.id);trace("HELP contact of "+st.helperOf.length);
        if(st.helperOf.length)await people();
      }catch(e){trace("HELP contact check failed "+(e?.code||"?"));}
      if(gen!==generation)return;
      refreshBar();
    })().finally(()=>{reachRun=null;});
    return reachRun;
  }
  /* Sign Out: this device no longer counts as a way to reach this account. Best effort, never blocks Sign Out. */
  async function leaveReach(){
    try{
      const id=String(st.reachSent.split("|")[0]||"");if(!id||!st.uid||!services)return;
      const s=fs();
      await Promise.race([s.setDoc(s.doc(db(),"helpReach",st.uid),{devices:{[id]:s.deleteField()},updatedAt:s.serverTimestamp()},{merge:true}),new Promise(r=>setTimeout(r,5000))]);
    }catch(e){trace("reach leave failed");}
  }
  function noticeMarkup(){
    if(st.notifyOn!==false||!(st.settings.enabled||st.helperOf.length))return"";
    const who=joinNames(st.helperOf.map(nameOf));
    const why=st.helperOf.length?`${esc(who)} chose you as a HELP contact. You will not hear their HELP.`:"You will not hear when your HELP contacts answer.";
    return `<div class="help-notice" role="alert"><p><b>Notifications are off on this device.</b> ${why}</p>
      <button class="help-notice-btn" id="helpNotifyOn">${st.notifyDenied?"Open Settings":"Turn on notifications"}</button></div>`;
  }
  async function turnOnNotifications(btn){
    if(st.notifyDenied){notify.openSettings();return;}
    if(btn){btn.disabled=true;btn.textContent="Turning on…";}
    let ok=false,why="";try{ok=await notify.turnOn();}catch(e){trace("turn on failed");why=e?.message||String(e);}
    await refreshReach();
    if(st.notifyOn===true)return;
    if(st.notifyDenied)return;   /* refused just now: the reminder now offers "Open Settings" */
    if(btn&&btn.isConnected){btn.disabled=false;btn.textContent="Turn on notifications";}
    onError("Notifications could not be turned on"+(why?": "+why:"")+". Check the connection and try again.");
  }

  /* ---- the child's HELP screens ---- */
  /* ---- Option A (owner, 25 Nov): the HELP conversation lives on the big HELP screen.
   * It is the SAME conversation as the regular chat (same messages, same order): the big screen is only a
   * larger view of it, so everything typed or tapped here also shows in the regular chat. ---- */
  let chatView={key:"",id:"",target:null};
  function targetForMine(a){
    const h=a?.helperUids||st.settings.helperUids;
    if(h.length>=2){const gid=chat.findGroup(st.uid);if(gid)return{group:gid};}
    return h.length?{direct:h[0]}:null;
  }
  function targetForChild(a){
    if((a.helperUids||[]).length>=2){const gid=chat.findGroup(a.senderUid);if(gid)return{group:gid};}
    return{direct:a.senderUid};
  }
  /* One watch at a time, in order (serialization guideline); a later screen's watch waits for the earlier one. */
  let watchQueue=Promise.resolve();
  function watchChat(target,alertId=""){
    const key=JSON.stringify(target||null);
    if(chatView.key!==key)chatView={key,id:"",target};
    chatView.alertId=String(alertId||"");
    if(!target)return;
    watchQueue=watchQueue.then(async()=>{
      if(chatView.key!==key)return;
      try{const id=await chat.watch(target);if(chatView.key===key){chatView.id=String(id||"");refreshChatLog();}}
      catch(e){trace("help chat watch failed");}
    });
  }
  function chatLines(){
    if(!chatView.id)return'<p class="help-msg help-msg-note">Opening the conversation…</p>';
    /* KISS: only this HELP — from its HELP card on (older chat and "HELP contact" notes are left out). */
    const all=chat.messages(chatView.id)||[];
    const alertId=chatView.alertId||"";
    let from=-1;for(let i=all.length-1;i>=0;i--){const c=parseHelpCard(all[i].text);if(c&&c.kind==="alert"&&(!alertId||c.alertId===alertId)){from=i;break;}}
    const rows=(from>=0?all.slice(from):all.slice(-3)).filter(m=>parseHelpCard(m.text)?.kind!=="contact").slice(-30);
    if(!rows.length)return'<p class="help-msg help-msg-note">No messages yet.</p>';
    return rows.map(m=>{
      const card=parseHelpCard(m.text);
      const who=m.mine?"You":esc(nameOf(m.senderUid||(chatView.target?.direct)||""));
      const text=card?helpCardLines(card).map(esc).join(" "):esc(m.text||"");
      const link=card?mapLink(card.location):"";
      /* Own messages say plainly when they have not reached the server yet (owner, 26 Nov: a failed send must show here). */
      const status=!m.mine?"":m.state==="failed"?' <button type="button" class="help-retry">Not sent — tap to send again</button>':(m.state==="sending"||m.state==="queued")?' <span class="help-msg-status">Sending…</span>':"";
      return `<p class="help-msg${m.mine?" help-msg-mine":""}"><b>${who}:</b> ${text}${link?` <a href="${esc(link)}" target="_blank" rel="noopener noreferrer">Open in Maps</a>`:""}${status}</p>`;
    }).join("");
  }
  function chatPanel(){
    return `<section class="help-chat" aria-label="HELP conversation">
      <div class="help-chat-log" id="helpChatLog">${chatLines()}</div>
      <div class="help-chat-send"><textarea id="helpChatText" rows="2" placeholder="Type a message" aria-label="Type a message">${esc(st.draft||"")}</textarea>
      <button class="help-send" id="helpChatSend">Send</button></div></section>`;
  }
  function refreshChatLog(){
    const log=document.querySelector("#helpChatLog");if(!log)return;
    const html=chatLines();if(log.innerHTML!==html){log.innerHTML=html;}
    log.scrollTop=log.scrollHeight;
  }
  /* HELP messages go out one at a time, in order, and only after the conversation is open (serialization guideline;
   * owner 26 Nov: the first message typed right after HELP failed while the conversation was still opening). */
  let sendTail=Promise.resolve();
  function queueSend(work){const p=sendTail.then(()=>watchQueue).then(work);sendTail=p.catch(()=>{});return p;}
  function ownUndelivered(){return(chat.messages(chatView.id)||[]).some(m=>m.mine&&(m.state==="failed"||m.state==="queued"));}
  /* A HELP message that did not reach the server is sent again automatically (3 tries, a few seconds apart). */
  async function deliverPending(){
    for(let i=0;i<3&&chatView.id&&ownUndelivered();i++){
      await new Promise(r=>setTimeout(r,3000));
      try{await chat.retry();}catch(e){trace("retry failed");}
      refreshChatLog();
    }
  }
  function bindChatPanel(send){
    const box=document.querySelector("#helpChatText"),btn=document.querySelector("#helpChatSend");
    if(!box||!btn)return;
    box.addEventListener("input",()=>{st.draft=box.value;});
    btn.addEventListener("click",async()=>{
      const text=box.value.trim();if(!text)return;
      btn.disabled=true;st.draft="";box.value="";
      try{await queueSend(()=>send(text));}
      catch(e){onError("Not sent yet. FIDUNIO keeps trying.");}
      finally{btn.disabled=false;refreshChatLog();void queueSend(deliverPending);}
    });
    const log=document.querySelector("#helpChatLog");
    if(log){log.scrollTop=log.scrollHeight;log.addEventListener("click",e=>{if(e.target.closest(".help-retry")){e.target.closest(".help-retry").disabled=true;void queueSend(async()=>{try{await chat.retry();}catch{}refreshChatLog();});}});}
  }
  async function sendToChild(a,text){
    const t=targetForChild(a);
    if(t.group)await chat.sendGroup(t.group,text);else await chat.sendDirect(t.direct,text);
  }
  /* Background redraw on a HELP screen (new message, someone answered): if the screen itself is the same, only
   * the conversation is patched, so the text being typed and the keyboard stay put; otherwise redraw it. */
  let screenKey="";
  function backgroundRefresh(cardsForAlert){
    const route=document.body.dataset.route;
    const next=route==="helpAlert"?alertScreenKey():mineScreenKey();
    if(next===screenKey&&document.querySelector("#helpChatLog")){refreshChatLog();return;}
    if(route==="helpAlert")renderHelpAlert(cardsForAlert);else renderHelp();
  }
  function mineScreenKey(){const a=st.mine[0];return a?"mine|"+a.id+"|"+Object.keys(a.acks||{}).sort().join(","):"hold";}
  function alertScreenKey(){const a=st.incoming.find(x=>x.id===st.viewAlertId);return a?"alert|"+a.id+"|"+Object.keys(a.acks||{}).sort().join(","):"over";}
  function screen(cls,body){
    app.innerHTML=`<main class="app-shell help-shell ${cls}">${body}</main>`;
  }
  function renderHelp(){
    void people();
    const a=st.mine[0];
    if(!a){
      screen("help-hold-screen",`<div class="help-top"><button class="help-back" id="backBtn" aria-label="Back">‹</button></div>
        <h1 class="help-title">Hold the button<br>to get HELP</h1>
        <button class="help-hold" id="helpHold" aria-label="Hold for 2 seconds to send HELP"><svg viewBox="0 0 100 100" class="help-ring" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="100"/></svg><span>${st.sending?"Sending…":"HELP"}</span></button>
        <p class="help-hint">${st.lastError?esc(st.lastError):"Keep holding… the ring fills up"}</p>`);
      document.querySelector("#backBtn").onclick=()=>navigate("messages");
      const hold=document.querySelector("#helpHold");
      const begin=e=>{e.preventDefault();if(st.sending)return;hold.classList.add("holding");clearTimeout(st.holdTimer);st.holdTimer=setTimeout(()=>{hold.classList.remove("holding");void sendAlert();},HOLD_MS);};
      const end=()=>{clearTimeout(st.holdTimer);hold.classList.remove("holding");};
      hold.addEventListener("pointerdown",begin);["pointerup","pointerleave","pointercancel"].forEach(n=>hold.addEventListener(n,end));
      hold.addEventListener("contextmenu",e=>e.preventDefault());
      return;
    }
    const coming=Object.keys(a.acks||{}).filter(u=>u!==st.uid);
    const names=joinNames((a.helperUids||[]).map(nameOf));
    screenKey=mineScreenKey();
    if(coming.length){
      screen("help-green help-with-chat",`<h1 class="help-title help-title-small">${esc(joinNames(coming.map(nameOf)))} ${coming.length>1?"are":"is"} coming</h1>
        <p class="help-lead">Stay where you are.</p>
        ${chatPanel()}
        <div class="help-actions"><button class="help-ok" id="helpOk">I'm OK now</button></div>`);
    }else{
      screen("help-red help-with-chat",`<h1 class="help-title help-title-small">HELP is sent</h1>
        <p class="help-lead">${esc(names)} ${(a.helperUids||[]).length>1?"are":"is"} being called. Stay where you are.</p>
        ${chatPanel()}
        <div class="help-actions"><button class="help-ok" id="helpOk">I'm OK now</button></div>`);
    }
    bindChatPanel(text=>sendToChat(a.helperUids||[],text));
    void watchChat(targetForMine(a),a.id);
    document.querySelector("#helpOk").onclick=e=>{e.currentTarget.disabled=true;void imOk();};
  }

  /* ---- the helper's red screen ---- */
  function renderHelpAlert(cardsForAlert){
    void people();
    const a=st.incoming.find(x=>x.id===st.viewAlertId);
    if(!a){screen("help-plain",`<div class="help-top"><button class="help-back" id="backBtn" aria-label="Back">‹</button></div><p class="help-lead">This HELP is over.</p>`);document.querySelector("#backBtn").onclick=()=>navigate("messages");return;}
    const cards=cardsForAlert(a.senderUid,a.id,a.helperUids||[]);
    const where=cards.map(c=>mapLink(c.location)).find(Boolean)||"";
    const mine=!!(a.acks&&st.uid in a.acks);
    const others=Object.keys(a.acks||{}).filter(u=>u!==st.uid);
    const when=a.createdAt?.toDate?.()?new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(a.createdAt.toDate()):"";
    screenKey=alertScreenKey();
    screen(mine?"help-red help-with-chat":"help-red",`<div class="help-top"><button class="help-back" id="backBtn" aria-label="Back">‹</button></div>
      <h1 class="help-title${mine?" help-title-small":""}">${esc(nameOf(a.senderUid))} needs HELP</h1>
      ${when?`<p class="help-lead">Sent at ${esc(when)}${others.length?` · ${esc(joinNames(others.map(nameOf)))} ${others.length>1?"are":"is"} coming`:""}</p>`:""}
      ${where?`<a class="help-secondary help-map" href="${esc(where)}" target="_blank" rel="noopener noreferrer">Open in Maps</a>`:'<p class="help-box">Location is on its way…</p>'}
      ${mine?chatPanel():""}
      <div class="help-actions">${mine?'<p class="help-box">You are coming</p>':'<button class="help-ok" id="helpComing">I\'m coming</button>'}</div>`);
    document.querySelector("#backBtn").onclick=()=>navigate("messages");
    if(mine){bindChatPanel(text=>sendToChild(a,text));void watchChat(targetForChild(a),a.id);}
    document.querySelector("#helpComing")?.addEventListener("click",async e=>{e.currentTarget.disabled=true;await imComing(a);render();});
  }

  /* Background refresh of the HELP card only; never while contacts are being ticked (that would undo the ticks). */
  function refreshSettingsCard(host){if(!host||st.choosing)return;void mountSettingsCard(host);}
  /* ---- Settings → Safety → HELP (contacts list collapsed until needed, like Manage Users) ---- */
  async function mountSettingsCard(host){
    if(!host)return;await people();
    const chosen=st.settings.helperUids;trace("settings card contacts="+chosen.length+(st.settingsMsg?" ("+st.settingsMsg+")":""));
    const list=st.people.filter(p=>String(p.uid)!==st.uid);
    const summary=chosen.length?esc(joinNames(chosen.map(nameOf))):"Nobody yet";
    host.innerHTML=`<h2>HELP</h2>
      <p class="small-note">The red HELP button calls the people you choose here, with your location. Nobody chosen: no HELP button.</p>
      <p class="help-chosen"><strong>HELP contacts:</strong> ${summary}</p>
      <p class="help-unreachable" id="helpReachNote">${reachNote(chosen)}</p>
      ${st.choosing?`<div class="help-helpers">${list.length?list.map(p=>`<label class="member-option"><input type="checkbox" class="help-helper" value="${esc(p.uid)}" ${chosen.includes(String(p.uid))?"checked":""}> ${esc(p.displayName||p.email||"FIDUNIO member")}</label>`).join(""):'<p class="small-note">No FIDUNIO contacts found.</p>'}</div>
      <p class="small-note">Up to 5 people.</p>
      <div class="help-setup-actions"><button class="primary" id="helpSave">Save</button><button class="secondary" id="helpChooseCancel">Cancel</button></div>`
      :`<button class="secondary" id="helpChoose">Choose HELP contacts</button>`}
      <p class="small-note" id="helpSettingsMsg" role="status">${esc(st.settingsMsg)}</p>`;
    const msg=host.querySelector("#helpSettingsMsg");
    if(!st.choosing)void loadReach(chosen,host);
    host.querySelector("#helpChoose")?.addEventListener("click",()=>{st.choosing=true;st.settingsMsg="";void mountSettingsCard(host);});
    host.querySelector("#helpChooseCancel")?.addEventListener("click",()=>{st.choosing=false;void mountSettingsCard(host);});
    host.querySelectorAll(".help-helper").forEach(b=>b.onchange=()=>{if(host.querySelectorAll(".help-helper:checked").length>MAX_HELPERS){b.checked=false;msg.textContent="Up to 5 HELP contacts.";}});
    host.querySelector("#helpSave")?.addEventListener("click",async e=>{
      const btn=e.currentTarget;btn.disabled=true;msg.textContent="Saving…";
      try{
        await saveHelpers([...host.querySelectorAll(".help-helper:checked")].map(x=>x.value));
        st.choosing=false;st.settingsMsg="Saved.";setTimeout(()=>{st.settingsMsg="";},6000);
        const h=document.querySelector("#helpSettingsHost");if(h)void mountSettingsCard(h);
      }catch(err){btn.disabled=false;msg.textContent="Not saved: "+(err?.message||err)+". Your HELP contacts are unchanged.";}
    });
  }
  /* Contacts whose notifications are off on every device they use (or who have not opened a FIDUNIO that reports it). */
  function reachNote(chosen){
    const off=chosen.filter(u=>st.reachOf[u]===false);
    if(!off.length)return"";
    return `${esc(joinNames(off.map(nameOf)))} may not hear your HELP: notifications are off or not confirmed. Ask ${off.length>1?"them":"them"} to open FIDUNIO and turn notifications on.`;
  }
  async function loadReach(chosen,host){
    const s=fs();
    for(const uid of chosen){
      try{const d=await s.getDoc(s.doc(db(),"helpReach",uid));const v=d.exists()?d.data()?.devices:null;st.reachOf[uid]=!!(v&&Object.values(v).some(x=>x===true));}
      catch(e){trace("reach read failed "+(e?.code||"?"));delete st.reachOf[uid];}
    }
    const note=host.querySelector("#helpReachNote");if(note&&note.isConnected)note.innerHTML=reachNote(chosen);
  }
  return Object.freeze({start,stop,fabMarkup,bannerMarkup,refreshBar,backgroundRefresh,refreshSettingsCard,bindShared,openAlert,viewForAlert,viewForConversation,refreshReach,leaveReach,afterUnlock,renderHelp,renderHelpAlert,mountSettingsCard,allowSignOut,
    get enabled(){return st.settings.enabled;},get openCount(){return st.mine.length+st.incoming.length;}});
}
