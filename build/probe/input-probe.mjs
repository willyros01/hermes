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
  /* Scroll it into view first and let the scrolling stop, then measure (a moving page made taps miss). */
  await js(`(()=>{const q=${JSON.stringify(selectorOrText)};const el=q.startsWith('#')||q.startsWith('.')?document.querySelector(q):[...document.querySelectorAll('#chatArea .msg-text')].reverse().find(e=>e.textContent.includes(q));if(el)el.scrollIntoView({block:'center',behavior:'instant'});return true})()`);
  await sleep(700);
  const r=await js(`(()=>{const q=${JSON.stringify(selectorOrText)};let el=q.startsWith('#')||q.startsWith('.')?document.querySelector(q):[...document.querySelectorAll('#chatArea .msg-text')].reverse().find(e=>e.textContent.includes(q));if(!el)return null;const b=el.getBoundingClientRect();const v=window.visualViewport||{offsetLeft:0,offsetTop:0};return {x:b.left+b.width/2-v.offsetLeft,y:b.top+b.height/2-v.offsetTop,left:b.left-v.offsetLeft,bottom:b.bottom-v.offsetTop,dpr:devicePixelRatio,vh:innerHeight}})()`);
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
/* Start-up serialization (1.1.83): each start-up step must have started exactly once for this sign-in. */
if(label==='fix')await check('STARTUP-ONCE','After sign-in, count how many times each start-up step started','every step exactly once, in order',async()=>{
  await sleep(20000);
  const steps=await js('JSON.stringify(globalThis.FIDUNIO_STARTUP_STEPS||[])').then(JSON.parse).catch(()=>[]);
  const counts={};for(const n of steps)counts[n]=(counts[n]||0)+1;
  const need=['notification upkeep','conversations','blocked users','groups','HELP','activation','publish E2EE key'];
  const ok=need.every(n=>counts[n]===1)&&Object.values(counts).every(c=>c===1);
  return{ok,observed:'order: '+steps.join(' → ')+' | counts: '+JSON.stringify(counts),shots:[]};
});
await d.press((await present('#newBtn'))?'#newBtn':'#tabletNewBtn');
await until(()=>js('[...document.querySelectorAll(".fidunio-recipient-choice")].some(b=>/Bob/.test(b.textContent))'),'Bob in contacts',60000);
/* The contact list can redraw while loading: tap Bob once he is really there. */
await until(()=>js('(()=>{const b=[...document.querySelectorAll(".fidunio-recipient-choice")].find(b=>/Bob/.test(b.textContent));if(!b)return false;b.click();return true})()'),'tap Bob',30000);
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
  const goShown=await present('#openLinkGo');if(goShown)await tapAt(await screenPoint('#openLinkGo'));await sleep(3000);
  const goClosed=!(await present('#openLinkGo').catch(()=>false));log('Open button shown: '+goShown+'; pop-up closed after the tap: '+goClosed);await sleep(3000);
  let outside='',s2='';
  try{
    if(android){const f=d.front();outside=/fidunio/.test(f)?'':f;}
    else{/* Safari may still be opening: ask the touch layer a few times. */
      for(let i=0;i<10&&!outside;i++){try{const els=iosElements().map(iosLabel).filter(Boolean).join(' | ');if(/example\.com|Address|Safari|Example Domain/i.test(els))outside='Safari: '+els.slice(0,80);}catch{}
        if(!outside&&d.running?.('com.apple.mobilesafari'))outside='Safari is running (opened by FIDUNIO)';if(!outside)await sleep(2000);}}
    s2=await shot('link-opened');
  }finally{d.launch(APP);await sleep(4000);if(!android)d.disconnect?.();await unlockIfLocked();}
  return{ok:asked&&stayed&&!!outside,observed:`asked first: ${asked}; Cancel stayed in chat: ${stayed}; after Open: ${outside||'still in FIDUNIO'}`,shots:[s1,s2].filter(Boolean)};
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
  const toSettings=async()=>{await toMessages();await realTap((await present('#settingsBtn'))?'#settingsBtn':'#tabletSettingsBtn');await until(()=>present('#helpSettingsHost'),'HELP card in Settings',30000);await until(()=>js('!!document.querySelector("#helpChoose,#helpSave")'),'HELP card filled',20000);};
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

  /* ---- KISS HELP (1.1.83): Choose → tick → Save; red HELP bar; hold 2 s; red "HELP is sent";
   * Write a message → the HELP chat; helper answers → green "<name> is coming"; I'm OK now. ---- */
  await check('HELP-SETTINGS','Settings → HELP: the contacts list is closed; tap "Choose HELP contacts", tick Simulator Bob, Save','list closed at first; "Saved."; the server has Bob as the only HELP contact',async()=>{
    await toSettings();
    const closed=!(await present('.help-helper'))&&await present('#helpChoose');
    const s0=await shot('help-settings-closed');
    await realTap('#helpChoose');await until(()=>present('.help-helper'),'contacts list',15000);
    const k=await js('[...document.querySelectorAll(".help-helpers label")].findIndex(l=>/Bob/.test(l.textContent))+1');
    if(!k)return{ok:false,observed:'Bob is not in the HELP contacts list',shots:[s0,await shot('help-settings')]};
    await setBox(`.help-helpers label:nth-child(${k}) input`,true);
    await realTap('#helpSave');
    await until(async()=>/Saved|Not saved/.test(await js('document.querySelector("#helpSettingsMsg")?.textContent||""')),'save result',30000);
    const msg=await js('document.querySelector("#helpSettingsMsg").textContent');
    const chosen=await js('document.querySelector(".help-chosen")?.textContent||""');const s=await shot('help-settings-saved');
    const rows=await admin(async db=>(await getDocs(query(collection(db,'helpSettings'),where('helperUids','array-contains',bobUid)))).docs.map(x=>({id:x.id,...x.data()})));
    const r=rows.find(x=>x.id===aliceUid)||rows[0];aliceUid=aliceUid||r?.id||'';
    return{ok:closed&&/Saved/.test(msg)&&/Bob/.test(chosen)&&r?.enabled===true&&r.helperUids.length===1,observed:`list closed at first: ${closed}; screen: "${msg}", "${chosen.trim()}"; server: ${r?`enabled=${r.enabled}, contacts=${r.helperUids.length}`:'no HELP settings saved'}`,shots:[s0,s]};
  });

  await check('HELP-BAR','Back to Messages','one red HELP bar on the Messages screen, no banners',async()=>{
    await toMessages();const ok=await present('#helpFab.help-bar');const banners=await present('.help-banner');const s=await shot('help-bar');
    return{ok:ok&&!banners,observed:`${ok?'HELP bar shown':'no HELP bar'}; banners: ${banners?'YES':'none'}`,shots:[s]};
  });

  await check('HELP-QUICK-TAP','HELP screen: a quick tap on the big button (not held)','nothing is sent (it needs a 2-second hold)',async()=>{
    await realTap('#helpFab');await until(()=>present('#helpHold'),'HELP screen',15000);
    const before=(await alertsFor()).length;await realTap('#helpHold');await sleep(4000);
    const after=(await alertsFor()).length;const s=await shot('help-quick-tap');
    return{ok:after===before,observed:after===before?'nothing sent':'an alert WAS sent by a quick tap',shots:[s]};
  });

  let alertId='';
  await check('HELP-SEND','Press and hold the HELP button for 3 seconds; allow location when the phone asks','red "HELP is sent — Simulator Bob is being called", "Write a message", "I\'m OK now"; server has an open alert for Bob',async()=>{
    const p=await screenPoint('#helpHold');await longPressAt(p,3000);
    const allowed=await allowLocation(12000);
    await until(()=>present('#helpOk'),'HELP is sent',30000).catch(()=>{});
    const t=await js('document.querySelector(".help-shell")?.innerText||""');const s=await shot('help-sent');
    const mine=(await alertsFor()).filter(a=>a.senderUid===aliceUid&&a.state==='open');
    alertId=mine[0]?.id||'';
    const ok=/HELP is sent/.test(t)&&/Bob/.test(t)&&/being called/.test(t)&&await present('#helpWrite')&&await present('#helpOk')&&!!alertId&&mine[0].helperUids.join()===bobUid;
    return{ok,observed:`screen: "${t.replace(/\s+/g,' ').slice(0,120)}"; location prompts answered: ${allowed.join(', ')||'none shown'}; server: ${alertId?'open alert for Bob':'NO alert'}`,shots:[s]};
  });

  await check('HELP-WRITE','Tap "Write a message", type and send "Where are you?"','the HELP chat with Bob opens, with the HELP card and the map link; the message is sent',async()=>{
    await sleep(5000);await realTap('#helpWrite');await until(()=>present('#messageBox'),'HELP chat',20000);
    await sendText('Help chat 7731');await hideKeyboard();
    const t=await js('document.querySelector("#chatArea")?.innerText||""');const map=await present('#chatArea .help-card-map');const s=await shot('help-chat');
    const title=await js('(document.querySelector(".chat-title,.app-shell h1,.topbar h1")?.textContent||"").trim()');
    return{ok:/HELP/.test(t)&&/Help chat 7731/.test(t),observed:`chat: "${title}"; ${map?'map link shown':'no map link (no location in the emulator)'}; text: ${t.replace(/\s+/g,' ').slice(-140)}`,shots:[s]};
  });

  await check('HELP-COMING-SEEN','Bob answers "I\'m coming" (from his phone); Alice opens the HELP bar','green "Simulator Bob is coming", "Write a message", "I\'m OK now"',async()=>{
    if(!alertId)return{ok:false,observed:'no alert to answer',shots:[]};
    await updateDoc(doc(bobDb,'helpAlerts',alertId),{[`acks.${bobUid}`]:{at:serverTimestamp()}});
    await toMessages();const bar=await js('document.querySelector("#helpFab")?.textContent||""');await realTap('#helpFab');
    await until(async()=>/Bob\s*is coming/.test(await js('document.querySelector(".help-shell")?.innerText||""')),'Bob is coming',30000).catch(()=>{});
    const t=await js('document.querySelector(".help-shell")?.innerText||""');const green=await present('.help-green');const s=await shot('help-coming');
    return{ok:green&&/Bob\s*is coming/.test(t)&&await present('#helpOk'),observed:`bar said: "${bar}"; screen: "${t.replace(/\s+/g,' ').slice(0,100)}"; green: ${green}`,shots:[s]};
  });

  await check('HELP-OK','Tap "I\'m OK now"','the alert closes (server: safe); back on Messages with the plain HELP bar',async()=>{
    await realTap('#helpOk');await until(()=>present('#newBtn').then(a=>a||present('#tabletNewBtn')),'Messages',20000).catch(()=>{});await sleep(2500);
    const a=(await alertsFor()).find(x=>x.id===alertId);const bar=await js('document.querySelector("#helpFab")?.textContent||""');const s=await shot('help-ok');
    return{ok:a?.state==='safe'&&bar.trim()==='HELP',observed:`server: ${a?.state}; bar: "${bar}"`,shots:[s]};
  });

  await check('HELP-INCOMING','Bob sends HELP to Alice (from his phone)','Alice\'s FIDUNIO opens the red "Simulator Bob needs HELP" by itself; "I\'m coming" tells the server and opens the chat with Bob',async()=>{
    await toMessages();
    await setDoc(doc(bobDb,'helpSettings',bobUid),{enabled:true,helperUids:[aliceUid],protected:false,updatedAt:serverTimestamp()});
    const ref=await addDoc(collection(bobDb,'helpAlerts'),{senderUid:bobUid,helperUids:[aliceUid],state:'open',test:false,acks:{},createdAt:serverTimestamp()});
    await until(()=>present('#helpComing'),'incoming HELP screen',30000).catch(()=>{});
    const t=await js('document.querySelector(".help-shell")?.innerText||""');const s1=await shot('help-incoming');
    if(!(await present('#helpComing')))return{ok:false,observed:`screen: "${t.replace(/\s+/g,' ').slice(0,100)||'HELP screen did not open'}"`,shots:[s1]};
    await realTap('#helpComing');await until(()=>present('#messageBox'),'chat with Bob',20000).catch(()=>{});
    const a=(await getDoc(doc(bobDb,'helpAlerts',ref.id))).data();const chat=await present('#messageBox');const s2=await shot('help-im-coming');
    await updateDoc(doc(bobDb,'helpAlerts',ref.id),{state:'safe',closedAt:serverTimestamp()});
    return{ok:/Bob\s*needs HELP/.test(t)&&!!a?.acks?.[aliceUid]&&chat,observed:`opened: "${t.replace(/\s+/g,' ').slice(0,80)}"; server: ${a?.acks?.[aliceUid]?'Alice is coming':'no answer recorded'}; chat opened: ${chat}`,shots:[s1,s2]};
  });

  await check('HELP-SIGNOUT','Settings: Sign Out button','no PIN asked for Sign Out (protection removed); not tapped',async()=>{
    await toSettings();const out=(await present('#firebaseSignOutBtn'))||(await present('#fidunioMainSignOutBtn'));
    const gone=!(await present('#helpProtected'))&&!(await present('#helpTest'));const s=await shot('help-settings-kiss');
    return{ok:out&&gone,observed:`Sign Out shown: ${out}; Protect/Test removed: ${gone}`,shots:[s]};
  });
  await env.cleanup().catch(()=>{});
}

