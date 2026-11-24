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
  const r=await js(`(()=>{const q=${JSON.stringify(selectorOrText)};let el=q.startsWith('#')||q.startsWith('.')?document.querySelector(q):[...document.querySelectorAll('#chatArea .msg-text')].reverse().find(e=>e.textContent.includes(q));if(!el)return null;el.scrollIntoView({block:'center'});const b=el.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,dpr:devicePixelRatio,vh:innerHeight}})()`);
  if(!r)return null;
  if(android){const wv=d.nodes().filter(n=>/WebView/.test(n.cls)).sort((a,b)=>b.h-a.h)[0];const top=wv?wv.y-Math.floor(wv.h/2):0;return{x:Math.round(r.x*r.dpr),y:Math.round(top+r.y*r.dpr)};}
  return{x:Math.round(r.x),y:Math.round(r.y)};
}
async function longPressAt(p,ms=1300){if(android)adb('shell','input','swipe',String(p.x),String(p.y),String(p.x),String(p.y),String(ms));else idb('ui','tap',String(p.x),String(p.y),'--duration',String(ms/1000));await sleep(1600);}
async function tapAt(p){if(android)adb('shell','input','tap',String(p.x),String(p.y));else idb('ui','tap',String(p.x),String(p.y));await sleep(1200);}
const openChat=async()=>{if(await present('#messageBox'))return;await js('(()=>{const r=[...document.querySelectorAll(".conversation-open,.group-list-row")][0];r&&r.click();return !!r})()');await until(()=>present('#messageBox'),'chat reopened',20000);};
/* ---- sign in and open a direct chat with Simulator Bob ---- */
log(`FIDUNIO input probe — ${platform} — ${label}`);
d.reinstall(APP,artifact);d.launch(APP);
await d.waitApp(/Terms of Use/,90000);
await d.press('#startupTermsTick');await d.press('#startupTermsAccept');
await until(()=>present('#joinTab'),'Join tab');await d.press('#joinTab');
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
  await openChat();const p=await screenPoint('Copy test 4417');if(!p)throw new Error('message bubble not on screen');await longPressAt(p);
  const s=await shot('copy-sheet');
  const sheet=await js('document.querySelector("#pendingMessageTitle")?"open":"closed"');
  const hasCopy=await present('#modalCopy');
  if(!hasCopy){await d.press('#modalCancel').catch(()=>{});return{ok:false,observed:`action sheet ${sheet}; NO Copy button`,shots:[s]};}
  {const b=await screenPoint('#modalCopy');if(b)await tapAt(b);else await d.press('#modalCopy');}
  await sleep(2000);
  let clip='';
  if(!android)clip=run('xcrun',['simctl','pbpaste',UDID]);
  else{await d.fill('#messageBox','');const bp=await screenPoint('#messageBox');await tapAt(bp);adb('shell','input','keyevent','279');await sleep(1500);clip=await js('document.querySelector("#messageBox")?.value||""');await d.fill('#messageBox','');}
  return{ok:/Copy test 4417/.test(clip),observed:`Copy button present; clipboard now: "${clip.slice(0,60)}"`,shots:[s]};
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
    await tapAt(bp);await sleep(600);await longPressAt(bp,1000);await shot('paste-menu');
    const p=iosFind(e=>/^Paste$/.test(iosLabel(e)));menu=p?'Paste offered':'NO Paste offered';if(p)await iosTap(p);
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
await check('CAMERA','Photo → Take a Picture','the camera opens',async()=>{
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

const lines=[`# FIDUNIO input probe — ${platform} — ${label}`,'','| Check | What | Expected | Observed | |','|---|---|---|---|---|'];
for(const r of results)lines.push(`| ${r.id} | ${r.what} | ${r.expected} | ${String(r.observed).replace(/\|/g,'/')} | ${r.ok?'as expected':'**DIFFERENT**'} |`);
lines.push('');for(const r of results)for(const s of r.shots||[])lines.push(`### ${r.id} — ${s}`,'',`![${s}](${s})`,'');
fs.writeFileSync(path.join(out,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({platform,label,results},null,2));
log('\nRESULT: probe finished');
process.exit(0);
