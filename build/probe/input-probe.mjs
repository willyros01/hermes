/* INVESTIGATION + FIX CHECK (Willy, 24 Nov 2026). Runs the SAME steps on the
 * released FIDUNIO and on the fix branch, on the Android emulator (Pixel) or the
 * iPhone simulator, with LOCAL demo Firebase only. Real finger gestures:
 * adb input (Android) and idb (iPhone). Each check prints EXPECTED vs OBSERVED.
 *   usage: node build/probe/input-probe.mjs android|ios OUT APP LABEL */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [platform,outArg,artifact,label]=process.argv.slice(2);
const out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(path.join(out,'native-fixture.json'),'utf8'));
if(fixture.project!=='demo-fidunio-simulator-tests')throw new Error('Refusing non-demo project');
const android=platform==='android';
const d=await import(android?'../simulator/adb.mjs':'../simulator/sim.mjs');
const APP='io.github.willyros01.fidunio';
if(android)d.use(APP);
const sleep=d.sleep;
const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8',maxBuffer:64<<20}).trim();
const adb=(...a)=>run('adb',a);
const UDID=process.env.UDID;
const idb=(...a)=>run('idb',[...a,'--udid',UDID]);
const results=[];let n=0;
const log=(s)=>{console.log(s);fs.appendFileSync(path.join(out,'probe.txt'),s+'\n');};
async function shot(name){await sleep(700);const f=String(++n).padStart(2,'0')+'-'+name+'.png';try{d.shot(path.join(out,f));}catch(e){log('shot failed '+e.message);}return f;}
const js=(s)=>d.js(s);
const present=(s)=>js(`!!document.querySelector(${JSON.stringify(s)})`);
async function until(fn,what,ms=60000){const end=Date.now()+ms;let last='';while(Date.now()<end){try{if(await fn())return;}catch(e){last=e.message;}await sleep(1000);}throw new Error('timed out: '+what+(last?' — '+last:''));}
async function check(id,what,expected,fn){
  log(`\n${id}: ${what}`);
  try{const r=await fn();results.push({id,what,expected,...r});log(`${r.ok?'AS EXPECTED':'DIFFERENT'} ${id} — observed: ${r.observed}`);}
  catch(e){results.push({id,what,expected,ok:false,observed:'TEST ERROR: '+String(e.message).slice(0,400)});log('TEST ERROR '+id+': '+e.message);try{await shot(id+'-error');}catch{}}
}

/* ---- native touch helpers ---- */
function androidNode(pred){return d.nodes().filter(pred).pop();}
async function androidLongPress(node,ms=1200){adb('shell','input','swipe',String(node.x),String(node.y),String(node.x),String(node.y),String(ms));await sleep(1500);}
function iosElements(){try{return JSON.parse(idb('ui','describe-all','--json'));}catch{const raw=idb('ui','describe-all');return raw.split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);}}
function iosFind(pred){return iosElements().find(pred);}
function centre(el){const f=el.frame||{};return{x:Math.round((f.x||0)+(f.width||0)/2),y:Math.round((f.y||0)+(f.height||0)/2)};}
async function iosTap(el,duration){const c=centre(el);idb('ui','tap',String(c.x),String(c.y),...(duration?['--duration',String(duration)]:[]));await sleep(1500);}
const iosLabel=(el)=>String(el.AXLabel||el.AXValue||el.title||'');

