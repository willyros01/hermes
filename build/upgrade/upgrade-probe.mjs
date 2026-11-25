/* iPad PIN after update (Willy, 24 Nov 2026): the released FIDUNIO is installed
 * and signed in with a PIN, then the new version is installed OVER it (as a
 * TestFlight update does, data kept), and the same PIN is typed with the
 * on-screen keyboard. Local demo Firebase only.
 *   usage: node build/upgrade/upgrade-probe.mjs OUT OLD_APP NEW_APP */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const [outArg,oldApp,newApp]=process.argv.slice(2);
const out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(path.join(out,'native-fixture.json'),'utf8'));
if(fixture.project!=='demo-fidunio-simulator-tests')throw new Error('Refusing non-demo project');
const d=await import('../simulator/sim.mjs');
const APP='io.github.willyros01.fidunio',UDID=process.env.UDID,sleep=d.sleep;
const run=(c,a)=>execFileSync(c,a,{encoding:'utf8',maxBuffer:64<<20}).trim();
const idb=(...a)=>run('idb',[...a,'--udid',UDID]);
const js=s=>d.js(s),present=s=>js(`!!document.querySelector(${JSON.stringify(s)})`);
let n=0;const log=s=>{console.log(s);fs.appendFileSync(path.join(out,'probe.txt'),s+'\n');};
const shot=async name=>{await sleep(700);const f=String(++n).padStart(2,'0')+'-'+name+'.png';try{d.shot(path.join(out,f));}catch{}return f;};
async function until(fn,what,ms=60000){const end=Date.now()+ms;let last='';while(Date.now()<end){try{if(await fn())return;}catch(e){last=e.message;}await sleep(1000);}throw new Error('timed out: '+what+(last?' — '+last:''));}
const version=()=>js('globalThis.FIDUNIO_RELEASE?.version||"?"');
async function point(sel){const r=await js(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});const b=e.getBoundingClientRect();const v=window.visualViewport||{offsetLeft:0,offsetTop:0};return{x:Math.round(b.left+b.width/2-v.offsetLeft),y:Math.round(b.top+b.height/2-v.offsetTop)}})()`);return r;}
async function tap(sel){await sleep(500);const p=await point(sel);if(!p)throw new Error(sel+' not on screen');idb('ui','tap',String(p.x),String(p.y));await sleep(1200);}
/* Type the PIN like a person: tap the first box, then the on-screen keyboard. */
async function typePin(boxes,pin){await tap(boxes+' .pin-code-slot');idb('ui','text',pin);await sleep(1500);return js(`[...document.querySelectorAll(${JSON.stringify(boxes+' .pin-code-slot')})].map(x=>x.value).join("")`);}
const results=[];const check=(id,ok,observed)=>{results.push({id,ok,observed});log(`${ok?'AS EXPECTED':'DIFFERENT'} ${id} — observed: ${observed}`);};

log('FIDUNIO iPad update + PIN probe — device: '+run('xcrun',['simctl','list','devices','booted']).split('\n').find(l=>/Booted/.test(l))?.trim());
/* 1. Released version, signed in with a PIN (as on Willy's iPad). */
d.reinstall(APP,oldApp);d.launch(APP);
await d.waitApp(/Terms of Use/,120000);
await d.press('#startupTermsTick');await d.press('#startupTermsAccept');
await until(()=>present('#joinTab'),'Join tab');await d.press('#joinTab');
await until(()=>present('#joinPinHost'),'Join form');
await js(`(() => {window.__probeRead={state:"pending"};import("./firebase.js").then(m=>m.validateInvitation(${JSON.stringify(fixture.inviteToken)})).then(()=>{window.__probeRead={state:"success"}},e=>{window.__probeRead={state:"failed",error:String(e?.code||e?.message||e)}});return true})()`);
await sleep(12000);
await d.fill('#inviteCode',fixture.inviteToken);await d.fill('#joinName',fixture.alice.name);
await d.fill('#joinEmail',fixture.alice.email);await d.fill('#joinPassword',fixture.alice.password);
for(let i=0;i<6;i++)await d.fill(`#joinPinHost .pin-code-slot:nth-child(${i+1})`,fixture.alice.pin[i]);
await d.press('#redeemBtn');
await until(async()=>await present('#newBtn')||await present('#tabletNewBtn'),'Messages screen',150000);
const oldV=await version();log('released version signed in: '+oldV);await shot('old-signed-in');

