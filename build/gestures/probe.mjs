/* INVESTIGATION ONLY (Willy, 24 Nov 2026): how FIDUNIO reacts to the Pixel's own
 * swipe gestures. No app code is changed. Disposable debug app, LOCAL demo
 * Firebase emulators only. Every gesture is first tried on Android's own Settings
 * app (the control), so a failure can be told apart from a test-method problem.
 * Gestures are real finger swipes injected into the touch screen:
 *   BACK   = swipe in from the left or right edge
 *   SWITCH = swipe sideways along the bottom handle (previous / next app) */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const out=path.resolve(process.argv[2]),apk=process.argv[3];
const fixture=JSON.parse(fs.readFileSync(path.join(out,'native-fixture.json'),'utf8'));
if(fixture.project!=='demo-fidunio-simulator-tests')throw new Error('Refusing non-demo project');
const d=await import('../simulator/adb.mjs');
const APP='io.github.willyros01.fidunio',SETTINGS='com.android.settings';
d.use(APP);
const sh=(...a)=>execFileSync('adb',a,{encoding:'utf8'}).trim();
const sleep=d.sleep;
const results=[];let n=0;
const log=(s)=>{console.log(s);fs.appendFileSync(path.join(out,'gestures.txt'),s+'\n');};
const shot=async(label)=>{await sleep(800);const f=String(++n).padStart(2,'0')+'-'+label+'.png';d.shot(path.join(out,f));return f;};
const front=()=>d.front();
const pkgOf=(a)=>String(a).split('/')[0];
const {w,h}=d.screenSize();
const backSwipe=(side='left')=>{const y=Math.round(h*0.5);if(side==='left')sh('shell','input','touchscreen','swipe','1',String(y),String(Math.round(w*0.45)),String(y),'250');else sh('shell','input','touchscreen','swipe',String(w-2),String(y),String(Math.round(w*0.55)),String(y),'250');};
const handleY=h-12;
const switchSwipe=(dir='right')=>{const a=Math.round(w*0.2),b=Math.round(w*0.8);if(dir==='right')sh('shell','input','touchscreen','swipe',String(a),String(handleY),String(b),String(handleY),'220');else sh('shell','input','touchscreen','swipe',String(b),String(handleY),String(a),String(handleY),'220');};
async function appScreen(){try{return String(await d.appText()).replace(/\s+/g,' ').slice(0,160);}catch(e){return 'unreadable: '+e.message.slice(0,80);}}
async function record(id,what,expected,fn){
  log(`\n${id}: ${what}`);
  try{
    const r=await fn();
    const ok=r.ok;
    results.push({id,what,expected,observed:r.observed,ok,shots:r.shots||[]});
    log(`${ok?'AS EXPECTED':'DIFFERENT'} ${id} — expected: ${expected}; observed: ${r.observed}`);
  }catch(e){results.push({id,what,expected,observed:'TEST ERROR: '+String(e.message).slice(0,300),ok:false,shots:[]});log('TEST ERROR '+id+': '+e.message);}
}

/* 0. Phone set-up: gesture navigation like a Pixel. */
log('Navigation mode before: '+sh('shell','settings','get','secure','navigation_mode'));
try{sh('shell','cmd','overlay','enable-exclusive','--category','com.android.internal.systemui.navbar.gestural');}catch(e){log('overlay: '+e.message);}
await sleep(4000);
const navMode=sh('shell','settings','get','secure','navigation_mode');
log('Navigation mode now: '+navMode+' (2 = gesture navigation)');
log('Screen: '+w+'x'+h+'; Android '+sh('shell','getprop','ro.build.version.release'));

/* 1. Control: Android Settings. */
await record('C1','Settings app: BACK swipe from a sub-page','returns to the main Settings page, Settings stays in front',async()=>{
  sh('shell','am','start','-W','-n',SETTINGS+'/.Settings');await sleep(2500);
  sh('shell','am','start','-W','-a','android.settings.DISPLAY_SETTINGS');await sleep(2500);
  const before=front();const s1=await shot('settings-display-page');
  backSwipe('left');await sleep(2500);
  const after=front();const s2=await shot('settings-after-back');
  return {ok:pkgOf(after)===SETTINGS&&after!==before,observed:`before ${before}; after ${after}`,shots:[s1,s2]};
});

