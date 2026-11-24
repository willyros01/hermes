/*
 * FIDUNIO HELP alerts — the one owner of HELP state and HELP screens
 * (owner-approved build plan, Nov 24 2026).
 *
 * Data: helpSettings/{uid} (on/off, up to 5 helpers, protected account) and
 * helpAlerts/{id} (who asked, which helpers, open/safe/cancelled, who answered).
 * The message, location and Wi-Fi name never go into those documents: they are
 * sent as ordinary end-to-end encrypted direct messages (a small HELP card in the
 * chat), through the app's existing Outbox. app.js gives this module the few
 * things it needs; this module never edits app.js state directly.
 */
import {initFirebase,getFirebaseUser,listCloudUsers} from "./firebase.js";
import {mountSixDigitPinInput} from "./pin-input.js";

export const HELP_PICTURE_MESSAGES=Object.freeze([
  {id:"lost",icon:"🧭",text:"I'm lost"},
  {id:"hurt",icon:"🩹",text:"I'm hurt"},
  {id:"scared",icon:"😟",text:"I'm scared"},
  {id:"come",icon:"🏃",text:"Come now"}
]);
const HOLD_MS=2000,CANCEL_MS=5000,MAX_HELPERS=5,NOTE_MAX=100;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---- the HELP card carried inside an encrypted direct message ---- */
export function encodeHelpCard(card){
  return JSON.stringify({fidunioHelp:1,alertId:String(card.alertId),kind:String(card.kind),
    ...(card.note?{note:String(card.note).slice(0,NOTE_MAX)}:{}),
    ...(card.location?{location:{lat:Number(card.location.lat),lng:Number(card.location.lng),acc:Math.round(Number(card.location.acc)||0)}}:{}),
    ...(card.wifi?{wifi:String(card.wifi).slice(0,64)}:{}),
    ...(card.test?{test:true}:{})});
}
export function parseHelpCard(text){
  if(typeof text!=="string"||!text.startsWith('{"fidunioHelp":1'))return null;
  try{const v=JSON.parse(text);return v&&v.fidunioHelp===1&&typeof v.alertId==="string"&&["alert","note","cancel","safe","contact"].includes(v.kind)?v:null;}catch{return null;}
}
export function mapLink(location){
  if(!location||!Number.isFinite(location.lat)||!Number.isFinite(location.lng))return"";
  return `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
}
export function helpCardLines(card){
  const lines=[];
  if(card.kind==="alert")lines.push((card.test?"TEST — ":"")+"🆘 HELP alert");
  if(card.kind==="note"&&card.note)lines.push(card.note);
  if(card.kind==="cancel")lines.push("Sorry, it was a mistake. No help needed.");
  if(card.kind==="safe")lines.push("I'm safe now.");
  if(card.kind==="contact")lines.push("You are now one of my HELP contacts.");
  if(card.wifi)lines.push("Wi-Fi: "+card.wifi);
  return lines;
}
/* Chat bubble markup for a HELP card (the caller escapes nothing else). */
export function renderHelpCardBubble(card){
  const link=mapLink(card.location);
  return `<div class="help-card help-card-${esc(card.kind)}">${helpCardLines(card).map((l,i)=>`<div class="${i===0?"help-card-title":"msg-text"}">${esc(l)}</div>`).join("")}${link?`<a class="msg-link help-card-map" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Open location on a map</a>`:""}</div>`;
}
export function helpPreview(card){return card.kind==="alert"?"🆘 HELP":card.kind==="safe"?"🆘 Safe now":card.kind==="cancel"?"🆘 Cancelled":"🆘 HELP";}

/* ---- the owner ---- */
export function createHelpOwner({app,render,navigate,sendHelpText,verifyLocalPin,isWide=()=>false,isUnlocked=()=>true,shellTop,onError=m=>alert(m)}){
  const shown=new Set();
  const st={uid:"",settings:{enabled:false,helperUids:[],protected:false},settingsLoaded:false,mine:[],incoming:[],people:[],unsub:[],viewAlertId:"",holdTimer:null,cancelUntil:0,sending:false,lastError:"",sentNotes:{},settingsMsg:"",noteDraft:""};
  let services=null;
  const fs=()=>services.fsSdk,db=()=>services.db;

  async function start(uid){
    stop();st.uid=String(uid||"");if(!st.uid)return;
    services=await initFirebase();
    /* Android: HELP gets its own urgent notification channel (made once; harmless if it exists). */
    try{const fm=globalThis.Capacitor?.getPlatform?.()==="android"?globalThis.Capacitor?.Plugins?.FirebaseMessaging:null;
      if(fm?.createChannel){await fm.createChannel({id:"fidunio-help",name:"HELP alerts",description:"Urgent HELP from your family",importance:5,visibility:1,vibration:true,lights:true});
        await fm.createChannel({id:"fidunio-help-update",name:"HELP updates",description:"Who is coming, safe now",importance:4,visibility:1});}}catch{}
    const s=fs();
    st.unsub.push(s.onSnapshot(s.doc(db(),"helpSettings",st.uid),snap=>{
      const d=snap.exists()?snap.data():{};
      st.settings={enabled:d.enabled===true,helperUids:Array.isArray(d.helperUids)?d.helperUids.slice(0,MAX_HELPERS):[],protected:d.protected===true};
      st.settingsLoaded=true;render({background:true});
    },()=>{}));
    st.unsub.push(s.onSnapshot(s.query(s.collection(db(),"helpAlerts"),s.where("senderUid","==",st.uid),s.where("state","==","open")),snap=>{
      st.mine=snap.docs.map(d=>({id:d.id,...d.data()}));render({background:true});
    },()=>{}));
    st.unsub.push(s.onSnapshot(s.query(s.collection(db(),"helpAlerts"),s.where("helperUids","array-contains",st.uid),s.where("state","==","open")),snap=>{
      st.incoming=snap.docs.map(d=>({id:d.id,...d.data()}));
      /* A new HELP alert opens its HELP screen straight away (after PIN/face, as usual). */
      const fresh=st.incoming.find(a=>!shown.has(a.id)&&!(a.acks&&st.uid in a.acks));
      st.incoming.forEach(a=>shown.add(a.id));
      if(fresh&&isUnlocked()){void people().then(()=>openAlert(fresh.id));}else render({background:true});
    },()=>{}));
  }
  function stop(){st.unsub.splice(0).forEach(u=>{try{u();}catch{}});st.mine=[];st.incoming=[];st.settingsLoaded=false;}
  async function people(){if(!st.people.length){try{st.people=(await listCloudUsers())||[];}catch{}}return st.people;}
  const nameOf=uid=>{const p=st.people.find(p=>String(p.uid)===String(uid));return p?.displayName||p?.email||"A FIDUNIO member";};

  /* Location: once, with a short wait; HELP never waits for it. */
  function currentLocation(){
    return new Promise(resolve=>{
      if(!navigator.geolocation)return resolve(null);
      navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy}),()=>resolve(null),{enableHighAccuracy:true,timeout:8000,maximumAge:60000});
    });
  }
  async function currentWifi(){
    try{const plugin=globalThis.Capacitor?.Plugins?.FidunioWifi;if(!plugin?.current)return"";const r=await plugin.current();return String(r?.ssid||"").slice(0,64);}catch{return"";}
  }
  async function sendCardToHelpers(alert,card){
    const text=encodeHelpCard({...card,alertId:alert.id,test:alert.test===true});
    for(const uid of alert.helperUids){try{await sendHelpText(uid,text);}catch(e){st.lastError=e?.message||String(e);}}
  }

  /* Send the alert. It counts as sent only when the server has the alert document. */
  async function sendAlert({test=false}={}){
    if(st.sending)return;
    const helpers=st.settings.helperUids;
    if(!st.settings.enabled||!helpers.length){onError("Choose your HELP contacts in Settings first.");return;}
    st.sending=true;st.lastError="";render();
    const s=fs(),ref=s.doc(s.collection(db(),"helpAlerts"));
    const alert={id:ref.id,senderUid:st.uid,helperUids:helpers.slice(),test};
    try{
      await s.setDoc(ref,{senderUid:st.uid,helperUids:helpers.slice(),state:"open",test,acks:{},createdAt:s.serverTimestamp()});
      st.cancelUntil=Date.now()+CANCEL_MS;st.viewAlertId=ref.id;
      setTimeout(()=>render(),CANCEL_MS+50);
    }catch(e){st.sending=false;st.lastError="HELP could not be sent: "+(e?.message||e)+". Check the connection and hold again.";render();return;}
    st.sending=false;render();
    const [location,wifi]=await Promise.all([currentLocation(),currentWifi()]);
    /* The phone may have asked about location over the Cancel button: give the full 5 seconds again. */
    st.cancelUntil=Math.max(st.cancelUntil,Date.now()+CANCEL_MS);setTimeout(()=>render(),CANCEL_MS+50);
    await sendCardToHelpers(alert,{kind:"alert",location,wifi});
    render();
  }
  async function sendNote(note){
    const a=st.mine[0];if(!a)return;const text=String(note||"").trim().slice(0,NOTE_MAX);if(!text)return;
    await sendCardToHelpers(a,{kind:"note",note:text});
    (st.sentNotes[a.id]||(st.sentNotes[a.id]=[])).push(text);render();
  }
  async function close(kind){
    const a=st.mine[0];if(!a)return;const s=fs();
    try{await s.updateDoc(s.doc(db(),"helpAlerts",a.id),{state:kind==="cancel"?"cancelled":"safe",closedAt:s.serverTimestamp()});}
    catch(e){onError("Could not update the HELP alert: "+(e?.message||e));return;}
    await sendCardToHelpers(a,{kind:kind==="cancel"?"cancel":"safe"});
    st.cancelUntil=0;render();
  }
  async function acknowledge(alertId){
    const s=fs();
    try{await s.updateDoc(s.doc(db(),"helpAlerts",alertId),{["acks."+st.uid]:{at:s.serverTimestamp()}});}
    catch(e){onError("Could not tell them you are coming: "+(e?.message||e));}
  }
  async function saveSettings(next){
    const s=fs();
    const value={enabled:!!next.enabled,helperUids:[...new Set(next.helperUids||[])].filter(u=>u&&u!==st.uid).slice(0,MAX_HELPERS),protected:!!next.protected,updatedAt:s.serverTimestamp()};
    const added=value.helperUids.filter(u=>!st.settings.helperUids.includes(u));
    await s.setDoc(s.doc(db(),"helpSettings",st.uid),value);   /* resolves only when the server has it */
    for(const uid of added){try{await sendHelpText(uid,encodeHelpCard({alertId:"contact",kind:"contact"}));}catch{}}
  }

  /* PIN check in FIDUNIO's own six-digit box (a protected account's settings and Sign Out). */
  function askPin(title){
    return new Promise(resolve=>{
      const host=document.createElement("div");host.className="modal-backdrop help-pin";
      host.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="helpPinTitle"><h2 id="helpPinTitle">${esc(title)}</h2><p>Enter this account's FIDUNIO PIN.</p><div id="helpPinHost"></div><p class="warning-note" id="helpPinError" hidden>Wrong PIN.</p><div class="modal-actions"><button class="modal-cancel" id="helpPinCancel">Cancel</button></div></div>`;
      document.body.appendChild(host);
      const done=v=>{host.remove();resolve(v);};
      host.querySelector("#helpPinCancel").onclick=()=>done(false);
      mountSixDigitPinInput(host.querySelector("#helpPinHost"),{label:"FIDUNIO PIN",onComplete:async pin=>{
        if(await verifyLocalPin(pin))done(true);else{host.querySelector("#helpPinError").hidden=false;host.querySelectorAll(".pin-code-slot").forEach(x=>x.value="");host.querySelector(".pin-code-slot")?.focus();}
      }});
      host.querySelector(".pin-code-slot")?.focus();
    });
  }
  async function allowSignOut(){return !st.settings.protected||await askPin("Sign Out of a protected account");}

  /* ---- what other screens show ---- */
  function fabMarkup(){return st.settings.enabled?'<button class="help-fab" id="helpFab" aria-label="HELP">HELP</button>':"";}
  function bannerMarkup(){
    const rows=[...st.mine.map(a=>({a,mine:true})),...st.incoming.map(a=>({a,mine:false}))];
    if(!rows.length)return"";
    return `<div class="help-banners">${rows.map(({a,mine})=>`<button class="help-banner" data-help-alert="${esc(a.id)}">${mine?"Your HELP alert is open":"🆘 "+esc((a.test?"TEST — ":"")+"HELP from "+nameOf(a.senderUid))} — Open</button>`).join("")}</div>`;
  }
  function bindShared(){
    document.querySelector("#helpFab")?.addEventListener("click",()=>{st.viewAlertId="";navigate("help");});
    document.querySelectorAll("[data-help-alert]").forEach(b=>b.onclick=()=>{st.viewAlertId=b.dataset.helpAlert;navigate(st.mine.some(a=>a.id===b.dataset.helpAlert)?"help":"helpAlert");});
  }
  function openAlert(alertId){st.viewAlertId=String(alertId||"");navigate(st.mine.some(a=>a.id===alertId)?"help":"helpAlert");}

  /* ---- the HELP screen (person asking for help) ---- */
  function renderHelp(){
    void people();
    const a=st.mine[0];
    const acks=a?Object.keys(a.acks||{}):[];
    const canCancel=a&&Date.now()<st.cancelUntil;
    const body=!a?`
      <p class="help-lead">Hold the button for 2 seconds to call your HELP contacts.</p>
      <button class="help-hold" id="helpHold" aria-label="Hold for 2 seconds to send HELP"><svg viewBox="0 0 100 100" class="help-ring" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="100"/></svg><span>${st.sending?"Sending help…":"HELP"}</span></button>
      <p class="help-sub">${st.settings.helperUids.length?`Goes to: ${st.settings.helperUids.map(u=>esc(nameOf(u))).join(", ")}`:"Choose your HELP contacts in Settings first."}</p>
      ${st.lastError?`<p class="warning-note">${esc(st.lastError)}</p>`:""}`:`
      <p class="help-sent">${a.test?"TEST — ":""}Help alert sent</p>
      <p class="help-status">${acks.length?acks.map(u=>`<strong>${esc(nameOf(u))} is coming</strong>`).join("<br>"):"Waiting for someone to answer…"}</p>
      ${canCancel?'<button class="help-cancel" id="helpCancel">Cancel — it was a mistake</button>':""}
      <div class="help-pictures">${HELP_PICTURE_MESSAGES.map(p=>`<button class="help-picture${(st.sentNotes[a.id]||[]).includes(p.text)?" sent":""}" data-help-note="${esc(p.text)}"><span aria-hidden="true">${p.icon}</span>${esc(p.text)}</button>`).join("")}</div>
      <div class="help-note-row"><input class="text-input" id="helpNote" maxlength="${NOTE_MAX}" placeholder="Short message (optional)" value="${esc(st.noteDraft)}"><button class="help-note-send" id="helpNoteSend">Send</button></div>
      ${(st.sentNotes[a.id]||[]).length?`<p class="help-sub" id="helpNotesSent">Sent: ${st.sentNotes[a.id].map(esc).join(" · ")}</p>`:""}
      <button class="help-safe" id="helpSafe">I'm safe now</button>`;
    app.innerHTML=`<main class="app-shell help-shell">${shellTop("HELP",'<button class="back-btn" id="backBtn">‹</button>')}<section class="content help-content">${body}</section></main>`;
    document.querySelector("#backBtn").onclick=()=>navigate("messages");
    const hold=document.querySelector("#helpHold");
    if(hold){
      const begin=e=>{e.preventDefault();if(st.sending)return;hold.classList.add("holding");clearTimeout(st.holdTimer);st.holdTimer=setTimeout(()=>{hold.classList.remove("holding");void sendAlert();},HOLD_MS);};
      const end=()=>{clearTimeout(st.holdTimer);hold.classList.remove("holding");};
      hold.addEventListener("pointerdown",begin);["pointerup","pointerleave","pointercancel"].forEach(n=>hold.addEventListener(n,end));
      hold.addEventListener("contextmenu",e=>e.preventDefault());
    }
    document.querySelector("#helpCancel")?.addEventListener("click",()=>void close("cancel"));
    document.querySelector("#helpSafe")?.addEventListener("click",()=>void close("safe"));
    document.querySelectorAll("[data-help-note]").forEach(b=>b.onclick=async()=>{b.disabled=true;await sendNote(b.dataset.helpNote);});
    const note=document.querySelector("#helpNote"),noteBtn=document.querySelector("#helpNoteSend");
    if(note)note.oninput=()=>{st.noteDraft=note.value;};
    if(noteBtn)noteBtn.onclick=async()=>{noteBtn.disabled=true;const text=note.value;st.noteDraft="";note.value="";await sendNote(text);};
  }

  /* ---- a helper's view of one alert ---- */
  function renderHelpAlert(cardsForAlert){
    void people();
    const a=st.incoming.find(x=>x.id===st.viewAlertId);
    if(!a){app.innerHTML=`<main class="app-shell help-shell">${shellTop("HELP",'<button class="back-btn" id="backBtn">‹</button>')}<section class="content help-content"><p class="help-sub">This HELP alert is closed.</p></section></main>`;document.querySelector("#backBtn").onclick=()=>navigate("messages");return;}
    const cards=cardsForAlert(a.senderUid,a.id);
    const acks=Object.keys(a.acks||{}),mine=acks.includes(st.uid);
    const when=a.createdAt?.toDate?.()?new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(a.createdAt.toDate()):"";
    app.innerHTML=`<main class="app-shell help-shell">${shellTop("HELP",'<button class="back-btn" id="backBtn">‹</button>')}<section class="content help-content">
      <p class="help-sent">${a.test?"TEST — ":""}🆘 ${esc(nameOf(a.senderUid))} needs help</p><p class="help-sub">${esc(when)}</p>
      ${cards.length?cards.map(renderHelpCardBubble).join(""):'<p class="help-sub">Message and location are on their way…</p>'}
      <p class="help-status">${acks.length?acks.map(u=>`<strong>${esc(u===st.uid?"You are":nameOf(u)+" is")} coming</strong>`).join("<br>"):"Nobody has answered yet."}</p>
      ${mine?"":'<button class="help-onit" id="helpOnIt">I\'m on it</button>'}
    </section></main>`;
    document.querySelector("#backBtn").onclick=()=>navigate("messages");
    document.querySelector("#helpOnIt")?.addEventListener("click",async e=>{e.currentTarget.disabled=true;await acknowledge(a.id);});
  }

  /* ---- Settings card ---- */
  async function mountSettingsCard(host){
    if(!host)return;await people();
    const s=st.settings,list=st.people.filter(p=>String(p.uid)!==st.uid);
    host.innerHTML=`<div class="card help-settings"><h2>HELP Alert</h2>
      <label class="help-toggle"><input type="checkbox" id="helpEnabled" ${s.enabled?"checked":""}> Turn on HELP</label>
      <p class="small-note">A red HELP button appears on Messages. Holding it for 2 seconds alerts your HELP contacts with your location.</p>
      <h3>My HELP contacts (up to 5)</h3>
      <div class="help-helpers">${list.length?list.map(p=>`<label class="member-option"><input type="checkbox" class="help-helper" value="${esc(p.uid)}" ${s.helperUids.includes(String(p.uid))?"checked":""}> ${esc(p.displayName||p.email||"FIDUNIO member")}</label>`).join(""):'<p class="small-note">No FIDUNIO contacts found.</p>'}</div>
      <label class="help-toggle"><input type="checkbox" id="helpProtected" ${s.protected?"checked":""}> Protect this account</label>
      <p class="small-note">Sign Out and these HELP settings then need this account's PIN.</p>
      <button class="secondary" id="helpSave">Save HELP settings</button>
      <button class="secondary" id="helpTest" ${s.enabled&&s.helperUids.length?"":"disabled"}>Test my HELP alert</button>
      <p class="small-note" id="helpSettingsMsg" role="status">${esc(st.settingsMsg)}</p></div>`;
    const msg=host.querySelector("#helpSettingsMsg");
    host.querySelectorAll(".help-helper").forEach(b=>b.onchange=()=>{const n=host.querySelectorAll(".help-helper:checked").length;if(n>MAX_HELPERS){b.checked=false;msg.textContent="Up to 5 HELP contacts.";}});
    host.querySelector("#helpSave").onclick=async e=>{
      const btn=e.currentTarget;
      if(st.settings.protected&&!(await askPin("Change HELP settings")))return;
      const next={enabled:host.querySelector("#helpEnabled").checked,protected:host.querySelector("#helpProtected").checked,helperUids:[...host.querySelectorAll(".help-helper:checked")].map(x=>x.value)};
      if(next.protected&&!st.settings.protected&&!(await askPin("Protect this account")))return;
      if(next.enabled&&!next.helperUids.length){msg.textContent="Choose at least one HELP contact.";return;}
      btn.disabled=true;msg.textContent="Saving…";
      /* The screen redraws when the server confirms, so the result is kept for the redrawn card. */
      try{await saveSettings(next);st.settingsMsg="Saved.";const m=document.querySelector("#helpSettingsMsg");if(m)m.textContent="Saved.";setTimeout(()=>{st.settingsMsg="";},6000);}
      catch(err){msg.textContent="Not saved: "+(err?.message||err)+". Your previous HELP settings are unchanged.";}
      finally{btn.disabled=false;}
    };
    host.querySelector("#helpTest").onclick=()=>{navigate("help");setTimeout(()=>void sendAlert({test:true}),0);};
  }
  return Object.freeze({start,stop,fabMarkup,bannerMarkup,bindShared,openAlert,renderHelp,renderHelpAlert,mountSettingsCard,allowSignOut,get enabled(){return st.settings.enabled;},get openCount(){return st.mine.length+st.incoming.length;}});
}