/* 2. Close it, install the new version over it (data kept), open it. */
d.terminate(APP);await sleep(2000);d.disconnect();
run('xcrun',['simctl','install',UDID,newApp]);log('new version installed over the old one (no uninstall)');
d.launch(APP);await sleep(6000);
await until(async()=>/Unlock FIDUNIO/.test(await d.appText()),'unlock screen',90000).catch(()=>{});
const newV=await version();const s1=await shot('after-update');
const unlockShown=await present('#localUnlockPin');
check('UPDATE-OPENS-LOCKED',unlockShown&&newV!==oldV,`version ${oldV} → ${newV}; unlock screen with PIN boxes: ${unlockShown}`);

/* 3. Wrong PIN first: must be refused. */
if(unlockShown){
  let typed=await typePin('#localUnlockPin','111111');
  await sleep(1500);if(!(await present('#localUnlockNote:not([hidden])')))await tap('#localPinUnlockBtn');
  await until(async()=>/Incorrect|did not/i.test(await js('document.querySelector("#localUnlockNote")?.textContent||""')),'wrong PIN answer',30000).catch(()=>{});
  const note=await js('document.querySelector("#localUnlockNote")?.textContent||""');await shot('wrong-pin');
  check('WRONG-PIN-REFUSED',/Incorrect/i.test(note),`typed "${typed}"; message: "${note}"`);
  /* 4. The same PIN used when signing in: must open FIDUNIO. */
  typed=await typePin('#localUnlockPin',fixture.alice.pin);
  await sleep(1500);if(await present('#localPinUnlockBtn')&&!(await present('#newBtn'))&&!(await present('#tabletNewBtn')))await tap('#localPinUnlockBtn').catch(()=>{});
  await until(async()=>await present('#newBtn')||await present('#tabletNewBtn'),'Messages after PIN',60000).catch(()=>{});
  const opened=await present('#newBtn')||await present('#tabletNewBtn');
  const note2=await js('document.querySelector("#localUnlockNote")?.textContent||""');await shot('right-pin');
  check('SAME-PIN-OPENS',opened,`typed "${typed}" (the sign-in PIN); ${opened?'Messages shown':'still locked, message: "'+note2+'"'}`);
  /* 5. The HELP "Protect" PIN box on the iPad accepts the same PIN. */
  if(opened){
    await d.press((await present('#settingsBtn'))?'#settingsBtn':'#tabletSettingsBtn');
    await sleep(2500);await js('(()=>{const b=[...document.querySelectorAll(".fidunio-settings-nav-btn")].find(x=>x.dataset.group==="safety");b&&b.click();return true})()');
    await until(()=>present('#helpProtected'),'HELP card',30000);
    await js('(()=>{const b=document.querySelector("#helpProtected");if(!b.checked)b.click();return true})()');
    await tap('#helpSave');
    const asked=await until(()=>present('#helpPinHost .pin-code-slot'),'HELP PIN box',15000).then(()=>true,()=>false);
    if(asked){typed=await typePin('#helpPinHost',fixture.alice.pin);await sleep(4000);}
    const msg=await js('document.querySelector("#helpSettingsMsg")?.textContent||""');const err=await present('#helpPinError:not([hidden])');await shot('help-pin');
    check('HELP-PIN-SAME',asked&&!err&&!(await present('#helpPinHost')),`PIN box shown: ${asked}; typed "${typed}"; ${err?'"Wrong PIN" shown':'accepted'}; settings note: "${msg}"`);
  }
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results},null,2));
log('RESULT: probe finished');process.exit(0);