if(android){try{adb('shell','cmd','overlay','enable-exclusive','--category','com.android.internal.systemui.navbar.gestural');}catch{}await sleep(5000);log('navigation mode: '+adb('shell','settings','get','secure','navigation_mode'));}
/* A real finger touch counts as activity for the lock timer; scripted presses do not, so mark one. */
const touch=()=>js('window.dispatchEvent(new Event("pointerdown"));true');
/* Screen position of an element inside the app, for real finger gestures. */
async function screenPoint(selectorOrText){
  const r=await js(`(()=>{const q=${JSON.stringify(selectorOrText)};let el=q.startsWith('#')||q.startsWith('.')?document.querySelector(q):[...document.querySelectorAll('#chatArea .msg-text')].reverse().find(e=>e.textContent.includes(q));if(!el)return null;el.scrollIntoView({block:'center'});const b=el.getBoundingClientRect();const v=window.visualViewport||{offsetLeft:0,offsetTop:0};return {x:b.left+b.width/2-v.offsetLeft,y:b.top+b.height/2-v.offsetTop,left:b.left-v.offsetLeft,bottom:b.bottom-v.offsetTop,dpr:devicePixelRatio,vh:innerHeight}})()`);
  if(!r)return null;
  if(android){const wv=d.nodes().filter(n=>/WebView/.test(n.cls)).sort((a,b)=>b.h-a.h)[0];const top=wv?wv.y-Math.floor(wv.h/2):0;return{x:Math.round(r.x*r.dpr),y:Math.round(top+r.y*r.dpr)};}
  return{x:Math.round(r.x),y:Math.round(r.y),left:Math.round(r.left),bottom:Math.round(r.bottom)};
}
const hideKeyboard=async()=>{await js('(()=>{document.activeElement&&document.activeElement.blur&&document.activeElement.blur();return true})()');await sleep(1500);};
/* iPhone: find the system Paste item next to the message box by asking the touch layer what sits at each point. */
function iosFindPasteNear(p){for(let dy=8;dy<=60;dy+=6)for(let dx=-30;dx<=120;dx+=10){try{const el=JSON.parse(idb('ui','describe-point',String(p.left+dx),String(p.bottom+dy),'--json'));if(/^Paste$/.test(iosLabel(el)))return{x:p.left+dx,y:p.bottom+dy};}catch{}}return null;}
async function longPressAt(p,ms=1300){if(android)adb('shell','input','swipe',String(p.x),String(p.y),String(p.x),String(p.y),String(ms));else idb('ui','tap',String(p.x),String(p.y),'--duration',String(ms/1000));await sleep(1600);}
async function tapAt(p){if(android)adb('shell','input','tap',String(p.x),String(p.y));else idb('ui','tap',String(p.x),String(p.y));await sleep(1200);}
const openChat=async()=>{if(await present('#messageBox'))return;await js('(()=>{const r=[...document.querySelectorAll(".conversation-open,.group-list-row")][0];r&&r.click();return !!r})()');await until(()=>present('#messageBox'),'chat reopened',20000);};
/* ---- sign in and open a direct chat with Simulator Bob ---- */
log(`FIDUNIO input probe — ${platform} — ${label}`);
d.reinstall(APP,artifact);d.launch(APP);
await d.waitApp(/Terms of Use/,90000);
await d.press('#startupTermsTick');await d.press('#startupTermsAccept');
try{await until(()=>present('#joinTab'),'Join tab');}
catch(e){await shot('join-tab-missing');log('screen: '+String(await d.appText().catch(x=>x.message)).replace(/\s+/g,' ').slice(0,400));
  /* Accept once more in case the first tap landed before the screen was ready. */
  await d.press('#startupTermsTick').catch(()=>{});await d.press('#startupTermsAccept').catch(()=>{});await until(()=>present('#joinTab'),'Join tab (second try)');}await d.press('#joinTab');
await until(()=>present('#joinPinHost'),'Join form');
if(!android){/* Same warm-up the iPhone simulator suite uses before Join (local Firestore connection). */
  await js(`(() => {window.__probeRead={state:"pending"};import("./firebase.js").then(m=>m.validateInvitation(${JSON.stringify(fixture.inviteToken)})).then(()=>{window.__probeRead={state:"success"}},e=>{window.__probeRead={state:"failed",error:String(e?.code||e?.message||e)}});return true})()`);
  await sleep(12000);log('iPhone pre-Join read: '+await js('JSON.stringify(window.__probeRead)'));}
await d.fill('#inviteCode',fixture.inviteToken);await d.fill('#joinName',fixture.alice.name);
await d.fill('#joinEmail',fixture.alice.email);await d.fill('#joinPassword',fixture.alice.password);
for(let i=0;i<6;i++)await d.fill(`#joinPinHost .pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);
await d.press('#redeemBtn');
try{await until(async()=>await present('#newBtn')||await present('#tabletNewBtn'),'Messages screen',150000);}catch(e){await shot('join-stuck');log('screen: '+String(await d.appText().catch(x=>x.message)).replace(/\s+/g,' ').slice(0,500));throw e;}
log('signed in');
await d.press((await present('#newBtn'))?'#newBtn':'#tabletNewBtn');
await until(()=>js('[...document.querySelectorAll(".fidunio-recipient-choice")].some(b=>/Bob/.test(b.textContent))'),'Bob in contacts',60000);
await js('(()=>{const b=[...document.querySelectorAll(".fidunio-recipient-choice")].find(b=>/Bob/.test(b.textContent));b.click();return true})()');
await until(()=>present('#messageBox'),'chat with Bob',90000);
const sendText=async(t)=>{await d.fill('#messageBox',t);await d.press('#sendBtn');await until(()=>js(`document.querySelector("#chatArea")?.innerText.includes(${JSON.stringify(t)})`),'own message shown',60000);await sleep(1500);};
await sendText('Copy test 4417');
await shot('chat-open');
const unlockIfLocked=async()=>{const slots=await js('document.querySelectorAll(".pin-code-slot").length');if(slots===6&&!(await present('#messageBox'))&&!(await present('#newBtn'))){for(let i=0;i<6;i++)await d.fill(`.pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);await js('(()=>{const b=document.querySelector("#localPinUnlockBtn")||[...document.querySelectorAll("button")].find(x=>/unlock/i.test(x.textContent));b&&b.click();return !!b})()');await sleep(3000);}};
const isLocked=async()=>!(await present('#messageBox'))&&!(await present('#newBtn'))&&!(await present('#tabletNewBtn'))&&(await js('document.querySelectorAll(".pin-code-slot").length'))===6;