/* 2. Install, open and sign in to FIDUNIO (Settings left behind as the previous app). */
d.reinstall(APP,apk);d.launch(APP);
await d.waitApp(/Terms of Use/,65000);
await d.press('#startupTermsTick');await d.press('#startupTermsAccept');
for(let i=0;i<40&&!await d.js('!!document.querySelector("#joinTab")');i++)await sleep(1000);
await d.press('#joinTab');
for(let i=0;i<30&&!await d.js('!!document.querySelector("#joinPinHost")');i++)await sleep(1000);
await d.fill('#inviteCode',fixture.inviteToken);await d.fill('#joinName',fixture.alice.name);
await d.fill('#joinEmail',fixture.alice.email);await d.fill('#joinPassword',fixture.alice.password);
for(let i=0;i<6;i++)await d.fill(`#joinPinHost .pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);
await d.press('#redeemBtn');
for(let i=0;i<90&&!(await d.js('!!document.querySelector("#newBtn")||!!document.querySelector("#tabletNewBtn")'));i++)await sleep(1000);
log('Signed in; FIDUNIO shows: '+await appScreen());
await shot('fidunio-messages');
const toSettingsScreen=async()=>{const b=await d.js('document.querySelector("#settingsBtn")?"#settingsBtn":"#tabletSettingsBtn"');await d.press(b);for(let i=0;i<20&&!await d.js('!!document.querySelector("#fidunioSettingsShell")');i++)await sleep(1000);};
const onMessages=()=>d.js('!!document.querySelector("#newBtn")||!!document.querySelector("#tabletNewBtn")');
const onSettings=()=>d.js('!!document.querySelector("#fidunioSettingsShell")');
const locked=async()=>/PIN|Unlock|Face/i.test(await appScreen())&&!await onMessages()&&!await onSettings();
async function unlock(){if(!await locked())return;const slots=await d.js('document.querySelectorAll(".pin-code-slot").length');if(slots===6){for(let i=0;i<6;i++)await d.fill(`.pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);await d.js('(()=>{const b=[...document.querySelectorAll("button")].find(x=>/unlock/i.test(x.textContent));b&&b.click();return !!b})()');await sleep(3000);}}

/* 3. FIDUNIO: BACK swipe from an inner screen (Settings inside FIDUNIO). */
await record('F1','FIDUNIO: BACK swipe from its Settings screen (left edge)','goes back to the Messages screen inside FIDUNIO; FIDUNIO stays in front',async()=>{
  await toSettingsScreen();const s1=await shot('fidunio-settings-screen');
  backSwipe('left');await sleep(3000);
  const f=front();const s2=await shot('fidunio-after-back-left');
  const inApp=pkgOf(f)===APP;const msg=inApp&&await onMessages();
  return {ok:inApp&&msg,observed:inApp?(msg?'went back to Messages':'stayed in FIDUNIO, screen: '+await appScreen()):'FIDUNIO left the screen; in front now: '+f,shots:[s1,s2]};
});
await record('F1b','Return to FIDUNIO after F1','FIDUNIO comes back (shows whether it locked)',async()=>{
  d.launch(APP);await sleep(3500);const s=await shot('fidunio-returned');const lk=await locked();
  const t=await appScreen();await unlock();
  return {ok:true,observed:(lk?'LOCKED — PIN screen shown: ':'not locked: ')+t,shots:[s]};
});
await record('F2','FIDUNIO: BACK swipe from its Settings screen (right edge)','goes back to the Messages screen inside FIDUNIO',async()=>{
  if(pkgOf(front())!==APP){d.launch(APP);await sleep(3000);await unlock();}
  await toSettingsScreen();backSwipe('right');await sleep(3000);
  const f=front();const s=await shot('fidunio-after-back-right');const inApp=pkgOf(f)===APP;const msg=inApp&&await onMessages();
  return {ok:inApp&&msg,observed:inApp?(msg?'went back to Messages':'stayed, screen: '+await appScreen()):'FIDUNIO left the screen; in front now: '+f,shots:[s]};
});
await record('F3','FIDUNIO: BACK swipe on the main Messages screen','FIDUNIO goes to the background (like other apps), not shut down',async()=>{
  if(pkgOf(front())!==APP){d.launch(APP);await sleep(3000);await unlock();}
  const pidBefore=sh('shell','pidof',APP);backSwipe('left');await sleep(3000);
  const f=front();const pidAfter=(()=>{try{return sh('shell','pidof',APP);}catch{return '';}})();const s=await shot('fidunio-main-after-back');
  return {ok:pkgOf(f)!==APP&&!!pidAfter,observed:`in front: ${f}; FIDUNIO process ${pidAfter?(pidAfter===pidBefore?'still running':'restarted'):'ENDED'}`,shots:[s]};
});