/* ================= PIN record missing (fix branch, 1.1.83) =================
 * What the iPad had: the key copy is on the device but the lock PIN record is gone.
 * Delete ONLY the lock PIN record, restart FIDUNIO. Expected: password + PIN (never
 * PIN-only, never open without a PIN); a wrong PIN stays locked; the right password +
 * PIN opens and saves the same PIN back. Android only: the iPhone simulator loses its
 * key copy on every restart, so it cannot show this case. */
if(label==='fix'&&android){
  const dropPinRecord=()=>js(`new Promise(ok=>{const r=indexedDB.open("fidunio-local");r.onsuccess=()=>{const t=r.result.transaction("meta","readwrite");t.objectStore("meta").delete("local-security-v1");t.oncomplete=()=>ok(true);t.onerror=()=>ok(false);};r.onerror=()=>ok(false);})`);
  const hasPinRecord=()=>js(`new Promise(ok=>{const r=indexedDB.open("fidunio-local");r.onsuccess=()=>{const g=r.result.transaction("meta","readonly").objectStore("meta").get("local-security-v1");g.onsuccess=()=>ok(!!(g.result&&g.result.pin&&g.result.pin.hash));g.onerror=()=>ok(false);};r.onerror=()=>ok(false);})`);
  const restart=async()=>{adb('shell','am','force-stop',APP);await sleep(2500);d.launch(APP);await sleep(6000);};
  const fillPin=async pin=>{for(let i=0;i<6;i++)await d.fill(`#sessionPinHost .pin-code-slot:nth-child(${i+1})`,pin[i]);await sleep(4000);
    /* The sixth digit normally sends it by itself; press Unlock only if nothing happened (never a second send). */
    const idle=await js('(()=>{const b=document.querySelector("#sessionUnlockBtn");const n=document.querySelector("#sessionNote");return !!b&&!b.disabled&&!(n&&n.innerText.trim())})()').catch(()=>false);
    if(idle){log('PIN did not send by itself: pressing Unlock');await d.press('#sessionUnlockBtn').catch(()=>{});}};
  await check('PIN-MISSING-ASKS','Delete only the lock PIN record, restart FIDUNIO','password + PIN screen ("PIN record is missing"); no PIN-only screen; FIDUNIO not open',async()=>{
    const before=await hasPinRecord();const dropped=await dropPinRecord();await restart();
    await until(()=>present('#sessionPinHost'),'unlock screen',60000).catch(()=>{});
    const t=await js('document.body.innerText');const pw=await present('#sessionPassword');const open=await present('#newBtn')||await present('#tabletNewBtn');const s=await shot('pin-missing');
    return{ok:before&&dropped&&pw&&/PIN record is missing/.test(t)&&!open,observed:`record before: ${before}; deleted: ${dropped}; password box: ${pw}; FIDUNIO open: ${open}; screen: "${t.replace(/\s+/g,' ').slice(0,120)}"`,shots:[s]};
  });
  await check('PIN-MISSING-WRONG','Type the password and a WRONG PIN','stays locked, "Nothing was changed"',async()=>{
    /* The sixth digit sends it by itself, as for a person: no extra Unlock press (that sent an empty PIN). */
    await d.fill('#sessionPassword',fixture.alice.password);const wrong=fixture.alice.pin==='000000'?'111111':'000000';await fillPin(wrong);
    await sleep(9000);
    const t=await js('document.querySelector("#sessionNote")?.innerText||""');const open=await present('#newBtn')||await present('#tabletNewBtn');const rec=await hasPinRecord();const s=await shot('pin-wrong');
    return{ok:!open&&!rec&&/Nothing was changed|different|Could not/.test(t),observed:`FIDUNIO open: ${open}; PIN record written: ${rec}; message: "${t}"`,shots:[s]};
  });
  await check('PIN-MISSING-RIGHT','Type the password and the right PIN','FIDUNIO opens; the same PIN is saved back; after a restart the normal PIN screen unlocks with it',async()=>{
    await d.fill('#sessionPassword',fixture.alice.password);await fillPin(fixture.alice.pin);
    await until(async()=>await present('#newBtn')||await present('#tabletNewBtn'),'FIDUNIO open',60000).catch(()=>{});
    const open=await present('#newBtn')||await present('#tabletNewBtn');const rec=await hasPinRecord();const s1=await shot('pin-restored');
    await restart();await until(()=>present('#sessionPinHost'),'normal PIN screen',60000).catch(()=>{});
    const pinOnly=!(await present('#sessionPassword'));await fillPin(fixture.alice.pin);
    await until(async()=>await present('#newBtn')||await present('#tabletNewBtn'),'FIDUNIO open again',60000).catch(()=>{});
    const again=await present('#newBtn')||await present('#tabletNewBtn');const s2=await shot('pin-normal-again');
    return{ok:open&&rec&&pinOnly&&again,observed:`opened: ${open}; PIN record saved back: ${rec}; next start PIN-only: ${pinOnly}; same PIN unlocks: ${again}`,shots:[s1,s2]};
  });
}

/* Android: keep the app's own HELP / Firebase messages as evidence (no keys or message text are logged). */
if(android){try{const l=adb('logcat','-d','-v','time','Capacitor/Console:*','*:S');fs.writeFileSync(path.join(out,'app-console.txt'),l.split('\n').filter(x=>/HELP|helpSettings|permission|listener|start-up/i.test(x)).join('\n'));}catch(e){log('logcat: '+e.message);}}
const lines=[`# FIDUNIO input probe — ${platform} — ${label}`,'','| Check | What | Expected | Observed | |','|---|---|---|---|---|'];
for(const r of results)lines.push(`| ${r.id} | ${r.what} | ${r.expected} | ${String(r.observed).replace(/\|/g,'/')} | ${r.ok?'as expected':'**DIFFERENT**'} |`);
lines.push('');for(const r of results)for(const s of r.shots||[])lines.push(`### ${r.id} — ${s}`,'',`![${s}](${s})`,'');
fs.writeFileSync(path.join(out,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({platform,label,results},null,2));
log('\nRESULT: probe finished');
process.exit(0);