/* 1. COPY: press and hold a message; FIDUNIO's sheet should offer Copy. */
await check('COPY','Press and hold a message, tap Copy','sheet offers Copy; the phone clipboard then holds the message text',async()=>{
  await openChat();await hideKeyboard();await sleep(1000);
  /* The chat can still be settling after the keyboard closes: measure again and press once more if the sheet did not open. */
  for(let i=0;i<2&&!(await present('#pendingMessageTitle'));i++){const p=await screenPoint('Copy test 4417');if(!p)throw new Error('message bubble not on screen');await longPressAt(p);}
  const s=await shot('copy-sheet');
  const sheet=await js('document.querySelector("#pendingMessageTitle")?"open":"closed"');
  const hasCopy=await present('#modalCopy');
  if(!hasCopy){await d.press('#modalCancel').catch(()=>{});return{ok:false,observed:`action sheet ${sheet}; NO Copy button`,shots:[s]};}
  await sleep(800);{const b=await screenPoint('#modalCopy');if(b)await tapAt(b);else await d.press('#modalCopy');}
  await sleep(2000);
  let clip='';
  if(!android)clip=run('xcrun',['simctl','pbpaste',UDID]);
  else{await d.fill('#messageBox','');const bp=await screenPoint('#messageBox');await tapAt(bp);adb('shell','input','keyevent','279');await sleep(1500);clip=await js('document.querySelector("#messageBox")?.value||""');await d.fill('#messageBox','');}
  return{ok:/Copy test 4417/.test(clip),observed:`Copy button present; clipboard now: "${clip.slice(0,60)}"`,shots:[s]};
});

/* 1b. SELECT TEXT: copy only part of a message (fix branch). */
if(label==='fix')await check('SELECT-TEXT','Press and hold a message, Select Text, press and hold one word, tap Copy, then Done','only that word is copied; Done goes back to the same chat',async()=>{
  await openChat();await hideKeyboard();const p=await screenPoint('Copy test 4417');if(!p)throw new Error('message bubble not on screen');await longPressAt(p);
  if(!(await present('#modalSelectText'))){await d.press('#modalCancel').catch(()=>{});return{ok:false,observed:'no Select Text button',shots:[await shot('select-missing')]};}
  await tapAt(await screenPoint('#modalSelectText'));await until(()=>present('#selectTextBox'),'Select Text box',10000);
  const r=await js(`(()=>{const b=document.querySelector("#selectTextBox");const q=b.getBoundingClientRect();const v=window.visualViewport||{offsetLeft:0,offsetTop:0};return{x:q.left+24-v.offsetLeft,y:q.top+22-v.offsetTop,dpr:devicePixelRatio}})()`);
  let pt;if(android){const wv=d.nodes().filter(n=>/WebView/.test(n.cls)).sort((a,b)=>b.h-a.h)[0];const top=wv?wv.y-Math.floor(wv.h/2):0;pt={x:Math.round(r.x*r.dpr),y:Math.round(top+r.y*r.dpr)};}else pt={x:Math.round(r.x),y:Math.round(r.y)};
  await longPressAt(pt,1200);
  const sel=await js('(()=>{const b=document.querySelector("#selectTextBox");return b.value.slice(b.selectionStart,b.selectionEnd)})()');
  const s1=await shot('select-text-marked');
  await tapAt(await screenPoint('#selectTextCopy'));await sleep(1500);
  const note=await js('document.querySelector("#selectTextMsg")?.textContent||""');
  let clip='';if(!android)clip=run('xcrun',['simctl','pbpaste',UDID]);else clip=(note.match(/Copied: "(.*)"/)||[])[1]||'';
  await tapAt(await screenPoint('#modalCancel'));await sleep(1500);
  const back=await present('#messageBox')&&!(await present('#selectTextBox'));const s2=await shot('select-text-done');
  return{ok:!!sel&&sel.length<'Copy test 4417'.length&&clip.trim()===sel.trim()&&back,observed:`marked: "${sel}"; copied: "${clip.slice(0,40)}"; after Done: ${back?'same chat':'somewhere else'}`,shots:[s1,s2]};
});

/* 1c. LINKS: a web address is tappable, asks first, Cancel stays, Open leaves for the browser (fix branch). */
if(label==='fix')await check('LINK','Send "Visit https://example.com today", tap the link: Cancel, then tap again: Open','"Open this link?" first; Cancel stays in the chat; Open shows the web page outside FIDUNIO',async()=>{
  await openChat();await sendText('Visit https://example.com today');await hideKeyboard();
  const lp=async()=>{const r=await js(`(()=>{const a=[...document.querySelectorAll("#chatArea a.msg-link")].pop();if(!a)return null;a.id="probeLink";return true})()`);return r?await screenPoint('#probeLink'):null;};
  let p=await lp();if(!p)return{ok:false,observed:'the address is not a link',shots:[await shot('link-missing')]};
  await tapAt(p);const asked=await until(()=>present('#openLinkTitle'),'Open this link?',8000).then(()=>true,()=>false);const s1=await shot('link-ask');
  if(asked)await tapAt(await screenPoint('#modalCancel'));await sleep(1500);
  const stayed=await present('#messageBox')&&!(await present('#openLinkTitle'));
  p=await lp();await tapAt(p);await until(()=>present('#openLinkGo'),'Open button',8000).catch(()=>{});
  if(await present('#openLinkGo'))await tapAt(await screenPoint('#openLinkGo'));await sleep(6000);
  let outside='';
  if(android){const f=d.front();outside=/fidunio/.test(f)?'':f;}
  else{const els=iosElements().map(iosLabel).filter(Boolean).join(' | ');outside=/example\.com|Address|Safari|Example Domain/i.test(els)?'Safari: '+els.slice(0,80):'';}
  const s2=await shot('link-opened');
  d.launch(APP);await sleep(4000);await unlockIfLocked();
  return{ok:asked&&stayed&&!!outside,observed:`asked first: ${asked}; Cancel stayed in chat: ${stayed}; after Open: ${outside||'still in FIDUNIO'}`,shots:[s1,s2]};
});