/* 4. App switching along the bottom handle. Previous app = Settings. */
await record('C2','Control: SWITCH swipe along bottom handle from Settings','switches to the previous app',async()=>{
  d.launch(APP);await sleep(3000);await unlock();
  sh('shell','am','start','-W','-n',SETTINGS+'/.Settings');await sleep(2500);
  const before=front();switchSwipe('right');await sleep(3000);const after=front();const s=await shot('settings-after-switch');
  return {ok:pkgOf(after)!==pkgOf(before),observed:`before ${before}; after ${after}`,shots:[s]};
});
await record('F4','FIDUNIO: SWITCH swipe along bottom handle (to previous app)','the previous app (Settings) comes to the front',async()=>{
  if(pkgOf(front())!==APP){d.launch(APP);await sleep(3000);await unlock();}
  const before=front();const s1=await shot('fidunio-before-switch');switchSwipe('right');await sleep(3000);
  const after=front();const s2=await shot('fidunio-after-switch');
  return {ok:pkgOf(after)!==APP,observed:`before ${before}; after ${after}`,shots:[s1,s2]};
});
await record('F5','FIDUNIO: SWITCH swipe the other way (back to FIDUNIO)','FIDUNIO comes back to the front',async()=>{
  switchSwipe('left');await sleep(3500);const f=front();const s=await shot('fidunio-switched-back');const lk=pkgOf(f)===APP&&await locked();
  return {ok:pkgOf(f)===APP,observed:`in front: ${f}${pkgOf(f)===APP?(lk?' — LOCKED, PIN screen shown':' — not locked'):''}`,shots:[s]};
});
await record('F6','FIDUNIO: swipe UP from bottom handle (Home)','goes to the home screen',async()=>{
  if(pkgOf(front())!==APP){d.launch(APP);await sleep(3000);await unlock();}
  sh('shell','input','touchscreen','swipe',String(w>>1),String(handleY),String(w>>1),String(Math.round(h*0.45)),'200');await sleep(3000);
  const f=front();const s=await shot('fidunio-after-home');
  return {ok:pkgOf(f)!==APP,observed:'in front: '+f,shots:[s]};
});
await record('F7','FIDUNIO: Android Back key (3-button navigation equivalent)','goes back to Messages from FIDUNIO Settings',async()=>{
  d.launch(APP);await sleep(3000);await unlock();await toSettingsScreen();
  sh('shell','input','keyevent','4');await sleep(3000);const f=front();const s=await shot('fidunio-after-back-key');
  const inApp=pkgOf(f)===APP;return {ok:inApp&&await onMessages(),observed:inApp?'stayed in FIDUNIO, screen: '+await appScreen():'FIDUNIO left the screen; in front: '+f,shots:[s]};
});

const lines=['# FIDUNIO on a Pixel: native swipe gestures (investigation only)','',`Navigation mode: ${navMode==='2'?'gesture navigation (Pixel default)':'mode '+navMode}. Screen ${w}x${h}.`,'',
  '| Test | What | Expected | Observed | |','|---|---|---|---|---|'];
for(const r of results)lines.push(`| ${r.id} | ${r.what} | ${r.expected} | ${r.observed.replace(/\|/g,'/')} | ${r.ok?'as expected':'**DIFFERENT**'} |`);
lines.push('');for(const r of results)for(const s of r.shots)lines.push(`### ${r.id} — ${s}`,'',`![${s}](${s})`,'');
fs.writeFileSync(path.join(out,'REPORT.md'),lines.join('\n'));
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({navMode,results},null,2));
log('\nRESULT: gesture investigation finished');
process.exit(0);
