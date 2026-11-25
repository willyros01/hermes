/*
 * FIDUNIO HELP — KISS version (owner storyboard, Nov 24 2026; owner-authorized rebuild Nov 25).
 * The one owner of HELP state and HELP screens. One action per screen, words a child can read.
 *
 * Child:  Messages → red HELP bar → hold 2 s → "HELP is sent" (Write a message / I'm OK now)
 *         → green "<name> is coming" (Write a message / I'm OK now).
 * Helper: notification "HELP — <name>" → red "<name> needs HELP" (map, Open in Maps, I'm coming)
 *         → the HELP chat.
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
 *        findGroup(ownerUid)->groupId|null, openDirect(uid), openConversation(id)} — app.js owns chats. */
export function createHelpOwner({app,render,navigate,chat,shellTop,isUnlocked=()=>true,onError=m=>alert(m)}){
  const shown=new Set();
  const st={uid:"",settings:{enabled:false,helperUids:[]},settingsLoaded:false,mine:[],incoming:[],people:[],unsub:[],
    viewAlertId:"",holdTimer:null,sending:false,lastError:"",settingsMsg:"",choosing:false};
  let services=null,generation=0;
  const fs=()=>services.fsSdk,db=()=>services.db;

  /* A listener that stops on an error is started again after a short wait (same account only). */
  function watch(gen,makeQuery,onNext){
    if(gen!==generation)return;
    const s=fs();
    const unsub=s.onSnapshot(makeQuery(s),onNext,err=>{console.warn("HELP listener stopped; starting it again",err?.code||err);try{unsub();}catch{}setTimeout(()=>watch(gen,makeQuery,onNext),3000);});
    st.unsub.push(unsub);
  }
  async function start(uid){
    /* Signed in again as the same person (sign-in events can repeat): keep the running listeners
     * and the saved HELP contacts; restarting wiped them on screen (Android simulator, 1.1.83). */
    if(String(uid||"")&&String(uid)===st.uid&&(st.unsub.length||st.starting))return;
    stop();st.uid=String(uid||"");if(!st.uid)return;
    st.starting=true;
    const gen=++generation;
    try{
      services=await getFirebaseServices();   /* no extra sign-in listener (it piled up on every start) */
      if(gen!==generation)return;
      await prepareUrgentAlerts();
      if(gen!==generation)return;
    }finally{if(gen===generation)st.starting=false;}
    watch(gen,s=>s.doc(db(),"helpSettings",st.uid),snap=>{
      /* "Not in this phone's cache" is not "no HELP contacts": wait for the server's answer. */
      if(!snap.exists()&&snap.metadata?.fromCache&&st.settingsLoaded)return;
      const d=snap.exists()?snap.data():{};
      const helperUids=Array.isArray(d.helperUids)?d.helperUids.slice(0,MAX_HELPERS):[];
      st.settings={enabled:d.enabled===true&&helperUids.length>0,helperUids};
      st.settingsLoaded=true;render({background:true});
    });
    watch(gen,s=>s.query(s.collection(db(),"helpAlerts"),s.where("senderUid","==",st.uid),s.where("state","==","open")),snap=>{
      st.mine=snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.test!==true);render({background:true});
    });
    watch(gen,s=>s.query(s.collection(db(),"helpAlerts"),s.where("helperUids","array-contains",st.uid),s.where("state","==","open")),snap=>{
      st.incoming=snap.docs.map(d=>({id:d.id,...d.data()}));
      if(!openUnanswered())render({background:true});
    });
  }
  function stop(){generation++;st.starting=false;st.unsub.splice(0).forEach(u=>{try{u();}catch{}});st.mine=[];st.incoming=[];st.settings={enabled:false,helperUids:[]};st.settingsLoaded=false;st.choosing=false;}
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
  function openMyChat(){
    const h=st.settings.helperUids;
    if(h.length===1)return chat.openDirect(h[0]);
    void chat.ensureGroup(h,nameOf(st.uid)).then(gid=>gid?chat.openConversation(gid):chat.openDirect(h[0])).catch(()=>chat.openDirect(h[0]));
  }
  function openChildChat(a){
    if((a.helperUids||[]).length>=2){const gid=chat.findGroup(a.senderUid);if(gid)return chat.openConversation(gid);}
    chat.openDirect(a.senderUid);
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
    await sendToChat(helpers,encodeHelpCard({alertId:ref.id,kind:"alert",location}));
    render({background:true});
  }
  async function imOk(){
    const a=st.mine[0];if(!a)return;const s=fs();
    try{await s.updateDoc(s.doc(db(),"helpAlerts",a.id),{state:"safe",closedAt:s.serverTimestamp()});}
    catch(e){onError("Could not tell them you are OK. Check the connection and try again.");return;}
    await sendToChat(a.helperUids||[],encodeHelpCard({alertId:a.id,kind:"safe"}));
    navigate("messages");
  }
  async function imComing(a){
    const s=fs();
    try{await s.updateDoc(s.doc(db(),"helpAlerts",a.id),{["acks."+st.uid]:{at:s.serverTimestamp()}});}
    catch(e){onError("Could not tell them you are coming. Check the connection and try again.");return false;}
    const text=encodeHelpCard({alertId:a.id,kind:"coming"});
    try{
      if((a.helperUids||[]).length>=2){const gid=chat.findGroup(a.senderUid);if(gid)await chat.sendGroup(gid,text);else await chat.sendDirect(a.senderUid,text);}
      else await chat.sendDirect(a.senderUid,text);
    }catch{}
    return true;
  }
  async function saveHelpers(helperUids){
    const s=fs();
    const clean=[...new Set(helperUids)].filter(u=>u&&u!==st.uid).slice(0,MAX_HELPERS);
    const added=clean.filter(u=>!st.settings.helperUids.includes(u));
    await s.setDoc(s.doc(db(),"helpSettings",st.uid),{enabled:clean.length>0,helperUids:clean,protected:false,updatedAt:s.serverTimestamp()});
    st.settings={enabled:clean.length>0,helperUids:clean.slice()};st.settingsLoaded=true;   /* the server has it */
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
  function bannerMarkup(){return"";}
  function bindShared(){
    document.querySelector("#helpFab")?.addEventListener("click",()=>{st.viewAlertId="";navigate("help");});
  }
  function openAlert(alertId){st.viewAlertId=String(alertId||"");navigate(st.mine.some(a=>a.id===alertId)?"help":"helpAlert");}

  /* ---- the child's HELP screens ---- */
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
    if(coming.length){
      screen("help-green",`<h1 class="help-title">${esc(joinNames(coming.map(nameOf)))}<br>${coming.length>1?"are":"is"} coming</h1>
        <p class="help-box">Stay where you are.</p>
        <div class="help-actions"><button class="help-secondary" id="helpWrite">Write a message</button><button class="help-ok" id="helpOk">I'm OK now</button></div>`);
    }else{
      screen("help-red",`<h1 class="help-title">HELP is sent</h1>
        <p class="help-lead">${esc(names)}<br>${(a.helperUids||[]).length>1?"are":"is"} being called</p>
        <p class="help-box">Waiting for an answer…<br>Stay where you are.</p>
        <div class="help-actions"><button class="help-secondary" id="helpWrite">Write a message</button><button class="help-ok" id="helpOk">I'm OK now</button></div>`);
    }
    document.querySelector("#helpWrite").onclick=()=>openMyChat();
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
    screen("help-red",`<div class="help-top"><button class="help-back" id="backBtn" aria-label="Back">‹</button></div>
      <h1 class="help-title">${esc(nameOf(a.senderUid))}<br>needs HELP</h1>
      ${when?`<p class="help-lead">Sent at ${esc(when)}</p>`:""}
      ${where?`<a class="help-secondary help-map" href="${esc(where)}" target="_blank" rel="noopener noreferrer">Open in Maps</a>`:'<p class="help-box">Location is on its way…</p>'}
      ${others.length?`<p class="help-box">${esc(joinNames(others.map(nameOf)))} ${others.length>1?"are":"is"} coming</p>`:""}
      <div class="help-actions">${mine?'<p class="help-box">You are coming</p><button class="help-ok" id="helpWrite">Write a message</button>':'<button class="help-ok" id="helpComing">I\'m coming</button>'}</div>`);
    document.querySelector("#backBtn").onclick=()=>navigate("messages");
    document.querySelector("#helpWrite")?.addEventListener("click",()=>openChildChat(a));
    document.querySelector("#helpComing")?.addEventListener("click",async e=>{e.currentTarget.disabled=true;if(await imComing(a))openChildChat(a);});
  }

  /* ---- Settings → Safety → HELP (contacts list collapsed until needed, like Manage Users) ---- */
  async function mountSettingsCard(host){
    if(!host)return;await people();
    const chosen=st.settings.helperUids;
    const list=st.people.filter(p=>String(p.uid)!==st.uid);
    const summary=chosen.length?esc(joinNames(chosen.map(nameOf))):"Nobody yet";
    host.innerHTML=`<h2>HELP</h2>
      <p class="small-note">The red HELP button calls the people you choose here, with your location. Nobody chosen: no HELP button.</p>
      <p class="help-chosen"><strong>HELP contacts:</strong> ${summary}</p>
      ${st.choosing?`<div class="help-helpers">${list.length?list.map(p=>`<label class="member-option"><input type="checkbox" class="help-helper" value="${esc(p.uid)}" ${chosen.includes(String(p.uid))?"checked":""}> ${esc(p.displayName||p.email||"FIDUNIO member")}</label>`).join(""):'<p class="small-note">No FIDUNIO contacts found.</p>'}</div>
      <p class="small-note">Up to 5 people.</p>
      <div class="help-setup-actions"><button class="primary" id="helpSave">Save</button><button class="secondary" id="helpChooseCancel">Cancel</button></div>`
      :`<button class="secondary" id="helpChoose">Choose HELP contacts</button>`}
      <p class="small-note" id="helpSettingsMsg" role="status">${esc(st.settingsMsg)}</p>`;
    const msg=host.querySelector("#helpSettingsMsg");
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
  return Object.freeze({start,stop,fabMarkup,bannerMarkup,bindShared,openAlert,afterUnlock,renderHelp,renderHelpAlert,mountSettingsCard,allowSignOut,
    get enabled(){return st.settings.enabled;},get openCount(){return st.mine.length+st.incoming.length;}});
}