/* 2. PASTE text into the message box with the phone's own Paste menu. */
await check('PASTE','Press and hold the message box, tap the phone\'s Paste','the copied text appears in the message box',async()=>{
  await openChat();await d.fill('#messageBox','');
  const bp=await screenPoint('#messageBox');if(!bp)throw new Error('message box not on screen');
  let menu='',copied='';
  if(android){
    /* Real typing, then the phone's own Select all + Copy, so the clipboard is set the way a person sets it. */
    await tapAt(bp);adb('shell','input','text','Paste%stest%s2286');await sleep(1200);
    adb('shell','input','keycombination','CTRL_LEFT','A');await sleep(600);adb('shell','input','keyevent','278');await sleep(800);copied='phone Copy (keyboard shortcut) used';
    await d.fill('#messageBox','');await tapAt(bp);await longPressAt(bp);await shot('android-paste-menu');
    menu='phone Paste (keyboard shortcut) used';adb('shell','input','keyevent','279');await sleep(1500);
  }else{
    execFileSync('xcrun',['simctl','pbcopy',UDID],{input:'Paste test 2286'});copied='simulator clipboard set';
    await hideKeyboard();const bp2=await screenPoint('#messageBox');await tapAt(bp2);await sleep(800);const bp3=await screenPoint('#messageBox');await longPressAt(bp3,1000);await shot('paste-menu');
    const p=iosFindPasteNear(bp3);menu=p?'Paste offered':'NO Paste found by the touch layer';if(p){await tapAt(p);await sleep(1500);}
  }
  const s=await shot('after-paste');
  const value=await js('document.querySelector("#messageBox")?.value||""');
  await d.fill('#messageBox','');
  return{ok:/Paste test 2286/.test(value),observed:`${copied}; ${menu}; message box now: "${value.slice(0,60)}"`,shots:[s]};
});

/* 3. STICKER / pasted picture: the paste carries an image file. Real keyboard
 * stickers need a real phone; this checks FIDUNIO's handling of that paste. */
await check('PICTURE-PASTE','A paste that carries a picture (what an iPhone sticker sends)','FIDUNIO sends it as a photo',async()=>{
  const before=await js('document.querySelectorAll("#chatArea .msg-row").length');
  await js(`(()=>{const b=atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);const f=new File([u],"image.png",{type:"image/png"});const dt=new DataTransfer();dt.items.add(f);const box=document.querySelector("#messageBox");box.focus();box.dispatchEvent(new ClipboardEvent("paste",{clipboardData:dt,bubbles:true,cancelable:true}));return true})()`);
  await sleep(6000);
  const after=await js('document.querySelectorAll("#chatArea .msg-row").length');
  const text=await js('[...document.querySelectorAll("#chatArea .msg-row")].slice(-1)[0]?.innerText||""');
  const s=await shot('picture-paste');
  return{ok:after>before,observed:after>before?`a new message appeared (${text.replace(/\s+/g,' ').slice(0,60)})`:'nothing was sent',shots:[s]};
});
if(android){
  await check('KEYBOARD-GIF','A GIF handed over by the keyboard (fix branch: native hand-over event)','FIDUNIO sends it as a photo',async()=>{
    const before=await js('document.querySelectorAll("#chatArea .msg-row").length');
    await js(`window.dispatchEvent(new CustomEvent("fidunio-keyboard-image",{detail:{type:"image/gif",name:"keyboard-picture.gif",data:"R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="}}));true`);
    await sleep(6000);
    const after=await js('document.querySelectorAll("#chatArea .msg-row").length');
    const s=await shot('keyboard-gif');
    return{ok:after>before,observed:after>before?'GIF message appeared':'nothing was sent',shots:[s]};
  });
  await check('KEYBOARD-GIF-OFFER','Does the message box tell the keyboard it accepts GIFs?','yes on the fix branch',async()=>{
    const box=androidNode(x=>/EditText/.test(x.cls));if(box){adb('shell','input','tap',String(box.x),String(box.y));await sleep(1500);}
    const dump=adb('shell','dumpsys','input_method');
    const has=/image\/gif/.test(dump);
    fs.writeFileSync(path.join(out,'input-method.txt'),dump);
    return{ok:has,observed:has?'GIF types offered to the keyboard':'no GIF types visible in the keyboard connection',shots:[]};
  });
}

/* 4. CAMERA: "Take a Picture" must open the camera, not the photo library. */
if(android)await check('CAMERA','Photo → Take a Picture','the camera opens',async()=>{
  await js('(()=>{const b=[...document.querySelectorAll(".tool")].find(x=>x.textContent.trim()==="Photo");b&&b.click();return !!b})()');
  await until(()=>present('#photoCameraBtn'),'Send a Picture choices',20000);
  if(android){const b=androidNode(x=>/Take a Picture/.test(x.text));if(b)adb('shell','input','tap',String(b.x),String(b.y));else await d.press('#photoCameraBtn');}
  else{const b=iosFind(e=>/Take a Picture/.test(iosLabel(e)));if(b)await iosTap(b);else await d.press('#photoCameraBtn');}
  await sleep(5000);
  const s=await shot('after-take-picture');
  let observed='',ok=false;
  if(android){const f=d.front();ok=/camera/i.test(f);observed='in front: '+f;adb('shell','input','keyevent','4');await sleep(2500);if(!/fidunio/.test(d.front()))d.launch(APP);await sleep(2500);}
  else{const els=iosElements().map(iosLabel).filter(Boolean).slice(0,25).join(' | ');ok=/camera|Cancel|shutter|Take Picture|Photo/i.test(els);observed='screen shows: '+els.slice(0,200);try{const c=iosFind(e=>/^Cancel$/.test(iosLabel(e)));if(c)await iosTap(c);}catch{}}
  await unlockIfLocked();
  return{ok,observed,shots:[s]};
});

/* 5. LEAVE AND COME BACK within the grace period (default 5 min). */
await check('GRACE','Switch to another app for ~15 s, then back','FIDUNIO opens unlocked (5 min grace)',async()=>{
  await unlockIfLocked();await touch();
  if(android){adb('shell','am','start','-W','-n','com.android.settings/.Settings');}else{run('xcrun',['simctl','launch',UDID,'com.apple.Preferences']);}
  await sleep(15000);
  d.launch(APP);await sleep(4000);
  const s=await shot('back-after-15s');const locked=await isLocked();
  return{ok:!locked,observed:locked?'LOCKED — PIN asked':'unlocked',shots:[s]};
});

/* 6. ANDROID BACK gesture inside FIDUNIO. */
if(android){
  const {w,h}=d.screenSize();
  const backSwipe=()=>adb('shell','input','touchscreen','swipe','1',String(h>>1),String(Math.round(w*0.45)),String(h>>1),'250');
  await check('BACK-CHAT','Back swipe from the edge while in a chat','goes back to the Messages list, FIDUNIO stays in front',async()=>{
    await unlockIfLocked();await openChat();await touch();
    backSwipe();await sleep(3000);
    const f=d.front(),s=await shot('back-from-chat');
    const onList=/fidunio/.test(f)&&(await present('#newBtn')||await present('#tabletNewBtn'))&&!(await present('#messageBox'));
    return{ok:onList,observed:/fidunio/.test(f)?(onList?'Messages list shown':'still on: '+(await d.appText()).replace(/\s+/g,' ').slice(0,80)):'left FIDUNIO: '+f,shots:[s]};
  });
  await check('BACK-POPUP','Back swipe with a pop-up open','the pop-up closes first',async()=>{
    await unlockIfLocked();await openChat();await touch();
    await js('(()=>{const b=[...document.querySelectorAll(".tool")].find(x=>x.textContent.trim()==="Photo");b&&b.click();return !!b})()');await sleep(1500);
    const open=await present('#photoCameraBtn');
    backSwipe();await sleep(2500);
    const closed=!(await present('#photoCameraBtn'))&&await present('#messageBox');
    const s=await shot('back-popup');
    return{ok:open&&closed,observed:`pop-up ${open?'was open':'did not open'}; after Back: ${closed?'closed, chat still shown':'not closed'}`,shots:[s]};
  });
  await check('BACK-MAIN','Back swipe on the Messages list','FIDUNIO goes to the background (still running)',async()=>{
    await unlockIfLocked();if(await present('#messageBox')){await d.press('#backBtn');await sleep(1500);}await touch();
    const onList=await present('#newBtn')||await present('#tabletNewBtn');
    backSwipe();await sleep(3000);
    const f=d.front();let pid='';try{pid=adb('shell','pidof',APP);}catch{}
    const s=await shot('back-main');
    return{ok:!/fidunio/.test(f)&&!!pid,observed:`started on ${onList?'Messages list':'another screen'}; in front: ${f}; FIDUNIO ${pid?'still running':'ENDED'}`,shots:[s]};
  });
  await check('BACK-RETURN','Return right after the Back swipe','unlocked (within grace)',async()=>{
    d.launch(APP);await sleep(3500);const locked=await isLocked();const s=await shot('return-after-back');
    return{ok:!locked,observed:locked?'LOCKED — PIN asked':'unlocked',shots:[s]};
  });
  await check('BACK-KEY','3-button Back key while in a chat','goes back to the Messages list',async()=>{
    await unlockIfLocked();await openChat();
    adb('shell','input','keyevent','4');await sleep(3000);
    const ok=/fidunio/.test(d.front())&&!(await present('#messageBox'))&&(await present('#newBtn')||await present('#tabletNewBtn'));
    const s=await shot('back-key');
    return{ok,observed:ok?'Messages list shown':'in front: '+d.front(),shots:[s]};
  });
}

/* ================= FIDUNIO HELP journeys (fix branch only) =================
 * Alice (this phone) and Simulator Bob (acted from the test computer through
 * the SAME database rules a phone uses). Location comes from the emulator /
 * simulator GPS. Real finger taps and a real 3-second press and hold. */
if(label==='fix'){
  const {initializeTestEnvironment}=await import('@firebase/rules-unit-testing');
  const {doc,getDoc,setDoc,updateDoc,addDoc,collection,getDocs,query,where,serverTimestamp}=await import('firebase/firestore');
  const env=await initializeTestEnvironment({projectId:fixture.project,firestore:{host:'127.0.0.1',port:8080}});
  const bobUid=fixture.peers.find(p=>p.label==='Bob').uid;
  const bobDb=env.authenticatedContext(bobUid).firestore();
  const admin=async fn=>{let v;await env.withSecurityRulesDisabled(async c=>{v=await fn(c.firestore());});return v;};
  const alertsFor=async field=>admin(async db=>(await getDocs(collection(db,'helpAlerts'))).docs.map(x=>({id:x.id,...x.data()})));
  /* Alice's account id, from the local test Auth (her email is in the fixture). */
  let aliceUid='';
  try{const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/'+fixture.project+'/accounts:query',{method:'POST',headers:{authorization:'Bearer owner','content-type':'application/json'},body:'{}'});const v=await r.json();aliceUid=(v.userInfo||[]).find(u=>u.email===fixture.alice.email)?.localId||'';}catch(e){log('alice lookup: '+e.message);}
  log('Alice account found: '+(aliceUid?'yes':'NO'));
  const realTap=async sel=>{const p=await screenPoint(sel);if(!p)throw new Error(sel+' not on screen');await tapAt(p);};
  const toMessages=async()=>{for(let i=0;i<4&&!(await present('#newBtn'))&&!(await present('#tabletNewBtn'));i++){if(await present('#backBtn'))await realTap('#backBtn');else break;await sleep(1200);}};
  const toSettings=async()=>{await toMessages();await realTap((await present('#settingsBtn'))?'#settingsBtn':'#tabletSettingsBtn');await until(()=>present('#helpEnabled'),'HELP card in Settings',30000);};
  /* Like a person: tap the switch's whole row (its label), then check it really changed. */
  const setBox=async(sel,want)=>{
    for(let i=0;i<3;i++){
      const on=await js(`!!document.querySelector(${JSON.stringify(sel)})?.checked`);if(on===want)return;
      const id=await js(`(()=>{const l=document.querySelector(${JSON.stringify(sel)})?.closest("label");if(!l)return "";l.id=l.id||"probeRow"+Math.random().toString(36).slice(2);return l.id})()`);
      await realTap(id?'#'+id:sel);await sleep(600);
    }
    throw new Error('could not set '+sel);
  };
  const enterPin=async()=>{await until(()=>present('#helpPinHost .pin-code-slot'),'HELP PIN box',15000);for(let i=0;i<6;i++)await d.fill(`#helpPinHost .pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);await sleep(2500);};
  const allowLocation=async ms=>{const end=Date.now()+ms;let seen=[];while(Date.now()<end){
      if(android){const b=androidNode(x=>/^(While using the app|Only this time|Allow)$/i.test(x.text||''));if(b){seen.push(b.text);adb('shell','input','tap',String(b.x),String(b.y));await sleep(1500);continue;}}
      else{const b=iosFind(e=>/^(Allow While Using App|Allow Once|Allow)$/.test(iosLabel(e)));if(b){seen.push(iosLabel(b));await iosTap(b);continue;}}
      await sleep(1000);}return seen;};
  if(android){try{adb('emu','geo','fix','-79.3832','43.6532');}catch(e){log('geo fix: '+e.message);}}
  else{try{run('xcrun',['simctl','location',UDID,'set','43.6532,-79.3832']);}catch(e){log('simctl location: '+e.message);}}
  await unlockIfLocked();

  await check('HELP-SETTINGS','Settings → HELP Alert: Turn on, tick Simulator Bob, Save','"Saved."; the server has HELP on with Bob as the only contact',async()=>{
    await toSettings();await setBox('#helpEnabled',true);
    const k=await js('[...document.querySelectorAll(".help-helpers label")].findIndex(l=>/Bob/.test(l.textContent))+1');
    if(!k)return{ok:false,observed:'Bob is not in the HELP contacts list',shots:[await shot('help-settings')]};
    await setBox(`.help-helpers label:nth-child(${k}) input`,true);
    await realTap('#helpSave');
    await until(async()=>/Saved|Not saved|Choose/.test(await js('document.querySelector("#helpSettingsMsg")?.textContent||""')),'save result',30000);
    const msg=await js('document.querySelector("#helpSettingsMsg").textContent');const s=await shot('help-settings-saved');
    const rows=await admin(async db=>(await getDocs(query(collection(db,'helpSettings'),where('helperUids','array-contains',bobUid)))).docs.map(x=>({id:x.id,...x.data()})));
    const r=rows.find(x=>x.id===aliceUid)||rows[0];aliceUid=aliceUid||r?.id||'';
    return{ok:/Saved/.test(msg)&&r?.enabled===true&&r.helperUids.length===1,observed:`screen: "${msg}"; server: ${r?`enabled=${r.enabled}, contacts=${r.helperUids.length}`:'no HELP settings saved'}`,shots:[s]};
  });

  await check('HELP-BUTTON','Back to Messages','a red HELP button is on the Messages screen',async()=>{
    await toMessages();const ok=await present('#helpFab');const s=await shot('help-fab');
    return{ok,observed:ok?'HELP button shown':'no HELP button',shots:[s]};
  });

  await check('HELP-QUICK-TAP','HELP screen: a quick tap on the big button (not held)','nothing is sent (it needs a 2-second hold)',async()=>{
    await realTap('#helpFab');await until(()=>present('#helpHold'),'HELP screen',15000);
    const before=(await alertsFor()).length;await realTap('#helpHold');await sleep(4000);
    const after=(await alertsFor()).length;const s=await shot('help-quick-tap');
    return{ok:after===before,observed:after===before?'nothing sent':'an alert WAS sent by a quick tap',shots:[s]};
  });

  let alertId='';
  await check('HELP-SEND','Press and hold the HELP button for 3 seconds; allow location when the phone asks','"Help alert sent", a Cancel button, and the server has an open alert for Bob',async()=>{
    const p=await screenPoint('#helpHold');await longPressAt(p,3000);
    const allowed=await allowLocation(15000);
    await until(()=>present('.help-sent'),'Help alert sent',30000).catch(()=>{});
    const sent=await js('document.querySelector(".help-sent")?.textContent||""');const cancel=await present('#helpCancel')||allowed.length>0;
    const s=await shot('help-sent');
    const mine=(await alertsFor()).filter(a=>a.senderUid===aliceUid&&a.state==='open'&&!a.test);
    alertId=mine[0]?.id||'';
    return{ok:/Help alert sent/.test(sent)&&!!alertId&&mine[0].helperUids.join()===bobUid,observed:`screen: "${sent||'not sent'}"; location prompts answered: ${allowed.join(', ')||'none shown'}; server: ${alertId?'open alert for Bob':'NO alert'}`,shots:[s]};
  });

  await check('HELP-PICTURE','Tap the "I\'m hurt" picture button','the button marks as sent',async()=>{
    await sleep(6000);
    const k=await js('[...document.querySelectorAll(".help-picture")].findIndex(b=>/hurt/.test(b.textContent))+1');
    if(!k)return{ok:false,observed:'no picture buttons',shots:[await shot('help-pictures')]};
    await realTap(`.help-picture:nth-child(${k})`);await until(()=>js(`document.querySelector(".help-picture:nth-child(${k})").classList.contains("sent")`),'picture sent',30000).catch(()=>{});
    const ok=await js(`document.querySelector(".help-picture:nth-child(${k})").classList.contains("sent")`);const s=await shot('help-picture');
    return{ok,observed:ok?'"I\'m hurt" sent':'not marked sent',shots:[s]};
  });

  await check('HELP-ACK','Bob answers "I\'m on it" (from his phone)','Alice\'s HELP screen shows "Simulator Bob is coming"',async()=>{
    if(!alertId)return{ok:false,observed:'no alert to answer',shots:[]};
    await updateDoc(doc(bobDb,'helpAlerts',alertId),{[`acks.${bobUid}`]:{at:serverTimestamp()}});
    await until(async()=>/Bob is coming/.test(await js('document.querySelector(".help-status")?.textContent||""')),'Bob is coming',30000).catch(()=>{});
    const t=await js('document.querySelector(".help-status")?.textContent||""');const s=await shot('help-ack');
    return{ok:/Bob is coming/.test(t),observed:`screen: "${t}"`,shots:[s]};
  });

  await check('HELP-CHAT-CARDS','Open the chat with Bob','HELP cards in the chat: the alert with "Open location on a map", and "I\'m hurt"',async()=>{
    await toMessages();await openChat();await sleep(3000);
    const t=await js('document.querySelector("#chatArea")?.innerText||""');const map=await present('#chatArea .help-card-map');
    const s=await shot('help-chat-cards');
    return{ok:/HELP/.test(t)&&map&&/hurt/.test(t),observed:`${map?'map link shown':'NO map link'}; chat text: ${t.replace(/\s+/g,' ').slice(-160)}`,shots:[s]};
  });

  await check('HELP-SAFE','Open the HELP alert from the banner, tap "I\'m safe now"','the alert closes (server: safe); HELP screen is back to the big button',async()=>{
    await toMessages();await realTap('.help-banner');await until(()=>present('#helpSafe'),'I\'m safe now',15000);
    await realTap('#helpSafe');await until(()=>present('#helpHold'),'HELP button again',20000).catch(()=>{});
    const a=(await alertsFor()).find(x=>x.id===alertId);const back=await present('#helpHold');const s=await shot('help-safe');
    return{ok:a?.state==='safe'&&back,observed:`server: ${a?.state}; screen: ${back?'big HELP button':'still the alert'}`,shots:[s]};
  });

  await check('HELP-INCOMING','Bob sends HELP to Alice (from his phone)','Alice\'s FIDUNIO opens "Simulator Bob needs help" by itself; "I\'m on it" tells the server',async()=>{
    await toMessages();
    await setDoc(doc(bobDb,'helpSettings',bobUid),{enabled:true,helperUids:[aliceUid],protected:false,updatedAt:serverTimestamp()});
    const ref=await addDoc(collection(bobDb,'helpAlerts'),{senderUid:bobUid,helperUids:[aliceUid],state:'open',test:false,acks:{},createdAt:serverTimestamp()});
    await until(()=>present('#helpOnIt'),'incoming HELP screen',30000).catch(()=>{});
    const title=await js('document.querySelector(".help-sent")?.textContent||""');const s1=await shot('help-incoming');
    if(!(await present('#helpOnIt')))return{ok:false,observed:`screen: "${title||'HELP screen did not open'}"`,shots:[s1]};
    await realTap('#helpOnIt');await sleep(4000);
    const a=(await getDoc(doc(bobDb,'helpAlerts',ref.id))).data();const s2=await shot('help-onit');
    await updateDoc(doc(bobDb,'helpAlerts',ref.id),{state:'safe',closedAt:serverTimestamp()});
    return{ok:/Bob needs help/.test(title)&&!!a?.acks?.[aliceUid],observed:`opened: "${title}"; server: ${a?.acks?.[aliceUid]?'Alice is on it':'no answer recorded'}`,shots:[s1,s2]};
  });

  await check('HELP-TEST','Settings → "Test my HELP alert", then "Cancel — it was a mistake"','TEST alert sent, then cancelled (server: cancelled)',async()=>{
    await toSettings();await realTap('#helpTest');
    /* Like a person: answer the phone's location question if it shows, and tap Cancel as soon as it is there. */
    let t='',s1='';const end=Date.now()+20000;
    while(Date.now()<end){
      if((await allowLocation(300)).length)continue;
      if(await present('#helpCancel')){t=await js('document.querySelector(".help-sent")?.textContent||""');await realTap('#helpCancel');s1=await shot('help-test');break;}
      await sleep(400);
    }
    await sleep(3000);
    const a=(await alertsFor()).filter(x=>x.senderUid===aliceUid&&x.test===true).pop();const s2=await shot('help-test-cancelled');
    return{ok:/TEST/.test(t)&&a?.state==='cancelled',observed:`screen: "${t||'no Cancel button seen'}"; server: ${a?a.state:'no test alert'}`,shots:[s1,s2].filter(Boolean)};
  });

  await check('HELP-PROTECT','Settings: tick "Protect this account", Save (asks PIN), then try Sign Out','PIN asked to protect; Sign Out then asks the PIN, and Cancel keeps Alice signed in',async()=>{
    await toSettings();await setBox('#helpProtected',true);await realTap('#helpSave');
    const asked=await until(()=>present('#helpPinHost'),'PIN box',15000).then(()=>true,()=>false);
    if(asked)await enterPin();
    await until(async()=>/Saved|Not saved/.test(await js('document.querySelector("#helpSettingsMsg")?.textContent||""')),'saved',20000).catch(()=>{});
    const r=aliceUid?await admin(async db=>(await getDoc(doc(db,'helpSettings',aliceUid))).data()):null;
    const out=(await present('#firebaseSignOutBtn'))?'#firebaseSignOutBtn':'#fidunioMainSignOutBtn';
    let signOutAsked=false;
    if(await present(out)){await realTap(out);signOutAsked=await until(()=>js('/protected account/.test(document.querySelector("#helpPinTitle")?.textContent||"")'),'Sign Out PIN',10000).then(()=>true,()=>false);}
    const s=await shot('help-protect-signout');
    if(await present('#helpPinCancel'))await realTap('#helpPinCancel');await sleep(2500);
    const still=await present('#helpEnabled')||await present('#newBtn')||await present('#tabletNewBtn');
    return{ok:asked&&r?.protected===true&&signOutAsked&&still,observed:`PIN asked to protect: ${asked}; server protected=${r?.protected}; Sign Out asked PIN: ${signOutAsked}; after Cancel still signed in: ${still}`,shots:[s]};
  });
  await env.cleanup().catch(()=>{});
}

const lines=[`# FIDUNIO input probe — ${platform} — ${label}`,'','| Check | What | Expected | Observed | |','|---|---|---|---|---|'];
for(const r of results)lines.push(`| ${r.id} | ${r.what} | ${r.expected} | ${String(r.observed).replace(/\|/g,'/')} | ${r.ok?'as expected':'**DIFFERENT**'} |`);
lines.push('');for(const r of results)for(const s of r.shots||[])lines.push(`### ${r.id} — ${s}`,'',`![${s}](${s})`,'');
fs.writeFileSync(path.join(out,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({platform,label,results},null,2));
log('\nRESULT: probe finished');
process.exit(0);
